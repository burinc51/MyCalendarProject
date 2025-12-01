// monthNames.ts

export const monthNames = {
    th: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
};

export default function getMonthName(month: number, year: number, locale: 'th' | 'en' = 'en'): string {
    const index = month - 1;
    const months = monthNames[locale];
    if (index < 0 || index > 11) return 'Invalid month';
    return `${months[index]} ${year}`;
}
