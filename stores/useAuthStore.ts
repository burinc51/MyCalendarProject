import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
    id: number;
    email: string;
    name?: string;
    photoUrl?: string;
    role?: 'ADMIN' | 'USER';
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
    updateUser: (userData: Partial<User>) => Promise<void>;
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
        set({ user: { ...user, role: user.role || 'USER' }, token, refreshToken, isAuthenticated: true, isLoading: false });
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
                const storedUser = JSON.parse(userStr);
                set({ user: storedUser, token, refreshToken, isAuthenticated: true, isLoading: false });

                // แอบดึงข้อมูล User สดใหม่จาก Backend ใน Background ป้องกันแอปเปิดช้า
                try {
                    const { getCurrentUser } = await import('@/services/authService');
                    const freshData = await getCurrentUser();
                    
                    if (freshData) {
                        const isAdmin = freshData.role === 'ADMIN' || freshData.roles?.some((r: any) => r.name === 'ADMIN' || r === 'ADMIN') ? 'ADMIN' : 'USER';
                        
                        const updatedUser = {
                            id: freshData.userId || freshData.id || storedUser.id,
                            email: freshData.email || storedUser.email,
                            name: freshData.name || storedUser.name,
                            photoUrl: freshData.pictureUrl || freshData.photoUrl || storedUser.photoUrl,
                            role: isAdmin as 'ADMIN' | 'USER',
                        };
                        
                        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                        set({ user: updatedUser });
                    }
                } catch (fetchError) {
                    console.log('Background user fetch failed (e.g. offline):', fetchError);
                }
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

    updateUser: async (userData: Partial<User>) => {
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
            const updatedUser = { ...currentUser, ...userData };
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            set({ user: updatedUser });
        }
    },
}));
