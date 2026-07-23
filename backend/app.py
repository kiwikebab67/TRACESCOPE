from services.analyzer import calculate_md5, evaluate_log_risk, analyze_malware_file, analyze_memory_dump
from services.artifact_parser import parse_evtx_log, parse_pcap_capture, parse_autopsy_disk, parse_registry_hive, parse_email_artifact
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

# Serve React App
@app.route('/')
def index():
    response = make_response(app.send_static_file('index.html'))
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

@app.errorhandler(404)
def serve_react(e):
    if request.path.startswith('/api/'):
        return jsonify({"error": "Not Found"}), 404
    response = make_response(app.send_static_file('index.html'))
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

from datetime import datetime, timedelta

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
def manage_cases():
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
            investigator=data.get("investigator", "System Admin"),
            description=data.get("description", "")
        )
        db.session.add(new_case)
        db.session.commit()
        return jsonify({"message": "Case created successfully", "case_id": new_case.id}), 201
        
    cases = Case.query.order_by(Case.created_at.desc()).all()
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
    # Find latest evidence that is an executable
    latest_malware = Evidence.query.filter(Evidence.filename.like('%.exe') | Evidence.filename.like('%.dll')).order_by(Evidence.id.desc()).first()
    
    if not latest_malware:
        return jsonify({"status": "error", "message": "No malware samples found in the database."}), 404
        
    logs = ForensicLog.query.filter_by(evidence_id=latest_malware.id).all()
    
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

@app.route("/api/cases/<int:case_id>", methods=["PUT"])
def update_case(case_id):
    case = Case.query.get_or_404(case_id)
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
def case_details(case_id):
    case = Case.query.get_or_404(case_id)
    
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
def get_timeline():
    case_id = request.args.get('caseId')
    if not case_id:
        return jsonify([])
        
    logs = ForensicLog.query.join(Evidence).filter(Evidence.case_id == case_id).order_by(ForensicLog.id.asc()).all()
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
    # Find latest uploaded PCAP file
    latest_pcap = Evidence.query.filter(Evidence.filename.like('%.pcap') | Evidence.filename.like('%.cap')).order_by(Evidence.id.desc()).first()
    
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
    
    logs = ForensicLog.query.join(Evidence).filter(
        Evidence.case_id == case_id, 
        ForensicLog.source.like('%USB%')
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
    # Fetch latest volatility memory analysis logs
    logs = ForensicLog.query.filter_by(tool_source="volatility").order_by(ForensicLog.id.desc()).all()
    
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
def export_case_report(case_id):
    case = Case.query.get_or_404(case_id)
    
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
def upload_evidence(case_id):
    case = Case.query.get(case_id)
    if not case:
        return jsonify({"error": f"Case ID {case_id} not found"}), 404
        
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
        
        # Synchronous processing for MVP (to be moved to Celery later)
        if filename.lower().endswith(('.evtx', '.txt')):
            parsed_events = parse_evtx_log(save_path)
            for event in parsed_events:
                try:
                    eid = int(event.get('event_id', 0))
                except (ValueError, TypeError):
                    eid = 0

                risk_lvl, description_intel = evaluate_log_risk(eid, str(event.get('source', '')))

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
            malware_results = analyze_malware_file(save_path, filename)
            risk_level = "High" if malware_results['is_suspicious'] else "Low"
            
            desc_lines = []
            if malware_results['yara_matches']:
                for match in malware_results['yara_matches']:
                    desc_lines.append(f"[YARA RULE] {match['rule']}: {match['meta']}")
            desc_lines.extend(malware_results['notes'])
            
            db_log = ForensicLog(
                time_created="Static Scan Timestamp",
                event_id=999,
                source=f"YARA & Static Analyzer: {filename}",
                description=" | ".join(desc_lines),
                risk_level=risk_level,
                tool_source="yara",
                evidence_id=new_evidence.id
            )
            db.session.add(db_log)
            db.session.commit()

        elif filename.lower().endswith(('.pcap', '.cap')):
            packet_events = parse_pcap_capture(save_path)
            for pkt in packet_events:
                db_log = ForensicLog(
                    time_created=pkt.get('time', 'Unknown'),
                    event_id=pkt.get('id', 0),
                    source=f"{pkt.get('source_ip', '')} -> {pkt.get('dest_ip', '')}",
                    description=f"[{pkt.get('protocol', 'TCP')}] {pkt.get('info', '')}",
                    risk_level=pkt.get('risk', 'Low'),
                    tool_source="wireshark",
                    evidence_id=new_evidence.id
                )
                db.session.add(db_log)
            db.session.commit()

        elif filename.lower().endswith(('.raw', '.dmp', '.mem')):
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
            
        return jsonify({
            "status": "success", 
            "message": f"Successfully ingested {filename} into pipeline",
            "evidence_id": new_evidence.id
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
    
    for ev in case.evidence:
        for log in ev.logs:
            if log.risk_level == 'High':
                high_risks.append(f"- **{ev.filename}**: {log.description} ({log.tool_source})")
            elif log.risk_level == 'Medium':
                med_risks.append(f"- **{ev.filename}**: {log.description} ({log.tool_source})")
                
    if 'summar' in message or 'report' in message or 'status' in message or 'risk' in message:
        res = f"### TraceScope AI Analysis: {case.case_number}\n\n"
        res += f"I have analyzed **{len(case.evidence)}** artifacts in this case.\n\n"
        
        if high_risks:
            res += "#### 🚨 Critical Findings\n"
            res += "\n".join(high_risks[:3]) # Limit to top 3 for brevity
            res += "\n\n"
        if med_risks:
            res += "#### ⚠️ Suspicious Indicators\n"
            res += "\n".join(med_risks[:3])
            res += "\n\n"
            
        if not high_risks and not med_risks:
            res += "✅ No significant malicious signatures were detected across the ingested evidence."
        else:
            res += "**Recommended Action**: Immediately isolate any endpoints associated with the critical findings and review the exact YARA signature matches in the Triage dashboard."
            
        return jsonify({"response": res})
        
    # Default fallback response
    return jsonify({
        "response": f"I am currently analyzing the context for **{case.case_number}**. I detected {len(high_risks)} high-risk anomalies in the evidence chain. Ask me to 'summarize the risks' for a detailed breakdown."
    })

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
