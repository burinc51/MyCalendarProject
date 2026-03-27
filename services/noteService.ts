import type { AxiosError, AxiosResponse } from 'axios';

import httpClient from '@/lib/httpClient';
import type { Note, NoteFormData, NoteListQuery, PaginatedNotes } from '@/types/note';

type ApiErrorItem = {
    field: string;
    reason: string;
};

type ApiEnvelope<T> = {
    status: 'success' | 'error';
    message: string;
    data: T;
    errors?: ApiErrorItem[];
};

type NoteImageUploadResult = {
    url: string;
    fileName: string;
    mimeType: string;
    size: number;
};

type DeleteImageResult = {
    url: string;
    deleted: boolean;
};

type DeleteNoteResult = {
    id: number;
};

type UploadNoteImageInput = {
    uri: string;
    fileName?: string;
    mimeType?: string;
};

const buildApiError = (error: unknown, fallbackMessage: string): Error => {
    const axiosError = error as AxiosError<ApiEnvelope<null>>;
    const message = axiosError.response?.data?.message ?? fallbackMessage;
    return new Error(message);
};

const unwrapEnvelope = <T>(response: AxiosResponse<ApiEnvelope<T>>): T => {
    return response.data.data;
};

const normalizeTags = (tags: string[] | undefined): string[] => {
    if (!tags) return [];
    return tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
};

const toCreatePayload = (formData: NoteFormData): NoteFormData => ({
    ...formData,
    title: formData.title.trim(),
    content: formData.content,
    tags: normalizeTags(formData.tags),
});

const toUpdatePayload = (formData: Partial<NoteFormData>): Partial<NoteFormData> => {
    const payload: Partial<NoteFormData> = {};

    if (typeof formData.title === 'string') payload.title = formData.title.trim();
    if (typeof formData.content === 'string') payload.content = formData.content;
    if (typeof formData.color === 'string') payload.color = formData.color;
    if (typeof formData.isPinned === 'boolean') payload.isPinned = formData.isPinned;
    if (Array.isArray(formData.tags)) payload.tags = normalizeTags(formData.tags);
    if (formData.reminderDate !== undefined) payload.reminderDate = formData.reminderDate;
    if (formData.recurrence !== undefined) payload.recurrence = formData.recurrence;
    if (formData.locationName !== undefined) payload.locationName = formData.locationName;
    if (formData.locationLink !== undefined) payload.locationLink = formData.locationLink;
    if (formData.startDate !== undefined) payload.startDate = formData.startDate;
    if (formData.endDate !== undefined) payload.endDate = formData.endDate;

    return payload;
};

export const getNotes = async (query: NoteListQuery = {}): Promise<PaginatedNotes> => {
    try {
        const response = await httpClient.get<PaginatedNotes>('/api/v1/notes', {
            params: {
                pageNo: query.pageNo ?? 1,
                pageSize: query.pageSize ?? 20,
                search: query.search || undefined,
                sortBy: query.sortBy ?? 'updatedAt',
                sortDirection: query.sortDirection ?? 'desc',
                isPinned: query.isPinned
            }
        });
        return response.data;
    } catch (error) {
        throw buildApiError(error, 'Failed to load notes');
    }
};

export const getNoteById = async (noteId: number): Promise<Note> => {
    try {
        const response = await httpClient.get<Note>(`/api/v1/notes/${noteId}`);
        return response.data;
    } catch (error) {
        throw buildApiError(error, 'Failed to fetch note');
    }
};

export const createNote = async (formData: NoteFormData): Promise<Note> => {
    try {
        console.log("Creating note with data: ", formData);
        const response = await httpClient.post<Note>('/api/v1/notes/create', toCreatePayload(formData));
        return response.data;
    } catch (error) {
        throw buildApiError(error, 'Failed to create note');
    }
};

export const updateNote = async (noteId: number, formData: Partial<NoteFormData>): Promise<Note> => {
    try {
        const response = await httpClient.put<Note>(`/api/v1/notes/${noteId}`, toUpdatePayload(formData));
        return response.data;
    } catch (error) {
        throw buildApiError(error, 'Failed to update note');
    }
};

export const deleteNote = async (noteId: number): Promise<DeleteNoteResult> => {
    try {
        const response = await httpClient.delete<ApiEnvelope<DeleteNoteResult>>(`/api/v1/notes/${noteId}`);
        return unwrapEnvelope(response);
    } catch (error) {
        throw buildApiError(error, 'Failed to delete note');
    }
};

export const toggleNotePin = async (noteId: number): Promise<Note> => {
    const currentNote = await getNoteById(noteId);
    return updateNote(noteId, { isPinned: !currentNote.isPinned });
};

export const uploadNoteImage = async ({ uri, fileName, mimeType }: UploadNoteImageInput): Promise<string> => {
    try {
        const formData = new FormData();
        const safeFileName = fileName || `note-${Date.now()}.jpg`;
        const safeMimeType = mimeType || 'image/jpeg';

        formData.append('image', {
            uri,
            name: safeFileName,
            type: safeMimeType,
        } as any);

        const response = await httpClient.post<NoteImageUploadResult>(
            '/api/v1/notes/upload-image',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data.url;
    } catch (error) {
        throw buildApiError(error, 'Failed to upload image');
    }
};

export const deleteUploadedNoteImage = async (url: string): Promise<DeleteImageResult> => {
    try {
        const response = await httpClient.delete<DeleteImageResult>('/api/v1/notes/upload-image', {
            data: { url },
        });
        return response.data;
    } catch (error) {
        throw buildApiError(error, 'Failed to delete uploaded image');
    }
};

export default {
    getNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
    toggleNotePin,
    uploadNoteImage,
    deleteUploadedNoteImage,
};
