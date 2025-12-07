Native](https://img.shields.io/badge/React_Native-0.79.2-61DAFB?style=flat&logo=react)
![Expo](https://img.shields.io/badge/Expo-53.0.7-000020?style=flat&logo=expo)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.3-6DB33F?style=flat&logo=spring-boot)
![Java](https://img.shields.io/badge/Java-21-007396?style=flat&logo=openjdk)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-4169E1?style=flat&logo=postgresql)

## 📋 ภาพรวมโปรเจค

**MyCalendar** เป็นแอปพลิเคชันมือถือสำหรับการจัดการปฏิทิน กิจกรรม และโน้ต ที่ออกแบบมาเพื่อรองรับการทำงานร่วมกันแบบกลุ่ม พร้อมระบบแจ้งเตือนและการล็อกอินผ่าน Google

## 🏗️ สถาปัตยกรรมระบบ

โปรเจคประกอบด้วย 2 ส่วนหลัก:

```
MyCalendar/
├── MyCalendarProject/        # Frontend (React Native + Expo)
└── my-calendar-backend/      # Backend (Spring Boot)
```

---

## 📱 Frontend (MyCalendarProject)

### เทคโนโลยีที่ใช้

| เทคโนโลยี | เวอร์ชัน | คำอธิบาย |
|-----------|----------|----------|
| React Native | 0.79.2 | Framework สำหรับสร้าง Mobile App |
| Expo | 53.0.7 | Platform สำหรับ React Native Development |
| NativeWind | 4.1.23 | Tailwind CSS สำหรับ React Native |
| React Navigation | 7.0.0 | Navigation Library |
| TanStack Query | 5.74.4 | Server State Management |
| Day.js | 1.11.13 | Date/Time Library |
| Axios | 1.10.0 | HTTP Client |

### โครงสร้างโฟลเดอร์

```
MyCalendarProject/
├── app/                      # หน้าแอปพลิเคชัน (Expo Router)
│   ├── (tabs)/               # Tab Navigation
│   │   ├── index.tsx         # หน้าแรก (Calendar)
│   │   ├── explore.tsx       # หน้า Notes
│   │   ├── group.tsx         # หน้า Group Management
│   │   └── setting.tsx       # หน้า Settings & Auth
│   └── _layout.tsx           # Root Layout
├── components/               # React Components
│   ├── Calendar/             # Calendar Component
│   │   ├── CalendarView.tsx  # Main Calendar UI (1,197 lines)
│   │   └── CalendarBody.tsx  # Calendar Body Component
│   ├── ui/                   # UI Components
│   └── ThemeProvider.tsx     # Theme Management
├── hooks/                    # Custom React Hooks
│   ├── useColorScheme.ts     # Color Scheme Hook
│   └── useThemeColor.ts      # Theme Color Hook
├── services/                 # API Services
│   └── event-service.ts      # Event API Calls
├── types/                    # TypeScript Types
│   └── calendar.ts           # Calendar Types
├── utils/                    # Utility Functions
│   ├── get-date-from-index.ts
│   ├── month-names.ts
│   └── spacing.ts
└── lib/                      # Libraries
    └── httpClient.ts         # Axios Configuration
```

### หน้าหลักของแอป (Tabs)

#### 1. 📅 Calendar (index.tsx)
- แสดงปฏิทินรายเดือน
- ดูรายการกิจกรรมรายวัน
- สร้าง/แก้ไข/ลบกิจกรรม
- รองรับ All-day Events
- เลือกสี Priority และ Category

#### 2. 📝 Notes (explore.tsx)
- สร้างและจัดการโน้ต
- ค้นหาโน้ต
- เลือกสีโน้ต
- แสดงวันที่แก้ไขล่าสุด

#### 3. 👥 Groups (group.tsx)
- สร้างและจัดการกลุ่ม
- เลือกไอคอนกลุ่ม
- แชร์ปฏิทินกับสมาชิกกลุ่ม

#### 4. ⚙️ Settings (setting.tsx)
- Google Sign-In / Sign-Out
- แสดงข้อมูลผู้ใช้
- จัดการบัญชี

### Data Types

```typescript
// Calendar Event Interface
interface Calendar {
    id: number;
    userId?: number;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    isAllDay: boolean;
    color: string;
    category?: string;
    reminder?: number;
    priority?: 'low' | 'medium' | 'high';
}

// API Event Interface
interface ApiEvent {
    eventId: number;
    userId: number;
    title: string;
    description: string | null;
    imageUrl: string | null;
    startDate: string;
    endDate: string;
    location: string | null;
    notificationTime: string | null;
    repeating: string | null;
    color: string;
    category: string | null;
    priority: string;
    groupId: number | null;
    assignees: any[] | null;
    pinned: boolean;
}
```

---

## 🖥️ Backend (my-calendar-backend)

### เทคโนโลยีที่ใช้

| เทคโนโลยี | เวอร์ชัน | คำอธิบาย |
|-----------|----------|----------|
| Spring Boot | 3.3.3 | Java Framework |
| Java | 21 | Programming Language |
| PostgreSQL | Latest | Database |
| Spring Security | 6.x | Authentication & Authorization |
| Spring Data JPA | 3.x | ORM |
| JWT (jjwt) | 0.11.5 | Token Authentication |
| Swagger/OpenAPI | 2.6.0 | API Documentation |
| Lombok | Latest | Code Generation |
| ModelMapper | 3.1.1 | Object Mapping |

### โครงสร้างโฟลเดอร์

```
my-calendar-backend/src/main/java/com/mycalendar/dev/
├── DevApplication.java           # Main Application
├── config/                       # Configuration (5 files)
├── controller/
│   └── v1/                       # REST API v1
│       ├── AuthRestController.java
│       ├── EventRestController.java
│       ├── GroupRestController.java
│       ├── PermissionRestController.java
│       ├── RoleRestController.java
│       └── UserRestController.java
├── entity/                       # JPA Entities (9 files)
│   ├── BaseEntity.java
│   ├── Event.java
│   ├── Group.java
│   ├── Permission.java
│   ├── Role.java
│   ├── User.java
│   ├── UserGroup.java
│   ├── UserGroupId.java
│   └── UserSocialProvider.java
├── enums/                        # Enums (4 files)
├── exception/                    # Exception Handling (8 files)
├── helper/                       # Helper Classes (1 file)
├── mapper/                       # Object Mappers (2 files)
├── payload/                      # DTOs (34 files)
├── projection/                   # Query Projections (3 files)
├── repository/                   # JPA Repositories (9 files)
├── security/                     # Security Configuration (6 files)
├── service/                      # Business Logic
│   ├── IAuthService.java
│   ├── IEventService.java
│   ├── IGoogleAuth.java
│   ├── IGroupService.java
│   ├── IPermissionService.java
│   ├── IRoleService.java
│   ├── IUserService.java
│   └── implement/                # Implementations (7 files)
└── util/                         # Utilities (7 files)
```

### Database Entities

#### Event Entity
```java
@Entity
@Table(name = "events")
public class Event {
    private Long eventId;          // Primary Key
    private String title;          // ชื่อกิจกรรม
    private String description;    // คำอธิบาย
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String location;       // สถานที่
    private Double latitude;
    private Double longitude;
    private LocalDateTime notificationTime;  // เวลาแจ้งเตือน
    private String notificationType;         // POPUP, EMAIL, PUSH
    private Integer remindBeforeMinutes;     // แจ้งเตือนก่อนกี่นาที
    private String repeatType;     // NONE, DAILY, WEEKLY, MONTHLY, CUSTOM
    private LocalDateTime repeatUntil;
    private String color;
    private String category;
    private String priority;
    private Boolean pinned;
    private String imageUrl;
    private Long createById;
    private Boolean allDay;
    // Relations
    private Group group;           // ManyToOne
    private Set<User> users;       // ManyToMany
}
```

#### User Entity
```java
@Entity
@Table(name = "users")
public class User extends BaseEntity {
    private Long userId;
    private String username;
    private String password;
    private String name;
    private String email;
    private Set<Role> roles;
    private String activateCode;
    private Date activatedDate;
    private String resetPasswordToken;
    // Relations
    private Set<UserGroup> userGroups;
    private Set<Permission> permissions;
    private Set<UserSocialProvider> socialProviders;
}
```

#### Group Entity
```java
@Entity
@Table(name = "groups")
public class Group {
    private Long groupId;
    private String groupName;
    private String description;
    // Relations
    private Set<UserGroup> userGroups;
    private Set<Event> events;
    private Set<Permission> permissions;
}
```

### REST API Endpoints

| Controller | Base Path | คำอธิบาย |
|------------|-----------|----------|
| AuthRestController | `/v1/auth/` | การยืนยันตัวตน, Google Sign-In |
| EventRestController | `/api/v1/event/` | CRUD กิจกรรม |
| GroupRestController | `/api/v1/group/` | จัดการกลุ่ม |
| UserRestController | `/api/v1/user/` | จัดการผู้ใช้ |
| RoleRestController | `/api/v1/role/` | จัดการ Roles |
| PermissionRestController | `/api/v1/permission/` | จัดการ Permissions |

### API Documentation
- Swagger UI: `http://localhost:9001/swagger-ui.html`
- OpenAPI Spec: `http://localhost:9001/v3/api-docs`

---

## 🚀 การติดตั้งและรันโปรเจค

### Prerequisites
- Node.js 18+
- Yarn 4.9.1+
- Java 21
- PostgreSQL
- Android Studio / Xcode (สำหรับ Emulator)

### Frontend Setup

```bash
cd MyCalendarProject

# ติดตั้ง dependencies
yarn install

# สร้างไฟล์ .env (copy จาก .env.example)
cp .env.example .env

# รันแอป
npx expo start

# หรือรันบน Android
yarn android

# รันบน iOS
yarn ios
```

### Backend Setup

```bash
cd my-calendar-backend

# Build project
./mvnw clean package

# รัน application
./mvnw spring-boot:run

# หรือใช้ JAR
java -jar target/app.jar
```

### Environment Variables

#### Frontend (.env)
```
EXPO_PUBLIC_WEB_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_API_URL=http://localhost:9001
```

#### Backend (application.properties)
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/mycalendar
spring.datasource.username=postgres
spring.datasource.password=your_password
jwt.secret=your_jwt_secret
```

---

## 📦 Scripts

### Frontend
| Command | Description |
|---------|-------------|
| `yarn start` | Start Expo dev server |
| `yarn start-c` | Start with cache clear |
| `yarn android` | Run on Android |
| `yarn ios` | Run on iOS |
| `yarn web` | Run on Web |
| `yarn test` | Run tests |
| `yarn lint` | Run ESLint |
| `yarn lint:fix` | Fix ESLint errors |

### Backend
| Command | Description |
|---------|-------------|
| `./mvnw clean package` | Build project |
| `./mvnw spring-boot:run` | Run application |
| `./mvnw test` | Run tests |

---

## 🔐 Authentication Flow

1. **Google Sign-In** (Frontend)
   - ผู้ใช้กดปุ่ม "Sign in with Google"
   - รับ `idToken` จาก Google

2. **Token Verification** (Backend)
   - ส่ง `idToken` ไปที่ `/v1/auth/google-sign-in`
   - Backend ตรวจสอบ token กับ Google
   - สร้าง User ใหม่หรือ login User ที่มีอยู่
   - ส่งกลับ JWT token

3. **API Access**
   - ใช้ JWT token ใน Authorization header
   - `Authorization: Bearer <jwt_token>`

---

## 🗃️ Database Schema

```
┌─────────────────────┐     ┌─────────────────────┐
│       users         │     │       groups        │
├─────────────────────┤     ├─────────────────────┤
│ user_id (PK)        │     │ group_id (PK)       │
│ username            │     │ group_name          │
│ password            │     │ description         │
│ name                │     └─────────┬───────────┘
│ email               │               │
└─────────┬───────────┘               │
          │                           │
          │  ┌────────────────────────┼─────────────┐
          │  │                        │             │
          ▼  ▼                        ▼             │
┌─────────────────────┐     ┌─────────────────────┐ │
│     user_group      │     │       events        │ │
├─────────────────────┤     ├─────────────────────┤ │
│ user_id (FK)        │     │ event_id (PK)       │ │
│ group_id (FK)       │     │ title               │ │
│ role_in_group       │     │ description         │ │
└─────────────────────┘     │ start_date          │ │
                            │ end_date            │ │
                            │ location            │ │
                            │ color               │ │
                            │ priority            │ │
                            │ group_id (FK) ──────┘ │
                            └─────────────────────┘ │
                                                    │
┌─────────────────────┐     ┌─────────────────────┐ │
│       roles         │     │    permissions      │ │
├─────────────────────┤     ├─────────────────────┤ │
│ role_id (PK)        │     │ permission_id (PK)  │ │
│ role_name           │     │ permission_name     │ │
└─────────────────────┘     └─────────────────────┘
```

---

## 👨‍💻 Development Notes

### Code Style
- **Frontend**: ESLint + Prettier
- **Backend**: Lombok for reducing boilerplate

### Testing
- **Frontend**: Jest + React Test Renderer
- **Backend**: JUnit 5 + Spring Testing

### Deployment
- **Frontend**: EAS Build (Expo Application Services)
- **Backend**: Docker / JAR deployment

---

## 📄 License

Private Project

---

## 🤝 Contributors

- Development Team
