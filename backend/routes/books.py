from flask import Blueprint, request, jsonify
from models.book import Book
from database import db
from sqlalchemy import or_

books_bp = Blueprint('books', __name__)

@books_bp.route('/', methods=['GET'])
def get_books():
    search = request.args.get('search', '')
    genre = request.args.get('genre', '')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    query = Book.query
    if search:
        query = query.filter(
            or_(Book.title.ilike(f'%{search}%'),
                Book.author.ilike(f'%{search}%'),
                Book.isbn.ilike(f'%{search}%'))
        )
    if genre:
        query = query.filter(Book.genre.ilike(f'%{genre}%'))
    
    books = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'books': [b.to_dict() for b in books.items],
        'total': books.total,
        'pages': books.pages,
        'current_page': page
    }), 200

@books_bp.route('/<int:book_id>', methods=['GET'])
def get_book(book_id):
    book = Book.query.get_or_404(book_id)
    return jsonify({'book': book.to_dict()}), 200

@books_bp.route('/', methods=['POST'])
def create_book():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required = ['title', 'author', 'isbn']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    if Book.query.filter_by(isbn=data['isbn']).first():
        return jsonify({'error': 'Book with this ISBN already exists'}), 409
    
    qty = data.get('quantity', 1)
    book = Book(
        title=data['title'],
        author=data['author'],
        isbn=data['isbn'],
        genre=data.get('genre', ''),
        quantity=qty,
        available=qty,
        published_year=data.get('published_year'),
        description=data.get('description', ''),
        cover_image=data.get('cover_image', '')
    )
    db.session.add(book)
    db.session.commit()
    return jsonify({'message': 'Book created successfully', 'book': book.to_dict()}), 201

@books_bp.route('/<int:book_id>', methods=['PUT'])
def update_book(book_id):
    book = Book.query.get_or_404(book_id)
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    if 'title' in data: book.title = data['title']
    if 'author' in data: book.author = data['author']
    if 'genre' in data: book.genre = data['genre']
    if 'published_year' in data: book.published_year = data['published_year']
    if 'description' in data: book.description = data['description']
    if 'cover_image' in data: book.cover_image = data['cover_image']
    if 'quantity' in data:
        diff = data['quantity'] - book.quantity
        book.quantity = data['quantity']
        book.available = max(0, book.available + diff)
    
    db.session.commit()
    return jsonify({'message': 'Book updated successfully', 'book': book.to_dict()}), 200

@books_bp.route('/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    book = Book.query.get_or_404(book_id)
    if book.available < book.quantity:
        return jsonify({'error': 'Cannot delete: some copies are currently borrowed'}), 400
    db.session.delete(book)
    db.session.commit()
    return jsonify({'message': 'Book deleted successfully'}), 200

@books_bp.route('/genres', methods=['GET'])
def get_genres():
    genres = db.session.query(Book.genre).distinct().filter(Book.genre != '').all()
    return jsonify({'genres': [g[0] for g in genres]}), 200

@books_bp.route('/stats', methods=['GET'])
def get_book_stats():
    total_books = Book.query.count()
    total_copies = db.session.query(db.func.sum(Book.quantity)).scalar() or 0
    available_copies = db.session.query(db.func.sum(Book.available)).scalar() or 0
    borrowed_copies = total_copies - available_copies
    return jsonify({
        'total_books': total_books,
        'total_copies': total_copies,
        'available_copies': available_copies,
        'borrowed_copies': borrowed_copies
    }), 200
