import { create } from 'zustand';
import { getGroupsAllByUserId, createGroup as createGroupApi, deleteGroup as deleteGroupApi, joinGroupByCode } from '@/services/groupService';
import type { Group, CreateGroupPayload, GroupApiResponse } from '@/types/group';

interface GroupState {
    groups: GroupApiResponse[];
    selectedGroupId: number | null;
    isLoading: boolean;
    error: string | null;

    fetchGroups: (userId: number) => Promise<void>;
    createGroup: (payload: Omit<CreateGroupPayload, 'creatorUserId'>, userId: number) => Promise<GroupApiResponse>;
    updateGroup: (groupId: number, payload: CreateGroupPayload) => Promise<Group>;
    deleteGroup: (groupId: number, userId: number) => Promise<void>;
    joinGroup: (inviteCode: string) => Promise<Group>;
    setSelectedGroupId: (id: number | null) => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
    groups: [],
    selectedGroupId: null,
    isLoading: false,
    error: null,

    fetchGroups: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const data = await getGroupsAllByUserId(userId);
            set((state) => ({ 
                groups: data || [], 
                selectedGroupId: state.selectedGroupId || (data?.length > 0 ? data[0].groupId : null),
                isLoading: false 
            }));
        } catch (error: any) {
            set({ error: error?.message || 'Failed to fetch groups', isLoading: false });
        }
    },

    createGroup: async (payload, userId) => {
        set({ isLoading: true, error: null });
        try {
            const newGroup = await createGroupApi(payload);
            set((state) => ({ 
                groups: [...state.groups, newGroup],
                selectedGroupId: newGroup.groupId,
                isLoading: false 
            }));
            return newGroup;
        } catch (error: any) {
            set({ error: error?.message || 'Failed to create group', isLoading: false });
            throw error;
        }
    },

    updateGroup: async (groupId, payload) => {
        set({ isLoading: true, error: null });
        try {
            const { updateGroup: updateGroupApi } = await import('@/services/groupService');
            const updatedGroup = await updateGroupApi(groupId, payload);
            set((state) => ({
                groups: state.groups.map((g) => g.groupId === groupId ? { ...g, ...updatedGroup, groupId: updatedGroup.id, groupName: updatedGroup.name } : g),
                isLoading: false,
            }));
            return updatedGroup;
        } catch (error: any) {
            set({ error: error?.message || 'Failed to update group', isLoading: false });
            throw error;
        }
    },

    deleteGroup: async (groupId, userId) => {
        set({ isLoading: true, error: null });
        try {
            await deleteGroupApi(groupId, userId);
            set((state) => {
                const updatedGroups = state.groups.filter((g) => g.groupId !== groupId);
                return {
                    groups: updatedGroups,
                    selectedGroupId: state.selectedGroupId === groupId ? (updatedGroups.length > 0 ? updatedGroups[0].groupId : null) : state.selectedGroupId,
                    isLoading: false,
                };
            });
        } catch (error: any) {
            set({ error: error?.message || 'Failed to delete group', isLoading: false });
            throw error;
        }
    },

    joinGroup: async (inviteCode) => {
        set({ isLoading: true, error: null });
        try {
            const newGroup = await joinGroupByCode(inviteCode);
            set((state) => ({
                groups: [...state.groups, { ...newGroup, groupId: newGroup.id, groupName: newGroup.name } as any],
                selectedGroupId: newGroup.id,
                isLoading: false,
            }));
            return newGroup;
        } catch (error: any) {
            set({ error: error?.message || 'Failed to join group', isLoading: false });
            throw error;
        }
    },

    setSelectedGroupId: (id) => {
        set({ selectedGroupId: id });
    },
}));
