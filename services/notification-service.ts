/**
 * Notification Service
 * Handles local push notifications for note reminders
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
    if (!Device.isDevice) {
        console.warn('Notifications only work on physical devices');
        return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
    }

    // Required for Android
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('note-reminders', {
            name: 'Note Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#3498db',
            sound: 'default',
        });
    }

    return true;
};

/**
 * Schedule a notification for a note reminder
 * @returns notification identifier string or null if failed
 */
export const scheduleNoteReminder = async (
    noteId: number,
    title: string,
    reminderDate: Date,
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'none'
): Promise<string | null> => {
    try {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) return null;

        let trigger: Notifications.NotificationTriggerInput;

        if (recurrence === 'none') {
            const now = new Date();
            const secondsUntilReminder = Math.floor((reminderDate.getTime() - now.getTime()) / 1000);

            if (secondsUntilReminder <= 0) {
                console.warn('Reminder date is in the past');
                return null;
            }

            trigger = {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: secondsUntilReminder,
            };
        } else {
            const calendarTrigger: any = {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                repeats: true,
                hour: reminderDate.getHours(),
                minute: reminderDate.getMinutes(),
            };

            if (recurrence === 'weekly') {
                // Expo uses 1 (Sunday) to 7 (Saturday)
                calendarTrigger.weekday = reminderDate.getDay() + 1;
            } else if (recurrence === 'monthly') {
                calendarTrigger.day = reminderDate.getDate();
            } else if (recurrence === 'yearly') {
                // Expo uses 0 (Jan) to 11 (Dec) for month on iOS, but types say number. 
                // Let's rely on standard calendar triggers
                calendarTrigger.month = reminderDate.getMonth();
                calendarTrigger.day = reminderDate.getDate();
            }

            trigger = calendarTrigger;
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: recurrence !== 'none' ? '🔄 แจ้งเตือนโน้ตประจำ' : '🔔 แจ้งเตือนโน้ต',
                body: title || 'คุณมีโน้ตที่ต้องดู',
                data: { noteId, type: 'note-reminder', recurrence },
                sound: 'default',
            },
            trigger,
        });

        return notificationId;
    } catch (error) {
        console.error('Error scheduling notification:', error);
        return null;
    }
};

/**
 * Cancel a scheduled notification by identifier
 */
export const cancelNoteReminder = async (notificationId: string): Promise<void> => {
    try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
        console.error('Error cancelling notification:', error);
    }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllReminders = async (): Promise<void> => {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
        console.error('Error cancelling all notifications:', error);
    }
};

/**
 * Get all currently scheduled notifications
 */
export const getScheduledReminders = async () => {
    try {
        return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
        console.error('Error getting scheduled notifications:', error);
        return [];
    }
};

export default {
    requestNotificationPermissions,
    scheduleNoteReminder,
    cancelNoteReminder,
    cancelAllReminders,
    getScheduledReminders,
};
