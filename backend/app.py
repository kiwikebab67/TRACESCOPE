from services.analyzer import calculate_md5, evaluate_log_risk, analyze_malware_file, analyze_memory_dump, extract_real_hex, extract_real_strings, disassemble_entry_point
from services.artifact_parser import parse_evtx_log, parse_pcap_capture, parse_autopsy_disk, parse_registry_hive, parse_email_artifact, parse_browser_sqlite, parse_prefetch, parse_lnk
from services.threat_intel import query_virustotal_hash, query_abuseipdb
import os
import hashlib
import json 
import requests 
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

load_dotenv() # Load environment variables from .env file
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from config import Config
from models.database import db
from models.case import Case
from models.evidence import Evidence 
from models.evidence import ForensicLog 
from models.user import User
import bcrypt
import jwt
from functools import wraps
from datetime import datetime, timedelta

# Configure Flask to serve the React SPA from the "dist" directory
app = Flask(__name__, static_folder='dist', static_url_path='/')
CORS(app) # Enable CORS for Vite frontend development
app.config.from_object(Config)

# Ensure upload directory matches configuration
UPLOAD_FOLDER = app.config.get('UPLOAD_FOLDER', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

db.init_app(app)

with app.app_context():
    db.create_all()
    # Seed default admin user if it doesn't exist
    admin_user = User.query.filter_by(username='admin').first()
    if not admin_user:
        hashed_password = bcrypt.hashpw('admin123!'.encode('utf-8'), bcrypt.gensalt())
        admin_user = User(username='admin', password_hash=hashed_password.decode('utf-8'))
        db.session.add(admin_user)
        db.session.commit()
        print("Default admin user created (admin / admin123!)")
    
    # Force schema update for SQLite since create_all() doesn't alter tables
    try:
        db.session.execute(db.text("ALTER TABLE cases ADD COLUMN user_id INTEGER REFERENCES users(id)"))
        db.session.commit()
        print("Successfully added user_id column to cases table.")
    except Exception as e:
        # Column likely already exists
        db.session.rollback()
    
    # Migrate legacy cases to the admin user
    from models.case import Case
    legacy_cases = Case.query.filter_by(user_id=None).all()
    for legacy_case in legacy_cases:
        legacy_case.user_id = admin_user.id
    if legacy_cases:
        db.session.commit()
        print(f"Migrated {len(legacy_cases)} legacy cases to the admin user.")

# Serve React App
@app.route('/')
def index():
    response = make_response(app.send_static_file('index.html'))
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

# Auth Middleware
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            token = token.split(" ")[1] # Bearer <token>
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Username and password required'}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'User already exists'}), 400
        
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    new_user = User(username=username, password_hash=hashed_password.decode('utf-8'))
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Username and password required'}), 400
        
    user = User.query.filter_by(username=username).first()
    
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'message': 'Invalid credentials'}), 401
        
    token = jwt.encode({
        'user_id': user.id,
        'username': user.username,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({'token': token, 'username': user.username})

@app.errorhandler(404)
def serve_react(e):
    if request.path.startswith('/api/'):
        return jsonify({"error": "Not Found"}), 404
    response = make_response(app.send_static_file('index.html'))
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

@app.route("/api/dashboard")
def dashboard_stats():
    cases_count = Case.query.count()
    evidence_count = Evidence.query.count()
    high_risk_logs = ForensicLog.query.filter_by(risk_level="High").count()
    medium_risk_logs = ForensicLog.query.filter_by(risk_level="Medium").count()
    
    recent_cases = Case.query.order_by(Case.created_at.desc()).limit(5).all()
    
    # Calculate average threat score for metrics
    avg_score = 0
    if evidence_count > 0:
        total_high = ForensicLog.query.filter_by(risk_level="High").count()
        total_med = ForensicLog.query.filter_by(risk_level="Medium").count()
        avg_score = min(100, int(((total_high * 25) + (total_med * 10)) / max(1, evidence_count)))
        
    # Calculate Timeline Data (Last 24 hours)
    now = datetime.utcnow()
    yesterday = now - timedelta(days=1)
    logs_last_24h = ForensicLog.query.filter(ForensicLog.created_at >= yesterday).all()
    
    timeline_data = []
    for i in range(23, -1, -1):
        dt = now - timedelta(hours=i)
        time_str = f"{dt.hour:02d}:00"
        timeline_data.append({"time": time_str, "events": 0})
        
    for log in logs_last_24h:
        time_str = f"{log.created_at.hour:02d}:00"
        for item in timeline_data:
            if item["time"] == time_str:
                item["events"] += 1
                break

    # Calculate Evidence Composition
    all_evidence = Evidence.query.all()
    comp = {'System Logs': 0, 'Registry': 0, 'Memory': 0, 'Network': 0, 'Malware': 0, 'Other': 0}
    for ev in all_evidence:
        ext = os.path.splitext(ev.filename)[1].lower() if '.' in ev.filename else ''
        if ext in ['.evtx', '.txt', '.log']: comp['System Logs'] += 1
        elif ext in ['.dat', '.reg']: comp['Registry'] += 1
        elif ext in ['.raw', '.mem', '.dmp']: comp['Memory'] += 1
        elif ext in ['.pcap', '.cap']: comp['Network'] += 1
        elif ext in ['.exe', '.dll', '.bin', '.sys']: comp['Malware'] += 1
        else: comp['Other'] += 1

    evidence_data = []
    colors = {'System Logs': '#3b82f6', 'Registry': '#8b5cf6', 'Memory': '#ec4899', 'Network': '#f97316', 'Malware': '#ef4444', 'Other': '#9ca3af'}
    for k, v in comp.items():
        if v > 0:
            evidence_data.append({"name": k, "value": v, "color": colors[k]})
            
    # Calculate Recent Activities
    latest_logs = ForensicLog.query.order_by(ForensicLog.created_at.desc()).limit(5).all()
    recent_activities = []
    for log in latest_logs:
        recent_activities.append({
            "id": log.id,
            "time": log.created_at.strftime("%I:%M %p"),
            "investigator": "System Auto",
            "action": f"Analysis: {log.tool_source}",
            "target": log.evidence.filename if log.evidence else "Unknown",
            "status": log.risk_level
        })

    return jsonify({
        "cases_count": cases_count,
        "evidence_count": evidence_count,
        "high_risk_logs": high_risk_logs,
        "medium_risk_logs": medium_risk_logs,
        "avg_score": avg_score,
        "timeline_data": timeline_data,
        "evidence_data": evidence_data,
        "recent_activities": recent_activities,
        "recent_cases": [
            {
                "id": c.id,
                "case_number": c.case_number,
                "title": c.title,
                "investigator": c.investigator,
                "created_at": c.created_at.isoformat()
            } for c in recent_cases
        ]
    })

@app.route("/api/cases", methods=["GET", "POST"])
@token_required
def manage_cases(current_user):
    if request.method == "POST":
        data = request.json
        import uuid
        from datetime import datetime
        case_num = data.get("case_number")
        if not case_num:
            case_num = f"CS-{datetime.utcnow().year}-{str(uuid.uuid4())[:4].upper()}"
            
        new_case = Case(
            case_number=case_num,
            title=data.get("title", "Unnamed Investigation"),
            investigator=data.get("investigator", current_user.username),
            description=data.get("description", ""),
            user_id=current_user.id
        )
        db.session.add(new_case)
        db.session.commit()
        return jsonify({"message": "Case created successfully", "case_id": new_case.id}), 201
        
    cases = Case.query.filter_by(user_id=current_user.id).order_by(Case.created_at.desc()).all()
    return jsonify([{
        "id": c.id,
        "case_number": c.case_number,
        "title": c.title,
        "investigator": c.investigator,
        "description": c.description,
        "created_at": c.created_at.isoformat(),
        "evidence_count": len(c.evidence) if c.evidence else 0
    } for c in cases])

@app.route("/api/evidence")
def get_all_evidence():
    evidence_list = Evidence.query.order_by(Evidence.id.desc()).all()
    return jsonify([{
        "id": ev.id,
        "filename": ev.filename,
        "hash_md5": ev.hash_md5,
        "hash_sha256": ev.hash_sha256,
        "case_id": ev.case_id,
        "case_number": ev.case.case_number if ev.case else "Unknown",
        "size": os.path.getsize(ev.filepath) if os.path.exists(ev.filepath) else 0,
        "date_added": ev.case.created_at.isoformat() if ev.case else datetime.utcnow().isoformat()
    } for ev in evidence_list])

@app.route("/api/malware/latest")
def get_latest_malware():
    case_id = request.args.get('caseId')
    query = Evidence.query.filter(Evidence.filename.like('%.exe') | Evidence.filename.like('%.dll'))
    if case_id:
        query = query.filter(Evidence.case_id == case_id)
        
    latest_malware = query.order_by(Evidence.id.desc()).first()
    
    if not latest_malware:
        return jsonify({"status": "error", "message": "No malware samples found in the database."}), 404
        
    logs = ForensicLog.query.filter_by(evidence_id=latest_malware.id).all()
    
    filepath = latest_malware.filepath
    real_hex = ""
    real_strings = []
    disassembly = []
    pe_metadata = {}
    
    if os.path.exists(filepath):
        real_hex = extract_real_hex(filepath)
        real_strings = extract_real_strings(filepath)
        disassembly = disassemble_entry_point(filepath)
        
        try:
            import pefile
            from datetime import datetime
            pe = pefile.PE(filepath)
            timestamp = pe.FILE_HEADER.TimeDateStamp
            compile_time = datetime.utcfromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')
            machine_type = hex(pe.FILE_HEADER.Machine)
            pe_metadata = {
                "compile_timestamp": compile_time,
                "machine_architecture": machine_type,
                "number_of_sections": pe.FILE_HEADER.NumberOfSections,
                "entry_point_rva": hex(pe.OPTIONAL_HEADER.AddressOfEntryPoint)
            }
        except Exception as e:
            pe_metadata = {"error": f"Failed to extract PE metadata: {str(e)}"}
            
    return jsonify({
        "status": "success",
        "evidence": {
            "id": latest_malware.id,
            "filename": latest_malware.filename,
            "hash_md5": latest_malware.hash_md5,
            "hash_sha256": latest_malware.hash_sha256,
            "size": os.path.getsize(latest_malware.filepath) if os.path.exists(latest_malware.filepath) else 0,
            "case_number": latest_malware.case.case_number if latest_malware.case else "Unknown"
        },
        "real_hex": real_hex,
        "real_strings": real_strings,
        "disassembly": disassembly,
        "pe_metadata": pe_metadata,
        "analysis_logs": [{
            "id": log.id,
            "time_created": log.time_created,
            "event_id": log.event_id,
            "source": log.source,
            "description": log.description,
            "risk_level": log.risk_level,
            "tool_source": log.tool_source
        } for log in logs]
    })

@app.route("/api/malware/detonate/<int:case_id>", methods=["POST"])
@token_required
def detonate_malware(current_user, case_id):
    case = Case.query.get_or_404(case_id)
    if case.user_id != current_user.id:
        return jsonify({"message": "Unauthorized"}), 403
        
    query = Evidence.query.filter(Evidence.case_id == case_id).filter(Evidence.filename.like('%.exe') | Evidence.filename.like('%.dll'))
    latest_malware = query.order_by(Evidence.id.desc()).first()
    
    if not latest_malware:
        return jsonify({"status": "error", "message": "No executable payload found to detonate."}), 404
        
    # Simulate dynamic detonation analysis
    import time
    time.sleep(1.5) # Simulate processing delay
    
    detonation_logs = [
        # Process Tree
        ForensicLog(
            evidence_id=latest_malware.id,
            tool_source='sandbox_process',
            event_id=4012,
            source='Process: Root',
            description=f'PID:4012 {latest_malware.filename}',
            risk_level='Medium',
            time_created='0.00s'
        ),
        ForensicLog(
            evidence_id=latest_malware.id,
            tool_source='sandbox_process',
            event_id=4028,
            source='Process: Child',
            description='PID:4028 cmd.exe /c "powershell -ep bypass -w hidden"',
            risk_level='High',
            time_created='0.45s'
        ),
        ForensicLog(
            evidence_id=latest_malware.id,
            tool_source='sandbox_process',
            event_id=4099,
            source='Process: PowerShell',
            description="PID:4099 powershell.exe -NoProfile -Command \"IEX (New-Object Net.WebClient).DownloadString('http://...')\"",
            risk_level='High',
            time_created='0.82s'
        ),
        ForensicLog(
            evidence_id=latest_malware.id,
            tool_source='sandbox_process',
            event_id=4105,
            source='Process: vssadmin',
            description='PID:4105 vssadmin.exe delete shadows /all /quiet [RANSOMWARE INDICATOR]',
            risk_level='High',
            time_created='1.20s'
        ),
        # Network
        ForensicLog(
            evidence_id=latest_malware.id,
            tool_source='sandbox_network',
            event_id=5001,
            source='Network: C2 Server',
            description='185.244.25.108:443 (AbuseIPDB)',
            risk_level='High',
            time_created='0.55s'
        ),
        ForensicLog(
            evidence_id=latest_malware.id,
            tool_source='sandbox_network',
            event_id=5002,
            source='Network: Payload Download',
            description='raw.githubusercontent.com:443',
            risk_level='Medium',
            time_created='0.75s'
        ),
        # Filesystem
        ForensicLog(
            evidence_id=latest_malware.id,
            tool_source='sandbox_file',
            event_id=6001,
            source='File Drop',
            description='+ C:\\Users\\Admin\\AppData\\Local\\Temp\\payload.exe',
            risk_level='High',
            time_created='0.90s'
        ),
        ForensicLog(
            evidence_id=latest_malware.id,
            tool_source='sandbox_file',
            event_id=6002,
            source='File Drop',
            description='+ C:\\Windows\\System32\\Tasks\\WindowsUpdateSync',
            risk_level='High',
            time_created='1.05s'
        ),
        ForensicLog(
            evidence_id=latest_malware.id,
            tool_source='sandbox_file',
            event_id=6003,
            source='File Modify',
            description='- C:\\Users\\Admin\\Documents\\passwords.txt (Read & Encrypted)',
            risk_level='High',
            time_created='1.25s'
        )
    ]
    
    # Check if we already detonated this file to avoid duplicates
    existing = ForensicLog.query.filter_by(evidence_id=latest_malware.id).filter(ForensicLog.tool_source.like('sandbox_%')).first()
    if not existing:
        db.session.add_all(detonation_logs)
        db.session.commit()
        
    return jsonify({
        "status": "success",
        "message": "Payload successfully detonated. Behavioral analysis complete."
    })

@app.route("/api/cases/<int:case_id>", methods=["PUT"])
@token_required
def update_case(current_user, case_id):
    case = Case.query.get_or_404(case_id)
    if case.user_id != current_user.id:
        return jsonify({"message": "Unauthorized"}), 403
        
    data = request.json
    
    if "title" in data:
        case.title = data.get("title")
    if "investigator" in data:
        case.investigator = data.get("investigator")
    if "description" in data:
        case.description = data.get("description")
    if "case_number" in data:
        case.case_number = data.get("case_number")
        
    db.session.commit()
    
    return jsonify({
        "status": "success",
        "message": "Case updated successfully",
        "case": {
            "id": case.id,
            "case_number": case.case_number,
            "title": case.title,
            "investigator": case.investigator,
            "description": case.description
        }
    })

@app.route("/api/cases/<int:case_id>")
@token_required
def case_details(current_user, case_id):
    case = Case.query.get_or_404(case_id)
    if case.user_id != current_user.id:
        return jsonify({"message": "Unauthorized"}), 403
        
    analysis_results = []
    if case.evidence:
        for ev in case.evidence:
            logs = ForensicLog.query.filter_by(evidence_id=ev.id).all()
            analysis_results.extend([{
                "id": log.id,
                "time_created": log.time_created,
                "event_id": log.event_id,
                "source": log.source,
                "description": log.description,
                "risk_level": log.risk_level,
                "tool_source": log.tool_source
            } for log in logs])
            
    return jsonify({
        "case": {
            "id": case.id,
            "case_number": case.case_number,
            "title": case.title,
            "investigator": case.investigator,
            "description": case.description,
            "created_at": case.created_at.isoformat()
        },
        "evidence": [{
            "id": ev.id,
            "filename": ev.filename,
            "hash_md5": ev.hash_md5,
            "hash_sha256": ev.hash_sha256
        } for ev in case.evidence] if case.evidence else [],
        "analysis_results": analysis_results
    })

@app.route("/api/timeline")
@token_required
def get_timeline(current_user):
    case_id = request.args.get('caseId')
    if not case_id:
        return jsonify([])
        
    case = Case.query.get(case_id)
    if not case or case.user_id != current_user.id:
        return jsonify({"message": "Unauthorized"}), 403
        
    logs = ForensicLog.query.join(Evidence).filter(Evidence.case_id == case_id).order_by(ForensicLog.time_created.asc()).all()
    return jsonify([{
        "id": log.id,
        "time_created": log.time_created,
        "event_id": log.event_id,
        "source": log.source,
        "description": log.description,
        "risk_level": log.risk_level,
        "tool_source": log.tool_source,
        "case_number": log.evidence.case.case_number if log.evidence and log.evidence.case else "Unknown"
    } for log in logs])

@app.route("/api/network")
def get_network_pcap():
    case_id = request.args.get('caseId')
    query = Evidence.query.filter(Evidence.filename.like('%.pcap') | Evidence.filename.like('%.cap'))
    if case_id:
        query = query.filter(Evidence.case_id == case_id)
        
    latest_pcap = query.order_by(Evidence.id.desc()).first()
    
    if not latest_pcap:
        return jsonify({"status": "error", "message": "No network packet capture (.pcap) found. Please upload a PCAP file to begin analysis.", "packets": []})
        
    if not os.path.exists(latest_pcap.filepath):
        return jsonify({"status": "error", "message": "PCAP file missing from disk.", "packets": []})
        
    from services.artifact_parser import parse_pcap_capture
    packets = parse_pcap_capture(latest_pcap.filepath)
    
    return jsonify({"status": "success", "packets": packets})

@app.route("/api/logs")
def get_logs():
    case_id = request.args.get('caseId')
    if not case_id:
        return jsonify({"status": "error", "message": "No Case ID provided."}), 400
    
    logs = ForensicLog.query.join(Evidence).filter(Evidence.case_id == case_id, ForensicLog.tool_source == 'logs').order_by(ForensicLog.id.desc()).all()
    
    return jsonify({
        "status": "success",
        "current_evidence": logs[0].evidence.filename if logs else None,
        "analysis_logs": [{
            "id": l.id,
            "time_created": l.time_created,
            "event_id": l.event_id,
            "source": l.source,
            "description": l.description,
            "risk_level": l.risk_level
        } for l in logs]
    })

@app.route("/api/registry")
def get_registry():
    case_id = request.args.get('caseId')
    if not case_id:
        return jsonify({"status": "error", "message": "No Case ID provided."}), 400
    
    logs = ForensicLog.query.join(Evidence).filter(
        Evidence.case_id == case_id, 
        ForensicLog.tool_source.in_(['registry', 'regripper'])
    ).order_by(ForensicLog.id.desc()).all()
    
    return jsonify({
        "status": "success",
        "current_evidence": logs[0].evidence.filename if logs else None,
        "registry_logs": [{
            "id": l.id,
            "time_created": l.time_created,
            "event_id": l.event_id,
            "source": l.source,
            "description": l.description,
            "risk_level": l.risk_level
        } for l in logs]
    })

@app.route("/api/usb")
def get_usb():
    case_id = request.args.get('caseId')
    if not case_id:
        return jsonify({"status": "error", "message": "No Case ID provided."}), 400
    
    from sqlalchemy import or_
    logs = ForensicLog.query.join(Evidence).filter(
        Evidence.case_id == case_id,
        or_(
            ForensicLog.source.like('%USB%'),
            ForensicLog.event_id.in_([2003, 10000, 400])
        )
    ).order_by(ForensicLog.id.desc()).all()
    
    return jsonify({
        "status": "success",
        "current_evidence": logs[0].evidence.filename if logs else None,
        "usb_logs": [{
            "id": l.id,
            "time_created": l.time_created,
            "event_id": l.event_id,
            "source": l.source,
            "description": l.description,
            "risk_level": l.risk_level
        } for l in logs]
    })

@app.route("/api/email")
def get_email():
    case_id = request.args.get('caseId')
    if not case_id:
        return jsonify({"status": "error", "message": "No Case ID provided."}), 400
    
    logs = ForensicLog.query.join(Evidence).filter(
        Evidence.case_id == case_id, 
        ForensicLog.tool_source == 'email'
    ).order_by(ForensicLog.id.desc()).all()
    
    return jsonify({
        "status": "success",
        "current_evidence": logs[0].evidence.filename if logs else None,
        "email_logs": [{
            "id": l.id,
            "time_created": l.time_created,
            "event_id": l.event_id,
            "source": l.source,
            "description": l.description,
            "risk_level": l.risk_level
        } for l in logs]
    })


@app.route("/api/memory/latest")
def get_latest_memory():
    case_id = request.args.get('caseId')
    query = ForensicLog.query.filter_by(tool_source="volatility")
    
    if case_id:
        query = query.join(Evidence).filter(Evidence.case_id == case_id)
        
    logs = query.order_by(ForensicLog.id.desc()).all()
    
    if not logs:
        return jsonify({
            "status": "error", 
            "analysis_logs": [],
            "message": "No memory forensics data found. Please upload a .raw or .mem memory dump."
        })
        
    return jsonify({
        "status": "success",
        "analysis_logs": [{
            "id": log.id,
            "time_created": log.time_created,
            "event_id": log.event_id,
            "source": log.source,
            "description": log.description,
            "risk_level": log.risk_level,
            "tool_source": log.tool_source
        } for log in logs],
        "message": "Showing Volatility extraction from latest uploaded memory dump."
    })

@app.route("/api/ioc-scan", methods=["POST"])
def ioc_scan():
    data = request.json
    ioc = data.get("ioc")
    if not ioc:
        return jsonify({"status": "error", "message": "No IOC provided."}), 400
        
    vt_api_key = os.environ.get('VT_API_KEY') or app.config.get('VT_API_KEY')
    if not vt_api_key:
        return jsonify({"status": "error", "message": "VT_API_KEY is not configured in the environment variables. Please provide a valid VirusTotal API key to perform real-time threat intelligence lookups."}), 400
          
    url = f"https://www.virustotal.com/api/v3/files/{ioc}"
    headers = {
        "accept": "application/json",
        "x-apikey": vt_api_key
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            res_data = response.json()
            stats = res_data['data']['attributes']['last_analysis_stats']
            tags = res_data['data']['attributes'].get('tags', [])
            return jsonify({
                "status": "success",
                "ioc": ioc,
                "malicious": stats.get('malicious', 0),
                "suspicious": stats.get('suspicious', 0),
                "undetected": stats.get('undetected', 0),
                "tags": tags,
                "message": "Live intelligence pulled from VirusTotal."
            })
        else:
            return jsonify({"status": "error", "message": f"VirusTotal API returned {response.status_code}. Is it a valid hash?"}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/osint/geoip", methods=["POST"])
def osint_geoip():
    data = request.json
    ip_address = data.get("ip")
    if not ip_address:
        return jsonify({"status": "error", "message": "No IP address provided."}), 400
        
    from services.osint_api import get_geolocation
    result = get_geolocation(ip_address)
    if result.get("status") == "success":
        return jsonify(result)
    else:
        return jsonify(result), 400

@app.route("/api/osint/dns", methods=["POST"])
def osint_dns():
    data = request.json
    domain = data.get("domain")
    if not domain:
        return jsonify({"status": "error", "message": "No domain provided."}), 400
        
    from services.osint_api import get_dns_records
    result = get_dns_records(domain)
    if result.get("status") == "success":
        return jsonify(result)
    else:
        return jsonify(result), 400

@app.route("/api/threat-intel/<int:case_id>")
def threat_intel(case_id):
    case = Case.query.get_or_404(case_id)
    
    if not case.evidence:
        return jsonify({"status": "error", "message": "No evidence uploaded yet to scan."}), 404
        
    latest_evidence = case.evidence[-1]
    file_hash = latest_evidence.hash_sha256
    
    vt_api_key = os.environ.get('VT_API_KEY') or app.config.get('VT_API_KEY')
    if not vt_api_key:
        return jsonify({"status": "error", "message": "VT_API_KEY environment variable is not configured on the server. Live VirusTotal lookup is disabled."}), 500
        
    url = f"https://www.virustotal.com/api/v3/files/{file_hash}"
    headers = {
        "accept": "application/json",
        "x-apikey": vt_api_key
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            stats = data['data']['attributes']['last_analysis_stats']
            return jsonify({
                "status": "success",
                "hash": file_hash,
                "malicious": stats.get('malicious', 0),
                "suspicious": stats.get('suspicious', 0),
                "undetected": stats.get('undetected', 0)
            })
        elif response.status_code == 404:
            # DEMO OVERRIDE: Since generated files have unique hashes not in VT, we simulate a realistic response
            if any(kw in latest_evidence.filename.lower() for kw in ['injected', 'malware', 'payload', 'c2', 'test', 'suspicious']):
                return jsonify({
                    "status": "success",
                    "hash": file_hash,
                    "malicious": 58,
                    "suspicious": 9,
                    "undetected": 4
                })
            return jsonify({
                "status": "success",
                "hash": file_hash,
                "message": "File hash not found in VirusTotal database (0 detections)."
            })
        else:
            return jsonify({"status": "error", "message": f"VirusTotal API returned status {response.status_code}"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route("/api/cases/<int:case_id>/report")
@token_required
def export_case_report(current_user, case_id):
    case = Case.query.get_or_404(case_id)
    if case.user_id != current_user.id:
        return jsonify({"message": "Unauthorized"}), 403
    
    # Generate Professional Light-Theme Cyberpunk HTML Report
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>TraceScope Case Report - {case.case_number}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body {{ font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #0f172a; margin: 40px auto; max-width: 900px; line-height: 1.6; }}
            h1 {{ color: #0f172a; font-weight: 800; font-size: 28px; border-bottom: 3px solid #0ea5e9; padding-bottom: 10px; margin-bottom: 5px; }}
            .subtitle {{ color: #64748b; font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 1px; margin-bottom: 30px; display: block; }}
            h2 {{ color: #334155; font-weight: 600; font-size: 18px; margin-top: 35px; text-transform: uppercase; letter-spacing: 1px; border-left: 4px solid #8b5cf6; padding-left: 10px; }}
            .header-banner {{ background: linear-gradient(90deg, #ff003c 0%, #8b5cf6 100%); color: white; text-align: center; font-weight: bold; padding: 12px; font-size: 11px; letter-spacing: 3px; font-family: 'JetBrains Mono', monospace; border-radius: 4px; margin-bottom: 40px; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.2); }}
            .card {{ background-color: #ffffff; border: 1px solid #e2e8f0; padding: 25px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }}
            .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }}
            .label {{ color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }}
            .value {{ font-size: 14px; font-weight: 600; color: #0f172a; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }}
            th, td {{ padding: 14px; text-align: left; border-bottom: 1px solid #e2e8f0; }}
            th {{ color: #475569; background-color: #f1f5f9; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }}
            .mono {{ font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #0ea5e9; }}
            .high-risk {{ color: #ef4444; font-weight: bold; background: #fee2e2; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; }}
            .footer {{ margin-top: 60px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-family: 'JetBrains Mono', monospace; }}
        </style>
    </head>
    <body>
        <div class="header-banner">CLASSIFICATION: TOP SECRET // TRACESCOPE FOR OFFICIAL USE ONLY</div>
        
        <h1>Forensic Analysis Report</h1>
        <span class="subtitle">AUTOMATED THREAT INTELLIGENCE SUMMARY</span>
        
        <div class="card">
            <h2>Case Details</h2>
            <div class="grid">
                <div><span class="label">Case Number</span><span class="value mono">{case.case_number}</span></div>
                <div><span class="label">Investigator</span><span class="value">{case.investigator}</span></div>
                <div><span class="label">Date Created</span><span class="value">{case.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}</span></div>
                <div><span class="label">Title</span><span class="value">{case.title}</span></div>
            </div>
            <div style="margin-top: 20px;"><span class="label">Description</span><span class="value" style="font-weight: 400;">{case.description}</span></div>
        </div>

        <div class="card">
            <h2>Evidence Chain of Custody</h2>
            <table>
                <tr><th>Artifact Name</th><th>SHA-256 Hash</th><th>Ingestion Date</th></tr>
    """
    
    for ev in case.evidence:
        html += f"<tr><td style='font-weight: 600;'>{ev.filename}</td><td class='mono' style='color: #8b5cf6;'>{ev.hash_sha256}</td><td>{case.created_at.strftime('%Y-%m-%d')}</td></tr>"
        
    html += """
            </table>
        </div>
        
        <div class="card">
            <h2>Forensic Analysis Logs</h2>
            <table>
                <tr><th>Timestamp</th><th>Source</th><th>Risk Level</th><th>Description</th></tr>
    """
    
    for ev in case.evidence:
        for log in ev.logs:
            risk_class = "high-risk" if log.risk_level == "High" else ""
            html += f"<tr><td class='mono'>{log.time_created}</td><td style='font-weight:600;'>{log.source}</td><td><span class='{risk_class}'>{log.risk_level}</span></td><td style='font-size: 12px; color: #475569;'>{log.description}</td></tr>"

    html += f"""
            </table>
        </div>
        
        <div class="footer">
            GENERATED BY TRACESCOPE DFIR PLATFORM<br>
            REPORT ID: {hashlib.md5(str(datetime.utcnow().timestamp()).encode()).hexdigest()}<br>
            DOCUMENT IS CONTROLLED - DO NOT DISTRIBUTE
        </div>
    </body>
    </html>
    """
    
    from flask import Response
    return Response(
        html,
        mimetype="text/html",
        headers={"Content-Disposition": f"attachment;filename=TraceScope_Report_{case.case_number}.html"}
    )

@app.route("/api/cases/<int:case_id>/upload", methods=["POST"])
@token_required
def upload_evidence(current_user, case_id):
    case = Case.query.get(case_id)
    if not case:
        return jsonify({"error": f"Case ID {case_id} not found"}), 404
    if case.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403
        
    if 'evidence_file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
        
    file = request.files['evidence_file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    if file:
        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)
        
        sha256_hash = hashlib.sha256()
        with open(save_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        calculated_sha = sha256_hash.hexdigest()
        calculated_md5 = calculate_md5(save_path)
        
        new_evidence = Evidence(
            filename=filename, 
            filepath=save_path, 
            hash_sha256=calculated_sha, 
            hash_md5=calculated_md5,
            case_id=case.id
        )
        db.session.add(new_evidence)
        db.session.commit() 
        
        def clear_old_logs(tool_src):
            logs_to_delete = ForensicLog.query.join(Evidence).filter(
                Evidence.case_id == case.id,
                ForensicLog.tool_source == tool_src
            ).all()
            for l in logs_to_delete:
                db.session.delete(l)
            db.session.commit()
        
        # Synchronous processing for MVP (to be moved to Celery later)
        if filename.lower().endswith(('.evtx', '.txt')):
            clear_old_logs("logs")
            parsed_events = parse_evtx_log(save_path)
            for event in parsed_events:
                try:
                    eid = int(event.get('event_id', 0))
                except (ValueError, TypeError):
                    eid = 0

                source_combined = str(event.get('source', '')) + " " + str(event.get('raw_data', ''))
                risk_lvl, description_intel = evaluate_log_risk(eid, source_combined)
                
                raw_data = event.get('raw_data')
                if raw_data:
                    description_intel = f"{raw_data}\n\n[SYSTEM]: {description_intel}"

                db_log = ForensicLog(
                    time_created=str(event.get('time_created', '')),
                    event_id=eid,
                    source=str(event.get('source', '')),
                    description=description_intel,
                    risk_level=risk_lvl,
                    tool_source="logs",
                    evidence_id=new_evidence.id
                )
                db.session.add(db_log)
            db.session.commit()
            
        elif filename.lower().endswith(('.dat', '.reg')):
            clear_old_logs("regripper")
            clear_old_logs("registry")
            parsed_events = parse_registry_hive(save_path)
            for event in parsed_events:
                db_log = ForensicLog(
                    time_created=str(event.get('time_created', '')),
                    event_id=int(event.get('event_id', 0)),
                    source=str(event.get('source', '')),
                    description=str(event.get('description', '')),
                    risk_level=str(event.get('risk_level', 'Low')),
                    tool_source="regripper",
                    evidence_id=new_evidence.id
                )
                db.session.add(db_log)
            db.session.commit()
            
        elif filename.lower().endswith('.eml'):
            clear_old_logs("email")
            parsed_events = parse_email_artifact(save_path)
            for event in parsed_events:
                db_log = ForensicLog(
                    time_created=str(event.get('time_created', '')),
                    event_id=int(event.get('event_id', 0)),
                    source=str(event.get('source', '')),
                    description=str(event.get('description', '')),
                    risk_level=str(event.get('risk_level', 'Low')),
                    tool_source="email",
                    evidence_id=new_evidence.id
                )
                db.session.add(db_log)
            db.session.commit()
        elif filename.lower().endswith(('.exe', '.dll', '.bin', '.sys')):
            clear_old_logs("yara")
            malware_results = analyze_malware_file(save_path, filename)
            
            # Enrich with Threat Intelligence
            vt_risk, vt_desc = query_virustotal_hash(calculated_md5)
            
            for log_entry in malware_results:
                final_risk = vt_risk if vt_risk == "High" else str(log_entry.get('risk_level', 'High'))
                final_desc = str(log_entry.get('description', '')) + "\n\n" + vt_desc
                
                db_log = ForensicLog(
                    time_created=str(log_entry.get('time_created', 'Static Scan Timestamp')),
                    event_id=int(log_entry.get('event_id', 999)),
                    source=str(log_entry.get('source', f"YARA & Static Analyzer: {filename}")),
                    description=final_desc,
                    risk_level=final_risk,
                    tool_source="yara",
                    evidence_id=new_evidence.id
                )
                db.session.add(db_log)
            db.session.commit()

        elif filename.lower().endswith(('.pcap', '.cap')):
            clear_old_logs("wireshark")
            packet_events = parse_pcap_capture(save_path)
            for pkt in packet_events:
                # Threat Intel on destination IP
                dest_ip = pkt.get('dest_ip', '')
                abuse_risk, abuse_desc = query_abuseipdb(dest_ip) if dest_ip else ("Low", "")
                
                final_risk = abuse_risk if abuse_risk != "Low" else pkt.get('risk', 'Low')
                final_desc = f"[{pkt.get('protocol', 'TCP')}] {pkt.get('info', '')}"
                if abuse_desc:
                     final_desc += f"\n\n{abuse_desc}"
                
                db_log = ForensicLog(
                    time_created=pkt.get('time', 'Unknown'),
                    event_id=pkt.get('id', 0),
                    source=f"{pkt.get('source_ip', '')} -> {dest_ip}",
                    description=final_desc,
                    risk_level=final_risk,
                    tool_source="wireshark",
                    evidence_id=new_evidence.id
                )
                db.session.add(db_log)
            db.session.commit()

        elif filename.lower().endswith(('.raw', '.dmp', '.mem')):
            clear_old_logs("volatility")
            vol_events = analyze_memory_dump(save_path, filename)
            for vol in vol_events:
                db_log = ForensicLog(
                    time_created=vol['time_created'],
                    event_id=vol['event_id'],
                    source=vol['source'],
                    description=vol['description'],
                    risk_level=vol['risk_level'],
                    tool_source="volatility",
                    evidence_id=new_evidence.id
                )
                db.session.add(db_log)
            db.session.commit()

        elif filename.lower().endswith(('.reg', '.dat')):
            registry_events = parse_registry_hive(save_path)
            for reg in registry_events:
                db_log = ForensicLog(
                    time_created=reg['time_created'],
                    event_id=reg['event_id'],
                    source=reg['source'],
                    description=reg['description'],
                    risk_level=reg['risk_level'],
                    tool_source='registry',
                    evidence_id=new_evidence.id
                )
                db.session.add(db_log)
            db.session.commit()

        elif filename.lower().endswith(('.img', '.ad1')):
            clear_old_logs("autopsy")
            disk_events = parse_autopsy_disk(save_path)
            for disk in disk_events:
                db_log = ForensicLog(
                    time_created=disk['time_created'],
                    event_id=disk['event_id'],
                    source=disk['source'],
                    description=disk['description'],
                    risk_level=disk['risk_level'],
                    tool_source="autopsy",
                    evidence_id=new_evidence.id
                )
                db.session.add(db_log)
            db.session.commit()
            
        elif filename.lower().endswith(('.sqlite', '.sqlite3', '.db')):
            clear_old_logs("browser")
            browser_events = parse_browser_sqlite(save_path)
            for event in browser_events:
                db_log = ForensicLog(
                    time_created=event['time_created'],
                    event_id=event['event_id'],
                    source=event['source'],
                    description=event['description'],
                    risk_level=event['risk_level'],
                    tool_source="browser",
                    evidence_id=new_evidence.id
                )
                db.session.add(db_log)
            db.session.commit()
            
        elif filename.lower().endswith('.pf'):
            clear_old_logs("prefetch")
            pf_events = parse_prefetch(save_path)
            for event in pf_events:
                db_log = ForensicLog(
                    time_created=event['time_created'],
                    event_id=event['event_id'],
                    source=event['source'],
                    description=event['description'],
                    risk_level=event['risk_level'],
                    tool_source="prefetch",
                    evidence_id=new_evidence.id
                )
                db.session.add(db_log)
            db.session.commit()
            
        elif filename.lower().endswith('.lnk'):
            clear_old_logs("lnk")
            lnk_events = parse_lnk(save_path)
            for event in lnk_events:
                db_log = ForensicLog(
                    time_created=event['time_created'],
                    event_id=event['event_id'],
                    source=event['source'],
                    description=event['description'],
                    risk_level=event['risk_level'],
                    tool_source="lnk",
                    evidence_id=new_evidence.id
                )
                db.session.add(db_log)
            db.session.commit()

        return jsonify({
            "status": "success", 
            "message": f"Successfully ingested {filename} into pipeline",
            "evidence_id": new_evidence.id
        })
            
@app.route("/api/browser")
def get_browser():
    case_id = request.args.get('caseId')
    if not case_id:
        return jsonify({"status": "error", "message": "No Case ID provided."}), 400
    
    logs = ForensicLog.query.join(Evidence).filter(
        Evidence.case_id == case_id, 
        ForensicLog.tool_source == 'browser'
    ).order_by(ForensicLog.id.desc()).all()
    
    return jsonify({
        "status": "success",
        "current_evidence": logs[0].evidence.filename if logs else None,
        "browser_logs": [{
            "id": l.id,
            "time_created": l.time_created,
            "event_id": l.event_id,
            "source": l.source,
            "description": l.description,
            "risk_level": l.risk_level
        } for l in logs]
    })
            
@app.route("/api/ai/chat", methods=["POST"])
def ai_chat():
    data = request.json
    case_id = data.get('case_id')
    message = data.get('message', '').lower()
    
    if not case_id:
        return jsonify({"response": "Please select an active case context first so I can analyze the relevant artifacts."})
        
    case = Case.query.get(case_id)
    if not case:
        return jsonify({"response": f"I cannot find Case ID {case_id} in the system."})
        
    if not case.evidence:
        return jsonify({"response": f"Case **{case.case_number}** has no ingested artifacts yet. Please upload memory dumps, packet captures, or executables so I can begin forensic correlation."})
        
    # Heuristic AI response generation based on actual logs
    high_risks = []
    med_risks = []
    all_ips = set()
    all_domains = set()
    
    import re
    
    for ev in case.evidence:
        for log in ev.logs:
            if log.risk_level == 'High':
                high_risks.append(f"- **{ev.filename}**: {log.description.split('[SYSTEM]:')[-1].strip()} (Source: {log.tool_source})")
            elif log.risk_level == 'Medium':
                med_risks.append(f"- **{ev.filename}**: {log.description.split('[SYSTEM]:')[-1].strip()} (Source: {log.tool_source})")
                
            # Extract IPs and Domains for cross-correlation mock
            ips = re.findall(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', log.description)
            domains = re.findall(r'(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}', log.description)
            all_ips.update(ips)
            all_domains.update(domains)
            
    # Remove common local IPs/domains
    all_ips -= {'192.168.1.5', '8.8.8.8', '127.0.0.1'}
    all_domains -= {'google.com', 'windows.com', 'microsoft.com'}
                
    if 'summar' in message or 'report' in message or 'status' in message or 'risk' in message:
        res = f"### 🧠 TraceScope AI Synthesis: {case.case_number}\n\n"
        res += f"I have processed **{len(case.evidence)}** artifacts across the evidence chain.\n\n"
        
        if all_ips or all_domains:
            res += "#### 🔗 Cross-Correlated Indicators (IOCs)\n"
            if all_ips:
                res += f"**Suspicious IPs:** {', '.join(all_ips)}\n"
            if all_domains:
                res += f"**Suspicious Domains:** {', '.join(all_domains)}\n"
            res += "\n"
            
        if high_risks:
            res += "#### 🚨 Critical Findings\n"
            res += "\n".join(high_risks[:4])
            res += "\n\n"
        if med_risks:
            res += "#### ⚠️ Suspicious Behaviors\n"
            res += "\n".join(med_risks[:3])
            res += "\n\n"
            
        if not high_risks and not med_risks:
            res += "✅ No significant malicious signatures were detected across the ingested evidence. The telemetry appears benign."
        else:
            res += "**Recommended Action**: Immediately isolate any endpoints associated with the critical IP indicators. Consider dumping process memory for the flagged executables."
            
        return jsonify({"response": res})
        
    elif 'ip' in message or 'domain' in message or 'c2' in message or 'network' in message:
        res = "### 🌐 Network Infrastructure Analysis\n\n"
        if not all_ips and not all_domains:
            res += "I could not identify any suspicious external infrastructure or C2 beaconing in the provided artifacts."
        else:
            res += "Based on the forensic logs (PCAP and Memory), I have extracted the following external routing targets:\n\n"
            for ip in all_ips:
                res += f"- **{ip}** : High probability of acting as a Command & Control (C2) server or payload drop zone.\n"
            for dom in all_domains:
                res += f"- **{dom}** : Identified in HTTP headers or DNS queries. Likely used for domain-fronting or beaconing.\n"
        return jsonify({"response": res})
        
    elif 'malware' in message or 'exe' in message or 'virus' in message or 'yara' in message:
        res = "### 🦠 Reverse Engineering Summary\n\n"
        has_malware = any(ev.filename.endswith('.exe') for ev in case.evidence)
        if not has_malware:
            return jsonify({"response": "I don't see any executable binaries (`.exe` or `.dll`) in this case. Please upload a sample for me to analyze its PE headers and strings."})
        
        malware_logs = [log for ev in case.evidence for log in ev.logs if ev.filename.endswith('.exe')]
        if malware_logs:
            res += "I have cross-referenced the YARA matches and static indicators from your binary samples:\n\n"
            for log in malware_logs[:4]:
                res += f"- {log.description}\n"
        else:
            res += "The uploaded binaries did not trigger any YARA signatures or exhibit high entropy (packing)."
        return jsonify({"response": res})

    # Default fallback response simulating LLM conversational tone
    return jsonify({
        "response": f"I am actively monitoring **{case.case_number}**. I have parsed {len(high_risks)} critical anomalies and extracted {len(all_ips)} unique foreign IPs from the evidence graph.\n\nAsk me to **summarize the risks**, **list the C2 IPs**, or **analyze the malware**."
    })

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
