from flask import Blueprint, jsonify, request, session
from src.models.user import User, Integration, WebhookLog, db
from datetime import datetime
import requests
import json

integrations_bp = Blueprint('integrations', __name__)

def require_auth():
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user = User.query.get(session['user_id'])
    if not user or not user.is_active:
        session.clear()
        return jsonify({'error': 'User not found or inactive'}), 401
    
    return user

@integrations_bp.route('/integrations', methods=['GET'])
def get_integrations():
    user = require_auth()
    if isinstance(user, tuple):  # Error response
        return user
    
    integrations = Integration.query.filter_by(user_id=user.id).all()
    return jsonify([integration.to_dict() for integration in integrations])

@integrations_bp.route('/integrations', methods=['POST'])
def create_integration():
    user = require_auth()
    if isinstance(user, tuple):  # Error response
        return user
    
    try:
        data = request.get_json()
        
        if not data or not data.get('service_name') or not data.get('display_name'):
            return jsonify({'error': 'Service name and display name are required'}), 400
        
        service_name = data['service_name'].lower()
        if service_name not in ['twilio', 'gohighlevel', 'zapier', 'make']:
            return jsonify({'error': 'Invalid service name'}), 400
        
        # Check if integration already exists for this service
        existing = Integration.query.filter_by(
            user_id=user.id, 
            service_name=service_name
        ).first()
        
        if existing:
            return jsonify({'error': f'{service_name.title()} integration already exists'}), 409
        
        integration = Integration(
            user_id=user.id,
            service_name=service_name,
            display_name=data['display_name'],
            webhook_url=data.get('webhook_url', ''),
            is_active=data.get('is_active', True)
        )
        
        # Set service-specific configuration
        config_data = data.get('config_data', {})
        integration.set_config(config_data)
        
        db.session.add(integration)
        db.session.commit()
        
        return jsonify({
            'message': 'Integration created successfully',
            'integration': integration.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create integration'}), 500

@integrations_bp.route('/integrations/<int:integration_id>', methods=['GET'])
def get_integration(integration_id):
    user = require_auth()
    if isinstance(user, tuple):  # Error response
        return user
    
    integration = Integration.query.filter_by(
        id=integration_id, 
        user_id=user.id
    ).first()
    
    if not integration:
        return jsonify({'error': 'Integration not found'}), 404
    
    return jsonify(integration.to_dict())

@integrations_bp.route('/integrations/<int:integration_id>', methods=['PUT'])
def update_integration(integration_id):
    user = require_auth()
    if isinstance(user, tuple):  # Error response
        return user
    
    try:
        integration = Integration.query.filter_by(
            id=integration_id, 
            user_id=user.id
        ).first()
        
        if not integration:
            return jsonify({'error': 'Integration not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'display_name' in data:
            integration.display_name = data['display_name']
        if 'webhook_url' in data:
            integration.webhook_url = data['webhook_url']
        if 'is_active' in data:
            integration.is_active = data['is_active']
        if 'config_data' in data:
            integration.set_config(data['config_data'])
        
        integration.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Integration updated successfully',
            'integration': integration.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update integration'}), 500

@integrations_bp.route('/integrations/<int:integration_id>', methods=['DELETE'])
def delete_integration(integration_id):
    user = require_auth()
    if isinstance(user, tuple):  # Error response
        return user
    
    try:
        integration = Integration.query.filter_by(
            id=integration_id, 
            user_id=user.id
        ).first()
        
        if not integration:
            return jsonify({'error': 'Integration not found'}), 404
        
        db.session.delete(integration)
        db.session.commit()
        
        return jsonify({'message': 'Integration deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete integration'}), 500

@integrations_bp.route('/integrations/<int:integration_id>/test', methods=['POST'])
def test_integration(integration_id):
    user = require_auth()
    if isinstance(user, tuple):  # Error response
        return user
    
    try:
        integration = Integration.query.filter_by(
            id=integration_id, 
            user_id=user.id
        ).first()
        
        if not integration:
            return jsonify({'error': 'Integration not found'}), 404
        
        if not integration.is_active:
            return jsonify({'error': 'Integration is not active'}), 400
        
        config = integration.get_config()
        service_name = integration.service_name
        
        # Test based on service type
        if service_name == 'twilio':
            return test_twilio_integration(config)
        elif service_name == 'gohighlevel':
            return test_gohighlevel_integration(config)
        elif service_name == 'zapier':
            return test_zapier_integration(integration.webhook_url)
        elif service_name == 'make':
            return test_make_integration(integration.webhook_url)
        else:
            return jsonify({'error': 'Unknown service type'}), 400
            
    except Exception as e:
        return jsonify({'error': 'Test failed', 'details': str(e)}), 500

def test_twilio_integration(config):
    """Test Twilio integration by validating credentials"""
    try:
        account_sid = config.get('account_sid')
        auth_token = config.get('auth_token')
        
        if not account_sid or not auth_token:
            return jsonify({'error': 'Twilio credentials missing'}), 400
        
        # Test API call to Twilio
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        
        # Try to fetch account info
        account = client.api.accounts(account_sid).fetch()
        
        return jsonify({
            'status': 'success',
            'message': 'Twilio integration test successful',
            'account_name': account.friendly_name
        })
        
    except Exception as e:
        return jsonify({
            'status': 'failed',
            'message': 'Twilio integration test failed',
            'error': str(e)
        }), 400

def test_gohighlevel_integration(config):
    """Test GoHighLevel integration by making API call"""
    try:
        api_token = config.get('api_token')
        
        if not api_token:
            return jsonify({'error': 'GoHighLevel API token missing'}), 400
        
        # Test API call to GoHighLevel
        headers = {
            'Authorization': f'Bearer {api_token}',
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            'https://services.leadconnectorhq.com/locations/',
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            return jsonify({
                'status': 'success',
                'message': 'GoHighLevel integration test successful'
            })
        else:
            return jsonify({
                'status': 'failed',
                'message': 'GoHighLevel integration test failed',
                'error': f'API returned status {response.status_code}'
            }), 400
            
    except Exception as e:
        return jsonify({
            'status': 'failed',
            'message': 'GoHighLevel integration test failed',
            'error': str(e)
        }), 400

def test_zapier_integration(webhook_url):
    """Test Zapier integration by sending test webhook"""
    try:
        if not webhook_url:
            return jsonify({'error': 'Zapier webhook URL missing'}), 400
        
        test_payload = {
            'test': True,
            'message': 'Test webhook from Peakwave Digital Solutions',
            'timestamp': datetime.utcnow().isoformat()
        }
        
        response = requests.post(
            webhook_url,
            json=test_payload,
            timeout=10
        )
        
        if response.status_code in [200, 201, 202]:
            return jsonify({
                'status': 'success',
                'message': 'Zapier webhook test successful'
            })
        else:
            return jsonify({
                'status': 'failed',
                'message': 'Zapier webhook test failed',
                'error': f'Webhook returned status {response.status_code}'
            }), 400
            
    except Exception as e:
        return jsonify({
            'status': 'failed',
            'message': 'Zapier webhook test failed',
            'error': str(e)
        }), 400

def test_make_integration(webhook_url):
    """Test Make.com integration by sending test webhook"""
    try:
        if not webhook_url:
            return jsonify({'error': 'Make.com webhook URL missing'}), 400
        
        test_payload = {
            'test': True,
            'message': 'Test webhook from Peakwave Digital Solutions',
            'timestamp': datetime.utcnow().isoformat()
        }
        
        response = requests.post(
            webhook_url,
            json=test_payload,
            timeout=10
        )
        
        if response.status_code in [200, 201, 202]:
            return jsonify({
                'status': 'success',
                'message': 'Make.com webhook test successful'
            })
        else:
            return jsonify({
                'status': 'failed',
                'message': 'Make.com webhook test failed',
                'error': f'Webhook returned status {response.status_code}'
            }), 400
            
    except Exception as e:
        return jsonify({
            'status': 'failed',
            'message': 'Make.com webhook test failed',
            'error': str(e)
        }), 400

@integrations_bp.route('/webhook-logs', methods=['GET'])
def get_webhook_logs():
    user = require_auth()
    if isinstance(user, tuple):  # Error response
        return user
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    service = request.args.get('service', '')
    
    query = WebhookLog.query.filter_by(user_id=user.id)
    
    if service:
        query = query.filter_by(service_name=service)
    
    logs = query.order_by(WebhookLog.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'logs': [log.to_dict() for log in logs.items],
        'total': logs.total,
        'pages': logs.pages,
        'current_page': page
    })

