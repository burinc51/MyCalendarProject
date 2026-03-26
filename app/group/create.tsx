import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { useGroupStore } from '@/stores/useGroupStore';
import { useAuthStore } from '@/stores/useAuthStore';
import ScreenHeader from '@/components/ScreenHeader';

const ICONS = ['building', 'home', 'user-friends', 'briefcase', 'heart', 'star', 'users', 'coffee', 'book'];
const COLORS = ['#4ade80', '#60a5fa', '#f472b6', '#facc15', '#c084fc', '#fb923c', '#f87171', '#2dd4bf'];

export default function CreateGroupScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { createGroup, isLoading } = useGroupStore();
    const { user } = useAuthStore();

    const [name, setName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }
        if (!user?.id) {
            Alert.alert('Error', 'User not found. Please login again.');
            return;
        }

        try {
            await createGroup({
                groupName: name.trim(),
                icon: selectedIcon,
                color: selectedColor,
                bg: selectedColor + '20',
                description: '',
            }, user.id);
            Alert.alert('Success', 'Group created successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create group');
        }
    };

    const c = {
        bg: isDark ? '#111111' : '#f4f6f9',
        card: isDark ? '#1e1e1e' : '#ffffff',
        text: isDark ? '#f0f0f0' : '#1a1a2e',
        label: isDark ? '#a0a0a0' : '#6b7280',
        input: isDark ? '#262626' : '#f7f9fc',
        inputBorder: isDark ? '#333' : '#e2e8f0',
        inputText: isDark ? '#f0f0f0' : '#1a1a2e',
        placeholder: isDark ? '#555' : '#9ca3af',
    };

    return (
        <View style={[styles.root, { backgroundColor: c.bg }]}>
            <ScreenHeader title="Create Config" actions={[{ icon: 'x', onPress: () => router.back() }]} />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
                    <Text style={[styles.label, { color: c.label }]}>Group Name</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: c.input, borderColor: c.inputBorder, color: c.inputText }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="E.g., Family, Work Team..."
                        placeholderTextColor={c.placeholder}
                    />

                    <Text style={[styles.label, { color: c.label, marginTop: 20 }]}>Select Icon</Text>
                    <View style={styles.grid}>
                        {ICONS.map((icon) => {
                            const isSelected = selectedIcon === icon;
                            return (
                                <TouchableOpacity
                                    key={icon}
                                    style={[
                                        styles.iconBox,
                                        { backgroundColor: c.input, borderColor: isSelected ? selectedColor : c.inputBorder },
                                        isSelected && { backgroundColor: selectedColor + '20' }
                                    ]}
                                    onPress={() => setSelectedIcon(icon)}
                                >
                                    <Feather name={icon as any} size={24} color={isSelected ? selectedColor : c.label} />
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={[styles.label, { color: c.label, marginTop: 24 }]}>Select Color</Text>
                    <View style={styles.colorGrid}>
                        {COLORS.map((color) => {
                            const isSelected = selectedColor === color;
                            return (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorCircle,
                                        { backgroundColor: color },
                                        isSelected && styles.colorCircleSelected,
                                    ]}
                                    onPress={() => setSelectedColor(color)}
                                >
                                    {isSelected && <Feather name="check" size={16} color="#ffffff" />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity
                        style={[styles.createBtn, { backgroundColor: '#2ecc71', opacity: isLoading ? 0.7 : 1 }]}
                        onPress={handleCreate}
                        disabled={isLoading}
                    >
                        <Text style={styles.createBtnText}>{isLoading ? 'Creating...' : 'Create Group'}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    container: { padding: 20 },
    label: { fontFamily: 'Kanit-Bold', fontSize: 14, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontFamily: 'Kanit-Regular', fontSize: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    iconBox: { width: 60, height: 60, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    colorCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    colorCircleSelected: { borderWidth: 3, borderColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
    createBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 40, shadowColor: '#2ecc71', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
    createBtnText: { color: '#ffffff', fontFamily: 'Kanit-Bold', fontSize: 18 },
});
