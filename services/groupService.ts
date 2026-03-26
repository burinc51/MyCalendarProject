import httpClient from '@/lib/httpClient';
import type { Group, CreateGroupPayload } from '@/types/group';

export const getGroupsAll = async (userId: number): Promise<Group[]> => {
    const response = await httpClient.get(`/api/v1/group/user/${userId}`);
    return response.data;
};

export const createGroup = async (payload: CreateGroupPayload): Promise<Group> => {
    console.log("payload create group :", JSON.stringify(payload, null, 2));
    const response = await httpClient.post('/api/v1/group/create', payload);
    return response.data;
};

export const getGroupById = async (groupId: number): Promise<Group> => {
    const response = await httpClient.get(`/api/v1/group/${groupId}`);
    return response.data;
};
