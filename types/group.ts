export interface GroupMember {
    userId: number;
    username?: string;
    name?: string;
    imageUrl?: string | null;
    picture_url?: string | null; // for API response mapping
    initialText?: string;
    avatarColor?: string;
    role?: 'ADMIN' | 'MEMBER';
}

export interface Group {
    id: number;
    name: string;
    icon: string;
    color: string;
    bg?: string;
    description?: string;
    inviteCode?: string;
    members?: GroupMember[];
}

export interface GroupApiResponse {
    groupId: number;
    groupName: string;
    icon: string;
    color: string;
    bg?: string;
    description?: string;
    inviteCode?: string;
    members?: GroupMember[];
}



export interface CreateGroupPayload {
    groupName: string;
    icon: string;
    color: string;
    description?: string;
    bg?: string;
}

export interface InvitableUser {
    userId: number;
    username: string;
    name: string;
    imageUrl: string | null;
    inviteStatus: 'ALREADY_IN_GROUP' | 'INVITED' | 'INVITABLE';
}

export interface InvitableUsersResponse {
    content: InvitableUser[];
    pageNo: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

export interface GroupInvitation {
    invitationId: number;
    groupId: number;
    groupName: string;
    inviterUserId: number;
    inviterName: string;
    invitedUserId: number;
    invitedUserName: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    invitedAt: string;
    respondedAt?: string;
}

export interface SendInvitationPayload {
    userIds: number[];
}

export interface SendInvitationResponse {
    groupId: number;
    invitedCount: number;
    skippedCount: number;
    invitations: GroupInvitation[];
    skipped: Array<{
        userId: number;
        reason: string;
    }>;
}

export interface PaginationRequest {
    pageNumber: number;
    pageSize: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    filter?: Record<string, any>;
}

