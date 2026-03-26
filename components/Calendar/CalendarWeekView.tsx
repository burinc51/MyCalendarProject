/**
 * CalendarWeekView
 * 7-column × 24-hour scrollable grid
 * All-day events span multiple columns as continuous bars.
 */
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, LayoutChangeEvent
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import type { CalendarEvent } from '@/types/event';
import { miniDays } from '@/utils/month-names';

const HOUR_HEIGHT = 54;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const ALL_DAY_ROW_H = 22;   // height of each all-day event row
const ALL_DAY_GAP = 3;      // vertical gap between rows
const MAX_ROWS = 2;          // rows visible before overflow

interface SpanEvent {
    event: CalendarEvent;
    startCol: number; // 0 = Sun … 6 = Sat (clamped to visible week)
    endCol: number;   // inclusive
    row: number;
}

interface Props {
    focusDate: string;
    events: CalendarEvent[];
    isDark?: boolean;
    onSelectDate?: (date: string) => void;
}

const CalendarWeekView: React.FC<Props> = ({
    focusDate, events, isDark = false, onSelectDate
}) => {
    const scrollRef = useRef<ScrollView>(null);
    const router = useRouter();
    const now = dayjs();
    const focus = dayjs(focusDate);
    const weekStart = focus.startOf('week');
    const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));
    const todayStr = now.format('YYYY-MM-DD');

    const [expanded, setExpanded] = useState(false);
    const [gridWidth, setGridWidth] = useState(0);

    // Reset expanded state when the week changes
    useEffect(() => { setExpanded(false); }, [focusDate]);

    const colors = useMemo(() => ({
        bg: isDark ? '#171717' : '#f8f9fa',
        headerBg: isDark ? '#262626' : '#fff',
        line: isDark ? '#2a2a2a' : '#e8e8e8',
        timeText: isDark ? '#555' : '#bbb',
        dayName: isDark ? '#888' : '#999',
        dayNum: isDark ? '#e5e5e5' : '#333',
        colBorder: isDark ? '#252525' : '#f0f0f0',
        todayHighlight: isDark ? '#1f1a1a' : '#fff9f9',
        overflowText: isDark ? '#aaa' : '#666',
    }), [isDark]);

    useEffect(() => {
        const scrollTo = Math.max(0, now.hour() - 1) * HOUR_HEIGHT;
        setTimeout(() => {
            scrollRef.current?.scrollTo({ y: scrollTo, animated: false });
        }, 100);
    }, [focusDate]);

    // ── Compute span events + timed events ──────────────────────────────────
    const { spanEvents, timedByDay, totalRows } = useMemo(() => {
        const timed: { [d: string]: { event: CalendarEvent; top: number; height: number }[] } = {};
        weekDays.forEach(d => { timed[d.format('YYYY-MM-DD')] = []; });

        const allDayRaw: CalendarEvent[] = [];
        const weekEnd = weekStart.add(6, 'day');

        events.forEach(event => {
            const s = dayjs(event.startDate);
            const e = dayjs(event.endDate);

            if (event.isAllDay) {
                if (!weekEnd.isBefore(s, 'day') && !weekStart.isAfter(e, 'day')) {
                    allDayRaw.push(event);
                }
            } else {
                weekDays.forEach(d => {
                    const ds = d.format('YYYY-MM-DD');
                    if (!d.isBefore(s, 'day') && !d.isAfter(e, 'day')) {
                        const sm = d.isSame(s, 'day') ? s.hour() * 60 + s.minute() : 0;
                        const em = d.isSame(e, 'day') ? e.hour() * 60 + e.minute() : 24 * 60;
                        timed[ds].push({
                            event,
                            top: (sm / 60) * HOUR_HEIGHT,
                            height: Math.max((Math.max(em - sm, 30) / 60) * HOUR_HEIGHT, HOUR_HEIGHT * 0.4)
                        });
                    }
                });
            }
        });

        // Sort: start asc, then span length desc (longer bars claim rows first)
        allDayRaw.sort((a, b) => {
            const as = dayjs(a.startDate), bs = dayjs(b.startDate);
            if (as.isBefore(bs, 'day')) return -1;
            if (as.isAfter(bs, 'day')) return 1;
            return dayjs(b.endDate).diff(dayjs(b.startDate), 'day')
                - dayjs(a.endDate).diff(dayjs(a.startDate), 'day');
        });

        // Greedy row assignment — no two events on the same row may overlap columns
        const rowRanges: Array<Array<[number, number]>> = [];
        const spans: SpanEvent[] = [];

        allDayRaw.forEach(event => {
            const s = dayjs(event.startDate);
            const e = dayjs(event.endDate);
            const startCol = Math.max(0, s.diff(weekStart, 'day'));
            const endCol = Math.min(6, e.diff(weekStart, 'day'));
            if (startCol > 6 || endCol < 0) return;

            let row = 0;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const occupied = rowRanges[row] || [];
                const conflict = occupied.some(([sc, ec]) => startCol <= ec && endCol >= sc);
                if (!conflict) break;
                row++;
            }
            if (!rowRanges[row]) rowRanges[row] = [];
            rowRanges[row].push([startCol, endCol]);
            spans.push({ event, startCol, endCol, row });
        });

        const total = spans.length > 0 ? Math.max(...spans.map(sp => sp.row)) + 1 : 0;
        return { spanEvents: spans, timedByDay: timed, totalRows: total };
    }, [events, focusDate]);

    const hasOverflow = totalRows > MAX_ROWS;
    const visibleRows = expanded ? totalRows : Math.min(totalRows, MAX_ROWS);
    const visibleSpans = spanEvents.filter(sp => sp.row < visibleRows);

    const colWidth = gridWidth > 0 ? gridWidth / 7 : 0;

    // Per-column overflow: how many hidden span events cover each column
    const colOverflow = useMemo(() =>
        Array.from({ length: 7 }, (_, col) =>
            spanEvents.filter(sp => sp.row >= MAX_ROWS && sp.startCol <= col && sp.endCol >= col).length
        )
    , [spanEvents]);

    // Section height: rows + optional overflow row
    const OVERFLOW_ROW_H = 20;
    const sectionH = 4 + visibleRows * (ALL_DAY_ROW_H + ALL_DAY_GAP) + (hasOverflow ? OVERFLOW_ROW_H : 4);

    const handleGridLayout = useCallback((e: LayoutChangeEvent) => {
        setGridWidth(e.nativeEvent.layout.width);
    }, []);

    const nowY = (now.hour() * 60 + now.minute()) / 60 * HOUR_HEIGHT;

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>

            {/* ── Fixed day header ── */}
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

            {/* ── All-day span bars ── */}
            {totalRows > 0 && (
                <View style={[
                    styles.allDaySection,
                    { backgroundColor: colors.headerBg, borderBottomColor: colors.line, height: sectionH }
                ]}>
                    {/* Gutter: "All Day" label + chevron at overflow row */}
                    <View style={[styles.gutter, { position: 'relative' }]}>
                        <Text style={[styles.allDayLabel, { color: colors.timeText }]}>All Day</Text>
                        {hasOverflow && (
                            <TouchableOpacity
                                style={[
                                    styles.gutterChevron,
                                    { top: 4 + visibleRows * (ALL_DAY_ROW_H + ALL_DAY_GAP) }
                                ]}
                                onPress={() => setExpanded(v => !v)}
                                activeOpacity={0.7}
                            >
                                <AntDesign
                                    name={expanded ? 'up' : 'down'}
                                    size={12}
                                    color={colors.overflowText}
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Span grid */}
                    <View style={styles.allDayGrid} onLayout={handleGridLayout}>
                        {colWidth > 0 && visibleSpans.map(({ event, startCol, endCol, row }) => (
                            <TouchableOpacity
                                key={event.eventId}
                                style={[
                                    styles.spanBar,
                                    {
                                        left: startCol * colWidth + 2,
                                        width: (endCol - startCol + 1) * colWidth - 4,
                                        top: 4 + row * (ALL_DAY_ROW_H + ALL_DAY_GAP),
                                        height: ALL_DAY_ROW_H,
                                        backgroundColor: event.color || '#5C6BC0',
                                    }
                                ]}
                                onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.eventId, event: JSON.stringify(event) } })}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.spanBarText} numberOfLines={1}>
                                    {event.title}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {/* Per-column overflow counts row */}
                        {hasOverflow && !expanded && colWidth > 0 && (
                            <TouchableOpacity
                                style={[
                                    styles.overflowRow,
                                    { top: 4 + visibleRows * (ALL_DAY_ROW_H + ALL_DAY_GAP) }
                                ]}
                                onPress={() => setExpanded(v => !v)}
                                activeOpacity={0.7}
                            >
                                {colOverflow.map((count, col) => (
                                    <View key={col} style={{ width: colWidth, alignItems: 'flex-start', paddingLeft: 3 }}>
                                        {count > 0 && (
                                            <Text style={[styles.overflowColText, { color: colors.overflowText }]}>
                                                +{count}
                                            </Text>
                                        )}
                                    </View>
                                ))}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* ── Scrollable time grid ── */}
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
                                    <TouchableOpacity
                                        key={event.eventId}
                                        style={[styles.eventBlock, {
                                            top, height,
                                            backgroundColor: event.color || '#2ecc71'
                                        }]}
                                        onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.eventId, event: JSON.stringify(event) } })}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.eventText} numberOfLines={2}>{event.title}</Text>
                                    </TouchableOpacity>
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
    header: { flexDirection: 'row', borderBottomWidth: 1, },
    gutter: { width: 44 },
    dayHead: { flex: 1, alignItems: 'center' },
    dayName: { fontSize: 10, fontFamily: 'Kanit-Regular' },
    dayNumWrap: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
    todayCircle: { backgroundColor: '#e74c3c' },
    dayNum: { fontSize: 13, fontFamily: 'Kanit-Bold' },

    // All-day section
    allDaySection: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        overflow: 'hidden',
    },
    allDayLabel: {
        fontSize: 9,
        fontFamily: 'Kanit-Regular',
        textAlign: 'center',
        marginTop: 4,
    },
    allDayGrid: {
        flex: 1,
        position: 'relative',
    },
    spanBar: {
        position: 'absolute',
        borderRadius: 3,
        paddingHorizontal: 4,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    spanBarText: {
        color: '#fff',
        fontSize: 10,
        fontFamily: 'Kanit-Bold',
    },
    gutterChevron: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overflowRow: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    overflowColText: {
        fontSize: 12,
        fontFamily: 'Kanit-Regular',
    },

    // Time grid
    grid: { flexDirection: 'row', paddingBottom: 20 },
    hourCell: { borderTopWidth: 1, justifyContent: 'flex-start' },
    hourText: { fontSize: 9, fontFamily: 'Kanit-Regular', textAlign: 'center', marginTop: -6 },
    dayCol: { flex: 1, position: 'relative', borderLeftWidth: 1 },
    eventBlock: { position: 'absolute', left: 1, right: 1, borderRadius: 4, padding: 2, overflow: 'hidden' },
    eventText: { fontSize: 9, fontFamily: 'Kanit-Bold', color: '#fff' },
    nowLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1.5 },
    nowDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', left: -3, top: -3 },
});

export default CalendarWeekView;
