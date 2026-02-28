/**
 * Calendar-specific constants
 * Colors, categories, and configuration for calendar events
 */

import type { EventColor, PriorityColorMap } from '@/types/event';

// Modern Color Gradients for Events
export const EVENT_COLORS: EventColor[] = [
    { solid: '#e74c3c', gradient: ['#e74c3c', '#c0392b'] }, // Red
    { solid: '#3498db', gradient: ['#3498db', '#2980b9'] }, // Blue
    { solid: '#2ecc71', gradient: ['#2ecc71', '#27ae60'] }, // Green
    { solid: '#f39c12', gradient: ['#f39c12', '#e67e22'] }, // Orange
    { solid: '#9b59b6', gradient: ['#9b59b6', '#8e44ad'] }, // Purple
    { solid: '#1abc9c', gradient: ['#1abc9c', '#16a085'] }, // Teal
    { solid: '#e67e22', gradient: ['#e67e22', '#d35400'] }, // Dark Orange
    { solid: '#34495e', gradient: ['#34495e', '#2c3e50'] } // Dark Blue
];

// Event categories
export const CATEGORIES = ['Work', 'Personal', 'Health', 'Education', 'Social', 'Travel', 'Shopping', 'Other', 'Holiday'] as const;

export type EventCategory = (typeof CATEGORIES)[number];

// Priority colors
export const PRIORITY_COLORS: PriorityColorMap = {
    low: { solid: '#95a5a6', gradient: ['#95a5a6', '#7f8c8d'] },
    medium: { solid: '#f39c12', gradient: ['#f39c12', '#e67e22'] },
    high: { solid: '#e74c3c', gradient: ['#e74c3c', '#c0392b'] }
};

// Color name to hex mapping (for API integration)
export const COLOR_NAME_TO_HEX: Record<string, string> = {
    Green: '#2ecc71',
    Red: '#e74c3c',
    Blue: '#3498db',
    Orange: '#f39c12',
    Purple: '#9b59b6',
    Teal: '#1abc9c'
};

// Hex to color name mapping (for API integration)
export const HEX_TO_COLOR_NAME: Record<string, string> = {
    '#2ecc71': 'Green',
    '#e74c3c': 'Red',
    '#3498db': 'Blue',
    '#f39c12': 'Orange',
    '#9b59b6': 'Purple',
    '#1abc9c': 'Teal',
    '#e67e22': 'Orange',
    '#34495e': 'Blue'
};

// Default form values
export const DEFAULT_EVENT_FORM = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '10:00',
    isAllDay: false,
    color: EVENT_COLORS[0].solid,
    category: CATEGORIES[0],
    priority: 'medium' as const,
    reminder: 15
};

// API Priority mapping
export const API_PRIORITY_MAP = {
    '1': 'high',
    '2': 'medium',
    '3': 'low'
} as const;

export const PRIORITY_TO_API_MAP = {
    high: '1',
    medium: '2',
    low: '3'
} as const;

export const DEFAULT_USER_ID = 2;
