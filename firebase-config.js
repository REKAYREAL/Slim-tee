// firebase-config.js - Compatibility Mode
const firebaseConfig = {
    apiKey: "AIzaSyCy_F8EZxGhWKvillRukjG3UR5mCM3gewQ",
    authDomain: "notepad-3db43.firebaseapp.com",
    projectId: "notepad-3db43",
    storageBucket: "notepad-3db43.firebasestorage.app",
    messagingSenderId: "410173430855",
    appId: "1:410173430855:web:f0f60c2433b9766f5fe562"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Create global auth and db objects
const auth = firebase.auth();
const db = firebase.firestore();

// Make them globally available
window.auth = auth;
window.db = db;

console.log('Firebase initialized successfully');