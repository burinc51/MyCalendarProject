// import { Calendar } from 'react-native-big-calendar';
import { View, Dimensions, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Calendar } from '@/components/Calendar';
import { StyleSheet } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function HomeScreen() {
    console.log('HomeScreen');
    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#333333' }}>
            <View className="flex-1 bg-white ">
                <Calendar />
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: 'absolute'
    }
});
