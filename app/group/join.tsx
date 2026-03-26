import React, { useState, useRef } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    KeyboardAvoidingView, 
    Platform, 
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { useGroupStore } from '@/stores/useGroupStore';
import ScreenHeader from '@/components/ScreenHeader';

export default function JoinGroupScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { joinGroup, isLoading } = useGroupStore();

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    const handleJoin = async () => {
        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            Alert.alert('Error', 'Please enter a 6-digit invite code');
            return;
        }

        try {
            await joinGroup(fullCode);
            Alert.alert('Success', 'You have joined the group!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Invalid invite code or group not found');
        }
    };

    const handleInputChange = (text: string, index: number) => {
        const newCode = [...code];
        // Handle paste or multiple chars
        if (text.length > 1) {
            const pastedText = text.substring(0, 6).toUpperCase().split('');
            pastedText.forEach((char, i) => {
                if (index + i < 6) newCode[index + i] = char;
            });
            setCode(newCode);
            // Focus last filled or next
            const nextIdx = Math.min(index + pastedText.length, 5);
            inputRefs.current[nextIdx]?.focus();
            return;
        }

        newCode[index] = text.toUpperCase();
        setCode(newCode);

        // Auto focus next
        if (text && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const c = {
        bg: isDark ? '#111111' : '#f4f6f9',
        card: isDark ? '#1e1e1e' : '#ffffff',
        text: isDark ? '#f0f0f0' : '#1a1a2e',
        label: isDark ? '#a0a0a0' : '#6b7280',
        input: isDark ? '#262626' : '#ffffff',
        inputBorder: isDark ? '#333' : '#e2e8f0',
        inputText: isDark ? '#f0f0f0' : '#111',
    };

    return (
        <View style={[styles.root, { backgroundColor: c.bg }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title="Join Group" showBack={true} />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}>
                    <View style={styles.headerSection}>
                        <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff' }]}>
                            <Feather name="users" size={32} color="#3b82f6" />
                        </View>
                        <Text style={[styles.title, { color: c.text }]}>Enter Invite Code</Text>
                        <Text style={[styles.subtitle, { color: c.label }]}>
                            Ask the group admin for the 6-digit code to join their workspace.
                        </Text>
                    </View>

                    <View style={styles.otpContainer}>
                        {code.map((digit, idx) => (
                            <TextInput
                                key={idx}
                                ref={(el) => { inputRefs.current[idx] = el; }}
                                style={[
                                    styles.otpInput,
                                    { 
                                        backgroundColor: c.input, 
                                        borderColor: digit ? '#3b82f6' : c.inputBorder,
                                        color: c.inputText,
                                        borderWidth: digit ? 2 : 1
                                    }
                                ]}
                                value={digit}
                                onChangeText={(text) => handleInputChange(text, idx)}
                                onKeyPress={(e) => handleKeyPress(e, idx)}
                                maxLength={idx === 0 ? 6 : 1} // allow paste on first box
                                keyboardType="default"
                                autoCapitalize="characters"
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.joinBtn, { backgroundColor: '#3b82f6', opacity: isLoading ? 0.7 : 1 }]}
                        onPress={handleJoin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.joinBtnText}>Join Group</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={[styles.footerText, { color: c.label }]}>
                        Codes are case-sensitive and 6 characters long.
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    container: { padding: 24, alignItems: 'center' },
    headerSection: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    title: { fontFamily: 'Kanit-Bold', fontSize: 24, marginBottom: 8 },
    subtitle: { fontFamily: 'Kanit-Regular', fontSize: 15, textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 },
    otpContainer: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 40 },
    otpInput: {
        width: 45,
        height: 55,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 22,
        fontFamily: 'Kanit-Bold',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    joinBtn: { width: '100%', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    joinBtnText: { color: '#ffffff', fontFamily: 'Kanit-Bold', fontSize: 18 },
    footerText: { fontFamily: 'Kanit-Regular', fontSize: 13, marginTop: 24, textAlign: 'center' },
});
