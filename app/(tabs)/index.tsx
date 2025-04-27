// import { Calendar } from 'react-native-big-calendar';
import { View, Dimensions, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Calendar } from '@/components/Calendar';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function HomeScreen() {
    console.log('HomeScreen');
    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#333333' }}>
            <View className="flex-1 bg-white ">
                {/*<Calendar*/}
                {/*    events={[]}*/}
                {/*    height={SCREEN_HEIGHT - 80}*/}
                {/*    mode="month"*/}
                {/*    calendarCellStyle={{*/}
                {/*        borderTopWidth: 1,*/}
                {/*        borderBottomWidth: 0,*/}
                {/*        borderLeftWidth: 0,*/}
                {/*        borderRightWidth: 0,*/}
                {/*        borderColor: '#cccccc'*/}
                {/*    }}*/}
                {/*    onChangeDate={([start, end]) => {*/}
                {/*        console.log(`Date range changed: Start - ${start}, End - ${end}`);*/}
                {/*    }}*/}
                {/*    swipeEnabled={true}*/}
                {/*/>*/}
                <Calendar />
            </View>
        </GestureHandlerRootView>
    );
}
