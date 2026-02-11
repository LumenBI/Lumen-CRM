import { z } from 'zod'

export const ClientSchema = z.object({
    id: z.string().optional(),
    company_name: z.string().min(1, 'Compay name is required'),
    contact_name: z.string().min(1, 'Contact name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    origin: z.string().optional(),
    status: z.string().optional(),
    created_at: z.string().optional(),
    assigned_agent_id: z.string().optional(),
    assignment_expires_at: z.string().optional(),
})

export const AppointmentSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    appointment_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
    appointment_type: z.enum(['virtual', 'presencial', 'llamada']),
    status: z.enum(['pendiente', 'confirmada', 'completada', 'cancelada']).optional(),
    meeting_link: z.string().url().optional().or(z.literal('')),
    location: z.string().optional(),
    client: z.object({
        id: z.string(),
        company_name: z.string().optional(),
        contact_name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
    }).optional()
})

export const DealSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Title is required'),
    value: z.number().min(0),
    currency: z.string(),
    status: z.string(),
    type: z.enum(['FCL', 'LCL', 'AEREO']),
    client: z.object({
        id: z.string(),
        company_name: z.string().optional(),
        contact_name: z.string().optional(),
    }).optional(),
    updated_at: z.string().optional(),
})

export const InteractionSchema = z.object({
    id: z.string().optional(),
    clientId: z.string().min(1, 'Client ID is required'),
    agent_id: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    summary: z.string().min(1, 'Summary is required'),
    modality: z.string().optional(),
    amount_usd: z.number().optional(),
    is_completed: z.boolean().optional(),
    created_at: z.string().optional(),
})
