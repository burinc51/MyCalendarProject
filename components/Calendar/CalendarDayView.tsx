/**
 * CalendarDayView
 * 24-hour vertical timeline for a single day
 */
import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import type { CalendarEvent } from '@/types/event';

const HOUR_HEIGHT = 64;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface Props {
    date: string; // YYYY-MM-DD
    events: CalendarEvent[];
    isDark?: boolean;
}

const CalendarDayView: React.FC<Props> = ({ date, events, isDark = false }) => {
    const scrollRef = useRef<ScrollView>(null);
    const now = dayjs();
    const currentDate = dayjs(date);
    const isToday = currentDate.format('YYYY-MM-DD') === now.format('YYYY-MM-DD');

    const colors = useMemo(() => ({
        bg: isDark ? '#171717' : '#f8f9fa',
        line: isDark ? '#2a2a2a' : '#e8e8e8',
        timeText: isDark ? '#555' : '#bbb',
        allDayBg: isDark ? '#262626' : '#fff',
        allDayBorder: isDark ? '#333' : '#e8e8e8',
        allDayLabel: isDark ? '#666' : '#bbb',
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

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            {allDayEvents.length > 0 && (
                <View style={[styles.allDayBar, {
                    backgroundColor: colors.allDayBg,
                    borderBottomColor: colors.allDayBorder
                }]}>
                    <Text style={[styles.allDayLabel, { color: colors.allDayLabel }]}>ทั้งวัน</Text>
                    <View style={styles.allDayChips}>
                        {allDayEvents.map(e => (
                            <View key={e.id} style={[styles.chip, { backgroundColor: e.color || '#2ecc71' }]}>
                                <Text style={styles.chipText} numberOfLines={1}>{e.title}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

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
                        <View key={event.id} style={[styles.eventBlock, {
                            top, height,
                            backgroundColor: event.color || '#2ecc71',
                            left: 64, right: 8
                        }]}>
                            <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                            <Text style={styles.eventTime}>{startLabel}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    allDayBar: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1
    },
    allDayLabel: { fontSize: 11, fontFamily: 'Kanit-Regular', width: 48 },
    allDayChips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    chip: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    chipText: { color: '#fff', fontSize: 11, fontFamily: 'Kanit-Regular' },
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
