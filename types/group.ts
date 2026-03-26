export interface GroupMember {
    userId: number;
    username: string;
    name: string;
    imageUrl?: string | null;
}

export interface Group {
    id: number;
    name: string;
    icon: string;
    color: string;
    bg?: string;
    members?: GroupMember[];
}

export interface CreateGroupPayload {
    groupName: string;
    icon: string;
    color: string;
    description?: string;
    bg?: string;
}
