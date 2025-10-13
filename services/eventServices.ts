import httpClient from '@/lib/httpClient';

const pagination = {
    pageNumber: 1,
    pageSize: 100,
    sortBy: 'startDate',
    sortOrder: 'DESC',
    filter: {}
};

export const getEventsAll = async () => httpClient.post('/api/events/all', pagination);

export const getEventbyId = async (eventId: number) => httpClient.get(`/api/events/${eventId}`);

export const createEvent = async (event: FormData) => httpClient.post('/api/events', event);

export const updateEvent = async (eventId: number, userId: number, event: FormData) => {
    const updatedEvent = { ...event, userId };
    return httpClient.put(`/api/events/${eventId}`, updatedEvent);
};

export const deleteEvent = async (eventId: number) => httpClient.delete(`/api/events/${eventId}`);
