import httpClient from '@/lib/httpClient';
import type {
    CreateGroupPayload,
    Group,
    GroupApiResponse,
    InvitableUsersResponse,
    SendInvitationPayload,
    SendInvitationResponse,
    PaginationRequest
} from '@/types/group';
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
    const response = await httpClient.post('/api/v1/group/create', payload);
    return response.data;
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



export const getInvitableUsers = async (groupId: number): Promise<InvitableUsersResponse> => {
    const response = await httpClient.get(`/api/v1/group/${groupId}/invitable-users`);
    return response.data;
};

export const getInvitableUsersPaginated = async (groupId: number, paginationRequest: PaginationRequest): Promise<InvitableUsersResponse> => {
    const response = await httpClient.post(`/api/v1/group/${groupId}/invitable-users`, paginationRequest);
    return response.data;
};

export const sendGroupInvitations = async (groupId: number, payload: SendInvitationPayload): Promise<SendInvitationResponse> => {
    const response = await httpClient.post(`/api/v1/group/${groupId}/invitations`, payload);
    return response.data;
};

