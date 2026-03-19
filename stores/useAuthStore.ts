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
    isGuest: boolean;
    isLoading: boolean;
    setAuth: (user: User, token: string, refreshToken: string) => Promise<void>;
    setGuest: () => Promise<void>;
    clearAuth: () => Promise<void>;
    loadAuth: () => Promise<void>;
    updateToken: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isGuest: false,
    isLoading: true,

    setAuth: async (user, token, refreshToken) => {
        await AsyncStorage.setItem('access_token', token);
        await AsyncStorage.setItem('refresh_token', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.removeItem('is_guest');
        set({ user, token, refreshToken, isAuthenticated: true, isGuest: false, isLoading: false });
    },

    setGuest: async () => {
        await AsyncStorage.setItem('is_guest', 'true');
        set({ user: null, token: null, refreshToken: null, isAuthenticated: true, isGuest: true, isLoading: false });
    },

    clearAuth: async () => {
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('is_guest');
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isGuest: false, isLoading: false });
    },

    loadAuth: async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            const userStr = await AsyncStorage.getItem('user');
            const isGuest = await AsyncStorage.getItem('is_guest');

            if (token && userStr) {
                const user = JSON.parse(userStr);
                set({ user, token, refreshToken, isAuthenticated: true, isGuest: false, isLoading: false });
            } else if (isGuest === 'true') {
                set({ user: null, token: null, refreshToken: null, isAuthenticated: true, isGuest: true, isLoading: false });
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
