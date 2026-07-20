import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'tracescope-super-secret-key-1337')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///tracescope.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # TraceScope Specific Configs
    VT_API_KEY = os.environ.get('VT_API_KEY')
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB limit
