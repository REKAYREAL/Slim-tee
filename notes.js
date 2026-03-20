document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on notes page
    if (!window.location.pathname.includes('notes.html')) return;
    
    let currentNoteId = null;
    let currentUser = null;
    
    // Get elements
    const notesListEl = document.getElementById('notes-list');
    const noteTitle = document.getElementById('note-title');
    const noteContent = document.getElementById('note-content');
    const saveBtn = document.getElementById('save-note-btn');
    const deleteBtn = document.getElementById('delete-note-btn');
    const newNoteBtn = document.getElementById('new-note-btn');
    const currentNoteIdInput = document.getElementById('current-note-id');
    
    // Listen for auth state
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadNotes();
        }
    });
    
    // Load notes from Firestore
    function loadNotes() {
        if (!currentUser) return;
        
        db.collection('notes')
            .where('userId', '==', currentUser.uid)
            .orderBy('updatedAt', 'desc')
            .onSnapshot(snapshot => {
                let html = '';
                
                if (snapshot.empty) {
                    html = '<div class="loading">No notes yet. Create one!</div>';
                } else {
                    snapshot.forEach(doc => {
                        const note = doc.data();
                        const date = note.updatedAt ? note.updatedAt.toDate() : new Date();
                        const formattedDate = date.toLocaleDateString();
                        
                        html += `
                            <div class="note-item ${doc.id === currentNoteId ? 'selected' : ''}" 
                                 data-id="${doc.id}">
                                <h4>${note.title || 'Untitled'}</h4>
                                <p>${note.content.substring(0, 50)}...</p>
                                <small>${formattedDate}</small>
                            </div>
                        `;
                    });
                }
                
                notesListEl.innerHTML = html;
                
                // Add click listeners to note items
                document.querySelectorAll('.note-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const noteId = item.dataset.id;
                        loadNote(noteId);
                    });
                });
            });
    }
    
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
                
                // Update selected state in sidebar
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
    saveBtn.addEventListener('click', () => {
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
                    console.log('Note updated');
                })
                .catch(error => {
                    console.error('Error updating note:', error);
                });
        } else {
            // Create new note
            noteData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            
            db.collection('notes').add(noteData)
                .then(docRef => {
                    currentNoteId = docRef.id;
                    currentNoteIdInput.value = docRef.id;
                    deleteBtn.disabled = false;
                })
                .catch(error => {
                    console.error('Error creating note:', error);
                });
        }
    });
    
    // Delete note
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
                })
                .catch(error => {
                    console.error('Error deleting note:', error);
                });
        }
    });
    
    // New note
    newNoteBtn.addEventListener('click', () => {
        noteTitle.value = '';
        noteContent.value = '';
        currentNoteId = null;
        currentNoteIdInput.value = '';
        deleteBtn.disabled = true;
        
        // Remove selected class from all notes
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('selected');
        });
    });
    
    // Auto-save (optional)
    let autoSaveTimeout;
    noteContent.addEventListener('input', () => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            if (noteContent.value.trim()) {
                saveBtn.click();
            }
        }, 2000);
    });
});