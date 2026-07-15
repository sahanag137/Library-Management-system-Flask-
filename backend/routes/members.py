from flask import Blueprint, request, jsonify
from models.member import Member
from database import db
from sqlalchemy import or_
import random
import string

members_bp = Blueprint('members', __name__)

def generate_member_id():
    return 'LIB' + ''.join(random.choices(string.digits, k=6))

@members_bp.route('/', methods=['GET'])
def get_members():
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    query = Member.query
    if search:
        query = query.filter(
            or_(Member.full_name.ilike(f'%{search}%'),
                Member.email.ilike(f'%{search}%'),
                Member.member_id.ilike(f'%{search}%'))
        )
    if status:
        query = query.filter(Member.status == status)
    
    members = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'members': [m.to_dict() for m in members.items],
        'total': members.total,
        'pages': members.pages,
        'current_page': page
    }), 200

@members_bp.route('/<int:member_id>', methods=['GET'])
def get_member(member_id):
    member = Member.query.get_or_404(member_id)
    return jsonify({'member': member.to_dict()}), 200

@members_bp.route('/', methods=['POST'])
def create_member():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required = ['full_name', 'email']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    if Member.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Member with this email already exists'}), 409
    
    member_id = generate_member_id()
    while Member.query.filter_by(member_id=member_id).first():
        member_id = generate_member_id()
    
    member = Member(
        member_id=member_id,
        full_name=data['full_name'],
        email=data['email'],
        phone=data.get('phone', ''),
        address=data.get('address', ''),
        membership_type=data.get('membership_type', 'Standard'),
        status='Active'
    )
    db.session.add(member)
    db.session.commit()
    return jsonify({'message': 'Member created successfully', 'member': member.to_dict()}), 201

@members_bp.route('/<int:member_id>', methods=['PUT'])
def update_member(member_id):
    member = Member.query.get_or_404(member_id)
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    if 'full_name' in data: member.full_name = data['full_name']
    if 'phone' in data: member.phone = data['phone']
    if 'address' in data: member.address = data['address']
    if 'membership_type' in data: member.membership_type = data['membership_type']
    if 'status' in data: member.status = data['status']
    
    db.session.commit()
    return jsonify({'message': 'Member updated successfully', 'member': member.to_dict()}), 200

@members_bp.route('/<int:member_id>', methods=['DELETE'])
def delete_member(member_id):
    member = Member.query.get_or_404(member_id)
    if member.books_borrowed > 0:
        return jsonify({'error': 'Cannot delete member with active borrowed books'}), 400
    db.session.delete(member)
    db.session.commit()
    return jsonify({'message': 'Member deleted successfully'}), 200

@members_bp.route('/stats', methods=['GET'])
def get_member_stats():
    total = Member.query.count()
    active = Member.query.filter_by(status='Active').count()
    suspended = Member.query.filter_by(status='Suspended').count()
    return jsonify({
        'total_members': total,
        'active_members': active,
        'suspended_members': suspended
    }), 200
