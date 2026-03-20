console.log('📝 Notes.js loaded');

document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.pathname.includes('notes.html')) return;
    
    let currentNoteId = null;
    let currentUser = null;
    let allNotes = [];
    let autoSaveTimeout;
    let unsubscribe = null; // For real-time listener
    
    // Get elements
    const notesListEl = document.getElementById('notes-list');
    const noteTitle = document.getElementById('note-title');
    const noteContent = document.getElementById('note-content');
    const saveBtn = document.getElementById('save-note-btn');
    const deleteBtn = document.getElementById('delete-note-btn');
    const newNoteBtn = document.getElementById('new-note-btn');
    const searchInput = document.getElementById('search-notes');
    const wordCountEl = document.getElementById('word-count');
    const charCountEl = document.getElementById('char-count');
    const lastSavedEl = document.getElementById('last-saved');
    const currentNoteIdInput = document.getElementById('current-note-id');
    
    // Listen for auth state changes
    firebase.auth().onAuthStateChanged(user => {
        console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
        
        if (user) {
            currentUser = user;
            
            // Update UI with user info
            const userDisplay = document.getElementById('user-display');
            const userAvatar = document.getElementById('user-avatar');
            
            if (userDisplay) {
                userDisplay.textContent = user.displayName || user.email;
            }
            if (userAvatar) {
                userAvatar.textContent = user.displayName ? user.displayName.charAt(0).toUpperCase() : '👤';
            }
            
            // Load this user's notes
            loadUserNotes();
            
        } else {
            console.log('No user, redirecting to login');
            window.location.href = 'index.html';
        }
    });
    
    // Load notes for current user only
    function loadUserNotes() {
        if (!currentUser) {
            console.log('No current user, cannot load notes');
            return;
        }
        
        console.log(`Loading notes for user: ${currentUser.uid} (${currentUser.email})`);
        
        // Show loading state
        if (notesListEl) {
            notesListEl.innerHTML = '<div class="loading">Loading your notes...</div>';
        }
        
        // Unsubscribe from previous listener if exists
        if (unsubscribe) {
            unsubscribe();
        }
        
        // Set up real-time listener for this user's notes only
        unsubscribe = db.collection('notes')
            .where('userId', '==', currentUser.uid)  // CRITICAL: Only get this user's notes
            .orderBy('updatedAt', 'desc')
            .onSnapshot(snapshot => {
                console.log(`Received ${snapshot.size} notes for user ${currentUser.email}`);
                
                allNotes = [];
                
                if (snapshot.empty) {
                    console.log('No notes found for this user');
                    if (notesListEl) {
                        notesListEl.innerHTML = '<div class="no-notes">📝 No notes yet. Click "New Note" to create one!</div>';
                    }
                    return;
                }
                
                snapshot.forEach(doc => {
                    const noteData = doc.data();
                    console.log(`Note: ${doc.id} - ${noteData.title}`);
                    
                    allNotes.push({
                        id: doc.id,
                        ...noteData
                    });
                });
                
                displayNotes(allNotes);
                
            }, error => {
                console.error('Error loading notes:', error);
                if (notesListEl) {
                    notesListEl.innerHTML = `<div class="error">Error loading notes: ${error.message}</div>`;
                }
            });
    }
    
    // Display notes in sidebar
    function displayNotes(notes) {
        if (!notesListEl) return;
        
        let html = '';
        notes.forEach(note => {
            const date = note.updatedAt ? note.updatedAt.toDate() : new Date();
            const formattedDate = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const preview = note.content ? note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '') : 'Empty note';
            
            html += `
                <div class="note-item ${note.id === currentNoteId ? 'selected' : ''}" data-id="${note.id}">
                    <div class="note-item-title">${note.title || 'Untitled'}</div>
                    <div class="note-item-preview">${preview}</div>
                    <div class="note-item-date">${formattedDate}</div>
                </div>
            `;
        });
        
        notesListEl.innerHTML = html;
        
        // Add click listeners to note items
        document.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                const noteId = item.dataset.id;
                console.log(`Loading note: ${noteId}`);
                loadNote(noteId);
            });
        });
    }
    
    // Load a single note
    function loadNote(noteId) {
        db.collection('notes').doc(noteId).get()
            .then(doc => {
                if (doc.exists) {
                    const note = doc.data();
                    
                    // Verify this note belongs to current user
                    if (note.userId !== currentUser.uid) {
                        console.error('Unauthorized: This note belongs to another user');
                        alert('You can only access your own notes');
                        return;
                    }
                    
                    noteTitle.value = note.title || '';
                    noteContent.value = note.content || '';
                    currentNoteId = doc.id;
                    currentNoteIdInput.value = doc.id;
                    deleteBtn.disabled = false;
                    updateWordCount();
                    
                    // Update selected state
                    document.querySelectorAll('.note-item').forEach(item => {
                        item.classList.remove('selected');
                        if (item.dataset.id === currentNoteId) {
                            item.classList.add('selected');
                        }
                    });
                    
                    console.log(`Loaded note: ${note.title}`);
                }
            })
            .catch(error => {
                console.error('Error loading note:', error);
            });
    }
    
    // Save note (automatically adds current user's ID)
    function saveNote() {
        if (!currentUser) {
            alert('You must be logged in to save notes');
            return;
        }
        
        const title = noteTitle.value.trim() || 'Untitled';
        const content = noteContent.value.trim();
        
        if (!content) {
            alert('Please write something in your note');
            return;
        }
        
        // Always include the current user's ID
        const noteData = {
            title: title,
            content: content,
            userId: currentUser.uid,  // CRITICAL: Always set to current user
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (currentNoteId) {
            // Update existing note
            console.log(`Updating note: ${currentNoteId} for user: ${currentUser.uid}`);
            
            db.collection('notes').doc(currentNoteId).update(noteData)
                .then(() => {
                    console.log('Note updated successfully');
                    if (lastSavedEl) {
                        lastSavedEl.textContent = 'Saved just now';
                        setTimeout(() => {
                            lastSavedEl.textContent = '';
                        }, 3000);
                    }
                })
                .catch(error => {
                    console.error('Error updating note:', error);
                    alert('Error saving note: ' + error.message);
                });
        } else {
            // Create new note
            noteData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            
            console.log(`Creating new note for user: ${currentUser.uid}`);
            
            db.collection('notes').add(noteData)
                .then(docRef => {
                    console.log('New note created with ID:', docRef.id);
                    currentNoteId = docRef.id;
                    currentNoteIdInput.value = docRef.id;
                    deleteBtn.disabled = false;
                    
                    if (lastSavedEl) {
                        lastSavedEl.textContent = 'Saved just now';
                        setTimeout(() => {
                            lastSavedEl.textContent = '';
                        }, 3000);
                    }
                })
                .catch(error => {
                    console.error('Error creating note:', error);
                    alert('Error creating note: ' + error.message);
                });
        }
    }
    
    // Delete note
    deleteBtn.addEventListener('click', () => {
        if (!currentNoteId || !currentUser) return;
        
        if (confirm('Are you sure you want to delete this note?')) {
            console.log(`Deleting note: ${currentNoteId} for user: ${currentUser.uid}`);
            
            db.collection('notes').doc(currentNoteId).delete()
                .then(() => {
                    console.log('Note deleted successfully');
                    
                    // Clear form
                    noteTitle.value = '';
                    noteContent.value = '';
                    currentNoteId = null;
                    currentNoteIdInput.value = '';
                    deleteBtn.disabled = true;
                    updateWordCount();
                    lastSavedEl.textContent = '';
                    
                    // Notes list will update automatically via the listener
                })
                .catch(error => {
                    console.error('Error deleting note:', error);
                    alert('Error deleting note: ' + error.message);
                });
        }
    });
    
    // New note
    newNoteBtn.addEventListener('click', () => {
        console.log('Creating new note');
        noteTitle.value = '';
        noteContent.value = '';
        currentNoteId = null;
        currentNoteIdInput.value = '';
        deleteBtn.disabled = true;
        updateWordCount();
        lastSavedEl.textContent = '';
        
        // Remove selected class from all notes
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        noteTitle.focus();
    });
    
    // Save button
    saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        saveNote();
    });
    
    // Auto-save
    noteContent.addEventListener('input', () => {
        updateWordCount();
        
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            if (noteContent.value.trim() && currentUser) {
                saveNote();
            }
        }, 2000);
    });
    
    noteTitle.addEventListener('input', () => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            if (noteContent.value.trim() && currentUser) {
                saveNote();
            }
        }, 2000);
    });
    
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm === '') {
            displayNotes(allNotes);
        } else {
            const filtered = allNotes.filter(note => 
                (note.title && note.title.toLowerCase().includes(searchTerm)) ||
                (note.content && note.content.toLowerCase().includes(searchTerm))
            );
            displayNotes(filtered);
        }
    });
    
    // Update word count
    function updateWordCount() {
        const content = noteContent.value;
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        
        wordCountEl.textContent = `${words} word${words !== 1 ? 's' : ''}`;
        charCountEl.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveNote();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            newNoteBtn.click();
        }
    });
    
    // Clean up listener when page unloads
    window.addEventListener('beforeunload', () => {
        if (unsubscribe) {
            unsubscribe();
        }
    });
});