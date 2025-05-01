import React, { useEffect, useMemo, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import getDateFromIndex from '@/utils/getDateFromIndex';

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const { width, height } = Dimensions.get('window');

// Calculate dimensions based on provided specs
const HEADER_HEIGHT = 63.5; // header height as specified
const NAVBAR_HEIGHT = 48.6; // navbar height as specified
const WEEKDAY_HEADER_HEIGHT = 30; // height for days of week row

// Available height for calendar cells
const AVAILABLE_HEIGHT = height - HEADER_HEIGHT - NAVBAR_HEIGHT - WEEKDAY_HEADER_HEIGHT;

// Always show 6 weeks (fixed number of rows)
const WEEKS_TO_DISPLAY = 6;
const DAY_CELL_HEIGHT = AVAILABLE_HEIGHT / WEEKS_TO_DISPLAY;
const DAY_CELL_WIDTH = width / 7;

interface EventWithPosition extends CalendarEvent {
    weekSpan: number;
    isStartOfEvent: boolean;
    isEndOfEvent: boolean;
    startDayIndex: number;
    endDayIndex: number;
    slot: number;
}

interface Props {
    index: number;
    onSelectDate: (date: string) => void;
    events: CalendarEvent[];
    setMonth?: (monthName: string) => void;
}

// Constants for styles to reduce object creation
const TODAY_STYLE = { backgroundColor: '#f7e6e6' };
const OUTSIDE_MONTH_STYLE = { backgroundColor: '#f9f9f9' };
const SELECTED_DATE_STYLE = { backgroundColor: '#eeeaea' };

const CalendarBody = React.memo(({ index, onSelectDate, events, setMonth }: Props) => {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const { year, month } = getDateFromIndex(index);
    const today = useMemo(() => dayjs().format('YYYY-MM-DD'), []); // Calculate once

    // Calculate days in month - use useMemo to calculate only when year or month changes
    const getDaysInMonth = useCallback((y: number, m: number) => {
        return dayjs(`${y}-${m + 1}-01`).daysInMonth();
    }, []);

    // Generate calendar - use useMemo to calculate only when year or month changes
    const generateCalendar = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, month);
        const startDay = dayjs(`${year}-${month + 1}-01`).day(); // Sunday = 0
        const calendar: dayjs.Dayjs[] = [];

        // Add days from previous month
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

        for (let i = 0; i < startDay; i++) {
            const day = daysInPrevMonth - startDay + i + 1;
            calendar.push(dayjs(`${prevYear}-${prevMonth + 1}-${day}`));
        }

        // Days in current month
        for (let i = 1; i <= daysInMonth; i++) {
            calendar.push(dayjs(`${year}-${month + 1}-${i}`));
        }

        // Days in next month - now we ensure we fill to exactly 6 weeks (42 days)
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        let nextMonthDay = 1;

        while (calendar.length < 42) {
            // Always force 6 weeks (6 * 7 = 42 days)
            calendar.push(dayjs(`${nextYear}-${nextMonth + 1}-${nextMonthDay}`));
            nextMonthDay++;
        }

        return calendar;
    }, [year, month, getDaysInMonth]);

    // Create calendar weeks (array of arrays)
    const calendarWeeks = useMemo(() => {
        const weeks = [];
        for (let i = 0; i < generateCalendar.length; i += 7) {
            weeks.push(generateCalendar.slice(i, i + 7));
        }
        return weeks;
    }, [generateCalendar]);

    // Process multi-day events by week
    const processedEvents = useMemo(() => {
        const result = {};

        // Sort events by start date first, then prioritize all-day events for same date
        const sortedEvents = [...events].sort((a, b) => {
            const aStartDate = dayjs(a.startDate);
            const bStartDate = dayjs(b.startDate);

            // First compare by date only (without time)
            const dateDiff = aStartDate.startOf('day').diff(bStartDate.startOf('day'));
            if (dateDiff !== 0) {
                return dateDiff;
            }

            // Same date, prioritize all-day events
            if (a.isAllDay && !b.isAllDay) return -1;
            if (!a.isAllDay && b.isAllDay) return 1;

            // Both are all-day or both are timed events, sort by exact time
            return aStartDate.diff(bStartDate);
        });

        calendarWeeks.forEach((week, weekIndex) => {
            const firstDayOfWeek = week[0];
            const lastDayOfWeek = week[6];

            if (!firstDayOfWeek || !lastDayOfWeek) {
                return;
            }

            result[weekIndex] = {};
            const occupiedSlots = {};

            // Filter events only for this week first
            const weekEvents = sortedEvents.filter((event) => {
                const startDate = dayjs(event.startDate);
                const endDate = dayjs(event.endDate);
                return !(endDate.isBefore(firstDayOfWeek) || startDate.isAfter(lastDayOfWeek));
            });

            // Process rest of the events as before
            weekEvents.forEach((event) => {
                const startDate = dayjs(event.startDate);
                const endDate = dayjs(event.endDate);

                // Find first and last day of event in this week
                let startDayIndex = -1;
                let endDayIndex = -1;

                for (let i = 0; i < week.length; i++) {
                    const day = week[i];

                    if (startDayIndex === -1 && !day.isBefore(startDate, 'day')) {
                        startDayIndex = i;
                    }

                    if (day.isSame(endDate, 'day') || day.isAfter(endDate, 'day')) {
                        endDayIndex = i;
                        break;
                    }
                }

                // If end day is outside this week
                if (endDayIndex === -1) {
                    endDayIndex = 6;
                }

                if (startDayIndex !== -1) {
                    // Find first available slot
                    let slot = 0;
                    while (true) {
                        let slotAvailable = true;

                        for (let i = startDayIndex; i <= endDayIndex; i++) {
                            if (occupiedSlots[`${i}-${slot}`]) {
                                slotAvailable = false;
                                break;
                            }
                        }

                        if (slotAvailable) {
                            break;
                        }
                        slot++;
                    }

                    // Mark occupied slots
                    for (let i = startDayIndex; i <= endDayIndex; i++) {
                        occupiedSlots[`${i}-${slot}`] = true;
                    }

                    const eventInfo: EventWithPosition = {
                        ...event,
                        weekSpan: endDayIndex - startDayIndex + 1,
                        isStartOfEvent: startDate.isSame(week[startDayIndex], 'day') || startDate.isBefore(week[startDayIndex], 'day'),
                        isEndOfEvent: endDate.isSame(week[endDayIndex], 'day') || endDate.isAfter(week[endDayIndex], 'day'),
                        startDayIndex,
                        endDayIndex,
                        slot
                    };

                    if (!result[weekIndex][startDayIndex]) {
                        result[weekIndex][startDayIndex] = [];
                    }
                    result[weekIndex][startDayIndex].push(eventInfo);
                }
            });
        });

        return result;
    }, [calendarWeeks, events]);

    // Handler for day click - use useCallback to prevent creating new function every render
    const handleDatePress = useCallback(
        (dateString: string) => {
            if (dateString) {
                setSelectedDate(dateString);
                onSelectDate(dateString);
            }
        },
        [onSelectDate]
    );

    // Render day and events
    const renderDay = useCallback(
        (dateObj: dayjs.Dayjs, weekIndex: number, dayIndex: number) => {
            const dateString = dateObj.format('YYYY-MM-DD');
            const isToday = dateString === today;
            const isCurrentMonth = dateObj.month() === month;

            return (
                <TouchableOpacity
                    key={`day-${weekIndex}-${dayIndex}`}
                    style={[styles.dayCell, isToday && TODAY_STYLE, !isCurrentMonth && OUTSIDE_MONTH_STYLE, selectedDate === dateString && SELECTED_DATE_STYLE]}
                    onPress={() => handleDatePress(dateString)}
                >
                    <Text style={[styles.dateText, !isCurrentMonth && styles.outsideMonthText, isToday && styles.todayText]}>{dateObj.date()}</Text>
                </TouchableOpacity>
            );
        },
        [today, month, selectedDate, handleDatePress]
    );

    // Render events in a week
    const renderEvents = useCallback(
        (weekIndex: number) => {
            if (!processedEvents[weekIndex]) {
                return null;
            }

            return Object.entries(processedEvents[weekIndex]).map(([dayIndexStr, dayEvents]) => {
                const dayIndex = parseInt(dayIndexStr);
                const events = dayEvents as EventWithPosition[];
                console.log('events', events);
                return events.map((event, eventIndex) => {
                    // Calculate position and width for event bar
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
                                    borderTopLeftRadius: event.isStartOfEvent ? 4 : 0,
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
            {/* Calendar header - days of week */}
            <View style={styles.weekRow}>
                {daysOfWeek.map((day) => (
                    <Text
                        key={day}
                        style={styles.weekDay}
                    >
                        {day}
                    </Text>
                ))}
            </View>

            {/* Calendar body */}
            <View style={styles.calendarContainer}>
                {calendarWeeks.map((week, weekIndex) => (
                    <View
                        key={`week-${weekIndex}`}
                        style={styles.weekContainer}
                    >
                        {/* Days in week */}
                        {week.map((dateObj, dayIndex) => renderDay(dateObj, weekIndex, dayIndex))}

                        {/* Multi-day events */}
                        <View style={styles.eventsOverlay}>{renderEvents(weekIndex)}</View>
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
        fontSize: 12
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
        color: '#333'
    },
    todayText: {
        color: '#fff',
        backgroundColor: '#e74c3c',
        width: 18,
        height: 18,
        borderRadius: 12,
        lineHeight: 18,
        textAlign: 'center',
        overflow: 'hidden',
        fontWeight: 'bold'
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
        fontWeight: 'bold'
    }
});

export default CalendarBody;
