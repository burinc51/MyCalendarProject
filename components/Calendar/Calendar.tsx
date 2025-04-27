import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Dimensions } from 'react-native';
import InfinitePager from 'react-native-infinite-pager';
import dayjs from 'dayjs';
import CalendarBody from '@/components/Calendar/CalendarBody';

const Component = () => {
    const baseDate = dayjs(); // use dayjs here
    const event: CalendarEvent[] = [
        { startDate: '2025-04-28', endDate: '2025-05-02', title: 'AAAA', color: 'black' },
        { startDate: '2025-04-13', endDate: '2025-04-16', title: 'วันหยุดยาวสงกรานต์', color: 'red' },
        { startDate: '2025-04-29', endDate: '2025-05-02', title: 'gggg', color: 'red' }
    ];

    const [events, setEvents] = useState<Record<string, string[]>>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [newEventText, setNewEventText] = useState('');

    const getDateFromIndex = useCallback(
        (index: number) => {
            const newDate = baseDate.add(index, 'month');
            return { year: newDate.year(), month: newDate.month() };
        },
        [baseDate]
    );
    console.log('events', events);

    return (
        <View style={{ flex: 1 }}>
            <InfinitePager
                pageBuffer={2}
                onPageChange={useCallback((page) => {
                    console.log('Current page index:', page);
                }, [])}
                renderPage={({ index }) => {
                    const { year, month } = getDateFromIndex(index);
                    return (
                        <View style={styles.pageContainer}>
                            <CalendarBody
                                year={year}
                                month={month}
                                onSelectDate={(date) => setSelectedDate(date)}
                                events={event}
                            />
                        </View>
                    );
                }}
            />

            {/* Popup for adding event */}
            {/*{selectedDate && (*/}
            {/*    <View style={styles.popupContainer}>*/}
            {/*        <View style={styles.popup}>*/}
            {/*            <Text style={styles.popupTitle}>Add Event for {selectedDate}</Text>*/}
            {/*            <TextInput*/}
            {/*                placeholder="Event Name"*/}
            {/*                value={newEventText}*/}
            {/*                onChangeText={setNewEventText}*/}
            {/*                style={styles.input}*/}
            {/*            />*/}
            {/*            <View style={styles.buttonRow}>*/}
            {/*                <Button*/}
            {/*                    title="Save"*/}
            {/*                    onPress={() => {*/}
            {/*                        if (selectedDate && newEventText.trim()) {*/}
            {/*                            setEvents((prev) => ({*/}
            {/*                                ...prev,*/}
            {/*                                [selectedDate]: [...(prev[selectedDate] || []), newEventText.trim()]*/}
            {/*                            }));*/}
            {/*                            setNewEventText('');*/}
            {/*                            setSelectedDate(null);*/}
            {/*                        }*/}
            {/*                    }}*/}
            {/*                />*/}
            {/*                <Button*/}
            {/*                    title="Cancel"*/}
            {/*                    color="red"*/}
            {/*                    onPress={() => {*/}
            {/*                        setNewEventText('');*/}
            {/*                        setSelectedDate(null);*/}
            {/*                    }}*/}
            {/*                />*/}
            {/*            </View>*/}
            {/*        </View>*/}
            {/*    </View>*/}
            {/*)}*/}
        </View>
    );
};

export default Component;

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    pageContainer: {
        width: width,
        height: '100%'
    },
    popupContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    popup: {
        width: '80%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 8
    },
    popupTitle: {
        fontSize: 18,
        marginBottom: 10,
        textAlign: 'center'
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        marginTop: 8,
        marginBottom: 16,
        borderRadius: 4
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    }
});
