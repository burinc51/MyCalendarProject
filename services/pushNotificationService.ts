import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

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
        // TODO: เปลี่ยน URL เป็น Backend API ของคุณ
        const response = await fetch('YOUR_BACKEND_URL/api/push-tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                userId: userId,
                platform: Platform.OS,
                deviceName: Device.deviceName
            })
        });

        if (response.ok) {
            console.log('✅ Push token registered successfully');
            return true;
        } else {
            console.error('❌ Failed to register push token');
            return false;
        }
    } catch (error) {
        console.error('Error registering push token:', error);
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
        // TODO: เปลี่ยน URL เป็น Backend API ของคุณ
        const response = await fetch('YOUR_BACKEND_URL/api/push-tokens', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });

        if (response.ok) {
            console.log('✅ Push token unregistered');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error unregistering push token:', error);
        return false;
    }
}

/**
 * ==========================================
 * ตัวอย่าง Backend API สำหรับส่ง Push Notification
 * (ใช้ Expo Push API)
 * ==========================================
 * 
 * // Node.js/Express Example:
 * 
 * const { Expo } = require('expo-server-sdk');
 * const expo = new Expo();
 * 
 * app.post('/api/send-notification', async (req, res) => {
 *     const { pushToken, title, body, data } = req.body;
 *     
 *     if (!Expo.isExpoPushToken(pushToken)) {
 *         return res.status(400).json({ error: 'Invalid push token' });
 *     }
 *     
 *     const message = {
 *         to: pushToken,
 *         sound: 'default',
 *         title: title,
 *         body: body,
 *         data: data,
 *         priority: 'high',
 *         channelId: 'default'
 *     };
 *     
 *     try {
 *         const ticket = await expo.sendPushNotificationsAsync([message]);
 *         res.json({ success: true, ticket });
 *     } catch (error) {
 *         res.status(500).json({ error: error.message });
 *     }
 * });
 * 
 * ==========================================
 */

/**
 * ทดสอบ Push Notification โดยส่งผ่าน Expo Push API โดยตรง
 * (ใช้สำหรับทดสอบเท่านั้น ปกติควรส่งจาก Backend)
 */
export async function testPushNotification(): Promise<boolean> {
    const token = await getExpoPushToken();

    if (!token) {
        console.warn('No push token available');
        return false;
    }

    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate'
            },
            body: JSON.stringify({
                to: token,
                sound: 'default',
                title: '🔔 Push Notification Test',
                body: 'This is a push notification from server!',
                data: { type: 'test_push' },
                priority: 'high',
                channelId: 'default'
            })
        });

        const result = await response.json();
        console.log('Push notification result:', result);
        return true;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return false;
    }
}
