import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
    id: number;
    email: string;
    name?: string;
    photoUrl?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => Promise<void>;
    clearAuth: () => Promise<void>;
    loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,

    setAuth: async (user, token) => {
        await AsyncStorage.setItem('access_token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
    },

    clearAuth: async () => {
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
    },

    loadAuth: async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            const userStr = await AsyncStorage.getItem('user');
            if (token && userStr) {
                const user = JSON.parse(userStr);
                set({ user, token, isAuthenticated: true });
            }
        } catch (error) {
            console.error('Failed to load auth:', error);
        }
    }
}));
