from datetime import datetime
from models.database import db

class Evidence(db.Model):
    __tablename__ = 'evidence'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    filepath = db.Column(db.String(512), nullable=False)
    hash_sha256 = db.Column(db.String(64), nullable=False)
    hash_md5 = db.Column(db.String(32), nullable=False)
    case_id = db.Column(db.Integer, db.ForeignKey('cases.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    logs = db.relationship('ForensicLog', backref='evidence', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Evidence {self.filename}>"

class ForensicLog(db.Model):
    __tablename__ = 'forensic_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    time_created = db.Column(db.String(100), nullable=True)
    event_id = db.Column(db.Integer, nullable=True)
    source = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    risk_level = db.Column(db.String(50), nullable=True)
    tool_source = db.Column(db.String(50), default="logs", nullable=True)
    evidence_id = db.Column(db.Integer, db.ForeignKey('evidence.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ForensicLog ID={self.event_id} Risk={self.risk_level}>"
