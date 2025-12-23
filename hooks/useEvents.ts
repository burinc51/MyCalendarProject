import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEventsAll, createEvent, updateEvent, deleteEvent } from '@/services/eventService';
import { Alert } from 'react-native';

export const useEvents = () => {
    const queryClient = useQueryClient();

    // Fetch all events
    const {
        data: eventsData,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            const response = await getEventsAll();
            return response.data?.content || [];
        }
    });

    // Create event mutation
    const createEventMutation = useMutation({
        mutationFn: (eventData: FormData) => createEvent(eventData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            Alert.alert('Success', 'Event created successfully!');
        },
        onError: (error) => {
            console.error('Create event error:', error);
            Alert.alert('Error', 'Failed to create event');
        }
    });

    // Update event mutation
    const updateEventMutation = useMutation({
        mutationFn: ({ eventId, userId, eventData }: { eventId: number; userId: number; eventData: FormData }) =>
            updateEvent(eventId, userId, eventData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            Alert.alert('Success', 'Event updated successfully!');
        },
        onError: (error) => {
            console.error('Update event error:', error);
            Alert.alert('Error', 'Failed to update event');
        }
    });

    // Delete event mutation
    const deleteEventMutation = useMutation({
        mutationFn: (eventId: number) => deleteEvent(eventId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            Alert.alert('Success', 'Event deleted successfully!');
        },
        onError: (error) => {
            console.error('Delete event error:', error);
            Alert.alert('Error', 'Failed to delete event');
        }
    });

    return {
        events: eventsData || [],
        isLoading,
        error,
        refetch,
        createEvent: createEventMutation.mutate,
        updateEvent: updateEventMutation.mutate,
        deleteEvent: deleteEventMutation.mutate,
        isCreating: createEventMutation.isPending,
        isUpdating: updateEventMutation.isPending,
        isDeleting: deleteEventMutation.isPending
    };
};
