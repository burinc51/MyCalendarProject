import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useTheme } from '@/components/ThemeProvider';

// Custom tab icon with active indicator dot
function TabIcon({ name, color }: { name: React.ComponentProps<typeof Feather>['name']; color: string; }) {
    return (
        <View style={tabIconStyles.wrap}>
            <Feather name={name} size={22} color={color} />
        </View>
    );
}

const tabIconStyles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },
});

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const TAB_H = 56;

    return (
        <Tabs
            initialRouteName="index"
            screenOptions={{
                tabBarActiveTintColor: '#2ecc71',
                tabBarInactiveTintColor: isDark ? '#4b5563' : '#9ca3af',
                tabBarShowLabel: false,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                    ios: {
                        position: 'absolute',
                        backgroundColor: isDark ? 'rgba(17,17,17,0.97)' : 'rgba(255,255,255,0.97)',
                        borderTopWidth: 0.5,
                        borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
                        shadowColor: '#000',
                        shadowOpacity: isDark ? 0.5 : 0.1,
                        shadowRadius: 16,
                        shadowOffset: { width: 0, height: -2 },
                        elevation: 16,
                        height: TAB_H + insets.bottom,
                        paddingBottom: insets.bottom
                    },
                    android: {
                        backgroundColor: isDark ? '#111111' : '#ffffff',
                        borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
                        borderTopWidth: 0.5,
                        elevation: 12,
                        height: TAB_H
                    }
                })
            }}
        >
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Notes',
                    tabBarIcon: ({ color }) => (
                        <TabIcon
                            name="book-open"
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
                        <TabIcon
                            name="calendar"
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
                        <TabIcon
                            name="bell"
                            color={color}
                        />
                    ),
                    tabBarAccessibilityLabel: 'Activity Tab'
                }}
            />
            {/* Hidden screens */}
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
