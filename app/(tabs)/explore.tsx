/**
 * Notes Tab
 * Main notes screen with NoteList, FolderList sidebar, and NoteEditor
 * Uses the new Note components and useNotes hook
 */

import React, { useCallback, useState } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Modal,
    Dimensions,
    TouchableOpacity,
    Text
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// Components
import { NoteList, NoteEditor, FolderList } from '@/components/Note';

// Hooks
import { useNotes } from '@/hooks/useNotes';

// Types
import type { Note } from '@/types/note';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

const NotesScreen = () => {
    const [showFolderDrawer, setShowFolderDrawer] = useState(false);

    const {
        // Notes
        filteredNotes,
        isLoading,
        noteFormData,
        editingNote,
        showNoteEditor,
        viewMode,
        sortBy,
        searchQuery,
        // Folders
        folders,
        selectedFolderId,
        folderFormData,
        showFolderForm,
        // Actions
        fetchNotes,
        setShowNoteEditor,
        updateNoteFormData,
        initNoteForm,
        createNote,
        updateNote,
        deleteNote,
        togglePin,
        setViewMode,
        setSortBy,
        setSearchQuery,
        setSelectedFolderId,
        setShowFolderForm,
        updateFolderFormData,
        createFolder,
        deleteFolder,
        resetFolderForm,
        notes
    } = useNotes();

    // Handle note press - open editor
    const handleNotePress = useCallback((note: Note) => {
        initNoteForm(note);
        setShowNoteEditor(true);
    }, [initNoteForm, setShowNoteEditor]);

    // Handle add new note
    const handleAddNote = useCallback(() => {
        initNoteForm();
        setShowNoteEditor(true);
    }, [initNoteForm, setShowNoteEditor]);

    // Handle save note
    const handleSaveNote = useCallback(() => {
        if (editingNote) {
            updateNote();
        } else {
            createNote();
        }
    }, [editingNote, updateNote, createNote]);

    // Handle cancel editor
    const handleCancelEditor = useCallback(() => {
        setShowNoteEditor(false);
    }, [setShowNoteEditor]);

    // Handle folder creation
    const handleCreateFolder = useCallback(() => {
        setShowFolderForm(true);
    }, [setShowFolderForm]);

    // Handle folder form submit
    const handleFolderFormSubmit = useCallback(() => {
        createFolder();
    }, [createFolder]);

    // Handle folder form cancel
    const handleFolderFormCancel = useCallback(() => {
        setShowFolderForm(false);
        resetFolderForm();
    }, [setShowFolderForm, resetFolderForm]);

    // Handle folder select
    const handleSelectFolder = useCallback((folderId: number | null) => {
        setSelectedFolderId(folderId);
        setShowFolderDrawer(false);
    }, [setSelectedFolderId]);

    // Get currently selected folder name
    const getSelectedFolderName = useCallback(() => {
        if (selectedFolderId === null) return 'All Notes';
        const folder = folders.find(f => f.id === selectedFolderId);
        return folder?.name || 'All Notes';
    }, [selectedFolderId, folders]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            {/* Header with Folder Toggle */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.folderButton}
                    onPress={() => setShowFolderDrawer(true)}
                >
                    <Feather name="folder" size={20} color="#2c3e50" />
                    <Text style={styles.folderButtonText} numberOfLines={1}>
                        {getSelectedFolderName()}
                    </Text>
                    <Feather name="chevron-down" size={16} color="#999" />
                </TouchableOpacity>
            </View>

            {/* Notes List */}
            <NoteList
                notes={filteredNotes}
                isLoading={isLoading}
                viewMode={viewMode}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onNotePress={handleNotePress}
                onNoteLongPress={(note) => deleteNote(note.id)}
                onTogglePin={togglePin}
                onRefresh={fetchNotes}
                onViewModeChange={setViewMode}
                onAddNote={handleAddNote}
                sortBy={sortBy}
                onSortChange={setSortBy}
            />

            {/* Note Editor Modal */}
            <Modal
                visible={showNoteEditor}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={handleCancelEditor}
            >
                <NoteEditor
                    formData={noteFormData}
                    isEditing={!!editingNote}
                    onUpdateField={updateNoteFormData}
                    onSave={handleSaveNote}
                    onCancel={handleCancelEditor}
                />
            </Modal>

            {/* Folder Drawer Modal */}
            <Modal
                visible={showFolderDrawer}
                animationType="fade"
                transparent
                onRequestClose={() => setShowFolderDrawer(false)}
            >
                <View style={styles.drawerOverlay}>
                    <TouchableOpacity
                        style={styles.drawerBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowFolderDrawer(false)}
                    />
                    <View style={styles.drawerContent}>
                        <FolderList
                            folders={folders}
                            selectedFolderId={selectedFolderId}
                            onSelectFolder={handleSelectFolder}
                            onCreateFolder={handleCreateFolder}
                            onDeleteFolder={deleteFolder}
                            totalNoteCount={notes.length}
                            showCreateForm={showFolderForm}
                            folderFormData={folderFormData}
                            onFormDataChange={updateFolderFormData}
                            onFormSubmit={handleFolderFormSubmit}
                            onFormCancel={handleFolderFormCancel}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    folderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8
    },
    folderButtonText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 15,
        color: '#2c3e50',
        flex: 1
    },
    drawerOverlay: {
        flex: 1,
        flexDirection: 'row'
    },
    drawerBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)'
    },
    drawerContent: {
        width: DRAWER_WIDTH,
        backgroundColor: '#f8f9fa',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10
    }
});

export default NotesScreen;
