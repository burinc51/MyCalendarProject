import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useTheme } from '@/components/ThemeProvider';

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <Tabs
            initialRouteName="index"
            screenOptions={{
                tabBarActiveTintColor: '#007aff',
                tabBarInactiveTintColor: isDark ? '#6b7280' : '#8e8e93',
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                    ios: {
                        position: 'absolute',
                        backgroundColor: isDark ? 'rgba(23,23,23,0.95)' : 'rgba(255,255,255,0.92)',
                        borderTopWidth: 0,
                        shadowColor: '#000',
                        shadowOpacity: isDark ? 0.3 : 0.08,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: -2 },
                        elevation: 10,
                        height: 70 + insets.bottom,
                        paddingBottom: insets.bottom + 8,
                        borderTopColor: isDark ? '#262626' : '#e0e0e0'
                    },
                    android: {
                        backgroundColor: isDark ? '#171717' : '#fff',
                        borderTopColor: isDark ? '#262626' : '#e0e0e0',
                        elevation: 10,
                        height: 70
                    }
                }),
                tabBarLabelStyle: {
                    fontSize: 13,
                    fontWeight: '600',
                    marginBottom: 6,
                    letterSpacing: 0.3
                }
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
                    tabBarAccessibilityLabel: 'Notes Tab'
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
                    tabBarAccessibilityLabel: 'Home Tab'
                }}
            />
            <Tabs.Screen
                name="activity"
                options={{
                    title: 'Activity',
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={28}
                            name="bell.fill"
                            color={color}
                        />
                    ),
                    tabBarAccessibilityLabel: 'Activity Tab'
                }}
            />
            {/* Hidden screens — still routable but not shown in tab bar */}
            <Tabs.Screen
                name="group"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="setting"
                options={{ href: null }}
            />
        </Tabs>
    );
}
