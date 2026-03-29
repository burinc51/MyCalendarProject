import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { View } from 'react-native';
import { Calendar } from '@/components/Calendar';
import { useTheme } from '@/components/ThemeProvider';
import { useGroupStore } from '@/stores/useGroupStore';

export default function GroupCalendarScreen() {
    const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
    const { isDark } = useTheme();
    const router = useRouter();
    const { selectedGroupId, setSelectedGroupId } = useGroupStore();

    const onBack = () => {
        if (selectedGroupId === Number(id)) {
            setSelectedGroupId(null);
        }
        router.back();
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
            <Stack.Screen options={{ headerShown: false }} />
            <Calendar
                isGroupCalendar={true}
                groupId={id}
                groupName={name}
                onBack={() => onBack()}
            />
        </View>
    );
}
