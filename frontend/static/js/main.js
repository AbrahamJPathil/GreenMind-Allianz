// ========================================
// GreenMind Landing Page JavaScript
// Interactive Features & Animations
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // === NAVBAR SCROLL EFFECT ===
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add/remove scrolled class based on scroll position
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
    
    // === SMOOTH SCROLLING FOR ANCHOR LINKS ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = target.offsetTop - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // === VIDEO BACKGROUND OPTIMIZATION ===
    const heroVideo = document.getElementById('hero-video');
    
    if (heroVideo) {
        // Ensure video plays on mobile devices
        heroVideo.setAttribute('playsinline', '');
        heroVideo.setAttribute('muted', '');
        
        // Handle video load errors gracefully
        heroVideo.addEventListener('error', function() {
            console.log('Video failed to load. Using fallback background.');
            const videoBackground = document.querySelector('.video-background');
            if (videoBackground) {
                videoBackground.style.background = 'linear-gradient(135deg, #003781 0%, #0077BE 100%)';
            }
        });
        
        // Optimize video playback
        heroVideo.addEventListener('loadeddata', function() {
            heroVideo.play().catch(function(error) {
                console.log('Autoplay prevented:', error);
            });
        });
    }
    
    // === SCROLL REVEAL ANIMATIONS ===
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe feature cards for scroll animations
    document.querySelectorAll('.feature-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s ease-out ${index * 0.1}s`;
        observer.observe(card);
    });
    
    // Observe stat items
    document.querySelectorAll('.stat-item').forEach((stat, index) => {
        stat.style.opacity = '0';
        stat.style.transform = 'translateY(20px)';
        stat.style.transition = `all 0.5s ease-out ${index * 0.15}s`;
        observer.observe(stat);
    });
    
    // === BUTTON HOVER EFFECTS ===
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // === PARALLAX EFFECT FOR HERO SECTION ===
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroContent = document.querySelector('.hero-content');
        const videoBackground = document.querySelector('.video-background');
        
        if (heroContent && scrolled < window.innerHeight) {
            heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
            heroContent.style.opacity = 1 - (scrolled / window.innerHeight);
        }
        
        if (videoBackground && scrolled < window.innerHeight) {
            videoBackground.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    });
    
    // === ANIMATED COUNTER FOR STATS ===
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16); // 60 FPS
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = target === Infinity ? '∞' : Math.ceil(target);
                clearInterval(timer);
            } else {
                element.textContent = Math.ceil(start);
            }
        }, 16);
    }
    
    // Trigger counter animation when stats section is visible
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumbers = entry.target.querySelectorAll('.stat-number');
                statNumbers.forEach(stat => {
                    const value = stat.textContent;
                    if (value !== '∞' && !isNaN(value)) {
                        animateCounter(stat, parseInt(value));
                    }
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }
    
    // === RESPONSIVE MENU TOGGLE (for future mobile menu) ===
    // This can be extended later for a hamburger menu on mobile
    
    // === PERFORMANCE OPTIMIZATION ===
    // Reduce video quality on slower connections
    if (heroVideo && 'connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
            heroVideo.style.display = 'none';
            console.log('Slow connection detected. Video disabled for performance.');
        }
    }
    
    // === ACCESSIBILITY IMPROVEMENTS ===
    // Add keyboard navigation support
    document.querySelectorAll('.btn, .feature-card').forEach(element => {
        element.setAttribute('tabindex', '0');
        
        element.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                this.click();
            }
        });
    });
    
    // === SCROLL TO TOP FUNCTIONALITY ===
    // Show/hide scroll indicator based on position
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 100) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.pointerEvents = 'none';
            } else {
                scrollIndicator.style.opacity = '1';
                scrollIndicator.style.pointerEvents = 'auto';
            }
        });
    }
    
    // === CONSOLE MESSAGE ===
    console.log('%cGreenMind by Allianz', 'color: #003781; font-size: 24px; font-weight: bold;');
    console.log('%cPreparing the cloud for tomorrow', 'color: #5A8FCD; font-size: 14px;');
    
});

// === UTILITY FUNCTIONS ===

// Debounce function for performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Optimize scroll events with throttle
window.addEventListener('scroll', throttle(() => {
    // Additional scroll-based features can be added here
}, 100));

// ========================================
// TIM VIDEO MODAL FUNCTIONALITY
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const openVideoBtn = document.getElementById('openTimVideoBtn');
    const videoModal = document.getElementById('timVideoModal');
    const closeVideoBtn = document.getElementById('closeVideoBtn');
    const videoModalOverlay = document.getElementById('videoModalOverlay');
    const timVideo = document.getElementById('timVideo');
    
    // Open video modal
    if (openVideoBtn) {
        openVideoBtn.addEventListener('click', function() {
            videoModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            
            // Play video when modal opens
            if (timVideo) {
                timVideo.currentTime = 0; // Start from beginning
                timVideo.play().catch(function(error) {
                    console.log('Video playback error:', error);
                });
            }
        });
    }
    
    // Close video modal function
    function closeVideoModal() {
        videoModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        
        // Pause video when modal closes
        if (timVideo) {
            timVideo.pause();
            timVideo.currentTime = 0; // Reset to start
        }
    }
    
    // Close video modal on X button click
    if (closeVideoBtn) {
        closeVideoBtn.addEventListener('click', closeVideoModal);
    }
    
    // Close video modal on overlay click
    if (videoModalOverlay) {
        videoModalOverlay.addEventListener('click', closeVideoModal);
    }
    
    // Close video modal on ESC key press
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && videoModal.classList.contains('active')) {
            closeVideoModal();
        }
    });
    
    // Handle video end
    if (timVideo) {
        timVideo.addEventListener('ended', function() {
            // Optionally auto-close after video ends
            // closeVideoModal();
            
            // Or show replay option
            console.log('Video ended. User can replay or close.');
        });
    }
    
    // Handle video errors
    if (timVideo) {
        timVideo.addEventListener('error', function() {
            console.error('Error loading Tim video');
            alert('Sorry, there was an error loading the video. Please try again later.');
            closeVideoModal();
        });
    }
});
