import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StatusBar, SafeAreaView, Alert, KeyboardAvoidingView, Platform } from 'react-native';

interface Note {
    id: string;
    title: string;
    content: string;
    lastModified?: string;
}

const PRIMARY = 'text-blue-500';

const NotesApp = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [currentNote, setCurrentNote] = useState<Note | null>(null);
    const [isEditorVisible, setIsEditorVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');

    useEffect(() => {
        if (notes.length === 0) {
            setNotes([
                {
                    id: 'welcome',
                    title: 'Welcome!',
                    content: 'Tap + to create a new note.',
                    lastModified: new Date().toISOString()
                }
            ]);
        }
    }, []);

    const filteredNotes = notes.filter((note) => note.title.toLowerCase().includes(searchQuery.toLowerCase()) || note.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const createNewNote = () => {
        const newNote: Note = {
            id: Date.now().toString(),
            title: '',
            content: ''
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
        Alert.alert('Delete', 'Delete this note?', [
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
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '';
        }
    };

    const NoteItem = ({ item }: { item: Note }) => (
        <TouchableOpacity
            className="bg-gray-100 border border-gray-200 rounded-md p-3 my-1"
            onPress={() => openNote(item)}
            activeOpacity={0.7}
        >
            <View className="flex-row items-center mb-1">
                <Text
                    className="flex-1 text-base font-kanit-bold text-gray-800"
                    numberOfLines={1}
                >
                    {item.title || 'Untitled Note'}
                </Text>
                <TouchableOpacity
                    onPress={() => deleteNote(item.id)}
                    className="ml-2 px-2"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text className="text-gray-400 text-base">🗑️</Text>
                </TouchableOpacity>
            </View>
            <Text
                className="text-sm text-gray-600 my-1"
                numberOfLines={2}
            >
                {item.content || 'Empty note'}
            </Text>
            {item.lastModified && <Text className="text-xs text-gray-400 self-end">{formatDate(item.lastModified)}</Text>}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar
                barStyle="dark-content"
                backgroundColor="white"
            />
            {!isEditorVisible ? (
                <View className="flex-1">
                    <Text className={`text-xl font-kanit-bold ${PRIMARY} self-center my-4`}>Notes</Text>
                    <TextInput
                        className="bg-gray-100 rounded-md text-base px-3 py-2 mx-4 mb-1 text-gray-800"
                        placeholder="Search…"
                        placeholderTextColor="#bbb"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {filteredNotes.length > 0 ? (
                        <FlatList
                            data={filteredNotes}
                            renderItem={({ item }) => <NoteItem item={item} />}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 80 }}
                            keyboardShouldPersistTaps="handled"
                        />
                    ) : (
                        <View className="flex-1 justify-center items-center mt-6">
                            <Text className="text-base text-gray-500 font-kanit-bold">{searchQuery ? 'No notes found.' : 'No notes yet.'}</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        className="absolute right-6 bottom-7 w-12 h-12 rounded-full bg-blue-500 justify-center items-center"
                        onPress={createNewNote}
                        activeOpacity={0.8}
                    >
                        <Text className="text-white text-3xl font-light -mt-1">＋</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <SafeAreaView className="flex-1">
                    <View className="flex-row items-center border-b border-gray-200 px-3 py-3">
                        <TouchableOpacity
                            onPress={closeEditor}
                            className="px-2"
                        >
                            <Text className="text-2xl font-kanit-bold text-gray-700">←</Text>
                        </TouchableOpacity>
                        <TextInput
                            className="flex-1 text-lg font-kanit-bold mx-2 text-gray-800"
                            placeholder="Title"
                            placeholderTextColor="#bbb"
                            value={noteTitle}
                            onChangeText={setNoteTitle}
                        />
                        <TouchableOpacity
                            onPress={saveNote}
                            className="px-3"
                        >
                            <Text className="text-base font-kanit-bold text-blue-500">Save</Text>
                        </TouchableOpacity>
                    </View>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1"
                    >
                        <TextInput
                            className="flex-1 p-4 text-base text-gray-800"
                            multiline
                            placeholder="Write your note here..."
                            value={noteContent}
                            onChangeText={setNoteContent}
                            placeholderTextColor="#999"
                            textAlignVertical="top"
                        />
                    </KeyboardAvoidingView>
                </SafeAreaView>
            )}
        </SafeAreaView>
    );
};

export default NotesApp;
