import { View } from 'react-native';
import { Calendar } from '@/components/Calendar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function HomeScreen() {
    console.log('HomeScreen');
    return (
        <View className="flex-1 bg-white ">
            <Calendar />
        </View>
    );
}
