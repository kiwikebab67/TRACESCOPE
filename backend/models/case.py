from models.database import db
from datetime import datetime

class Case(db.Model):
    __tablename__ = "case"

    id = db.Column(db.Integer, primary_key=True)
    case_number = db.Column(db.String(50), unique=True, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    investigator = db.Column(db.String(100))
    priority = db.Column(db.String(20), default="Medium")
    status = db.Column(db.String(20), default="Open")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # 🌟 ADDED RELATIONSHIP HERE: Links cases directly to evidence records
    # Using 'Evidence' as a string avoids any circular import issues!
    evidence = db.relationship('Evidence', backref='case', lazy=True)