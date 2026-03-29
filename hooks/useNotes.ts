/**
 * useNotes Hook
 * Manages notes and folders state with CRUD operations
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useToast } from '@/components/ui/Toast';
import type { ToastType } from '@/components/ui/Toast';
import * as noteService from '@/services/noteService';
import { scheduleNoteReminder, cancelNoteReminder } from '@/services/notification-service';
import { DEFAULT_NOTE_FORM } from '@/types/note';
import type { Note, NoteFormData, NoteSortOption, SortDirection, NoteViewMode } from '@/types/note';

interface UseNotesReturn {
    // Toast state
    toast: { id: number; text: string; type: ToastType } | null;
    showToast: (text: string, type?: ToastType) => void;
    hideToast: () => void;

    // Notes state
    notes: Note[];
    filteredNotes: Note[];
    isLoading: boolean;
    error: string | null;

    // Form state
    noteFormData: NoteFormData;
    editingNote: Note | null;
    showNoteEditor: boolean;

    // View state
    viewMode: NoteViewMode;
    sortBy: NoteSortOption;
    sortDirection: SortDirection;
    searchQuery: string;

    // Note actions
    fetchNotes: () => Promise<void>;
    createNote: () => Promise<void>;
    updateNote: () => Promise<void>;
    deleteNote: (noteId: number) => void;
    togglePin: (noteId: number) => Promise<void>;
    setShowNoteEditor: (show: boolean) => void;
    setEditingNote: (note: Note | null) => void;
    updateNoteFormData: (key: keyof NoteFormData, value: unknown) => void;
    resetNoteForm: () => void;
    initNoteForm: (note?: Note) => void;

    // View actions
    setViewMode: (mode: NoteViewMode) => void;
    setSortBy: (option: NoteSortOption) => void;
    setSortDirection: (direction: SortDirection) => void;
    setSearchQuery: (query: string) => void;
}

export const useNotes = (): UseNotesReturn => {
    // Toast
    const { toast, showToast, hideToast } = useToast();

    // Notes state
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [noteFormData, setNoteFormData] = useState<NoteFormData>(DEFAULT_NOTE_FORM);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [showNoteEditor, setShowNoteEditor] = useState(false);

    // View state
    const [viewMode, setViewMode] = useState<NoteViewMode>('grid');
    const [sortBy, setSortBy] = useState<NoteSortOption>('updatedAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch all notes
    const fetchNotes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await noteService.getNotes({
                pageNo: 1,
                pageSize: 100,
                search: searchQuery.trim() || undefined,
                sortBy,
                sortDirection,
            });
            setNotes(response.content);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Failed to load notes: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, sortBy, sortDirection]);

    // Initial fetch
    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    // Filter and sort notes
    const filteredNotes = useMemo(() => {
        const result = [...notes];

        // Sort
        result.sort((a, b) => {
            let comparison = 0;

            // Pinned notes first
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            switch (sortBy) {
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'createdAt':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case 'updatedAt':
                default:
                    comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                    break;
            }

            return sortDirection === 'desc' ? -comparison : comparison;
        });

        return result;
    }, [notes, sortBy, sortDirection]);

    // Reset note form
    const resetNoteForm = useCallback(() => {
        setNoteFormData(DEFAULT_NOTE_FORM);
        setEditingNote(null);
    }, []);

    // Initialize note form (for editing)
    const initNoteForm = useCallback(
        (note?: Note) => {
            if (note) {
                setNoteFormData({
                    title: note.title,
                    content: note.content,
                    color: note.color,
                    isPinned: note.isPinned,
                    tags: note.tags || [],
                    reminderDate: note.reminderDate || null,
                    recurrence: note.recurrence || 'none',
                    locationName: note.locationName || null,
                    locationLink: note.locationLink || null,
                    startDate: note.startDate || null,
                    endDate: note.endDate || null
                });
                setEditingNote(note);
            } else {
                resetNoteForm();
            }
        },
        [resetNoteForm]
    );

    // Update note form field
    const updateNoteFormData = useCallback((key: keyof NoteFormData, value: unknown) => {
        setNoteFormData((prev) => ({ ...prev, [key]: value }));
    }, []);

    // Create new note
    const createNoteAction = useCallback(async () => {
        try {
            const createdNote = await noteService.createNote(noteFormData);

            // Schedule reminder notification if set
            if (noteFormData.reminderDate) {
                const reminderDate = new Date(noteFormData.reminderDate);
                if (reminderDate > new Date() || noteFormData.recurrence !== 'none') {
                    await scheduleNoteReminder(
                        createdNote.id,
                        noteFormData.title || 'Untitled',
                        reminderDate,
                        noteFormData.recurrence
                    );
                }
            }

            showToast('สร้างโน้ตสำเร็จ ✓');
            setShowNoteEditor(false);
            resetNoteForm();
            await fetchNotes();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create note';
            Alert.alert('Error', message);
            console.error('Create note error:', err);
        }
    }, [noteFormData, resetNoteForm, fetchNotes, showToast]);

    // Update existing note
    const updateNoteAction = useCallback(async () => {
        if (!editingNote) return;

        try {
            await noteService.updateNote(editingNote.id, noteFormData);

            // Schedule or cancel reminder notification
            if (noteFormData.reminderDate) {
                const reminderDate = new Date(noteFormData.reminderDate);
                if (reminderDate > new Date() || noteFormData.recurrence !== 'none') {
                    await scheduleNoteReminder(
                        editingNote.id,
                        noteFormData.title || 'Untitled',
                        reminderDate,
                        noteFormData.recurrence
                    );
                }
            }

            showToast('อัปเดตโน้ตสำเร็จ ✓');
            setShowNoteEditor(false);
            resetNoteForm();
            await fetchNotes();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update note';
            Alert.alert('Error', message);
            console.error('Update note error:', err);
        }
    }, [editingNote, noteFormData, resetNoteForm, fetchNotes, showToast]);

    // Delete note
    const deleteNoteAction = useCallback(
        (noteId: number) => {
            Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Cancel any scheduled reminder before deleting
                            const noteToDelete = notes.find((n) => n.id === noteId);
                            if (noteToDelete?.reminderDate) {
                                await cancelNoteReminder(`note-reminder-${noteId}`);
                            }

                            await noteService.deleteNote(noteId);
                            showToast('ลบโน้ตสำเร็จ');
                            await fetchNotes();
                        } catch (err) {
                            const message = err instanceof Error ? err.message : 'Failed to delete note';
                            Alert.alert('Error', message);
                            console.error('Delete note error:', err);
                        }
                    }
                }
            ]);
        },
        [notes, fetchNotes, showToast]
    );

    // Toggle pin
    const togglePin = useCallback(
        async (noteId: number) => {
            try {
                await noteService.toggleNotePin(noteId);
                await fetchNotes();
            } catch (err) {
                console.error('Toggle pin error:', err);
            }
        },
        [fetchNotes]
    );

    return {
        // Toast state
        toast,
        showToast,
        hideToast,

        // Notes state
        notes,
        filteredNotes,
        isLoading,
        error,

        // Form state
        noteFormData,
        editingNote,
        showNoteEditor,

        // View state
        viewMode,
        sortBy,
        sortDirection,
        searchQuery,

        // Note actions
        fetchNotes,
        createNote: createNoteAction,
        updateNote: updateNoteAction,
        deleteNote: deleteNoteAction,
        togglePin,
        setShowNoteEditor,
        setEditingNote,
        updateNoteFormData,
        resetNoteForm,
        initNoteForm,

        // View actions
        setViewMode,
        setSortBy,
        setSortDirection,
        setSearchQuery
    };
};

export default useNotes;
