import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

const httpClient: AxiosInstance = axios.create({
    baseURL: SERVER_URL,
});

console.log('SERVER_URL :', SERVER_URL);

httpClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await AsyncStorage.getItem('access_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        console.log(`LOG API CALL: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);

        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Flag เพื่อป้องกัน refresh token ซ้ำพร้อมกัน
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
};

httpClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            // ถ้า request เป็น refresh-token เอง → ไม่ retry
            if (originalRequest.url?.includes('/auth/refresh-token')) {
                await clearAllTokens();
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // มี request อื่นกำลัง refresh อยู่ → รอ
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return httpClient(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await AsyncStorage.getItem('refresh_token');

                if (!refreshToken) {
                    await clearAllTokens();
                    processQueue(new Error('No refresh token'), null);
                    return Promise.reject(error);
                }

                // เรียก refresh token (ใช้ axios ตรงๆ เพื่อไม่ให้ interceptor วนลูป)
                const formData = new URLSearchParams();
                formData.append('refreshToken', refreshToken);

                const response = await axios.post(
                    `${SERVER_URL}/api/v1/auth/refresh-token`,
                    formData.toString(),
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
                );

                const newAccessToken = response.data.accessToken;
                const newRefreshToken = response.data.refreshToken;

                // อัพเดท tokens ใน AsyncStorage
                await AsyncStorage.setItem('access_token', newAccessToken);
                if (newRefreshToken) {
                    await AsyncStorage.setItem('refresh_token', newRefreshToken);
                }

                // Retry original request + queued requests
                processQueue(null, newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return httpClient(originalRequest);
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                processQueue(refreshError, null);
                await clearAllTokens();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

async function clearAllTokens() {
    // ใช้ clearAuth จาก store เพื่อ sync ทั้ง AsyncStorage และ Zustand state
    // ทำให้ auth guard redirect ไปหน้า login ทันที
    const { clearAuth } = await import('@/stores/useAuthStore').then(m => m.useAuthStore.getState());
    await clearAuth();
}

export default httpClient;
