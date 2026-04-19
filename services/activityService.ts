import httpClient from '@/lib/httpClient';

export interface ActivityLog {
    id: number;
    groupId: number;
    groupName?: string;
    actorId: number;
    actorName: string;
    actorAvatar: string | null;
    actionType: string;
    eventId: number | null;
    eventTitle: string | null;
    eventStartDate?: string | null;
    eventEndDate?: string | null;
    targetUserId: number | null;
    targetUserName: string | null;
    targetAvatar: string | null;
    actionDetail?: string | null;
    isRead?: boolean;
    invitationId?: number | null;
    createdAt: string; // ISO String
}

export interface ActivityResponse {
    content: ActivityLog[];
    pageNo: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

export const fetchActivityLogs = async (page = 1, size = 10): Promise<ActivityResponse> => {
    const response = await httpClient.get<ActivityResponse>(`/api/v1/activity/user?page=${page}&size=${size}`);
    return response.data;
};

export const acceptInvitation = async (invitationId: number): Promise<void> => {
    await httpClient.patch(`/api/v1/group/invitations/${invitationId}/accept`);
};

export const rejectInvitation = async (invitationId: number): Promise<void> => {
    await httpClient.patch(`/api/v1/group/invitations/${invitationId}/reject`);
};
