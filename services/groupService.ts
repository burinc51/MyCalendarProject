import httpClient from '@/lib/httpClient';
import type { GroupWithMembers } from '@/types/group';

// ดึง groups ทั้งหมดที่ user คนนี้อยู่ (พร้อม members list)
// GET /api/v1/group/user/{userId}
export const getGroupsByUserId = async (userId: number): Promise<GroupWithMembers[]> => {
    const res = await httpClient.get<GroupWithMembers[]>(`/api/v1/group/user/${userId}`);
    return res.data;
};

// ดึง group เดียวตาม groupId
// GET /api/v1/group/{groupId}
export const getGroupById = async (groupId: number) =>
    httpClient.get(`/api/v1/group/${groupId}`);
