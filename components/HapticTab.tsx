import React, { useRef } from 'react';
import { Animated } from 'react-native';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = (ev: any) => {
        // Only animate if this tab is NOT already active
        if (!props.accessibilityState?.selected) {
            Animated.sequence([
                Animated.spring(scaleAnim, {
                    toValue: 0.82,
                    useNativeDriver: true,
                    speed: 50,
                    bounciness: 6,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    speed: 24,
                    bounciness: 14,
                }),
            ]).start();

            if (process.env.EXPO_OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        }
        props.onPressIn?.(ev);
    };

    return (
        <PlatformPressable
            {...props}
            onPressIn={handlePressIn}
            style={[
                props.style,
                { justifyContent: 'center', alignItems: 'center' },
            ]}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                {props.children}
            </Animated.View>
        </PlatformPressable>
    );
}
