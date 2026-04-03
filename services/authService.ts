import httpClient from '@/lib/httpClient';

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    userId: number;
    username: string;
    name: string;
    email: string;
    pictureUrl: string;
    isAdmin?: boolean;
    roles: string[];
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
    const response = await httpClient.post<AuthResponse>('/api/v1/auth/google-sign-in', { idToken }, { headers: { 'Content-Type': 'application/json' } });
    return response.data;
}

/**
 * Email Sign-Up: สมัครสมาชิกด้วยอีเมลและรหัสผ่าน
 */
export async function emailSignUp(email: string, password: string, name: string, username: string): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>(
        '/api/v1/users',
        {
            email,
            password,
            name,
            username,
            roles: ['USER']
        },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
}

/**
 * Email Sign-In: เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
 */
export async function emailSignIn(email: string, password: string): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>(
        '/api/v1/auth/sign-in',
        { usernameOrEmail: email, password: password },
    );
    return response.data;
}

/**
 * Forgot Password: ส่งอีเมลขอรับ OTP เพื่อรีเซ็ตรหัสผ่าน
 */
export async function forgotPassword(email: string): Promise<void> {
    await httpClient.post('/api/v1/auth/forgot-password', { email });
}

/**
 * Verify Forgot Password OTP: ตรวจสอบรหัส OTP สำหรับลืมรหัสผ่าน
 */
export async function verifyForgotPasswordOtp(email: string, otpCode: string): Promise<void> {
    await httpClient.post('/api/v1/auth/verify-forgot-password-otp', { email, otpCode });
}

/**
 * Reset Password: ตั้งรหัสผ่านใหม่หลังจากยืนยัน OTP สำเร็จ
 */
export async function resetPassword(email: string, otpCode: string, password: string): Promise<void> {
    await httpClient.post('/api/v1/auth/reset-password', { email, otpCode, password });
}

/**
 * Verify OTP: ตรวสอบรหัส OTP สำหรับการสมัครสมาชิกหรือการยืนยันตัวตนทั่วไป
 */
export async function verifyOtp(email: string, otpCode: string): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/api/v1/auth/verify-otp', { email, otpCode });
    return response.data;
}

/**
 * Resend OTP: ส่งรหัส OTP ใหม่อีกครั้ง (ใช้ได้ทั้งสมัครสมาชิกและลืมรหัสผ่าน)
 */
export async function resendOtp(email: string): Promise<void> {
    await httpClient.post('/api/v1/auth/resend-otp', { email });
}

/**
 * Refresh access token ด้วย refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<JwtResponse> {
    const formData = new URLSearchParams();
    formData.append('refreshToken', refreshToken);

    const response = await httpClient.post<JwtResponse>('/api/v1/auth/refresh-token', formData.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    return response.data;
}

/**
 * Sign out: revoke ทั้ง access token และ refresh token
 */
export async function signOut(accessToken: string, refreshToken: string): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('accessToken', accessToken);
    formData.append('refreshToken', refreshToken);

    await httpClient.post('/api/v1/auth/sign-out', formData.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
}

/**
 * ดึงข้อมูล user ปัจจุบัน
 */
export async function getCurrentUser() {
    const response = await httpClient.get('/api/v1/auth/current-user');
    return response.data;
}

/**
 * อัปเดตข้อมูลโปรไฟล์ผู้ใช้ (รองรับการอัปโหลดรูปภาพ)
 */
export async function updateProfile(userId: number, name: string, photoUri?: string) {
    const { encode: btoa } = await import('base-64');
    const formData = new FormData();

    // สร้าง body JSON สำหรับส่วนข้อมูล
    const body = {
        name,
        pictureUrl: photoUri && !photoUri.startsWith('file://') ? photoUri : undefined
    };

    const jsonString = JSON.stringify(body);
    const utf8SafeString = unescape(encodeURIComponent(jsonString));
    const base64Data = btoa(utf8SafeString);

    formData.append('body', {
        uri: `data:application/json;base64,${base64Data}`,
        name: 'body.json',
        type: 'application/json'
    } as any);

    // ถ้าเป็น file:// แสดงว่าเป็นรูปใหม่จากเครื่อง ให้แนบไฟล์ไปใน FormData
    if (photoUri && photoUri.startsWith('file://')) {
        const filename = photoUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';

        formData.append('file', {
            uri: photoUri,
            name: filename,
            type: type
        } as any);
    } else {
        formData.append('file', '');
    }

    const response = await httpClient.put(`/api/v1/users/${userId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
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
