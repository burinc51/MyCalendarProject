import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

const httpClient: AxiosInstance = axios.create({
    baseURL: SERVER_URL,
});

console.log('SERVER_URL :', SERVER_URL);

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

async function clearAllTokens() {
    // ใช้ clearAuth จาก store เพื่อ sync ทั้ง AsyncStorage และ Zustand state
    // ทำให้ auth guard redirect ไปหน้า login ทันที
    const { clearAuth } = await import('@/stores/useAuthStore').then(m => m.useAuthStore.getState());
    await clearAuth();
}

// ฟังก์ชันเช็ค token หมดอายุล่วงหน้า (เผื่อเวลา 10 วินาที)
const isTokenExpired = (token: string): boolean => {
    try {
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) return true;
        
        let base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const pad = base64.length % 4;
        if (pad) {
            base64 += new Array(5 - pad).join('=');
        }

        const jsonPayload = atob(base64);
        const { exp } = JSON.parse(jsonPayload);
        
        if (!exp) return false;
        
        return Date.now() >= (exp * 1000) - 10000;
    } catch (error) {
        return true;
    }
};

// ฟังก์ชันศูนย์กลางสำหรับ Refresh Token
const refreshTokenRequest = async (): Promise<string> => {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');

    const formData = new URLSearchParams();
    formData.append('refreshToken', refreshToken);

    const response = await axios.post(
        `${SERVER_URL}/api/v1/auth/refresh-token`,
        formData.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const newAccessToken = response.data.accessToken;
    const newRefreshToken = response.data.refreshToken;

    await AsyncStorage.setItem('access_token', newAccessToken);
    if (newRefreshToken) {
        await AsyncStorage.setItem('refresh_token', newRefreshToken);
    }

    return newAccessToken;
};

httpClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        let token = await AsyncStorage.getItem('access_token');

        // ตรวจสอบ token หมดอายุก่อนยิง API
        if (token && config.url && !config.url.includes('/auth/refresh-token')) {
            if (isTokenExpired(token)) {
                if (!isRefreshing) {
                    isRefreshing = true;
                    try {
                        token = await refreshTokenRequest();
                        processQueue(null, token);
                    } catch (error) {
                        processQueue(error, null);
                        await clearAllTokens();
                        return Promise.reject(error);
                    } finally {
                        isRefreshing = false;
                    }
                } else {
                    // ถ้ากำลัง refresh อยู่ รอคิวจนกว่าจะได้ token ใหม่
                    token = await new Promise<string>((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    });
                }
            }
        }

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

httpClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (originalRequest.url?.includes('/auth/refresh-token')) {
                await clearAllTokens();
                return Promise.reject(error);
            }

            if (isRefreshing) {
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
                const newAccessToken = await refreshTokenRequest();
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

export default httpClient;
