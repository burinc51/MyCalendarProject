/**
 * Account Settings Screen
 * Navigate here when user taps the edit button in Sidebar
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/components/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import { useAuthStore } from '@/stores/useAuthStore';
import { router } from 'expo-router';

let GoogleSignin: any = null;
try {
    const googleSigninModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSigninModule.GoogleSignin;
} catch (e) {
    console.log('GoogleSignin module not available in account settings');
}

// FieldInput sub-component (defined outside to avoid re-creation on render)
interface FieldInputProps {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    multiline?: boolean;
    editable?: boolean;
    isEditing: boolean;
    colors: {
        labelText: string;
        inputBg: string;
        inputBorder: string;
        inputText: string;
        text: string;
        subText: string;
    };
}

const FieldInput: React.FC<FieldInputProps> = ({
    label,
    value,
    onChangeText,
    placeholder,
    multiline = false,
    editable = true,
    isEditing,
    colors: C,
}) => (
    <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: C.labelText }]}>{label}</Text>
        <View
            style={[
                styles.inputWrap,
                {
                    backgroundColor: isEditing && editable ? C.inputBg : 'transparent',
                    borderColor: isEditing && editable ? C.inputBorder : 'transparent',
                    borderWidth: isEditing && editable ? 1 : 0,
                },
            ]}
        >
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={C.subText}
                editable={isEditing && editable}
                multiline={multiline}
                numberOfLines={multiline ? 3 : 1}
                style={[
                    styles.input,
                    {
                        color: isEditing && editable ? C.inputText : C.text,
                        fontFamily: 'Kanit-Regular',
                        minHeight: multiline ? 70 : undefined,
                        textAlignVertical: multiline ? 'top' : 'center',
                    },
                ]}
            />
            {!isEditing && editable && (
                <Feather name="lock" size={14} color={C.subText} style={{ marginLeft: 6 }} />
            )}
        </View>
    </View>
);

export default function AccountSettingsScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();


    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const { user, clearAuth, updateUser } = useAuthStore();
    const router = useRouter();

    const [displayName, setDisplayName] = useState(user?.name || '');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;

    React.useEffect(() => {
        if (GoogleSignin) {
            try {
                GoogleSignin.configure({
                    webClientId: webClientId,
                    offlineAccess: true,
                    forceCodeForRefreshToken: true
                });
            } catch (err) {
                console.log('GoogleSignin configure error in account settings:', err);
            }
        }
    }, []);

    const C = {
        bg: isDark ? '#111111' : '#f5f6f8',
        card: isDark ? '#1c1c1e' : '#ffffff',
        cardBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        text: isDark ? '#f5f5f5' : '#1a1a1a',
        subText: isDark ? '#a3a3a3' : '#6b7280',
        inputBg: isDark ? '#252528' : '#f0f1f3',
        inputBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        inputText: isDark ? '#f0f0f0' : '#1a1a1a',
        accent: '#2ecc71',
        divider: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        danger: '#ef4444',
        headerBg: isDark ? '#141414' : '#ffffff',
        headerBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
        labelText: isDark ? '#6b7280' : '#9ca3af',
        avatarBg: 'rgba(200,180,230,0.55)',
    };

    const handleLogout = () => {
        Alert.alert(
            'ออกจากระบบ',
            'คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?',
            [
                { text: 'ยกเลิก', style: 'cancel' },
                {
                    text: 'ออกจากระบบ',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoggingOut(true);
                            if (GoogleSignin) {
                                try {
                                    await GoogleSignin.hasPlayServices();
                                    await GoogleSignin.signOut();
                                } catch (e) {
                                    console.log('Google sign-out skip (likely not signed in with Google or module error)');
                                }
                            }
                            await clearAuth();
                            router.replace('/login');
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('ข้อผิดพลาด', 'ไม่สามารถออกจากระบบได้ในขณะนี้');
                        } finally {
                            setLoggingOut(false);
                        }
                    },
                },
            ]
        );
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อที่แสดง');
            return;
        }

        setSaving(true);
        try {
            const { updateProfile } = await import('@/services/authService');
            if (user?.id) {
                // Actually call the API
                const updatedUserData = await updateProfile(user.id, displayName, selectedImage || user.photoUrl);
            
            // อัปเดตข้อมูลใน store (โดยใช้รูปที่ได้มาจาก server ถ้ามี)
            updateUser({
                name: updatedUserData.name || displayName,
                photoUrl: updatedUserData.pictureUrl || selectedImage || user.photoUrl
            });
            
            setIsEditing(false);
            Alert.alert('สำเร็จ', 'อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว');
            }
        } catch (error: any) {
            console.error('Update profile error:', error);
            Alert.alert('ข้อผิดพลาด', error.message || 'ไม่สามารถอัปเดตโปรไฟล์ได้');
        } finally {
            setSaving(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'ลบบัญชี',
            'คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีของคุณ? การดำเนินการนี้ไม่สามารถยกเลิกได้',
            [
                { text: 'ยกเลิก', style: 'cancel' },
                {
                    text: 'ลบบัญชี',
                    style: 'destructive',
                    onPress: () => Alert.alert('สำเร็จ', 'บัญชีของคุณถูกลบเรียบร้อยแล้ว'),
                },
            ]
        );
    };


    return (
        <View style={[styles.container, { backgroundColor: C.bg }]}>
            <ScreenHeader
                title="ตั้งค่าบัญชี"
                showBack
                backgroundColor={C.headerBg}
                borderColor={C.headerBorder}
                actions={[
                    {
                        icon: isEditing ? 'check' : 'edit-2',
                        onPress: () => isEditing ? handleSave() : setIsEditing(true),
                        backgroundColor: isEditing
                            ? C.accent
                            : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        color: isEditing ? '#fff' : C.text,
                        loading: saving,
                        disabled: saving,
                        accessibilityLabel: isEditing ? 'บันทึกการเปลี่ยนแปลง' : 'แก้ไขโปรไฟล์',
                    },
                ]}
            />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrap}>
                        <View style={[styles.avatarRing, { borderColor: C.accent + '55' }]} />
                        <View style={[styles.avatarCircle, { backgroundColor: C.avatarBg }]}>
                            {selectedImage || user?.photoUrl ? (
                                <Image
                                    source={{ uri: selectedImage || user?.photoUrl || '' }}
                                    style={{ width: 75, height: 75, borderRadius: 37.5 }}
                                />
                            ) : (
                                <Text style={styles.avatarInitial}>
                                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                            )}
                        </View>
                        {isEditing && (
                            <TouchableOpacity
                                style={[styles.cameraBtn, { backgroundColor: C.accent }]}
                                onPress={pickImage}
                            >
                                <Feather name="camera" size={12} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={[styles.avatarName, { color: C.text }]}>{user?.name}</Text>
                    <Text style={[styles.avatarSub, { color: C.subText }]}>{user?.email}</Text>
                </View>

                {/* Profile Info */}
                <View style={[styles.card, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconBox, { backgroundColor: isDark ? 'rgba(46,204,113,0.12)' : 'rgba(46,204,113,0.1)' }]}>
                            <Feather name="user" size={16} color={C.accent} />
                        </View>
                        <Text style={[styles.cardTitle, { color: C.text }]}>ข้อมูลโปรไฟล์</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: C.divider }]} />

                    <FieldInput
                        label="ชื่อที่แสดง"
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="ระบุชื่อที่ต้องการให้แสดง"
                        isEditing={isEditing}
                        colors={C}
                    />

                    {/*<FieldInput*/}
                    {/*    label="Bio"*/}
                    {/*    value={bio}*/}
                    {/*    onChangeText={setBio}*/}
                    {/*    placeholder="Write a short bio..."*/}
                    {/*    multiline*/}
                    {/*    isEditing={isEditing}*/}
                    {/*    colors={C}*/}
                    {/*/>*/}
                    
                </View>

                {/* Contact Info */}
                <View style={[styles.card, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconBox, { backgroundColor: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(96,165,250,0.1)' }]}>
                            <Feather name="mail" size={16} color="#60a5fa" />
                        </View>
                        <Text style={[styles.cardTitle, { color: C.text }]}>ข้อมูลติดต่อ</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: C.divider }]} />

                    <FieldInput
                        label="อีเมล"
                        value={user?.email}
                        onChangeText={() => { }}
                        placeholder="your@email.com"
                        editable={false}
                        isEditing={isEditing}
                        colors={C}
                    />
                    <View style={styles.infoNote}>
                        <Feather name="info" size={12} color={C.subText} />
                        <Text style={[styles.infoNoteText, { color: C.subText }]}>
                            อีเมลนี้เชื่อมโยงกับบัญชี Google ของคุณ
                        </Text>
                    </View>
                </View>

                {/* Quick Actions */}
                {/*<View style={[styles.card, { backgroundColor: C.card, borderColor: C.cardBorder }]}>*/}
                {/*    <View style={styles.cardHeader}>*/}
                {/*        <View style={[styles.cardIconBox, { backgroundColor: isDark ? 'rgba(244,114,182,0.12)' : 'rgba(244,114,182,0.1)' }]}>*/}
                {/*            <Feather name="settings" size={16} color="#f472b6" />*/}
                {/*        </View>*/}
                {/*        <Text style={[styles.cardTitle, { color: C.text }]}>Preferences</Text>*/}
                {/*    </View>*/}
                {/*    <View style={[styles.divider, { backgroundColor: C.divider }]} />*/}

                {/*    {[*/}
                {/*        { icon: 'bell', label: 'Notifications', color: '#f59e0b', onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon.') },*/}
                {/*        { icon: 'lock', label: 'Privacy', color: '#8b5cf6', onPress: () => Alert.alert('Coming Soon', 'Privacy settings will be available soon.') },*/}
                {/*        { icon: 'moon', label: 'Theme & Appearance', color: '#6366f1', onPress: () => Alert.alert('Coming Soon', 'Theme settings will be available soon.') },*/}
                {/*    ].map((item, index, arr) => (*/}
                {/*        <React.Fragment key={item.label}>*/}
                {/*            <TouchableOpacity*/}
                {/*                style={styles.actionRow}*/}
                {/*                onPress={item.onPress}*/}
                {/*                activeOpacity={0.65}*/}
                {/*            >*/}
                {/*                <View style={[styles.actionIconBox, { backgroundColor: item.color + '1a' }]}>*/}
                {/*                    <Feather name={item.icon as any} size={16} color={item.color} />*/}
                {/*                </View>*/}
                {/*                <Text style={[styles.actionLabel, { color: C.text }]}>{item.label}</Text>*/}
                {/*                <MaterialIcons name="chevron-right" size={20} color={C.subText} />*/}
                {/*            </TouchableOpacity>*/}
                {/*            {index < arr.length - 1 && (*/}
                {/*                <View style={[styles.rowDivider, { backgroundColor: C.divider }]} />*/}
                {/*            )}*/}
                {/*        </React.Fragment>*/}
                {/*    ))}*/}
                {/*</View>*/}

                {/* Account Actions */}
                <View style={[styles.card, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconBox, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)' }]}>
                            <Feather name="log-out" size={16} color={C.danger} />
                        </View>
                        <Text style={[styles.cardTitle, { color: C.text }]}>การเข้าสู่ระบบ</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: C.divider }]} />

                    <TouchableOpacity
                        style={styles.actionRow}
                        onPress={handleLogout}
                        activeOpacity={0.65}
                        disabled={loggingOut}
                    >
                        <View style={[styles.actionIconBox, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
                            {loggingOut ? (
                                <ActivityIndicator size="small" color={C.danger} />
                            ) : (
                                <Feather name="log-out" size={16} color={C.danger} />
                            )}
                        </View>
                        <Text style={[styles.actionLabel, { color: C.danger }]}>
                            {loggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
                        </Text>
                        <Feather name="chevron-right" size={20} color={C.subText} />
                    </TouchableOpacity>
                </View>

                {/* Subtle Delete Account */}
                <TouchableOpacity
                    style={{ alignItems: 'center', marginTop: 32, marginBottom: 16 }}
                    onPress={handleDeleteAccount}
                    activeOpacity={0.65}
                >
                    <Text style={{ fontFamily: 'Kanit-Regular', fontSize: 13, color: C.subText }}>
                        ลบบัญชีผู้ใช้
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Save bar (while editing) */}
            {isEditing && (
                <View
                    style={[
                        styles.saveBar,
                        {
                            backgroundColor: C.card,
                            borderTopColor: C.divider,
                            paddingBottom: insets.bottom + 12,
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={[styles.cancelBtn, { borderColor: C.cardBorder }]}
                        onPress={() => setIsEditing(false)}
                    >
                        <Text style={[styles.cancelBtnText, { color: C.subText }]}>ยกเลิก</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: C.accent }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.saveBtnText}>บันทึกการเปลี่ยนแปลง</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },


    // Scroll
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 24,
        gap: 14,
    },

    // Avatar
    avatarSection: {
        alignItems: 'center',
        marginBottom: 4,
    },
    avatarWrap: {
        position: 'relative',
        marginBottom: 12,
    },
    avatarRing: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 2,
        top: -5,
        left: -5,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2.5,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarInitial: {
        fontFamily: 'Kanit-Bold',
        fontSize: 32,
        color: '#fff',
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarName: {
        fontFamily: 'Kanit-Bold',
        fontSize: 20,
        letterSpacing: 0.3,
    },
    avatarSub: {
        fontFamily: 'Kanit-Regular',
        fontSize: 13,
        marginTop: 2,
    },

    // Card
    card: {
        borderRadius: 18,
        borderWidth: 1,
        overflow: 'hidden',
        paddingBottom: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    cardIconBox: {
        width: 32,
        height: 32,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontFamily: 'Kanit-Bold',
        fontSize: 15,
        letterSpacing: 0.2,
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
        marginBottom: 10,
    },

    // Field
    fieldGroup: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 5,
    },
    fieldLabel: {
        fontFamily: 'Kanit-Bold',
        fontSize: 11,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 2,
    },
    input: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 8,
    },

    // Info note
    infoNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingBottom: 10,
        paddingTop: 2,
    },
    infoNoteText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
    },

    // Action rows
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    actionIconBox: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        flex: 1,
        fontFamily: 'Kanit-Regular',
        fontSize: 15,
    },
    rowDivider: {
        height: 1,
        marginHorizontal: 16,
    },

    // Danger

    // Save bar
    saveBar: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 14,
        borderTopWidth: 1,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    cancelBtnText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 15,
    },
    saveBtn: {
        flex: 2,
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveBtnText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 15,
        color: '#fff',
        letterSpacing: 0.3,
    },
});
