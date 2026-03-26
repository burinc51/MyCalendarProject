import httpClient from '@/lib/httpClient';
import type { Group, GroupApiResponse, CreateGroupPayload } from '@/types/group';

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

export const getGroupsAll = async (userId: number): Promise<Group[]> => {
    const response = await httpClient.get(`/api/v1/group/user/${userId}`);
    const data: GroupApiResponse[] = response.data?.content ?? response.data ?? [];
    return data.map(mapGroup);
};

export const createGroup = async (payload: CreateGroupPayload): Promise<Group> => {
    console.log("payload create group :", JSON.stringify(payload, null, 2));
    const response = await httpClient.post('/api/v1/group/create', payload);
    return mapGroup(response.data);
};

export const getGroupById = async (groupId: number): Promise<Group> => {
    const response = await httpClient.get(`/api/v1/group/${groupId}`);
    return mapGroup(response.data);
};
