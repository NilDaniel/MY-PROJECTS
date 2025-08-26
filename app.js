// Global variables
let currentUser = null;
let authToken = null;
const API_BASE_URL = 'http://localhost:3000/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        showDashboard();
        loadDashboardData();
    } else {
        showLogin();
    }

    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Navigation links
    const navLinks = document.querySelectorAll('[data-module]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const module = e.target.getAttribute('data-module');
            showModule(module);
        });
    });

    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password')
    };

    try {
        showLoading(e.target.querySelector('button[type="submit"]'));
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (response.ok) {
            authToken = result.token;
            currentUser = result.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showAlert('Login successful!', 'success');
            showDashboard();
            loadDashboardData();
        } else {
            showAlert(result.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Network error. Please try again.', 'error');
    } finally {
        hideLoading(e.target.querySelector('button[type="submit"]'));
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showLogin();
}

// UI Navigation functions
function showLogin() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'grid';
    
    // Update user welcome message
    if (currentUser) {
        document.getElementById('userWelcome').textContent = `Welcome, ${currentUser.username}`;
    }
}

function showModule(moduleName) {
    // Hide all modules
    const modules = document.querySelectorAll('.module');
    modules.forEach(module => {
        module.classList.remove('active');
    });

    // Show selected module
    const targetModule = document.getElementById(`${moduleName}Module`);
    if (targetModule) {
        targetModule.classList.add('active');
    }

    // Update navigation
    const navLinks = document.querySelectorAll('[data-module]');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-module="${moduleName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Load module data
    loadModuleData(moduleName);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset form if exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// API Helper functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Dashboard data loading
async function loadDashboardData() {
    try {
        // Load dashboard statistics
        const [studentsCount, employeesCount, attendanceData, feeData] = await Promise.all([
            apiRequest('/students').then(data => data.length),
            apiRequest('/employees').then(data => data.length),
            apiRequest('/attendance/today-summary'),
            apiRequest('/fees/pending-summary')
        ]);

        // Update dashboard stats
        document.getElementById('totalStudents').textContent = studentsCount;
        document.getElementById('totalEmployees').textContent = employeesCount;
        document.getElementById('todayAttendance').textContent = `${attendanceData.percentage || 0}%`;
        document.getElementById('pendingFees').textContent = `₹${feeData.amount || 0}`;

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Error loading dashboard data', 'error');
    }
}

// Module data loading
async function loadModuleData(moduleName) {
    switch (moduleName) {
        case 'students':
            loadStudentsData();
            break;
        case 'fees':
            loadFeesData();
            break;
        case 'attendance':
            loadAttendanceData();
            break;
        case 'employees':
            loadEmployeesData();
            break;
        // Add more cases for other modules
        default:
            console.log(`Loading data for ${moduleName} module`);
    }
}

// Utility functions
function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    // Add to page
    const container = document.querySelector('.main-content') || document.body;
    container.insertBefore(alert, container.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);
}

function showLoading(button) {
    if (button) {
        button.disabled = true;
        button.innerHTML = '<span class="loading"></span> Loading...';
    }
}

function hideLoading(button, originalText = 'Submit') {
    if (button) {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount || 0);
}

// Form validation
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });

    return isValid;
}

// Export functions for use in other files
window.app = {
    apiRequest,
    showAlert,
    openModal,
    closeModal,
    showLoading,
    hideLoading,
    formatDate,
    formatCurrency,
    validateForm
};
