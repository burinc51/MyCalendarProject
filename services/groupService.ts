/**
 * Group Service
 * API operations for groups using backend endpoints
 */

import httpClient from '@/lib/httpClient';
import type { ApiGroupResponse, CreateGroupRequest, AddMemberRequest } from '@/types/group';

// Pagination request type
interface PaginationRequest {
    pageNumber: number;
    pageSize: number;
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
    filter?: Record<string, unknown>;
}

interface PaginationResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
}

// Default pagination settings
const defaultPagination: PaginationRequest = {
    pageNumber: 1,
    pageSize: 50,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    filter: {}
};

/**
 * Get all groups (paginated)
 */
export const getAllGroups = async (pagination = defaultPagination) => httpClient.post<PaginationResponse<ApiGroupResponse>>('/api/v1/group/all', pagination);

/**
 * Get groups by user ID
 */
export const getGroupsByUserId = async (userId: number) => httpClient.get<ApiGroupResponse[]>(`/api/v1/group/user/${userId}`);

/**
 * Get a single group by ID
 */
export const getGroupById = async (groupId: number) => httpClient.get<ApiGroupResponse>(`/api/v1/group/${groupId}`);

/**
 * Create a new group
 */
export const createGroup = async (request: CreateGroupRequest) => httpClient.post<string>('/api/v1/group/create', request);

/**
 * Update an existing group
 */
export const updateGroup = async (groupId: number, request: Partial<CreateGroupRequest>) => httpClient.put<ApiGroupResponse>(`/api/v1/group/update/${groupId}`, request);

/**
 * Delete a group
 */
export const deleteGroup = async (groupId: number, requestUserId: number) => httpClient.delete(`/api/v1/group/${groupId}?requestUserId=${requestUserId}`);

/**
 * Add a member to a group
 */
export const addMemberToGroup = async (request: AddMemberRequest) => httpClient.post<string>('/api/v1/group/add-member', request);

/**
 * Remove a member from a group
 */
export const removeMemberFromGroup = async (groupId: number, userId: number) => httpClient.delete(`/api/v1/group/${groupId}/members/${userId}`);

export default {
    getAllGroups,
    getGroupsByUserId,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    addMemberToGroup,
    removeMemberFromGroup
};
