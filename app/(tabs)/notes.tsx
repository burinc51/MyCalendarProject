import React, { useCallback } from 'react';
import { View, Text, StyleSheet, StatusBar, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { NoteList, NoteEditor } from '@/components/Note';
import { useTheme } from '@/components/ThemeProvider';
import Toast from '@/components/ui/Toast';
import { useNotes } from '@/hooks/useNotes';
import type { Note } from '@/types/note';

const NotesScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();

    const {
        filteredNotes, isLoading, noteFormData, editingNote, showNoteEditor,
        viewMode, sortBy, searchQuery,
        fetchNotes, setShowNoteEditor, updateNoteFormData, initNoteForm,
        createNote, updateNote, deleteNote, togglePin,
        setViewMode, setSortBy, setSearchQuery, toast, hideToast,
    } = useNotes();

    const handleNotePress   = useCallback((note: Note) => { initNoteForm(note);  setShowNoteEditor(true); }, [initNoteForm, setShowNoteEditor]);
    const handleAddNote     = useCallback(() => { initNoteForm(); setShowNoteEditor(true); }, [initNoteForm, setShowNoteEditor]);
    const handleSaveNote    = useCallback(() => { editingNote ? updateNote() : createNote(); }, [editingNote, updateNote, createNote]);
    const handleCancelEditor = useCallback(() => setShowNoteEditor(false), [setShowNoteEditor]);

    const C = {
        bg:     isDark ? '#111111' : '#ffffff',
        text:   isDark ? '#f0f0f0' : '#111111',
        muted:  isDark ? '#6b6b6b' : '#aaaaaa',
        border: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
    };

    return (
        <View style={[styles.root, { backgroundColor: isDark ? '#0d0d0d' : '#f7f7f7' }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={C.bg}
            />

            {/* ── Header ── */}
            <View style={[styles.header, { backgroundColor: C.bg, paddingTop:  10, borderBottomColor: C.border }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: C.text }]}>บันทึก</Text>
                    <Text style={[styles.headerSub, { color: C.muted }]}>
                        {filteredNotes.length > 0 ? `${filteredNotes.length} รายการ` : 'จดสิ่งที่คิดไว้ที่นี่'}
                    </Text>
                </View>
                <View style={[styles.headerIconBox, { backgroundColor: isDark ? '#1e1e1e' : '#f2f2f2' }]}>
                    <Feather name="file-text" size={18} color={C.muted} />
                </View>
            </View>

            {/* ── Note List ── */}
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

            {/* ── Note Editor Modal ── */}
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

            <Toast message={toast} onHide={hideToast} />
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontFamily: 'Kanit-Bold',
        fontSize: 26,
        letterSpacing: -0.3,
        lineHeight: 30,
    },
    headerSub: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
        marginTop: 2,
    },
    headerIconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default NotesScreen;
