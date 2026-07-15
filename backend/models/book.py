from database import db
from datetime import datetime

class Book(db.Model):
    __tablename__ = 'books'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255), nullable=False)
    isbn = db.Column(db.String(20), unique=True, nullable=False)
    genre = db.Column(db.String(100))
    quantity = db.Column(db.Integer, default=1)
    available = db.Column(db.Integer, default=1)
    published_year = db.Column(db.Integer)
    description = db.Column(db.Text)
    cover_image = db.Column(db.String(500), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    transactions = db.relationship('Transaction', backref='book', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'author': self.author,
            'isbn': self.isbn,
            'genre': self.genre,
            'quantity': self.quantity,
            'available': self.available,
            'published_year': self.published_year,
            'description': self.description,
            'cover_image': self.cover_image,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Book {self.title}>'
