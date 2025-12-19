/**
 * CalendarView Component
 * Main calendar view with infinite paging and event management
 * Refactored to use modular components and hooks
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    BackHandler,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import InfinitePager from 'react-native-infinite-pager';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { AntDesign } from '@expo/vector-icons';

// Components
import CalendarBody from '@/components/Calendar/CalendarBody';
import EventList from '@/components/Calendar/EventList';
import EventForm from '@/components/Calendar/EventForm';
import CustomBottomSheetModal, { CustomBottomSheetModalRef } from '@/components/CustomBottomSheetModal';

// Hooks
import { useCalendarEvents } from '@/hooks/useCalendarEvents';

// Types
import type { CalendarEvent } from '@/types/event';

dayjs.extend(isBetween);

const { width } = Dimensions.get('window');

const CalendarView: React.FC = () => {
    const baseDate = useMemo(() => dayjs(), []);
    const [month, setMonth] = useState<string>(baseDate.format('MMMM YYYY'));
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const sheetRef = useRef<CustomBottomSheetModalRef>(null);

    // Use custom hook for all event operations
    const {
        events,
        isLoading,
        error,
        formData,
        editingEvent,
        showAddForm,
        setShowAddForm,
        setEditingEvent,
        updateFormData,
        resetForm,
        handleSaveEvent,
        handleDeleteEvent,
        handleEditEvent,
        initFormForDate
    } = useCalendarEvents();

    // Handle date selection
    const handleSelectDate = useCallback((date: string) => {
        sheetRef?.current?.present();
        setSelectedDate(date);
        setShowAddForm(false);
        setEditingEvent(null);
    }, [setShowAddForm, setEditingEvent]);

    // Close panel
    const closePanel = useCallback(() => {
        sheetRef?.current?.dismiss();
        setSelectedDate(null);
        setShowAddForm(false);
        setEditingEvent(null);
        resetForm();
    }, [setShowAddForm, setEditingEvent, resetForm]);

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

    // Get date from index for infinite pager
    const getDateFromIndex = useCallback(
        (index: number) => {
            const newDate = baseDate.add(index, 'month');
            return { year: newDate.year(), month: newDate.month() };
        },
        [baseDate]
    );

    // Handle page change
    const handlePageChange = useCallback(
        (page: number) => {
            const { year, month } = getDateFromIndex(page);
            setMonth(dayjs(`${year}-${month + 1}-01`).format('MMMM YYYY'));
        },
        [getDateFromIndex]
    );

    // Filter events for selected date
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
        initFormForDate(selectedDate);
        setShowAddForm(true);
    }, [selectedDate, initFormForDate, setShowAddForm]);

    // Format selected date for header
    const formattedDate = useMemo(() => {
        return selectedDate ? dayjs(selectedDate).format('dddd D MMMM') : 'No Date Selected';
    }, [selectedDate]);

    // Handle form cancel
    const handleFormCancel = useCallback(() => {
        setShowAddForm(false);
        setEditingEvent(null);
        resetForm();
    }, [setShowAddForm, setEditingEvent, resetForm]);

    // Loading state
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

    // Error state
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
                            events={events as CalendarEvent[]}
                        />
                    </View>
                )}
            />

            {/* Bottom Sheet Modal */}
            <CustomBottomSheetModal
                ref={sheetRef}
                snapPoints={['100%']}
            >
                <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
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
                            <EventList
                                events={selectedDateEvents}
                                onEdit={handleEditEvent}
                                onDelete={handleDeleteEvent}
                            />
                        </>
                    ) : (
                        <EventForm
                            formData={formData}
                            isEditing={!!editingEvent}
                            onUpdateField={updateFormData}
                            onSave={handleSaveEvent}
                            onCancel={handleFormCancel}
                        />
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
        alignItems: 'center'
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
    sheetContent: {
        flex: 1,
        padding: 16
    },
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

export default CalendarView;
