// Global variables
let currentUser = null;
let integrations = [];
let logs = [];

// API base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is already logged in
    checkAuthStatus();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize navigation
    initializeNavigation();
}

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Registration form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Show/hide forms
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    
    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('registerContainer').style.display = 'flex';
        });
    }
    
    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('registerContainer').style.display = 'none';
            document.getElementById('loginContainer').style.display = 'flex';
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Navigation toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // Integration modal
    const addIntegrationBtn = document.getElementById('addIntegrationBtn');
    const integrationModal = document.getElementById('integrationModal');
    const closeModal = document.getElementById('closeModal');
    const cancelModal = document.getElementById('cancelModal');
    const integrationForm = document.getElementById('integrationForm');
    
    if (addIntegrationBtn) {
        addIntegrationBtn.addEventListener('click', () => openIntegrationModal());
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', () => closeIntegrationModal());
    }
    
    if (cancelModal) {
        cancelModal.addEventListener('click', () => closeIntegrationModal());
    }
    
    if (integrationForm) {
        integrationForm.addEventListener('submit', handleIntegrationSubmit);
    }
    
    // Service name change
    const serviceName = document.getElementById('serviceName');
    if (serviceName) {
        serviceName.addEventListener('change', handleServiceChange);
    }
    
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Password form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
}

function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Close mobile menu
            const navMenu = document.getElementById('navMenu');
            if (navMenu) {
                navMenu.classList.remove('active');
            }
        });
    });
}

// Authentication functions
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showMainContent();
            loadDashboardData();
        } else {
            showLoginForm();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showLoginForm();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(loginData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showToast('Login successful!', 'success');
            showMainContent();
            loadDashboardData();
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const registerData = {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(registerData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showToast('Registration successful!', 'success');
            showMainContent();
            loadDashboardData();
        } else {
            showToast(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Registration failed. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        currentUser = null;
        showToast('Logged out successfully', 'success');
        showLoginForm();
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Logout failed', 'error');
    }
}

// UI functions
function showLoginForm() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('registerContainer').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
}

function showMainContent() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('registerContainer').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    // Load user profile data
    if (currentUser) {
        loadProfileData();
    }
}

function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section-specific data
        switch (sectionName) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'integrations':
                loadIntegrations();
                break;
            case 'logs':
                loadLogs();
                break;
            case 'profile':
                loadProfileData();
                break;
        }
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('active', show);
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return 'fas fa-check-circle text-green';
        case 'error': return 'fas fa-exclamation-circle text-red';
        case 'warning': return 'fas fa-exclamation-triangle text-yellow';
        default: return 'fas fa-info-circle text-blue';
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        // Load integrations count
        const integrationsResponse = await fetch(`${API_BASE}/integrations`, {
            credentials: 'include'
        });
        
        if (integrationsResponse.ok) {
            const integrationsData = await integrationsResponse.json();
            integrations = integrationsData;
            
            const activeCount = integrations.filter(i => i.is_active).length;
            document.getElementById('totalIntegrations').textContent = activeCount;
        }
        
        // Load recent activity
        loadRecentActivity();
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

function loadRecentActivity() {
    const activityContainer = document.getElementById('recentActivity');
    if (!activityContainer) return;
    
    // For now, show welcome message
    activityContainer.innerHTML = `
        <div class="activity-item">
            <i class="fas fa-info-circle text-blue"></i>
            <span>Welcome to your Peakwave Members Area</span>
            <small>Just now</small>
        </div>
    `;
}

