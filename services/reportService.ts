import httpClient from '@/lib/httpClient';
import { Linking } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED';

export interface ReportPayload {
    category: string;
    detail: string;
}

export interface ReportResponse {
    id: number;
    userId: number;
    username: string;
    category: string;
    detail: string;
    status: ReportStatus;
    createdAt: string;
    updatedAt: string;
}

/** PaginationResponse<T> ตาม standard ของ backend */
export interface PaginationResponse<T> {
    content: T[];
    pageNo: number;       // 0-indexed จาก Spring
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

export interface ReportFilter {
    status?: ReportStatus;
    category?: string;
    username?: string;
}

/** PaginationWithFilterRequest<T> ตาม standard ของ backend */
export interface PaginationWithFilterRequest<T> {
    pageNumber: number;
    pageSize: number;
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
    filter: T;
}

// ─── User functions ───────────────────────────────────────────────────────────

/**
 * ส่งรายงานปัญหาผ่าน API
 */
export async function submitReport(payload: ReportPayload): Promise<ReportResponse> {
    const res = await httpClient.post<ReportResponse>('/api/v1/reports', payload);
    return res.data;
}

/**
 * ส่งรายงานปัญหาผ่านอีเมล (Fallback เมื่อ API ล้มเหลว)
 */
export async function submitReportByEmail(payload: ReportPayload): Promise<void> {
    const subject = encodeURIComponent(`[GRPlan Report] ${payload.category}`);
    const body = encodeURIComponent(
        `หัวข้อ: ${payload.category}\n\nรายละเอียด:\n${payload.detail || '(ไม่มีรายละเอียดเพิ่มเติม)'}`
    );
    const mailto = `mailto:admin@grplan.com?subject=${subject}&body=${body}`;
    await Linking.openURL(mailto);
}

// ─── Admin functions ──────────────────────────────────────────────────────────

/**
 * Admin: ดูรายการรายงานทั้งหมด (pagination + filter + sort)
 */
export async function getReports(
    request: PaginationWithFilterRequest<ReportFilter>
): Promise<PaginationResponse<ReportResponse>> {
    const res = await httpClient.post<PaginationResponse<ReportResponse>>('/api/v1/reports/all', request);
    console.log('getReports response:', res.data);
    return res.data;
}

/**
 * Admin: ดูรายละเอียดรายงานตาม id
 */
export async function getReportById(id: number): Promise<ReportResponse> {
    const res = await httpClient.get<ReportResponse>(`/api/v1/reports/${id}`);
    return res.data;
}

/**
 * Admin: อัปเดตสถานะรายงาน
 */
export async function updateReportStatus(id: number, status: ReportStatus): Promise<ReportResponse> {
    const res = await httpClient.patch<ReportResponse>(`/api/v1/reports/${id}/status`, { status });
    return res.data;
}
