/**
 * Group-related TypeScript interfaces
 */

// สมาชิกใน group (matches backend GroupMemberResponse)
export interface GroupMember {
    userId: number;
    name: string;
    username: string;
    role: 'ADMIN' | 'USER';
    picture_url: string | null;
}

// Group พร้อม members (matches GET /api/v1/group/user/{userId} response)
export interface GroupWithMembers {
    groupId: number;
    groupName: string;
    description: string | null;
    members: GroupMember[];
}
