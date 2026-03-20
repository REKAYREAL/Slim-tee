document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.pathname.includes('notes.html')) return;
    
    let currentNoteId = null;
    let currentUser = null;
    let allNotes = [];
    let autoSaveTimeout;
    
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
    
    // Listen for auth state
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            document.getElementById('user-display').textContent = user.displayName || user.email;
            loadNotes();
        } else {
            window.location.href = 'index.html';
        }
    });
    
    // Load notes with real-time updates
    function loadNotes() {
        if (!currentUser) return;
        
        db.collection('notes')
            .where('userId', '==', currentUser.uid)
            .orderBy('updatedAt', 'desc')
            .onSnapshot(snapshot => {
                allNotes = [];
                snapshot.forEach(doc => {
                    allNotes.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                displayNotes(allNotes);
            });
    }
    
    // Display notes in sidebar
    function displayNotes(notes) {
        if (notes.length === 0) {
            notesListEl.innerHTML = '<div class="no-notes">No notes yet. Create one!</div>';
            return;
        }
        
        let html = '';
        notes.forEach(note => {
            const date = note.updatedAt ? note.updatedAt.toDate() : new Date();
            const formattedDate = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Get preview (first 100 chars)
            const preview = note.content ? note.content.substring(0, 100) + '...' : 'Empty note';
            
            html += `
                <div class="note-item ${note.id === currentNoteId ? 'selected' : ''}" data-id="${note.id}">
                    <div class="note-item-title">${note.title || 'Untitled'}</div>
                    <div class="note-item-preview">${preview}</div>
                    <div class="note-item-date">${formattedDate}</div>
                </div>
            `;
        });
        
        notesListEl.innerHTML = html;
        
        // Add click listeners
        document.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => loadNote(item.dataset.id));
        });
    }
    
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
    
    // Load a single note
    function loadNote(noteId) {
        db.collection('notes').doc(noteId).get().then(doc => {
            if (doc.exists) {
                const note = doc.data();
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
            }
        });
    }
    
    // Save note
    function saveNote() {
        if (!currentUser) return;
        
        const title = noteTitle.value.trim() || 'Untitled';
        const content = noteContent.value.trim();
        
        if (!content) {
            alert('Please write something in your note');
            return;
        }
        
        const noteData = {
            title: title,
            content: content,
            userId: currentUser.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (currentNoteId) {
            // Update existing note
            db.collection('notes').doc(currentNoteId).update(noteData)
                .then(() => {
                    lastSavedEl.textContent = 'Saved just now';
                    setTimeout(() => {
                        lastSavedEl.textContent = '';
                    }, 3000);
                })
                .catch(error => console.error('Error updating note:', error));
        } else {
            // Create new note
            noteData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            
            db.collection('notes').add(noteData)
                .then(docRef => {
                    currentNoteId = docRef.id;
                    currentNoteIdInput.value = docRef.id;
                    deleteBtn.disabled = false;
                    lastSavedEl.textContent = 'Saved just now';
                })
                .catch(error => console.error('Error creating note:', error));
        }
    }
    
    // Auto-save
    function triggerAutoSave() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            if (noteContent.value.trim() && currentUser) {
                saveNote();
            }
        }, 2000);
    }
    
    // Update word and character count
    function updateWordCount() {
        const content = noteContent.value;
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        
        wordCountEl.textContent = `${words} word${words !== 1 ? 's' : ''}`;
        charCountEl.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
    }
    
    // Event listeners
    saveBtn.addEventListener('click', saveNote);
    
    noteContent.addEventListener('input', () => {
        updateWordCount();
        triggerAutoSave();
    });
    
    noteTitle.addEventListener('input', triggerAutoSave);
    
    deleteBtn.addEventListener('click', () => {
        if (!currentNoteId) return;
        
        if (confirm('Are you sure you want to delete this note?')) {
            db.collection('notes').doc(currentNoteId).delete()
                .then(() => {
                    // Clear form
                    noteTitle.value = '';
                    noteContent.value = '';
                    currentNoteId = null;
                    currentNoteIdInput.value = '';
                    deleteBtn.disabled = true;
                    updateWordCount();
                    lastSavedEl.textContent = '';
                })
                .catch(error => console.error('Error deleting note:', error));
        }
    });
    
    newNoteBtn.addEventListener('click', () => {
        noteTitle.value = '';
        noteContent.value = '';
        currentNoteId = null;
        currentNoteIdInput.value = '';
        deleteBtn.disabled = true;
        updateWordCount();
        lastSavedEl.textContent = '';
        
        // Remove selected class
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Focus on title
        noteTitle.focus();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveNote();
        }
        
        // Ctrl/Cmd + N for new note
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            newNoteBtn.click();
        }
    });
});