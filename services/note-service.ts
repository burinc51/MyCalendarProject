/**
 * Note Service
 * API operations for notes and folders
 * Currently uses local storage (AsyncStorage) as backend is not ready
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Note, Folder, NoteFormData, FolderFormData } from '@/types/note';

// Storage keys
const NOTES_STORAGE_KEY = '@MyCalendar:notes';
const FOLDERS_STORAGE_KEY = '@MyCalendar:folders';

// Helper to generate unique IDs
const generateId = (): number => {
    return Date.now() + Math.floor(Math.random() * 1000);
};

// ==================== NOTES ====================

/**
 * Get all notes from storage
 */
export const getNotes = async (): Promise<Note[]> => {
    try {
        const data = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting notes:', error);
        return [];
    }
};

/**
 * Get notes by folder ID
 */
export const getNotesByFolder = async (folderId: number | null): Promise<Note[]> => {
    try {
        const notes = await getNotes();
        if (folderId === null) {
            return notes; // Return all notes
        }
        return notes.filter((note) => note.folderId === folderId);
    } catch (error) {
        console.error('Error getting notes by folder:', error);
        return [];
    }
};

/**
 * Get a single note by ID
 */
export const getNoteById = async (noteId: number): Promise<Note | null> => {
    try {
        const notes = await getNotes();
        return notes.find((note) => note.id === noteId) || null;
    } catch (error) {
        console.error('Error getting note:', error);
        return null;
    }
};

/**
 * Create a new note
 */
export const createNote = async (formData: NoteFormData): Promise<Note> => {
    try {
        const notes = await getNotes();
        const now = new Date().toISOString();

        const newNote: Note = {
            id: generateId(),
            title: formData.title.trim() || 'Untitled',
            content: formData.content,
            folderId: formData.folderId,
            createdAt: now,
            updatedAt: now,
            isPinned: formData.isPinned,
            color: formData.color,
            tags: formData.tags
        };

        notes.unshift(newNote); // Add to beginning
        await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));

        // Update folder note count
        if (formData.folderId) {
            await updateFolderNoteCount(formData.folderId);
        }

        return newNote;
    } catch (error) {
        console.error('Error creating note:', error);
        throw error;
    }
};

/**
 * Update an existing note
 */
export const updateNote = async (noteId: number, formData: Partial<NoteFormData>): Promise<Note | null> => {
    try {
        const notes = await getNotes();
        const index = notes.findIndex((note) => note.id === noteId);

        if (index === -1) {
            throw new Error('Note not found');
        }

        const oldFolderId = notes[index].folderId;

        notes[index] = {
            ...notes[index],
            ...formData,
            title: formData.title?.trim() || notes[index].title,
            updatedAt: new Date().toISOString()
        };

        await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));

        // Update folder note counts if folder changed
        if (oldFolderId !== formData.folderId) {
            if (oldFolderId) await updateFolderNoteCount(oldFolderId);
            if (formData.folderId) await updateFolderNoteCount(formData.folderId);
        }

        return notes[index];
    } catch (error) {
        console.error('Error updating note:', error);
        throw error;
    }
};

/**
 * Delete a note
 */
export const deleteNote = async (noteId: number): Promise<void> => {
    try {
        const notes = await getNotes();
        const noteToDelete = notes.find((note) => note.id === noteId);
        const filteredNotes = notes.filter((note) => note.id !== noteId);

        await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(filteredNotes));

        // Update folder note count
        if (noteToDelete?.folderId) {
            await updateFolderNoteCount(noteToDelete.folderId);
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        throw error;
    }
};

/**
 * Toggle note pin status
 */
export const toggleNotePin = async (noteId: number): Promise<Note | null> => {
    try {
        const notes = await getNotes();
        const index = notes.findIndex((note) => note.id === noteId);

        if (index === -1) return null;

        notes[index].isPinned = !notes[index].isPinned;
        notes[index].updatedAt = new Date().toISOString();

        await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
        return notes[index];
    } catch (error) {
        console.error('Error toggling pin:', error);
        throw error;
    }
};

/**
 * Search notes by title or content
 */
export const searchNotes = async (query: string): Promise<Note[]> => {
    try {
        const notes = await getNotes();
        const lowerQuery = query.toLowerCase();

        return notes.filter(
            (note) =>
                note.title.toLowerCase().includes(lowerQuery) || note.content.toLowerCase().includes(lowerQuery) || note.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
    } catch (error) {
        console.error('Error searching notes:', error);
        return [];
    }
};

// ==================== FOLDERS ====================

/**
 * Get all folders from storage
 */
export const getFolders = async (): Promise<Folder[]> => {
    try {
        const data = await AsyncStorage.getItem(FOLDERS_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting folders:', error);
        return [];
    }
};

/**
 * Create a new folder
 */
export const createFolder = async (formData: FolderFormData): Promise<Folder> => {
    try {
        const folders = await getFolders();
        const now = new Date().toISOString();

        const newFolder: Folder = {
            id: generateId(),
            name: formData.name.trim(),
            color: formData.color,
            icon: formData.icon,
            noteCount: 0,
            createdAt: now,
            updatedAt: now
        };

        folders.push(newFolder);
        await AsyncStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));

        return newFolder;
    } catch (error) {
        console.error('Error creating folder:', error);
        throw error;
    }
};

/**
 * Update a folder
 */
export const updateFolder = async (folderId: number, formData: Partial<FolderFormData>): Promise<Folder | null> => {
    try {
        const folders = await getFolders();
        const index = folders.findIndex((folder) => folder.id === folderId);

        if (index === -1) {
            throw new Error('Folder not found');
        }

        folders[index] = {
            ...folders[index],
            ...formData,
            name: formData.name?.trim() || folders[index].name,
            updatedAt: new Date().toISOString()
        };

        await AsyncStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
        return folders[index];
    } catch (error) {
        console.error('Error updating folder:', error);
        throw error;
    }
};

/**
 * Delete a folder (moves notes to "All Notes")
 */
export const deleteFolder = async (folderId: number): Promise<void> => {
    try {
        // Remove folder
        const folders = await getFolders();
        const filteredFolders = folders.filter((folder) => folder.id !== folderId);
        await AsyncStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(filteredFolders));

        // Move notes to "All Notes" (set folderId to null)
        const notes = await getNotes();
        const updatedNotes = notes.map((note) => (note.folderId === folderId ? { ...note, folderId: null, updatedAt: new Date().toISOString() } : note));
        await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
    } catch (error) {
        console.error('Error deleting folder:', error);
        throw error;
    }
};

/**
 * Update folder note count (helper)
 */
const updateFolderNoteCount = async (folderId: number): Promise<void> => {
    try {
        const folders = await getFolders();
        const notes = await getNotes();

        const index = folders.findIndex((folder) => folder.id === folderId);
        if (index === -1) return;

        folders[index].noteCount = notes.filter((note) => note.folderId === folderId).length;
        await AsyncStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
    } catch (error) {
        console.error('Error updating folder count:', error);
    }
};

// ==================== EXPORT DEFAULT ====================

export default {
    // Notes
    getNotes,
    getNotesByFolder,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
    toggleNotePin,
    searchNotes,
    // Folders
    getFolders,
    createFolder,
    updateFolder,
    deleteFolder
};
