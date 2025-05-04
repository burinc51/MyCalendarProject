import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, BackHandler, TouchableOpacity } from 'react-native';
import InfinitePager from 'react-native-infinite-pager';
import dayjs from 'dayjs';
import CalendarBody from '@/components/Calendar/CalendarBody';
import CustomBottomSheetModal, { CustomBottomSheetModalRef } from '@/components/CustomBottomSheetModal';
import { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { Calendar } from '@/types/Calendar';
import { AntDesign } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CalendarComponent = () => {
    const baseDate = useMemo(() => dayjs(), []);
    const [month, setMonth] = useState<string>(baseDate.format('MMMM YYYY'));
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const sheetRef = useRef<CustomBottomSheetModalRef>(null);

    // Sample events
    const events: Calendar[] = useMemo(
        () => [
            { id: 1, startDate: '2025-04-28T10:00:00Z', endDate: '2025-05-02T18:00:00Z', title: 'Event 1', color: 'black' },
            { id: 2, startDate: '2025-04-13', endDate: '2025-04-16', title: 'Songkran Holiday', color: 'red', isAllDay: true },
            { id: 3, startDate: '2025-04-29T09:30:00Z', endDate: '2025-05-02T12:00:00Z', title: 'Event 2', color: 'red' },
            { id: 4, startDate: '2025-04-29T14:30:00Z', endDate: '2025-05-02T16:00:00Z', title: 'Event 3', color: 'red' },
            { id: 5, startDate: '2025-04-29T08:00:00Z', endDate: '2025-05-02T10:00:00Z', title: 'Event 4', color: 'red' },
            { id: 6, startDate: '2025-04-29', endDate: '2025-05-02', title: 'All Day Event', color: 'red', isAllDay: true },
        ],
        [],
    );

    // Handle date selection
    const handleSelectDate = useCallback((date: string) => {
        sheetRef?.current?.present();
        setSelectedDate(date);
    }, []);

    // Close panel
    const closePanel = useCallback(() => {
        sheetRef?.current?.dismiss();
        setSelectedDate(null);
    }, []);

    // Handle hardware back button
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (sheetRef.current) {
                closePanel();
                return true;
            }
            return false;
        });

        return () => backHandler.remove();
    }, [closePanel]);

    const getDateFromIndex = useCallback(
        (index: number) => {
            const newDate = baseDate.add(index, 'month');
            return { year: newDate.year(), month: newDate.month() };
        },
        [baseDate],
    );

    const handlePageChange = useCallback(
        (page: number) => {
            const { year, month } = getDateFromIndex(page);
            setMonth(dayjs(`${year}-${month + 1}-01`).format('MMMM YYYY'));
        },
        [getDateFromIndex],
    );

    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];
        const selectedDay = dayjs(selectedDate);
        return events.filter((event) => {
            const start = dayjs(event.startDate);
            const end = dayjs(event.endDate);
            return selectedDay.isSame(start, 'day') || selectedDay.isSame(end, 'day') || selectedDay.isBetween(start, end, 'day', '[]');
        });
    }, [selectedDate, events]);

    const handlePress = () => {
        console.log('Icon Pressed!');
    };

    // Format selected date for header
    const formattedDate = useMemo(() => {
        return selectedDate ? dayjs(selectedDate).format('dddd D MMMM') : 'No Date Selected';
    }, [selectedDate]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <View style={styles.redDot} />
                    <Text style={styles.headerMonthText}>{month}</Text>
                </View>
            </View>

            {/* Calendar */}
            <InfinitePager
                pageBuffer={3}
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

            {/* Bottom Sheet Modal */}
            <CustomBottomSheetModal
                ref={sheetRef}
                snapPoints={['100%']}
            >
                <BottomSheetScrollView contentContainerStyle={{ flex: 1, padding: 16 }}>
                    <BottomSheetView style={styles.modalHeader}>
                        <Text style={styles.modalHeaderText}>{formattedDate}</Text>
                        <TouchableOpacity
                            onPress={handlePress}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <AntDesign
                                name="pluscircle"
                                size={30}
                                color="black"
                            />
                        </TouchableOpacity>
                    </BottomSheetView>
                    {selectedDateEvents.length > 0 ? (
                        selectedDateEvents.map((event) => (
                            <View
                                key={event.id}
                                style={styles.eventItem}
                            >
                                <View style={[styles.eventColorDot, { backgroundColor: event.color || '#e74c3c' }]} />
                                <View>
                                    <Text style={styles.eventTitle}>{event.title}</Text>
                                    <Text style={styles.eventTime}>
                                        {event.isAllDay ? 'All Day' : `${dayjs(event.startDate).format('h:mm A')} - ${dayjs(event.endDate).format('h:mm A')}`}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noEventsText}>No events for this date</Text>
                    )}
                </BottomSheetScrollView>
            </CustomBottomSheetModal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 65,
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    redDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'red',
        marginRight: 8,
    },
    headerMonthText: {
        fontSize: 16,
        fontFamily: 'Kanit-Bold',
    },
    pageContainer: {
        width,
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        marginBottom: 8,
        paddingBottom: 8,
    },
    modalHeaderText: {
        fontSize: 18,
        fontFamily: 'Kanit-Bold',
        color: '#333',
    },
    eventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    eventColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    eventTitle: {
        fontSize: 14,
        fontFamily: 'Kanit-Bold',
        color: '#333',
    },
    eventTime: {
        fontSize: 12,
        fontFamily: 'Kanit-Regular',
        color: '#666',
    },
    noEventsText: {
        fontSize: 14,
        fontFamily: 'Kanit-Regular',
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
});

export default CalendarComponent;
