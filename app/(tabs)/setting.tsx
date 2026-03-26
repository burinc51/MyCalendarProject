import { View, Text, ActivityIndicator, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { sendTestNotification, testScheduledNotification } from '@/services/notificationService';
import { getExpoPushToken, registerPushToken, triggerNotificationJob } from '@/services/pushNotificationService';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';

let GoogleSignin: any = null;
let GoogleSigninButton: any = null;

try {
    const googleSigninModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSigninModule.GoogleSignin;
    GoogleSigninButton = googleSigninModule.GoogleSigninButton;
} catch (e) {
    console.log('GoogleSignin module not available (likely running in Expo Go)');
}

type User = {
    email: string;
    name: string;
    imageUrl: string;
};

export default function SettingsScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { user, isAuthenticated, clearAuth } = useAuthStore();

    const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
    const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://172.29.176.1:9001';

    const [loading, setLoading] = React.useState(false);
    const [isGoogleAvailable, setIsGoogleAvailable] = React.useState(false);
    const [pushTokenLoading, setPushTokenLoading] = useState(false);

    useEffect(() => {
        if (GoogleSignin) {
            try {
                GoogleSignin.configure({
                    webClientId: webClientId,
                    offlineAccess: true,
                    forceCodeForRefreshToken: true
                });
                setIsGoogleAvailable(true);
            } catch (err) {
                console.log('GoogleSignin configure error:', err);
            }
        }
    }, []);



    const signInWithGoogle = async () => {
        if (!GoogleSignin) {
            Alert.alert(
                'Not Supported',
                'Google Sign-In requires a Development Build or Native App. It is not supported in Expo Go.'
            );
            return;
        }

        try {
            setLoading(true);
            await GoogleSignin.hasPlayServices();
            const signInResult = await GoogleSignin.signIn();
            console.log('signInResult: ', signInResult);

            // Send idToken to backend
            const idToken = await GoogleSignin.getTokens().then((tokens: any) => tokens.idToken);
            console.log('idToken: ', idToken);

            const response = await fetch(`${SERVER_URL}/api/v1/auth/google-sign-in`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ idToken: idToken })
            });

            const result = response.status === 204 ? null : await response.json();
            console.log('Backend response:', result);
        } catch (error) {
            console.error('Google SignIn error:', error);
            Alert.alert('Error', 'Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        if (!GoogleSignin) return;
        try {
            setLoading(true);
            await GoogleSignin.signOut();
            await clearAuth();
            router.replace('/login');
            console.log('User signed out successfully');
        } catch (error) {
            console.error('Google SignOut error:', error);
            Alert.alert('Error', 'Failed to sign out');
        } finally {
            setLoading(false);
        }
    };

    const renderSignInButton = () => {
        if (GoogleSigninButton && isGoogleAvailable) {
            return (
                <GoogleSigninButton
                    size={GoogleSigninButton.Size?.Wide || 1}
                    color={GoogleSigninButton.Color?.Dark || 1}
                    onPress={signInWithGoogle}
                    disabled={loading}
                />
            );
        }

        return (
            <TouchableOpacity
                className="bg-blue-600 py-3 px-6 rounded-full items-center justify-center flex-row shadow-lg"
                onPress={signInWithGoogle}
                disabled={loading}
            >
                <Text className="text-white font-semibold text-base">
                    {isGoogleAvailable ? 'Sign in with Google' : 'Google Sign-In (Dev Build Only)'}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <ScrollView
            className={`flex-1 ${isDark ? 'bg-neutral-900' : 'bg-white'}`}
            contentContainerStyle={{ padding: 20 }}
        >
            {/* Settings Title */}
            <Text
                className={`text-2xl font-bold mb-6 ${isDark ? 'text-neutral-100' : 'text-neutral-800'
                }`}
            >
                ⚙️ Settings
            </Text>

            {/* Account Section */}
            <View className="mb-3 px-1">
                <Text
                    className={`text-base font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-700'
                    }`}
                >
                    👤 Account
                </Text>
            </View>

            <View
                className={`rounded-2xl overflow-hidden p-4 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'
                }`}
            >
                {!isAuthenticated ? (
                    <View className="items-center py-4">
                        {renderSignInButton()}
                    </View>
                ) : (
                    <View className="items-center p-4">
                        {user?.photoUrl && (
                            <Image
                                source={{ uri: user.photoUrl }}
                                className="w-20 h-20 rounded-full mb-4 border-2 border-gray-300"
                            />
                        )}

                        <Text
                            className={`text-xl font-bold mb-1 text-center ${isDark ? 'text-neutral-100' : 'text-neutral-800'
                            }`}
                        >
                            {user?.name || 'User'}
                        </Text>
                        <Text
                            className={`text-sm mb-6 text-center ${isDark ? 'text-neutral-400' : 'text-neutral-600'
                            }`}
                        >
                            {user?.email}
                        </Text>

                        <TouchableOpacity
                            className="bg-red-600 py-3 px-6 rounded-full items-center justify-center flex-row shadow-lg"
                            onPress={signOut}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white font-semibold text-base">
                                    Sign Out
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Divider */}
            <View
                className={`h-px my-6 ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'}`}
            />

            {/* Notification Test Section */}
            <View className="mb-3 px-1">
                <Text
                    className={`text-base font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}
                >
                    🔔 Notifications
                </Text>
            </View>

            <View
                className={`rounded-2xl overflow-hidden p-4 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}
            >
                <TouchableOpacity
                    className={`py-3 px-4 rounded-xl mb-3 ${isDark ? 'bg-neutral-700 active:bg-neutral-600' : 'bg-neutral-200 active:bg-neutral-300'}`}
                    onPress={() => testScheduledNotification(60)}
                >
                    <Text className={`text-center font-medium ${isDark ? 'text-neutral-100' : 'text-neutral-800'}`}>
                        🕐 ทดสอบ Notification (1 นาที)
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`py-3 px-4 rounded-xl ${isDark ? 'bg-neutral-700 active:bg-neutral-600' : 'bg-neutral-200 active:bg-neutral-300'}`}
                    onPress={() => sendTestNotification()}
                >
                    <Text className={`text-center font-medium ${isDark ? 'text-neutral-100' : 'text-neutral-800'}`}>
                        ⚡ ทดสอบ Notification (ทันที)
                    </Text>
                </TouchableOpacity>

                {/* Push Token Section */}
                <View className={`h-px my-3 ${isDark ? 'bg-neutral-600' : 'bg-neutral-300'}`} />

                <TouchableOpacity
                    className={`py-3 px-4 rounded-xl mb-3 ${isDark ? 'bg-purple-600 active:bg-purple-700' : 'bg-purple-500 active:bg-purple-600'}`}
                    onPress={async () => {
                        try {
                            const token = await getExpoPushToken();
                            if (token) {
                                Alert.alert(
                                    '📱 Expo Push Token',
                                    token,
                                    [{ text: 'Copy', onPress: () => console.log(token) }, { text: 'OK' }]
                                );
                            } else {
                                Alert.alert('❌ ไม่พบ Token', 'Push Notification ใช้ได้เฉพาะบนเครื่องจริงเท่านั้น');
                            }
                        } catch (error) {
                            Alert.alert('❌ Error', String(error));
                        }
                    }}
                >
                    <Text className="text-center font-medium text-white">
                        🔑 ดู Expo Push Token
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`py-3 px-4 rounded-xl ${isDark ? 'bg-blue-600 active:bg-blue-700' : 'bg-blue-500 active:bg-blue-600'}`}
                    onPress={async () => {
                        setPushTokenLoading(true);
                        try {
                            const token = await getExpoPushToken();
                            if (token && user?.id) {
                                const success = await registerPushToken(token, user.id);
                                Alert.alert(
                                    success ? '✅ สำเร็จ' : '❌ ผิดพลาด',
                                    success
                                        ? `Push Token ลงทะเบียนแล้ว\n\nToken: ${token.substring(0, 30)}...`
                                        : 'ไม่สามารถลงทะเบียน Push Token ได้'
                                );
                            } else {
                                Alert.alert('❌ ไม่พบ Token', 'Push Notification ใช้ได้เฉพาะบนเครื่องจริงเท่านั้น');
                            }
                        } catch (error) {
                            Alert.alert('❌ Error', String(error));
                        } finally {
                            setPushTokenLoading(false);
                        }
                    }}
                    disabled={pushTokenLoading}
                >
                    {pushTokenLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-center font-medium text-white">
                            📤 ลงทะเบียน Push Token
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    className={`py-3 px-4 rounded-xl mt-3 ${isDark ? 'bg-green-600 active:bg-green-700' : 'bg-green-500 active:bg-green-600'}`}
                    onPress={async () => {
                        try {
                            const success = await triggerNotificationJob();
                            Alert.alert(
                                success ? '✅ Job Triggered' : '❌ ผิดพลาด',
                                success
                                    ? 'Notification Job ทำงานแล้ว! ตรวจสอบ logs ที่ backend'
                                    : 'ไม่สามารถ trigger job ได้'
                            );
                        } catch (error) {
                            Alert.alert('❌ Error', String(error));
                        }
                    }}
                >
                    <Text className="text-center font-medium text-white">
                        🚀 Trigger Notification Job
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Bottom Spacing */}
            <View className="h-8" />
        </ScrollView>
    );
}
