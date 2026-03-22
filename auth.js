document.addEventListener('DOMContentLoaded', function() {
    
    // Check which page we're on
    const isNotesPage = window.location.pathname.includes('notes.html');
    
    if (isNotesPage) {
        // NOTES PAGE: redirect if not verified
        firebase.auth().onAuthStateChanged(user => {
            if (!user) {
                window.location.href = 'index.html';
            } else if (!user.emailVerified) {
                // Unverified user: sign out and redirect to index with message
                firebase.auth().signOut().then(() => {
                    window.location.href = 'index.html?verification=required';
                });
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
                
                // Clear any lingering verification container
                const verificationContainer = document.getElementById('verificationContainer');
                if (verificationContainer) verificationContainer.style.display = 'none';
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
                
                // Clear verification UI
                const verificationContainer = document.getElementById('verificationContainer');
                if (verificationContainer) verificationContainer.style.display = 'none';
            });
        } else {
            console.error('Tab elements not found! Check HTML IDs');
        }
        
        // ---------- LOGIN FUNCTIONALITY ----------
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
                    .then((userCredential) => {
                        const user = userCredential.user;
                        if (!user.emailVerified) {
                            // Sign out unverified user and show error with resend option
                            firebase.auth().signOut().then(() => {
                                showMessage('Please verify your email before logging in. A verification link has been sent.', 'error');
                                // Show resend button
                                showResendVerification(email);
                            }).catch(() => {
                                showMessage('Error signing out. Please try again.', 'error');
                            });
                        } else {
                            showMessage('Login successful! Redirecting...', 'success');
                            setTimeout(() => {
                                window.location.href = 'notes.html';
                            }, 1000);
                        }
                    })
                    .catch(error => {
                        showMessage(error.message, 'error');
                    });
            });
        }
        
        // ---------- SIGNUP FUNCTIONALITY ----------
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
                        const user = userCredential.user;
                        // Set display name
                        if (name) {
                            user.updateProfile({ displayName: name });
                        }
                        // Send verification email
                        return user.sendEmailVerification().then(() => {
                            showMessage('Account created! Verification email sent. Please check your inbox.', 'success');
                            // Clear signup form
                            document.getElementById('signup-name').value = '';
                            document.getElementById('signup-email').value = '';
                            document.getElementById('signup-password').value = '';
                            // Switch to login tab
                            loginTab.click();
                        });
                    })
                    .catch(error => {
                        showMessage(error.message, 'error');
                    });
            });
        }
        
        // ---------- FORGOT PASSWORD FUNCTIONALITY ----------
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
        
        // ---------- RESEND VERIFICATION (used in login error) ----------
        function showResendVerification(email) {
            let verificationDiv = document.getElementById('verificationContainer');
            if (!verificationDiv) return;
            
            verificationDiv.style.display = 'block';
            const resendBtn = document.getElementById('resendVerificationBtn');
            if (resendBtn) {
                // Remove previous listeners to avoid duplicates
                const newBtn = resendBtn.cloneNode(true);
                resendBtn.parentNode.replaceChild(newBtn, resendBtn);
                newBtn.addEventListener('click', () => {
                    // Re-sign in with email and password, send verification, then sign out
                    const password = document.getElementById('login-password')?.value;
                    if (!password) {
                        showMessage('Please enter your password to resend verification email.', 'error');
                        return;
                    }
                    firebase.auth().signInWithEmailAndPassword(email, password)
                        .then((userCredential) => {
                            const user = userCredential.user;
                            if (!user.emailVerified) {
                                user.sendEmailVerification()
                                    .then(() => {
                                        showMessage('Verification email resent. Please check your inbox.', 'success');
                                    })
                                    .catch(err => showMessage(err.message, 'error'));
                            } else {
                                showMessage('Your email is already verified. Please log in.', 'success');
                            }
                            firebase.auth().signOut();
                        })
                        .catch(err => {
                            showMessage('Invalid credentials. Please try again.', 'error');
                        });
                });
            }
        }
        
        // ---------- HANDLE INITIAL AUTH STATE (redirect verified users) ----------
        firebase.auth().onAuthStateChanged(user => {
            if (user && user.emailVerified) {
                // Verified user: redirect to notes
                window.location.href = 'notes.html';
            } else if (user && !user.emailVerified) {
                // Unverified user: show message on this page
                showMessage('Please verify your email. Check your inbox and click the verification link.', 'error');
                const email = user.email;
                // Show a custom resend button in the verification container
                let verificationDiv = document.getElementById('verificationContainer');
                if (!verificationDiv) return;
                verificationDiv.style.display = 'block';
                const resendBtn = document.getElementById('resendVerificationBtn');
                if (resendBtn) {
                    // Remove old listener
                    const newBtn = resendBtn.cloneNode(true);
                    resendBtn.parentNode.replaceChild(newBtn, resendBtn);
                    newBtn.addEventListener('click', () => {
                        user.sendEmailVerification().then(() => {
                            showMessage('Verification email resent. Please check your inbox.', 'success');
                        }).catch(error => {
                            showMessage('Error resending verification: ' + error.message, 'error');
                        });
                    });
                }
            } else {
                // No user, hide verification container
                const verificationDiv = document.getElementById('verificationContainer');
                if (verificationDiv) verificationDiv.style.display = 'none';
            }
        });
        
        // Helper function to show messages
        function showMessage(text, type) {
            if (messageDiv) {
                messageDiv.textContent = text;
                messageDiv.className = `message ${type}`;
                messageDiv.style.display = 'block';
                
                // Auto hide after 5 seconds for non-error messages
                if (type !== 'error') {
                    setTimeout(() => {
                        messageDiv.style.display = 'none';
                    }, 5000);
                }
            }
        }
    }
});