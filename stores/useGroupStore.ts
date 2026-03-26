import { create } from 'zustand';
import { getGroupsAllByUserId, createGroup as createGroupApi } from '@/services/groupService';
import { Group, CreateGroupPayload, GroupApiResponse } from '@/types/group';

interface GroupState {
    groups: GroupApiResponse[];
    selectedGroupId: number | null;
    isLoading: boolean;
    error: string | null;

    fetchGroups: (userId: number) => Promise<void>;
    createGroup: (payload: Omit<CreateGroupPayload, 'creatorUserId'>, userId: number) => Promise<GroupApiResponse>;
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
            const fullPayload: CreateGroupPayload = { ...payload };
            const newGroup = await createGroupApi(fullPayload);
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

    setSelectedGroupId: (id) => {
        set({ selectedGroupId: id });
    },
}));
