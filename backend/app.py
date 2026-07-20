from services.analyzer import calculate_md5, evaluate_log_risk, analyze_malware_file, analyze_memory_dump
from services.artifact_parser import parse_evtx_log, parse_pcap_capture, parse_autopsy_disk 
import os
import hashlib
import json 
import requests 
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

load_dotenv() # Load environment variables from .env file
from flask import Flask, request, jsonify
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
    return app.send_static_file('index.html')

@app.errorhandler(404)
def serve_react(e):
    if request.path.startswith('/api/'):
        return jsonify({"error": "Not Found"}), 404
    return app.send_static_file('index.html')

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
        new_case = Case(
            case_number=data.get("case_number"),
            title=data.get("title"),
            investigator=data.get("investigator"),
            description=data.get("description")
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
                    time_created=pkt['time_created'],
                    event_id=pkt['event_id'],
                    source=pkt['source'],
                    description=pkt['description'],
                    risk_level=pkt['risk_level'],
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
