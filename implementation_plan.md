# UI Implementation Plan - MyCalendarProject

## Goal
Implement the UI for a Calendar/Planner application based on provided user requirements. The app needs to support Notes (with rich details), Calendar Views, Profile Management, and Group Appointments.

## Requirements Breakdown (from Image)
1.  **Note Features**:
    - Add Photo, Location, Reminders, Start/End Dates, Recurrence, Pre-notification.
    - Pin important notes.
2.  **Calendar Features**:
    - Views: Day, Week, Month, Year.
    - Manage Activity Plans (Add, Edit, Recurrence, Location, Reminders).
    - Share plans.
3.  **Profile**:
    - Edit Name, Photo.
4.  **Group/Appointment**:
    - Create Groups, Manage Members.
    - Share plans within groups.

## User Review Required
- [ ] Confirm specific design aesthetic (User mentioned "Modern/Premium").
- [ ] Confirm if we should use existing navigation or build new. (Assuming Expo Router based on file structure).

## Proposed UI Architecture

### Navigation Structure (Expo Router)
- `(tabs)`
    - `index.tsx` (Home/Calendar View)
    - `explore.tsx` (Notes List)
    - `group.tsx` (Group List)
    - `setting.tsx` (User Profile)
- `note/[id].tsx` (Note Details/Edit)
- `group/[id].tsx` (Group Details)
- `plan/create.tsx` (Create Activity Plan)

### Detailed Component Breakdown

#### 1. Calendar Module
- **Files**: `app/(tabs)/index.tsx`, `components/CalendarView.tsx`
- **UI Elements**:
    - Calendar Widget (Switchable views: Month, Week, Day).
    - Floating Action Button (FAB) to Add Plan.
    - List of daily activities below the calendar.

#### 2. Note Module
- **Files**: `app/(tabs)/explore.tsx`, `app/note/create.tsx`
- **UI Elements**:
    - Grid/List view of notes.
    - Pin indicator for important notes.
    - Creation Form:
        - Text Input (Title, Body).
        - Image Picker.
        - Date/Time Picker.
        - Location Input (Mock or Map view).
        - Recurrence Selector (Daily, Weekly, etc.).

#### 3. Profile Module
- **Files**: `app/(tabs)/setting.tsx`
- **UI Elements**:
    - Avatar Image (Editable).
    - Name Field (Editable).
    - Settings List.

#### 4. Group Module
- **Files**: `app/(tabs)/group.tsx`, `app/group/[id].tsx`
- **UI Elements**:
    - List of Groups.
    - Member List (Add/Remove UI).
    - Shared Calendar/Plans list.

## Implementation Steps
1.  **Setup Navigation**: Ensure Tabs are configured in `app/_layout.tsx`.
2.  **Create Core Components**: Reusable inputs, buttons, cards using Tailwind.
3.  **Implement Screens**:
    - Calendar Screen.
    - Note Screen & Create Note.
    - Profile Screen.
    - Group Screen.
4.  **Styling**: Apply modern design tokens (Colors, Spacing) via `global.css` / Tailwind config.

## Verification
- Manual verification of each screen.
- Ensure navigation flows work (e.g., clicking a note opens details).
