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
import { useGroupStore } from '@/stores/useGroupStore';
import { useRootNavigationState } from 'expo-router';

LogBox.ignoreLogs([
    'SafeAreaView has been deprecated',
]);

// Auth guard: redirect ไป login ถ้ายังไม่ได้เข้าสู่ระบบ
// และ redirect ไป onboarding ถ้ายังไม่มี Group
function useProtectedRoute() {
    const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
    const { groups, fetchGroups, isLoading: groupsLoading } = useGroupStore();
    const segments = useSegments();
    const router = useRouter();
    const navigationState = useRootNavigationState();
    const [groupsChecked, setGroupsChecked] = useState(false);

    // เมื่อ authenticated แล้ว → fetch groups เพื่อตรวจสอบ
    useEffect(() => {
        if (isAuthenticated && !authLoading && user?.id) {
            setGroupsChecked(false);
            fetchGroups(user.id).finally(() => setGroupsChecked(true));
        } else if (!isAuthenticated) {
            setGroupsChecked(false);
        }
    }, [isAuthenticated, authLoading, user?.id]);

    useEffect(() => {
        if (authLoading) return;

        const inLoginPage = (segments[0] as string) === 'login';
        const inSignupPage = (segments[0] as string) === 'signup';
        const inForgotPasswordPage = (segments[0] as string) === 'forgot-password';
        const inOnboarding = (segments[0] as string) === 'onboarding';

        // ป้องกัน navigation ก่อน navigator จะ mount
        if (!navigationState?.key) return;

        if (!isAuthenticated && !inLoginPage && !inSignupPage && !inForgotPasswordPage) {
            // ยังไม่ login → ไปหน้า login
            router.replace('/login' as any);
        } else if (isAuthenticated && (inLoginPage || inSignupPage)) {
            // login แล้ว — รอตรวจ groups ก่อน
            if (!groupsChecked || groupsLoading) return;
            if (groups.length === 0) {
                router.replace('/onboarding/welcome' as any);
            } else {
                router.replace('/(tabs)');
            }
        } else if (isAuthenticated && !inOnboarding && groupsChecked && !groupsLoading && groups.length === 0) {
            // มี auth แต่ไม่มี group และไม่ได้อยู่หน้า onboarding → redirect
            router.replace('/onboarding/welcome' as any);
        }
    }, [isAuthenticated, authLoading, groups, groupsChecked, groupsLoading, segments, navigationState?.key]);
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
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen
                        name="login"
                        options={{ animation: 'fade' }}
                    />
                    <Stack.Screen
                        name="signup"
                        options={{ animation: 'fade' }}
                    />
                    <Stack.Screen
                        name="forgot-password"
                        options={{ animation: 'fade' }}
                    />
                    <Stack.Screen
                        name="onboarding/welcome"
                        options={{ animation: 'fade', gestureEnabled: false }}
                    />
                    <Stack.Screen
                        name="onboarding/create-group"
                        options={{ animation: 'slide_from_right', gestureEnabled: false }}
                    />
                    <Stack.Screen
                        name="(tabs)"
                        options={{}}
                    />
                    <Stack.Screen
                        name="event/[id]"
                        options={{ animation: 'slide_from_right' }}
                    />
                    <Stack.Screen
                        name="event/create"
                        options={{ animation: 'slide_from_right' }}
                    />
                    <Stack.Screen
                        name="account-settings"
                        options={{ animation: 'slide_from_right' }}
                    />
                    <Stack.Screen
                        name="admin-dashboard"
                        options={{ animation: 'slide_from_right' }}
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
