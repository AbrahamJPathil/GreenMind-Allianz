/**
 * Authentication Page JavaScript
 * GreenMind by Allianz
 * Handles form validation, tab switching, and authentication logic
 */

// ============================================
// Tab Switching Logic
// ============================================

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.auth-tab');
    const formWrappers = document.querySelectorAll('.auth-form-wrapper');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all tabs and forms
            tabButtons.forEach(btn => btn.classList.remove('active'));
            formWrappers.forEach(wrapper => wrapper.classList.remove('active'));
            
            // Add active class to clicked tab
            button.classList.add('active');
            
            // Show corresponding form
            const targetForm = document.getElementById(`${targetTab}-form`);
            if (targetForm) {
                targetForm.classList.add('active');
            }
        });
    });
}

// ============================================
// Password Visibility Toggle
// ============================================

function initializePasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const wrapper = toggle.closest('.password-input-wrapper');
            const input = wrapper.querySelector('.form-input');
            const eyeIcon = toggle.querySelector('.eye-icon');
            const eyeOffIcon = toggle.querySelector('.eye-off-icon');
            
            if (input.type === 'password') {
                input.type = 'text';
                eyeIcon.style.display = 'none';
                eyeOffIcon.style.display = 'block';
            } else {
                input.type = 'password';
                eyeIcon.style.display = 'block';
                eyeOffIcon.style.display = 'none';
            }
        });
    });
}

// ============================================
// Password Strength Checker
// ============================================

function checkPasswordStrength(password) {
    let strength = 0;
    let strengthText = 'Weak';
    let strengthClass = 'weak';
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Character variety checks
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    // Determine strength level
    if (strength <= 2) {
        strengthText = 'Weak';
        strengthClass = 'weak';
    } else if (strength <= 4) {
        strengthText = 'Medium';
        strengthClass = 'medium';
    } else {
        strengthText = 'Strong';
        strengthClass = 'strong';
    }
    
    return { strength, strengthText, strengthClass };
}

function initializePasswordStrength() {
    const passwordInput = document.getElementById('signup-password');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    
    if (passwordInput && strengthFill && strengthText) {
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            
            if (password.length === 0) {
                strengthFill.className = 'strength-fill';
                strengthText.textContent = 'Enter a password';
                return;
            }
            
            const result = checkPasswordStrength(password);
            strengthFill.className = `strength-fill ${result.strengthClass}`;
            strengthText.textContent = `Password strength: ${result.strengthText}`;
        });
    }
}

// ============================================
// Form Validation
// ============================================

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 8;
}

function validateName(name) {
    return name.trim().length >= 2;
}

function showError(inputId, message) {
    const errorElement = document.getElementById(`${inputId}-error`);
    const inputElement = document.getElementById(inputId);
    
    if (errorElement && inputElement) {
        errorElement.textContent = message;
        errorElement.classList.add('active');
        inputElement.style.borderColor = '#ef4444';
    }
}

function clearError(inputId) {
    const errorElement = document.getElementById(`${inputId}-error`);
    const inputElement = document.getElementById(inputId);
    
    if (errorElement && inputElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('active');
        inputElement.style.borderColor = '#e0e0e0';
    }
}

function clearAllErrors(formId) {
    const form = document.getElementById(formId);
    if (form) {
        const inputs = form.querySelectorAll('.form-input');
        inputs.forEach(input => {
            clearError(input.id);
        });
    }
}

// ============================================
// Login Form Handler
// ============================================

