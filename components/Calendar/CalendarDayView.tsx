/**
 * CalendarDayView
 * 24-hour vertical timeline for a single day
 */
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import type { CalendarEvent } from '@/types/event';
import { miniDays } from '@/utils/month-names';

const HOUR_HEIGHT = 64;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface Props {
    date: string; // YYYY-MM-DD
    events: CalendarEvent[];
    isDark?: boolean;
}

const CalendarDayView: React.FC<Props> = ({ date, events, isDark = false }) => {
    const scrollRef = useRef<ScrollView>(null);
    const router = useRouter();
    const now = dayjs();
    const currentDate = dayjs(date);
    const isToday = currentDate.format('YYYY-MM-DD') === now.format('YYYY-MM-DD');

    const colors = useMemo(() => ({
        bg: isDark ? '#171717' : '#f8f9fa',
        headerBg: isDark ? '#262626' : '#fff',
        headerBorder: isDark ? '#2a2a2a' : '#e8e8e8',
        dayName: isDark ? '#888' : '#999',
        dayNum: isDark ? '#e5e5e5' : '#333',
        line: isDark ? '#2a2a2a' : '#e8e8e8',
        timeText: isDark ? '#555' : '#bbb',
        allDayBg: isDark ? '#1e1e1e' : '#fff',
        allDayBorder: isDark ? '#2a2a2a' : '#e8e8e8',
        allDayEventBg: isDark ? '#5C6BC0' : '#7986CB',
        overflowText: isDark ? '#aaa' : '#666',
        nowLine: '#e74c3c'
    }), [isDark]);

    useEffect(() => {
        const scrollTo = isToday
            ? Math.max(0, now.hour() - 1) * HOUR_HEIGHT
            : 7 * HOUR_HEIGHT;
        setTimeout(() => {
            scrollRef.current?.scrollTo({ y: scrollTo, animated: false });
        }, 100);
    }, [date]);

    const dayEvents = useMemo(() => events.filter(e => {
        const s = dayjs(e.startDate);
        const en = dayjs(e.endDate);
        return !currentDate.isBefore(s, 'day') && !currentDate.isAfter(en, 'day');
    }), [events, date]);

    const allDayEvents = dayEvents.filter(e => e.isAllDay);
    const timedEvents = dayEvents.filter(e => !e.isAllDay);

    const nowMinutes = isToday ? now.hour() * 60 + now.minute() : -1;
    const nowY = nowMinutes > 0 ? (nowMinutes / 60) * HOUR_HEIGHT : -1;

    const positionedEvents = useMemo(() => timedEvents.map(event => {
        const s = dayjs(event.startDate);
        const en = dayjs(event.endDate);
        const startMin = s.hour() * 60 + s.minute();
        const endMin = Math.min(en.hour() * 60 + en.minute(), 24 * 60);
        const duration = Math.max(endMin - startMin, 30);
        return {
            event,
            top: (startMin / 60) * HOUR_HEIGHT,
            height: Math.max((duration / 60) * HOUR_HEIGHT, HOUR_HEIGHT * 0.5),
            startLabel: s.format('HH:mm')
        };
    }), [timedEvents]);

    // Expand/collapse for all-day events
    const [allDayExpanded, setAllDayExpanded] = useState(false);

    // Show max 2 all-day events when collapsed, all when expanded
    const MAX_VISIBLE_ALL_DAY = 2;
    const visibleAllDay = allDayExpanded
        ? allDayEvents
        : allDayEvents.slice(0, MAX_VISIBLE_ALL_DAY);
    const overflowCount = allDayEvents.length - MAX_VISIBLE_ALL_DAY;
    const hasOverflow = overflowCount > 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* All-day section */}
            <View style={[styles.allDaySection, {
                backgroundColor: colors.headerBg,
                borderBottomColor: colors.allDayBorder
            }]}>
                {/* Left: day name + day number */}
                <View style={styles.allDayLeft}>
                    <Text style={[styles.allDayDayName, { color: colors.dayName }]}>
                        {miniDays.en[currentDate.day()]}
                    </Text>
                    <View style={[styles.allDayDayNumWrap, isToday && styles.todayCircle]}>
                        <Text style={[styles.allDayDayNum, { color: isToday ? '#fff' : colors.dayNum }]}>
                            {currentDate.date()}
                        </Text>
                    </View>
                </View>

                {/* Right: event rows */}
                <View style={styles.allDayRight}>
                    {visibleAllDay.map(e => (
                        <TouchableOpacity
                            key={e.eventId}
                            style={[styles.allDayEventRow, { backgroundColor: e.color || colors.allDayEventBg }]}
                            onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.eventId, event: JSON.stringify(e) } })}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.allDayEventText} numberOfLines={1}>
                                {e.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    {/* Expand / collapse row */}
                    {hasOverflow && (
                        <TouchableOpacity
                            style={styles.overflowRow}
                            onPress={() => setAllDayExpanded(v => !v)}
                            activeOpacity={0.7}
                        >
                            <AntDesign
                                name={allDayExpanded ? 'up' : 'down'}
                                size={12}
                                color={colors.overflowText}
                                style={{ marginRight: 6 }}
                            />
                            {!allDayExpanded && (
                                <Text style={[styles.overflowText, { color: colors.overflowText }]}>
                                    +{overflowCount}
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
                <View style={styles.timeline}>
                    {HOURS.map(h => (
                        <View key={h} style={[styles.hourRow, { height: HOUR_HEIGHT, borderTopColor: colors.line }]}>
                            <Text style={[styles.hourLabel, { color: colors.timeText }]}>
                                {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
                            </Text>
                            <View style={[styles.hourLine, { borderTopColor: colors.line }]} />
                        </View>
                    ))}

                    {/* Now indicator */}
                    {nowY > 0 && (
                        <View style={[styles.nowLine, { top: nowY, borderColor: colors.nowLine }]}>
                            <View style={[styles.nowDot, { backgroundColor: colors.nowLine }]} />
                        </View>
                    )}

                    {/* Events */}
                    {positionedEvents.map(({ event, top, height, startLabel }) => (
                        <TouchableOpacity key={event.eventId} style={[styles.eventBlock, {
                            top, height,
                            backgroundColor: event.color || '#2ecc71',
                            left: 64, right: 8
                        }]} onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.eventId, event: JSON.stringify(event) } })} activeOpacity={0.7}>
                            <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    // Day header (same design as WeekView)
    header: { flexDirection: 'row', borderBottomWidth: 1, },
    gutter: { width: 44 },
    dayHead: { alignItems: 'center', paddingLeft: 4 },
    dayName: { fontSize: 10, fontFamily: 'Kanit-Regular' },
    dayNumWrap: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
    todayCircle: { backgroundColor: '#e74c3c' },
    dayNum: { fontSize: 14, fontFamily: 'Kanit-Bold' },

    // All-day section — Google Calendar style
    allDaySection: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        paddingVertical: 6,
        minHeight: 40
    },
    allDayLeft: {
        width: 44,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 2
    },
    allDayDayName: {
        fontSize: 10,
        fontFamily: 'Kanit-Regular',
        textTransform: 'uppercase'
    },
    allDayDayNumWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2
    },
    allDayDayNum: {
        fontSize: 14,
        fontFamily: 'Kanit-Bold'
    },
    allDayRight: {
        flex: 1,
        paddingRight: 8,
        gap: 3
    },
    allDayEventRow: {
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4
    },
    allDayEventText: {
        color: '#fff',
        fontSize: 13,
        fontFamily: 'Kanit-Regular'
    },
    overflowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4
    },
    overflowText: {
        fontSize: 12,
        fontFamily: 'Kanit-Regular'
    },

    // Timeline
    timeline: { position: 'relative', paddingBottom: 20 },
    hourRow: { flexDirection: 'row', alignItems: 'flex-start', borderTopWidth: 1 },
    hourLabel: { width: 56, paddingLeft: 10, fontSize: 11, fontFamily: 'Kanit-Regular', marginTop: -8 },
    hourLine: { flex: 1, borderTopWidth: 0 },
    nowLine: {
        position: 'absolute', left: 56, right: 0, borderTopWidth: 1.5,
        flexDirection: 'row', alignItems: 'center'
    },
    nowDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', left: -4 },
    eventBlock: {
        position: 'absolute', borderRadius: 8, padding: 6,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2, shadowRadius: 3, elevation: 3
    },
    eventTitle: { color: '#fff', fontSize: 13, fontFamily: 'Kanit-Bold' },
    eventTime: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: 'Kanit-Regular' }
});

export default CalendarDayView;
