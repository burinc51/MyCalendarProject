import { View, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { Calendar } from '@/components/Calendar';
import { useTheme } from '@/components/ThemeProvider';

export default function HomeScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const containerStyle = useMemo(() => ({
        flex: 1,
        backgroundColor: isDark ? '#171717' : '#ffffff'
    }), [isDark]);

    return (
        <View style={containerStyle}>
            <Calendar />
        </View>
    );
}
