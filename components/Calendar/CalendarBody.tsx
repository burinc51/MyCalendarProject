/**
 * CalendarBody Component
 * Responsive calendar grid with dynamic dimensions
 * Supports all device sizes and orientations
 */

import React, { useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle, TextStyle } from 'react-native';
import getDateFromIndex from '@/utils/get-date-from-index';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';
import type { CalendarEvent } from '@/types/event';

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
    index: number;
    onSelectDate: (date: string) => void;
    events: CalendarEvent[];
    isDark?: boolean;
}

const CalendarBody = React.memo(({ index, onSelectDate, events, isDark = false }: Props) => {
    // Theme colors
    const colors = useMemo(() => ({
        background: isDark ? '#171717' : 'white',
        weekRowBg: isDark ? '#262626' : '#fafafa',
        weekDayText: isDark ? '#a3a3a3' : '#666',
        borderColor: isDark ? '#404040' : '#e5e5e5',
        dateText: isDark ? '#e5e5e5' : '#333',
        outsideMonthText: isDark ? '#525252' : '#bbb',
        outsideMonthBg: isDark ? '#1f1f1f' : '#fafafa',
        todayCellBg: isDark ? '#3f1f1f' : '#fff5f5'
    }), [isDark]);
    // Get responsive dimensions
    const {
        width,
        dayCellHeight,
        dayCellWidth,
        weekdayHeaderHeight,
        smallFontSize,
        eventHeight,
        eventFontSize,
        eventTopOffset,
        eventRowHeight,
        todayIndicatorSize,
        isSmallPhone,
        isTablet
    } = useResponsiveDimensions();

    const { year, month } = getDateFromIndex(index);
    const today = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

    // Dynamic styles based on responsive dimensions
    const dynamicStyles = useMemo(() => ({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            width: '100%'
        } as ViewStyle,
        weekRow: {
            height: weekdayHeaderHeight,
            paddingVertical: isSmallPhone ? 3 : 5,
            backgroundColor: colors.weekRowBg,
            borderBottomColor: colors.borderColor
        } as ViewStyle,
        weekDay: {
            flex: 1,
            fontSize: smallFontSize,
            color: colors.weekDayText,
            borderRightColor: colors.borderColor
        } as TextStyle,
        weekContainer: {
            height: dayCellHeight
        } as ViewStyle,
        dayCell: {
            flex: 1,
            height: dayCellHeight,
            paddingTop: isSmallPhone ? 4 : isTablet ? 8 : 6,
            borderBottomColor: colors.borderColor,
            borderRightColor: colors.borderColor
        } as ViewStyle,
        dateText: {
            fontSize: smallFontSize,
            color: colors.dateText
        } as TextStyle,
        todayText: {
            width: todayIndicatorSize,
            height: todayIndicatorSize,
            borderRadius: todayIndicatorSize / 2,
            lineHeight: todayIndicatorSize,
            fontSize: smallFontSize
        } as TextStyle,
        outsideMonthCell: {
            backgroundColor: colors.outsideMonthBg
        } as ViewStyle,
        outsideMonthText: {
            color: colors.outsideMonthText
        } as TextStyle,
        todayCell: {
            backgroundColor: colors.todayCellBg
        } as ViewStyle,
        multiDayEvent: {
            height: eventHeight
        } as ViewStyle,
        eventLabelText: {
            fontSize: eventFontSize,
            paddingHorizontal: isSmallPhone ? 2 : 4
        } as TextStyle
    }), [
        weekdayHeaderHeight,
        dayCellWidth,
        dayCellHeight,
        smallFontSize,
        todayIndicatorSize,
        eventHeight,
        eventFontSize,
        isSmallPhone,
        isTablet,
        colors
    ]);

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

    // Render day with responsive styling
    const renderDay = useCallback(
        (dateObj: dayjs.Dayjs, weekIndex: number, dayIndex: number) => {
            const dateString = dateObj.format('YYYY-MM-DD');
            const isToday = dateString === today;
            const isCurrentMonth = dateObj.month() === month;

            return (
                <TouchableOpacity
                    key={`day-${weekIndex}-${dayIndex}`}
                    style={[
                        styles.dayCell,
                        dynamicStyles.dayCell,
                        isToday && dynamicStyles.todayCell,
                        !isCurrentMonth && dynamicStyles.outsideMonthCell
                    ]}
                    onPress={() => onSelectDate(dateString)}
                    activeOpacity={0.7}
                    accessibilityLabel={dateObj.format('dddd, MMMM D, YYYY')}
                    accessibilityHint="Double tap to select this date"
                    accessibilityRole="button"
                >
                    <Text
                        style={[
                            styles.dateText,
                            dynamicStyles.dateText,
                            !isCurrentMonth && dynamicStyles.outsideMonthText,
                            isToday && [styles.todayText, dynamicStyles.todayText]
                        ]}
                    >
                        {dateObj.date()}
                    </Text>
                </TouchableOpacity>
            );
        },
        [today, month, onSelectDate, dynamicStyles]
    );

    const MAX_VISIBLE_SLOTS = 4;

    // Render events with responsive positioning
    const renderEvents = useCallback(
        (weekIndex: number) => {
            if (!processedEvents[weekIndex]) return null;

            // Collect overflow counts per day column (for events with slot >= MAX_VISIBLE_SLOTS)
            const overflowByDay: { [dayIndex: number]: number } = {};

            const visibleElements = Object.entries(processedEvents[weekIndex]).flatMap(([dayIndexStr, dayEvents]) => {
                const dayIndex = parseInt(dayIndexStr, 10);
                const eventsArr = dayEvents as CalendarEvent[];

                return eventsArr.flatMap((event, eventIndex) => {
                    // Count hidden events — only at their start column to avoid double-counting
                    if (event.slot >= MAX_VISIBLE_SLOTS) {
                        overflowByDay[dayIndex] = (overflowByDay[dayIndex] || 0) + 1;
                        return [];
                    }

                    const leftPosition = (dayIndex / 7) * 100;
                    const eventWidth = (event.weekSpan / 7) * 100;
                    const borderRadius = isSmallPhone ? 3 : 4;

                    return [
                        <View
                            key={`event-${weekIndex}-${dayIndex}-${eventIndex}`}
                            style={[
                                styles.multiDayEvent,
                                dynamicStyles.multiDayEvent,
                                {
                                    left: `${leftPosition}%`,
                                    width: `${eventWidth}%`,
                                    backgroundColor: event.color || '#e74c3c',
                                    top: eventTopOffset + event.slot * eventRowHeight,
                                    borderTopLeftRadius: event.isStartOfEvent ? borderRadius : 0,
                                    borderBottomLeftRadius: event.isStartOfEvent ? borderRadius : 0,
                                    borderTopRightRadius: event.isEndOfEvent ? borderRadius : 0,
                                    borderBottomRightRadius: event.isEndOfEvent ? borderRadius : 0
                                }
                            ]}
                        >
                            <Text
                                style={[styles.eventLabelText, dynamicStyles.eventLabelText]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {event.title}
                            </Text>
                        </View>
                    ];
                });
            });

            // Render overflow indicators for each day that has hidden events
            const overflowElements = Object.entries(overflowByDay).map(([dayIndexStr, count]) => {
                const dayIndex = parseInt(dayIndexStr, 10);
                const leftPosition = (dayIndex / 7) * 100;
                const colWidth = 100 / 7;
                const topPosition = eventTopOffset + MAX_VISIBLE_SLOTS * eventRowHeight;

                return (
                    <View
                        key={`overflow-${weekIndex}-${dayIndex}`}
                        style={[
                            styles.overflowIndicator,
                            {
                                left: `${leftPosition}%`,
                                width: `${colWidth}%`,
                                top: topPosition,
                            }
                        ]}
                    >
                        <Text style={[styles.overflowText, { fontSize: eventFontSize }]}>
                            +{count}
                        </Text>
                    </View>
                );
            });

            return [...visibleElements, ...overflowElements];
        },
        [processedEvents, dynamicStyles, eventTopOffset, eventRowHeight, eventFontSize, isSmallPhone]
    );

    return (
        <View style={dynamicStyles.container}>
            {/* Weekday Header Row */}
            <View style={[styles.weekRow, dynamicStyles.weekRow]}>
                {DAYS_OF_WEEK.map((day) => (
                    <Text
                        key={day}
                        style={[styles.weekDay, dynamicStyles.weekDay]}
                    >
                        {day}
                    </Text>
                ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarContainer}>
                {calendarWeeks.map((week, weekIndex) => (
                    <View
                        key={`week-${weekIndex}`}
                        style={[styles.weekContainer, dynamicStyles.weekContainer]}
                    >
                        {week.map((dateObj, dayIndex) => renderDay(dateObj, weekIndex, dayIndex))}
                        <View style={styles.eventsOverlay}>
                            {renderEvents(weekIndex)}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
});

// Base styles (static)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        width: '100%'
    },
    weekRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
        backgroundColor: '#fafafa'
    },
    weekDay: {
        textAlign: 'center',
        color: '#666',
        fontFamily: 'Kanit-Regular',
        borderRightWidth: 1,
        borderRightColor: '#e5e5e5'
    },
    calendarContainer: {
        flex: 1,
        flexDirection: 'column'
    },
    weekContainer: {
        flexDirection: 'row',
        width: '100%',
        position: 'relative'
    },
    dayCell: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
        borderRightWidth: 1,
        borderRightColor: '#e5e5e5'
    },
    todayCell: {
        backgroundColor: '#fff5f5'
    },
    outsideMonthCell: {
        backgroundColor: '#fafafa'
    },
    dateText: {
        color: '#333',
        fontFamily: 'Kanit-Regular'
    },
    todayText: {
        color: '#fff',
        backgroundColor: '#e74c3c',
        textAlign: 'center',
        overflow: 'hidden',
        fontFamily: 'Kanit-Bold'
    },
    outsideMonthText: {
        color: '#bbb'
    },
    eventsOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none'
    },
    multiDayEvent: {
        position: 'absolute',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2
    },
    eventLabelText: {
        color: 'white',
        textAlign: 'center',
        fontFamily: 'Kanit-Bold'
    },
    overflowIndicator: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    overflowText: {
        color: '#e74c3c',
        fontFamily: 'Kanit-Bold',
        textAlign: 'center',
    }
});

export default CalendarBody;
