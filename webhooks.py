from flask import Blueprint, jsonify, request
from src.models.user import User, Integration, WebhookLog, db
from datetime import datetime
import json
import hmac
import hashlib

webhooks_bp = Blueprint('webhooks', __name__)

@webhooks_bp.route('/webhooks/twilio', methods=['POST'])
def handle_twilio_webhook():
    """Handle incoming webhooks from Twilio"""
    try:
        # Get the raw data
        data = request.get_data(as_text=True)
        
        # Log the webhook
        log_webhook('twilio', 'incoming_webhook', request.form.to_dict())
        
        # Process Twilio webhook data
        event_type = request.form.get('MessageStatus', 'unknown')
        
        # Handle different Twilio events
        if event_type in ['delivered', 'sent', 'failed']:
            # Process SMS status update
            process_twilio_sms_status(request.form.to_dict())
        elif 'CallStatus' in request.form:
            # Process call status update
            process_twilio_call_status(request.form.to_dict())
        
        return jsonify({'status': 'success'}), 200
        
    except Exception as e:
        log_webhook('twilio', 'webhook_error', {'error': str(e)}, status='failed')
        return jsonify({'error': 'Webhook processing failed'}), 500

@webhooks_bp.route('/webhooks/gohighlevel', methods=['POST'])
def handle_gohighlevel_webhook():
    """Handle incoming webhooks from GoHighLevel"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data received'}), 400
        
        # Log the webhook
        log_webhook('gohighlevel', data.get('type', 'unknown'), data)
        
        # Process GoHighLevel webhook data
        event_type = data.get('type')
        
        if event_type == 'ContactCreate':
            process_ghl_contact_created(data)
        elif event_type == 'ContactUpdate':
            process_ghl_contact_updated(data)
        elif event_type == 'ConversationMessage':
            process_ghl_message_received(data)
        
        return jsonify({'status': 'success'}), 200
        
    except Exception as e:
        log_webhook('gohighlevel', 'webhook_error', {'error': str(e)}, status='failed')
        return jsonify({'error': 'Webhook processing failed'}), 500

@webhooks_bp.route('/webhooks/zapier', methods=['POST'])
def handle_zapier_webhook():
    """Handle incoming webhooks from Zapier"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data received'}), 400
        
        # Log the webhook
        log_webhook('zapier', data.get('event_type', 'unknown'), data)
        
        # Process Zapier webhook data
        event_type = data.get('event_type')
        
        if event_type == 'new_lead':
            process_zapier_new_lead(data)
        elif event_type == 'form_submission':
            process_zapier_form_submission(data)
        
        return jsonify({'status': 'success'}), 200
        
    except Exception as e:
        log_webhook('zapier', 'webhook_error', {'error': str(e)}, status='failed')
        return jsonify({'error': 'Webhook processing failed'}), 500

@webhooks_bp.route('/webhooks/make', methods=['POST'])
def handle_make_webhook():
    """Handle incoming webhooks from Make.com"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data received'}), 400
        
        # Log the webhook
        log_webhook('make', data.get('trigger', 'unknown'), data)
        
        # Process Make.com webhook data
        trigger_type = data.get('trigger')
        
        if trigger_type == 'contact_created':
            process_make_contact_created(data)
        elif trigger_type == 'automation_triggered':
            process_make_automation_triggered(data)
        
        return jsonify({'status': 'success'}), 200
        
    except Exception as e:
        log_webhook('make', 'webhook_error', {'error': str(e)}, status='failed')
        return jsonify({'error': 'Webhook processing failed'}), 500

def log_webhook(service_name, event_type, payload, status='success', user_id=None):
    """Log webhook events to database"""
    try:
        # If no user_id provided, try to find from payload or use test user
        if not user_id:
            # For demo purposes, use the first user or create a test user
            user = User.query.first()
            if not user:
                # Create test user if none exists
                user = User(
                    email='test@peakwave.com',
                    first_name='Test',
                    last_name='User'
                )
                user.set_password('TestPassword123')
                db.session.add(user)
                db.session.commit()
            user_id = user.id
        
        webhook_log = WebhookLog(
            user_id=user_id,
            service_name=service_name,
            event_type=event_type,
            status=status
        )
        webhook_log.set_payload(payload)
        
        db.session.add(webhook_log)
        db.session.commit()
        
    except Exception as e:
        print(f"Failed to log webhook: {e}")

def process_twilio_sms_status(data):
    """Process Twilio SMS status updates"""
    message_sid = data.get('MessageSid')
    status = data.get('MessageStatus')
    
    # Here you would typically update your database with the message status
    print(f"SMS {message_sid} status: {status}")

def process_twilio_call_status(data):
    """Process Twilio call status updates"""
    call_sid = data.get('CallSid')
    status = data.get('CallStatus')
    
    # Here you would typically update your database with the call status
    print(f"Call {call_sid} status: {status}")

def process_ghl_contact_created(data):
    """Process GoHighLevel contact creation"""
    contact_id = data.get('contactId')
    contact_data = data.get('contact', {})
    
    # Here you would typically sync the contact to your system
    print(f"New GHL contact created: {contact_id}")

def process_ghl_contact_updated(data):
    """Process GoHighLevel contact updates"""
    contact_id = data.get('contactId')
    contact_data = data.get('contact', {})
    
    # Here you would typically update the contact in your system
    print(f"GHL contact updated: {contact_id}")

def process_ghl_message_received(data):
    """Process GoHighLevel message received"""
    conversation_id = data.get('conversationId')
    message_data = data.get('message', {})
    
    # Here you would typically process the incoming message
    print(f"New GHL message in conversation: {conversation_id}")

def process_zapier_new_lead(data):
    """Process new lead from Zapier"""
    lead_data = data.get('lead', {})
    
    # Here you would typically create a new lead in your system
    print(f"New lead from Zapier: {lead_data.get('email', 'Unknown')}")

def process_zapier_form_submission(data):
    """Process form submission from Zapier"""
    form_data = data.get('form_data', {})
    
    # Here you would typically process the form submission
    print(f"Form submission from Zapier: {form_data}")

def process_make_contact_created(data):
    """Process contact creation from Make.com"""
    contact_data = data.get('data', {})
    
    # Here you would typically create a new contact in your system
    print(f"New contact from Make.com: {contact_data.get('email', 'Unknown')}")

def process_make_automation_triggered(data):
    """Process automation trigger from Make.com"""
    automation_data = data.get('data', {})
    
    # Here you would typically handle the automation trigger
    print(f"Automation triggered from Make.com: {automation_data}")

@webhooks_bp.route('/webhooks/test', methods=['POST'])
def test_webhook():
    """Test webhook endpoint for development"""
    try:
        data = request.get_json()
        service = request.args.get('service', 'test')
        
        log_webhook(service, 'test_webhook', data or {})
        
        return jsonify({
            'status': 'success',
            'message': 'Test webhook received',
            'data': data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

