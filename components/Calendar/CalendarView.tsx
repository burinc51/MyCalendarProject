import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, BackHandler, TouchableOpacity, TextInput, Alert, Switch, ScrollView, ActivityIndicator, Animated } from 'react-native';
import InfinitePager from 'react-native-infinite-pager';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import CalendarBody from '@/components/Calendar/CalendarBody';
import CustomBottomSheetModal, { CustomBottomSheetModalRef } from '@/components/CustomBottomSheetModal';
import { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { AntDesign, MaterialIcons, Feather } from '@expo/vector-icons';
import { createEvent, deleteEvent, getEventsAll, updateEvent } from '@/services/eventService';

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

// Maps component's priority to API priority ("1", "2", "3")
const mapPriorityToApi = (priority: 'low' | 'medium' | 'high'): string => {
    switch (priority) {
        case 'high':
            return '1';
        case 'medium':
            return '2';
        case 'low':
            return '3';
        default:
            return '2';
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

// Maps hex color to API color name
const mapColorToApi = (hexColor: string): string => {
    const colorMap: { [key: string]: string } = {
        '#2ecc71': 'Green',
        '#e74c3c': 'Red',
        '#3498db': 'Blue',
        '#f39c12': 'Orange',
        '#9b59b6': 'Purple',
        '#1abc9c': 'Teal',
        '#e67e22': 'Orange',
        '#34495e': 'Blue'
    };
    return colorMap[hexColor] || 'Blue'; // Default color
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

// Modern Color Gradients
const EVENT_COLORS = [
    { solid: '#e74c3c', gradient: ['#e74c3c', '#c0392b'] }, // Red
    { solid: '#3498db', gradient: ['#3498db', '#2980b9'] }, // Blue
    { solid: '#2ecc71', gradient: ['#2ecc71', '#27ae60'] }, // Green
    { solid: '#f39c12', gradient: ['#f39c12', '#e67e22'] }, // Orange
    { solid: '#9b59b6', gradient: ['#9b59b6', '#8e44ad'] }, // Purple
    { solid: '#1abc9c', gradient: ['#1abc9c', '#16a085'] }, // Teal
    { solid: '#e67e22', gradient: ['#e67e22', '#d35400'] }, // Dark Orange
    { solid: '#34495e', gradient: ['#34495e', '#2c3e50'] } // Dark Blue
];
const CATEGORIES = ['Work', 'Personal', 'Health', 'Education', 'Social', 'Travel', 'Shopping', 'Other', 'Holiday'];
const PRIORITY_COLORS = {
    low: { solid: '#95a5a6', gradient: ['#95a5a6', '#7f8c8d'] },
    medium: { solid: '#f39c12', gradient: ['#f39c12', '#e67e22'] },
    high: { solid: '#e74c3c', gradient: ['#e74c3c', '#c0392b'] }
};

const CalendarComponent = () => {
    const baseDate = useMemo(() => dayjs(), []);
    const [month, setMonth] = useState<string>(baseDate.format('MMMM YYYY'));
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month'); // New View Mode State
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
        color: EVENT_COLORS[0].solid,
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
            setEvents([]);
        } catch (err) {
            console.error('Failed to fetch events:', err);
            // setError(`Could not load events. Reason: ${err.message || err.toString()}. Please try again later.`);
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
            color: EVENT_COLORS[0].solid,
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

    // --- MODIFIED: Save or Update event using the API service with multipart/form-data ---
    const handleSaveEvent = useCallback(async () => {
        if (!validateForm()) return;

        try {
            // Create the body object matching API specification
            const bodyData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                startDate: formData.isAllDay ? dayjs(formData.startDate).toISOString() : dayjs(`${formData.startDate} ${formData.startTime}`).toISOString(),
                endDate: formData.isAllDay ? dayjs(formData.endDate).toISOString() : dayjs(`${formData.endDate} ${formData.endTime}`).toISOString(),
                color: mapColorToApi(formData.color),
                category: formData.category,
                priority: mapPriorityToApi(formData.priority),
                location: '', // Empty by default, can be added to form later
                repeatType: 'None', // Default repeat type
                repeatUntil: null,
                notificationTime: formData.reminder > 0 ? dayjs(`${formData.startDate} ${formData.startTime}`).subtract(formData.reminder, 'minutes').toISOString() : null,
                notificationType: 'Push', // Default notification type
                remindBeforeMinutes: formData.reminder,
                pinned: false,
                createById: 2, // TODO: Replace with actual user ID
                groupId: null,
                assigneeIds: [],
                latitude: 0,
                longitude: 0,
                eventId: 0
            };

            // Create FormData for multipart/form-data
            const formDataToSend = new FormData();

            // Append the body as JSON string
            formDataToSend.append('body', JSON.stringify(bodyData));

            // Optional: Append file if you have image upload functionality
            // formDataToSend.append('file', {
            //     uri: imageUri,
            //     name: 'event-image.jpg',
            //     type: 'image/jpeg'
            // } as any);

            if (editingEvent) {
                // Updating an existing event
                const userId = editingEvent.userId || 2; // Use a real user ID
                await updateEvent(editingEvent.id, userId, formDataToSend as any);
                Alert.alert('Success', 'Event updated!');
            } else {
                // Creating a new event
                await createEvent(formDataToSend as any);
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

    // Render event list with modern card design
    const renderEventList = () => (
        <View style={styles.eventList}>
            {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event, index) => (
                    <Animated.View
                        key={event.id}
                        style={[
                            styles.eventItem,
                            {
                                opacity: 1,
                                transform: [{ translateY: 0 }]
                            }
                        ]}
                    >
                        <View style={[styles.eventColorBar, { backgroundColor: event.color }]} />
                        <View style={styles.eventMainContent}>
                            <View style={styles.eventContent}>
                                <View style={styles.eventHeader}>
                                    <Text style={styles.eventTitle}>{event.title}</Text>
                                    {event.priority && (
                                        <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[event.priority].solid }]}>
                                            <Text style={styles.priorityBadgeText}>{event.priority.toUpperCase()}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.eventTime}>
                                    {event.isAllDay ? '🗓️ All Day' : `⏰ ${dayjs(event.startDate).format('h:mm A')} - ${dayjs(event.endDate).format('h:mm A')}`}
                                </Text>
                                {event.category && (
                                    <View style={styles.eventTagContainer}>
                                        <View style={styles.eventTag}>
                                            <Text style={styles.eventTagText}>{event.category}</Text>
                                        </View>
                                    </View>
                                )}
                                {event.description && (
                                    <Text
                                        style={styles.eventDescription}
                                        numberOfLines={2}
                                    >
                                        {event.description}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.eventActions}>
                                <TouchableOpacity
                                    onPress={() => handleEditEvent(event)}
                                    style={[styles.actionButton, styles.editButton]}
                                    activeOpacity={0.7}
                                >
                                    <MaterialIcons
                                        name="edit"
                                        size={20}
                                        color="#3498db"
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleDeleteEvent(event.id)}
                                    style={[styles.actionButton, styles.deleteButton]}
                                    activeOpacity={0.7}
                                >
                                    <MaterialIcons
                                        name="delete"
                                        size={20}
                                        color="#e74c3c"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                ))
            ) : (
                <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateIcon}>📅</Text>
                    <Text style={styles.noEventsText}>No events scheduled</Text>
                    <Text style={styles.noEventsSubtext}>Tap + to add your first event</Text>
                </View>
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
                <Text style={styles.formLabel}>🎨 Color</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    <View style={styles.colorContainer}>
                        {EVENT_COLORS.map((colorObj) => (
                            <TouchableOpacity
                                key={colorObj.solid}
                                style={[styles.colorOption, { backgroundColor: colorObj.solid }, formData.color === colorObj.solid && styles.selectedColor]}
                                onPress={() => updateFormData('color', colorObj.solid)}
                                activeOpacity={0.7}
                            >
                                {formData.color === colorObj.solid && (
                                    <MaterialIcons
                                        name="check"
                                        size={20}
                                        color="#fff"
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📂 Category</Text>
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
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.categoryText, formData.category === category && styles.selectedCategoryText]}>{category}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Priority */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>⭐ Priority</Text>
                <View style={styles.priorityContainer}>
                    {(['low', 'medium', 'high'] as const).map((priority) => (
                        <TouchableOpacity
                            key={priority}
                            style={[
                                styles.priorityOption,
                                formData.priority === priority && styles.selectedPriority,
                                formData.priority === priority && {
                                    backgroundColor: PRIORITY_COLORS[priority].solid,
                                    borderColor: PRIORITY_COLORS[priority].solid
                                }
                            ]}
                            onPress={() => updateFormData('priority', priority)}
                            activeOpacity={0.7}
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
                {/* View Switcher */}
                <View style={styles.viewSwitcher}>
                    {(['month', 'week', 'day'] as const).map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            style={[styles.viewModeButton, viewMode === mode && styles.viewModeButtonActive]}
                            onPress={() => setViewMode(mode)}
                        >
                            <Text style={[styles.viewModeText, viewMode === mode && styles.viewModeTextActive]}>
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Calendar Body based on View Mode */}
            {viewMode === 'month' ? (
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
            ) : (
                <View style={styles.centered}>
                    <Text style={{ fontFamily: 'Kanit-Regular', fontSize: 16, color: '#666' }}>
                        {viewMode === 'week' ? 'Week' : 'Day'} view coming soon!
                    </Text>
                </View>
            )}

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
        backgroundColor: '#f8f9fa'
    },
    // Header with modern gradient design
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 70,
        backgroundColor: '#fff',
        borderBottomWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    viewSwitcher: {
        flexDirection: 'row',
        backgroundColor: '#f1f2f6',
        borderRadius: 8,
        padding: 4
    },
    viewModeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6
    },
    viewModeButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    viewModeText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
        color: '#95a5a6'
    },
    viewModeTextActive: {
        fontFamily: 'Kanit-Bold',
        color: '#2c3e50'
    },
    redDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#e74c3c',
        marginRight: 12,
        shadowColor: '#e74c3c',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 2
    },
    headerMonthText: {
        fontSize: 20,
        fontFamily: 'Kanit-Bold',
        color: '#2c3e50',
        letterSpacing: 0.5
    },
    pageContainer: {
        width,
        flex: 1
    },
    // Modal Header
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 0,
        marginBottom: 20,
        paddingBottom: 16,
        backgroundColor: 'transparent'
    },
    modalHeaderText: {
        fontSize: 22,
        fontFamily: 'Kanit-Bold',
        color: '#2c3e50'
    },
    // Event List - Modern Card Design
    eventList: {
        flex: 1,
        paddingTop: 8
    },
    eventItem: {
        flexDirection: 'row',
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3
    },
    eventColorBar: {
        width: 6,
        backgroundColor: '#3498db'
    },
    eventMainContent: {
        flex: 1,
        flexDirection: 'row',
        padding: 16
    },
    eventContent: {
        flex: 1,
        gap: 6
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    eventTitle: {
        fontSize: 16,
        fontFamily: 'Kanit-Bold',
        color: '#2c3e50',
        flex: 1,
        marginRight: 8
    },
    eventTime: {
        fontSize: 13,
        fontFamily: 'Kanit-Regular',
        color: '#7f8c8d'
    },
    eventTagContainer: {
        flexDirection: 'row',
        marginTop: 4
    },
    eventTag: {
        backgroundColor: '#ecf0f1',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    eventTagText: {
        fontSize: 11,
        fontFamily: 'Kanit-Regular',
        color: '#34495e'
    },
    eventDescription: {
        fontSize: 12,
        fontFamily: 'Kanit-Regular',
        color: '#95a5a6',
        marginTop: 4,
        lineHeight: 16
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6
    },
    priorityBadgeText: {
        fontSize: 9,
        fontFamily: 'Kanit-Bold',
        color: '#fff',
        letterSpacing: 0.5
    },
    eventActions: {
        flexDirection: 'column',
        gap: 8,
        justifyContent: 'center',
        marginLeft: 8
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center'
    },
    editButton: {
        backgroundColor: '#ebf5fb'
    },
    deleteButton: {
        backgroundColor: '#fadbd8'
    },
    // Empty State
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60
    },
    emptyStateIcon: {
        fontSize: 64,
        marginBottom: 16,
        opacity: 0.6
    },
    noEventsText: {
        fontSize: 16,
        fontFamily: 'Kanit-Bold',
        color: '#7f8c8d',
        marginBottom: 8
    },
    noEventsSubtext: {
        fontSize: 13,
        fontFamily: 'Kanit-Regular',
        color: '#95a5a6'
    },
    // Form Container - Enhanced Design
    formContainer: {
        flex: 1
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1'
    },
    formTitle: {
        fontSize: 24,
        fontFamily: 'Kanit-Bold',
        color: '#2c3e50'
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center'
    },
    formGroup: {
        marginBottom: 24
    },
    formLabel: {
        fontSize: 15,
        fontFamily: 'Kanit-Bold',
        color: '#34495e',
        marginBottom: 10
    },
    textInput: {
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        fontFamily: 'Kanit-Regular',
        backgroundColor: '#fff',
        color: '#2c3e50',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 14
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    dateInput: {
        flex: 1
    },
    dateSeparator: {
        fontSize: 14,
        fontFamily: 'Kanit-Regular',
        color: '#95a5a6'
    },
    // Color Selection - Modern Buttons
    colorContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 8
    },
    colorOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
        borderColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3
    },
    selectedColor: {
        borderColor: '#fff',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
        transform: [{ scale: 1.1 }]
    },
    // Category Selection - Modern Pills
    categoryContainer: {
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 8
    },
    categoryOption: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    selectedCategory: {
        backgroundColor: '#2ecc71',
        borderColor: '#2ecc71',
        shadowColor: '#2ecc71',
        shadowOpacity: 0.3,
        elevation: 3
    },
    categoryText: {
        fontSize: 13,
        fontFamily: 'Kanit-Regular',
        color: '#34495e'
    },
    selectedCategoryText: {
        color: '#fff',
        fontFamily: 'Kanit-Bold'
    },
    // Priority Selection - Modern Buttons
    priorityContainer: {
        flexDirection: 'row',
        gap: 10
    },
    priorityOption: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        alignItems: 'center',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    selectedPriority: {
        borderWidth: 0,
        shadowOpacity: 0.2,
        elevation: 3
    },
    priorityText: {
        fontSize: 13,
        fontFamily: 'Kanit-Regular',
        color: '#34495e'
    },
    selectedPriorityText: {
        fontFamily: 'Kanit-Bold',
        color: '#fff'
    },
    // Action Buttons - Modern Design
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 32,
        marginBottom: 40
    },
    button: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e0e0e0'
    },
    saveButton: {
        backgroundColor: '#2ecc71',
        shadowColor: '#2ecc71',
        shadowOpacity: 0.3
    },
    cancelButtonText: {
        fontSize: 15,
        fontFamily: 'Kanit-Bold',
        color: '#7f8c8d'
    },
    saveButtonText: {
        fontSize: 15,
        fontFamily: 'Kanit-Bold',
        color: '#fff',
        letterSpacing: 0.5
    },
    // Loading and Error States
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    },
    errorText: {
        color: '#e74c3c',
        fontSize: 14,
        fontFamily: 'Kanit-Regular',
        textAlign: 'center',
        paddingHorizontal: 20
    }
});

export default CalendarComponent;
