from datetime import datetime
from models.database import db

class Case(db.Model):
    __tablename__ = 'cases'
    
    id = db.Column(db.Integer, primary_key=True)
    case_number = db.Column(db.String(50), unique=True, nullable=False)
    title = db.Column(db.String(100), nullable=False)
    investigator = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    evidence = db.relationship('Evidence', backref='case', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Case {self.case_number} - {self.title}>"
