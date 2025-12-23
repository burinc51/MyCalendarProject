# Tech Stack Setup Guide

## ติดตั้งแล้ว ✅

### 1. **Zustand** - State Management
- ติดตั้งแล้ว: `zustand@5.0.9`
- ไฟล์ตัวอย่าง: `stores/useAuthStore.ts`
- การใช้งาน:
```typescript
import { useAuthStore } from '@/stores/useAuthStore';

// ใน component
const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
```

### 2. **TanStack Query** - Server State Management
- ติดตั้งแล้ว: `@tanstack/react-query@5.90.12`
- ไฟล์ config: `lib/queryClient.ts`
- ไฟล์ตัวอย่าง: `hooks/useEvents.ts`
- Setup: เพิ่ม `QueryClientProvider` ใน `app/_layout.tsx` แล้ว
- การใช้งาน:
```typescript
import { useEvents } from '@/hooks/useEvents';

// ใน component
const { events, isLoading, createEvent, updateEvent, deleteEvent } = useEvents();
```

### 3. **React Hook Form** - Form Management
- ติดตั้งแล้ว: `react-hook-form@7.69.0`
- การใช้งาน:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventFormSchema } from '@/schemas/eventSchema';

const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(eventFormSchema)
});
```

### 4. **Zod** - Validation
- ติดตั้งแล้ว: `zod@4.2.1`
- ไฟล์ schema: `schemas/eventSchema.ts`
- การใช้งาน:
```typescript
import { eventFormSchema, EventFormData } from '@/schemas/eventSchema';

// Validate data
const result = eventFormSchema.safeParse(data);
if (result.success) {
    // data is valid
}
```

## โครงสร้างไฟล์ที่สร้างขึ้น

```
MyCalendarProject/
├── stores/
│   └── useAuthStore.ts          # Zustand store สำหรับ authentication
├── lib/
│   └── queryClient.ts           # TanStack Query configuration
├── hooks/
│   └── useEvents.ts             # Custom hook สำหรับจัดการ events
├── schemas/
│   └── eventSchema.ts           # Zod validation schemas
└── app/
    └── _layout.tsx              # เพิ่ม QueryClientProvider แล้ว
```

## ขั้นตอนต่อไป

1. **ลบ npm dependencies** (เปลี่ยนมาใช้ yarn แล้ว)
   - ลบ `package-lock.json` แล้ว ✅
   - ใช้ `yarn` แทน `npm` ในการติดตั้ง packages

2. **Migrate CalendarView** ให้ใช้ TanStack Query
   - แทนที่ `useState` + `useEffect` ด้วย `useEvents` hook
   - ลด boilerplate code

3. **เพิ่ม React Hook Form** ใน Event Form
   - ใช้ `useForm` แทนการจัดการ state แบบเดิม
   - เพิ่ม validation ด้วย Zod

4. **สร้าง stores เพิ่มเติม** ตามความต้องการ
   - Notes store
   - Groups store
   - UI state store

## ตัวอย่างการ Migrate CalendarView

```typescript
// Before (ใช้ useState + useEffect)
const [events, setEvents] = useState([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
    fetchEvents();
}, []);

// After (ใช้ TanStack Query)
const { events, isLoading, createEvent, updateEvent, deleteEvent } = useEvents();
```

## หมายเหตุ

- ทุก packages ติดตั้งผ่าน `yarn` แล้ว
- `package-lock.json` ถูกลบออกแล้ว (ใช้ `yarn.lock` แทน)
- TanStack Query Provider ถูก setup ใน root layout แล้ว
- พร้อมใช้งานทันที! 🚀
