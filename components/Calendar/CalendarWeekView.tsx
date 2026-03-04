/**
 * CalendarWeekView
 * 7-column × 24-hour scrollable grid
 */
import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import dayjs from 'dayjs';
import type { CalendarEvent } from '@/types/event';
import { miniDays } from '@/utils/month-names';

const HOUR_HEIGHT = 54;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface Props {
    focusDate: string;  // any date in target week (YYYY-MM-DD)
    events: CalendarEvent[];
    isDark?: boolean;
    onSelectDate?: (date: string) => void;
}

const CalendarWeekView: React.FC<Props> = ({ focusDate, events, isDark = false, onSelectDate }) => {
    const scrollRef = useRef<ScrollView>(null);
    const now = dayjs();
    const focus = dayjs(focusDate);
    const weekStart = focus.startOf('week');
    const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));
    const todayStr = now.format('YYYY-MM-DD');

    const colors = useMemo(() => ({
        bg: isDark ? '#171717' : '#f8f9fa',
        headerBg: isDark ? '#262626' : '#fff',
        line: isDark ? '#2a2a2a' : '#e8e8e8',
        timeText: isDark ? '#555' : '#bbb',
        dayName: isDark ? '#888' : '#999',
        dayNum: isDark ? '#e5e5e5' : '#333',
        colBorder: isDark ? '#252525' : '#f0f0f0',
        todayHighlight: isDark ? '#1f1a1a' : '#fff9f9'
    }), [isDark]);

    useEffect(() => {
        const scrollTo = Math.max(0, now.hour() - 1) * HOUR_HEIGHT;
        setTimeout(() => {
            scrollRef.current?.scrollTo({ y: scrollTo, animated: false });
        }, 100);
    }, [focusDate]);

    // Separate all-day vs timed events per day
    const { allDayByDay, timedByDay } = useMemo(() => {
        const allDay: { [d: string]: CalendarEvent[] } = {};
        const timed: { [d: string]: { event: CalendarEvent; top: number; height: number }[] } = {};
        weekDays.forEach(d => {
            const ds = d.format('YYYY-MM-DD');
            allDay[ds] = [];
            timed[ds] = [];
        });

        events.forEach(event => {
            const s = dayjs(event.startDate);
            const e = dayjs(event.endDate);
            weekDays.forEach(d => {
                const ds = d.format('YYYY-MM-DD');
                if (!d.isBefore(s, 'day') && !d.isAfter(e, 'day')) {
                    if (event.isAllDay) {
                        allDay[ds].push(event);
                    } else {
                        const sm = d.isSame(s, 'day') ? s.hour() * 60 + s.minute() : 0;
                        const em = d.isSame(e, 'day') ? e.hour() * 60 + e.minute() : 24 * 60;
                        const dur = Math.max(em - sm, 30);
                        timed[ds].push({
                            event,
                            top: (sm / 60) * HOUR_HEIGHT,
                            height: Math.max((dur / 60) * HOUR_HEIGHT, HOUR_HEIGHT * 0.4)
                        });
                    }
                }
            });
        });
        return { allDayByDay: allDay, timedByDay: timed };
    }, [events, focusDate]);

    // Whether any day in the week has all-day events
    const hasAllDayEvents = useMemo(
        () => weekDays.some(d => (allDayByDay[d.format('YYYY-MM-DD')] ?? []).length > 0),
        [allDayByDay]
    );

    const nowY = (now.hour() * 60 + now.minute()) / 60 * HOUR_HEIGHT;

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Fixed day header */}
            <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.line }]}>
                <View style={styles.gutter} />
                {weekDays.map((d, i) => {
                    const isToday = d.format('YYYY-MM-DD') === todayStr;
                    return (
                        <TouchableOpacity
                            key={i} style={styles.dayHead}
                            onPress={() => onSelectDate?.(d.format('YYYY-MM-DD'))}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.dayName, { color: colors.dayName }]}>
                                {miniDays.en[d.day()]}
                            </Text>
                            <View style={[styles.dayNumWrap, isToday && styles.todayCircle]}>
                                <Text style={[styles.dayNum, { color: isToday ? '#fff' : colors.dayNum }]}>
                                    {d.date()}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* All-day events strip */}
            {hasAllDayEvents && (
                <View style={[styles.allDayRow, { backgroundColor: colors.headerBg, borderBottomColor: colors.line }]}>
                    <View style={styles.gutter}>
                        <Text style={[styles.allDayLabel, { color: colors.timeText }]}>ทั้งวัน</Text>
                    </View>
                    {weekDays.map((d, i) => {
                        const ds = d.format('YYYY-MM-DD');
                        const dayAllDayEvents = allDayByDay[ds] ?? [];
                        return (
                            <View key={i} style={styles.allDayCol}>
                                {dayAllDayEvents.map(event => (
                                    <View
                                        key={event.id}
                                        style={[styles.allDayChip, { backgroundColor: event.color || '#2ecc71' }]}
                                    >
                                        <Text style={styles.allDayChipText} numberOfLines={1}>
                                            {event.title}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Scrollable time grid */}
            <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                    {/* Time gutter */}
                    <View style={styles.gutter}>
                        {HOURS.map(h => (
                            <View key={h} style={[styles.hourCell, { height: HOUR_HEIGHT, borderTopColor: colors.line }]}>
                                <Text style={[styles.hourText, { color: colors.timeText }]}>
                                    {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* 7 day columns */}
                    {weekDays.map((d, di) => {
                        const ds = d.format('YYYY-MM-DD');
                        const isToday = ds === todayStr;
                        const dayEvts = timedByDay[ds] || [];
                        return (
                            <View key={di} style={[styles.dayCol, {
                                borderLeftColor: colors.colBorder,
                                backgroundColor: isToday ? colors.todayHighlight : 'transparent'
                            }]}>
                                {HOURS.map(h => (
                                    <View key={h} style={[styles.hourCell, { height: HOUR_HEIGHT, borderTopColor: colors.line }]} />
                                ))}
                                {dayEvts.map(({ event, top, height }) => (
                                    <View key={event.id} style={[styles.eventBlock, {
                                        top, height,
                                        backgroundColor: event.color || '#2ecc71'
                                    }]}>
                                        <Text style={styles.eventText} numberOfLines={2}>{event.title}</Text>
                                    </View>
                                ))}
                                {isToday && (
                                    <View style={[styles.nowLine, { top: nowY, borderColor: '#e74c3c' }]}>
                                        <View style={[styles.nowDot, { backgroundColor: '#e74c3c' }]} />
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 8 },
    gutter: { width: 44 },
    dayHead: { flex: 1, alignItems: 'center' },
    dayName: { fontSize: 10, fontFamily: 'Kanit-Regular' },
    dayNumWrap: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
    todayCircle: { backgroundColor: '#e74c3c' },
    dayNum: { fontSize: 13, fontFamily: 'Kanit-Bold' },
    // All-day strip
    allDayRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        paddingVertical: 4,
        minHeight: 28
    },
    allDayLabel: {
        fontSize: 9, fontFamily: 'Kanit-Regular',
        textAlign: 'center', marginTop: 4
    },
    allDayCol: { flex: 1, paddingHorizontal: 1, gap: 2 },
    allDayChip: {
        borderRadius: 3, paddingHorizontal: 3, paddingVertical: 2, marginBottom: 1
    },
    allDayChipText: { color: '#fff', fontSize: 8, fontFamily: 'Kanit-Bold' },
    // Grid
    grid: { flexDirection: 'row', paddingBottom: 20 },
    hourCell: { borderTopWidth: 1, justifyContent: 'flex-start' },
    hourText: { fontSize: 9, fontFamily: 'Kanit-Regular', textAlign: 'center', marginTop: -6 },
    dayCol: { flex: 1, position: 'relative', borderLeftWidth: 1 },
    eventBlock: { position: 'absolute', left: 1, right: 1, borderRadius: 4, padding: 2, overflow: 'hidden' },
    eventText: { fontSize: 9, fontFamily: 'Kanit-Bold', color: '#fff' },
    nowLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1.5 },
    nowDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', left: -3, top: -3 }
});

export default CalendarWeekView;
