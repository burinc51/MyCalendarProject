import { Calendar } from 'react-native-big-calendar';
import { StyleSheet, View, Dimensions, SafeAreaView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const events = [
        {
            title: 'Meeting',
            start: new Date(2025, 2, 23, 10, 0),
            end: new Date(2025, 2, 23, 10, 30)
        },
        {
            title: 'Coffee break',
            start: new Date(2025, 2, 26, 15, 45),
            end: new Date(2025, 2, 26, 16, 30)
        }
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.calendarStyle}>
                    <Calendar
                        events={[]}
                        height={600}
                        mode="month"
                    />
                </View>
            </GestureHandlerRootView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1
    },
    calendarStyle: {
        flex: 1,
        top: 40
    },
    headerStyle: {
        // Header style customization if needed
    },
    dayHeaderStyle: {
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        borderRightWidth: 0
    }
});
