import React, { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { Alert, BackHandler, useColorScheme } from 'react-native';

interface ThemeContextType {
    theme: 'light' | 'dark';
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const initialThemeRef = useRef(systemColorScheme || 'light');
    const theme = initialThemeRef.current;
    const isDark = theme === 'dark';

    useEffect(() => {
        const currentSystem = systemColorScheme || 'light';
        if (currentSystem !== initialThemeRef.current) {
            Alert.alert(
                'Theme Changed',
                'Your system theme pattern changed. Please restart the app to apply the new theme gracefully without freezing.',
                [{ text: 'Close App', style: 'destructive', onPress: () => BackHandler.exitApp() }]
            );
        }
    }, [systemColorScheme]);

    return (
        <ThemeContext.Provider value={{ theme, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Hook สำหรับใช้ colors ตาม theme
export const useThemeColors = () => {
    const { theme } = useTheme();

    const colors = {
        // Background
        background: theme === 'light' ? '#ffffff' : '#171717',
        surface: theme === 'light' ? '#f8fafc' : '#171717',

        // Text
        textPrimary: theme === 'light' ? '#1e293b' : '#f1f5f9',
        textSecondary: theme === 'light' ? '#64748b' : '#94a3b8',
        textDisabled: theme === 'light' ? '#cbd5e1' : '#475569',

        // Border
        border: theme === 'light' ? '#e2e8f0' : '#334155',

        // Primary
        primary: '#3b82f6',
        primaryLight: '#60a5fa',
        primaryDark: '#1d4ed8',

        // Neutral
        neutral50: theme === 'light' ? '#fafafa' : '#0a0a0a',
        neutral100: theme === 'light' ? '#f5f5f5' : '#171717',
        neutral200: theme === 'light' ? '#e5e5e5' : '#262626',
        neutral300: theme === 'light' ? '#d4d4d4' : '#404040',
        neutral400: theme === 'light' ? '#a3a3a3' : '#525252',
        neutral500: theme === 'light' ? '#737373' : '#737373',
        neutral600: theme === 'light' ? '#525252' : '#a3a3a3',
        neutral700: theme === 'light' ? '#404040' : '#d4d4d4',
        neutral800: theme === 'light' ? '#262626' : '#e5e5e5',
        neutral900: theme === 'light' ? '#171717' : '#f5f5f5',

        // Status Colors
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#0ea5e9',
    };

    return colors;
};
