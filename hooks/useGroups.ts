/**
 * useGroups Hook
 * Manages groups state with TanStack Query for caching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import * as groupService from '@/services/groupService';
import { mapApiToGroup } from '@/types/group';
import type { Group, GroupFormData, CreateGroupRequest, AddMemberRequest } from '@/types/group';
import { useAuthStore } from '@/stores/useAuthStore';

// Query keys for cache management
export const groupKeys = {
    all: ['groups'] as const,
    byUser: (userId: number) => ['groups', 'user', userId] as const,
    detail: (groupId: number) => ['groups', 'detail', groupId] as const
};

export const useGroups = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const userId = user?.id || 1; // Fallback to 1 for development

    // Fetch all groups
    const {
        data: groupsData,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: groupKeys.all,
        queryFn: async () => {
            const response = await groupService.getAllGroups();
            return response.data?.content?.map(mapApiToGroup) || [];
        }
    });

    // Fetch groups by user ID
    const {
        data: userGroups,
        isLoading: isLoadingUserGroups,
        refetch: refetchUserGroups
    } = useQuery({
        queryKey: groupKeys.byUser(userId),
        queryFn: async () => {
            const response = await groupService.getGroupsByUserId(userId);
            return response.data?.map(mapApiToGroup) || [];
        },
        enabled: !!userId
    });

    // Create group mutation
    const createGroupMutation = useMutation({
        mutationFn: (formData: GroupFormData) => {
            const request: CreateGroupRequest = {
                groupName: formData.name.trim(),
                description: formData.description || undefined,
                icon: formData.icon
            };
            return groupService.createGroup(request);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: groupKeys.all });
            queryClient.invalidateQueries({ queryKey: groupKeys.byUser(userId) });
            Alert.alert('สำเร็จ', 'สร้างกลุ่มเรียบร้อยแล้ว');
        },
        onError: (err) => {
            console.error('Create group error:', err);
            Alert.alert('ผิดพลาด', 'ไม่สามารถสร้างกลุ่มได้');
        }
    });

    // Update group mutation
    const updateGroupMutation = useMutation({
        mutationFn: ({ groupId, formData }: { groupId: number; formData: Partial<GroupFormData> }) => {
            const request: Partial<CreateGroupRequest> = {
                groupName: formData.name?.trim(),
                description: formData.description,
                icon: formData.icon
            };
            return groupService.updateGroup(groupId, request);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: groupKeys.all });
            queryClient.invalidateQueries({ queryKey: groupKeys.byUser(userId) });
            Alert.alert('สำเร็จ', 'อัพเดทกลุ่มเรียบร้อยแล้ว');
        },
        onError: (err) => {
            console.error('Update group error:', err);
            Alert.alert('ผิดพลาด', 'ไม่สามารถอัพเดทกลุ่มได้');
        }
    });

    // Delete group mutation
    const deleteGroupMutation = useMutation({
        mutationFn: (groupId: number) => groupService.deleteGroup(groupId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: groupKeys.all });
            queryClient.invalidateQueries({ queryKey: groupKeys.byUser(userId) });
            Alert.alert('สำเร็จ', 'ลบกลุ่มเรียบร้อยแล้ว');
        },
        onError: (err) => {
            console.error('Delete group error:', err);
            Alert.alert('ผิดพลาด', 'ไม่สามารถลบกลุ่มได้');
        }
    });

    // Add member mutation
    const addMemberMutation = useMutation({
        mutationFn: (request: AddMemberRequest) => groupService.addMemberToGroup(request),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) });
            queryClient.invalidateQueries({ queryKey: groupKeys.all });
            Alert.alert('สำเร็จ', 'เพิ่มสมาชิกเรียบร้อยแล้ว');
        },
        onError: (err) => {
            console.error('Add member error:', err);
            Alert.alert('ผิดพลาด', 'ไม่สามารถเพิ่มสมาชิกได้');
        }
    });

    // Remove member mutation
    const removeMemberMutation = useMutation({
        mutationFn: ({ groupId, memberId }: { groupId: number; memberId: number }) => groupService.removeMemberFromGroup(groupId, memberId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) });
            queryClient.invalidateQueries({ queryKey: groupKeys.all });
            Alert.alert('สำเร็จ', 'ลบสมาชิกเรียบร้อยแล้ว');
        },
        onError: (err) => {
            console.error('Remove member error:', err);
            Alert.alert('ผิดพลาด', 'ไม่สามารถลบสมาชิกได้');
        }
    });

    // Helper function to confirm delete
    const confirmDeleteGroup = (group: Group) => {
        Alert.alert('ลบกลุ่ม', `คุณแน่ใจหรือไม่ที่จะลบกลุ่ม "${group.name}"?`, [
            { text: 'ยกเลิก', style: 'cancel' },
            {
                text: 'ลบ',
                style: 'destructive',
                onPress: () => deleteGroupMutation.mutate(group.id)
            }
        ]);
    };

    return {
        // Data
        groups: groupsData || [],
        userGroups: userGroups || [],

        // Loading states
        isLoading,
        isLoadingUserGroups,
        isCreating: createGroupMutation.isPending,
        isUpdating: updateGroupMutation.isPending,
        isDeleting: deleteGroupMutation.isPending,

        // Error
        error,

        // Actions
        refetch,
        refetchUserGroups,
        createGroup: createGroupMutation.mutate,
        updateGroup: updateGroupMutation.mutate,
        deleteGroup: deleteGroupMutation.mutate,
        confirmDeleteGroup,
        addMember: addMemberMutation.mutate,
        removeMember: removeMemberMutation.mutate
    };
};

export default useGroups;
