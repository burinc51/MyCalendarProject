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
