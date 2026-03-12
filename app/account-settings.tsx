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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';

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
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { headerHeight, horizontalPadding, titleFontSize } = useResponsiveDimensions();

    const [displayName, setDisplayName] = useState('User');
    const [email, setEmail] = useState('user@example.com');
    const [bio, setBio] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

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

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(res => setTimeout(res, 800));
        setSaving(false);
        setIsEditing(false);
        Alert.alert('Saved', 'Your account information has been updated.');
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => Alert.alert('Done', 'Your account has been deleted.'),
                },
            ]
        );
    };


    return (
        <View style={[styles.container, { backgroundColor: C.bg }]}>
            {/* Header */}
            <View
                style={[
                    styles.header,
                    {
                        height: headerHeight,
                        paddingHorizontal: horizontalPadding,
                        backgroundColor: C.headerBg,
                        borderBottomColor: C.headerBorder,
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <View style={[styles.backBtnInner, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                        <Feather name="arrow-left" size={18} color={C.text} />
                    </View>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: C.text, fontSize: titleFontSize }]}>Account Settings</Text>
                <TouchableOpacity
                    style={[
                        styles.editToggleBtn,
                        {
                            backgroundColor: isEditing
                                ? C.accent
                                : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        },
                    ]}
                    onPress={() => {
                        if (isEditing) {
                            handleSave();
                        } else {
                            setIsEditing(true);
                        }
                    }}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : isEditing ? (
                        <Feather name="check" size={16} color="#fff" />
                    ) : (
                        <Feather name="edit-2" size={16} color={C.text} />
                    )}
                </TouchableOpacity>
            </View>

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
                            <Text style={styles.avatarInitial}>
                                {displayName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        {isEditing && (
                            <TouchableOpacity
                                style={[styles.cameraBtn, { backgroundColor: C.accent }]}
                                onPress={() => Alert.alert('Coming Soon', 'Profile photo change will be available soon.')}
                            >
                                <Feather name="camera" size={12} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={[styles.avatarName, { color: C.text }]}>{displayName}</Text>
                    <Text style={[styles.avatarSub, { color: C.subText }]}>{email}</Text>
                </View>

                {/* Profile Info */}
                <View style={[styles.card, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconBox, { backgroundColor: isDark ? 'rgba(46,204,113,0.12)' : 'rgba(46,204,113,0.1)' }]}>
                            <Feather name="user" size={16} color={C.accent} />
                        </View>
                        <Text style={[styles.cardTitle, { color: C.text }]}>Profile Info</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: C.divider }]} />

                    <FieldInput
                        label="Display Name"
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="Enter your display name"
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
                        <Text style={[styles.cardTitle, { color: C.text }]}>Contact Info</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: C.divider }]} />

                    <FieldInput
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="your@email.com"
                        editable={false}
                        isEditing={isEditing}
                        colors={C}
                    />
                    <View style={styles.infoNote}>
                        <Feather name="info" size={12} color={C.subText} />
                        <Text style={[styles.infoNoteText, { color: C.subText }]}>
                            Email is linked to your Google account.
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

                {/* Danger Zone */}
                <View style={[styles.card, { backgroundColor: C.card, borderColor: 'rgba(239,68,68,0.2)' }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconBox, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                            <Feather name="alert-triangle" size={16} color={C.danger} />
                        </View>
                        <Text style={[styles.cardTitle, { color: C.danger }]}>Danger Zone</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: 'rgba(239,68,68,0.15)' }]} />
                    <TouchableOpacity
                        style={[styles.dangerBtn, { borderColor: 'rgba(239,68,68,0.35)' }]}
                        onPress={handleDeleteAccount}
                        activeOpacity={0.7}
                    >
                        <Feather name="trash-2" size={15} color={C.danger} />
                        <Text style={[styles.dangerBtnText, { color: C.danger }]}>Delete Account</Text>
                    </TouchableOpacity>
                </View>
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
                        <Text style={[styles.cancelBtnText, { color: C.subText }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: C.accent }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 0.25,
        borderBottomColor: '#424141a9',
        gap: 12,
    },
    backBtn: {},
    backBtnInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontFamily: 'Kanit-Bold',
        fontSize: 18,
        letterSpacing: 0.3,
    },
    editToggleBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },

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
    // actionRow: {
    //     flexDirection: 'row',
    //     alignItems: 'center',
    //     gap: 12,
    //     paddingHorizontal: 16,
    //     paddingVertical: 12,
    // },
    // actionIconBox: {
    //     width: 34,
    //     height: 34,
    //     borderRadius: 10,
    //     justifyContent: 'center',
    //     alignItems: 'center',
    // },
    // actionLabel: {
    //     flex: 1,
    //     fontFamily: 'Kanit-Regular',
    //     fontSize: 15,
    // },
    // rowDivider: {
    //     height: 1,
    //     marginHorizontal: 16,
    // },

    // Danger
    dangerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 16,
        marginVertical: 10,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderStyle: 'dashed',
    },
    dangerBtnText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
        letterSpacing: 0.2,
    },

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
