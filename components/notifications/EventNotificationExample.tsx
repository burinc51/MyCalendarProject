import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { scheduleEventReminder, cancelAllEventNotifications } from '@/services/notificationService';
import { useNotificationStore } from '@/stores/useNotificationStore';

/**
 * ตัวอย่างการใช้งาน Notification Service
 * ใช้ใน Event Form หรือ Event Details
 */
export function EventNotificationExample() {
    const [reminderMinutes, setReminderMinutes] = useState(15);
    const { addEventNotification, removeEventNotification } = useNotificationStore();

    /**
     * ตั้งค่าการแจ้งเตือนเมื่อสร้าง/แก้ไข Event
     */
    const handleSetReminder = async (eventId: number, title: string, startDate: Date, reminderMinutes: number) => {
        try {
            // ยกเลิกการแจ้งเตือนเก่าก่อน (ถ้ามี)
            await cancelAllEventNotifications(eventId);
            await removeEventNotification(eventId);

            // สร้างการแจ้งเตือนใหม่
            const notificationId = await scheduleEventReminder(eventId, title, startDate, reminderMinutes);

            // บันทึกลง Store
            await addEventNotification({
                eventId,
                notificationId,
                reminderMinutes,
                scheduledAt: new Date().toISOString()
            });

            Alert.alert('Success', `Reminder set for ${reminderMinutes} minutes before the event`);
        } catch (error) {
            console.error('Failed to set reminder:', error);
            Alert.alert('Error', 'Failed to set reminder');
        }
    };

    /**
     * ยกเลิกการแจ้งเตือน
     */
    const handleCancelReminder = async (eventId: number) => {
        try {
            await cancelAllEventNotifications(eventId);
            await removeEventNotification(eventId);
            Alert.alert('Success', 'Reminder cancelled');
        } catch (error) {
            console.error('Failed to cancel reminder:', error);
            Alert.alert('Error', 'Failed to cancel reminder');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Event Notification Example</Text>

            {/* Reminder Options */}
            <View style={styles.optionsContainer}>
                <Text style={styles.label}>Remind me before:</Text>
                {[5, 15, 30, 60].map((minutes) => (
                    <TouchableOpacity
                        key={minutes}
                        style={[styles.optionButton, reminderMinutes === minutes && styles.optionButtonActive]}
                        onPress={() => setReminderMinutes(minutes)}
                    >
                        <Text style={[styles.optionText, reminderMinutes === minutes && styles.optionTextActive]}>
                            {minutes} min
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Example Buttons */}
            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    // ตัวอย่าง: Event เริ่มในอีก 1 ชั่วโมง
                    const startDate = new Date(Date.now() + 60 * 60 * 1000);
                    handleSetReminder(1, 'Test Event', startDate, reminderMinutes);
                }}
            >
                <Text style={styles.buttonText}>Set Test Reminder</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => handleCancelReminder(1)}>
                <Text style={styles.buttonText}>Cancel Reminder</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff'
    },
    title: {
        fontSize: 20,
        fontFamily: 'Kanit-Bold',
        marginBottom: 20,
        color: '#2c3e50'
    },
    optionsContainer: {
        marginBottom: 20
    },
    label: {
        fontSize: 14,
        fontFamily: 'Kanit-Regular',
        color: '#34495e',
        marginBottom: 10
    },
    optionButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 8,
        backgroundColor: '#fff'
    },
    optionButtonActive: {
        backgroundColor: '#3498db',
        borderColor: '#3498db'
    },
    optionText: {
        fontSize: 14,
        fontFamily: 'Kanit-Regular',
        color: '#34495e'
    },
    optionTextActive: {
        color: '#fff',
        fontFamily: 'Kanit-Bold'
    },
    button: {
        backgroundColor: '#2ecc71',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12
    },
    cancelButton: {
        backgroundColor: '#e74c3c'
    },
    buttonText: {
        fontSize: 14,
        fontFamily: 'Kanit-Bold',
        color: '#fff'
    }
});
