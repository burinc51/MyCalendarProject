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

// Components
import { NoteList, NoteEditor } from '@/components/Note';
import { useTheme } from '@/components/ThemeProvider';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';
import Toast from '@/components/ui/Toast';

// Hooks
import { useNotes } from '@/hooks/useNotes';

// Types
import type { Note } from '@/types/note';

const NotesScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { headerHeight, horizontalPadding, titleFontSize, isSmallPhone, isTablet } = useResponsiveDimensions();

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

    // Dynamic styles based on theme
    const dynamicStyles = {
        container: {
            flex: 1,
            backgroundColor: isDark ? '#171717' : '#f8f9fa'
        },
        header: {
            height: headerHeight,
            backgroundColor: isDark ? '#171717' : '#fff',
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            justifyContent: 'space-between' as const,
            paddingHorizontal: horizontalPadding,
            borderBottomWidth: 0.25,
            borderBottomColor: '#424141a9',
        },
        headerTitle: {
            fontFamily: 'Kanit-Bold',
            fontSize: isSmallPhone ? 18 : isTablet ? 24 : titleFontSize,
            color: isDark ? '#f5f5f5' : '#2c3e50',
            letterSpacing: 0.5,
        }
    };

    return (
        <View style={dynamicStyles.container}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={isDark ? '#171717' : '#f8f9fa'}
            />

            {/* Header */}
            <View style={dynamicStyles.header}>
                <Text style={dynamicStyles.headerTitle}>All Notes</Text>
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

            {/* Toast notification */}
            <Toast message={toast} onHide={hideToast} />
        </View>
    );
};

const styles = StyleSheet.create({});

export default NotesScreen;