function handleLoginSubmit(event) {
    event.preventDefault();
    clearAllErrors('loginForm');
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    let isValid = true;
    
    // Validate email
    if (!email) {
        showError('login-email', 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('login-email', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate password
    if (!password) {
        showError('login-password', 'Password is required');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Demo login check
    if (email === 'demo@allianz.com' && password === 'demo123') {
        showToast('Login successful! Redirecting to dashboard...');
        
        // Simulate redirect after 1.5 seconds
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1500);
    } else {
        // In a real application, this would make an API call
        showToast('Login functionality coming soon! Use demo credentials for now.');
    }
}

// ============================================
// Sign Up Form Handler
// ============================================

function handleSignupSubmit(event) {
    event.preventDefault();
    clearAllErrors('signupForm');
    
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const organization = document.getElementById('signup-organization').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const termsChecked = document.getElementById('terms-checkbox').checked;
    
    let isValid = true;
    
    // Validate name
    if (!name) {
        showError('signup-name', 'Name is required');
        isValid = false;
    } else if (!validateName(name)) {
        showError('signup-name', 'Name must be at least 2 characters');
        isValid = false;
    }
    
    // Validate email
    if (!email) {
        showError('signup-email', 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('signup-email', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate organization
    if (!organization) {
        showError('signup-organization', 'Organization is required');
        isValid = false;
    }
    
    // Validate password
    if (!password) {
        showError('signup-password', 'Password is required');
        isValid = false;
    } else if (!validatePassword(password)) {
        showError('signup-password', 'Password must be at least 8 characters');
        isValid = false;
    }
    
    // Validate confirm password
    if (!confirmPassword) {
        showError('signup-confirm-password', 'Please confirm your password');
        isValid = false;
    } else if (password !== confirmPassword) {
        showError('signup-confirm-password', 'Passwords do not match');
        isValid = false;
    }
    
    // Validate terms checkbox
    if (!termsChecked) {
        showToast('Please accept the Terms of Service and Privacy Policy', 'error');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // In a real application, this would make an API call
    showToast('Account created successfully! Redirecting to login...');
    
    // Switch to login tab after 1.5 seconds
    setTimeout(() => {
        const loginTab = document.querySelector('[data-tab="login"]');
        if (loginTab) {
            loginTab.click();
            // Pre-fill email
            document.getElementById('login-email').value = email;
        }
    }, 1500);
}

// ============================================
// Toast Notification
// ============================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = toast.querySelector('.toast-icon');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        
        // Change icon and color based on type
        if (type === 'error') {
            toast.style.borderLeftColor = '#ef4444';
            toastIcon.style.background = '#fee2e2';
            toastIcon.style.color = '#ef4444';
        } else {
            toast.style.borderLeftColor = '#10b981';
            toastIcon.style.background = '#d1fae5';
            toastIcon.style.color = '#10b981';
        }
        
        // Show toast
        toast.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// ============================================
// Social Auth Handlers (Placeholders)
// ============================================

function initializeSocialAuth() {
    const googleButtons = document.querySelectorAll('.google-btn');
    const microsoftButtons = document.querySelectorAll('.microsoft-btn');
    
    googleButtons.forEach(button => {
        button.addEventListener('click', () => {
            showToast('Google authentication coming soon!');
            // In production, redirect to Google OAuth
            // window.location.href = '/auth/google';
        });
    });
    
    microsoftButtons.forEach(button => {
        button.addEventListener('click', () => {
            showToast('Microsoft authentication coming soon!');
            // In production, redirect to Microsoft OAuth
            // window.location.href = '/auth/microsoft';
        });
    });
}

// ============================================
// Real-time Input Validation
// ============================================

function initializeRealTimeValidation() {
    // Email validation on blur
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', () => {
            const value = input.value.trim();
            if (value && !validateEmail(value)) {
                showError(input.id, 'Please enter a valid email address');
            } else {
                clearError(input.id);
            }
        });
        
        input.addEventListener('input', () => {
            if (input.value.trim()) {
                clearError(input.id);
            }
        });
    });
    
    // Password confirmation validation
    const signupPassword = document.getElementById('signup-password');
    const confirmPassword = document.getElementById('signup-confirm-password');
    
    if (signupPassword && confirmPassword) {
        confirmPassword.addEventListener('blur', () => {
            const password = signupPassword.value;
            const confirm = confirmPassword.value;
            
            if (confirm && password !== confirm) {
                showError('signup-confirm-password', 'Passwords do not match');
            } else {
                clearError('signup-confirm-password');
            }
        });
        
        confirmPassword.addEventListener('input', () => {
            if (confirmPassword.value) {
                clearError('signup-confirm-password');
            }
        });
    }
}

// ============================================
// Forgot Password Handler
// ============================================

function initializeForgotPassword() {
    const forgotLink = document.querySelector('.forgot-link');
    
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value.trim();
            
            if (email && validateEmail(email)) {
                showToast(`Password reset link sent to ${email}`);
            } else {
                showToast('Please enter your email address first', 'error');
                document.getElementById('login-email').focus();
            }
        });
    }
}

// ============================================
// Keyboard Navigation Enhancement
// ============================================

function initializeKeyboardNavigation() {
    // Allow Enter key to submit forms
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => {
        form.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.type !== 'submit') {
                e.preventDefault();
                const submitBtn = form.querySelector('.submit-btn');
                if (submitBtn) {
                    submitBtn.click();
                }
            }
        });
    });
    
    // Tab switching with keyboard (Alt + 1 for login, Alt + 2 for signup)
    document.addEventListener('keydown', (e) => {
        if (e.altKey) {
            if (e.key === '1') {
                e.preventDefault();
                const loginTab = document.querySelector('[data-tab="login"]');
                if (loginTab) loginTab.click();
            } else if (e.key === '2') {
                e.preventDefault();
                const signupTab = document.querySelector('[data-tab="signup"]');
                if (signupTab) signupTab.click();
            }
        }
    });
}

// ============================================
// Auto-fill Demo Credentials
// ============================================

function initializeDemoCredentials() {
    const demoCredentials = document.querySelector('.demo-credentials');
    
    if (demoCredentials) {
        demoCredentials.addEventListener('click', () => {
            const loginEmail = document.getElementById('login-email');
            const loginPassword = document.getElementById('login-password');
            
            if (loginEmail && loginPassword) {
                loginEmail.value = 'demo@allianz.com';
                loginPassword.value = 'demo123';
                
                // Clear any existing errors
                clearError('login-email');
                clearError('login-password');
                
                showToast('Demo credentials filled in!');
            }
        });
        
        // Make it look clickable
        demoCredentials.style.cursor = 'pointer';
        demoCredentials.title = 'Click to auto-fill';
    }
}

// ============================================
// Initialize All Features
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize tabs
    initializeTabs();
    
    // Initialize password visibility toggles
    initializePasswordToggles();
    
    // Initialize password strength checker
    initializePasswordStrength();
    
    // Initialize social auth buttons
    initializeSocialAuth();
    
    // Initialize real-time validation
    initializeRealTimeValidation();
    
    // Initialize forgot password handler
    initializeForgotPassword();
    
    // Initialize keyboard navigation
    initializeKeyboardNavigation();
    
    // Initialize demo credentials auto-fill
    initializeDemoCredentials();
    
    // Attach form submit handlers
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupSubmit);
    }
    
    console.log('Authentication page initialized successfully');
});
