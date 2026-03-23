/**
 * Group-related TypeScript interfaces
 */

// สมาชิกใน group (matches backend GroupMemberResponse)
export interface GroupMember {
    userId: number;
    initialText: string | null;
    avatarColor: string | null;
    picture_url: string | null;
}

// Group พร้อม members (matches GET /api/v1/group/user/{userId} response)
export interface GroupWithMembers {
    groupId: number;
    groupName: string;
    icon: string | null;
    color: string | null;
    bg: string | null;
    members: GroupMember[];
}
