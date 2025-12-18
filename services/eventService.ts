import httpClient from '@/lib/httpClient';

const pagination = {
    pageNumber: 1,
    pageSize: 100,
    sortBy: 'startDate',
    sortOrder: 'DESC',
    filter: {}
};

export const getEventsAll = async () => httpClient.post('/api/v1/event/all', pagination);

export const getEventbyId = async (eventId: number) => httpClient.get(`/api/v1/event/${eventId}`);

export const createEvent = async (event: FormData) => httpClient.post('/api/v1/event/create', event);

export const updateEvent = async (eventId: number, userId: number, event: FormData) => {
    const updatedEvent = { ...event, userId };
    return httpClient.put(`/api/event/${eventId}`, updatedEvent);
};

export const deleteEvent = async (eventId: number) => httpClient.delete(`/api/v1/event/${eventId}`);
