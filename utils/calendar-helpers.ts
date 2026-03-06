/**
 * Calendar helper functions
 * Utility functions for data mapping and transformation
 */

import dayjs from 'dayjs';
import type { ApiEvent, CalendarEvent, EventPriority, EventUser } from '@/types/event';
import { COLOR_NAME_TO_HEX, HEX_TO_COLOR_NAME, API_PRIORITY_MAP, PRIORITY_TO_API_MAP, DEFAULT_USER_ID } from '@/constants/Calendar';

/**
 * Maps API priority ("1", "2", "3") to component's priority
 */
export const mapApiPriorityToString = (priority: string): EventPriority => {
    return (API_PRIORITY_MAP[priority as keyof typeof API_PRIORITY_MAP] || 'medium') as EventPriority;
};

/**
 * Maps component's priority to API priority ("1", "2", "3")
 */
export const mapPriorityToApi = (priority: EventPriority): string => {
    return PRIORITY_TO_API_MAP[priority] || '2';
};

/**
 * Maps API color name to a hex code
 */
export const mapApiColorToHex = (colorName: string): string => {
    return COLOR_NAME_TO_HEX[colorName] || '#34495e';
};

/**
 * Maps hex color to API color name
 */
export const mapColorToApi = (hexColor: string): string => {
    return HEX_TO_COLOR_NAME[hexColor] || 'Blue';
};

/**
 * Transform an API event into a CalendarEvent for the component
 */
export const mapApiEventToCalendar = (apiEvent: ApiEvent): CalendarEvent => {
    // Check for 'all-day' - if time is 00:00:00 or no time component
    const isAllDay = dayjs(apiEvent.startDate).isSame(apiEvent.endDate, 'day') && !apiEvent.startDate.includes('T');

    // Map assignees — keep only fields our UI needs
    const assignees: EventUser[] = (apiEvent.assignees ?? []).map((a) => ({
        userId: a.userId,
        username: a.username,
        name: a.name,
        imageUrl: a.imageUrl ?? null,
    }));

    return {
        id: apiEvent.eventId,
        userId: apiEvent.userId,
        title: apiEvent.title,
        description: apiEvent.description || '',
        startDate: apiEvent.startDate,
        endDate: apiEvent.endDate,
        isAllDay,
        color: mapApiColorToHex(apiEvent.color),
        category: apiEvent.category || 'Other',
        priority: mapApiPriorityToString(apiEvent.priority),
        reminder: apiEvent.remindBeforeMinutes || 15, // fallback if backend sends null
        location: apiEvent.location || '',
        notificationType: (apiEvent.notificationType as 'POPUP' | 'EMAIL' | 'PUSH') || 'PUSH',
        remindBeforeValue: apiEvent.remindBeforeValue || 15,
        remindBeforeUnit: (apiEvent.remindBeforeUnit as 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS') || 'MINUTES',
        repeatType: (apiEvent.repeatType as any) || 'NONE',
        repeatInterval: apiEvent.repeatInterval || 1,
        repeatUntil: apiEvent.repeatUntil || null,
        pinned: !!apiEvent.pinned,
        groupId: apiEvent.groupId,
        assignees
    };
};

export const buildEventFormData = (
    formData: import('@/types/event').EventFormData,
    userId = DEFAULT_USER_ID
): FormData => {
    const bodyData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: formData.isAllDay ? dayjs(formData.startDate).toISOString() : dayjs(`${formData.startDate} ${formData.startTime}`).toISOString(),
        endDate: formData.isAllDay ? dayjs(formData.endDate).toISOString() : dayjs(`${formData.endDate} ${formData.endTime}`).toISOString(),
        color: mapColorToApi(formData.color),
        category: formData.category,
        priority: mapPriorityToApi(formData.priority),
        location: formData.location.trim(),
        repeatType: formData.repeatType,
        repeatInterval: parseInt(formData.repeatInterval, 10) || 1,
        repeatUntil: formData.repeatUntil ? dayjs(formData.repeatUntil).startOf('day').toISOString() : null,
        notificationTime: null, // Let backend calculate based on value/unit
        notificationType: formData.notificationType,
        remindBeforeValue: parseInt(formData.remindBeforeValue, 10) || 0,
        remindBeforeUnit: formData.remindBeforeUnit,
        pinned: formData.pinned,
        createById: userId,
        groupId: formData.groupId || null,
        assigneeIds: [],
        latitude: 0,
        longitude: 0,
        eventId: 0
    };

    const formDataToSend = new FormData();
    formDataToSend.append('body', JSON.stringify(bodyData));

    return formDataToSend;
};
