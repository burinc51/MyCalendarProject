import React, { useCallback, useState } from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    Modal,
    Dimensions,
    TouchableOpacity,
    Text
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

// Components
import { NoteList, NoteEditor, FolderList } from '@/components/Note';
import { useTheme } from '@/components/ThemeProvider';
import Toast from '@/components/ui/Toast';

// Hooks
import { useNotes } from '@/hooks/useNotes';

// Types
import type { Note } from '@/types/note';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

const NotesScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

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
        notes,
        toast,
        hideToast,
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
            console.log('Updated note:', editingNote);
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

    // Dynamic styles based on theme
    const dynamicStyles = {
        container: {
            flex: 1,
            backgroundColor: isDark ? '#171717' : '#f8f9fa'
        },
        header: {
            backgroundColor: isDark ? '#262626' : '#fff',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#404040' : '#f0f0f0'
        },
        folderButton: {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            backgroundColor: isDark ? '#404040' : '#f5f5f5',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            gap: 8
        },
        folderButtonText: {
            fontFamily: 'Kanit-Bold',
            fontSize: 15,
            color: isDark ? '#e5e5e5' : '#2c3e50',
            flex: 1
        },
        drawerContent: {
            width: DRAWER_WIDTH,
            backgroundColor: isDark ? '#262626' : '#f8f9fa',
            position: 'absolute' as const,
            left: 0,
            top: 0,
            bottom: 0,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 10
        }
    };

    return (
        <SafeAreaView style={dynamicStyles.container}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={isDark ? '#171717' : '#f8f9fa'}
            />

            {/* Header with Folder Toggle */}
            <View style={dynamicStyles.header}>
                <TouchableOpacity
                    style={dynamicStyles.folderButton}
                    onPress={() => setShowFolderDrawer(true)}
                >
                    <Feather name="folder" size={20} color={isDark ? '#e5e5e5' : '#2c3e50'} />
                    <Text style={dynamicStyles.folderButtonText} numberOfLines={1}>
                        {getSelectedFolderName()}
                    </Text>
                    <Feather name="chevron-down" size={16} color={isDark ? '#a3a3a3' : '#999'} />
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
                    <View style={dynamicStyles.drawerContent}>
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

            {/* Toast notification */}
            <Toast message={toast} onHide={hideToast} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    drawerOverlay: {
        flex: 1,
        flexDirection: 'row'
    },
    drawerBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)'
    }
});

export default NotesScreen;
