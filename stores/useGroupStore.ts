import { create } from 'zustand';
import { getGroupsAll, createGroup as createGroupApi } from '@/services/groupService';
import type { Group, CreateGroupPayload } from '@/types/group';

interface GroupState {
    groups: Group[];
    selectedGroupId: number | null;
    isLoading: boolean;
    error: string | null;

    fetchGroups: (userId: number) => Promise<void>;
    createGroup: (payload: Omit<CreateGroupPayload, 'creatorUserId'>, userId: number) => Promise<Group>;
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
            const data = await getGroupsAll(userId);
            set((state) => ({ 
                groups: data || [], 
                selectedGroupId: state.selectedGroupId || (data?.length > 0 ? data[0].id : null),
                isLoading: false 
            }));
        } catch (error: any) {
            set({ error: error?.message || 'Failed to fetch groups', isLoading: false });
        }
    },

    createGroup: async (payload, userId) => {
        set({ isLoading: true, error: null });
        try {
            const fullPayload: CreateGroupPayload = { ...payload };
            const newGroup = await createGroupApi(fullPayload);
            set((state) => ({ 
                groups: [...state.groups, newGroup],
                selectedGroupId: newGroup.id,
                isLoading: false 
            }));
            return newGroup;
        } catch (error: any) {
            set({ error: error?.message || 'Failed to create group', isLoading: false });
            throw error;
        }
    },

    setSelectedGroupId: (id) => {
        set({ selectedGroupId: id });
    },
}));
