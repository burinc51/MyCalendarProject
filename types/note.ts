export type NoteFormData = {
    title: string;
    content: string;
    folderId: number | null;
    color: string;
    isPinned: boolean;
    tags: string[];
    reminderDate: string | null;
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    location: string | null;
}

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

export const DEFAULT_NOTE_FORM: NoteFormData = {
    title: '',
    content: '',
    folderId: null,
    color: NOTE_COLORS[0],
    isPinned: false,
    tags: [],
    reminderDate: null,
    recurrence: 'none',
    location: null
};

// ==================== Note ====================

export interface Note {
    id: number;
    title: string;
    content: string;
    folderId: number | null;
    createdAt: string;
    updatedAt: string;
    isPinned: boolean;
    color: string;
    tags?: string[];
    reminderDate: string | null;
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    location: string | null;
}

// ==================== Folder ====================

export interface Folder {
    id: number;
    name: string;
    color: string;
    icon?: string;
    noteCount: number;
    createdAt: string;
    updatedAt: string;
}

export type FolderFormData = {
    name: string;
    color: string;
    icon?: string;
};

export const DEFAULT_FOLDER_FORM: FolderFormData = {
    name: '',
    color: '#3498db',
};

// ==================== View Types ====================

export type NoteViewMode = 'grid' | 'list';
export type NoteSortOption = 'updatedAt' | 'createdAt' | 'title';
export type SortDirection = 'asc' | 'desc';