import httpClient from '@/lib/httpClient';

const pagination = {
    pageNumber: 1,
    pageSize: 100,
    sortBy: 'startDate',
    sortOrder: 'DESC',
    filter: {}
};

export const getEventsAll = async (groupId?: number | null) => {
    const payload = {
        ...pagination,
        filter: groupId ? { ...pagination.filter, groupId } : pagination.filter,
    };
    return httpClient.post('/api/v1/event/all', payload);
};

export const getEventbyId = async (eventId: number) => httpClient.get(`/api/v1/event/${eventId}`);

export const createEvent = async (event: FormData) => httpClient.post('/api/v1/event/create', event);

export const updateEvent = async (eventId: number, userId: number, event: FormData) => {
    event.append('id', String(eventId));
    event.append('userId', String(userId));
    return httpClient.put(`/api/v1/event/${eventId}`, event);
};

export const deleteEvent = async (eventId: number) => httpClient.delete(`/api/v1/event/${eventId}`);