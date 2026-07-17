from datetime import datetime
from models.database import db

class Evidence(db.Model):
    __tablename__ = 'evidence'
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    filepath = db.Column(db.String(512), nullable=False)
    hash_sha256 = db.Column(db.String(64), nullable=False)
    hash_md5 = db.Column(db.String(32), nullable=True)     # 🌟 Added for Threat Intel Lookups
    case_id = db.Column(db.Integer, db.ForeignKey('case.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class ForensicLog(db.Model):
    __tablename__ = 'forensic_log'
    id = db.Column(db.Integer, primary_key=True)
    time_created = db.Column(db.String(100), nullable=False)
    event_id = db.Column(db.Integer, nullable=False)
    source = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)          # Detailed breakdown
    risk_level = db.Column(db.String(50), default="Informational") # 🌟 Added for SOC Alert highlighting
    evidence_id = db.Column(db.Integer, db.ForeignKey('evidence.id'), nullable=False)