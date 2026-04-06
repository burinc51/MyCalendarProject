import httpClient from '@/lib/httpClient';
import { Linking } from 'react-native';

export interface ReportPayload {
    category: string;
    detail: string;
}

/**
 * ส่งรายงานปัญหาผ่าน API (ถ้า Backend พร้อม)
 */
export async function submitReport(payload: ReportPayload): Promise<void> {
    await httpClient.post('/api/v1/reports', payload);
}

/**
 * ส่งรายงานปัญหาผ่านอีเมล (Fallback)
 */
export async function submitReportByEmail(payload: ReportPayload): Promise<void> {
    const subject = encodeURIComponent(`[GRPlan Report] ${payload.category}`);
    const body = encodeURIComponent(
        `หัวข้อ: ${payload.category}\n\nรายละเอียด:\n${payload.detail || '(ไม่มีรายละเอียดเพิ่มเติม)'}`
    );
    const mailto = `mailto:admin@grplan.com?subject=${subject}&body=${body}`;
    await Linking.openURL(mailto);
}
