/**
 * Lightweight Toast notification component
 * Auto-dismisses after a short duration — no user interaction needed.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Animated, Text, StyleSheet, Platform } from 'react-native';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
    id: number;
    text: string;
    type: ToastType;
}

interface ToastProps {
    message: ToastMessage | null;
    duration?: number;
    onHide?: () => void;
}

const TOAST_COLORS: Record<ToastType, { bg: string; text: string; icon: string }> = {
    success: { bg: '#2ecc71', text: '#fff', icon: '✓' },
    error: { bg: '#e74c3c', text: '#fff', icon: '✕' },
    info: { bg: '#3498db', text: '#fff', icon: 'ℹ' },
};

const Toast: React.FC<ToastProps> = ({ message, duration = 2000, onHide }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-30)).current;

    const hide = useCallback(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: -30, duration: 250, useNativeDriver: true }),
        ]).start(() => onHide?.());
    }, [opacity, translateY, onHide]);

    useEffect(() => {
        if (!message) return;

        // Reset + animate in
        opacity.setValue(0);
        translateY.setValue(-30);

        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();

        const timer = setTimeout(hide, duration);
        return () => clearTimeout(timer);
    }, [message, duration, hide, opacity, translateY]);
 
    if (!message) return null;

    const colors = TOAST_COLORS[message.type];

    return (
        <Animated.View
            style={[
                styles.container,
                { backgroundColor: colors.bg, opacity, transform: [{ translateY }] },
            ]}
            pointerEvents="none"
        >
            <Text style={[styles.icon, { color: colors.text }]}>{colors.icon}</Text>
            <Text style={[styles.text, { color: colors.text }]}>{message.text}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 24,
        right: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        zIndex: 9999,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    icon: {
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
});

export default Toast;


import { useState } from 'react';

let nextId = 0;

export function useToast() {
    const [toast, setToast] = useState<ToastMessage | null>(null);

    const show = useCallback((text: string, type: ToastType = 'success') => {
        setToast({ id: ++nextId, text, type });
    }, []);

    const hide = useCallback(() => setToast(null), []);

    return { toast, showToast: show, hideToast: hide };
}
