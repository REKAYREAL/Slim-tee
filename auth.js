document.addEventListener('DOMContentLoaded', function() {
    // This file is only for login.html (login/signup page)
    const isIndexPage = window.location.pathname.endsWith('login.html') || 
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
    
    // UI elements for password reset flow
    const loginEmail = document.getElementById('login-email');
    const loginPasswordWrapper = document.querySelector('#login-form .password-wrapper');
    const loginBtn = document.getElementById('login-btn');
    const loginOptions = document.querySelector('.login-options');
    const resetSection = document.getElementById('resetPasswordSection');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    const backToLoginBtn = document.getElementById('backToLoginBtn');
    const forgotLink = document.getElementById('forgotPasswordLink');
    
    // Helper: Show friendly error messages
    function getFriendlyErrorMessage(errorCode) {
        const errors = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'This email is already registered. Please log in instead.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.'
        };
        return errors[errorCode] || 'Something went wrong. Please try again.';
    }
    
    // Clear message helper
    function clearMessage() {
        if (messageDiv) {
            messageDiv.style.display = 'none';
            messageDiv.textContent = '';
        }
    }
    
    // Check if email exists in Firebase Auth (with logging)
    async function checkEmailExists(email) {
        if (!email) return false;
        try {
            const trimmedEmail = email.trim().toLowerCase();
            console.log('Checking email existence for:', trimmedEmail);
            const methods = await firebase.auth().fetchSignInMethodsForEmail(trimmedEmail);
            console.log('Sign-in methods found:', methods);
            return methods.length > 0;
        } catch (err) {
            console.error('Error checking email existence:', err);
            // Return false but also throw so caller can handle
            throw err;
        }
    }
    
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
            // Reset password UI if visible
            if (resetSection && loginPasswordWrapper && loginBtn && loginOptions) {
                resetSection.style.display = 'none';
                loginPasswordWrapper.style.display = 'flex';
                loginBtn.style.display = 'flex';
                loginOptions.style.display = 'flex';
                clearMessage();
            }
        });
        
        signupTab.addEventListener('click', function(e) {
            e.preventDefault();
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
            signupForm.classList.add('active');
            loginForm.classList.remove('active');
            const verificationContainer = document.getElementById('verificationContainer');
            if (verificationContainer) verificationContainer.style.display = 'none';
            // Reset password UI if visible
            if (resetSection && loginPasswordWrapper && loginBtn && loginOptions) {
                resetSection.style.display = 'none';
                loginPasswordWrapper.style.display = 'flex';
                loginBtn.style.display = 'flex';
                loginOptions.style.display = 'flex';
                clearMessage();
            }
        });
    }
    
    // LOGIN
    const loginBtnElem = document.getElementById('login-btn');
    if (loginBtnElem) {
        loginBtnElem.addEventListener('click', function(e) {
            e.preventDefault();
            clearMessage();
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
                    showMessage(getFriendlyErrorMessage(error.code), 'error');
                });
        });
    }
    
    // SIGNUP with email existence check
    const signupBtn = document.getElementById('signup-btn');
    if (signupBtn) {
        signupBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            clearMessage();
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
            
            // Check if email already exists
            let emailExists = false;
            try {
                emailExists = await checkEmailExists(email);
            } catch (err) {
                showMessage('Unable to verify email. Please try again later.', 'error');
                return;
            }
            if (emailExists) {
                showMessage('This email is already registered. Please log in instead.', 'error');
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
                    showMessage(getFriendlyErrorMessage(error.code), 'error');
                });
        });
    }
    
    // FORGOT PASSWORD UI toggling
    if (forgotLink) {
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            clearMessage();
            // Hide password field, login button, remember me checkbox
            if (loginPasswordWrapper) loginPasswordWrapper.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'none';
            if (loginOptions) loginOptions.style.display = 'none';
            // Show reset section
            if (resetSection) resetSection.style.display = 'block';
        });
    }
    
    // Back to login button
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', function() {
            if (loginPasswordWrapper) loginPasswordWrapper.style.display = 'flex';
            if (loginBtn) loginBtn.style.display = 'flex';
            if (loginOptions) loginOptions.style.display = 'flex';
            if (resetSection) resetSection.style.display = 'none';
            clearMessage();
        });
    }
    
    // Send password reset email with existence check
    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener('click', async function() {
            clearMessage();
            const email = loginEmail?.value.trim();
            if (!email) {
                showMessage('Please enter your email address.', 'error');
                return;
            }
            
            // Check if email exists
            let emailExists = false;
            try {
                emailExists = await checkEmailExists(email);
            } catch (err) {
                showMessage('Unable to verify email. Please check your network and try again.', 'error');
                return;
            }
            if (!emailExists) {
                showMessage('No account found with this email address.', 'error');
                return;
            }
            
            firebase.auth().sendPasswordResetEmail(email)
                .then(() => {
                    showMessage('Password reset email sent! Check your inbox.', 'success');
                    // Optionally revert to login form after success
                    if (backToLoginBtn) backToLoginBtn.click();
                })
                .catch((error) => {
                    showMessage(getFriendlyErrorMessage(error.code), 'error');
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
                                .catch(err => showMessage(getFriendlyErrorMessage(err.code), 'error'));
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
    
    // INITIAL AUTH STATE (on login.html)
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
                            showMessage(getFriendlyErrorMessage(error.code), 'error');
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
            if (type !== 'error' && text) {
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 5000);
            }
        }
    }
});