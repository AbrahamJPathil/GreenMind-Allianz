// ============================================
// Dashboard JavaScript
// Handles view switching, workloads, API keys
// ============================================

// State Management
const state = {
    currentView: 'overview',
    workloads: [],
    apiKeys: {
        aws: { connected: false, credentials: null },
        gcp: { connected: false, credentials: null },
        azure: { connected: false, credentials: null },
        electricitymap: { connected: false, credentials: null },
        watttime: { connected: false, credentials: null },
        cloudping: { connected: false, credentials: null }
    },
    demoMode: true
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Main initialization
function initializeApp() {
    loadDataFromStorage();
    setupEventListeners();
    updateStats();
    renderWorkloads();
    updateAPIStatus();
    
    // Demo mode warning
    if (state.demoMode) {
        console.log('Running in demo mode - API connections are simulated');
    }
}

// Event Listeners
function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', handleViewSwitch);
    });

    // User menu
    const userButton = document.getElementById('userButton');
    const userDropdown = document.getElementById('userDropdown');
    if (userButton && userDropdown) {
        userButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userButton.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    // Modal close buttons
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
        element.addEventListener('click', closeModals);
    });

    // Prevent modal content clicks from closing modal
    document.querySelectorAll('.modal-content').forEach(content => {
        content.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    // Add workload button
    const addWorkloadBtn = document.getElementById('addWorkloadBtn');
    if (addWorkloadBtn) {
        addWorkloadBtn.addEventListener('click', () => openModal('addWorkloadModal'));
    }

    // Add workload form
    const addWorkloadForm = document.getElementById('addWorkloadForm');
    if (addWorkloadForm) {
        addWorkloadForm.addEventListener('submit', handleAddWorkload);
    }

    // API configuration form
    const apiConfigForm = document.getElementById('apiConfigForm');
    if (apiConfigForm) {
        apiConfigForm.addEventListener('submit', handleApiConfig);
    }

    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModals();
        }
    });
}

// View Switching
function handleViewSwitch(e) {
    e.preventDefault();
    const viewName = e.currentTarget.dataset.view;
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    e.currentTarget.classList.add('active');

    // Update view visibility
    document.querySelectorAll('.dashboard-view').forEach(view => {
        view.classList.remove('active');
    });
    
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
        state.currentView = viewName;
        
        // Update page title based on view
        updatePageTitle(viewName);
    }
}

function updatePageTitle(viewName) {
    const pageTitle = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.page-subtitle');
    
    const titles = {
        'overview': {
            title: 'Dashboard Overview',
            subtitle: 'Monitor your carbon footprint and cloud costs in real-time'
        },
        'workloads': {
            title: 'My Workloads',
            subtitle: 'Manage and monitor your cloud workloads across all providers'
        },
        'analytics': {
            title: 'Analytics',
            subtitle: 'Detailed insights into your environmental impact and costs'
        },
        'api-keys': {
            title: 'API Keys',
            subtitle: 'Configure cloud provider and data source connections'
        },
        'providers': {
            title: 'Cloud Providers',
            subtitle: 'View and manage your cloud provider integrations'
        }
    };

    if (pageTitle && titles[viewName]) {
        pageTitle.textContent = titles[viewName].title;
    }
    if (pageSubtitle && titles[viewName]) {
        pageSubtitle.textContent = titles[viewName].subtitle;
    }
}

// Workload Management
function handleAddWorkload(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const workload = {
        id: Date.now(),
        name: formData.get('workloadName'),
        provider: formData.get('provider'),
        region: formData.get('region'),
        type: formData.get('workloadType'),
        resourceId: formData.get('resourceId') || 'N/A',
        status: 'active',
        co2: Math.random() * 500 + 100, // Simulated
        cost: Math.random() * 1000 + 200, // Simulated
        sci: (Math.random() * 0.5 + 0.1).toFixed(2), // Simulated
        addedAt: new Date().toISOString()
    };

    state.workloads.push(workload);
    saveDataToStorage();
    renderWorkloads();
    updateStats();
    
    closeModals();
    e.target.reset();
    
    showToast('Success', `Workload "${workload.name}" has been added successfully!`);
}

