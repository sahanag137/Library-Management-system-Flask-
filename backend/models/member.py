from database import db
from datetime import datetime

class Member(db.Model):
    __tablename__ = 'members'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    member_id = db.Column(db.String(20), unique=True, nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    membership_type = db.Column(db.String(50), default='Standard')  # Standard, Premium, Student
    status = db.Column(db.String(20), default='Active')  # Active, Suspended, Expired
    books_borrowed = db.Column(db.Integer, default=0)
    total_fines = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    transactions = db.relationship('Transaction', backref='member', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'member_id': self.member_id,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'membership_type': self.membership_type,
            'status': self.status,
            'books_borrowed': self.books_borrowed,
            'total_fines': self.total_fines,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Member {self.full_name}>'
