import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

const httpClient: AxiosInstance = axios.create({
    baseURL: SERVER_URL
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
    }
);

httpClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response) {
            const { status } = error.response;
            if (status === 401) {
                console.error('ERROR 401: Token expired or unauthorized. Clearing session.');
                await AsyncStorage.removeItem('access_token');
            }
        }

        return Promise.reject(error);
    }
);

export default httpClient;