// Integration functions
async function loadIntegrations() {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/integrations`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            integrations = await response.json();
            renderIntegrations();
        } else {
            showToast('Failed to load integrations', 'error');
        }
    } catch (error) {
        console.error('Failed to load integrations:', error);
        showToast('Failed to load integrations', 'error');
    } finally {
        showLoading(false);
    }
}

function renderIntegrations() {
    const container = document.getElementById('integrationsGrid');
    if (!container) return;
    
    if (integrations.length === 0) {
        container.innerHTML = `
            <div class="integration-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-plug" style="font-size: 3rem; color: #cbd5e0; margin-bottom: 20px;"></i>
                <h3 style="color: #4a5568; margin-bottom: 10px;">No Integrations Yet</h3>
                <p style="color: #718096; margin-bottom: 20px;">Get started by adding your first integration</p>
                <button class="btn btn-primary" onclick="openIntegrationModal()">
                    <i class="fas fa-plus"></i> Add Integration
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = integrations.map(integration => `
        <div class="integration-card">
            <div class="integration-header">
                <div class="integration-icon ${integration.service_name}">
                    <i class="${getServiceIcon(integration.service_name)}"></i>
                </div>
                <span class="integration-status ${integration.is_active ? 'status-active' : 'status-inactive'}">
                    ${integration.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>
            
            <h4>${integration.display_name}</h4>
            <p style="color: #718096; font-size: 0.9rem; margin-bottom: 15px;">
                ${getServiceDescription(integration.service_name)}
            </p>
            
            <div class="integration-actions">
                <button class="btn btn-small btn-outline" onclick="testIntegration(${integration.id})">
                    <i class="fas fa-vial"></i> Test
                </button>
                <button class="btn btn-small btn-outline" onclick="editIntegration(${integration.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteIntegration(${integration.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function getServiceIcon(service) {
    const icons = {
        twilio: 'fas fa-sms',
        gohighlevel: 'fas fa-chart-line',
        zapier: 'fas fa-bolt',
        make: 'fas fa-cogs'
    };
    return icons[service] || 'fas fa-plug';
}

function getServiceDescription(service) {
    const descriptions = {
        twilio: 'SMS and voice call automation',
        gohighlevel: 'CRM and marketing automation',
        zapier: 'Workflow automation platform',
        make: 'Advanced automation scenarios'
    };
    return descriptions[service] || 'Integration service';
}

// Integration modal functions
function openIntegrationModal(integrationId = null) {
    const modal = document.getElementById('integrationModal');
    const form = document.getElementById('integrationForm');
    const title = document.getElementById('modalTitle');
    
    if (integrationId) {
        // Edit mode
        const integration = integrations.find(i => i.id === integrationId);
        if (integration) {
            title.textContent = 'Edit Integration';
            populateIntegrationForm(integration);
        }
    } else {
        // Add mode
        title.textContent = 'Add Integration';
        form.reset();
        document.getElementById('integrationId').value = '';
        document.getElementById('serviceConfig').innerHTML = '';
    }
    
    modal.classList.add('active');
}

function closeIntegrationModal() {
    const modal = document.getElementById('integrationModal');
    modal.classList.remove('active');
}

function populateIntegrationForm(integration) {
    document.getElementById('integrationId').value = integration.id;
    document.getElementById('serviceName').value = integration.service_name;
    document.getElementById('displayName').value = integration.display_name;
    document.getElementById('webhookUrl').value = integration.webhook_url || '';
    
    // Trigger service change to load config
    handleServiceChange();
    
    // Populate config data
    const config = integration.config_data || {};
    Object.keys(config).forEach(key => {
        const input = document.getElementById(key);
        if (input) {
            input.value = config[key];
        }
    });
}

function handleServiceChange() {
    const serviceName = document.getElementById('serviceName').value;
    const configContainer = document.getElementById('serviceConfig');
    
    if (!serviceName) {
        configContainer.innerHTML = '';
        return;
    }
    
    let configHTML = '';
    
    switch (serviceName) {
        case 'twilio':
            configHTML = `
                <h4 style="margin-bottom: 15px; color: #2d3748;">
                    <i class="fas fa-cog"></i> Twilio Configuration
                </h4>
                <div class="form-group">
                    <label for="account_sid">Account SID</label>
                    <input type="text" id="account_sid" name="account_sid" required>
                    <small>Your Twilio Account SID</small>
                </div>
                <div class="form-group">
                    <label for="auth_token">Auth Token</label>
                    <input type="password" id="auth_token" name="auth_token" required>
                    <small>Your Twilio Auth Token</small>
                </div>
                <div class="form-group">
                    <label for="phone_number">Phone Number</label>
                    <input type="tel" id="phone_number" name="phone_number">
                    <small>Your Twilio phone number (optional)</small>
                </div>
            `;
            break;
            
        case 'gohighlevel':
            configHTML = `
                <h4 style="margin-bottom: 15px; color: #2d3748;">
                    <i class="fas fa-cog"></i> GoHighLevel Configuration
                </h4>
                <div class="form-group">
                    <label for="api_token">API Token</label>
                    <input type="password" id="api_token" name="api_token" required>
                    <small>Your GoHighLevel Private Integration Token</small>
                </div>
                <div class="form-group">
                    <label for="location_id">Location ID</label>
                    <input type="text" id="location_id" name="location_id">
                    <small>Your GoHighLevel Location ID (optional)</small>
                </div>
            `;
            break;
            
        case 'zapier':
            configHTML = `
                <h4 style="margin-bottom: 15px; color: #2d3748;">
                    <i class="fas fa-cog"></i> Zapier Configuration
                </h4>
                <p style="color: #718096; margin-bottom: 15px;">
                    Zapier integration uses webhook URLs. Make sure to set the webhook URL above.
                </p>
            `;
            break;
            
        case 'make':
            configHTML = `
                <h4 style="margin-bottom: 15px; color: #2d3748;">
                    <i class="fas fa-cog"></i> Make.com Configuration
                </h4>
                <p style="color: #718096; margin-bottom: 15px;">
                    Make.com integration uses webhook URLs. Make sure to set the webhook URL above.
                </p>
            `;
            break;
    }
    
    configContainer.innerHTML = configHTML;
}

async function handleIntegrationSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const integrationId = formData.get('id');
    
    const integrationData = {
        service_name: formData.get('service_name'),
        display_name: formData.get('display_name'),
        webhook_url: formData.get('webhook_url') || '',
        config_data: {}
    };
    
    // Collect service-specific config
    const serviceName = integrationData.service_name;
    if (serviceName === 'twilio') {
        integrationData.config_data = {
            account_sid: formData.get('account_sid'),
            auth_token: formData.get('auth_token'),
            phone_number: formData.get('phone_number') || ''
        };
    } else if (serviceName === 'gohighlevel') {
        integrationData.config_data = {
            api_token: formData.get('api_token'),
            location_id: formData.get('location_id') || ''
        };
    }
    
    showLoading(true);
    
    try {
        const url = integrationId ? 
            `${API_BASE}/integrations/${integrationId}` : 
            `${API_BASE}/integrations`;
        
        const method = integrationId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(integrationData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(
                integrationId ? 'Integration updated successfully!' : 'Integration created successfully!',
                'success'
            );
            closeIntegrationModal();
            loadIntegrations();
        } else {
            showToast(data.error || 'Failed to save integration', 'error');
        }
    } catch (error) {
        console.error('Integration save error:', error);
        showToast('Failed to save integration', 'error');
    } finally {
        showLoading(false);
    }
}

async function testIntegration(integrationId) {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/integrations/${integrationId}/test`, {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(data.message || 'Integration test successful!', 'success');
        } else {
            showToast(data.error || 'Integration test failed', 'error');
        }
    } catch (error) {
        console.error('Integration test error:', error);
        showToast('Integration test failed', 'error');
    } finally {
        showLoading(false);
    }
}

