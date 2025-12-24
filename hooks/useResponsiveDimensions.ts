/**
 * useResponsiveDimensions Hook
 * Provides dynamic, responsive dimensions for calendar components
 * Handles screen size changes, orientation changes, and device breakpoints
 */

import { useMemo } from 'react';
import { useWindowDimensions, Platform, StatusBar } from 'react-native';

// Device breakpoints
export const BREAKPOINTS = {
    SMALL_PHONE: 375,
    PHONE: 768,
    TABLET: 1024
} as const;

// Device types
export type DeviceType = 'smallPhone' | 'phone' | 'tablet';
export type Orientation = 'portrait' | 'landscape';

interface ResponsiveDimensions {
    // Screen dimensions
    width: number;
    height: number;

    // Device info
    deviceType: DeviceType;
    orientation: Orientation;
    isSmallPhone: boolean;
    isTablet: boolean;

    // Layout constants - header and navigation
    headerHeight: number;
    navbarHeight: number;
    statusBarHeight: number;

    // Calendar specific
    weekdayHeaderHeight: number;
    availableHeight: number;
    weeksToDisplay: number;
    dayCellHeight: number;
    dayCellWidth: number;

    // Font scales
    fontScale: number;
    baseFontSize: number;
    smallFontSize: number;
    largeFontSize: number;
    titleFontSize: number;

    // Spacing
    horizontalPadding: number;
    verticalPadding: number;
    itemSpacing: number;

    // Touch targets (minimum 44pt for iOS HIG)
    minTouchTarget: number;

    // Event styling
    eventHeight: number;
    eventFontSize: number;
    eventTopOffset: number;
    eventRowHeight: number;

    // Today indicator
    todayIndicatorSize: number;
}

export function useResponsiveDimensions(): ResponsiveDimensions {
    const { width, height } = useWindowDimensions();

    return useMemo(() => {
        // Determine device type and orientation
        const orientation: Orientation = width > height ? 'landscape' : 'portrait';
        const effectiveWidth = Math.min(width, height); // Use smallest dimension for breakpoints

        let deviceType: DeviceType;
        if (effectiveWidth < BREAKPOINTS.SMALL_PHONE) {
            deviceType = 'smallPhone';
        } else if (effectiveWidth < BREAKPOINTS.PHONE) {
            deviceType = 'phone';
        } else {
            deviceType = 'tablet';
        }

        const isSmallPhone = deviceType === 'smallPhone';
        const isTablet = deviceType === 'tablet';

        // Status bar height
        const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

        // Calculate scale factor based on screen width
        // Base: iPhone 11/12 Pro (390px width)
        const baseWidth = 390;
        const scaleFactor = Math.min(Math.max(width / baseWidth, 0.85), 1.3);

        // Layout constants - responsive
        const headerHeight = Math.round(60 * scaleFactor);
        const navbarHeight = Platform.OS === 'ios' ? 83 : 56;
        const weekdayHeaderHeight = Math.round(28 * scaleFactor);

        // Calculate weeks to display (always 6 for consistency)
        const weeksToDisplay = 6;

        // Available height for calendar grid
        const availableHeight = height - headerHeight - navbarHeight - weekdayHeaderHeight - statusBarHeight;

        // Cell dimensions
        const dayCellHeight = Math.floor(availableHeight / weeksToDisplay);
        const dayCellWidth = Math.floor(width / 7);

        // Font scaling
        const fontScale = scaleFactor;
        const baseFontSize = Math.round(14 * fontScale);
        const smallFontSize = Math.round(11 * fontScale);
        const largeFontSize = Math.round(18 * fontScale);
        const titleFontSize = Math.round(22 * fontScale);

        // Spacing
        const horizontalPadding = Math.round(16 * scaleFactor);
        const verticalPadding = Math.round(12 * scaleFactor);
        const itemSpacing = Math.round(8 * scaleFactor);

        // Touch targets (minimum 44pt)
        const minTouchTarget = Math.max(44, Math.round(44 * scaleFactor));

        // Event styling - responsive
        const eventHeight = Math.round(16 * scaleFactor);
        const eventFontSize = Math.round(10 * fontScale);
        const eventTopOffset = Math.round(24 * scaleFactor);
        const eventRowHeight = Math.round(18 * scaleFactor);

        // Today indicator
        const todayIndicatorSize = Math.round(20 * scaleFactor);

        return {
            // Screen dimensions
            width,
            height,

            // Device info
            deviceType,
            orientation,
            isSmallPhone,
            isTablet,

            // Layout constants
            headerHeight,
            navbarHeight,
            statusBarHeight,

            // Calendar specific
            weekdayHeaderHeight,
            availableHeight,
            weeksToDisplay,
            dayCellHeight,
            dayCellWidth,

            // Font scales
            fontScale,
            baseFontSize,
            smallFontSize,
            largeFontSize,
            titleFontSize,

            // Spacing
            horizontalPadding,
            verticalPadding,
            itemSpacing,

            // Touch targets
            minTouchTarget,

            // Event styling
            eventHeight,
            eventFontSize,
            eventTopOffset,
            eventRowHeight,

            // Today indicator
            todayIndicatorSize
        };
    }, [width, height]);
}

export default useResponsiveDimensions;
