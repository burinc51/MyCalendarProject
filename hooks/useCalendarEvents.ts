/**
 * useCalendarEvents Hook
 * Manages calendar events state and API operations
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { getEventsAll, createEvent, updateEvent, deleteEvent } from '@/services/event-service';
import { mapApiEventToCalendar, buildEventFormData } from '@/utils/calendar-helpers';
import { DEFAULT_EVENT_FORM } from '@/constants/Calendar';
import type { CalendarEvent, EventFormData } from '@/types/event';

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
                setEvents(mappedEvents);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error('Failed to fetch events:', err);
            setError(`Could not load events. Reason: ${errorMessage}. Please try again later.`);
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
        const dayjs = require('dayjs');
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
            const formDataToSend = buildEventFormData(formData, editingEvent?.userId || 2);

            if (editingEvent) {
                const userId = editingEvent.userId || 2;
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
