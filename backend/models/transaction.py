from database import db
from datetime import datetime, timedelta
from config import Config

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    transaction_id = db.Column(db.String(30), unique=True, nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # borrow, return
    borrow_date = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.DateTime)
    return_date = db.Column(db.DateTime, nullable=True)
    fine_amount = db.Column(db.Float, default=0.0)
    fine_paid = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='Active')  # Active, Returned, Overdue
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def calculate_fine(self):
        if self.return_date and self.due_date and self.return_date > self.due_date:
            overdue_days = (self.return_date - self.due_date).days
            return overdue_days * Config.FINE_PER_DAY
        elif not self.return_date and datetime.utcnow() > self.due_date:
            overdue_days = (datetime.utcnow() - self.due_date).days
            return overdue_days * Config.FINE_PER_DAY
        return 0.0
    
    def to_dict(self):
        return {
            'id': self.id,
            'transaction_id': self.transaction_id,
            'book_id': self.book_id,
            'member_id': self.member_id,
            'book_title': self.book.title if self.book else None,
            'book_author': self.book.author if self.book else None,
            'member_name': self.member.full_name if self.member else None,
            'member_member_id': self.member.member_id if self.member else None,
            'transaction_type': self.transaction_type,
            'borrow_date': self.borrow_date.isoformat() if self.borrow_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'return_date': self.return_date.isoformat() if self.return_date else None,
            'fine_amount': self.fine_amount,
            'fine_paid': self.fine_paid,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Transaction {self.transaction_id}>'
