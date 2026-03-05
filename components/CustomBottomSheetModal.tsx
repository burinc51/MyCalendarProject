/**
 * CustomBottomSheetModal Component
 * Simple modal alternative that works with Expo Go
 * Uses React Native's built-in Modal instead of @gorhom/bottom-sheet
 * Supports swipe-down to dismiss via PanResponder on the handle area
 */

import React, { forwardRef, useImperativeHandle, useState, useCallback, useRef } from 'react';
import {
    Modal,
    View,
    StyleSheet,
    TouchableWithoutFeedback,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    PanResponder
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type CustomBottomSheetModalRef = {
    present: () => void;
    dismiss: () => void;
};

type Props = {
    children: React.ReactNode;
    snapPoints?: (string | number)[];
    isDark?: boolean;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Threshold: drag more than this % of modal height → dismiss
const DISMISS_THRESHOLD = 0.25;

const CustomBottomSheetModal = forwardRef<CustomBottomSheetModalRef, Props>(
    ({ children, snapPoints = ['50%'], isDark = false }, ref) => {
        const [visible, setVisible] = useState(false);
        const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
        const insets = useSafeAreaInsets();

        // Calculate height from snapPoints — never exceed safe area
        const getModalHeight = useCallback(() => {
            const safeMax = SCREEN_HEIGHT - insets.top - 8;
            const firstSnapPoint = snapPoints[0];
            let h: number;
            if (typeof firstSnapPoint === 'string' && firstSnapPoint.endsWith('%')) {
                const percentage = parseInt(firstSnapPoint, 10) / 100;
                h = SCREEN_HEIGHT * percentage;
            } else if (typeof firstSnapPoint === 'number') {
                h = firstSnapPoint;
            } else {
                h = SCREEN_HEIGHT * 0.5;
            }
            return Math.min(h, safeMax);
        }, [snapPoints, insets.top]);

        const modalHeight = getModalHeight();
        const dismissThreshold = modalHeight * DISMISS_THRESHOLD;

        const present = useCallback(() => {
            slideAnim.setValue(SCREEN_HEIGHT);
            setVisible(true);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11
            }).start();
        }, [slideAnim]);

        const dismiss = useCallback(() => {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true
            }).start(() => {
                setVisible(false);
                slideAnim.setValue(SCREEN_HEIGHT);
            });
        }, [slideAnim]);

        useImperativeHandle(ref, () => ({ present, dismiss }));

        // PanResponder for swipe-down-to-dismiss on handle area
        const panResponder = useRef(
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5, // only capture downward drag
                onPanResponderMove: (_, gs) => {
                    if (gs.dy > 0) {
                        // Drag down: translate the sheet
                        slideAnim.setValue(gs.dy);
                    }
                },
                onPanResponderRelease: (_, gs) => {
                    if (gs.dy > dismissThreshold || gs.vy > 0.5) {
                        // Fast swipe or dragged past threshold → dismiss
                        Animated.timing(slideAnim, {
                            toValue: SCREEN_HEIGHT,
                            duration: 200,
                            useNativeDriver: true
                        }).start(() => {
                            setVisible(false);
                            slideAnim.setValue(SCREEN_HEIGHT);
                        });
                    } else {
                        // Snap back to open position
                        Animated.spring(slideAnim, {
                            toValue: 0,
                            useNativeDriver: true,
                            tension: 80,
                            friction: 12
                        }).start();
                    }
                }
            })
        ).current;

        const bg = isDark ? '#1a1a1a' : '#ffffff';
        const handleColor = isDark ? '#555' : '#d0d0d0';

        return (
            <Modal
                visible={visible}
                transparent
                animationType="none"
                onRequestClose={dismiss}
                statusBarTranslucent
            >
                <TouchableWithoutFeedback onPress={dismiss}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                            <Animated.View
                                style={[
                                    styles.modalContainer,
                                    {
                                        height: modalHeight,
                                        backgroundColor: bg,
                                        paddingBottom: insets.bottom || 16,
                                        transform: [{ translateY: slideAnim }]
                                    }
                                ]}
                            >
                                {/* Draggable handle — PanResponder captures here */}
                                <View style={styles.handle} {...panResponder.panHandlers}>
                                    <View style={[styles.handleIndicator, { backgroundColor: handleColor }]} />
                                </View>

                                {/* Content */}
                                <KeyboardAvoidingView
                                    style={styles.contentContainer}
                                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                                >
                                    <ScrollView
                                        style={styles.scrollView}
                                        contentContainerStyle={styles.scrollContent}
                                        showsVerticalScrollIndicator={false}
                                        keyboardShouldPersistTaps="handled"
                                    >
                                        {children}
                                    </ScrollView>
                                </KeyboardAvoidingView>
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        );
    }
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 16,
    },
    handle: {
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        // Make hit area taller for easier grab
        paddingVertical: 8,
    },
    handleIndicator: {
        width: 44,
        height: 5,
        borderRadius: 3,
    },
    contentContainer: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
});

export default CustomBottomSheetModal;
