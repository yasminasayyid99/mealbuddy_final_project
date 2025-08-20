from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user import User
from database import db
from utils.validators import validate_email, validate_password

auth_bp = Blueprint('auth', __name__)

# ----------------------------
# Register a new user
# ----------------------------
@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        errors = {}

        # Required checks
        if not username:
            errors["username"] = "Username is required"
        if not email:
            errors["email"] = "Email is required"
        if not password:
            errors["password"] = "Password is required"

        # Format checks
        if email and not validate_email(email):
            errors["email"] = "Invalid email format"
        if password and not validate_password(password):
            errors["password"] = "Password must be at least 6 characters long"

        # Duplicate checks
        if email and User.query.filter_by(email=email).first():
            errors["email"] = "Email already registered"
        if username and User.query.filter_by(username=username).first():
            errors["username"] = "Username already taken"

        # If any validation fails
        if errors:
            return jsonify({"error": "ValidationError", "fields": errors}), 400

        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(identity=user.id)

        return jsonify({
            "message": "User registered successfully",
            "token": access_token,
            "user": user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ----------------------------
# Logout
# ----------------------------
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    try:
        # JWT logout is usually handled client-side (remove token)
        return jsonify({"message": "Logout successful"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ----------------------------
# Login
# ----------------------------
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({"error": "ValidationError", "fields": {"email": "Email required", "password": "Password required"}}), 400

        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            return jsonify({"error": "Invalid email or password"}), 401

        access_token = create_access_token(identity=user.id)

        return jsonify({
            "message": "Login successful",
            "token": access_token,
            "user": user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ----------------------------
# Get Profile
# ----------------------------
@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({'user': user.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ----------------------------
# Update Profile
# ----------------------------
@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()
        errors = {}

        if "username" in data:
            existing_user = User.query.filter_by(username=data["username"]).first()
            if existing_user and existing_user.id != user.id:
                errors["username"] = "Username already taken"
            elif not data["username"].strip():
                errors["username"] = "Username cannot be empty"

        if "email" in data:
            if not validate_email(data["email"]):
                errors["email"] = "Invalid email format"
            else:
                existing_user = User.query.filter_by(email=data["email"]).first()
                if existing_user and existing_user.id != user.id:
                    errors["email"] = "Email already registered"

        if errors:
            return jsonify({"error": "ValidationError", "fields": errors}), 400

        # Apply updates
        if "username" in data:
            user.username = data["username"].strip()
        if "email" in data:
            user.email = data["email"].strip().lower()
        if "bio" in data:
            user.bio = data["bio"]
        if "dietary_preferences" in data:
            user.dietary_preferences = data["dietary_preferences"]
        if "location" in data:
            user.location = data["location"]

        db.session.commit()

        return jsonify({
            "message": "Profile updated successfully",
            "user": user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
