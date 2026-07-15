from flask import Blueprint, request, jsonify, session
from werkzeug.security import check_password_hash, generate_password_hash
from models.admin import Admin
from database import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required'}), 400
    
    admin = Admin.query.filter_by(username=data['username']).first()
    if not admin or not check_password_hash(admin.password, data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    session['admin_id'] = admin.id
    session['admin_username'] = admin.username
    return jsonify({
        'message': 'Login successful',
        'admin': admin.to_dict()
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    if 'admin_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    admin = Admin.query.get(session['admin_id'])
    if not admin:
        return jsonify({'error': 'Admin not found'}), 404
    return jsonify({'admin': admin.to_dict()}), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required = ['username', 'password', 'email', 'full_name']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    if Admin.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    if Admin.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    admin = Admin(
        username=data['username'],
        password=generate_password_hash(data['password']),
        email=data['email'],
        full_name=data['full_name']
    )
    db.session.add(admin)
    db.session.commit()
    return jsonify({'message': 'Admin registered', 'admin': admin.to_dict()}), 201

@auth_bp.route('/check', methods=['GET'])
def check_auth():
    if 'admin_id' in session:
        return jsonify({'authenticated': True, 'admin_id': session['admin_id']}), 200
    return jsonify({'authenticated': False}), 200
