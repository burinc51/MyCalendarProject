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
    notificationType?: string | null;
    remindBeforeValue?: number | null;
    remindBeforeUnit?: string | null;
    remindBeforeMinutes?: number | null;
    repeating: string | null;
    repeatType?: string | null;
    repeatInterval?: number | null;
    repeatUntil?: string | null;
    repeatDays?: string | null;
    color: string;
    category: string | null;
    priority: string; // e.g., "1", "2", "3"
    groupId: number | null;
    assignees: EventUser[] | null;
    pinned: boolean;
}

export interface ApiMonthViewEvent {
    eventId: number;
    title: string;
    startDate: string;
    endDate: string;
    color: string;
    allDay: boolean;
    priority: 'low' | 'medium' | 'high';
    assignees: EventUser[] | null;
    createdBy: EventUser[] | null;
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
    location?: string;
    notificationType?: 'POPUP' | 'EMAIL' | 'PUSH';
    remindBeforeValue?: number;
    remindBeforeUnit?: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS';
    repeatType?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
    repeatInterval?: number;
    repeatUntil?: string | null;
    pinned?: boolean;
    groupId?: number | null;
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
    location: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    isAllDay: boolean;
    color: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    reminder: number;
    notificationType: 'POPUP' | 'EMAIL' | 'PUSH';
    remindBeforeValue: string;
    remindBeforeUnit: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS';
    repeatType: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
    repeatInterval: string;
    repeatUntil: string;
    pinned: boolean;
    groupId: number | null;
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
