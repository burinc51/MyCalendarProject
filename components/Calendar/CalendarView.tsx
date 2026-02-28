/**
 * CalendarView Component
 * Main calendar view with pager-based navigation and event management
 * Fully responsive across all device sizes and orientations
 * Uses react-native-pager-view for SDK 54 compatibility
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    BackHandler,
    TouchableOpacity,
    ActivityIndicator,
    ViewStyle,
    TextStyle
} from 'react-native';
import PagerView from 'react-native-pager-view';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { AntDesign } from '@expo/vector-icons';

// Components
import CalendarBody from '@/components/Calendar/CalendarBody';
import EventList from '@/components/Calendar/EventList';
import EventForm from '@/components/Calendar/EventForm';
import CustomBottomSheetModal, { CustomBottomSheetModalRef } from '@/components/CustomBottomSheetModal';
import { useTheme } from '@/components/ThemeProvider';

// Hooks
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';

// Types
import type { CalendarEvent } from '@/types/event';

dayjs.extend(isBetween);

// Virtual infinite scrolling: 5 years before and after current date (120 months total)
const MONTHS_RANGE = 60; // 5 years in each direction
const TOTAL_PAGES = MONTHS_RANGE * 2 + 1; // 121 pages total
const INITIAL_PAGE = MONTHS_RANGE; // Start at center (current month)

const CalendarView: React.FC = () => {
    // Get theme
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Get responsive dimensions
    const {
        width,
        headerHeight,
        horizontalPadding,
        titleFontSize,
        isSmallPhone,
        isTablet
    } = useResponsiveDimensions();

    const baseDate = useMemo(() => dayjs(), []);
    const [currentPage, setCurrentPage] = useState(INITIAL_PAGE);
    const [month, setMonth] = useState<string>(baseDate.format('MMMM YYYY'));
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const sheetRef = useRef<CustomBottomSheetModalRef>(null);
    const pagerRef = useRef<PagerView>(null);

    // Theme colors
    const colors = useMemo(() => ({
        background: isDark ? '#171717' : '#f8f9fa',
        headerBg: isDark ? '#262626' : '#fff',
        headerText: isDark ? '#e5e5e5' : '#2c3e50',
        modalText: isDark ? '#e5e5e5' : '#2c3e50'
    }), [isDark]);

    // Dynamic styles based on responsive dimensions
    const dynamicStyles = useMemo(() => ({
        container: {
            flex: 1,
            backgroundColor: colors.background
        } as ViewStyle,
        headerContainer: {
            height: headerHeight,
            paddingHorizontal: horizontalPadding,
            backgroundColor: colors.headerBg
        } as ViewStyle,
        headerMonthText: {
            fontSize: isSmallPhone ? 18 : isTablet ? 24 : 20,
            color: colors.headerText
        } as TextStyle,
        redDot: {
            width: isSmallPhone ? 8 : 10,
            height: isSmallPhone ? 8 : 10,
            borderRadius: isSmallPhone ? 4 : 5,
            marginRight: isSmallPhone ? 10 : 12
        } as ViewStyle,
        pageContainer: {
            width
        } as ViewStyle,
        modalHeaderText: {
            fontSize: isSmallPhone ? 18 : isTablet ? 26 : titleFontSize,
            color: colors.modalText
        } as TextStyle,
        sheetContent: {
            padding: isSmallPhone ? 12 : isTablet ? 24 : 16
        } as ViewStyle,
        addButtonSize: isSmallPhone ? 26 : isTablet ? 36 : 30
    }), [width, headerHeight, horizontalPadding, titleFontSize, isSmallPhone, isTablet, colors]);

    // Bottom sheet snap points - responsive
    const snapPoints = useMemo(() => {
        if (isTablet) {
            return ['70%', '100%'];
        }
        return ['100%'];
    }, [isTablet]);

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

    // Convert page index to month offset (relative to baseDate)
    const getMonthOffset = useCallback((pageIndex: number) => {
        return pageIndex - INITIAL_PAGE;
    }, []);

    // Get date from page index
    const getDateFromPageIndex = useCallback(
        (pageIndex: number) => {
            const offset = getMonthOffset(pageIndex);
            const newDate = baseDate.add(offset, 'month');
            return { year: newDate.year(), month: newDate.month() };
        },
        [baseDate, getMonthOffset]
    );

    // Handle page change from PagerView
    const handlePageSelected = useCallback(
        (e: { nativeEvent: { position: number } }) => {
            const pageIndex = e.nativeEvent.position;
            setCurrentPage(pageIndex);
            const { year, month: monthNum } = getDateFromPageIndex(pageIndex);
            setMonth(dayjs(`${year}-${monthNum + 1}-01`).format('MMMM YYYY'));
        },
        [getDateFromPageIndex]
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

    // Generate pages array for rendering
    const pages = useMemo(() => {
        return Array.from({ length: TOTAL_PAGES }, (_, i) => i);
    }, []);

    // Loading state
    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator
                    size="large"
                    color="#2ecc71"
                />
            </View>
        );
    }

    return (
        <View style={dynamicStyles.container}>
            {/* Header */}
            <View style={[styles.headerContainer, dynamicStyles.headerContainer]}>
                <View style={styles.headerLeft}>
                    <View style={[styles.redDot, dynamicStyles.redDot]} />
                    <Text style={[styles.headerMonthText, dynamicStyles.headerMonthText]}>
                        {month}
                    </Text>
                </View>
            </View>

            {/* Calendar with PagerView */}
            <PagerView
                ref={pagerRef}
                style={styles.pagerView}
                initialPage={INITIAL_PAGE}
                onPageSelected={handlePageSelected}
                offscreenPageLimit={3}
            >
                {pages.map((pageIndex) => {
                    const monthOffset = getMonthOffset(pageIndex);
                    return (
                        <View key={pageIndex} style={[styles.pageContainer, dynamicStyles.pageContainer]}>
                            <CalendarBody
                                index={monthOffset}
                                onSelectDate={handleSelectDate}
                                events={events as CalendarEvent[]}
                                isDark={isDark}
                            />
                        </View>
                    );
                })}
            </PagerView>

            {/* Bottom Sheet Modal */}
            <CustomBottomSheetModal
                ref={sheetRef}
                snapPoints={snapPoints}
            >
                <View
                    style={[styles.sheetContent, dynamicStyles.sheetContent]}
                >
                    {!showAddForm ? (
                        <>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalHeaderText, dynamicStyles.modalHeaderText]}>
                                    {formattedDate}
                                </Text>
                                <TouchableOpacity
                                    onPress={handleAddEvent}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    activeOpacity={0.7}
                                >
                                    <AntDesign
                                        name="plus-circle"
                                        size={dynamicStyles.addButtonSize}
                                        color="#2ecc71"
                                    />
                                </TouchableOpacity>
                            </View>
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
                </View>
            </CustomBottomSheetModal>
        </View>
    );
};

// Base styles (static)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
        backgroundColor: '#e74c3c',
        shadowColor: '#e74c3c',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 2
    },
    headerMonthText: {
        fontFamily: 'Kanit-Bold',
        color: '#2c3e50',
        letterSpacing: 0.5
    },
    pagerView: {
        flex: 1
    },
    pageContainer: {
        flex: 1
    },
    sheetContent: {
        flexGrow: 1
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
