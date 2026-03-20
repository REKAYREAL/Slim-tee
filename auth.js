// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    
    // Check which page we're on
    const isNotesPage = window.location.pathname.includes('notes.html');
    
    if (isNotesPage) {
        // Check authentication on notes page
        auth.onAuthStateChanged(user => {
            if (!user) {
                // Redirect to login if not authenticated
                window.location.href = 'index.html';
            } else {
                // Display user name
                document.getElementById('user-display').textContent = 
                    user.displayName || user.email;
            }
        });
        
        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        });
        
    } else {
        // Login/Signup page logic
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const showLoginBtn = document.getElementById('show-login');
        const showSignupBtn = document.getElementById('show-signup');
        const messageDiv = document.getElementById('message');

        // Toggle between login and signup
        showLoginBtn.addEventListener('click', () => {
            showLoginBtn.classList.add('active');
            showSignupBtn.classList.remove('active');
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        });

        showSignupBtn.addEventListener('click', () => {
            showSignupBtn.classList.add('active');
            showLoginBtn.classList.remove('active');
            signupForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        });

        // Login functionality
        document.getElementById('login-btn').addEventListener('click', () => {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (!email || !password) {
                showMessage('Please fill in all fields', 'error');
                return;
            }
            
            auth.signInWithEmailAndPassword(email, password)
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

        // Signup functionality
        document.getElementById('signup-btn').addEventListener('click', () => {
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            
            if (!email || !password) {
                showMessage('Please fill in all fields', 'error');
                return;
            }
            
            if (password.length < 6) {
                showMessage('Password must be at least 6 characters', 'error');
                return;
            }
            
            auth.createUserWithEmailAndPassword(email, password)
                .then(userCredential => {
                    // Update profile with display name
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

        function showMessage(text, type) {
            messageDiv.textContent = text;
            messageDiv.className = `message ${type}`;
        }
    }
});