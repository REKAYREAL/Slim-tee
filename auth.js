document.addEventListener('DOMContentLoaded', function() {
    // This file is only for index.html (login/signup page)
    const isIndexPage = window.location.pathname.endsWith('index.html') || 
                        window.location.pathname === '/' || 
                        window.location.pathname === '';
    
    if (!isIndexPage) {
        // Not index page, do nothing (other pages handle their own auth)
        return;
    }
    
    // LOGIN/SIGNUP PAGE LOGIC
    console.log('Auth page loaded');
    
    // Get all necessary elements
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const messageDiv = document.getElementById('message');
    
    // TAB SWITCHING
    if (loginTab && signupTab && loginForm && signupForm) {
        loginTab.addEventListener('click', function(e) {
            e.preventDefault();
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            loginForm.classList.add('active');
            signupForm.classList.remove('active');
            const verificationContainer = document.getElementById('verificationContainer');
            if (verificationContainer) verificationContainer.style.display = 'none';
        });
        
        signupTab.addEventListener('click', function(e) {
            e.preventDefault();
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
            signupForm.classList.add('active');
            loginForm.classList.remove('active');
            const verificationContainer = document.getElementById('verificationContainer');
            if (verificationContainer) verificationContainer.style.display = 'none';
        });
    }
    
    // LOGIN
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
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
                        firebase.auth().signOut().then(() => {
                            showMessage('Please verify your email before logging in. A verification link has been sent.', 'error');
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
    
    // SIGNUP
    const signupBtn = document.getElementById('signup-btn');
    if (signupBtn) {
        signupBtn.addEventListener('click', function(e) {
            e.preventDefault();
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
                    if (name) {
                        user.updateProfile({ displayName: name });
                    }
                    return user.sendEmailVerification().then(() => {
                        showMessage('Account created! Verification email sent. Please check your inbox.', 'success');
                        document.getElementById('signup-name').value = '';
                        document.getElementById('signup-email').value = '';
                        document.getElementById('signup-password').value = '';
                        loginTab.click();
                    });
                })
                .catch(error => {
                    showMessage(error.message, 'error');
                });
        });
    }
    
    // FORGOT PASSWORD
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
                    showMessage(error.message, 'error');
                });
        });
    }
    
    // RESEND VERIFICATION
    function showResendVerification(email) {
        let verificationDiv = document.getElementById('verificationContainer');
        if (!verificationDiv) return;
        verificationDiv.style.display = 'block';
        const resendBtn = document.getElementById('resendVerificationBtn');
        if (resendBtn) {
            const newBtn = resendBtn.cloneNode(true);
            resendBtn.parentNode.replaceChild(newBtn, resendBtn);
            newBtn.addEventListener('click', () => {
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
    
    // INITIAL AUTH STATE (on index.html)
    firebase.auth().onAuthStateChanged(user => {
        if (user && user.emailVerified) {
            window.location.href = 'notes.html';
        } else if (user && !user.emailVerified) {
            showMessage('Please verify your email. Check your inbox and click the verification link.', 'error');
            const email = user.email;
            let verificationDiv = document.getElementById('verificationContainer');
            if (verificationDiv) {
                verificationDiv.style.display = 'block';
                const resendBtn = document.getElementById('resendVerificationBtn');
                if (resendBtn) {
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
            }
        } else {
            const verificationDiv = document.getElementById('verificationContainer');
            if (verificationDiv) verificationDiv.style.display = 'none';
        }
    });
    
    // Helper function
    function showMessage(text, type) {
        if (messageDiv) {
            messageDiv.textContent = text;
            messageDiv.className = `message ${type}`;
            messageDiv.style.display = 'block';
            if (type !== 'error') {
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 5000);
            }
        }
    }
});