import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import httpClient from '@/lib/httpClient';

/**
 * Push Notification Service
 * ใช้สำหรับส่ง Push Notifications จาก Server ไปยัง Device
 */

/**
 * ดึง Expo Push Token สำหรับเครื่องนี้
 * Token นี้ต้องส่งไปเก็บใน Backend เพื่อใช้ส่ง Push Notification
 * 
 * @returns Expo Push Token (เช่น "ExponentPushToken[xxxxxx]")
 */
export async function getExpoPushToken(): Promise<string | null> {
    if (!Device.isDevice) {
        console.warn('Push Notifications only work on physical devices');
        return null;
    }

    try {
        // ขอ Permission
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Push notification permission not granted');
            return null;
        }

        // สร้าง Notification Channel สำหรับ Android
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C'
            });
        }

        // ดึง Expo Push Token
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: projectId
        });

        console.log('📱 Expo Push Token:', tokenData.data);
        return tokenData.data;
    } catch (error) {
        console.error('Error getting push token:', error);
        return null;
    }
}

/**
 * ส่ง Push Token ไปเก็บใน Backend
 * Backend จะใช้ token นี้ในการส่ง Push Notification มาหา User
 * 
 * @param token - Expo Push Token
 * @param userId - User ID ของ user ที่ login อยู่
 */
export async function registerPushToken(token: string, userId: number): Promise<boolean> {
    try {
        await httpClient.post('/api/v1/push-tokens', {
            token: token,
            userId: userId,
            platform: Platform.OS,
            deviceName: Device.deviceName
        });

        console.log('✅ Push token registered successfully');
        return true;
    } catch (error) {
        console.error('❌ Error registering push token:', error);
        return false;
    }
}

/**
 * ลบ Push Token ออกจาก Backend (เมื่อ User logout)
 * 
 * @param token - Expo Push Token
 */
export async function unregisterPushToken(token: string): Promise<boolean> {
    try {
        await httpClient.delete('/api/v1/push-tokens', {
            data: { token }
        });

        console.log('✅ Push token unregistered');
        return true;
    } catch (error) {
        console.error('❌ Error unregistering push token:', error);
        return false;
    }
}

/**
 * Trigger Notification Job บน Backend แบบ manual
 * ใช้สำหรับทดสอบว่า notification ถูกส่งถูกต้องหรือไม่
 * โดยไม่ต้องรอ Quartz Scheduler (ปกติทำงานทุก 1 นาที)
 * 
 * เงื่อนไขการส่ง notification:
 * - Event มี notificationType = 'PUSH' หรือ 'EMAIL'
 * - Event มี notificationTime <= เวลาปัจจุบัน
 * - Event มี startDate > เวลาปัจจุบัน (ยังไม่เริ่ม)
 * - User ที่ assign อยู่ใน event มี push token ลงทะเบียนไว้
 */
export async function triggerNotificationJob(): Promise<boolean> {
    try {
        await httpClient.post('/api/v1/push-tokens/test-job');
        console.log('✅ Notification job triggered successfully');
        return true;
    } catch (error) {
        console.error('❌ Error triggering notification job:', error);
        return false;
    }
}

