/**
 * useCalendarEvents Hook
 * Manages calendar events state and API operations
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import dayjs from 'dayjs';
import { getEventsAll, createEvent, updateEvent, deleteEvent } from '@/services/eventService';
import { mapApiEventToCalendar, buildEventFormData } from '@/utils/calendar-helpers';
import { DEFAULT_EVENT_FORM, DEFAULT_USER_ID } from '@/constants/Calendar';
import type { CalendarEvent, EventFormData } from '@/types/event';

// ---------------------------------------------------------------------------
// MOCK EVENTS  (for UI testing — remove or comment out before production)
// ---------------------------------------------------------------------------
const today = dayjs();
const fmt = (d: dayjs.Dayjs) => d.format('YYYY-MM-DDTHH:mm:ss');

// Reusable mock users
const MOCK_USERS = {
    alice: { userId: 1, username: 'alice', name: 'Alice Johnson', imageUrl: null },
    bob: { userId: 2, username: 'bob', name: 'Bob Smith', imageUrl: null },
    carol: { userId: 3, username: 'carol', name: 'Carol White', imageUrl: null },
    dave: { userId: 4, username: 'dave', name: 'Dave Brown', imageUrl: null },
    eve: { userId: 5, username: 'eve', name: 'Eve Martinez', imageUrl: null },
};

const MOCK_EVENTS: CalendarEvent[] = [
    // All-day event spanning 3 days — 3 assignees
    {
        id: 9001,
        title: 'ประชุมประจำเดือน',
        isAllDay: true,
        startDate: fmt(today.startOf('week').add(1, 'day')),
        endDate: fmt(today.startOf('week').add(3, 'day')),
        color: '#3498db',
        category: 'Work',
        priority: 'high',
        createdBy: MOCK_USERS.alice,
        assignees: [MOCK_USERS.alice, MOCK_USERS.bob, MOCK_USERS.carol]
    },
    // Today morning meeting — 2 assignees
    {
        id: 9002,
        title: 'Stand-up Meeting',
        isAllDay: false,
        startDate: fmt(today.hour(9).minute(0)),
        endDate: fmt(today.hour(9).minute(30)),
        color: '#2ecc71',
        category: 'Work',
        priority: 'medium',
        createdBy: MOCK_USERS.bob,
        assignees: [MOCK_USERS.alice, MOCK_USERS.dave]
    },
    // Today lunch — 1 assignee (only self)
    {
        id: 9003,
        title: '🍜 พักกินข้าว',
        isAllDay: false,
        startDate: fmt(today.hour(12).minute(0)),
        endDate: fmt(today.hour(13).minute(0)),
        color: '#f39c12',
        category: 'Personal',
        priority: 'low',
        createdBy: MOCK_USERS.bob,
        assignees: [MOCK_USERS.bob]
    },
    // Today afternoon — 4 assignees (tests +N overflow badge)
    {
        id: 9004,
        title: 'Code Review',
        isAllDay: false,
        startDate: fmt(today.hour(14).minute(0)),
        endDate: fmt(today.hour(15).minute(30)),
        color: '#9b59b6',
        category: 'Work',
        priority: 'high',
        createdBy: MOCK_USERS.carol,
        assignees: [MOCK_USERS.alice, MOCK_USERS.bob, MOCK_USERS.carol, MOCK_USERS.dave]
    },
    // Tomorrow — 2 assignees
    {
        id: 9005,
        title: 'Design Workshop',
        isAllDay: false,
        startDate: fmt(today.add(1, 'day').hour(10).minute(0)),
        endDate: fmt(today.add(1, 'day').hour(12).minute(0)),
        color: '#e74c3c',
        category: 'Work',
        priority: 'high',
        createdBy: MOCK_USERS.carol,
        assignees: [MOCK_USERS.carol, MOCK_USERS.eve]
    },
    // Day after tomorrow — no assignees (tests fallback avatar)
    {
        id: 9006,
        title: 'วันหยุดพิเศษ 🎉',
        isAllDay: true,
        startDate: fmt(today.add(2, 'day').startOf('day')),
        endDate: fmt(today.add(2, 'day').endOf('day')),
        color: '#1abc9c',
        category: 'Holiday',
        priority: 'low',
        createdBy: MOCK_USERS.dave,
        assignees: []
    },
    // Next week — 5 assignees (tests +2 badge)
    {
        id: 9007,
        title: 'Sprint Planning',
        isAllDay: false,
        startDate: fmt(today.add(7, 'day').hour(9).minute(0)),
        endDate: fmt(today.add(7, 'day').hour(11).minute(0)),
        color: '#2980b9',
        category: 'Work',
        priority: 'high',
        createdBy: MOCK_USERS.alice,
        assignees: [MOCK_USERS.alice, MOCK_USERS.bob, MOCK_USERS.carol, MOCK_USERS.dave, MOCK_USERS.eve]
    },
    // End of month — 1 assignee
    {
        id: 9008,
        title: 'Monthly Review 📊',
        isAllDay: false,
        startDate: fmt(today.endOf('month').subtract(1, 'day').hour(14).minute(0)),
        endDate: fmt(today.endOf('month').subtract(1, 'day').hour(16).minute(0)),
        color: '#8e44ad',
        category: 'Work',
        priority: 'medium',
        createdBy: MOCK_USERS.eve,
        assignees: [MOCK_USERS.eve]
    },
    // Next month — 2 assignees
    {
        id: 9009,
        title: 'Team Outing 🏖️',
        isAllDay: true,
        startDate: fmt(today.add(1, 'month').startOf('month').add(4, 'day')),
        endDate: fmt(today.add(1, 'month').startOf('month').add(4, 'day')),
        color: '#27ae60',
        category: 'Personal',
        priority: 'low',
        createdBy: MOCK_USERS.dave,
        assignees: [MOCK_USERS.dave, MOCK_USERS.carol]
    },
    // Yesterday — 1 assignee
    {
        id: 9010,
        title: 'Retrospective',
        isAllDay: false,
        startDate: fmt(today.subtract(1, 'day').hour(16).minute(0)),
        endDate: fmt(today.subtract(1, 'day').hour(17).minute(0)),
        color: '#c0392b',
        category: 'Work',
        priority: 'medium',
        createdBy: MOCK_USERS.alice,
        assignees: [MOCK_USERS.alice]
    },
    {
        id: 9011,
        title: 'Retrospective',
        isAllDay: true,
        startDate: fmt(today.startOf('week').add(1, 'day')),
        endDate: fmt(today.startOf('week').add(3, 'day')),
        color: '#c0392b',
        category: 'Work',
        priority: 'medium',
        createdBy: MOCK_USERS.bob,
        assignees: [MOCK_USERS.bob, MOCK_USERS.dave]
    },
    {
        id: 9012,
        title: 'Retrospective',
        isAllDay: true,
        startDate: fmt(today.startOf('week').add(1, 'day')),
        endDate: fmt(today.startOf('week').add(3, 'day')),
        color: '#c0392b',
        category: 'Work',
        priority: 'high',
        createdBy: MOCK_USERS.eve,
        assignees: [MOCK_USERS.alice, MOCK_USERS.carol, MOCK_USERS.eve]
    }
];

interface UseCalendarEventsReturn {
    // State
    events: CalendarEvent[];
    isLoading: boolean;
    error: string | null;
    formData: EventFormData;
    editingEvent: CalendarEvent | null;
    showAddForm: boolean;

    // Actions
    fetchEvents: () => Promise<void>;
    setShowAddForm: (show: boolean) => void;
    setEditingEvent: (event: CalendarEvent | null) => void;
    updateFormData: (key: keyof EventFormData, value: unknown) => void;
    resetForm: () => void;
    handleSaveEvent: () => Promise<void>;
    handleDeleteEvent: (eventId: number) => void;
    handleEditEvent: (event: CalendarEvent) => void;
    initFormForDate: (date: string) => void;
}

export const useCalendarEvents = (): UseCalendarEventsReturn => {
    // State
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<EventFormData>(DEFAULT_EVENT_FORM);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    // Fetch events from API
    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getEventsAll();
            if (response.data && response.data.content) {
                const mappedEvents = response.data.content.map(mapApiEventToCalendar);
                // Merge real API events with mock events for UI testing
                setEvents([...MOCK_EVENTS, ...mappedEvents]);
            } else {
                setEvents(MOCK_EVENTS);
            }
        } catch (err: unknown) {
            console.error('Failed to fetch events:', err);
            // On error, still show mock events so the UI can be tested
            setEvents(MOCK_EVENTS);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Reset form to defaults
    const resetForm = useCallback(() => {
        setFormData(DEFAULT_EVENT_FORM);
    }, []);

    // Update single form field
    const updateFormData = useCallback((key: keyof EventFormData, value: unknown) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    }, []);

    // Initialize form for a specific date
    const initFormForDate = useCallback((date: string) => {
        setFormData((prev) => ({
            ...prev,
            startDate: date,
            endDate: date
        }));
    }, []);

    // Handle edit event - populate form
    const handleEditEvent = useCallback((event: CalendarEvent) => {
        setEditingEvent(event);
        setFormData({
            title: event.title,
            description: event.description || '',
            startDate: dayjs(event.startDate).format('YYYY-MM-DD'),
            endDate: dayjs(event.endDate).format('YYYY-MM-DD'),
            startTime: event.isAllDay ? '09:00' : dayjs(event.startDate).format('HH:mm'),
            endTime: event.isAllDay ? '10:00' : dayjs(event.endDate).format('HH:mm'),
            isAllDay: event.isAllDay,
            color: event.color,
            category: event.category || 'Work',
            priority: event.priority || 'medium',
            reminder: event.reminder || 15
        });
        setShowAddForm(true);
    }, []);

    // Save or Update event
    const handleSaveEvent = useCallback(async () => {
        // Basic validation
        if (!formData.title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        try {
            const formDataToSend = buildEventFormData(formData, editingEvent?.userId || DEFAULT_USER_ID);

            if (editingEvent) {
                const userId = editingEvent.userId || DEFAULT_USER_ID;
                await updateEvent(editingEvent.id, userId, formDataToSend as unknown as FormData);
                Alert.alert('Success', 'Event updated!');
            } else {
                await createEvent(formDataToSend as unknown as FormData);
                Alert.alert('Success', 'Event created!');
            }

            setShowAddForm(false);
            setEditingEvent(null);
            resetForm();
            fetchEvents();
        } catch (err) {
            Alert.alert('Error', 'Failed to save event.');
            console.error('Save event error:', err);
        }
    }, [formData, editingEvent, resetForm, fetchEvents]);

    // Delete event
    const handleDeleteEvent = useCallback(
        (eventId: number) => {
            Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteEvent(eventId);
                            Alert.alert('Success', 'Event deleted successfully!');
                            fetchEvents();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete event.');
                            console.error('Delete event error:', err);
                        }
                    }
                }
            ]);
        },
        [fetchEvents]
    );

    return {
        events,
        isLoading,
        error,
        formData,
        editingEvent,
        showAddForm,
        fetchEvents,
        setShowAddForm,
        setEditingEvent,
        updateFormData,
        resetForm,
        handleSaveEvent,
        handleDeleteEvent,
        handleEditEvent,
        initFormForDate
    };
};

export default useCalendarEvents;
