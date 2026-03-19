import { useEffect, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import '../global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider as NavigationThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { LogBox, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { setupNotificationHandler, registerForPushNotificationsAsync } from '@/services/notificationService';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAuthStore } from '@/stores/useAuthStore';

LogBox.ignoreLogs([
    'SafeAreaView has been deprecated',
]);

// Auth guard: redirect ไป login ถ้ายังไม่ได้เข้าสู่ระบบ
function useProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return; // ยังโหลด auth state อยู่

        const inLoginPage = (segments[0] as string) === 'login';

        if (!isAuthenticated && !inLoginPage) {
            // ยังไม่ login → ไปหน้า login
            router.replace('/login' as any);
        } else if (isAuthenticated && inLoginPage) {
            // login แล้ว → ไปหน้าหลัก
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, isLoading, segments]);
}

// Inner component that uses theme context
function ThemedApp() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Auth guard
    useProtectedRoute();

    // Create navigation theme based on our theme context
    const navigationTheme = isDark ? DarkTheme : DefaultTheme;

    return (
        <NavigationThemeProvider value={navigationTheme}>
            <SafeAreaView
                style={{ flex: 1, backgroundColor: isDark ? '#171717' : '#ffffff' }}
                edges={['top', 'left', 'right']}
            >
                <Stack>
                    <Stack.Screen
                        name="login"
                        options={{ headerShown: false, animation: 'fade' }}
                    />
                    <Stack.Screen
                        name="(tabs)"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="event/[id]"
                        options={{ headerShown: false, animation: 'slide_from_right' }}
                    />
                    <Stack.Screen
                        name="event/create"
                        options={{ headerShown: false, animation: 'slide_from_right' }}
                    />
                    <Stack.Screen
                        name="account-settings"
                        options={{ headerShown: false, animation: 'slide_from_right' }}
                    />
                    <Stack.Screen name="+not-found" />
                </Stack>
            </SafeAreaView>
            <StatusBar style={isDark ? 'light' : 'dark'} />
        </NavigationThemeProvider>
    );
}

export default function RootLayout() {
    const { loadNotifications } = useNotificationStore();
    const { loadAuth, isLoading: authLoading } = useAuthStore();
    const router = useRouter();
    const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
    const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

    // Load auth state on app start
    useEffect(() => {
        loadAuth();
    }, []);

    // Setup notifications on app start
    useEffect(() => {
        setupNotificationHandler();
        registerForPushNotificationsAsync();
        loadNotifications();

        // Listen for incoming notifications while app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('📬 Notification received:', notification.request.content.title);
        });

        // Listen for user tapping on notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            const eventId = data?.eventId;
            const type = data?.type;

            console.log('👆 Notification tapped:', { eventId, type });

            if (eventId && type === 'event_reminder') {
                router.push('/(tabs)');
            }
        });

        // Cleanup
        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);

    const [loaded, error] = useFonts({
        'Kanit-Regular': require('../assets/fonts/Kanit-Regular.ttf'),
        'Kanit-Bold': require('../assets/fonts/Kanit-Bold.ttf'),
    });

    if (!loaded && !error) return null;
    if (error) {
        console.log('Font loading error:', error);
        return null;
    }

    // Show loading screen while checking auth state
    if (authLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
                <ActivityIndicator size="large" color="#2ecc71" />
            </View>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <ThemeProvider>
                    <ThemedApp />
                </ThemeProvider>
            </GestureHandlerRootView>
        </QueryClientProvider>
    );
}
