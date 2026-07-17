from services.analyzer import calculate_md5, evaluate_log_risk, analyze_malware_file
from services.artifact_parser import parse_evtx_log 
import os
import hashlib
import json 
from werkzeug.utils import secure_filename
from flask import Flask, render_template, request, redirect, url_for
from config import Config
from models.database import db
from models.case import Case
from models.evidence import Evidence 
from models.evidence import ForensicLog 

app = Flask(__name__)
app.config.from_object(Config)

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

db.init_app(app)

# 🌟 FIXED: Removed db.drop_all() so cases and parsed logs persist forever
with app.app_context():
    db.create_all()   

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/create-case", methods=["GET", "POST"])
def create_case():
    if request.method == "POST":
        new_case = Case(
            case_number=request.form["case_number"],
            title=request.form["title"],
            investigator=request.form["investigator"],
            description=request.form["description"]
        )
        db.session.add(new_case)
        db.session.commit()
        return redirect(url_for("view_cases"))
    return render_template("create_case.html")

# 👇 FIXED: Added methods=["GET", "POST"] and the logic to save a case from the dashboard!
@app.route("/cases", methods=["GET", "POST"])
def view_cases():
    if request.method == "POST":
        new_case = Case(
            case_number=request.form.get("case_number"),
            title=request.form.get("title"),
            investigator=request.form.get("investigator"),
            description=request.form.get("description")
        )
        db.session.add(new_case)
        db.session.commit()
        return redirect(url_for("view_cases"))
        
    cases = Case.query.order_by(Case.created_at.desc()).all()
    return render_template("cases.html", cases=cases)

@app.route("/case/<int:case_id>")
def case_details(case_id):
    case = Case.query.get_or_404(case_id)
    
    # Fetch all automated analysis logs linked to this case's evidence
    analysis_results = []
    if hasattr(case, 'evidence') and case.evidence:
        for ev in case.evidence:
            logs = ForensicLog.query.filter_by(evidence_id=ev.id).all()
            analysis_results.extend(logs)
            
    return render_template(
        "case_details.html",
        case=case,
        analysis_results=analysis_results
    )

@app.route("/case/<int:case_id>/report")
def generate_report(case_id):
    case = Case.query.get_or_404(case_id)
    # Collect logs for the report
    logs = []
    for ev in case.evidence:
        logs.extend(ForensicLog.query.filter_by(evidence_id=ev.id).all())
    return render_template("report.html", case=case, logs=logs)

@app.route("/case/<int:case_id>/upload", methods=["POST"])
def upload_evidence(case_id):
    case = Case.query.get_or_404(case_id)
    
    if 'evidence_file' not in request.files:
        return "No file part in the request", 400
        
    file = request.files['evidence_file']
    if file.filename == '':
        return "No file selected", 400
        
    if file:
        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)
        
        # Calculate Hashes (Integrity & Chain of Custody Foundation)
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
        
        # --- LOGIC BLOCK: FILE PROCESSING ---
        
        # 1. Handle Log Files
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
                    evidence_id=new_evidence.id
                )
                db.session.add(db_log)
            db.session.commit()
            
        # 2. Handle Binary/Malware Files
        elif filename.lower().endswith(('.exe', '.dll', '.bin', '.sys')):
            malware_results = analyze_malware_file(save_path, filename)
            
            risk_level = "High" if malware_results['is_suspicious'] else "Low"
            
            db_log = ForensicLog(
                time_created="Artifact Extraction Time",
                event_id=999,
                source=f"Static Analysis Engine: {filename}",
                description=f"Analysis: {', '.join(malware_results['notes']) if malware_results['notes'] else 'No high-risk indicators.'}",
                risk_level=risk_level,
                evidence_id=new_evidence.id
            )
            db.session.add(db_log)
            db.session.commit()
            
        return redirect(url_for('case_details', case_id=case.id))

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)