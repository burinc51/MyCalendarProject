import { View, Text, ActivityIndicator, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { sendTestNotification, testScheduledNotification } from '@/services/notificationService';
import { getExpoPushToken, registerPushToken, triggerNotificationJob } from '@/services/pushNotificationService';
import { useAuthStore } from '@/stores/useAuthStore';
import { signOut as authSignOut } from '@/services/authService';
import { useRouter } from 'expo-router';

let GoogleSignin: any = null;
let GoogleSigninButton: any = null;

try {
    const googleSigninModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSigninModule.GoogleSignin;
    GoogleSigninButton = googleSigninModule.GoogleSigninButton;
} catch (e) {
    console.log('GoogleSignin module not available (likely running in Expo Go)');
}

export default function SettingsScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();

    const { user, token, refreshToken, isAuthenticated, isGuest, clearAuth } = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [pushTokenLoading, setPushTokenLoading] = useState(false);

    const handleSignOut = async () => {
        try {
            setLoading(true);

            // Revoke tokens on backend
            if (token && refreshToken) {
                try {
                    await authSignOut(token, refreshToken);
                } catch (err) {
                    console.warn('Backend sign-out failed (tokens may already be revoked):', err);
                }
            }

            // Sign out from Google
            if (GoogleSignin) {
                try {
                    await GoogleSignin.signOut();
                } catch (err) {
                    console.warn('Google sign-out failed:', err);
                }
            }

            // Clear local auth state → auth guard จะ redirect ไป login
            await clearAuth();
        } catch (error) {
            console.error('Sign-out error:', error);
            Alert.alert('Error', 'Failed to sign out');
        } finally {
            setLoading(false);
        }
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
                {isAuthenticated && user ? (
                    <View className="items-center p-4">
                        {user.photoUrl && (
                            <Image
                                source={{ uri: user.photoUrl }}
                                className="w-20 h-20 rounded-full mb-4 border-2 border-gray-300"
                            />
                        )}

                        <Text
                            className={`text-xl font-bold mb-1 text-center ${isDark ? 'text-neutral-100' : 'text-neutral-800'
                                }`}
                        >
                            {user.name || 'User'}
                        </Text>
                        <Text
                            className={`text-sm mb-6 text-center ${isDark ? 'text-neutral-400' : 'text-neutral-600'
                                }`}
                        >
                            {user.email}
                        </Text>

                        <TouchableOpacity
                            className="bg-red-600 py-3 px-6 rounded-full items-center justify-center flex-row shadow-lg"
                            onPress={handleSignOut}
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
                ) : isGuest ? (
                    <View className="items-center p-4">
                        <View style={{
                            width: 64, height: 64, borderRadius: 32,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            justifyContent: 'center', alignItems: 'center', marginBottom: 12,
                        }}>
                            <Text style={{ fontSize: 28 }}>👤</Text>
                        </View>
                        <Text
                            className={`text-lg font-bold mb-1 text-center ${isDark ? 'text-neutral-100' : 'text-neutral-800'}`}
                        >
                            Guest Mode
                        </Text>
                        <Text
                            className={`text-sm mb-5 text-center ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}
                        >
                            เข้าสู่ระบบเพื่อใช้งานทุกฟีเจอร์
                        </Text>

                        <TouchableOpacity
                            className="bg-green-600 py-3 px-6 rounded-full items-center justify-center flex-row shadow-lg"
                            onPress={async () => {
                                await clearAuth();
                            }}
                        >
                            <Text className="text-white font-semibold text-base">
                                เข้าสู่ระบบด้วย Google
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
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
                            const pushToken = await getExpoPushToken();
                            if (pushToken) {
                                const userId = user?.id || 1;
                                const success = await registerPushToken(pushToken, userId);
                                Alert.alert(
                                    success ? '✅ สำเร็จ' : '❌ ผิดพลาด',
                                    success
                                        ? `Push Token ลงทะเบียนแล้ว\n\nToken: ${pushToken.substring(0, 30)}...`
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
