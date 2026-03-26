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
 * Email Sign-Up: สมัครสมาชิกด้วยอีเมลและรหัสผ่าน
 */
export async function emailSignUp(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>(
        '/api/v1/auth/signup',
        { email, password, name },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
}

/**
 * Email Sign-In: เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
 */
export async function emailSignIn(email: string, password: string): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>(
        '/api/v1/auth/login',
        { email, password },
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

/**
 * อัปเดตข้อมูลโปรไฟล์ผู้ใช้
 */
export async function updateProfile(userId: number, name: string, photoUrl?: string) {
    const response = await httpClient.put(`/api/v1/users/${userId}`, {
        name,
        pictureUrl: photoUrl // Match backend field name
    });
    return response.data;
}

/**
 * ดึงข้อมูลสถิติสำหรับผู้ดูแลระบบ
 */
export async function getAdminStats() {
    const response = await httpClient.get('/api/v1/admin/stats');
    return response.data;
}
