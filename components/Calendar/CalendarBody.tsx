import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

dayjs.extend(isBetween);
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const { width } = Dimensions.get('window');

const CalendarBody = React.memo(
    ({
        year,
        month,
        onSelectDate,
        events
    }: {
        year: number;
        month: number;
        onSelectDate: (date: string) => void;
        events: {
            startDate: string;
            endDate: string;
            title: string;
            color: string;
            startTime?: string;
            endTime?: string;
        }[];
    }) => {
        const getDaysInMonth = (y: number, m: number) => dayjs(`${y}-${m + 1}-01`).daysInMonth();

        const generateCalendar = useMemo(() => {
            const daysInMonth = getDaysInMonth(year, month);
            const startDay = dayjs(`${year}-${month + 1}-01`).day(); // Sunday = 0
            const calendar: (dayjs.Dayjs | null)[] = [];

            // Add days from previous month
            const prevMonth = month === 0 ? 11 : month - 1;
            const prevYear = month === 0 ? year - 1 : year;
            const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

            for (let i = 0; i < startDay; i++) {
                const day = daysInPrevMonth - startDay + i + 1;
                calendar.push(dayjs(`${prevYear}-${prevMonth + 1}-${day}`));
            }

            // Current month days
            for (let i = 1; i <= daysInMonth; i++) {
                calendar.push(dayjs(`${year}-${month + 1}-${i}`));
            }

            // Next month days
            const nextMonth = month === 11 ? 0 : month + 1;
            const nextYear = month === 11 ? year + 1 : year;
            let nextMonthDay = 1;

            while (calendar.length % 7 !== 0) {
                calendar.push(dayjs(`${nextYear}-${nextMonth + 1}-${nextMonthDay}`));
                nextMonthDay++;
            }

            return calendar;
        }, [year, month]);

        const today = dayjs().format('YYYY-MM-DD');

        // Create calendar weeks (array of arrays)
        const calendarWeeks = useMemo(() => {
            const weeks = [];
            let week = [];

            generateCalendar.forEach((day, index) => {
                week.push(day);
                if ((index + 1) % 7 === 0) {
                    weeks.push(week);
                    week = [];
                }
            });
            return weeks;
        }, [generateCalendar]);

        const monthName = dayjs(`${year}-${month + 1}-01`).format('MMMM YYYY');

        // Process multi-day events by week
        // In CalendarBody.tsx - update the processedEvents function
        const processedEvents = useMemo(() => {
            const result = {};

            calendarWeeks.forEach((week, weekIndex) => {
                result[weekIndex] = {};

                // Track occupied slots for this week
                const occupiedSlots = {};

                // Process events and sort by start date (earlier events first)
                const weekEvents = [...events].sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)));

                weekEvents.forEach((event) => {
                    const startDate = dayjs(event.startDate);
                    const endDate = dayjs(event.endDate);

                    // Check if event is in this week
                    const firstDayOfWeek = week[0];
                    const lastDayOfWeek = week[6];

                    if (!firstDayOfWeek || !lastDayOfWeek) {
                        return;
                    }

                    if (endDate.isBefore(firstDayOfWeek) || startDate.isAfter(lastDayOfWeek)) {
                        return; // Event not in this week
                    }

                    // Find which days of the week this event spans
                    let startDayIndex = -1;
                    let endDayIndex = -1;

                    for (let i = 0; i < week.length; i++) {
                        const day = week[i];
                        if (!day) {
                            continue;
                        }

                        if (startDayIndex === -1 && !day.isBefore(startDate, 'day')) {
                            startDayIndex = i;
                        }
                        if (endDayIndex === -1 && day.isSame(endDate, 'day')) {
                            endDayIndex = i;
                            break;
                        }
                    }

                    // If end date is beyond this week
                    if (endDayIndex === -1) {
                        endDayIndex = 6;
                    }

                    if (startDayIndex !== -1) {
                        // Find the first available slot
                        let slot = 0;
                        while (true) {
                            let slotAvailable = true;

                            // Check if this slot is available for all days this event spans
                            for (let i = startDayIndex; i <= endDayIndex; i++) {
                                const key = `${i}-${slot}`;
                                if (occupiedSlots[key]) {
                                    slotAvailable = false;
                                    break;
                                }
                            }

                            if (slotAvailable) {
                                break;
                            }
                            slot++;
                        }

                        // Mark slots as occupied
                        for (let i = startDayIndex; i <= endDayIndex; i++) {
                            occupiedSlots[`${i}-${slot}`] = true;
                        }

                        const eventInfo = {
                            ...event,
                            weekSpan: endDayIndex - startDayIndex + 1,
                            isStartOfEvent: startDate.isSame(week[startDayIndex], 'day'),
                            isEndOfEvent: endDate.isSame(week[endDayIndex], 'day'),
                            startDayIndex,
                            endDayIndex,
                            slot // Add slot information
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

        return (
            <View style={styles.container}>
                {/* Calendar Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.headerLeft}>
                        <View style={styles.redDot} />
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerMonthText}>{monthName}</Text>
                            <Text style={styles.headerSubText}>ผ่านมา</Text>
                        </View>
                    </View>
                </View>

                {/* Days of week header */}
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
                            {/* Days */}
                            {week.map((dateObj, dayIndex) => {
                                const dateString = dateObj ? dateObj.format('YYYY-MM-DD') : '';
                                const isToday = dateString === today;
                                const isCurrentMonth = dateObj ? dateObj.month() === month : false;

                                return (
                                    <TouchableOpacity
                                        key={`day-${weekIndex}-${dayIndex}`}
                                        style={[styles.dayCell, isToday && styles.todayCell, !isCurrentMonth && styles.outsideMonthCell]}
                                        onPress={() => dateString && onSelectDate(dateString)}
                                    >
                                        <Text style={[styles.dateText, !isCurrentMonth && styles.outsideMonthText, isToday && styles.todayText]}>{dateObj?.date()}</Text>
                                    </TouchableOpacity>
                                );
                            })}

                            {/* Overlay for multi-day events */}
                            <View style={styles.eventsOverlay}>
                                {processedEvents[weekIndex] &&
                                    Object.entries(processedEvents[weekIndex]).map(([dayIndexStr, dayEvents]) => {
                                        const dayIndex = parseInt(dayIndexStr);
                                        const events = dayEvents as any[];

                                        return events.map((event, eventIndex) => {
                                            // Calculate position and width for the event bar
                                            const leftPosition = (dayIndex / 7) * 100;
                                            const width = (event.weekSpan / 7) * 100;
                                            const eventHeight = 20;

                                            // Format time display if available
                                            let displayTitle = event.title;
                                            if (event.startTime) {
                                                displayTitle = `${event.startTime}${event.endTime ? '-' + event.endTime : ''} ${event.title}`;
                                            }

                                            return (
                                                <View
                                                    key={`event-${weekIndex}-${dayIndex}-${eventIndex}`}
                                                    style={[
                                                        styles.multiDayEvent,
                                                        {
                                                            left: `${leftPosition}%`,
                                                            width: `${width}%`,
                                                            backgroundColor: event.color || '#e74c3c',
                                                            top: 35 + event.slot * 24,
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
                                    })}
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    }
);

export default CalendarBody;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        width: '100%',
        height: '100%'
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    redDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'red',
        marginRight: 8
    },
    headerTextContainer: {
        flexDirection: 'column'
    },
    headerMonthText: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    headerSubText: {
        fontSize: 12,
        color: '#666'
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    iconButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8
    },
    iconText: {
        fontSize: 18,
        color: '#333'
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    weekDay: {
        width: width / 7,
        textAlign: 'center',
        color: '#333',
        fontSize: 14
    },
    calendarContainer: {
        flex: 1,
        flexDirection: 'column'
    },
    weekContainer: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
        position: 'relative'
    },
    dayCell: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    todayCell: {
        backgroundColor: '#f7e6e6'
    },
    outsideMonthCell: {
        backgroundColor: '#f9f9f9'
    },
    dateText: {
        fontSize: 14,
        color: '#333'
    },
    todayText: {
        color: '#fff',
        backgroundColor: '#e74c3c',
        width: 24,
        height: 24,
        borderRadius: 12,
        textAlign: 'center',
        lineHeight: 24,
        overflow: 'hidden'
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
        height: 20,
        paddingHorizontal: 4,
        justifyContent: 'center'
    },
    eventLabelText: {
        color: 'white',
        fontSize: 10,
        textAlign: 'center'
    }
});
