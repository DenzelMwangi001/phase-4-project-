from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
from extensions import db, bcrypt
from utils import generate_token, login_required
from models import User, Skill, Swap

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)
    CORS(app)

    # ---------- HOME ----------
    @app.route('/')
    def index():
        return {'message': 'Welcome to SkillSwap API!'}

    # ---------- AUTH ----------
    @app.route('/signup', methods=['POST'])
    def signup():
        data = request.get_json()
        username, email, password = data.get('username'), data.get('email'), data.get('password')

        if not username or not email or not password:
            return {'error': 'All fields required'}, 400

        if User.query.filter((User.username == username) | (User.email == email)).first():
            return {'error': 'Username or email already exists'}, 400

        hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(username=username, email=email, password_hash=hashed_pw)
        db.session.add(user)
        db.session.commit()

        token = generate_token(user.id)

        return {
            'message': 'User created',
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }

    @app.route('/login', methods=['POST'])
    def login():
        data = request.get_json()
        email, password = data.get('email'), data.get('password')

        user = User.query.filter_by(email=email).first()
        if not user or not bcrypt.check_password_hash(user.password_hash, password):
            return {'error': 'Invalid credentials'}, 401

        token = generate_token(user.id)

        return {
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }

    # ---------- SKILLS ----------
    @app.route('/skills', methods=['GET'])
    def get_skills():
        skills = Skill.query.all()
        return jsonify([{
            'id': s.id,
            'name': s.name,
            'description': s.description,
            'user_id': s.user_id
        } for s in skills])

    @app.route('/skills', methods=['POST'])
    @login_required
    def create_skill(user_id):
        data = request.get_json()
        name = data.get('name')
        description = data.get('description')

        if not name:
            return {'error': 'Name required'}, 400

        skill = Skill(name=name, description=description, user_id=user_id)
        db.session.add(skill)
        db.session.commit()

        return {'message': 'Skill created', 'skill': {
            'id': skill.id,
            'name': skill.name,
            'description': skill.description,
            'user_id': skill.user_id
        }}

    # ---------- SWAPS ----------
    @app.route('/swaps', methods=['POST'])
    @login_required
    def create_swap(user_id):
        data = request.get_json()
        receiver_id = data.get('receiver_id')
        skill_id = data.get('skill_id')
        message = data.get('message')

        if not receiver_id or not skill_id or not message:
            return {'error': 'All fields required'}, 400

        swap = Swap(
            sender_id=user_id,
            receiver_id=receiver_id,
            skill_id=skill_id,
            message=message,
            status='pending'
        )
        db.session.add(swap)
        db.session.commit()

        return {
            'message': 'Swap request sent',
            'swap': {
                'id': swap.id,
                'sender_id': swap.sender_id,
                'receiver_id': swap.receiver_id,
                'skill_id': swap.skill_id,
                'message': swap.message,
                'status': swap.status
            }
        }

    @app.route('/swaps', methods=['GET'])
    @login_required
    def get_swaps(user_id):
        swap_type = request.args.get('type')

        if swap_type == 'sent':
            swaps = Swap.query.filter_by(sender_id=user_id).all()
        else:  # Default is 'received'
            swaps = Swap.query.filter_by(receiver_id=user_id).all()

        result = []
        for s in swaps:
            swap_data = {
                'id': s.id,
                'sender_id': s.sender_id,
                'receiver_id': s.receiver_id,
                'skill_id': s.skill_id,
                'message': s.message,
                'status': s.status
            }

            # Include skill name (optional)
            skill = Skill.query.get(s.skill_id)
            if skill:
                swap_data['skill_name'] = skill.name

            # Include the other user's email if accepted
            if s.status == 'accepted':
                if swap_type == 'sent':
                    other_user = User.query.get(s.receiver_id)
                else:
                    other_user = User.query.get(s.sender_id)

                if other_user:
                    swap_data['user_email'] = other_user.email

            result.append(swap_data)

        return jsonify(result)

    # ---------- UPDATE SWAP STATUS (Accept / Reject) ----------
    @app.route('/swaps/<int:swap_id>', methods=['PATCH'])
    @login_required
    def update_swap_status(user_id, swap_id):
        data = request.get_json()
        new_status = data.get('status')

        if new_status not in ['accepted', 'rejected']:
            return {'error': 'Invalid status. Use accepted or rejected.'}, 400

        swap = Swap.query.get(swap_id)

        if not swap:
            return {'error': 'Swap not found.'}, 404

        if swap.receiver_id != user_id:
            return {'error': 'Unauthorized. Only the receiver can update this swap.'}, 403

        if swap.status != 'pending':
            return {'error': f'Cannot update. Already {swap.status}.'}, 400

        swap.status = new_status
        db.session.commit()

        return {'message': f'Swap {new_status} successfully.'}

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
