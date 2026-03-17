/**
 * Note Service
 * API operations for notes and folders
 * Currently uses local storage (AsyncStorage) as backend is not ready
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Note, NoteFormData } from '@/types/note';

// Storage keys
const NOTES_STORAGE_KEY = '@MyCalendar:notes';

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
            createdAt: now,
            updatedAt: now,
            isPinned: formData.isPinned,
            color: formData.color,
            tags: formData.tags,
            reminderDate: formData.reminderDate || null,
            recurrence: formData.recurrence || 'none',
            locationName: formData.locationName || null,
            locationLink: formData.locationLink || null,
            startDate: formData.startDate || null,
            endDate: formData.endDate || null
        };

        notes.unshift(newNote); // Add to beginning
        await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));

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

        notes[index] = {
            ...notes[index],
            ...formData,
            title: formData.title?.trim() || notes[index].title,
            updatedAt: new Date().toISOString()
        };

        await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));

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

// ==================== EXPORT DEFAULT ====================

export default {
    // Notes
    getNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
    toggleNotePin,
    searchNotes,
};
