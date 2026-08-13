import requests
import json
import os
import sys

# Get the token
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from app import app, db
from models.case import Case
from models.user import User

with app.app_context():
    case = Case.query.first()
    if not case:
        case = Case(case_number="TEST-1234", description="Test Case", status="Open")
        db.session.add(case)
        db.session.commit()
    case_id = case.id
    case_id = case.id
    
    print(f"Created case ID: {case_id}")

    # 2. Upload the file
    from io import BytesIO
    from werkzeug.datastructures import FileStorage
    
    with open('TraceScope_Sample_Files/cloudtrail_test.json', 'rb') as f:
        file_content = f.read()
        
    client = app.test_client()
    
    user = User.query.first()
    if not user:
        user = User(username='test', email='test@test.com', password_hash='hash', role='admin')
        db.session.add(user)
        db.session.commit()
        
    import jwt
    from config import Config
    from datetime import datetime, timedelta
    
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(minutes=30)
    }, Config.SECRET_KEY, algorithm="HS256")
    
    print(f"Token generated.")
    
    res = client.post(f'/api/cases/{case_id}/upload', 
                      headers={'Authorization': f'Bearer {token}'},
                      data={'evidence_file': (BytesIO(file_content), 'cloudtrail_test.json')}
                      )
    
    print(f"Upload Response: {res.status_code}")
    print(res.json)
    
    # 3. Fetch logs
    res2 = client.get(f'/api/logs?caseId={case_id}')
    print(f"Logs Response: {res2.status_code}")
    print(json.dumps(res2.json, indent=2))
