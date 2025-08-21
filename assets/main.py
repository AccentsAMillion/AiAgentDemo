import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.integrations import integrations_bp
from src.routes.webhooks import webhooks_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'peakwave_digital_solutions_secret_key_2025'

# Enable CORS for all routes
CORS(app, supports_credentials=True)

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(integrations_bp, url_prefix='/api')
app.register_blueprint(webhooks_bp, url_prefix='/api')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()
    
    # Create test user if none exists
    from src.models.user import User
    if not User.query.first():
        test_user = User(
            email='test@peakwave.com',
            first_name='Test',
            last_name='User'
        )
        test_user.set_password('TestPassword123')
        db.session.add(test_user)
        db.session.commit()
        print("Created test user: test@peakwave.com / TestPassword123")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

@app.route('/health', methods=['GET'])
def health_check():
    return {'status': 'healthy', 'service': 'Peakwave Members Backend'}, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

