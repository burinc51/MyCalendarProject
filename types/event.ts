/**
 * Event-related TypeScript interfaces
 * Extracted from CalendarView.tsx for better modularity
 */

// User attached to an event (matches backend EventUserResponse)
export interface EventUser {
    userId: number;
    username: string;
    name: string;
    imageUrl?: string | null;
}

// API Event Interface (matches your API response)
export interface ApiEvent {
    eventId: number;
    userId: number;
    title: string;
    description: string | null;
    imageUrl: string | null;
    startDate: string;
    endDate: string;
    location: string | null;
    notificationTime: string | null;
    repeating: string | null;
    color: string;
    category: string | null;
    priority: string; // e.g., "1", "2", "3"
    groupId: number | null;
    assignees: EventUser[] | null;
    pinned: boolean;
}

// Component's Calendar Event interface
export interface CalendarEvent {
    id: number;
    userId?: number;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    isAllDay: boolean;
    color: string;
    category?: string;
    reminder?: number; // minutes before
    priority?: 'low' | 'medium' | 'high';
    assignees?: EventUser[];  // users associated with this event
    createdBy?: EventUser;   // user who created this event
    // Extended fields for calendar rendering
    weekSpan?: number;
    isStartOfEvent?: boolean;
    isEndOfEvent?: boolean;
    startDayIndex?: number;
    endDayIndex?: number;
    slot?: number;
}

// Form data interface for creating/editing events
export interface EventFormData {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    isAllDay: boolean;
    color: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    reminder: number;
}

// Priority type for type safety
export type EventPriority = 'low' | 'medium' | 'high';

// Color configuration type
export interface EventColor {
    solid: string;
    gradient: [string, string];
}

// Priority color configuration
export type PriorityColorMap = Record<EventPriority, EventColor>;
