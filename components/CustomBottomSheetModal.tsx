/**
 * CustomBottomSheetModal Component
 * Simple modal alternative that works with Expo Go
 * Uses React Native's built-in Modal instead of @gorhom/bottom-sheet
 */

import React, { forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import {
    Modal,
    View,
    StyleSheet,
    TouchableWithoutFeedback,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type CustomBottomSheetModalRef = {
    present: () => void;
    dismiss: () => void;
};

type Props = {
    children: React.ReactNode;
    snapPoints?: (string | number)[];
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CustomBottomSheetModal = forwardRef<CustomBottomSheetModalRef, Props>(({ children, snapPoints = ['50%'] }, ref) => {
    const [visible, setVisible] = useState(false);
    const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
    const insets = useSafeAreaInsets();

    // Calculate height from snapPoints
    const getModalHeight = useCallback(() => {
        const firstSnapPoint = snapPoints[0];
        if (typeof firstSnapPoint === 'string' && firstSnapPoint.endsWith('%')) {
            const percentage = parseInt(firstSnapPoint, 10) / 100;
            return SCREEN_HEIGHT * percentage;
        }
        if (typeof firstSnapPoint === 'number') {
            return firstSnapPoint;
        }
        return SCREEN_HEIGHT * 0.5;
    }, [snapPoints]);

    const modalHeight = getModalHeight();

    const present = useCallback(() => {
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
        });
    }, [slideAnim]);

    useImperativeHandle(ref, () => ({
        present,
        dismiss,
    }));

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
                                    paddingBottom: insets.bottom,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                        >
                            {/* Handle */}
                            <View style={styles.handle}>
                                <View style={styles.handleIndicator} />
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
});

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
    },
    handle: {
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    handleIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#ccc',
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
