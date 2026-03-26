import httpClient from '@/lib/httpClient';
import type { CreateGroupPayload, Group, GroupApiResponse } from '@/types/group';
import { EventUser } from '@/types/event';

// Map API response shape → local Group type
const mapGroup = (g: GroupApiResponse): Group => ({
    id: g.groupId,
    name: g.groupName,
    icon: g.icon,
    color: g.color,
    bg: g.bg,
    description: g.description,
    members: g.members?.map((m) => ({
        userId: m.userId,
        username: m.username,
        name: m.name,
        imageUrl: m.picture_url ?? null,
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
