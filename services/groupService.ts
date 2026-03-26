import httpClient from '@/lib/httpClient';
import type { CreateGroupPayload, Group, GroupApiResponse } from '@/types/group';
import { EventUser } from '@/types/event';

const mapGroup = (g: GroupApiResponse): Group => ({
    id: g.groupId,
    name: g.groupName,
    icon: g.icon,
    color: g.color,
    bg: g.bg,
    description: g.description,
    inviteCode: g.inviteCode,
    members: g.members?.map((m) => ({
        userId: m.userId,
        username: m.username,
        name: m.name,
        imageUrl: m.imageUrl || m.picture_url || null,
        initialText: m.initialText,
        avatarColor: m.avatarColor,
        role: m.role,
    })),
});

export const getGroupsAllByUserId = async (userId: number): Promise<GroupApiResponse[]> => {
    const response = await httpClient.get(`/api/v1/group/user/${userId}`);
    return response.data?.content ?? response.data ?? [];
};

export const createGroup = async (payload: CreateGroupPayload): Promise<GroupApiResponse> => {
    console.log('payload create group :', JSON.stringify(payload, null, 2));
    return await httpClient.post('/api/v1/group/create', payload);
};

export const getGroupById = async (groupId: number): Promise<Group> => {
    const response = await httpClient.get(`/api/v1/group/${groupId}`);
    return mapGroup(response.data);
};

export const getUserInGroupsByGroupId = async (groupId: number): Promise<EventUser[]> => {
    const res = await httpClient.get(`/api/v1/group/${groupId}/users`);
    return res.data;
};

export const updateGroup = async (groupId: number, payload: CreateGroupPayload): Promise<Group> => {
    const response = await httpClient.put(`/api/v1/group/update/${groupId}`, payload);
    return mapGroup(response.data);
};

export const deleteGroup = async (groupId: number, userId: number): Promise<void> => {
    await httpClient.delete(`/api/v1/group/${groupId}`, { params: { requestUserId: userId } });
};

export const removeMemberFromGroup = async (groupId: number, userId: number): Promise<void> => {
    await httpClient.delete(`/api/v1/group/${groupId}/members/${userId}`);
};

export const joinGroupByCode = async (inviteCode: string): Promise<Group> => {
    const response = await httpClient.post('/api/v1/group/join', { inviteCode });
    return mapGroup(response.data);
};
