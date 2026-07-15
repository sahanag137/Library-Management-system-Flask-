from flask import Blueprint, request, jsonify
from models.transaction import Transaction
from models.book import Book
from models.member import Member
from database import db
from datetime import datetime, timedelta
from config import Config
import random
import string

transactions_bp = Blueprint('transactions', __name__)

def generate_transaction_id():
    return 'TXN' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

@transactions_bp.route('/', methods=['GET'])
def get_transactions():
    status = request.args.get('status', '')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    query = Transaction.query.order_by(Transaction.created_at.desc())
    if status:
        query = query.filter(Transaction.status == status)
    
    transactions = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'transactions': [t.to_dict() for t in transactions.items],
        'total': transactions.total,
        'pages': transactions.pages,
        'current_page': page
    }), 200

@transactions_bp.route('/borrow', methods=['POST'])
def borrow_book():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required = ['book_id', 'member_id']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    book = Book.query.get(data['book_id'])
    if not book:
        return jsonify({'error': 'Book not found'}), 404
    if book.available <= 0:
        return jsonify({'error': 'No copies available for borrowing'}), 400
    
    member = Member.query.get(data['member_id'])
    if not member:
        return jsonify({'error': 'Member not found'}), 404
    if member.status != 'Active':
        return jsonify({'error': 'Member account is not active'}), 400
    
    # Check if member already has this book
    existing = Transaction.query.filter_by(
        book_id=data['book_id'],
        member_id=data['member_id'],
        status='Active'
    ).first()
    if existing:
        return jsonify({'error': 'Member already has this book borrowed'}), 400
    
    txn_id = generate_transaction_id()
    while Transaction.query.filter_by(transaction_id=txn_id).first():
        txn_id = generate_transaction_id()
    
    borrow_date = datetime.utcnow()
    due_date = borrow_date + timedelta(days=Config.LOAN_PERIOD_DAYS)
    
    transaction = Transaction(
        transaction_id=txn_id,
        book_id=data['book_id'],
        member_id=data['member_id'],
        transaction_type='borrow',
        borrow_date=borrow_date,
        due_date=due_date,
        status='Active',
        notes=data.get('notes', '')
    )
    
    book.available -= 1
    member.books_borrowed += 1
    
    db.session.add(transaction)
    db.session.commit()
    return jsonify({'message': 'Book borrowed successfully', 'transaction': transaction.to_dict()}), 201

@transactions_bp.route('/return/<int:transaction_id>', methods=['PUT'])
def return_book(transaction_id):
    transaction = Transaction.query.get_or_404(transaction_id)
    
    if transaction.status == 'Returned':
        return jsonify({'error': 'This book has already been returned'}), 400
    
    return_date = datetime.utcnow()
    transaction.return_date = return_date
    transaction.status = 'Returned'
    transaction.transaction_type = 'return'
    
    fine = transaction.calculate_fine()
    transaction.fine_amount = fine
    
    book = Book.query.get(transaction.book_id)
    if book:
        book.available += 1
    
    member = Member.query.get(transaction.member_id)
    if member:
        member.books_borrowed = max(0, member.books_borrowed - 1)
        member.total_fines += fine
    
    db.session.commit()
    return jsonify({
        'message': 'Book returned successfully',
        'transaction': transaction.to_dict(),
        'fine_amount': fine
    }), 200

@transactions_bp.route('/overdue', methods=['GET'])
def get_overdue():
    now = datetime.utcnow()
    overdue = Transaction.query.filter(
        Transaction.status == 'Active',
        Transaction.due_date < now
    ).all()
    
    for t in overdue:
        t.status = 'Overdue'
    db.session.commit()
    
    return jsonify({
        'overdue_transactions': [t.to_dict() for t in overdue],
        'count': len(overdue)
    }), 200

@transactions_bp.route('/stats', methods=['GET'])
def get_transaction_stats():
    total = Transaction.query.count()
    active = Transaction.query.filter_by(status='Active').count()
    returned = Transaction.query.filter_by(status='Returned').count()
    overdue = Transaction.query.filter_by(status='Overdue').count()
    
    now = datetime.utcnow()
    overdue_active = Transaction.query.filter(
        Transaction.status == 'Active',
        Transaction.due_date < now
    ).count()
    
    total_fines = db.session.query(
        db.func.sum(Transaction.fine_amount)
    ).scalar() or 0
    
    return jsonify({
        'total_transactions': total,
        'active_borrowings': active,
        'returned': returned,
        'overdue': overdue + overdue_active,
        'total_fines_collected': total_fines
    }), 200

@transactions_bp.route('/dashboard', methods=['GET'])
def get_dashboard_stats():
    from models.book import Book
    from models.member import Member
    
    total_books = Book.query.count()
    total_members = Member.query.count()
    active_borrows = Transaction.query.filter_by(status='Active').count()
    
    now = datetime.utcnow()
    overdue_count = Transaction.query.filter(
        Transaction.status.in_(['Active', 'Overdue']),
        Transaction.due_date < now
    ).count()
    
    total_copies = db.session.query(db.func.sum(Book.quantity)).scalar() or 0
    available_copies = db.session.query(db.func.sum(Book.available)).scalar() or 0
    
    return jsonify({
        'total_books': total_books,
        'total_members': total_members,
        'active_borrows': active_borrows,
        'overdue_count': overdue_count,
        'total_copies': total_copies,
        'available_copies': available_copies
    }), 200
