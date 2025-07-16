import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, BackHandler, TouchableOpacity, TextInput, Alert, Switch, ScrollView } from 'react-native';
import InfinitePager from 'react-native-infinite-pager';
import dayjs from 'dayjs';
import CalendarBody from '@/components/Calendar/CalendarBody';
import CustomBottomSheetModal, { CustomBottomSheetModalRef } from '@/components/CustomBottomSheetModal';
import { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Enhanced Calendar interface
interface Calendar {
    id: number;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    isAllDay: boolean;
    color: string;
    category?: string;
    reminder?: number; // minutes before
    priority?: 'low' | 'medium' | 'high';
}

// Form data interface
interface EventFormData {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    isAllDay: boolean;
    color: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    reminder: number;
}

// Color options
const EVENT_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

// Categories
const CATEGORIES = ['Work', 'Personal', 'Health', 'Education', 'Social', 'Travel', 'Shopping', 'Other'];

// Priority colors
const PRIORITY_COLORS = {
    low: '#95a5a6',
    medium: '#f39c12',
    high: '#e74c3c'
};

const CalendarComponent = () => {
    const baseDate = useMemo(() => dayjs(), []);
    const [month, setMonth] = useState<string>(baseDate.format('MMMM YYYY'));
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Calendar | null>(null);
    const sheetRef = useRef<CustomBottomSheetModalRef>(null);

    // Events state
    const [events, setEvents] = useState<Calendar[]>([
        { id: 1, startDate: '2025-04-28T10:00:00Z', endDate: '2025-05-02T18:00:00Z', title: 'Event 1', color: '#e74c3c', isAllDay: false },
        { id: 2, startDate: '2025-04-13', endDate: '2025-04-16', title: 'Songkran Holiday', color: '#3498db', isAllDay: true },
        { id: 3, startDate: '2025-04-29T09:30:00Z', endDate: '2025-05-02T12:00:00Z', title: 'Event 2', color: '#2ecc71', isAllDay: false }
    ]);

    // Form state
    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '10:00',
        isAllDay: false,
        color: EVENT_COLORS[0],
        category: CATEGORIES[0],
        priority: 'medium',
        reminder: 15
    });

    // Handle date selection
    const handleSelectDate = useCallback((date: string) => {
        sheetRef?.current?.present();
        setSelectedDate(date);
        setShowAddForm(false);
        setEditingEvent(null);
    }, []);

    // Close panel
    const closePanel = useCallback(() => {
        sheetRef?.current?.dismiss();
        setSelectedDate(null);
        setShowAddForm(false);
        setEditingEvent(null);
        resetForm();
    }, []);

    // Reset form
    const resetForm = useCallback(() => {
        setFormData({
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            startTime: '09:00',
            endTime: '10:00',
            isAllDay: false,
            color: EVENT_COLORS[0],
            category: CATEGORIES[0],
            priority: 'medium',
            reminder: 15
        });
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
        [baseDate]
    );

    const handlePageChange = useCallback(
        (page: number) => {
            const { year, month } = getDateFromIndex(page);
            setMonth(dayjs(`${year}-${month + 1}-01`).format('MMMM YYYY'));
        },
        [getDateFromIndex]
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

    // Show add form
    const handleAddEvent = useCallback(() => {
        if (!selectedDate) return;

        setFormData((prev) => ({
            ...prev,
            startDate: selectedDate,
            endDate: selectedDate
        }));
        setShowAddForm(true);
    }, [selectedDate]);

    // Edit event
    const handleEditEvent = useCallback((event: Calendar) => {
        setEditingEvent(event);
        setFormData({
            title: event.title,
            description: event.description || '',
            startDate: dayjs(event.startDate).format('YYYY-MM-DD'),
            endDate: dayjs(event.endDate).format('YYYY-MM-DD'),
            startTime: event.isAllDay ? '09:00' : dayjs(event.startDate).format('HH:mm'),
            endTime: event.isAllDay ? '10:00' : dayjs(event.endDate).format('HH:mm'),
            isAllDay: event.isAllDay,
            color: event.color,
            category: event.category || CATEGORIES[0],
            priority: event.priority || 'medium',
            reminder: event.reminder || 15
        });
        setShowAddForm(true);
    }, []);

    // Delete event
    const handleDeleteEvent = useCallback((eventId: number) => {
        Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setEvents((prev) => prev.filter((event) => event.id !== eventId));
                }
            }
        ]);
    }, []);

    // Validate form
    const validateForm = useCallback(() => {
        if (!formData.title.trim()) {
            Alert.alert('Error', 'Please enter event title');
            return false;
        }

        if (!formData.isAllDay) {
            const startDateTime = dayjs(`${formData.startDate} ${formData.startTime}`);
            const endDateTime = dayjs(`${formData.endDate} ${formData.endTime}`);

            if (endDateTime.isBefore(startDateTime)) {
                Alert.alert('Error', 'End time must be after start time');
                return false;
            }
        }

        return true;
    }, [formData]);

    // Save event
    const handleSaveEvent = useCallback(() => {
        if (!validateForm()) return;

        const newEvent: Calendar = {
            id: editingEvent?.id || Date.now(),
            title: formData.title.trim(),
            description: formData.description.trim(),
            startDate: formData.isAllDay ? formData.startDate : dayjs(`${formData.startDate} ${formData.startTime}`).toISOString(),
            endDate: formData.isAllDay ? formData.endDate : dayjs(`${formData.endDate} ${formData.endTime}`).toISOString(),
            isAllDay: formData.isAllDay,
            color: formData.color,
            category: formData.category,
            priority: formData.priority,
            reminder: formData.reminder
        };

        if (editingEvent) {
            setEvents((prev) => prev.map((event) => (event.id === editingEvent.id ? newEvent : event)));
        } else {
            setEvents((prev) => [...prev, newEvent]);
        }

        setShowAddForm(false);
        setEditingEvent(null);
        resetForm();
    }, [formData, editingEvent, validateForm, resetForm]);

    // Update form data
    const updateFormData = useCallback((key: keyof EventFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    }, []);

    // Format selected date for header
    const formattedDate = useMemo(() => {
        return selectedDate ? dayjs(selectedDate).format('dddd D MMMM') : 'No Date Selected';
    }, [selectedDate]);

    // Render event list
    const renderEventList = () => (
        <View style={styles.eventList}>
            {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event) => (
                    <View
                        key={event.id}
                        style={styles.eventItem}
                    >
                        <View style={[styles.eventColorDot, { backgroundColor: event.color }]} />
                        <View style={styles.eventContent}>
                            <Text style={styles.eventTitle}>{event.title}</Text>
                            <Text style={styles.eventTime}>
                                {event.isAllDay ? 'All Day' : `${dayjs(event.startDate).format('h:mm A')} - ${dayjs(event.endDate).format('h:mm A')}`}
                            </Text>
                            {event.category && <Text style={styles.eventCategory}>{event.category}</Text>}
                        </View>
                        <View style={styles.eventActions}>
                            <TouchableOpacity
                                onPress={() => handleEditEvent(event)}
                                style={styles.actionButton}
                            >
                                <MaterialIcons
                                    name="edit"
                                    size={20}
                                    color="#666"
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleDeleteEvent(event.id)}
                                style={styles.actionButton}
                            >
                                <MaterialIcons
                                    name="delete"
                                    size={20}
                                    color="#e74c3c"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            ) : (
                <Text style={styles.noEventsText}>No events for this date</Text>
            )}
        </View>
    );

    // Render add/edit form
    const renderEventForm = () => (
        <ScrollView style={styles.formContainer}>
            <View style={styles.formHeader}>
                <Text style={styles.formTitle}>{editingEvent ? 'Edit Event' : 'Add New Event'}</Text>
                <TouchableOpacity
                    onPress={() => setShowAddForm(false)}
                    style={styles.closeButton}
                >
                    <AntDesign
                        name="close"
                        size={24}
                        color="#666"
                    />
                </TouchableOpacity>
            </View>

            {/* Title */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                    style={styles.textInput}
                    value={formData.title}
                    onChangeText={(text) => updateFormData('title', text)}
                    placeholder="Enter event title"
                />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={formData.description}
                    onChangeText={(text) => updateFormData('description', text)}
                    placeholder="Enter event description"
                    multiline
                    numberOfLines={3}
                />
            </View>

            {/* All Day Toggle */}
            <View style={styles.formGroup}>
                <View style={styles.switchContainer}>
                    <Text style={styles.formLabel}>All Day</Text>
                    <Switch
                        value={formData.isAllDay}
                        onValueChange={(value) => updateFormData('isAllDay', value)}
                    />
                </View>
            </View>

            {/* Date Range */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date</Text>
                <View style={styles.dateContainer}>
                    <TextInput
                        style={[styles.textInput, styles.dateInput]}
                        value={formData.startDate}
                        onChangeText={(text) => updateFormData('startDate', text)}
                        placeholder="YYYY-MM-DD"
                    />
                    <Text style={styles.dateSeparator}>to</Text>
                    <TextInput
                        style={[styles.textInput, styles.dateInput]}
                        value={formData.endDate}
                        onChangeText={(text) => updateFormData('endDate', text)}
                        placeholder="YYYY-MM-DD"
                    />
                </View>
            </View>

            {/* Time Range (if not all day) */}
            {!formData.isAllDay && (
                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Time</Text>
                    <View style={styles.dateContainer}>
                        <TextInput
                            style={[styles.textInput, styles.dateInput]}
                            value={formData.startTime}
                            onChangeText={(text) => updateFormData('startTime', text)}
                            placeholder="HH:mm"
                        />
                        <Text style={styles.dateSeparator}>to</Text>
                        <TextInput
                            style={[styles.textInput, styles.dateInput]}
                            value={formData.endTime}
                            onChangeText={(text) => updateFormData('endTime', text)}
                            placeholder="HH:mm"
                        />
                    </View>
                </View>
            )}

            {/* Color Selection */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Color</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    <View style={styles.colorContainer}>
                        {EVENT_COLORS.map((color) => (
                            <TouchableOpacity
                                key={color}
                                style={[styles.colorOption, { backgroundColor: color }, formData.color === color && styles.selectedColor]}
                                onPress={() => updateFormData('color', color)}
                            />
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    <View style={styles.categoryContainer}>
                        {CATEGORIES.map((category) => (
                            <TouchableOpacity
                                key={category}
                                style={[styles.categoryOption, formData.category === category && styles.selectedCategory]}
                                onPress={() => updateFormData('category', category)}
                            >
                                <Text style={[styles.categoryText, formData.category === category && styles.selectedCategoryText]}>{category}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Priority */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority</Text>
                <View style={styles.priorityContainer}>
                    {(['low', 'medium', 'high'] as const).map((priority) => (
                        <TouchableOpacity
                            key={priority}
                            style={[styles.priorityOption, formData.priority === priority && styles.selectedPriority, { borderColor: PRIORITY_COLORS[priority] }]}
                            onPress={() => updateFormData('priority', priority)}
                        >
                            <Text style={[styles.priorityText, formData.priority === priority && styles.selectedPriorityText]}>
                                {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setShowAddForm(false)}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSaveEvent}
                >
                    <Text style={styles.saveButtonText}>{editingEvent ? 'Update' : 'Save'}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

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
                    {!showAddForm ? (
                        <>
                            <BottomSheetView style={styles.modalHeader}>
                                <Text style={styles.modalHeaderText}>{formattedDate}</Text>
                                <TouchableOpacity
                                    onPress={handleAddEvent}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <AntDesign
                                        name="pluscircle"
                                        size={30}
                                        color="#2ecc71"
                                    />
                                </TouchableOpacity>
                            </BottomSheetView>
                            {renderEventList()}
                        </>
                    ) : (
                        renderEventForm()
                    )}
                </BottomSheetScrollView>
            </CustomBottomSheetModal>
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
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        marginBottom: 16,
        paddingBottom: 8
    },
    modalHeaderText: {
        fontSize: 18,
        fontFamily: 'Kanit-Bold',
        color: '#333'
    },
    eventList: {
        flex: 1
    },
    eventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8
    },
    eventColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12
    },
    eventContent: {
        flex: 1
    },
    eventTitle: {
        fontSize: 14,
        fontFamily: 'Kanit-Bold',
        color: '#333',
        marginBottom: 2
    },
    eventTime: {
        fontSize: 12,
        fontFamily: 'Kanit-Regular',
        color: '#666',
        marginBottom: 2
    },
    eventCategory: {
        fontSize: 11,
        fontFamily: 'Kanit-Regular',
        color: '#999'
    },
    eventActions: {
        flexDirection: 'row',
        gap: 8
    },
    actionButton: {
        padding: 8
    },
    noEventsText: {
        fontSize: 14,
        fontFamily: 'Kanit-Regular',
        color: '#666',
        textAlign: 'center',
        marginTop: 20
    },
    formContainer: {
        flex: 1
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    formTitle: {
        fontSize: 20,
        fontFamily: 'Kanit-Bold',
        color: '#333'
    },
    closeButton: {
        padding: 8
    },
    formGroup: {
        marginBottom: 20
    },
    formLabel: {
        fontSize: 14,
        fontFamily: 'Kanit-Bold',
        color: '#333',
        marginBottom: 8
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        fontFamily: 'Kanit-Regular',
        backgroundColor: '#fff'
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top'
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    dateInput: {
        flex: 1
    },
    dateSeparator: {
        fontSize: 14,
        fontFamily: 'Kanit-Regular',
        color: '#666'
    },
    colorContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 8
    },
    colorOption: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent'
    },
    selectedColor: {
        borderColor: '#333'
    },
    categoryContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 8
    },
    categoryOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#f9f9f9'
    },
    selectedCategory: {
        backgroundColor: '#2ecc71',
        borderColor: '#2ecc71'
    },
    categoryText: {
        fontSize: 12,
        fontFamily: 'Kanit-Regular',
        color: '#333'
    },
    selectedCategoryText: {
        color: '#fff'
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: 8
    },
    priorityOption: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        backgroundColor: '#f9f9f9'
    },
    selectedPriority: {
        backgroundColor: '#fff'
    },
    priorityText: {
        fontSize: 12,
        fontFamily: 'Kanit-Regular',
        color: '#333'
    },
    selectedPriorityText: {
        fontFamily: 'Kanit-Bold'
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        marginBottom: 40
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    cancelButton: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    saveButton: {
        backgroundColor: '#2ecc71'
    },
    cancelButtonText: {
        fontSize: 14,
        fontFamily: 'Kanit-Regular',
        color: '#666'
    },
    saveButtonText: {
        fontSize: 14,
        fontFamily: 'Kanit-Bold',
        color: '#fff'
    }
});

export default CalendarComponent;
