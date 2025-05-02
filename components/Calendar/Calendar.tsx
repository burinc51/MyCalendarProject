import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import InfinitePager from 'react-native-infinite-pager';
import dayjs from 'dayjs';
import CalendarBody from '@/components/Calendar/CalendarBody';

const { width } = Dimensions.get('window');

const CalendarComponent = () => {
    const baseDate = useMemo(() => dayjs(), []);
    const [month, setMonth] = useState<string>(baseDate.format('MMMM YYYY'));

    // Sample events
    const events: CalendarEvent[] = useMemo(
        () => [
            { id: 1, startDate: '2025-04-28T10:00:00Z', endDate: '2025-05-02T18:00:00Z', title: 'Event 1', color: 'black' },
            { id: 2, startDate: '2025-04-13', endDate: '2025-04-16', title: 'Songkran Holiday', color: 'red' },
            { id: 3, startDate: '2025-04-29T09:30:00Z', endDate: '2025-05-02T12:00:00Z', title: 'Event 2', color: 'red' },
            { id: 4, startDate: '2025-04-29T14:30:00Z', endDate: '2025-05-02T16:00:00Z', title: 'Event 3', color: 'red' },
            { id: 5, startDate: '2025-04-29T08:00:00Z', endDate: '2025-05-02T10:00:00Z', title: 'Event 4', color: 'red' },
            { id: 6, startDate: '2025-04-29', endDate: '2025-05-02', title: 'All Day Event', color: 'red', isAllDay: true }
        ],
        []
    );

    const getDateFromIndex = useCallback(
        (index: number) => {
            const newDate = baseDate.add(index, 'month');
            return { year: newDate.year(), month: newDate.month() };
        },
        [baseDate]
    );

    const handleSelectDate = useCallback((date: string) => {
        // Handle date selection logic here
    }, []);

    const handlePageChange = useCallback(
        (page: number) => {
            const { year, month } = getDateFromIndex(page);
            setMonth(dayjs(`${year}-${month + 1}-01`).format('MMMM YYYY'));
        },
        [getDateFromIndex]
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <View style={styles.redDot} />
                    <Text style={styles.headerMonthText}>{month}</Text>
                </View>
            </View>
            <InfinitePager
                pageBuffer={3} // Reduced buffer for better performance
                onPageChange={handlePageChange}
                renderPage={({ index }) => (
                    <View style={styles.pageContainer}>
                        <CalendarBody
                            index={index}
                            onSelectDate={handleSelectDate}
                            events={events}
                        />
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 65,
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
    headerMonthText: {
        fontSize: 16,
        fontFamily: 'Kanit-Bold'
    },
    pageContainer: {
        width,
        flex: 1
    }
});

export default CalendarComponent;
