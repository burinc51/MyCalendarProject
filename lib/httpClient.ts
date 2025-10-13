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
            config.headers.Authorization = `bearer ${token}`;
        }

        console.log(
            `API CALL: ${config.method} ${config.baseURL}${config.url}`
        );

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default httpClient;
