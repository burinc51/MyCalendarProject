import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import '../global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider as NavigationThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { LogBox } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

LogBox.ignoreLogs([
    'SafeAreaView has been deprecated',
]);

// Inner component that uses theme context
function ThemedApp() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

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
                        name="(tabs)"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen name="+not-found" />
                </Stack>
            </SafeAreaView>
            <StatusBar style={isDark ? 'light' : 'dark'} />
        </NavigationThemeProvider>
    );
}
import { setupNotificationHandler, registerForPushNotificationsAsync } from '@/services/notificationService';
import { useNotificationStore } from '@/stores/useNotificationStore';

export default function RootLayout() {
    const { loadNotifications } = useNotificationStore();

    // Setup notifications on app start
    useEffect(() => {
        setupNotificationHandler();
        registerForPushNotificationsAsync();
        loadNotifications();
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
