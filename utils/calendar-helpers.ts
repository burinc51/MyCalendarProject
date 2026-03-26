/**
 * Calendar helper functions
 * Utility functions for data mapping and transformation
 */
import { encode as btoa } from 'base-64';

import dayjs from 'dayjs';
import type { ApiEvent, ApiMonthViewEvent, CalendarEvent, EventPriority, EventUser } from '@/types/event';
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
        eventId: apiEvent.eventId,
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

/**
 * Transform an API month-view event into a CalendarEvent for the component
 * Uses default placeholders for fields not returned by the month-view API
 */
export const mapApiMonthViewToCalendar = (apiEvent: ApiMonthViewEvent): CalendarEvent => {
    return {
        eventId: apiEvent.eventId,
        title: apiEvent.title,
        startDate: apiEvent.startDate,
        endDate: apiEvent.endDate,
        isAllDay: apiEvent.allDay,
        color: mapApiColorToHex(apiEvent.color),
        category: 'Event',
        priority: apiEvent.priority,
        location: '',
        assignees: apiEvent.assignees || []
    };
};

/** Maps component priority (low/medium/high) → API string (LOW/MEDIUM/HIGH) */
const priorityToApiString = (priority: EventPriority): string => {
    const map: Record<EventPriority, string> = { low: 'LOW', medium: 'MEDIUM', high: 'HIGH' };
    return map[priority] ?? 'MEDIUM';
};

export const buildEventFormData = (
    formData: import('@/types/event').EventFormData,
    userId = DEFAULT_USER_ID,
    eventId: number | null = null
): FormData => {
    const bodyData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: formData.isAllDay ? dayjs(formData.startDate).format('YYYY-MM-DDTHH:mm:ss') : dayjs(`${formData.startDate}T${formData.startTime}`).format('YYYY-MM-DDTHH:mm:ss'),
        endDate: formData.isAllDay ? dayjs(formData.endDate).format('YYYY-MM-DDTHH:mm:ss') : dayjs(`${formData.endDate}T${formData.endTime}`).format('YYYY-MM-DDTHH:mm:ss'),
        color: mapColorToApi(formData.color),
        category: formData.category,
        priority: priorityToApiString(formData.priority as EventPriority),
        location: formData.location.trim(),
        repeatType: formData.repeatType,
        repeatInterval: parseInt(formData.repeatInterval, 10) || 1,
        repeatUntil: formData.repeatUntil ? dayjs(formData.repeatUntil).startOf('day').format('YYYY-MM-DDTHH:mm:ss') : null,
        notificationTime: null,
        notificationType: formData.notificationType,
        remindBeforeValue: parseInt(formData.remindBeforeValue, 10) || 0,
        remindBeforeUnit: formData.remindBeforeUnit,
        pinned: formData.pinned,
        createById: userId,
        groupId: formData.groupId || null,
        // ถ้ามี assignees array ใน formData (เพิ่มมาตอน submit) ให้ใช้, ถ้าไม่มีให้ส่ง array ว่าง หรือ user ตัวเอง
        assigneeIds: Array.isArray((formData as any).assignees) ? (formData as any).assignees : [userId],
        allDay: formData.isAllDay,
        latitude: null,
        longitude: null,
        eventId: eventId // null สำหรับ create, ตัวเลข event สำหรับ update
    };

    const jsonString = JSON.stringify(bodyData);

    const utf8SafeString = unescape(encodeURIComponent(jsonString));
    const base64Data = btoa(utf8SafeString);

    const formDataToSend = new FormData();
    formDataToSend.append('body', {
        uri: `data:application/json;base64,${base64Data}`,
        name: 'body.json',
        type: 'application/json'
    } as any);
    formDataToSend.append('file', '');
    return formDataToSend;
};
