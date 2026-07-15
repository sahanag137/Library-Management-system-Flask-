from flask import Flask
from flask_cors import CORS
from config import Config
from database import db
from routes.books import books_bp
from routes.members import members_bp
from routes.transactions import transactions_bp
from routes.auth import auth_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    CORS(app, origins=["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000", "null"], supports_credentials=True)
    
    db.init_app(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(books_bp, url_prefix='/api/books')
    app.register_blueprint(members_bp, url_prefix='/api/members')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    
    with app.app_context():
        db.create_all()
        seed_data()
    
    return app

def seed_data():
    from models.book import Book
    from models.member import Member
    from models.admin import Admin
    from werkzeug.security import generate_password_hash
    
    # Seed admin
    if not Admin.query.first():
        admin = Admin(
            username='admin',
            password=generate_password_hash('admin123'),
            email='admin@library.com',
            full_name='System Administrator'
        )
        db.session.add(admin)
    
    # Seed sample books
    if not Book.query.first():
        sample_books = [
            Book(title='The Great Gatsby', author='F. Scott Fitzgerald', isbn='978-0-7432-7356-5', genre='Fiction', quantity=5, available=5, published_year=1925, description='A novel about the American Dream set in the Jazz Age.'),
            Book(title='To Kill a Mockingbird', author='Harper Lee', isbn='978-0-06-112008-4', genre='Fiction', quantity=4, available=4, published_year=1960, description='A story of racial injustice and childhood innocence.'),
            Book(title='1984', author='George Orwell', isbn='978-0-452-28423-4', genre='Dystopian', quantity=6, available=6, published_year=1949, description='A dystopian novel about totalitarianism and surveillance.'),
            Book(title='Pride and Prejudice', author='Jane Austen', isbn='978-0-14-143951-8', genre='Romance', quantity=3, available=3, published_year=1813, description='A romantic novel about manners and matrimony.'),
            Book(title='The Hobbit', author='J.R.R. Tolkien', isbn='978-0-547-92822-7', genre='Fantasy', quantity=5, available=5, published_year=1937, description='A fantasy novel about a hobbit\'s adventure.'),
            Book(title='Harry Potter and the Sorcerer\'s Stone', author='J.K. Rowling', isbn='978-0-590-35340-3', genre='Fantasy', quantity=7, available=7, published_year=1997, description='The first book in the Harry Potter series.'),
            Book(title='The Alchemist', author='Paulo Coelho', isbn='978-0-06-112241-5', genre='Philosophical', quantity=4, available=4, published_year=1988, description='A novel about following your dreams.'),
            Book(title='Sapiens', author='Yuval Noah Harari', isbn='978-0-06-231609-7', genre='Non-Fiction', quantity=3, available=3, published_year=2011, description='A brief history of humankind.'),
        ]
        db.session.add_all(sample_books)
    
    db.session.commit()

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
