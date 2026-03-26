import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { useGroupStore } from '@/stores/useGroupStore';
import { useAuthStore } from '@/stores/useAuthStore';
import ScreenHeader from '@/components/ScreenHeader';
import { getGroupById } from '@/services/groupService';

const ICONS = ['users', 'home', 'briefcase', 'heart', 'graduation-cap', 'utensils', 'plane', 'shopping-cart', 'dumbbell'];
const COLORS = ['#2ecc71', '#3b82f6', '#9b59b6', '#f1c40f', '#e67e22', '#e74c3c', '#1abc9c', '#34495e'];

export default function CreateGroupScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const { id, mode } = useLocalSearchParams<{ id?: string, mode?: 'edit' | 'create' }>();
    const isEdit = mode === 'edit';
    const groupId = id ? parseInt(id) : null;
    
    const insets = useSafeAreaInsets();
    const { createGroup, updateGroup, isLoading } = useGroupStore();
    const { user } = useAuthStore();

    const [name, setName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (isEdit && groupId) {
            loadGroupData();
        }
    }, [isEdit, groupId]);

    const loadGroupData = async () => {
        if (!groupId) return;
        try {
            setIsFetching(true);
            const g = await getGroupById(groupId);
            setName(g.name);
            setSelectedIcon(g.icon);
            setSelectedColor(g.color);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to load group data");
        } finally {
            setIsFetching(false);
        }
    };

    const handleAction = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }
        if (!user?.id) {
            Alert.alert('Error', 'User not found. Please login again.');
            return;
        }

        const payload = {
            groupName: name.trim(),
            icon: selectedIcon,
            color: selectedColor,
            bg: selectedColor + '20',
            description: '',
        };

        try {
            if (isEdit && groupId) {
                await updateGroup(groupId, payload);
                Alert.alert('Success', 'Group updated successfully!', [{ text: 'OK', onPress: () => router.back() }]);
            } else {
                const newGroup = await createGroup(payload, user.id);
                Alert.alert(
                    'Success', 
                    `Group "${newGroup.groupName}" created successfully!\n\nInvite Code: ${newGroup.inviteCode}`, 
                    [{ text: 'Great!', onPress: () => router.back() }]
                );
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} group`);
        }
    };

    const c = {
        bg: isDark ? '#111111' : '#f4f6f9',
        card: isDark ? '#1e1e1e' : '#ffffff',
        text: isDark ? '#f0f0f0' : '#1a1a2e',
        label: isDark ? '#a0a0a0' : '#6b7280',
        input: isDark ? '#262626' : '#ffffff',
        inputBorder: isDark ? '#333' : '#e2e8f0',
        inputText: isDark ? '#f0f0f0' : '#1a1a2e',
        placeholder: isDark ? '#555' : '#9ca3af',
    };

    if (isFetching) {
        return (
            <View style={[styles.root, { backgroundColor: c.bg, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={selectedColor} />
            </View>
        );
    }

    return (
        <View style={[styles.root, { backgroundColor: c.bg }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title={isEdit ? "Group Settings" : "Create Group"} showBack={true} />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView 
                    contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]} 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.previewContainer}>
                        <View style={[styles.previewIconBox, { backgroundColor: selectedColor + '20' }]}>
                            <FontAwesome5 name={selectedIcon} size={32} color={selectedColor} solid />
                        </View>
                        <Text style={[styles.previewName, { color: c.text }]}>{name || 'Group Name'}</Text>
                    </View>

                    <Text style={[styles.label, { color: c.label }]}>Group Name</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: c.input, borderColor: c.inputBorder, color: c.inputText }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="E.g., Family, Work Team..."
                        placeholderTextColor={c.placeholder}
                        maxLength={30}
                    />

                    <Text style={[styles.label, { color: c.label, marginTop: 24 }]}>Select Icon</Text>
                    <View style={styles.grid}>
                        {ICONS.map((icon) => {
                            const isSelected = selectedIcon === icon;
                            return (
                                <TouchableOpacity
                                    key={icon}
                                    style={[
                                        styles.iconBox,
                                        { 
                                            backgroundColor: isSelected ? selectedColor + '15' : c.input, 
                                            borderColor: isSelected ? selectedColor : c.inputBorder 
                                        },
                                    ]}
                                    onPress={() => setSelectedIcon(icon)}
                                >
                                    <FontAwesome5 name={icon as any} size={20} color={isSelected ? selectedColor : c.label} solid />
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={[styles.label, { color: c.label, marginTop: 28 }]}>Select Color</Text>
                    <View style={styles.colorGrid}>
                        {COLORS.map((color) => {
                            const isSelected = selectedColor === color;
                            return (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorCircle,
                                        { backgroundColor: color },
                                    ]}
                                    onPress={() => setSelectedColor(color)}
                                >
                                    {isSelected && <Feather name="check" size={20} color="#ffffff" />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.createBtn, 
                            { 
                                backgroundColor: selectedColor, 
                                shadowColor: selectedColor,
                                opacity: isLoading ? 0.7 : 1 
                            }
                        ]}
                        onPress={handleAction}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.createBtnText}>{isEdit ? "Save" : "Create Group"}</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    container: { padding: 24 },
    previewContainer: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 10,
    },
    previewIconBox: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    previewName: {
        fontFamily: 'Kanit-Bold',
        fontSize: 22,
    },
    label: { fontFamily: 'Kanit-Bold', fontSize: 13, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    input: { height: 54, borderWidth: 1, borderRadius: 14, paddingHorizontal: 18, fontFamily: 'Kanit-Regular', fontSize: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    iconBox: { width: 58, height: 58, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    colorCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    createBtn: { 
        height: 58, 
        borderRadius: 18, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 44, 
        shadowOffset: { width: 0, height: 6 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 12, 
        elevation: 8 
    },
    createBtnText: { color: '#ffffff', fontFamily: 'Kanit-Bold', fontSize: 18, letterSpacing: 0.5 },
});

