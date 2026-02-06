import { View } from 'react-native';
import { Calendar } from '@/components/Calendar';
import { useTheme } from '@/components/ThemeProvider';

export default function HomeScreen() {
    const { isDark } = useTheme();

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
            <Calendar />
        </View>
    );
}
