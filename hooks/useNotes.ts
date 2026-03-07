/**
 * useNotes Hook
 * Manages notes and folders state with CRUD operations
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useToast } from '@/components/ui/Toast';
import type { ToastType } from '@/components/ui/Toast';
import * as noteService from '@/services/note-service';
import { scheduleNoteReminder, cancelNoteReminder } from '@/services/notification-service';
import { DEFAULT_NOTE_FORM, DEFAULT_FOLDER_FORM } from '@/types/note';
import type { Note, Folder, NoteFormData, FolderFormData, NoteSortOption, SortDirection, NoteViewMode } from '@/types/note';

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

    // Folders state
    folders: Folder[];
    selectedFolderId: number | null;

    // Form state
    noteFormData: NoteFormData;
    folderFormData: FolderFormData;
    editingNote: Note | null;
    editingFolder: Folder | null;
    showNoteEditor: boolean;
    showFolderForm: boolean;

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

    // Folder actions
    fetchFolders: () => Promise<void>;
    createFolder: () => Promise<void>;
    updateFolder: () => Promise<void>;
    deleteFolder: (folderId: number) => void;
    setSelectedFolderId: (folderId: number | null) => void;
    setShowFolderForm: (show: boolean) => void;
    setEditingFolder: (folder: Folder | null) => void;
    updateFolderFormData: (key: keyof FolderFormData, value: unknown) => void;
    resetFolderForm: () => void;

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

    // Folders state
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

    // Form state
    const [noteFormData, setNoteFormData] = useState<NoteFormData>(DEFAULT_NOTE_FORM);
    const [folderFormData, setFolderFormData] = useState<FolderFormData>(DEFAULT_FOLDER_FORM);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
    const [showNoteEditor, setShowNoteEditor] = useState(false);
    const [showFolderForm, setShowFolderForm] = useState(false);

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
            const fetchedNotes = await noteService.getNotes();
            setNotes(fetchedNotes);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Failed to load notes: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch all folders
    const fetchFolders = useCallback(async () => {
        try {
            const fetchedFolders = await noteService.getFolders();
            setFolders(fetchedFolders);
        } catch (err) {
            console.error('Failed to fetch folders:', err);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchNotes();
        fetchFolders();
    }, [fetchNotes, fetchFolders]);

    // Filter and sort notes
    const filteredNotes = useCallback(() => {
        let result = [...notes];

        // Filter by folder
        if (selectedFolderId !== null) {
            result = result.filter((note) => note.folderId === selectedFolderId);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter((note) => note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query));
        }

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
    }, [notes, selectedFolderId, searchQuery, sortBy, sortDirection]);

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
                    folderId: note.folderId,
                    color: note.color,
                    isPinned: note.isPinned,
                    tags: note.tags || [],
                    reminderDate: note.reminderDate || null,
                    recurrence: note.recurrence || 'none'
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
            fetchNotes();
            fetchFolders(); // Update note counts
        } catch (err) {
            Alert.alert('Error', 'Failed to create note');
            console.error('Create note error:', err);
        }
    }, [noteFormData, resetNoteForm, fetchNotes, fetchFolders]);

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
            fetchNotes();
            fetchFolders();
        } catch (err) {
            Alert.alert('Error', 'Failed to update note');
            console.error('Update note error:', err);
        }
    }, [editingNote, noteFormData, resetNoteForm, fetchNotes, fetchFolders]);

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
                            await noteService.deleteNote(noteId);
                            showToast('ลบโน้ตสำเร็จ');
                            fetchNotes();
                            fetchFolders();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete note');
                            console.error('Delete note error:', err);
                        }
                    }
                }
            ]);
        },
        [fetchNotes, fetchFolders]
    );

    // Toggle pin
    const togglePin = useCallback(
        async (noteId: number) => {
            try {
                await noteService.toggleNotePin(noteId);
                fetchNotes();
            } catch (err) {
                console.error('Toggle pin error:', err);
            }
        },
        [fetchNotes]
    );

    // Reset folder form
    const resetFolderForm = useCallback(() => {
        setFolderFormData(DEFAULT_FOLDER_FORM);
        setEditingFolder(null);
    }, []);

    // Update folder form field
    const updateFolderFormData = useCallback((key: keyof FolderFormData, value: unknown) => {
        setFolderFormData((prev) => ({ ...prev, [key]: value }));
    }, []);

    // Create folder
    const createFolderAction = useCallback(async () => {
        if (!folderFormData.name.trim()) {
            Alert.alert('Error', 'Please enter a folder name');
            return;
        }

        try {
            await noteService.createFolder(folderFormData);
            showToast('สร้างโฟลเดอร์สำเร็จ ✓');
            setShowFolderForm(false);
            resetFolderForm();
            fetchFolders();
        } catch (err) {
            Alert.alert('Error', 'Failed to create folder');
            console.error('Create folder error:', err);
        }
    }, [folderFormData, resetFolderForm, fetchFolders]);

    // Update folder
    const updateFolderAction = useCallback(async () => {
        if (!editingFolder) return;

        try {
            await noteService.updateFolder(editingFolder.id, folderFormData);
            showToast('อัปเดตโฟลเดอร์สำเร็จ ✓');
            setShowFolderForm(false);
            resetFolderForm();
            fetchFolders();
        } catch (err) {
            Alert.alert('Error', 'Failed to update folder');
            console.error('Update folder error:', err);
        }
    }, [editingFolder, folderFormData, resetFolderForm, fetchFolders]);

    // Delete folder
    const deleteFolderAction = useCallback(
        (folderId: number) => {
            Alert.alert('Delete Folder', 'Notes in this folder will be moved to "All Notes". Continue?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await noteService.deleteFolder(folderId);
                            if (selectedFolderId === folderId) {
                                setSelectedFolderId(null);
                            }
                            showToast('ลบโฟลเดอร์สำเร็จ');
                            fetchFolders();
                            fetchNotes();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete folder');
                            console.error('Delete folder error:', err);
                        }
                    }
                }
            ]);
        },
        [selectedFolderId, fetchFolders, fetchNotes]
    );

    return {
        // Toast state
        toast,
        showToast,
        hideToast,

        // Notes state
        notes,
        filteredNotes: filteredNotes(),
        isLoading,
        error,

        // Folders state
        folders,
        selectedFolderId,

        // Form state
        noteFormData,
        folderFormData,
        editingNote,
        editingFolder,
        showNoteEditor,
        showFolderForm,

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

        // Folder actions
        fetchFolders,
        createFolder: createFolderAction,
        updateFolder: updateFolderAction,
        deleteFolder: deleteFolderAction,
        setSelectedFolderId,
        setShowFolderForm,
        setEditingFolder,
        updateFolderFormData,
        resetFolderForm,

        // View actions
        setViewMode,
        setSortBy,
        setSortDirection,
        setSearchQuery
    };
};

export default useNotes;
