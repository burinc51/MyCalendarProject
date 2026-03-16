import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { View } from 'react-native';
import { Calendar } from '@/components/Calendar';
import { useTheme } from '@/components/ThemeProvider';

export default function GroupCalendarScreen() {
    const { name } = useLocalSearchParams<{ id: string; name: string }>();
    const { isDark } = useTheme();
    const router = useRouter();

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
            <Stack.Screen options={{ headerShown: false }} />
            <Calendar
                isGroupCalendar={true}
                groupName={name}
                onBack={() => router.back()}
            />
        </View>
    );
}
