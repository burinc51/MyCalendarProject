import axios, { type AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

const httpClient = axios.create({
    baseURL: SERVER_URL,
});

Object.values(httpClient).forEach((client: AxiosInstance) => {
    client.interceptors.request.use(
        async (config) => {
            const token = await AsyncStorage.getItem('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        },
    );
});

export default httpClient;
