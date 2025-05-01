import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import InfinitePager from 'react-native-infinite-pager';
import dayjs from 'dayjs';
import CalendarBody from '@/components/Calendar/CalendarBody';

const CalendarComponent = () => {
    const baseDate = dayjs(); // use dayjs here
    const [month, setMonth] = useState<String>(baseDate.format('MMMM YYYY')); // Initialize with current month

    // Sample events - you can replace with your actual events
    const events: CalendarEvent[] = [
        { id: 1, startDate: '2025-04-28T10:00:00Z', endDate: '2025-05-02T18:00:00Z', title: 'โดยที่การไม่นำพาและการหมิ่นในคุณค่าของสิทธิมนุษยชน', color: 'black' },
        { id: 2, startDate: '2025-04-13', endDate: '2025-04-16', title: 'วันหยุดยาวสงกรานต์', color: 'red' },
        { id: 3, startDate: '2025-04-29T09:30:00Z', endDate: '2025-05-02T12:00:00Z', title: '1111', color: 'red' },
        { id: 4, startDate: '2025-04-29T14:30:00Z', endDate: '2025-05-02T16:00:00Z', title: '2222', color: 'red' },
        { id: 5, startDate: '2025-04-29T08:00:00Z', endDate: '2025-05-02T10:00:00Z', title: '3333', color: 'red' },
        { id: 6, startDate: '2025-04-29', endDate: '2025-05-02', title: '4444', color: 'red', isAllDay: true }
    ];

    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const getDateFromIndex = useCallback(
        (index: number) => {
            const newDate = baseDate.add(index, 'month');
            return { year: newDate.year(), month: newDate.month() };
        },
        [baseDate]
    );

    const handleSelectDate = (date: string) => {
        setSelectedDate(date);
        // You can add additional logic here for handling date selection
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <View style={styles.redDot} />
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerMonthText}>{month}</Text>
                        {/*<Text style={styles.headerSubText}>ผ่านมา</Text>*/}
                    </View>
                </View>
            </View>

            {/* Calendar */}
            <InfinitePager
                pageBuffer={5}
                onPageChange={useCallback(
                    (page) => {
                        console.log('Page changed:', page);
                        const { year, month } = getDateFromIndex(page);
                        const monthName = dayjs(`${year}-${month + 1}-01`).format('MMMM YYYY');
                        setMonth(monthName);
                    },
                    [getDateFromIndex, setMonth]
                )}
                renderPage={({ index }) => {
                    return (
                        <View style={styles.pageContainer}>
                            <CalendarBody
                                index={index}
                                onSelectDate={handleSelectDate}
                                events={events}
                                // setMonth={setMonth}
                            />
                        </View>
                    );
                }}
            />
        </View>
    );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    headerTextContainer: {
        flexDirection: 'column'
    },
    headerMonthText: {
        fontSize: 16,
        fontFamily: 'Kanit-Bold'
    },
    headerSubText: {
        fontSize: 12,
        color: '#666'
    },
    pageContainer: {
        width: width,
        flex: 1
    }
});

export default CalendarComponent;