function editIntegration(integrationId) {
    openIntegrationModal(integrationId);
}

async function deleteIntegration(integrationId) {
    if (!confirm('Are you sure you want to delete this integration?')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/integrations/${integrationId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            showToast('Integration deleted successfully!', 'success');
            loadIntegrations();
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to delete integration', 'error');
        }
    } catch (error) {
        console.error('Integration delete error:', error);
        showToast('Failed to delete integration', 'error');
    } finally {
        showLoading(false);
    }
}

async function testAllIntegrations() {
    const activeIntegrations = integrations.filter(i => i.is_active);
    
    if (activeIntegrations.length === 0) {
        showToast('No active integrations to test', 'warning');
        return;
    }
    
    showLoading(true);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const integration of activeIntegrations) {
        try {
            const response = await fetch(`${API_BASE}/integrations/${integration.id}/test`, {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (error) {
            failCount++;
        }
    }
    
    showLoading(false);
    
    if (failCount === 0) {
        showToast(`All ${successCount} integrations tested successfully!`, 'success');
    } else {
        showToast(`${successCount} passed, ${failCount} failed`, 'warning');
    }
}

// Logs functions
async function loadLogs() {
    try {
        showLoading(true);
        
        const serviceFilter = document.getElementById('serviceFilter').value;
        const url = serviceFilter ? 
            `${API_BASE}/webhook-logs?service=${serviceFilter}` : 
            `${API_BASE}/webhook-logs`;
        
        const response = await fetch(url, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            logs = data.logs || [];
            renderLogs();
        } else {
            showToast('Failed to load logs', 'error');
        }
    } catch (error) {
        console.error('Failed to load logs:', error);
        showToast('Failed to load logs', 'error');
    } finally {
        showLoading(false);
    }
}

function renderLogs() {
    const container = document.getElementById('logsTable');
    if (!container) return;
    
    if (logs.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #718096;">
                <i class="fas fa-list" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                <h3>No Activity Logs</h3>
                <p>Webhook events and API calls will appear here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="log-header">
            <div>Service</div>
            <div>Event Type</div>
            <div>Status</div>
            <div>Details</div>
            <div>Time</div>
        </div>
        ${logs.map(log => `
            <div class="log-item">
                <div style="font-weight: 500; text-transform: capitalize;">${log.service_name}</div>
                <div>${log.event_type}</div>
                <div>
                    <span class="log-status ${log.status}">${log.status}</span>
                </div>
                <div style="font-size: 0.9rem; color: #718096;">
                    ${log.error_message || 'Success'}
                </div>
                <div style="font-size: 0.85rem; color: #718096;">
                    ${new Date(log.created_at).toLocaleString()}
                </div>
            </div>
        `).join('')}
    `;
}

// Profile functions
function loadProfileData() {
    if (!currentUser) return;
    
    document.getElementById('profileFirstName').value = currentUser.first_name || '';
    document.getElementById('profileLastName').value = currentUser.last_name || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const profileData = {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name')
    };
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/users/${currentUser.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(profileData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = { ...currentUser, ...profileData };
            showToast('Profile updated successfully!', 'success');
        } else {
            showToast(data.error || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showToast('Failed to update profile', 'error');
    } finally {
        showLoading(false);
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newPassword = formData.get('new_password');
    const confirmPassword = formData.get('confirm_password');
    
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    const passwordData = {
        current_password: formData.get('current_password'),
        new_password: newPassword
    };
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(passwordData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Password changed successfully!', 'success');
            e.target.reset();
        } else {
            showToast(data.error || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showToast('Failed to change password', 'error');
    } finally {
        showLoading(false);
    }
}

