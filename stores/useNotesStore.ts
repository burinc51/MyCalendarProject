import { create } from 'zustand';

interface Note {
    id: string;
    title: string;
    content: string;
    color?: string;
    isPinned: boolean;
    lastModified: string;
}

interface NotesState {
    notes: Note[];
    searchQuery: string;
    addNote: (note: Omit<Note, 'id' | 'lastModified'>) => void;
    updateNote: (id: string, updates: Partial<Note>) => void;
    deleteNote: (id: string) => void;
    togglePin: (id: string) => void;
    setSearchQuery: (query: string) => void;
    getFilteredNotes: () => Note[];
}

export const useNotesStore = create<NotesState>((set, get) => ({
    notes: [],
    searchQuery: '',

    addNote: (note) => {
        const newNote: Note = {
            ...note,
            id: Date.now().toString(),
            lastModified: new Date().toISOString()
        };
        set((state) => ({
            notes: [newNote, ...state.notes]
        }));
    },

    updateNote: (id, updates) => {
        set((state) => ({
            notes: state.notes.map((note) =>
                note.id === id
                    ? {
                        ...note,
                        ...updates,
                        lastModified: new Date().toISOString()
                    }
                    : note
            )
        }));
    },

    deleteNote: (id) => {
        set((state) => ({
            notes: state.notes.filter((note) => note.id !== id)
        }));
    },

    togglePin: (id) => {
        set((state) => ({
            notes: state.notes.map((note) => (note.id === id ? { ...note, isPinned: !note.isPinned } : note))
        }));
    },

    setSearchQuery: (query) => {
        set({ searchQuery: query });
    },

    getFilteredNotes: () => {
        const { notes, searchQuery } = get();
        if (!searchQuery) return notes;

        return notes.filter(
            (note) => note.title.toLowerCase().includes(searchQuery.toLowerCase()) || note.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
}));
