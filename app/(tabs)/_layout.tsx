import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            initialRouteName="index"
            screenOptions={{
                tabBarActiveTintColor: '#007aff',
                tabBarInactiveTintColor: '#8e8e93',
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                    ios: {
                        position: 'absolute',
                        backgroundColor: 'rgba(255,255,255,0.92)',
                        borderTopWidth: 0,
                        shadowColor: '#000',
                        shadowOpacity: 0.08,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: -2 },
                        elevation: 10,
                        height: 70 + insets.bottom,
                        paddingBottom: insets.bottom + 8,
                        borderTopColor: '#e0e0e0'
                    },
                    android: {
                        backgroundColor: '#fff',
                        borderTopColor: '#e0e0e0',
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
                    tabBarAccessibilityLabel: 'Group Tab'
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
                    tabBarAccessibilityLabel: 'Settings Tab'
                }}
            />
        </Tabs>
    );
}
