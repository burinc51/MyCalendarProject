/**
 * MonthYearPicker
 * Adaptive scrollable picker with 3 modes:
 *   - 'monthYear'    : [Month | Year]          — Month & Year views
 *   - 'yearOnly'     : [Year]                  — Year view
 *   - 'dayMonthYear' : [Day | Month | Year]    — Day view
 */
import React, { useRef, useEffect, useState } from 'react';
import {
    Modal, View, FlatList, Text,
    TouchableOpacity, StyleSheet, Pressable
} from 'react-native';
import dayjs from 'dayjs';
import { monthNames } from '@/utils/month-names';

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 21 }, (_, i) => THIS_YEAR - 10 + i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1); // 1–31
const ITEM_H = 48;

export type PickerMode = 'monthYear' | 'yearOnly' | 'dayMonthYear';

interface Props {
    visible: boolean;
    mode?: PickerMode;
    currentYear: number;
    currentMonth: number;  // 0-indexed
    currentDay?: number;   // 1-indexed, used in dayMonthYear mode
    isDark?: boolean;
    onSelect: (year: number, month: number, day?: number) => void;
    onDismiss: () => void;
}

const MonthYearPicker: React.FC<Props> = ({
    visible,
    mode = 'monthYear',
    currentYear, currentMonth, currentDay = 1,
    isDark = false,
    onSelect, onDismiss
}) => {
    const [selDay, setSelDay] = useState(currentDay);
    const [selMonth, setSelMonth] = useState(currentMonth);
    const [selYear, setSelYear] = useState(currentYear);

    const dayRef = useRef<FlatList>(null);
    const monthRef = useRef<FlatList>(null);
    const yearRef = useRef<FlatList>(null);

    // Scroll to current selection whenever picker opens
    useEffect(() => {
        if (!visible) return;
        setSelDay(currentDay);
        setSelMonth(currentMonth);
        setSelYear(currentYear);

        setTimeout(() => {
            const yi = YEARS.indexOf(currentYear);

            if (mode === 'dayMonthYear') {
                if (currentDay > 1)
                    dayRef.current?.scrollToIndex({ index: currentDay - 1, animated: false, viewPosition: 0.5 });
                if (currentMonth > 0)
                    monthRef.current?.scrollToIndex({ index: currentMonth, animated: false, viewPosition: 0.5 });
                if (yi > 0)
                    yearRef.current?.scrollToIndex({ index: yi, animated: false, viewPosition: 0.5 });

            } else if (mode === 'monthYear') {
                if (currentMonth > 0)
                    monthRef.current?.scrollToIndex({ index: currentMonth, animated: false, viewPosition: 0.5 });
                if (yi > 0)
                    yearRef.current?.scrollToIndex({ index: yi, animated: false, viewPosition: 0.5 });

            } else { // yearOnly
                if (yi > 0)
                    yearRef.current?.scrollToIndex({ index: yi, animated: false, viewPosition: 0.5 });
            }
        }, 80);
    }, [visible, mode, currentDay, currentMonth, currentYear]);

    // Clamp day when month/year changes
    const clampDay = (d: number, m: number, y: number) => {
        const max = dayjs(`${y}-${m + 1}-01`).daysInMonth();
        return Math.min(d, max);
    };

    // Colors
    const bg = isDark ? '#1e1e1e' : '#ffffff';
    const border = isDark ? '#333' : '#ddd';
    const textColor = isDark ? '#e5e5e5' : '#1a1a1a';
    const dimColor = isDark ? '#555' : '#bbb';
    const selBg = isDark ? '#404040' : '#1f1f1f';

    // --- Render helpers ---
    const itemStyle = (isSel: boolean, dist: number) => ({
        color: isSel ? '#fff' : dist <= 1 ? textColor : dimColor,
        fontWeight: isSel ? ('700' as const) : ('400' as const),
        fontSize: isSel ? 16 : 14
    });

    const renderDay = ({ item }: { item: number }) => {
        const isSel = item === selDay;
        const dist = Math.abs(item - selDay);
        return (
            <TouchableOpacity
                style={[styles.item, isSel && [styles.selectedItem, { backgroundColor: selBg }]]}
                onPress={() => {
                    setSelDay(item);
                    onSelect(selYear, selMonth, item);
                    onDismiss();
                }}
                activeOpacity={0.7}
            >
                <Text style={[styles.itemText, itemStyle(isSel, dist)]}>{item}</Text>
            </TouchableOpacity>
        );
    };

    const renderMonth = ({ item, index }: { item: string; index: number }) => {
        const isSel = index === selMonth;
        const dist = Math.abs(index - selMonth);
        return (
            <TouchableOpacity
                style={[styles.item, isSel && [styles.selectedItem, { backgroundColor: selBg }]]}
                onPress={() => {
                    const clamped = clampDay(selDay, index, selYear);
                    setSelMonth(index);
                    setSelDay(clamped);
                    if (mode === 'dayMonthYear') {
                        onSelect(selYear, index, clamped);
                    } else {
                        onSelect(selYear, index);
                    }
                    onDismiss();
                }}
                activeOpacity={0.7}
            >
                <Text style={[styles.itemText, itemStyle(isSel, dist)]}>{item}</Text>
            </TouchableOpacity>
        );
    };

    const renderYear = ({ item }: { item: number }) => {
        const isSel = item === selYear;
        const dist = Math.abs(item - selYear);
        return (
            <TouchableOpacity
                style={[styles.item, isSel && [styles.selectedItem, { backgroundColor: selBg }]]}
                onPress={() => {
                    const clamped = clampDay(selDay, selMonth, item);
                    setSelYear(item);
                    setSelDay(clamped);
                    if (mode === 'yearOnly') {
                        onSelect(item, selMonth);
                    } else if (mode === 'dayMonthYear') {
                        onSelect(item, selMonth, clamped);
                    } else {
                        onSelect(item, selMonth);
                    }
                    onDismiss();
                }}
                activeOpacity={0.7}
            >
                <Text style={[styles.itemText, itemStyle(isSel, dist)]}>{item}</Text>
            </TouchableOpacity>
        );
    };

    const Divider = () => <View style={[styles.divider, { backgroundColor: border }]} />;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
            <Pressable style={styles.backdrop} onPress={onDismiss}>
                <Pressable
                    style={[styles.card, { backgroundColor: bg, borderColor: border }]}
                    onPress={() => { }}
                >
                    <View style={styles.cols}>
                        {/* Day column — only in dayMonthYear mode */}
                        {mode === 'dayMonthYear' && (
                            <>
                                <FlatList
                                    ref={dayRef}
                                    data={DAYS}
                                    keyExtractor={(d) => `d${d}`}
                                    renderItem={renderDay}
                                    style={styles.col}
                                    showsVerticalScrollIndicator={false}
                                    getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
                                />
                                <Divider />
                            </>
                        )}

                        {/* Month column — hidden in yearOnly mode */}
                        {mode !== 'yearOnly' && (
                            <>
                                <FlatList
                                    ref={monthRef}
                                    data={monthNames.en}
                                    keyExtractor={(_, i) => `m${i}`}
                                    renderItem={renderMonth}
                                    style={styles.col}
                                    showsVerticalScrollIndicator={false}
                                    getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
                                />
                                <Divider />
                            </>
                        )}

                        {/* Year column — always shown */}
                        <FlatList
                            ref={yearRef}
                            data={YEARS}
                            keyExtractor={(y) => `y${y}`}
                            renderItem={renderYear}
                            style={styles.col}
                            showsVerticalScrollIndicator={false}
                            getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
                        />
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-start',
        paddingTop: 64,
        paddingHorizontal: 16
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        height: ITEM_H * 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 10
    },
    cols: { flexDirection: 'row', flex: 1 },
    col: { flex: 1 },
    divider: { width: 1 },
    item: {
        height: ITEM_H,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 6
    },
    selectedItem: { borderRadius: 10 },
    itemText: { fontFamily: 'Kanit-Regular', textAlign: 'center' }
});

export default MonthYearPicker;
