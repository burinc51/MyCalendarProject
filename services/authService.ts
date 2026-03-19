import httpClient from '@/lib/httpClient';

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    userId: number;
    username: string;
    name: string;
    email: string;
    pictureUrl: string;
}

export interface JwtResponse {
    tokenType: string;
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    refreshExpiresIn: number;
}

/**
 * Google Sign-In: ส่ง idToken ไป backend แล้วรับ AuthResponse กลับมา
 */
export async function googleSignIn(idToken: string): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>(
        '/api/v1/auth/google-sign-in',
        { idToken },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
}

/**
 * Refresh access token ด้วย refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<JwtResponse> {
    const formData = new URLSearchParams();
    formData.append('refreshToken', refreshToken);

    const response = await httpClient.post<JwtResponse>(
        '/api/v1/auth/refresh-token',
        formData.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data;
}

/**
 * Sign out: revoke ทั้ง access token และ refresh token
 */
export async function signOut(accessToken: string, refreshToken: string): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('accessToken', accessToken);
    formData.append('refreshToken', refreshToken);

    await httpClient.post(
        '/api/v1/auth/sign-out',
        formData.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
}

/**
 * ดึงข้อมูล user ปัจจุบัน
 */
export async function getCurrentUser() {
    const response = await httpClient.get('/api/v1/auth/current-user');
    return response.data;
}
