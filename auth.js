document.addEventListener('DOMContentLoaded', function() {
    
    // Check which page we're on
    const isNotesPage = window.location.pathname.includes('notes.html');
    
    if (isNotesPage) {
        // Check authentication on notes page
        firebase.auth().onAuthStateChanged(user => {
            if (!user) {
                window.location.href = 'index.html';
            } else {
                const userDisplay = document.getElementById('user-display');
                if (userDisplay) {
                    userDisplay.textContent = user.displayName || user.email;
                }
                const userAvatar = document.getElementById('user-avatar');
                if (userAvatar) {
                    userAvatar.textContent = user.displayName ? user.displayName.charAt(0).toUpperCase() : '👤';
                }
            }
        });
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                firebase.auth().signOut()
                    .then(() => {
                        window.location.href = 'index.html';
                    })
                    .catch(error => {
                        console.error('Logout error:', error);
                    });
            });
        }
        
    } else {
        // LOGIN/SIGNUP PAGE LOGIC
        console.log('Auth page loaded'); // Debug log
        
        // Get all necessary elements
        const loginTab = document.getElementById('login-tab');
        const signupTab = document.getElementById('signup-tab');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const messageDiv = document.getElementById('message');
        
        // Check if elements exist
        console.log('Elements found:', {
            loginTab: !!loginTab,
            signupTab: !!signupTab,
            loginForm: !!loginForm,
            signupForm: !!signupForm
        });
        
        // TAB SWITCHING FUNCTIONALITY
        if (loginTab && signupTab && loginForm && signupForm) {
            
            // Login tab click
            loginTab.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Login tab clicked');
                
                // Update tab styles
                loginTab.classList.add('active');
                signupTab.classList.remove('active');
                
                // Show/hide forms
                loginForm.classList.add('active');
                signupForm.classList.remove('active');
            });
            
            // Signup tab click
            signupTab.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Signup tab clicked');
                
                // Update tab styles
                signupTab.classList.add('active');
                loginTab.classList.remove('active');
                
                // Show/hide forms
                signupForm.classList.add('active');
                loginForm.classList.remove('active');
            });
        } else {
            console.error('Tab elements not found! Check HTML IDs');
        }
        
        // LOGIN FUNCTIONALITY
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Login button clicked');
                
                const email = document.getElementById('login-email')?.value;
                const password = document.getElementById('login-password')?.value;
                
                if (!email || !password) {
                    showMessage('Please fill in all fields', 'error');
                    return;
                }
                
                firebase.auth().signInWithEmailAndPassword(email, password)
                    .then(() => {
                        showMessage('Login successful! Redirecting...', 'success');
                        setTimeout(() => {
                            window.location.href = 'notes.html';
                        }, 1000);
                    })
                    .catch(error => {
                        showMessage(error.message, 'error');
                    });
            });
        }
        
        // SIGNUP FUNCTIONALITY
        const signupBtn = document.getElementById('signup-btn');
        if (signupBtn) {
            signupBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Signup button clicked');
                
                const name = document.getElementById('signup-name')?.value;
                const email = document.getElementById('signup-email')?.value;
                const password = document.getElementById('signup-password')?.value;
                
                if (!email || !password) {
                    showMessage('Please fill in all fields', 'error');
                    return;
                }
                
                if (password.length < 6) {
                    showMessage('Password must be at least 6 characters', 'error');
                    return;
                }
                
                firebase.auth().createUserWithEmailAndPassword(email, password)
                    .then(userCredential => {
                        if (name) {
                            userCredential.user.updateProfile({
                                displayName: name
                            });
                        }
                        showMessage('Account created! Redirecting...', 'success');
                        setTimeout(() => {
                            window.location.href = 'notes.html';
                        }, 1000);
                    })
                    .catch(error => {
                        showMessage(error.message, 'error');
                    });
            });
        }
        
        // FORGOT PASSWORD FUNCTIONALITY
        const forgotLink = document.getElementById('forgotPasswordLink');
        if (forgotLink) {
            forgotLink.addEventListener('click', function(e) {
                e.preventDefault();
                const emailInput = document.getElementById('login-email');
                const email = emailInput?.value.trim();
                
                if (!email) {
                    showMessage('Please enter your email address first', 'error');
                    emailInput?.focus();
                    return;
                }
                
                firebase.auth().sendPasswordResetEmail(email)
                    .then(() => {
                        showMessage('Password reset email sent! Check your inbox.', 'success');
                    })
                    .catch((error) => {
                        console.error('Reset error:', error);
                        showMessage(error.message, 'error');
                    });
            });
        }
        
        // Helper function to show messages
        function showMessage(text, type) {
            if (messageDiv) {
                messageDiv.textContent = text;
                messageDiv.className = `message ${type}`;
                messageDiv.style.display = 'block';
                
                // Auto hide after 3 seconds
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 3000);
            }
        }
    }
});