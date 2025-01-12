import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { PanGestureHandler, GestureHandlerRootView, State, HandlerStateChangeEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import { Calendar } from 'react-native-big-calendar';
import dayjs from 'dayjs';

const events = [
    {
        title: 'Meeting',
        start: new Date(2025, 0, 15, 10, 0),
        end: new Date(2025, 0, 15, 11, 0),
        color: 'green'
    }
];

const CustomCalendar = () => {
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [translateX] = useState(new Animated.Value(0)); // ใช้สำหรับแอนิเมชัน (ถ้าต้องการ)

    const handleGestureEvent = (event: { nativeEvent: { translationX: number } }) => {
        // คุณสามารถใช้สำหรับเพิ่มแอนิเมชันในอนาคต
        translateX.setValue(event.nativeEvent.translationX);
    };

    const handleGestureEnd = (event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
        const { translationX } = event.nativeEvent;

        // ตรวจสอบการสไลด์ซ้ายหรือขวา
        if (translationX < -100) {
            // สไลด์ซ้าย (ไปเดือนถัดไป)
            setCurrentDate(currentDate.add(1, 'month'));
        } else if (translationX > 100) {
            // สไลด์ขวา (ไปเดือนก่อนหน้า)
            setCurrentDate(currentDate.subtract(1, 'month'));
        }

        // รีเซ็ตค่า translateX
        translateX.setValue(0);
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <PanGestureHandler
                onGestureEvent={handleGestureEvent}
                onHandlerStateChange={(event) => {
                    if (event.nativeEvent.state === State.END) {
                        handleGestureEnd(event); // จับเฉพาะเมื่อปล่อยนิ้ว
                    }
                }}
            >
                <Animated.View style={{ flex: 1 }}>
                    <View style={styles.container}>
                        {/* Header แสดงเดือน */}
                        <View style={styles.monthHeader}>
                            <TouchableOpacity
                                onPress={() => setCurrentDate(currentDate.subtract(1, 'month'))}
                                style={styles.arrowButton}
                            >
                                <Text style={styles.arrowText}>{'<'}</Text>
                            </TouchableOpacity>
                            <View style={styles.monthContainer}>
                                <Text style={styles.monthText}>{currentDate.format('MMMM YYYY')}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setCurrentDate(currentDate.add(1, 'month'))}
                                style={styles.arrowButton}
                            >
                                <Text style={styles.arrowText}>{'>'}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Calendar */}
                        <Calendar
                            mode="month"
                            height={600}
                            events={events}
                            date={currentDate.toDate()}
                            onPressEvent={(event) => alert(event.title)}
                            eventCellStyle={(event) => ({
                                marginTop: 10,
                                backgroundColor: event.color,
                                borderRadius: 5,
                                padding: 2,
                                minHeight: 22,
                                alignItems: 'center'
                            })}
                        />
                    </View>
                </Animated.View>
            </PanGestureHandler>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    monthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        margin: 10
    },
    arrowButton: {
        paddingHorizontal: 10
    },
    arrowText: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    monthContainer: {
        flex: 1,
        alignItems: 'center'
    },
    monthText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000'
    }
});

export default CustomCalendar;