function renderWorkloads() {
    const container = document.getElementById('workloadsContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (!container) return;

    if (state.workloads.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        container.innerHTML = '';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    
    container.innerHTML = state.workloads.map(workload => `
        <div class="workload-card" data-id="${workload.id}">
            <div class="workload-header">
                <div>
                    <h4 class="workload-title">${workload.name}</h4>
                    <div class="workload-meta">
                        <span class="workload-provider">${getProviderIcon(workload.provider)} ${workload.provider.toUpperCase()}</span>
                        <span>${workload.region}</span>
                    </div>
                </div>
                <span class="workload-status ${workload.status}">${workload.status === 'active' ? 'Active' : 'Inactive'}</span>
            </div>
            
            <div class="workload-metrics">
                <div class="workload-metric">
                    <span class="workload-metric-label">CO₂ Emissions</span>
                    <span class="workload-metric-value">${workload.co2.toFixed(1)} kg</span>
                </div>
                <div class="workload-metric">
                    <span class="workload-metric-label">Est. Monthly Cost</span>
                    <span class="workload-metric-value">$${workload.cost.toFixed(2)}</span>
                </div>
                <div class="workload-metric">
                    <span class="workload-metric-label">SCI Score</span>
                    <span class="workload-metric-value">${workload.sci}</span>
                </div>
                <div class="workload-metric">
                    <span class="workload-metric-label">Type</span>
                    <span class="workload-metric-value">${workload.type}</span>
                </div>
            </div>
            
            <div class="workload-actions">
                <button class="workload-btn" onclick="viewWorkloadDetails(${workload.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    View
                </button>
                <button class="workload-btn" onclick="deleteWorkload(${workload.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    `).join('');

    updateWorkloadCount();
}

function getProviderIcon(provider) {
    const icons = {
        'aws': '☁️',
        'gcp': '🌐',
        'azure': '🔷'
    };
    return icons[provider] || '☁️';
}

function viewWorkloadDetails(id) {
    const workload = state.workloads.find(w => w.id === id);
    if (!workload) return;
    
    showToast('Workload Details', `Viewing details for: ${workload.name}`);
    // In production, this would open a detailed modal
}

function deleteWorkload(id) {
    if (!confirm('Are you sure you want to delete this workload?')) return;
    
    const workload = state.workloads.find(w => w.id === id);
    state.workloads = state.workloads.filter(w => w.id !== id);
    
    saveDataToStorage();
    renderWorkloads();
    updateStats();
    
    showToast('Deleted', `Workload "${workload.name}" has been removed.`);
}

function updateWorkloadCount() {
    const badge = document.getElementById('workloadCount');
    if (badge) {
        badge.textContent = state.workloads.length;
    }
}

// Stats Updates
function updateStats() {
    // Total workloads
    const workloadStat = document.getElementById('totalWorkloads');
    if (workloadStat) {
        workloadStat.textContent = state.workloads.length;
    }

    // Total CO2
    const totalCO2 = state.workloads.reduce((sum, w) => sum + w.co2, 0);
    const co2Stat = document.getElementById('totalCO2');
    if (co2Stat) {
        co2Stat.textContent = `${totalCO2.toFixed(1)} kg`;
    }

    // Total Cost
    const totalCost = state.workloads.reduce((sum, w) => sum + w.cost, 0);
    const costStat = document.getElementById('totalCost');
    if (costStat) {
        costStat.textContent = `$${totalCost.toFixed(2)}`;
    }

    // Average SCI
    const avgSCI = state.workloads.length > 0 
        ? state.workloads.reduce((sum, w) => sum + parseFloat(w.sci), 0) / state.workloads.length
        : 0;
    const sciStat = document.getElementById('avgSCI');
    if (sciStat) {
        sciStat.textContent = avgSCI.toFixed(2);
    }
}

// API Key Management
function openApiModal(provider) {
    const modal = document.getElementById('apiConfigModal');
    const modalTitle = modal.querySelector('.modal-title');
    const formBody = document.getElementById('apiFormBody');
    
    modalTitle.textContent = `Configure ${getProviderName(provider)} API`;
    
    // Generate form fields based on provider
    const fields = getApiFields(provider);
    formBody.innerHTML = fields.map(field => `
        <div class="form-group">
            <label class="form-label" for="${field.id}">${field.label}</label>
            <input 
                type="${field.type}" 
                class="form-input" 
                id="${field.id}" 
                name="${field.name}"
                placeholder="${field.placeholder}"
                ${field.required ? 'required' : ''}
            >
            ${field.help ? `<span class="form-help">${field.help}</span>` : ''}
        </div>
    `).join('');

    // Store current provider in form
    const form = document.getElementById('apiConfigForm');
    form.dataset.provider = provider;

    openModal('apiConfigModal');
}

function getProviderName(provider) {
    const names = {
        'aws': 'Amazon Web Services',
        'gcp': 'Google Cloud Platform',
        'azure': 'Microsoft Azure',
        'electricitymap': 'ElectricityMap',
        'watttime': 'WattTime',
        'cloudping': 'CloudPing'
    };
    return names[provider] || provider;
}

function getApiFields(provider) {
    const fields = {
        'aws': [
            { id: 'awsAccessKey', name: 'accessKey', label: 'Access Key ID', type: 'text', placeholder: 'AKIAIOSFODNN7EXAMPLE', required: true, help: 'Your AWS IAM access key ID' },
            { id: 'awsSecretKey', name: 'secretKey', label: 'Secret Access Key', type: 'password', placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', required: true, help: 'Your AWS IAM secret access key' },
            { id: 'awsRegion', name: 'region', label: 'Default Region', type: 'text', placeholder: 'us-east-1', required: true }
        ],
        'gcp': [
            { id: 'gcpProjectId', name: 'projectId', label: 'Project ID', type: 'text', placeholder: 'my-project-12345', required: true },
            { id: 'gcpCredentials', name: 'credentials', label: 'Service Account JSON', type: 'textarea', placeholder: '{"type": "service_account", ...}', required: true, help: 'Paste your service account JSON key' }
        ],
        'azure': [
            { id: 'azureClientId', name: 'clientId', label: 'Client ID', type: 'text', placeholder: '12345678-1234-1234-1234-123456789abc', required: true },
            { id: 'azureClientSecret', name: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'your-client-secret', required: true },
            { id: 'azureTenantId', name: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: '12345678-1234-1234-1234-123456789abc', required: true },
            { id: 'azureSubscriptionId', name: 'subscriptionId', label: 'Subscription ID', type: 'text', placeholder: '12345678-1234-1234-1234-123456789abc', required: true }
        ],
        'electricitymap': [
            { id: 'emApiKey', name: 'apiKey', label: 'API Key', type: 'text', placeholder: 'your-api-key', required: true, help: 'Get your API key from electricityMap.org' }
        ],
        'watttime': [
            { id: 'wtUsername', name: 'username', label: 'Username', type: 'text', placeholder: 'your-username', required: true },
            { id: 'wtPassword', name: 'password', label: 'Password', type: 'password', placeholder: 'your-password', required: true }
        ],
        'cloudping': [
            { id: 'cpApiKey', name: 'apiKey', label: 'API Key', type: 'text', placeholder: 'your-api-key', required: true, help: 'Get your API key from cloudping.info' }
        ]
    };

    return fields[provider] || [];
}

function handleApiConfig(e) {
    e.preventDefault();
    
    const provider = e.target.dataset.provider;
    const formData = new FormData(e.target);
    
    // Store credentials (in production, this would be encrypted and stored securely)
    const credentials = {};
    for (let [key, value] of formData.entries()) {
        credentials[key] = value;
    }

    state.apiKeys[provider] = {
        connected: true,
        credentials: credentials,
        connectedAt: new Date().toISOString()
    };

    saveDataToStorage();
    updateAPIStatus();
    closeModals();
    e.target.reset();
    
    showToast('Connected', `${getProviderName(provider)} API has been configured successfully!`);
}

function updateAPIStatus() {
    // Update status badges for each provider
    Object.keys(state.apiKeys).forEach(provider => {
        const statusElement = document.querySelector(`.api-card[data-provider="${provider}"] .api-status`);
        if (statusElement) {
            const isConnected = state.apiKeys[provider].connected;
            statusElement.textContent = isConnected ? 'Connected' : 'Not Connected';
            statusElement.classList.toggle('connected', isConnected);
            statusElement.classList.toggle('not-connected', !isConnected);
        }
    });

    // Update connected count
    const connectedCount = Object.values(state.apiKeys).filter(api => api.connected).length;
    const connectedCountElement = document.getElementById('connectedCount');
    if (connectedCountElement) {
        connectedCountElement.textContent = `${connectedCount} of 6`;
    }
}

// Modal Management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
    document.body.style.overflow = '';
}

// Toast Notifications
function showToast(title, message) {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastTitle && toastMessage) {
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
}

// Local Storage
function saveDataToStorage() {
    try {
        localStorage.setItem('greenmind_workloads', JSON.stringify(state.workloads));
        localStorage.setItem('greenmind_api_keys', JSON.stringify(state.apiKeys));
    } catch (error) {
        console.error('Failed to save data to storage:', error);
    }
}

function loadDataFromStorage() {
    try {
        const workloads = localStorage.getItem('greenmind_workloads');
        const apiKeys = localStorage.getItem('greenmind_api_keys');
        
        if (workloads) {
            state.workloads = JSON.parse(workloads);
        }
        
        if (apiKeys) {
            state.apiKeys = JSON.parse(apiKeys);
        }
    } catch (error) {
        console.error('Failed to load data from storage:', error);
    }
}

// Logout Handler
function handleLogout() {
    // Show confirmation
    if (confirm('Are you sure you want to logout?')) {
        // Clear session data (optional - keep workloads and API keys for demo)
        // localStorage.removeItem('greenmind_workloads');
        // localStorage.removeItem('greenmind_api_keys');
        
        // Show toast notification
        showToast('Logged Out', 'You have been successfully logged out. Redirecting...');
        
        // Redirect to auth page after short delay
        setTimeout(() => {
            window.location.href = '/auth';
        }, 1500);
    }
}

// Export functions for inline use
window.openApiModal = openApiModal;
window.viewWorkloadDetails = viewWorkloadDetails;
window.deleteWorkload = deleteWorkload;
