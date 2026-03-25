/**
 * CalendarYearView
 * 12-month mini-calendar overview grid
 */
import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import dayjs from 'dayjs';
import { monthNamesShort, miniDays } from '@/utils/month-names';
import { getYearSummary } from '@/services/eventService';


interface Props {
    year: number;
    groupId?: number;
    isDark?: boolean;
    onSelectMonth?: (month: number) => void; // 0-indexed
}

interface MiniMonthProps {
    year: number;
    monthIndex: number;
    daysWithEvents: Set<number>;
    isDark: boolean;
    isCurrent: boolean;
    onPress: () => void;
}

const MiniMonth: React.FC<MiniMonthProps> = ({ year, monthIndex, daysWithEvents, isDark, isCurrent, onPress }) => {
    const today = dayjs().format('YYYY-MM-DD');
    const colors = {
        bg: isDark ? (isCurrent ? '#223322' : '#1e1e1e') : (isCurrent ? '#f0fff4' : '#fff'),
        border: isDark ? '#2a2a2a' : '#eee',
        title: isDark ? '#e5e5e5' : '#333',
        dayLabel: isDark ? '#555' : '#bbb',
        dateText: isDark ? '#ccc' : '#555',
        outside: isDark ? '#383838' : '#ddd',
        dot: '#2ecc71',
        todayBg: '#e74c3c'
    };

    const firstDay = dayjs(`${year}-${monthIndex + 1}-01`);
    const startDow = firstDay.day();
    const daysInMonth = firstDay.daysInMonth();
    const cells: (number | null)[] = [
        ...Array(startDow).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

    return (
        <TouchableOpacity
            style={[styles.miniCard, { backgroundColor: colors.bg, borderColor: colors.border }]}
            onPress={onPress}
            activeOpacity={0.75}
        >
            <Text style={[styles.miniTitle, { color: colors.title }]}>
                {monthNamesShort.en[monthIndex]}
            </Text>
            <View style={styles.miniDayRow}>
                {miniDays.en.map((d, i) => (
                    <Text key={i} style={[styles.miniDayLabel, { color: colors.dayLabel }]}>{d}</Text>
                ))}
            </View>
            {rows.map((row, ri) => (
                <View key={ri} style={styles.miniWeekRow}>
                    {row.map((day, di) => {
                        if (!day) return <View key={di} style={styles.miniCell} />;
                        const ds = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isToday = ds === today;
                        const hasEvent = daysWithEvents.has(day);
                        return (
                            <View key={di} style={styles.miniCell}>
                                <View style={[styles.miniDayWrap, isToday && { backgroundColor: colors.todayBg }]}>
                                    <Text style={[styles.miniDate, {
                                        color: isToday ? '#fff' : colors.dateText,
                                        fontFamily: isToday ? 'Kanit-Bold' : 'Kanit-Regular'
                                    }]}>
                                        {day}
                                    </Text>
                                </View>
                                {hasEvent && <View style={[styles.dot, { backgroundColor: colors.dot }]} />}
                            </View>
                        );
                    })}
                </View>
            ))}
        </TouchableOpacity>
    );
};

const CalendarYearView: React.FC<Props> = ({ year, groupId, isDark = false, onSelectMonth }) => {
    const bg = isDark ? '#171717' : '#f0f0f5';
    const nowMonth = dayjs().month();
    const nowYear = dayjs().year();
    
    // Store months object { "1": [3], "3": [22, 25, 26] }
    const [yearData, setYearData] = useState<Record<string, number[]>>({});

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await getYearSummary(year, groupId);
                if (res.data && res.data.months) {
                    setYearData(res.data.months);
                } else {
                    setYearData({});
                }
            } catch (err) {
                console.error("Failed to fetch year summary", err);
                setYearData({});
            }
        };
        fetchSummary();
    }, [year, groupId]);

    const pairs: [number, number | null][] = [];
    for (let i = 0; i < 12; i += 2) pairs.push([i, i + 1 < 12 ? i + 1 : null]);

    const getDaysSetForMonth = (monthIndex: number) => {
        // API response month key is likely 1-indexed based on user request ("1": [3])
        // Let's handle both 1-indexed and 0-indexed just to be safe.
        // If the user's example means Jan is "1" then:
        const monthKey = (monthIndex + 1).toString();
        return new Set(yearData[monthKey] || []);
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: bg }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {pairs.map(([m1, m2], ri) => (
                <View key={ri} style={styles.row}>
                    <MiniMonth
                        year={year} monthIndex={m1} daysWithEvents={getDaysSetForMonth(m1)} isDark={isDark}
                        isCurrent={year === nowYear && m1 === nowMonth}
                        onPress={() => onSelectMonth?.(m1)}
                    />
                    {m2 !== null ? (
                        <MiniMonth
                            year={year} monthIndex={m2} daysWithEvents={getDaysSetForMonth(m2)} isDark={isDark}
                            isCurrent={year === nowYear && m2 === nowMonth}
                            onPress={() => onSelectMonth?.(m2)}
                        />
                    ) : <View style={styles.miniCard} />}
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 12, gap: 10 },
    row: { flexDirection: 'row', gap: 10 },
    miniCard: {
        flex: 1, borderRadius: 12, padding: 10,
        borderWidth: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 3, elevation: 1
    },
    miniTitle: { fontSize: 13, fontFamily: 'Kanit-Bold', textAlign: 'center', marginBottom: 6 },
    miniDayRow: { flexDirection: 'row', marginBottom: 2 },
    miniDayLabel: { flex: 1, fontSize: 8, textAlign: 'center', fontFamily: 'Kanit-Regular' },
    miniWeekRow: { flexDirection: 'row' },
    miniCell: { flex: 1, alignItems: 'center', paddingVertical: 1 },
    miniDayWrap: { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    miniDate: { fontSize: 8 },
    dot: { width: 3, height: 3, borderRadius: 1.5, marginTop: 1 }
});

export default CalendarYearView;
