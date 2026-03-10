/**
 * useEventActionStore
 * Lightweight Zustand store for communicating Edit/Delete actions
 * from the EventDetailScreen back to CalendarView.
 */

import { create } from 'zustand';
import type { CalendarEvent } from '@/types/event';

type ActionType = 'edit' | 'delete' | null;

interface EventActionState {
    pendingAction: ActionType;
    pendingEvent: CalendarEvent | null;
    /** Called from EventDetailScreen when user taps Edit */
    requestEdit: (event: CalendarEvent) => void;
    /** Called from EventDetailScreen when user confirms Delete */
    requestDelete: (event: CalendarEvent) => void;
    /** Called from CalendarView after it has processed the action */
    clearAction: () => void;
}

export const useEventActionStore = create<EventActionState>((set) => ({
    pendingAction: null,
    pendingEvent: null,

    requestEdit: (event) => set({ pendingAction: 'edit', pendingEvent: event }),
    requestDelete: (event) => set({ pendingAction: 'delete', pendingEvent: event }),
    clearAction: () => set({ pendingAction: null, pendingEvent: null }),
}));

