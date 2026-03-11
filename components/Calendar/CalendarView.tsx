/**
 * CalendarView Component
 * Multi-view calendar: Day, Week, Month, Year
 * Header: tappable month/year picker + view-mode toggle button
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    BackHandler,
    TouchableOpacity,
    Modal,
    Animated,
    ViewStyle,
    TextStyle
} from 'react-native';
import PagerView from 'react-native-pager-view';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import CalendarBody from '@/components/Calendar/CalendarBody';
import EventList from '@/components/Calendar/EventList';
import CalendarDayView from '@/components/Calendar/CalendarDayView';
import CalendarWeekView from '@/components/Calendar/CalendarWeekView';
import CalendarYearView from '@/components/Calendar/CalendarYearView';
import MonthYearPicker, { PickerMode } from '@/components/Calendar/MonthYearPicker';
import CustomBottomSheetModal, { CustomBottomSheetModalRef } from '@/components/CustomBottomSheetModal';
import { useTheme } from '@/components/ThemeProvider';
import { monthNames } from '@/utils/month-names';
import Sidebar from '@/components/Sidebar';

// Hooks
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';

// Stores
import { useEventActionStore } from '@/stores/useEventActionStore';

// Types
import type { CalendarEvent } from '@/types/event';

dayjs.extend(isBetween);

// 2 years in each direction = 49 pages (was 60 = 121 pages)
const MONTHS_RANGE = 24;
const TOTAL_PAGES = MONTHS_RANGE * 2 + 1;
const INITIAL_PAGE = MONTHS_RANGE;
// Number of pages around currentPage to render actual content (rest are empty Views)
const RENDER_WINDOW = 8;

// Day view pager: 1 year in each direction
const DAYS_RANGE = 365;
const DAY_TOTAL_PAGES = DAYS_RANGE * 2 + 1;
const DAY_INITIAL_PAGE = DAYS_RANGE;
const DAY_RENDER_WINDOW = 3;

// Week view pager: 2 years (104 weeks) in each direction
const WEEKS_RANGE = 104;
const WEEK_TOTAL_PAGES = WEEKS_RANGE * 2 + 1;
const WEEK_INITIAL_PAGE = WEEKS_RANGE;
const WEEK_RENDER_WINDOW = 3;

export type ViewMode = 'month' | 'week' | 'day' | 'year';

const VIEW_MODES: { label: string; value: ViewMode; icon: string }[] = [
    { label: 'Day', value: 'day', icon: 'calendar' },
    { label: 'Week', value: 'week', icon: 'bars' },
    { label: 'Month', value: 'month', icon: 'table' },
    { label: 'Year', value: 'year', icon: 'database' }
];

const CalendarView: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const { width, headerHeight, horizontalPadding, titleFontSize, isSmallPhone, isTablet } =
        useResponsiveDimensions();

    const baseDate = useMemo(() => dayjs(), []);
    const [currentPage, setCurrentPage] = useState(INITIAL_PAGE);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const sheetRef = useRef<CustomBottomSheetModalRef>(null);
    const pagerRef = useRef<PagerView>(null);
    const pendingMonthNav = useRef<{ page: number } | null>(null);
    // Ref that always holds the latest currentPage (avoids stale closure in effects)
    const currentPageRef = useRef(INITIAL_PAGE);

    // Day view pager
    const dayPagerRef = useRef<PagerView>(null);
    const [dayCurrentPage, setDayCurrentPage] = useState(DAY_INITIAL_PAGE);
    const dayCurrentPageRef = useRef(DAY_INITIAL_PAGE);

    // Week view pager
    const weekPagerRef = useRef<PagerView>(null);
    const [weekCurrentPage, setWeekCurrentPage] = useState(WEEK_INITIAL_PAGE);
    const weekCurrentPageRef = useRef(WEEK_INITIAL_PAGE);

    // Multi-view state
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [focusDate, setFocusDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [showPicker, setShowPicker] = useState(false);
    const [showViewMenu, setShowViewMenu] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const arrowAnim = useRef(new Animated.Value(0)).current;

    const colors = useMemo(() => ({
        background: isDark ? '#171717' : '#f8f9fa',
        headerBg: isDark ? '#262626' : '#fff',
        headerText: isDark ? '#e5e5e5' : '#2c3e50',
        modalText: isDark ? '#e5e5e5' : '#2c3e50',
        menuBg: isDark ? '#1e1e1e' : '#fff',
        menuBorder: isDark ? '#333' : '#e0e0e0',
        menuText: isDark ? '#e5e5e5' : '#333',
        menuActiveBg: isDark ? '#2ecc7120' : '#2ecc7115',
        menuActiveText: '#2ecc71',
        menuDivider: isDark ? '#2a2a2a' : '#f0f0f0'
    }), [isDark]);

    const dynamicStyles = useMemo(() => ({
        container: { flex: 1, backgroundColor: colors.background } as ViewStyle,
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
            width: isSmallPhone ? 8 : 10, height: isSmallPhone ? 8 : 10,
            borderRadius: isSmallPhone ? 4 : 5, marginRight: isSmallPhone ? 10 : 12
        } as ViewStyle,
        pageContainer: { width } as ViewStyle,
        modalHeaderText: {
            fontSize: isSmallPhone ? 18 : isTablet ? 26 : titleFontSize,
            color: colors.modalText
        } as TextStyle,
        sheetContent: { padding: isSmallPhone ? 12 : isTablet ? 24 : 16 } as ViewStyle,
        addButtonSize: isSmallPhone ? 26 : isTablet ? 36 : 30
    }), [width, headerHeight, horizontalPadding, titleFontSize, isSmallPhone, isTablet, colors]);

    const snapPoints = useMemo(() => (isTablet ? ['70%', '100%'] : ['100%']), [isTablet]);

    // Hook for events
    const {
        events, isLoading, handleDeleteEvent, handleEditEvent
    } = useCalendarEvents();

    // Subscribe to edit/delete actions triggered from EventDetailScreen
    const { pendingAction, pendingEvent, clearAction } = useEventActionStore();
    useEffect(() => {
        if (!pendingAction || !pendingEvent) return;
        if (pendingAction === 'edit') {
            // Navigate to create screen with event data for editing
            router.push({
                pathname: '/event/create',
                params: { event: JSON.stringify(pendingEvent) },
            });
        } else if (pendingAction === 'delete') {
            handleDeleteEvent(pendingEvent.id);
        }
        clearAction();
    }, [pendingAction, pendingEvent]);

    // ----- Display month/year derived from current view -----
    const getDateFromPageIndex = useCallback((pageIndex: number) => {
        const offset = pageIndex - INITIAL_PAGE;
        const d = baseDate.add(offset, 'month');
        return { year: d.year(), month: d.month() };
    }, [baseDate]);

    // Day pager helpers
    const getDateFromDayPage = useCallback((page: number) => {
        const offset = page - DAY_INITIAL_PAGE;
        return baseDate.add(offset, 'day').format('YYYY-MM-DD');
    }, [baseDate]);

    const getDayPageFromDate = useCallback((dateStr: string) => {
        const diff = dayjs(dateStr).diff(baseDate.startOf('day'), 'day');
        return DAY_INITIAL_PAGE + diff;
    }, [baseDate]);

    const dayPages = useMemo(() => Array.from({ length: DAY_TOTAL_PAGES }, (_, i) => i), []);

    // Week pager helpers
    const getDateFromWeekPage = useCallback((page: number) => {
        const offset = page - WEEK_INITIAL_PAGE;
        return baseDate.startOf('week').add(offset, 'week').format('YYYY-MM-DD');
    }, [baseDate]);

    const getWeekPageFromDate = useCallback((dateStr: string) => {
        const weekOf = dayjs(dateStr).startOf('week');
        const diff = weekOf.diff(baseDate.startOf('week'), 'week');
        return WEEK_INITIAL_PAGE + diff;
    }, [baseDate]);

    const weekPages = useMemo(() => Array.from({ length: WEEK_TOTAL_PAGES }, (_, i) => i), []);

    const { year: displayYear, month: displayMonth } = useMemo(() => {
        if (viewMode === 'month') return getDateFromPageIndex(currentPage);
        const fd = dayjs(focusDate);
        return { year: fd.year(), month: fd.month() };
    }, [viewMode, currentPage, focusDate, getDateFromPageIndex]);

    const headerTitle = useMemo(() => {
        if (viewMode === 'year') {
            return `${displayYear}`;
        }
        return `${monthNames.en[displayMonth]} ${displayYear}`;
    }, [viewMode, displayMonth, displayYear, focusDate]);

    // Toggle picker arrow animation
    const togglePicker = useCallback(() => {
        const toValue = showPicker ? 0 : 1;
        setShowPicker(v => !v);
        Animated.timing(arrowAnim, { toValue, duration: 200, useNativeDriver: true }).start();
    }, [showPicker, arrowAnim]);

    const arrowRotate = arrowAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

    // Navigate Month view to specific year/month
    // PagerView is always mounted so pagerRef is always available
    const navigateToMonthYear = useCallback((year: number, month: number) => {
        const targetDate = dayjs(`${year}-${month + 1}-01`);
        const diff = targetDate.diff(baseDate.startOf('month'), 'month');
        const targetPage = INITIAL_PAGE + diff;
        setCurrentPage(targetPage);
        pagerRef.current?.setPageWithoutAnimation(targetPage);
    }, [baseDate]);

    // Picker mode adapts to active view
    const pickerMode: PickerMode = useMemo(() => {
        if (viewMode === 'year') return 'yearOnly';
        if (viewMode === 'day') return 'dayMonthYear';
        return 'monthYear'; // month & week views
    }, [viewMode]);

    // Current day for the picker (used in Day view)
    const currentDay = useMemo(() => dayjs(focusDate).date(), [focusDate]);

    // Picker select handler
    const handlePickerSelect = useCallback((year: number, month: number, day?: number) => {
        if (viewMode === 'month') {
            navigateToMonthYear(year, month);
        } else if (viewMode === 'day' && day !== undefined) {
            // Navigate to the specific day selected
            setFocusDate(dayjs(`${year}-${month + 1}-${day}`).format('YYYY-MM-DD'));
        } else {
            // week / year views — jump to the selected month/year
            setFocusDate(dayjs(`${year}-${month + 1}-01`).format('YYYY-MM-DD'));
        }
    }, [viewMode, navigateToMonthYear]);

    // View mode switch
    const handleSwitchMode = useCallback((mode: ViewMode) => {
        setShowViewMenu(false);
        if (mode === viewMode) return;
        if (mode !== 'month') {
            pendingMonthNav.current = { page: currentPageRef.current };

            if (selectedDate) {
                setFocusDate(selectedDate);
            } else {
                const today = dayjs();
                const { year, month } = getDateFromPageIndex(currentPageRef.current);
                if (today.year() === year && today.month() === month) {
                    setFocusDate(today.format('YYYY-MM-DD'));
                } else {
                    setFocusDate(dayjs(`${year}-${month + 1}-01`).format('YYYY-MM-DD'));
                }
            }
        } else {
            pendingMonthNav.current = { page: currentPageRef.current };
        }
        setViewMode(mode);
    }, [viewMode, selectedDate, getDateFromPageIndex]);

    // Year view: tap a month → switch to month view
    const handleSelectMonthFromYear = useCallback((month: number) => {
        const fd = dayjs(focusDate);
        const targetDate = dayjs(`${fd.year()}-${month + 1}-01`);
        const diff = targetDate.diff(baseDate.startOf('month'), 'month');
        const targetPage = INITIAL_PAGE + diff;
        pendingMonthNav.current = { page: targetPage };
        setCurrentPage(targetPage);
        setViewMode('month');
    }, [focusDate, baseDate]);

    // Keep currentPageRef in sync with currentPage state
    useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

    useEffect(() => {
        if (viewMode === 'month') {
            const page = pendingMonthNav.current?.page ?? currentPageRef.current;
            pendingMonthNav.current = null;
            requestAnimationFrame(() => {
                pagerRef.current?.setPageWithoutAnimation(page);
            });
        }
    }, [viewMode]);

    // Page change (month view)
    // Guard: ignore the reset event fired by PagerView when display:none is toggled
    const handlePageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
        if (pendingMonthNav.current !== null) return; // restore in-flight, skip reset event
        setCurrentPage(e.nativeEvent.position);
    }, []);

    // Day pager: sync to focusDate when entering day view
    useEffect(() => {
        if (viewMode !== 'day') return;
        const targetPage = getDayPageFromDate(focusDate);
        dayCurrentPageRef.current = targetPage;
        setDayCurrentPage(targetPage);
        requestAnimationFrame(() => {
            dayPagerRef.current?.setPageWithoutAnimation(targetPage);
        });
    }, [viewMode]); // focusDate intentionally omitted — only sync on view switch, not on every swipe

    // Day pager: update focusDate when the user swipes
    const handleDayPageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
        const page = e.nativeEvent.position;
        dayCurrentPageRef.current = page;
        setDayCurrentPage(page);
        setFocusDate(getDateFromDayPage(page));
    }, [getDateFromDayPage]);

    // Week pager: sync to focusDate when entering week view
    useEffect(() => {
        if (viewMode !== 'week') return;
        const targetPage = getWeekPageFromDate(focusDate);
        weekCurrentPageRef.current = targetPage;
        setWeekCurrentPage(targetPage);
        requestAnimationFrame(() => {
            weekPagerRef.current?.setPageWithoutAnimation(targetPage);
        });
    }, [viewMode]); // focusDate intentionally omitted — only sync on view switch

    // Week pager: update focusDate when the user swipes
    const handleWeekPageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
        const page = e.nativeEvent.position;
        weekCurrentPageRef.current = page;
        setWeekCurrentPage(page);
        setFocusDate(getDateFromWeekPage(page));
    }, [getDateFromWeekPage]);

    // Date selection (month/week view)
    const handleSelectDate = useCallback((date: string) => {
        sheetRef?.current?.present();
        setSelectedDate(date);
        if (viewMode !== 'month') setFocusDate(date);
    }, [viewMode]);

    const closePanel = useCallback(() => {
        sheetRef?.current?.dismiss();
        setSelectedDate(null);
    }, []);

    useEffect(() => {
        const h = BackHandler.addEventListener('hardwareBackPress', () => {
            if (sheetRef.current) { closePanel(); return true; }
            return false;
        });
        return () => h.remove();
    }, [closePanel]);

    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];
        const day = dayjs(selectedDate);
        return events.filter(event =>
            day.isBetween(dayjs(event.startDate), dayjs(event.endDate), 'day', '[]')
        );
    }, [selectedDate, events]);

    const handleAddEvent = useCallback(() => {
        if (!selectedDate) return;
        router.push({
            pathname: '/event/create',
            params: { date: selectedDate },
        });
    }, [selectedDate, router]);

    const formattedDate = useMemo(
        () => selectedDate ? dayjs(selectedDate).format('dddd D MMMM') : 'No Date Selected',
        [selectedDate]
    );


    const pages = useMemo(() => Array.from({ length: TOTAL_PAGES }, (_, i) => i), []);

    // Week view: day header tap → Day view
    const handleWeekDaySelect = useCallback((date: string) => {
        setFocusDate(date);
        setViewMode('day');
    }, []);

    // if (isLoading) {
    //     return (
    //         <View style={[styles.centered, { backgroundColor: colors.background }]}>
    //             <ActivityIndicator size="large" color="#2ecc71" />
    //         </View>
    //     );
    // }

    const currentViewMode = VIEW_MODES.find(m => m.value === viewMode)!;

    return (
        <View style={dynamicStyles.container}>
            {/* ── Sidebar ── */}
            <Sidebar
                visible={showSidebar}
                onClose={() => setShowSidebar(false)}
            />

            {/* ── Header ── */}
            <View style={[styles.headerContainer, dynamicStyles.headerContainer]}>
                {/* Left: hamburger + tappable month/year + arrow */}
                <TouchableOpacity
                    style={styles.hamburgerBtn}
                    onPress={() => setShowSidebar(true)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <AntDesign name="menu-fold" size={22} color="#2ecc71" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.headerLeft} onPress={togglePicker} activeOpacity={0.7}>
                    <Text style={[styles.headerMonthText, dynamicStyles.headerMonthText]}>
                        {headerTitle}
                    </Text>
                    <Animated.View style={{ transform: [{ rotate: arrowRotate }], marginLeft: 4 }}>
                        <AntDesign name="caret-down" size={12} color={colors.headerText} />
                    </Animated.View>
                </TouchableOpacity>

                {/* Right: view mode toggle button */}
                <TouchableOpacity
                    style={[styles.viewModeBtn, { borderColor: colors.menuBorder }]}
                    onPress={() => setShowViewMenu(v => !v)}
                    activeOpacity={0.7}
                >
                    <AntDesign name={currentViewMode.icon as any} size={14} color="#2ecc71" />
                    <Text style={[styles.viewModeBtnText, { color: colors.headerText }]}>
                        {currentViewMode.label}
                    </Text>
                    <AntDesign name="down" size={10} color={colors.headerText} style={{ marginLeft: 2 }} />
                </TouchableOpacity>
            </View>

            {/* MonthYearPicker overlay — columns adapt to current view mode */}
            <MonthYearPicker
                visible={showPicker}
                mode={pickerMode}
                currentYear={displayYear}
                currentMonth={displayMonth}
                currentDay={currentDay}
                isDark={isDark}
                onSelect={handlePickerSelect}
                onDismiss={() => { setShowPicker(false); Animated.timing(arrowAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(); }}
            />

            {/* View mode dropdown menu */}
            <Modal transparent visible={showViewMenu} animationType="fade" onRequestClose={() => setShowViewMenu(false)}>
                <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setShowViewMenu(false)}>
                    <View style={[styles.viewMenu, {
                        backgroundColor: colors.menuBg,
                        borderColor: colors.menuBorder,
                        right: horizontalPadding
                    }]}>
                        {VIEW_MODES.map((m, i) => {
                            const isActive = m.value === viewMode;
                            return (
                                <TouchableOpacity
                                    key={m.value}
                                    style={[
                                        styles.menuItem,
                                        isActive && { backgroundColor: colors.menuActiveBg },
                                        i < VIEW_MODES.length - 1 && [styles.menuItemBorder, { borderBottomColor: colors.menuDivider }]
                                    ]}
                                    onPress={() => handleSwitchMode(m.value)}
                                    activeOpacity={0.7}
                                >
                                    <AntDesign
                                        name={m.icon as any}
                                        size={16}
                                        color={isActive ? '#2ecc71' : colors.menuText}
                                        style={{ marginRight: 10 }}
                                    />
                                    <Text style={[styles.menuItemText, {
                                        color: isActive ? colors.menuActiveText : colors.menuText,
                                        fontFamily: isActive ? 'Kanit-Bold' : 'Kanit-Regular'
                                    }]}>
                                        {m.label}
                                    </Text>
                                    {isActive && (
                                        <AntDesign name="check" size={14} color="#2ecc71" style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── Body: PagerView always mounted, hidden when not in month view ── */}
            <PagerView
                ref={pagerRef}
                style={[styles.pagerView, viewMode !== 'month' && styles.hidden]}
                initialPage={INITIAL_PAGE}
                onPageSelected={handlePageSelected}
                offscreenPageLimit={3}
            >
                {pages.map((pageIndex) => {
                    const offset = pageIndex - INITIAL_PAGE;
                    // Only mount CalendarBody within ±RENDER_WINDOW of the current page
                    // Pages outside the window render as empty Views (much cheaper)
                    const inWindow = Math.abs(pageIndex - currentPage) <= RENDER_WINDOW;
                    return (
                        <View key={pageIndex} style={[styles.pageContainer, dynamicStyles.pageContainer]}>
                            {inWindow && (
                                <CalendarBody
                                    index={offset}
                                    onSelectDate={handleSelectDate}
                                    events={events as CalendarEvent[]}
                                    isDark={isDark}
                                />
                            )}
                        </View>
                    );
                })}
            </PagerView>

            {/* Day view — PagerView for left/right swipe between days */}
            {viewMode === 'day' && (
                <PagerView
                    ref={dayPagerRef}
                    style={styles.pagerView}
                    initialPage={DAY_INITIAL_PAGE}
                    onPageSelected={handleDayPageSelected}
                    offscreenPageLimit={2}
                >
                    {dayPages.map((pageIndex) => {
                        const inWindow = Math.abs(pageIndex - dayCurrentPage) <= DAY_RENDER_WINDOW;
                        return (
                            <View key={pageIndex} style={styles.pageContainer}>
                                {inWindow && (
                                    <CalendarDayView
                                        date={getDateFromDayPage(pageIndex)}
                                        events={events}
                                        isDark={isDark}
                                    />
                                )}
                            </View>
                        );
                    })}
                </PagerView>
            )}

            {/* Week view — PagerView for left/right swipe between weeks */}
            {viewMode === 'week' && (
                <PagerView
                    ref={weekPagerRef}
                    style={styles.pagerView}
                    initialPage={WEEK_INITIAL_PAGE}
                    onPageSelected={handleWeekPageSelected}
                    offscreenPageLimit={2}
                >
                    {weekPages.map((pageIndex) => {
                        const inWindow = Math.abs(pageIndex - weekCurrentPage) <= WEEK_RENDER_WINDOW;
                        return (
                            <View key={pageIndex} style={styles.pageContainer}>
                                {inWindow && (
                                    <CalendarWeekView
                                        focusDate={getDateFromWeekPage(pageIndex)}
                                        events={events}
                                        isDark={isDark}
                                        onSelectDate={handleWeekDaySelect}
                                    />
                                )}
                            </View>
                        );
                    })}
                </PagerView>
            )}

            {viewMode === 'year' && (
                <CalendarYearView
                    year={displayYear}
                    events={events}
                    isDark={isDark}
                    onSelectMonth={handleSelectMonthFromYear}
                />
            )}

            {/* Bottom Sheet (month view only) */}
            {viewMode === 'month' && (
                <CustomBottomSheetModal ref={sheetRef} snapPoints={snapPoints} isDark={isDark}>
                    <View style={[styles.sheetContent, dynamicStyles.sheetContent]}>
                        {/* Sheet header */}
                        <View style={[
                            styles.modalHeader,
                            { borderBottomColor: isDark ? '#333' : '#f0f0f0' }
                        ]}>
                            <View style={styles.modalHeaderLeft}>
                                <View style={[
                                    styles.modalAccentBar,
                                    { backgroundColor: '#2ecc71' }
                                ]} />
                                <Text style={[
                                    styles.modalHeaderText,
                                    dynamicStyles.modalHeaderText,
                                    { color: isDark ? '#f0f0f0' : '#1a1a2e' }
                                ]}>
                                    {formattedDate}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleAddEvent}
                                style={[
                                    styles.addButton,
                                    {
                                        backgroundColor: isDark ? '#1a3d2a' : '#eafaf1',
                                        borderColor: isDark ? '#2ecc71aa' : '#2ecc7160'
                                    }
                                ]}
                                activeOpacity={0.7}
                            >
                                <AntDesign name="plus" size={18} color="#2ecc71" />
                            </TouchableOpacity>
                        </View>
                        <EventList
                            events={selectedDateEvents}
                            onEdit={handleEditEvent}
                            onDelete={handleDeleteEvent}
                            isDark={isDark}
                        />
                    </View>
                </CustomBottomSheetModal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    hamburgerBtn: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        paddingVertical: 4,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
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
    viewModeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 4
    },
    viewModeBtnText: {
        fontSize: 13,
        fontFamily: 'Kanit-Regular'
    },
    menuBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    viewMenu: {
        position: 'absolute',
        top: 58,
        width: 160,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12
    },
    menuItemBorder: { borderBottomWidth: 1 },
    menuItemText: { fontSize: 14 },
    pagerView: { flex: 1 },
    hidden: { display: 'none' },
    pageContainer: { flex: 1 },
    sheetContent: { flexGrow: 1 },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
    },
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    modalAccentBar: {
        width: 4,
        height: 22,
        borderRadius: 2,
    },
    modalHeaderText: {
        fontFamily: 'Kanit-Bold',
        color: '#1a1a2e',
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CalendarView;
