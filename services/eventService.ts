import httpClient from '@/lib/httpClient';

const pagination = {
    pageNumber: 1,
    pageSize: 100,
    sortBy: 'startDate',
    sortOrder: 'DESC',
    filter: {}
};

// ดึง events ทั้งหมด (pagination)
export const getEventsAll = async () => httpClient.post('/api/v1/event/all', pagination);

// ดึง event ตาม id
export const getEventbyId = async (eventId: number) => httpClient.get(`/api/v1/event/${eventId}`);

// สร้าง event (multipart/form-data — body part เป็น Blob JSON)
export const createEvent = async (event: FormData) => httpClient.post('/api/v1/event/create', event);

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