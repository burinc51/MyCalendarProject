import React, { useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import getDateFromIndex from '@/utils/get-date-from-index';
import type { CalendarEvent } from '@/types/event';

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { width, height } = Dimensions.get('window');
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Static dimensions
const HEADER_HEIGHT = 63.5;
const NAVBAR_HEIGHT = 48.6;
const WEEKDAY_HEADER_HEIGHT = 30;
const AVAILABLE_HEIGHT = height - HEADER_HEIGHT - NAVBAR_HEIGHT - WEEKDAY_HEADER_HEIGHT;
const WEEKS_TO_DISPLAY = 6;
const DAY_CELL_HEIGHT = AVAILABLE_HEIGHT / WEEKS_TO_DISPLAY;
const DAY_CELL_WIDTH = width / 7;

// Static styles
const TODAY_STYLE = { backgroundColor: '#f7e6e6' };
const OUTSIDE_MONTH_STYLE = { backgroundColor: '#f9f9f9' };

interface Props {
    index: number;
    onSelectDate: (date: string) => void;
    events: CalendarEvent[];
}

const CalendarBody = React.memo(({ index, onSelectDate, events }: Props) => {
    const { year, month } = getDateFromIndex(index);
    const today = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

    // Memoized days in month calculation
    const getDaysInMonth = useCallback((y: number, m: number) => {
        return dayjs(`${y}-${m + 1}-01`).daysInMonth();
    }, []);

    // Generate calendar (42 days for 6 weeks)
    const generateCalendar = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, month);
        const startDay = dayjs(`${year}-${month + 1}-01`).day();
        const calendar: dayjs.Dayjs[] = [];

        // Previous month
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

        for (let i = startDay - 1; i >= 0; i--) {
            calendar.push(dayjs(`${prevYear}-${prevMonth + 1}-${daysInPrevMonth - i}`));
        }

        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            calendar.push(dayjs(`${year}-${month + 1}-${i}`));
        }

        // Next month
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        let nextMonthDay = 1;
        while (calendar.length < 42) {
            calendar.push(dayjs(`${nextYear}-${nextMonth + 1}-${nextMonthDay}`));
            nextMonthDay++;
        }

        return calendar;
    }, [year, month, getDaysInMonth]);

    // Split into weeks
    const calendarWeeks = useMemo(() => {
        const weeks: dayjs.Dayjs[][] = [];
        for (let i = 0; i < generateCalendar.length; i += 7) {
            weeks.push(generateCalendar.slice(i, i + 7));
        }
        return weeks;
    }, [generateCalendar]);

    // Process events efficiently
    const processedEvents = useMemo(() => {
        const result: { [weekIndex: number]: { [dayIndex: number]: CalendarEvent[] } } = {};

        // Pre-sort events
        const sortedEvents = [...events].sort((a, b) => {
            const aStart = dayjs(a.startDate).startOf('day');
            const bStart = dayjs(b.startDate).startOf('day');
            const dateDiff = aStart.diff(bStart);
            if (dateDiff !== 0) return dateDiff;
            if (a.isAllDay && !b.isAllDay) return -1;
            if (!a.isAllDay && b.isAllDay) return 1;
            return dayjs(a.startDate).diff(b.startDate);
        });

        calendarWeeks.forEach((week, weekIndex) => {
            const firstDay = week[0];
            const lastDay = week[6];
            if (!firstDay || !lastDay) return;

            result[weekIndex] = {};
            const occupiedSlots: { [key: string]: boolean } = {};

            // Filter events for this week
            const weekEvents = sortedEvents.filter((event) => {
                const start = dayjs(event.startDate);
                const end = dayjs(event.endDate);
                return !end.isBefore(firstDay, 'day') && !start.isAfter(lastDay, 'day');
            });

            weekEvents.forEach((event) => {
                const start = dayjs(event.startDate);
                const end = dayjs(event.endDate);

                let startDayIndex = -1;
                let endDayIndex = -1;

                // Find event boundaries
                for (let i = 0; i < week.length; i++) {
                    const day = week[i];
                    if (startDayIndex === -1 && !day.isBefore(start, 'day')) {
                        startDayIndex = i;
                    }
                    if (day.isSame(end, 'day') || day.isAfter(end, 'day')) {
                        endDayIndex = i;
                        break;
                    }
                }

                if (endDayIndex === -1) endDayIndex = 6;
                if (startDayIndex === -1) return;

                // Find available slot
                let slot = 0;
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    let isSlotFree = true;
                    for (let i = startDayIndex; i <= endDayIndex; i++) {
                        if (occupiedSlots[`${i}-${slot}`]) {
                            isSlotFree = false;
                            break;
                        }
                    }
                    if (isSlotFree) break;
                    slot++;
                }

                // Mark slots as occupied
                for (let i = startDayIndex; i <= endDayIndex; i++) {
                    occupiedSlots[`${i}-${slot}`] = true;
                }

                const eventInfo: CalendarEvent = {
                    ...event,
                    weekSpan: endDayIndex - startDayIndex + 1,
                    isStartOfEvent: start.isSame(week[startDayIndex], 'day') || start.isBefore(week[startDayIndex], 'day'),
                    isEndOfEvent: end.isSame(week[endDayIndex], 'day') || end.isAfter(week[endDayIndex], 'day'),
                    startDayIndex,
                    endDayIndex,
                    slot
                };

                if (!result[weekIndex][startDayIndex]) {
                    result[weekIndex][startDayIndex] = [];
                }
                result[weekIndex][startDayIndex].push(eventInfo);
            });
        });

        return result;
    }, [calendarWeeks, events]);

    // Render day
    const renderDay = useCallback(
        (dateObj: dayjs.Dayjs, weekIndex: number, dayIndex: number) => {
            const dateString = dateObj.format('YYYY-MM-DD');
            const isToday = dateString === today;
            const isCurrentMonth = dateObj.month() === month;

            return (
                <TouchableOpacity
                    key={`day-${weekIndex}-${dayIndex}`}
                    style={[styles.dayCell, isToday && TODAY_STYLE, !isCurrentMonth && OUTSIDE_MONTH_STYLE]}
                    onPress={() => onSelectDate(dateString)}
                >
                    <Text style={[styles.dateText, !isCurrentMonth && styles.outsideMonthText, isToday && styles.todayText]}>{dateObj.date()}</Text>
                </TouchableOpacity>
            );
        },
        [today, month, onSelectDate]
    );

    // Render events
    const renderEvents = useCallback(
        (weekIndex: number) => {
            if (!processedEvents[weekIndex]) return null;

            return Object.entries(processedEvents[weekIndex]).flatMap(([dayIndexStr, dayEvents]) => {
                const dayIndex = parseInt(dayIndexStr);
                const events = dayEvents as CalendarEvent[];

                return events.map((event, eventIndex) => {
                    const leftPosition = (dayIndex / 7) * 100;
                    const width = (event.weekSpan / 7) * 100;

                    return (
                        <View
                            key={`event-${weekIndex}-${dayIndex}-${eventIndex}`}
                            style={[
                                styles.multiDayEvent,
                                {
                                    left: `${leftPosition}%`,
                                    width: `${width}%`,
                                    backgroundColor: event.color || '#e74c3c',
                                    top: 26 + event.slot * 18,
                                    borderBottomLeftRadius: event.isStartOfEvent ? 4 : 0,
                                    borderTopRightRadius: event.isEndOfEvent ? 4 : 0,
                                    borderBottomRightRadius: event.isEndOfEvent ? 4 : 0
                                }
                            ]}
                        >
                            <Text
                                style={styles.eventLabelText}
                                numberOfLines={1}
                            >
                                {event.title}
                            </Text>
                        </View>
                    );
                });
            });
        },
        [processedEvents]
    );

    return (
        <View style={styles.container}>
            <View style={styles.weekRow}>
                {DAYS_OF_WEEK.map((day) => (
                    <Text
                        key={day}
                        style={styles.weekDay}
                    >
                        {day}
                    </Text>
                ))}
            </View>
            <View style={styles.calendarContainer}>
                {calendarWeeks.map((week, weekIndex) => (
                    <View
                        key={`week-${weekIndex}`}
                        style={styles.weekContainer}
                    >
                        {week.map((dateObj, dayIndex) => renderDay(dateObj, weekIndex, dayIndex))}
                        <View style={[styles.eventsOverlay, { pointerEvents: 'none' }]}>{renderEvents(weekIndex)}</View>
                    </View>
                ))}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        width: '100%'
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 5,
        height: WEEKDAY_HEADER_HEIGHT,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    weekDay: {
        width: DAY_CELL_WIDTH,
        textAlign: 'center',
        color: '#333',
        fontSize: 12,
        fontFamily: 'Kanit-Regular'
    },
    calendarContainer: {
        flexDirection: 'column'
    },
    weekContainer: {
        flexDirection: 'row',
        width: '100%',
        height: DAY_CELL_HEIGHT,
        position: 'relative'
    },
    dayCell: {
        width: DAY_CELL_WIDTH,
        height: DAY_CELL_HEIGHT,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    dateText: {
        fontSize: 11,
        color: '#333',
        fontFamily: 'Kanit-Regular'
    },
    todayText: {
        top: -0.5,
        color: '#fff',
        backgroundColor: '#e74c3c',
        width: 18,
        height: 18,
        borderRadius: 12,
        lineHeight: 18,
        textAlign: 'center',
        overflow: 'hidden',
        fontFamily: 'Kanit-Bold'
    },
    outsideMonthText: {
        color: '#ccc'
    },
    eventsOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    },
    multiDayEvent: {
        position: 'absolute',
        height: 16,
        justifyContent: 'center'
    },
    eventLabelText: {
        color: 'white',
        fontSize: 10,
        textAlign: 'center',
        fontFamily: 'Kanit-Bold'
    }
});

export default CalendarBody;
