import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

interface Event {
    id: number;
    title: string;
    description: string;
}

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [events, setEvents] = useState<{ [key: string]: Event[] }>({});
    const [modalVisible, setModalVisible] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDescription, setNewEventDescription] = useState('');

    const today = new Date();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const formatDateKey = (date: number) => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        return `${year}-${month}-${date}`;
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        const days = [];

        // Calculate the number of days needed from the previous month
        const prevMonthDays = new Date(year, month, 0).getDate();
        const prevDays = [];
        for (let i = firstDay - 1; i >= 0; i--) {
            prevDays.push(`${prevMonthDays - i}`);
        }

        // Current month days
        const currentDays = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

        // Calculate the number of days needed from the next month
        const totalDaysNeeded = Math.ceil((firstDay + daysInMonth) / 7) * 7;
        const nextDays = Array.from({ length: totalDaysNeeded - (prevDays.length + currentDays.length) }, (_, i) => `${i + 1}`);

        // Combine all days and split into weeks
        const allDays = [...prevDays, ...currentDays, ...nextDays];
        for (let i = 0; i < allDays.length; i += 7) {
            days.push(allDays.slice(i, i + 7));
        }

        return days;
    };

    const navigateMonth = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
        setSelectedDate(null);
    };

    const isCurrentMonth = (date: string, weekIndex: number) => {
        const firstWeek = weekIndex === 0;
        const lastWeek = weekIndex === getDaysInMonth(currentDate).length - 1;
        const dateNum = parseInt(date, 10);

        if (firstWeek && dateNum > 20) {
            return false;
        }
        return !(lastWeek && dateNum < 15);
    };

    const addEvent = () => {
        if (newEventTitle.trim() && selectedDate) {
            const dateKey = formatDateKey(selectedDate as number);
            const dateEvents = events[dateKey]?.filter((event: { id: number }) => event.id !== Date.now());
            setEvents({
                ...events,
                [dateKey]: [
                    ...dateEvents,
                    {
                        id: Date.now(),
                        title: newEventTitle,
                        description: newEventDescription
                    }
                ]
            });
            setNewEventTitle('');
            setNewEventDescription('');
            setModalVisible(false);
        }
    };

    const deleteEvent = (dateKey: string, eventId: number) => {
        const dateEvents = events[dateKey].filter((event: { id: number }) => event.id !== eventId);
        if (dateEvents.length === 0) {
            const newEvents = { ...events };
            delete newEvents[dateKey];
            setEvents(newEvents);
        } else {
            setEvents({
                ...events,
                [dateKey]: dateEvents
            });
        }
    };

    const hasEvents = (date: string) => {
        const dateKey = formatDateKey(parseInt(date));
        return events[dateKey] && events[dateKey].length > 0;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.monthTitle}>{`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => navigateMonth(-1)}
                    >
                        <ChevronLeft
                            color="#000"
                            size={20}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => navigateMonth(1)}
                    >
                        <ChevronRight
                            color="#000"
                            size={20}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.calendar}>
                <View style={styles.weekDays}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
                        <Text
                            key={day}
                            style={[styles.weekDay, index === 0 && styles.sunday, index === 6 && styles.saturday]}
                        >
                            {day}
                        </Text>
                    ))}
                </View>

                {getDaysInMonth(currentDate).map((week, weekIndex) => (
                    <View
                        key={weekIndex}
                        style={styles.week}
                    >
                        {week.map((date, dateIndex) => {
                            const dateNum = parseInt(date, 10);
                            const isCurrentMonthDate = isCurrentMonth(date, weekIndex);
                            const isToday =
                                currentDate.getMonth() === today.getMonth() &&
                                currentDate.getFullYear() === today.getFullYear() &&
                                dateNum === today.getDate() &&
                                isCurrentMonthDate;

                            return (
                                <TouchableOpacity
                                    key={`${weekIndex}-${dateIndex}`}
                                    onPress={() => {
                                        if (isCurrentMonthDate) {
                                            setSelectedDate(dateNum);
                                            setModalVisible(true);
                                        }
                                    }}
                                    style={styles.dateContainer}
                                >
                                    <View style={[styles.date, dateNum === selectedDate && isCurrentMonthDate && styles.selectedDate, isToday && styles.today]}>
                                        <Text
                                            style={[
                                                styles.dateText,
                                                dateIndex === 0 && styles.sunday,
                                                dateIndex === 6 && styles.saturday,
                                                !isCurrentMonthDate && styles.otherMonth,
                                                isToday && styles.todayText,
                                                dateNum === selectedDate && isCurrentMonthDate && styles.selectedDateText
                                            ]}
                                        >
                                            {date}
                                        </Text>
                                        {hasEvents(date) && isCurrentMonthDate && <View style={styles.eventDot} />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedDate ? `Events for ${monthNames[currentDate.getMonth()]} ${selectedDate}` : 'Events'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X
                                    color="#000"
                                    size={24}
                                />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.eventsList}>
                            {selectedDate &&
                                events[formatDateKey(selectedDate)]?.map((event) => (
                                    <View
                                        key={event.id}
                                        style={styles.eventItem}
                                    >
                                        <View style={styles.eventContent}>
                                            <Text style={styles.eventTitle}>{event.title}</Text>
                                            {event.description ? <Text style={styles.eventDescription}>{event.description}</Text> : null}
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => deleteEvent(formatDateKey(selectedDate), event.id)}
                                            style={styles.deleteButton}
                                        >
                                            <X
                                                color="#FF0000"
                                                size={16}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                        </ScrollView>

                        <View style={styles.addEventForm}>
                            <TextInput
                                style={styles.input}
                                placeholder="Event Title"
                                value={newEventTitle}
                                onChangeText={setNewEventTitle}
                            />
                            <TextInput
                                style={[styles.input, styles.descriptionInput]}
                                placeholder="Description (optional)"
                                value={newEventDescription}
                                onChangeText={setNewEventDescription}
                                multiline
                            />
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={addEvent}
                            >
                                <Plus
                                    color="#FFF"
                                    size={20}
                                />
                                <Text style={styles.addButtonText}>Add Event</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        width: 'auto',
        height: '100%'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 8
    },
    navButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        justifyContent: 'center',
        alignItems: 'center'
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: '500'
    },
    calendar: {
        gap: 8
    },
    weekDays: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    weekDay: {
        width: 36,
        textAlign: 'center',
        fontSize: 14,
        color: '#000'
    },
    week: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    dateContainer: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center'
    },
    date: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    dateText: {
        fontSize: 14,
        color: '#000'
    },
    sunday: {
        color: '#FF0000'
    },
    saturday: {
        color: '#0000FF'
    },
    otherMonth: {
        color: '#CCCCCC'
    },
    today: {
        backgroundColor: '#000'
    },
    todayText: {
        color: '#FFF'
    },
    selectedDate: {
        backgroundColor: '#90EE90'
    },
    selectedDateText: {
        color: '#000'
    },
    eventDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#FF6B6B',
        position: 'absolute',
        bottom: 2
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        width: '90%',
        maxHeight: '80%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600'
    },
    eventsList: {
        maxHeight: 200,
        marginBottom: 16
    },
    eventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        marginBottom: 8
    },
    eventContent: {
        flex: 1
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4
    },
    eventDescription: {
        fontSize: 14,
        color: '#666'
    },
    deleteButton: {
        padding: 4
    },
    addEventForm: {
        gap: 12
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16
    },
    descriptionInput: {
        height: 80,
        textAlignVertical: 'top'
    },
    addButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8
    },
    addButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500'
    }
});

export default Calendar;
