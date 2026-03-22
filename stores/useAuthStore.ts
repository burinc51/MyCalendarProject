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
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setAuth: (user: User, token: string, refreshToken: string) => Promise<void>;
    clearAuth: () => Promise<void>;
    loadAuth: () => Promise<void>;
    updateToken: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,

    setAuth: async (user, token, refreshToken) => {
        await AsyncStorage.setItem('access_token', token);
        await AsyncStorage.setItem('refresh_token', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
    },

    clearAuth: async () => {
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        await AsyncStorage.removeItem('user');
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
    },

    loadAuth: async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            const userStr = await AsyncStorage.getItem('user');

            if (token && userStr) {
                const user = JSON.parse(userStr);
                set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Failed to load auth:', error);
            set({ isLoading: false });
        }
    },

    updateToken: async (token: string) => {
        await AsyncStorage.setItem('access_token', token);
        set({ token });
    },
}));
