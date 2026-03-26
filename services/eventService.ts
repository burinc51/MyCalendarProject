import httpClient from '@/lib/httpClient';
import { encode as btoa } from 'base-64';

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

// ดึง event ตาม id
export const getEventById = async (eventId: number) => httpClient.get(`/api/v1/event/${eventId}`);

// สร้าง event (multipart/form-data — body part เป็น Blob JSON)
export const createEvent = async (event: FormData) => httpClient.post('/api/v1/event/create', event, {
    headers: {
        'Content-Type': 'multipart/form-data',
    }
});

// อัปเดต event — endpoint คือ PUT /api/v1/event/update, eventId อยู่ใน body JSON แล้ว
export const updateEvent = async (_eventId: number, _userId: number, event: FormData) =>
    httpClient.put('/api/v1/event/update', event);

// ลบ event
export const deleteEvent = async (eventId: number) => httpClient.delete(`/api/v1/event/${eventId}`);

// ดึง events ตาม group (pagination)
export const getEventsByGroup = async (groupId: number) =>
    httpClient.post(`/api/v1/event/all/${groupId}`, pagination);

// ดึง events สำหรับ month view (optimized)
export const getMonthView = async (startDate: string, endDate: string, groupId?: number) =>
    httpClient.get('/api/v1/event/month-view', { params: { startDate, endDate, groupId } });

// ดึง events สำหรับ year summary
export const getYearSummary = async (year: number, groupId?: number) =>
    httpClient.get('/api/v1/event/year-summary', { params: { year, groupId } });
