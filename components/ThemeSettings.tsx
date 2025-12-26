import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeOption {
    mode: ThemeMode;
    label: string;
    labelTh: string;
    icon: keyof typeof Ionicons.glyphMap;
    description: string;
}

const themeOptions: ThemeOption[] = [
    {
        mode: 'light',
        label: 'Light',
        labelTh: 'สว่าง',
        icon: 'sunny',
        description: 'Always use light theme',
    },
    {
        mode: 'dark',
        label: 'Dark',
        labelTh: 'มืด',
        icon: 'moon',
        description: 'Always use dark theme',
    },
    {
        mode: 'system',
        label: 'System',
        labelTh: 'ตามระบบ',
        icon: 'phone-portrait-outline',
        description: 'Follow system setting',
    },
];

export const ThemeSettings: React.FC = () => {
    const { themeMode, setThemeMode, theme } = useTheme();

    const isDark = theme === 'dark';

    return (
        <View className="w-full">
            {/* Section Header */}
            <View className="mb-3 px-1">
                <Text
                    className={`text-base font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-700'
                        }`}
                >
                    🎨 Theme / ธีม
                </Text>
            </View>

            {/* Theme Options */}
            <View
                className={`rounded-2xl overflow-hidden ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'
                    }`}
            >
                {themeOptions.map((option, index) => {
                    const isSelected = themeMode === option.mode;
                    const isLast = index === themeOptions.length - 1;

                    return (
                        <TouchableOpacity
                            key={option.mode}
                            onPress={() => setThemeMode(option.mode)}
                            className={`flex-row items-center px-4 py-3.5 ${!isLast
                                    ? isDark
                                        ? 'border-b border-neutral-700'
                                        : 'border-b border-neutral-200'
                                    : ''
                                }`}
                            activeOpacity={0.7}
                        >
                            {/* Icon */}
                            <View
                                className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isSelected
                                        ? 'bg-blue-500'
                                        : isDark
                                            ? 'bg-neutral-700'
                                            : 'bg-neutral-200'
                                    }`}
                            >
                                <Ionicons
                                    name={option.icon}
                                    size={20}
                                    color={isSelected ? '#fff' : isDark ? '#9ca3af' : '#6b7280'}
                                />
                            </View>

                            {/* Label & Description */}
                            <View className="flex-1">
                                <Text
                                    className={`text-base font-medium ${isSelected
                                            ? 'text-blue-500'
                                            : isDark
                                                ? 'text-neutral-200'
                                                : 'text-neutral-800'
                                        }`}
                                >
                                    {option.label} / {option.labelTh}
                                </Text>
                                <Text
                                    className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'
                                        }`}
                                >
                                    {option.description}
                                </Text>
                            </View>

                            {/* Checkmark */}
                            {isSelected && (
                                <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Current Theme Indicator */}
            <View className="mt-3 px-1">
                <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Current: {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                    {themeMode === 'system' && ' (Auto)'}
                </Text>
            </View>
        </View>
    );
};

export default ThemeSettings;
