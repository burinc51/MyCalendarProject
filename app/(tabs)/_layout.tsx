import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useTheme, useThemeColors } from '@/components/ThemeProvider';

export default function TabLayout() {
    const { theme } = useTheme();
    const colors = useThemeColors();

    return (
        <Tabs
            initialRouteName="index"
            screenOptions={{
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                    ios: {
                        // Use a transparent background on iOS to show the blur effect
                        position: 'absolute',
                        backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    },
                    default: {
                        backgroundColor: colors.surface,
                        borderTopColor: colors.border,
                    },
                }),
            }}
        >
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Notes',
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={28}
                            name="paperplane.fill"
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={28}
                            name="house.fill"
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="group"
                options={{
                    title: 'Group',
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={28}
                            name="rectangle.3.group.fill"
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="setting"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={28}
                            name="gearshape.fill"
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
