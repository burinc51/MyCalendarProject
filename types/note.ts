export type NoteFormData = {
    title: string;
    content: string;
    color: string;
    isPinned: boolean;
    tags: string[];
    reminderDate: string | null;
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    locationName: string | null;
    locationLink: string | null;
    startDate: string | null;
    endDate: string | null;
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
    color: NOTE_COLORS[0],
    isPinned: false,
    tags: [],
    reminderDate: null,
    recurrence: 'none',
    locationName: null,
    locationLink: null,
    startDate: null,
    endDate: null
};

// ==================== Note ====================

export interface Note {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    isPinned: boolean;
    color: string;
    tags?: string[];
    reminderDate: string | null;
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    locationName: string | null;
    locationLink: string | null;
    startDate: string | null;
    endDate: string | null;
}

// ==================== View Types ====================



// ==================== View Types ====================

export type NoteViewMode = 'grid' | 'list';
export type NoteSortOption = 'updatedAt' | 'createdAt' | 'title';
export type SortDirection = 'asc' | 'desc';