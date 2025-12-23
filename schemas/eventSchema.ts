import { z } from 'zod';

export const eventFormSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
    description: z.string().max(500, 'Description is too long').optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
    isAllDay: z.boolean(),
    color: z.string(),
    category: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    reminder: z.number().min(0).max(1440) // Max 24 hours in minutes
}).refine(
    (data) => {
        // Validate that end date is not before start date
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return end >= start;
    },
    {
        message: 'End date must be after or equal to start date',
        path: ['endDate']
    }
);

export type EventFormData = z.infer<typeof eventFormSchema>;

// Note form schema
export const noteFormSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
    content: z.string().max(5000, 'Content is too long').optional(),
    isPinned: z.boolean().optional(),
    color: z.string().optional(),
    imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
    location: z.string().max(200, 'Location is too long').optional(),
    reminderDate: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
});

export type NoteFormData = z.infer<typeof noteFormSchema>;
