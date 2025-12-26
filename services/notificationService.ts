import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// กำหนดพฤติกรรมการแจ้งเตือนเมื่อแอปเปิดอยู่
export function setupNotificationHandler() {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true
        })
    });
}

/**
 * ขอ Permission สำหรับการแจ้งเตือน
 */
export async function registerForPushNotificationsAsync(): Promise<boolean> {
    try {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C'
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.warn('Failed to get push notification permissions!');
                return false;
            }
            return true;
        } else {
            console.warn('Must use physical device for Push Notifications');
            return false;
        }
    } catch (error) {
        console.error('Error registering for notifications:', error);
        return false;
    }
}

/**
 * กำหนดการแจ้งเตือนสำหรับ Event
 */
export async function scheduleEventNotification(
    eventId: number,
    title: string,
    body: string,
    triggerDate: Date
): Promise<string> {
    const trigger: Notifications.DateTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title: title,
            body: body,
            data: { eventId, type: 'event_reminder' },
            sound: true
        },
        trigger
    });

    return notificationId;
}

/**
 * กำหนดการแจ้งเตือนล่วงหน้า (เช่น 15 นาทีก่อน Event)
 */
export async function scheduleEventReminder(
    eventId: number,
    title: string,
    startDate: Date,
    reminderMinutes: number
): Promise<string> {
    const triggerDate = new Date(startDate.getTime() - reminderMinutes * 60 * 1000);

    if (triggerDate <= new Date()) {
        throw new Error('Reminder time has already passed');
    }

    const trigger: Notifications.DateTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title: `📅 Reminder: ${title}`,
            body: `Your event starts in ${reminderMinutes} minutes`,
            data: { eventId, type: 'event_reminder', reminderMinutes },
            sound: true
        },
        trigger
    });

    return notificationId;
}

/**
 * ยกเลิกการแจ้งเตือน
 */
export async function cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * ยกเลิกการแจ้งเตือนทั้งหมดของ Event
 */
export async function cancelAllEventNotifications(eventId: number): Promise<void> {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
        if (notification.content.data?.eventId === eventId) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
    }
}

/**
 * ดูการแจ้งเตือนที่กำหนดไว้ทั้งหมด
 */
export async function getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * ทดสอบการแจ้งเตือนทันที
 */
export async function sendTestNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Test Notification 🔔',
            body: 'This is a test notification!',
            data: { type: 'test' }
        },
        trigger: null
    });
}

/**
 * ทดสอบการแจ้งเตือนแบบตั้งเวลา (อีก X วินาที)
 * @param seconds - จำนวนวินาทีที่ต้องการรอ (default: 60 = 1 นาที)
 */
export async function testScheduledNotification(seconds: number = 60): Promise<string> {
    // สร้าง channel ก่อน (สำหรับ Android)
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reminders', {
            name: 'Event Reminders',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
            enableLights: true,
            enableVibrate: true,
            bypassDnd: true // ข้าม Do Not Disturb
        });
    }

    const fakeEventId = 999;

    // ใช้ TimeInterval แทน Date (แม่นยำกว่าบน Android)
    const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title: `📅 Test Reminder`,
            body: `Notification after ${seconds} seconds!`,
            data: { eventId: fakeEventId, type: 'test_reminder' },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
            ...(Platform.OS === 'android' && { channelId: 'reminders' })
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: seconds,
            repeats: false
        }
    });

    const expectedTime = new Date(Date.now() + seconds * 1000);
    console.log(`✅ Notification scheduled for ${expectedTime.toLocaleTimeString()}`);
    console.log(`📝 Notification ID: ${notificationId}`);

    return notificationId;
}
