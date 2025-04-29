import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    TextInput,
    FlatList,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ListRenderItemInfo
} from 'react-native';
import { RichText, Toolbar, useEditorBridge, EditorBridge } from '@10play/tentap-editor';

interface Note {
    id: string;
    title: string;
    content: string[];
    lastModified?: string;
}

interface NoteItemProps {
    item: Note;
}

const NotesApp = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [currentNote, setCurrentNote] = useState<Note | null>(null);
    const [isEditorVisible, setIsEditorVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [noteTitle, setNoteTitle] = useState('');

    // ใช้ useRef เพื่อเก็บค่า editor instance
    const editorRef = useRef<EditorBridge | null>(null);

    // แยก initialContent ออกมาเป็น state แยก เพื่อให้สามารถอัพเดตได้
    const [initialContent, setInitialContent] = useState<string[]>(['']);

    // Editor setup - สร้าง editor โดยใช้ค่า initialContent จาก state
    const editor = useEditorBridge({
        autofocus: true,
        avoidIosKeyboard: true,
        initialContent: initialContent,
    });

    // เก็บ editor instance ไว้ใน ref เพื่อให้สามารถเข้าถึงได้จาก effect และ function อื่นๆ
    useEffect(() => {
        if (editor) {
            editorRef.current = editor;
        }
    }, [editor]);

    // Filter notes based on search query
    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.some(content =>
            typeof content === 'string' && content.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    // Create a new note
    const createNewNote = () => {
        const newNote = {
            id: Date.now().toString(),
            title: 'New Note',
            content: ['']
        };
        setCurrentNote(newNote);
        setNoteTitle('New Note');
        // เซ็ต initialContent เป็นข้อความว่าง
        setInitialContent(['']);
        setIsEditorVisible(true);
    };

    // Open an existing note - ส่วนนี้สำคัญมาก
    const openNote = (note: Note) => {
        console.log("Opening note with content:", note.content);
        setCurrentNote(note);
        setNoteTitle(note.title);

        // เซ็ต initialContent ด้วยค่าจากโน้ต
        setInitialContent(note.content);

        setIsEditorVisible(true);
    };

    // อัพเดต editor content เมื่อ currentNote เปลี่ยน
    useEffect(() => {
        if (currentNote && editorRef.current) {
            try {
                console.log("Updating editor with content:", currentNote.content);
                // ลองใช้วิธีนี้แทนการเซ็ต initialContent
                editorRef.current.setContent(currentNote.content);
            } catch (error) {
                console.error("Error setting editor content:", error);
            }
        }
    }, [currentNote?.id]);

    // Save the current note
    const saveNote = async () => {
        if (!currentNote) return;

        try {
            // ดึง HTML content จาก editor
            const html = await editorRef.current?.getHTML() || '';
            console.log("Saving HTML content:", html);

            const updatedNote: Note = {
                ...currentNote,
                title: noteTitle || 'Untitled Note',
                content: [html], // เก็บ HTML content
                lastModified: new Date().toISOString()
            };

            if (notes.find(note => note.id === updatedNote.id)) {
                // Update existing note
                setNotes(notes.map(note => note.id === updatedNote.id ? updatedNote : note));
            } else {
                // Add new note
                setNotes([updatedNote, ...notes]);
            }

            closeEditor();
        } catch (error) {
            console.error('Failed to save note:', error);
            Alert.alert(
                "Save Error",
                "There was a problem saving your note. Please try again."
            );
        }
    };

    // แก้ไขฟังก์ชันทำความสะอาด HTML tags เพื่อใช้ใน preview
    const stripHtmlTags = (html: string): string => {
        if (!html) return '';

        // ลบ HTML tags
        return html.replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    };

    // Delete the current note
    const deleteNote = (id: string) => {
        Alert.alert(
            "Delete Note",
            "Are you sure you want to delete this note?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        setNotes(notes.filter(note => note.id !== id));
                        if (currentNote && currentNote.id === id) {
                            closeEditor();
                        }
                    }
                }
            ]
        );
    };

    // Close the editor
    const closeEditor = () => {
        setIsEditorVisible(false);
        setCurrentNote(null);
        setNoteTitle('');
        // รีเซ็ต initialContent เป็นค่าว่าง
        setInitialContent(['']);
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Invalid date format:', error);
            return 'Unknown date';
        }
    };

    // Note item component
    const NoteItem = ({ item }: NoteItemProps) => {
        // Extract first line of content for preview
        let contentPreview = 'Empty note';

        if (item.content && item.content.length > 0) {
            const rawContent = item.content[0];
            contentPreview = stripHtmlTags(rawContent);
        }

        return (
            <TouchableOpacity
                style={styles.noteItem}
                onPress={() => openNote(item)}
            >
                <View style={styles.noteHeader}>
                    <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
                    <TouchableOpacity onPress={() => deleteNote(item.id)}>
                        <Text style={styles.deleteButton}>×</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.notePreview} numberOfLines={2}>{contentPreview}</Text>
                {item.lastModified && (
                    <Text style={styles.noteDate}>
                        {formatDate(item.lastModified)}
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

    // Initialize with welcome note if no notes exist
    useEffect(() => {
        if (notes.length === 0) {
            setNotes([{
                id: 'welcome',
                title: 'Welcome to GR Planer App!',
                content: ['Tap the + button to create a new note.'],
                lastModified: new Date().toISOString()
            }]);
        }
    }, []);

    const renderItem = ({ item }: ListRenderItemInfo<Note>) => <NoteItem item={item} />;

    // Handle back button/hardware back press
    const handleBackPress = () => {
        if (isEditorVisible) {
            Alert.alert(
                "Unsaved Changes",
                "Do you want to save your changes before leaving?",
                [
                    {
                        text: "Don't Save",
                        onPress: closeEditor,
                        style: "destructive"
                    },
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Save",
                        onPress: saveNote
                    }
                ]
            );
            return true;
        }
        return false;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Main Notes List View */}
            {!isEditorVisible && (
                <View style={styles.listContainer}>
                    <View style={styles.header}>
                        <Text style={styles.appTitle}>GR Planer</Text>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Notes List */}
                    {filteredNotes.length > 0 ? (
                        <FlatList
                            data={filteredNotes}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.notesList}
                        />
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'No notes match your search' : 'No notes yet'}
                            </Text>
                        </View>
                    )}

                    {/* Add New Note Button */}
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={createNewNote}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Note Editor View */}
            {isEditorVisible && (
                <SafeAreaView style={styles.editorContainer}>
                    <View style={styles.editorHeader}>
                        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                            <Text style={styles.backButtonText}>←</Text>
                        </TouchableOpacity>

                        <TextInput
                            style={styles.titleInput}
                            value={noteTitle}
                            onChangeText={setNoteTitle}
                            placeholder="Note title"
                        />

                        <TouchableOpacity onPress={saveNote} style={styles.saveButton}>
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.richTextContainer}>
                        <RichText editor={editor} />
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={styles.toolbarContainer}
                        >
                            <Toolbar editor={editor} />
                        </KeyboardAvoidingView>
                    </View>
                </SafeAreaView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    listContainer: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#2c3e50',
        alignItems: 'center',
    },
    appTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    searchContainer: {
        padding: 10,
        backgroundColor: '#ecf0f1',
    },
    searchInput: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 10,
        fontSize: 16,
    },
    notesList: {
        padding: 10,
    },
    noteItem: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    noteTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    deleteButton: {
        fontSize: 24,
        color: '#e74c3c',
        fontWeight: 'bold',
        paddingHorizontal: 5,
    },
    notePreview: {
        fontSize: 14,
        color: '#555',
        marginBottom: 8,
    },
    noteDate: {
        fontSize: 12,
        color: '#95a5a6',
        textAlign: 'right',
    },
    addButton: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#3498db',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    addButtonText: {
        fontSize: 32,
        color: 'white',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: '#7f8c8d',
    },
    editorContainer: {
        flex: 1,
        backgroundColor: 'white',
    },
    editorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2c3e50',
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    backButton: {
        marginRight: 15,
    },
    backButtonText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    titleInput: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 5,
        padding: 8,
        fontSize: 16,
        marginRight: 10,
    },
    saveButton: {
        backgroundColor: '#2ecc71',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    richTextContainer: {
        flex: 1,
    },
    toolbarContainer: {
        position: 'absolute',
        width: '100%',
        bottom: 0,
    },
});

export default NotesApp;