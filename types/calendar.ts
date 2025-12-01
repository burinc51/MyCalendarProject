export interface Calendar {
    id: number | string | null;
    title: string;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    color?: string;
    weekSpan?: number;
    isStartOfEvent?: boolean;
    isEndOfEvent?: boolean;
    startDayIndex?: number;
    endDayIndex?: number;
    isAllDay?: boolean;
    slot?: number;
}
