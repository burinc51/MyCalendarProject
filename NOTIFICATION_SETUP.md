# Local Notifications Setup Guide

## 📱 ภาพรวม

ระบบ Notification นี้ใช้ **expo-notifications** สำหรับการแจ้งเตือนแบบ Local (บนเครื่อง) ซึ่งมีคุณสมบัติ:

✅ **แจ้งเตือนได้แม้ปิดแอป** - ใช้ Local Scheduled Notifications  
✅ **แจ้งเตือนเฉพาะเครื่อง** - ไม่ต้องใช้ Server  
✅ **ตั้งเวลาล่วงหน้า** - กำหนดเวลาแจ้งเตือนได้แม่นยำ  
✅ **จัดการได้ง่าย** - ยกเลิก/แก้ไขการแจ้งเตือนได้  

---

## 🚀 การติดตั้ง

```bash
# ติดตั้ง packages
yarn add expo-notifications expo-device expo-constants

# สำหรับ Android - เพิ่มใน app.json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ],
    "android": {
      "useNextNotificationsApi": true
    }
  }
}
```

---

## 📁 โครงสร้างไฟล์

```
MyCalendarProject/
├── services/
│   └── notificationService.ts      # 🔔 Notification Functions
├── stores/
│   └── useNotificationStore.ts     # 💾 Notification State Management
├── hooks/
│   └── useNotifications.ts         # 🎣 Notification Hook
└── components/
    └── notifications/
        └── EventNotificationExample.tsx  # 📝 ตัวอย่างการใช้งาน
```

---

## 🛠️ การใช้งาน

### 1. Setup ใน Root Layout

```typescript
// app/_layout.tsx
import { useNotifications } from '@/hooks/useNotifications';

export default function RootLayout() {
    // เรียกใช้ hook นี้เพื่อ setup listeners
    useNotifications();
    
    return (
        // ... your layout
    );
}
```

### 2. ตั้งค่าการแจ้งเตือนเมื่อสร้าง Event

```typescript
import { scheduleEventReminder } from '@/services/notificationService';
import { useNotificationStore } from '@/stores/useNotificationStore';

function CreateEventForm() {
    const { addEventNotification } = useNotificationStore();
    
    const handleCreateEvent = async (eventData) => {
        // 1. สร้าง Event ใน Database
        const event = await createEvent(eventData);
        
        // 2. ตั้งค่าการแจ้งเตือน (เช่น 15 นาทีก่อน Event)
        const notificationId = await scheduleEventReminder(
            event.id,
            event.title,
            new Date(event.startDate),
            15 // แจ้งเตือน 15 นาทีก่อน
        );
        
        // 3. บันทึก Notification ID
        await addEventNotification({
            eventId: event.id,
            notificationId,
            reminderMinutes: 15,
            scheduledAt: new Date().toISOString()
        });
    };
}
```

### 3. ยกเลิกการแจ้งเตือนเมื่อลบ Event

```typescript
import { cancelAllEventNotifications } from '@/services/notificationService';
import { useNotificationStore } from '@/stores/useNotificationStore';

function EventDetails({ eventId }) {
    const { removeEventNotification } = useNotificationStore();
    
    const handleDeleteEvent = async () => {
        // 1. ยกเลิกการแจ้งเตือน
        await cancelAllEventNotifications(eventId);
        await removeEventNotification(eventId);
        
        // 2. ลบ Event
        await deleteEvent(eventId);
    };
}
```

---

## 🎯 API Reference

### `scheduleEventReminder()`
กำหนดการแจ้งเตือนล่วงหน้า

```typescript
await scheduleEventReminder(
    eventId: number,        // ID ของ Event
    title: string,          // หัวข้อ Event
    startDate: Date,        // วันเวลาเริ่ม Event
    reminderMinutes: number // แจ้งเตือนกี่นาทีก่อน (5, 15, 30, 60)
);
```

### `scheduleEventNotification()`
กำหนดการแจ้งเตือนในเวลาที่ระบุ

```typescript
await scheduleEventNotification(
    eventId: number,
    title: string,
    body: string,
    triggerDate: Date      // วันเวลาที่ต้องการแจ้งเตือน
);
```

### `cancelAllEventNotifications()`
ยกเลิกการแจ้งเตือนทั้งหมดของ Event

```typescript
await cancelAllEventNotifications(eventId: number);
```

### `getAllScheduledNotifications()`
ดูการแจ้งเตือนที่กำหนดไว้ทั้งหมด

```typescript
const notifications = await getAllScheduledNotifications();
console.log(notifications);
```

---

## 💡 ตัวอย่างการใช้งานจริง

### สร้าง Event พร้อมการแจ้งเตือนหลายครั้ง

```typescript
const handleCreateEventWithMultipleReminders = async (eventData) => {
    const event = await createEvent(eventData);
    const startDate = new Date(event.startDate);
    
    // แจ้งเตือน 1 วันก่อน
    await scheduleEventReminder(event.id, event.title, startDate, 1440);
    
    // แจ้งเตือน 1 ชั่วโมงก่อน
    await scheduleEventReminder(event.id, event.title, startDate, 60);
    
    // แจ้งเตือน 15 นาทีก่อน
    await scheduleEventReminder(event.id, event.title, startDate, 15);
};
```

### ทดสอบการแจ้งเตือน

```typescript
import { sendTestNotification } from '@/services/notificationService';

// แจ้งเตือนทันที
await sendTestNotification();
```

---

## ⚠️ ข้อควรระวัง

1. **Permission** - ต้องขอ Permission จาก User ก่อนใช้งาน
2. **Physical Device** - ควรทดสอบบนเครื่องจริง (Emulator อาจไม่แสดงผล)
3. **Android Channel** - Android ต้องสร้าง Notification Channel
4. **Time Zone** - ระวังเรื่อง Time Zone เมื่อกำหนดเวลา
5. **Battery Optimization** - บาง Android อาจบล็อก Background Notifications

---

## 🔧 Configuration

### Android (app.json)

```json
{
  "expo": {
    "android": {
      "useNextNotificationsApi": true,
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    }
  }
}
```

### iOS (app.json)

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    }
  }
}
```

---

## 📚 เอกสารเพิ่มเติม

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Local vs Push Notifications](https://docs.expo.dev/push-notifications/overview/)

---

## ✅ Checklist

- [x] ติดตั้ง expo-notifications
- [x] สร้าง notificationService.ts
- [x] สร้าง useNotificationStore.ts
- [x] สร้าง useNotifications.ts hook
- [x] เพิ่ม useNotifications() ใน Root Layout
- [ ] ทดสอบการแจ้งเตือนบนเครื่องจริง
- [ ] Integrate กับ Event Form
- [ ] Integrate กับ Event Delete

---

**หมายเหตุ:** ระบบนี้เป็น **Local Notifications** ทำงานบนเครื่องเท่านั้น ถ้าต้องการส่ง Notification จาก Server ไปหลายเครื่อง ต้องใช้ **Push Notifications** แทน
