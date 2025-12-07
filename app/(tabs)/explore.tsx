import React, { useState, useEffect } from 'react';
import {
    View,
    TextInput,
    FlatList,
    Text,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Animated,
    Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Note {
    id: string;
    title: string;
    content: string;
    lastModified?: string;
    color?: string;
}

const { width } = Dimensions.get('window');

// Premium color palette for note accents
const NOTE_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];

const NotesApp = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [currentNote, setCurrentNote] = useState<Note | null>(null);
    const [isEditorVisible, setIsEditorVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [fabScale] = useState(new Animated.Value(0));

    useEffect(() => {
        if (notes.length === 0) {
            setNotes([
                {
                    id: 'welcome',
                    title: 'Welcome to Notes!',
                    content: 'Start capturing your thoughts, ideas, and reminders. Tap the + button below to create your first note.',
                    lastModified: new Date().toISOString(),
                    color: NOTE_COLORS[0]
                }
            ]);
        }

        // Animate FAB on mount
        Animated.spring(fabScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true
        }).start();
    }, []);

    const filteredNotes = notes.filter(
        (note) => note.title.toLowerCase().includes(searchQuery.toLowerCase()) || note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const createNewNote = () => {
        const newNote: Note = {
            id: Date.now().toString(),
            title: '',
            content: '',
            color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
        };
        setCurrentNote(newNote);
        setNoteTitle('');
        setNoteContent('');
        setIsEditorVisible(true);
    };

    const openNote = (note: Note) => {
        setCurrentNote(note);
        setNoteTitle(note.title);
        setNoteContent(note.content);
        setIsEditorVisible(true);
    };

    const saveNote = () => {
        if (!currentNote) return;

        // Don't save if both title and content are empty
        if (!noteTitle.trim() && !noteContent.trim()) {
            closeEditor();
            return;
        }

        const updatedNote: Note = {
            ...currentNote,
            title: noteTitle.trim() || 'Untitled Note',
            content: noteContent.trim(),
            lastModified: new Date().toISOString()
        };

        setNotes((prev) => (prev.find((n) => n.id === updatedNote.id) ? prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)) : [updatedNote, ...prev]));

        closeEditor();
    };

    const deleteNote = (id: string) => {
        Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setNotes((prev) => prev.filter((n) => n.id !== id));
                    if (currentNote?.id === id) closeEditor();
                }
            }
        ]);
    };

    const closeEditor = () => {
        setIsEditorVisible(false);
        setCurrentNote(null);
        setNoteTitle('');
        setNoteContent('');
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;

            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return '';
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    const NoteItem = ({ item, index }: { item: Note; index: number }) => {
        const itemOpacity = new Animated.Value(0);
        const itemTranslateY = new Animated.Value(20);

        useEffect(() => {
            Animated.parallel([
                Animated.timing(itemOpacity, {
                    toValue: 1,
                    duration: 300,
                    delay: index * 50,
                    useNativeDriver: true
                }),
                Animated.timing(itemTranslateY, {
                    toValue: 0,
                    duration: 300,
                    delay: index * 50,
                    useNativeDriver: true
                })
            ]).start();
        }, []);

        return (
            <Animated.View
                style={[
                    styles.noteCard,
                    {
                        opacity: itemOpacity,
                        transform: [{ translateY: itemTranslateY }]
                    }
                ]}
            >
                <View style={[styles.noteColorBar, { backgroundColor: item.color || NOTE_COLORS[0] }]} />
                <TouchableOpacity
                    style={styles.noteCardContent}
                    onPress={() => openNote(item)}
                    activeOpacity={0.7}
                >
                    <View style={styles.noteHeader}>
                        <Text
                            style={styles.noteTitle}
                            numberOfLines={1}
                        >
                            {item.title || 'Untitled Note'}
                        </Text>
                        <TouchableOpacity
                            onPress={() => deleteNote(item.id)}
                            style={styles.deleteButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialIcons
                                name="delete-outline"
                                size={20}
                                color="#e74c3c"
                            />
                        </TouchableOpacity>
                    </View>
                    <Text
                        style={styles.noteContent}
                        numberOfLines={3}
                    >
                        {item.content || 'No content'}
                    </Text>
                    {item.lastModified && (
                        <View style={styles.noteFooter}>
                            <MaterialIcons
                                name="access-time"
                                size={12}
                                color="#95a5a6"
                            />
                            <Text style={styles.noteTime}>{formatDate(item.lastModified)}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#f8f9fa"
            />
            {!isEditorVisible ? (
                <View style={styles.mainContainer}>
                    {/* Modern Header */}
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <MaterialIcons
                                name="note"
                                size={28}
                                color="#6366f1"
                            />
                            <Text style={styles.headerTitle}>Notes</Text>
                        </View>
                        <View style={styles.noteCountBadge}>
                            <Text style={styles.noteCountText}>{notes.length}</Text>
                        </View>
                    </View>

                    {/* Enhanced Search Bar */}
                    <View style={styles.searchContainer}>
                        <MaterialIcons
                            name="search"
                            size={20}
                            color="#95a5a6"
                            style={styles.searchIcon}
                        />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search notes..."
                            placeholderTextColor="#95a5a6"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                onPress={clearSearch}
                                style={styles.clearButton}
                            >
                                <MaterialIcons
                                    name="close"
                                    size={18}
                                    color="#95a5a6"
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Notes List or Empty State */}
                    {filteredNotes.length > 0 ? (
                        <FlatList
                            data={filteredNotes}
                            renderItem={({ item, index }) => (
                                <NoteItem
                                    item={item}
                                    index={index}
                                />
                            )}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>{searchQuery ? '🔍' : '📝'}</Text>
                            <Text style={styles.emptyTitle}>{searchQuery ? 'No notes found' : 'No notes yet'}</Text>
                            <Text style={styles.emptySubtitle}>
                                {searchQuery ? 'Try a different search term' : 'Tap the + button to create your first note'}
                            </Text>
                        </View>
                    )}

                    {/* Premium FAB */}
                    <Animated.View
                        style={[
                            styles.fabContainer,
                            {
                                transform: [{ scale: fabScale }]
                            }
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.fab}
                            onPress={createNewNote}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons
                                name="add"
                                size={28}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            ) : (
                <SafeAreaView style={styles.editorContainer}>
                    {/* Editor Header */}
                    <View style={styles.editorHeader}>
                        <TouchableOpacity
                            onPress={closeEditor}
                            style={styles.backButton}
                        >
                            <MaterialIcons
                                name="arrow-back"
                                size={24}
                                color="#2c3e50"
                            />
                        </TouchableOpacity>
                        <View style={styles.editorHeaderCenter}>
                            <Text style={styles.editorHeaderText}>Edit Note</Text>
                        </View>
                        <TouchableOpacity
                            onPress={saveNote}
                            style={styles.saveButton}
                        >
                            <MaterialIcons
                                name="check"
                                size={24}
                                color="#10b981"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Title Input */}
                    <View style={styles.titleContainer}>
                        <TextInput
                            style={styles.titleInput}
                            placeholder="Note title..."
                            placeholderTextColor="#95a5a6"
                            value={noteTitle}
                            onChangeText={setNoteTitle}
                        />
                    </View>

                    {/* Content Input */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.contentContainer}
                    >
                        <TextInput
                            style={styles.contentInput}
                            multiline
                            placeholder="Start writing..."
                            value={noteContent}
                            onChangeText={setNoteContent}
                            placeholderTextColor="#95a5a6"
                            textAlignVertical="top"
                        />
                    </KeyboardAvoidingView>

                    {/* Word Count */}
                    <View style={styles.statsBar}>
                        <Text style={styles.statsText}>
                            {noteContent.split(/\s+/).filter((word) => word.length > 0).length} words • {noteContent.length} characters
                        </Text>
                    </View>
                </SafeAreaView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    mainContainer: {
        flex: 1
    },
    // Header Styles
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: 'Kanit-Bold',
        color: '#2c3e50',
        letterSpacing: 0.5
    },
    noteCountBadge: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 32,
        alignItems: 'center'
    },
    noteCountText: {
        fontSize: 12,
        fontFamily: 'Kanit-Bold',
        color: '#fff'
    },
    // Search Bar Styles
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3
    },
    searchIcon: {
        marginRight: 10
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Kanit-Regular',
        color: '#2c3e50',
        padding: 0
    },
    clearButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ecf0f1',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8
    },
    // Note Card Styles
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100
    },
    noteCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3
    },
    noteColorBar: {
        width: 5,
        backgroundColor: '#6366f1'
    },
    noteCardContent: {
        flex: 1,
        padding: 16
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    noteTitle: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Kanit-Bold',
        color: '#2c3e50',
        marginRight: 8
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fadbd8',
        justifyContent: 'center',
        alignItems: 'center'
    },
    noteContent: {
        fontSize: 14,
        fontFamily: 'Kanit-Regular',
        color: '#7f8c8d',
        lineHeight: 20,
        marginBottom: 8
    },
    noteFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    noteTime: {
        fontSize: 12,
        fontFamily: 'Kanit-Regular',
        color: '#95a5a6'
    },
    // Empty State Styles
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
        opacity: 0.6
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: 'Kanit-Bold',
        color: '#2c3e50',
        marginBottom: 8
    },
    emptySubtitle: {
        fontSize: 14,
        fontFamily: 'Kanit-Regular',
        color: '#95a5a6',
        textAlign: 'center'
    },
    // FAB Styles
    fabContainer: {
        position: 'absolute',
        right: 20,
        bottom: 20
    },
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8
    },
    // Editor Styles
    editorContainer: {
        flex: 1,
        backgroundColor: '#fff'
    },
    editorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1'
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center'
    },
    editorHeaderCenter: {
        flex: 1,
        alignItems: 'center'
    },
    editorHeaderText: {
        fontSize: 16,
        fontFamily: 'Kanit-Bold',
        color: '#2c3e50'
    },
    saveButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#d1fae5',
        justifyContent: 'center',
        alignItems: 'center'
    },
    titleContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1'
    },
    titleInput: {
        fontSize: 20,
        fontFamily: 'Kanit-Bold',
        color: '#2c3e50',
        padding: 0
    },
    contentContainer: {
        flex: 1
    },
    contentInput: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        fontSize: 15,
        fontFamily: 'Kanit-Regular',
        color: '#2c3e50',
        lineHeight: 24
    },
    statsBar: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#ecf0f1',
        backgroundColor: '#f8f9fa'
    },
    statsText: {
        fontSize: 12,
        fontFamily: 'Kanit-Regular',
        color: '#95a5a6',
        textAlign: 'center'
    }
});

export default NotesApp;
