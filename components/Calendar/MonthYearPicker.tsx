/**
 * MonthYearPicker
 * Scrollable 2-column overlay picker (Thai month + CE year)
 */
import React, { useRef, useEffect, useState } from 'react';
import {
    Modal,
    View,
    FlatList,
    Text,
    TouchableOpacity,
    StyleSheet,
    Pressable
} from 'react-native';

import { monthNames } from '@/utils/month-names';

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 21 }, (_, i) => THIS_YEAR - 10 + i);
const ITEM_H = 48;

interface Props {
    visible: boolean;
    currentYear: number;
    currentMonth: number; // 0-indexed
    isDark?: boolean;
    onSelect: (year: number, month: number) => void;
    onDismiss: () => void;
}

const MonthYearPicker: React.FC<Props> = ({
    visible, currentYear, currentMonth, isDark = false, onSelect, onDismiss
}) => {
    const [selMonth, setSelMonth] = useState(currentMonth);
    const [selYear, setSelYear] = useState(currentYear);
    const monthRef = useRef<FlatList>(null);
    const yearRef = useRef<FlatList>(null);

    useEffect(() => {
        if (visible) {
            setSelMonth(currentMonth);
            setSelYear(currentYear);
            setTimeout(() => {
                if (currentMonth > 0) {
                    monthRef.current?.scrollToIndex({
                        index: currentMonth, animated: false, viewPosition: 0.5
                    });
                }
                const yi = YEARS.indexOf(currentYear);
                if (yi > 0) {
                    yearRef.current?.scrollToIndex({
                        index: yi, animated: false, viewPosition: 0.5
                    });
                }
            }, 80);
        }
    }, [visible, currentMonth, currentYear]);

    const bg = isDark ? '#1e1e1e' : '#ffffff';
    const border = isDark ? '#333' : '#ddd';
    const textColor = isDark ? '#e5e5e5' : '#1a1a1a';
    const dimColor = isDark ? '#555' : '#bbb';
    const selBg = isDark ? '#404040' : '#1f1f1f';

    const renderMonth = ({ item, index }: { item: string; index: number }) => {
        const isSel = index === selMonth;
        const dist = Math.abs(index - selMonth);
        return (
            <TouchableOpacity
                style={[styles.item, isSel && [styles.selectedItem, { backgroundColor: selBg }]]}
                onPress={() => { setSelMonth(index); onSelect(selYear, index); onDismiss(); }}
                activeOpacity={0.7}
            >
                <Text style={[styles.itemText, {
                    color: isSel ? '#fff' : dist <= 1 ? textColor : dimColor,
                    fontWeight: isSel ? '700' : '400',
                    fontSize: isSel ? 16 : 14
                }]}>
                    {item}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderYear = ({ item }: { item: number }) => {
        const isSel = item === selYear;
        const dist = Math.abs(item - selYear);
        return (
            <TouchableOpacity
                style={[styles.item, isSel && [styles.selectedItem, { backgroundColor: selBg }]]}
                onPress={() => { setSelYear(item); onSelect(item, selMonth); onDismiss(); }}
                activeOpacity={0.7}
            >
                <Text style={[styles.itemText, {
                    color: isSel ? '#fff' : dist <= 1 ? textColor : dimColor,
                    fontWeight: isSel ? '700' : '400',
                    fontSize: isSel ? 16 : 14
                }]}>
                    {item}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
            <Pressable style={styles.backdrop} onPress={onDismiss}>
                <Pressable
                    style={[styles.card, { backgroundColor: bg, borderColor: border }]}
                    onPress={() => { }}
                >
                    <View style={styles.cols}>
                        <FlatList
                            ref={monthRef}
                            data={monthNames.en}
                            keyExtractor={(_, i) => `m${i}`}
                            renderItem={renderMonth}
                            style={styles.col}
                            showsVerticalScrollIndicator={false}
                            getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
                        />
                        <View style={[styles.divider, { backgroundColor: border }]} />
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
