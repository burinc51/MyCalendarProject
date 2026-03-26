export interface GroupMember {
    userId: number;
    username?: string;
    name?: string;
    imageUrl?: string | null;
}

export interface Group {
    id: number;
    name: string;
    icon: string;
    color: string;
    bg?: string;
    description?: string;
    members?: GroupMember[];
}

// Raw shape returned by API (before mapping)
export interface GroupApiResponse {
    groupId: number;
    groupName: string;
    icon: string;
    color: string;
    bg?: string;
    description?: string;
    members?: {
        userId: number;
        username?: string;
        name?: string;
        picture_url?: string | null;
    }[];
}

export interface CreateGroupPayload {
    groupName: string;
    icon: string;
    color: string;
    description?: string;
    bg?: string;
}
