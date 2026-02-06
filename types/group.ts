/**
 * Group TypeScript interfaces
 * Types for the Groups feature
 */

// Group interface (Frontend)
export interface Group {
    id: number;
    name: string;
    description?: string;
    icon?: string;
    memberCount: number;
    createdAt: string;
    updatedAt: string;
}

// Group Member interface
export interface GroupMember {
    userId: number;
    name: string;
    email: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    photoUrl?: string;
    joinedAt: string;
}

// API Response types
export interface ApiGroupResponse {
    groupId: number;
    groupName: string;
    description: string | null;
    icon: string | null;
    memberCount: number;
    members: ApiGroupMember[] | null;
    createdAt: string;
    updatedAt: string;
}

export interface ApiGroupMember {
    userId: number;
    name: string;
    email: string;
    roleInGroup: string;
    photoUrl: string | null;
    joinedAt: string;
}

// Form data for creating/editing groups
export interface GroupFormData {
    name: string;
    description: string;
    icon: string;
}

// Request types
export interface CreateGroupRequest {
    groupName: string;
    description?: string;
    icon?: string;
}

export interface AddMemberRequest {
    groupId: number;
    userId: number;
    roleInGroup: 'ADMIN' | 'MEMBER';
}

// Default values
export const DEFAULT_GROUP_FORM: GroupFormData = {
    name: '',
    description: '',
    icon: 'folder'
};

// Icon options for groups
export const GROUP_ICONS = ['folder', 'star', 'heart', 'check', 'shopping-cart', 'users', 'briefcase', 'home', 'calendar', 'bookmark'] as const;

// Helper function to map API response to frontend interface
export const mapApiToGroup = (api: ApiGroupResponse): Group => ({
    id: api.groupId,
    name: api.groupName,
    description: api.description || undefined,
    icon: api.icon || 'folder',
    memberCount: api.memberCount,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt
});

// Helper function to map API member to frontend interface
export const mapApiToMember = (api: ApiGroupMember): GroupMember => ({
    userId: api.userId,
    name: api.name,
    email: api.email,
    role: api.roleInGroup as 'OWNER' | 'ADMIN' | 'MEMBER',
    photoUrl: api.photoUrl || undefined,
    joinedAt: api.joinedAt
});
