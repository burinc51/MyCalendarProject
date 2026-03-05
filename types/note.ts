// Note interface
export interface Note {
    id: number;
    title: string;
    content: string; // HTML content from rich text editor
    folderId: number | null;
    createdAt: string;
    updatedAt: string;
    isPinned: boolean;
    color: string;
    tags?: string[];
}

// Folder interface
export interface Folder {
    id: number;
    name: string;
    color: string;
    icon?: string;
    noteCount: number;
    createdAt: string;
    updatedAt: string;
}

// Form data for creating/editing notes
export interface NoteFormData {
    title: string;
    content: string;
    folderId: number | null;
    color: string;
    isPinned: boolean;
    tags: string[];
}

// Form data for creating/editing folders
export interface FolderFormData {
    name: string;
    color: string;
    icon?: string;
}

// API response types
export interface ApiNote {
    noteId: number;
    userId: number;
    title: string;
    content: string;
    folderId: number | null;
    createdAt: string;
    updatedAt: string;
    pinned: boolean;
    color: string;
    tags: string[] | null;
}

export interface ApiFolder {
    folderId: number;
    userId: number;
    name: string;
    color: string;
    icon: string | null;
    noteCount: number;
    createdAt: string;
    updatedAt: string;
}

// Sort options for notes
export type NoteSortOption = 'updatedAt' | 'createdAt' | 'title' | 'color';
export type SortDirection = 'asc' | 'desc';

// View mode for note list
export type NoteViewMode = 'grid' | 'list';

// Note colors palette
export const NOTE_COLORS = [
    '#ffffff', // White (default)
    '#fff9c4', // Light Yellow
    '#ffecb3', // Light Orange
    '#ffcdd2', // Light Red
    '#f8bbd9', // Light Pink
    '#e1bee7', // Light Purple
    '#c5cae9', // Light Indigo
    '#bbdefb', // Light Blue
    '#b2dfdb', // Light Teal
    '#c8e6c9', // Light Green
    '#dcedc8', // Light Lime
    '#f0f4c3' // Light Lime Yellow
] as const;

export type NoteColor = (typeof NOTE_COLORS)[number];

// Default values
export const DEFAULT_NOTE_FORM: NoteFormData = {
    title: '',
    content: '',
    folderId: null,
    color: NOTE_COLORS[0],
    isPinned: false,
    tags: []
};

export const DEFAULT_FOLDER_FORM: FolderFormData = {
    name: '',
    color: '#3498db',
    icon: 'folder'
};
