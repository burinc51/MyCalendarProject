import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, BackHandler, TouchableOpacity, TextInput, Alert, Switch, ScrollView, ActivityIndicator } from 'react-native';
import InfinitePager from 'react-native-infinite-pager';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import CalendarBody from '@/components/Calendar/CalendarBody';
import CustomBottomSheetModal, { CustomBottomSheetModalRef } from '@/components/CustomBottomSheetModal';
import { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { createEvent, deleteEvent, getEventsAll, updateEvent } from '@/services/event-service';

dayjs.extend(isBetween);

const { width } = Dimensions.get('window');

// API Event Interface (matches your API response)
interface ApiEvent {
    eventId: number;
    userId: number;
    title: string;
    description: string | null;
    imageUrl: string | null;
    startDate: string;
    endDate: string;
    location: string | null;
    notificationTime: string | null;
    repeating: string | null;
    color: string;
    category: string | null;
    priority: string; // e.g., "1", "2", "3"
    groupId: number | null;
    assignees: any[] | null;
    pinned: boolean;
}

// Component's Calendar interface (kept the same)
interface Calendar {
    id: number;
    userId?: number; // Added for updates
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

// Form data interface (kept the same)
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

// --- NEW HELPER FUNCTIONS for Data Mapping ---

// Maps API priority ("1", "2", "3") to component's priority
const mapApiPriorityToString = (priority: string): 'low' | 'medium' | 'high' => {
    switch (priority) {
        case '1':
            return 'high';
        case '2':
            return 'medium';
        case '3':
            return 'low';
        default:
            return 'medium';
    }
};

// Maps API color name to a hex code your component uses
const mapApiColorToHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
        Green: '#2ecc71',
        Red: '#e74c3c',
        Blue: '#3498db',
        Orange: '#f39c12',
        Purple: '#9b59b6',
        Teal: '#1abc9c'
        // Add more color mappings as needed
    };
    return colorMap[colorName] || '#34495e'; // Default color
};

// Main function to transform an API event into a Calendar event for the component
const mapApiEventToCalendar = (apiEvent: ApiEvent): Calendar => {
    // A simple check for 'all-day'. You can make this more robust.
    // For example, if the time is 00:00:00.
    const isAllDay = dayjs(apiEvent.startDate).isSame(apiEvent.endDate, 'day') && !apiEvent.startDate.includes('T');

    return {
        id: apiEvent.eventId,
        userId: apiEvent.userId,
        title: apiEvent.title,
        description: apiEvent.description || '',
        startDate: apiEvent.startDate,
        endDate: apiEvent.endDate,
        isAllDay,
        color: mapApiColorToHex(apiEvent.color),
        category: apiEvent.category || 'Other',
        priority: mapApiPriorityToString(apiEvent.priority),
        // Reminder logic can be added here if needed
        reminder: 15 // Default reminder
    };
};

// Color options
const EVENT_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
const CATEGORIES = ['Work', 'Personal', 'Health', 'Education', 'Social', 'Travel', 'Shopping', 'Other', 'Holiday'];
const PRIORITY_COLORS = { low: '#95a5a6', medium: '#f39c12', high: '#e74c3c' };

const CalendarComponent = () => {
    const baseDate = useMemo(() => dayjs(), []);
    const [month, setMonth] = useState<string>(baseDate.format('MMMM YYYY'));
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Calendar | null>(null);
    const sheetRef = useRef<CustomBottomSheetModalRef>(null);

    // --- NEW State Management ---
    const [events, setEvents] = useState<Calendar[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    // --- NEW: Function to fetch events from API ---
    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getEventsAll();

            if (response.data && response.data.content) {
                console.log('Fetched events:', response.data.content);
                const mappedEvents = response.data.content.map(mapApiEventToCalendar);
                setEvents(mappedEvents);
            }
        } catch (err) {
            console.error('Failed to fetch events:', err);
            setError(`Could not load events. Reason: ${err.message || err.toString()}. Please try again later.`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- NEW: Fetch events on component mount ---
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

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
            return selectedDay.isBetween(start, end, 'day', '[]');
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

    // --- MODIFIED: Delete event using the API service ---
    const handleDeleteEvent = useCallback(
        (eventId: number) => {
            Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteEvent(eventId);
                            Alert.alert('Success', 'Event deleted successfully!');
                            fetchEvents(); // Refetch events to update the UI
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete event.');
                            console.error('Delete event error:', error);
                        }
                    }
                }
            ]);
        },
        [fetchEvents]
    );

    // Validate form (no changes needed)
    const validateForm = useCallback(() => {
        // ... (your existing validation logic is great!)
        return true;
    }, [formData]);

    // --- MODIFIED: Save or Update event using the API service ---
    const handleSaveEvent = useCallback(async () => {
        if (!validateForm()) return;

        // NOTE: This FormData needs to be adjusted to match what your API expects.
        // The service you provided expects `FormData`, which usually means multipart/form-data.
        // If your API accepts JSON, you'd create a JSON object instead.
        // For this example, I'll create a plain object, assuming your `httpClient` handles it.
        const eventPayload = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            startDate: formData.isAllDay ? formData.startDate : dayjs(`${formData.startDate} ${formData.startTime}`).toISOString(),
            endDate: formData.isAllDay ? formData.endDate : dayjs(`${formData.endDate} ${formData.endTime}`).toISOString(),
            color: formData.color,
            category: formData.category,
            priority: formData.priority,
            // Add other required API fields here with default values
            location: 'Default Location',
            repeating: 'None'
        };

        try {
            if (editingEvent) {
                // Updating an existing event
                const userId = editingEvent.userId || 2; // Use a real user ID
                await updateEvent(editingEvent.id, userId, eventPayload as any);
                Alert.alert('Success', 'Event updated!');
            } else {
                // Creating a new event
                await createEvent(eventPayload as any);
                Alert.alert('Success', 'Event created!');
            }
            setShowAddForm(false);
            setEditingEvent(null);
            resetForm();
            fetchEvents(); // Refetch events to show the new/updated one!
        } catch (error) {
            Alert.alert('Error', 'Failed to save event.');
            console.error('Save event error:', error);
        }
    }, [formData, editingEvent, validateForm, resetForm, fetchEvents]);

    // Update form data (no changes needed)
    const updateFormData = useCallback((key: keyof EventFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    }, []);

    // Format selected date for header (no changes needed)
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

    // --- NEW: Handle Loading and Error states in the main render ---
    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator
                    size="large"
                    color="#2ecc71"
                />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

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
                            events={events} // <-- Pass the events from the API state!
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
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    errorText: {
        color: 'red'
    }
});

export default CalendarComponent;
