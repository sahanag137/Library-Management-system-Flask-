import os

class Config:
    FINE_PER_DAY = 5
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'library.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Add this line below:
    SECRET_KEY = 'my_super_secret_key_123'
    LOAN_PERIOD_DAYS = 14