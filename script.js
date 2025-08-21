// Global variables
let isPlaying = false;
let currentDemo = 'inbound';
let typingIndex = 0;
const fullText = "The most advanced AI voice agent ever built by Peakwave Digital Solutions";
const bookingLink = "https://calendly.com/accentsamillion-vg0n/30min?month=2025-08";

// Demo conversations
const demoConversations = {
    inbound: {
        icon: 'fas fa-phone',
        iconColor: '#6366f1',
        text: '<strong>Sonora:</strong> "Hello, you\'ve reached The Voice of Your Business — I\'m Sonora. How can I help you today?"',
        callType: 'Incoming Call'
    },
    outbound: {
        icon: 'fas fa-comments',
        iconColor: '#10b981',
        text: '<strong>Sonora:</strong> "Hi, this is Sonora from Peakwave Digital Solutions. I\'m calling because you inquired about AI voice agents. Do you have a moment to chat?"',
        callType: 'Outbound Call'
    }
};

// Initialize the website
document.addEventListener('DOMContentLoaded', function() {
    initializeTypingEffect();
    initializeNavigation();
    initializeScrollEffects();
    initializeContactForm();
});

// Typing effect for hero section
function initializeTypingEffect() {
    const typingElement = document.getElementById('typingText');
    if (!typingElement) return;
    
    typingElement.textContent = '';
    
    function typeText() {
        if (typingIndex < fullText.length) {
            typingElement.textContent += fullText.charAt(typingIndex);
            typingIndex++;
            setTimeout(typeText, 50);
        } else {
            // Add blinking cursor
            typingElement.innerHTML += '<span class="cursor">|</span>';
            // Make cursor blink
            setInterval(() => {
                const cursor = typingElement.querySelector('.cursor');
                if (cursor) {
                    cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
                }
            }, 500);
        }
    }
    
    setTimeout(typeText, 1000);
}

// Navigation functionality
function initializeNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            scrollToSection(targetId);
            
            // Close mobile menu if open
            if (navMenu) {
                navMenu.classList.remove('active');
            }
            if (navToggle) {
                navToggle.classList.remove('active');
            }
        });
    });
}

// Scroll effects and animations
function initializeScrollEffects() {
    // Add scroll event listener for navbar background
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    });
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
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
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .industry-card, .pricing-card, .testimonial-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Demo functionality
function toggleDemo() {
    const playBtn = document.getElementById('playBtn');
    const soundWaves = document.getElementById('soundWaves');
    const audioNotice = document.getElementById('audioNotice');
    
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        playBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        soundWaves.style.display = 'flex';
        audioNotice.style.display = 'block';
    } else {
        playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
        soundWaves.style.display = 'none';
        audioNotice.style.display = 'none';
    }
}

function switchDemo() {
    currentDemo = currentDemo === 'inbound' ? 'outbound' : 'inbound';
    const conversation = demoConversations[currentDemo];
    
    // Update UI elements
    document.getElementById('callType').textContent = conversation.callType;
    document.getElementById('conversationText').innerHTML = conversation.text;
    
    const conversationIcon = document.querySelector('.conversation-icon');
    conversationIcon.className = `conversation-icon ${conversation.icon}`;
    conversationIcon.style.color = conversation.iconColor;
    
    // Reset playing state
    if (isPlaying) {
        toggleDemo();
    }
}

// Utility functions
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const offsetTop = element.offsetTop - 80; // Account for fixed navbar
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

function openBooking() {
    window.open(bookingLink, '_blank');
}

// Contact form functionality
function initializeContactForm() {
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const name = contactForm.querySelector('input[type="text"]').value;
            const email = contactForm.querySelector('input[type="email"]').value;
            const phone = contactForm.querySelector('input[type="tel"]').value;
            const message = contactForm.querySelector('textarea').value;
            
            // Simple validation
            if (!name || !email || !message) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Simulate form submission
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                alert('Thank you for your message! We\'ll get back to you soon.');
                contactForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
}

// Add mobile menu styles dynamically
const mobileMenuStyles = `
    @media (max-width: 768px) {
        .nav-menu {
            position: fixed;
            left: -100%;
            top: 70px;
            flex-direction: column;
            background-color: white;
            width: 100%;
            text-align: center;
            transition: 0.3s;
            box-shadow: 0 10px 27px rgba(0, 0, 0, 0.05);
            padding: 2rem 0;
        }
        
        .nav-menu.active {
            left: 0;
        }
        
        .nav-menu li {
            margin: 1rem 0;
        }
        
        .nav-toggle.active .bar:nth-child(2) {
            opacity: 0;
        }
        
        .nav-toggle.active .bar:nth-child(1) {
            transform: translateY(8px) rotate(45deg);
        }
        
        .nav-toggle.active .bar:nth-child(3) {
            transform: translateY(-8px) rotate(-45deg);
        }
    }
`;

// Add the mobile menu styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = mobileMenuStyles;
document.head.appendChild(styleSheet);

// Add cursor styles for typing effect
const cursorStyles = `
    .cursor {
        animation: blink 1s infinite;
    }
    
    @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
    }
`;

const cursorStyleSheet = document.createElement('style');
cursorStyleSheet.textContent = cursorStyles;
document.head.appendChild(cursorStyleSheet);

// Smooth scroll behavior for older browsers
if (!('scrollBehavior' in document.documentElement.style)) {
    const smoothScrollPolyfill = document.createElement('script');
    smoothScrollPolyfill.src = 'https://cdn.jsdelivr.net/gh/cferdinandi/smooth-scroll@15.0.0/dist/smooth-scroll.polyfills.min.js';
    document.head.appendChild(smoothScrollPolyfill);
}

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Add scroll-to-top functionality
function addScrollToTop() {
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #6366f1;
        color: white;
        border: none;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    `;
    
    document.body.appendChild(scrollToTopBtn);
    
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollToTopBtn.style.opacity = '1';
        } else {
            scrollToTopBtn.style.opacity = '0';
        }
    });
}

// Initialize scroll-to-top button
addScrollToTop();

