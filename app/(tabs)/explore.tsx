import React, { useState, useCallback } from 'react';
import { 
    View, 
    TextInput, 
    FlatList, 
    Text, 
    TouchableOpacity, 
    Modal, 
    StyleSheet,
    StatusBar,
    SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const initialNotes = [
    { 
        id: '1', 
        title: 'Welcome Note Function', 
        content: 'Welcome to GR Planer App! Tap the + button to create a new note.',
        date: new Date().toLocaleDateString()
    }
];

const NotesApp = () => {
    const [notes, setNotes] = useState(initialNotes);
    const [newNote, setNewNote] = useState({ title: '', content: '' });
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredNotes = notes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const resetNoteFields = () => {
        setNewNote({ title: '', content: '' });
        setSelectedNoteId(null);
        setModalVisible(false);
    };

    const handleAddOrUpdateNote = useCallback(() => {
        if (!newNote.title.trim() || !newNote.content.trim()) {
            alert('Please fill in both title and content');
            return;
        }

        const updatedNotes = selectedNoteId 
            ? notes.map(note => 
                note.id === selectedNoteId 
                    ? { ...note, ...newNote, date: new Date().toLocaleDateString() } 
                    : note
              )
            : [
                { 
                    ...newNote, 
                    id: String(Date.now()), 
                    date: new Date().toLocaleDateString() 
                }, 
                ...notes
              ];
        
        setNotes(updatedNotes);
        resetNoteFields();
    }, [newNote, notes, selectedNoteId]);

    const handleDeleteNote = () => {
      if (selectedNoteId) {
          const updatedNotes = notes.filter((note) => note.id !== selectedNoteId);
          setNotes(updatedNotes);
          setDeleteModalVisible(false); 
          setSelectedNoteId(null); 
      } else {
          alert('No note selected');
      }
    };
  
    const closeDeleteModal = () => {
        setDeleteModalVisible(false);
    };

    const handleEditNote = (note : any) => {
        setNewNote({ title: note.title, content: note.content });
        setSelectedNoteId(note.id);
        setModalVisible(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
            
            <View style={styles.header}>
                <Text style={styles.title}>My Notes</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filteredNotes}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.noteItem}
                        onPress={() => handleEditNote(item)}
                    >
                        <View style={styles.noteContent}>
                            <Text style={styles.noteTitle}>{item.title}</Text>
                            <Text style={styles.noteText} numberOfLines={2}>
                                {item.content}
                            </Text>
                            <Text style={styles.noteDate}>{item.date}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedNoteId(item.id);
                                setDeleteModalVisible(true);
                            }}
                            style={styles.deleteButton}
                        >
                            <Ionicons name="trash-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={resetNoteFields}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {selectedNoteId ? 'Edit Note' : 'Create Note'}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Title"
                            value={newNote.title}
                            onChangeText={(text) => setNewNote({ ...newNote, title: text })}
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Write your note here..."
                            value={newNote.content}
                            onChangeText={(text) => setNewNote({ ...newNote, content: text })}
                            multiline
                            textAlignVertical="top"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]} 
                                onPress={resetNoteFields}
                            >
                                <Ionicons name="close-outline" size={24} color="#666" />
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.saveButton]} 
                                onPress={handleAddOrUpdateNote}
                            >
                                <Ionicons name="checkmark" size={24} color="#fff" />
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={deleteModalVisible}
                onRequestClose={closeDeleteModal}
            >
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalContent, styles.deleteModalContent]}>
                        <Ionicons name="warning" size={48} color="#ff6b6b" />
                        <Text style={styles.deleteModalTitle}>Delete Note?</Text>
                        <Text style={styles.deleteModalText}>
                            This action cannot be undone.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]} 
                                onPress={closeDeleteModal}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.deleteButton]} 
                                onPress={handleDeleteNote}
                            >
                                <Text style={styles.deleteText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    addButton: {
        backgroundColor: '#4CAF50',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 10,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    noteItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        elevation: 2,
        overflow: 'hidden',
    },
    noteContent: {
        flex: 1,
        padding: 16,
    },
    noteTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    noteText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    noteDate: {
        fontSize: 12,
        color: '#aaa',
    },
    deleteButton: {
        backgroundColor: '#ff6b6b',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        width: 50,
        borderRadius: 10,
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        width: '85%',
        maxWidth: 500,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        marginBottom: 20,
        fontSize: 16,
        padding: 10,
        color: '#333',
    },
    textArea: {
        height: 150,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        padding: 10,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#ddd',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
    },
    cancelButtonText: {
        color: '#666',
    },
    saveButtonText: {
        color: '#fff',
    },
    deleteModalContent: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
        maxWidth: 350,
    },
    deleteModalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 10,
    },
    deleteModalText: {
        fontSize: 16,
        color: '#666',
        marginVertical: 10,
        textAlign: 'center',
    },
    deleteText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default NotesApp;
