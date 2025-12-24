import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EventNotification {
    eventId: number;
    notificationId: string;
    reminderMinutes: number;
    scheduledAt: string;
}

interface NotificationState {
    eventNotifications: EventNotification[];
    addEventNotification: (notification: EventNotification) => Promise<void>;
    removeEventNotification: (eventId: number) => Promise<void>;
    getEventNotifications: (eventId: number) => EventNotification[];
    loadNotifications: () => Promise<void>;
}

const STORAGE_KEY = 'event_notifications';

export const useNotificationStore = create<NotificationState>((set, get) => ({
    eventNotifications: [],

    addEventNotification: async (notification) => {
        const newNotifications = [...get().eventNotifications, notification];
        set({ eventNotifications: newNotifications });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newNotifications));
    },

    removeEventNotification: async (eventId) => {
        const filtered = get().eventNotifications.filter((n) => n.eventId !== eventId);
        set({ eventNotifications: filtered });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    },

    getEventNotifications: (eventId) => {
        return get().eventNotifications.filter((n) => n.eventId === eventId);
    },

    loadNotifications: async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                set({ eventNotifications: JSON.parse(stored) });
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }
}));
