import { z } from 'zod'
import { APPOINTMENT_STATUS_IDS, APPOINTMENT_TYPE_IDS } from '@/constants/appointments'
import { SHIPPING_TYPE_IDS } from '@/constants/shipping'
import { STAGE_IDS } from '@/constants/stages'

export const ClientSchema = z.object({
    id: z.string().optional(),
    company_name: z.string().min(1, 'El nombre de empresa es requerido'),
    contact_name: z.string().min(1, 'El nombre de contacto es requerido'),
    email: z.string().email('Formato de email inválido').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
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
    appointment_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format (HH:MM or HH:MM:SS)'),
    appointment_type: z.enum(APPOINTMENT_TYPE_IDS),
    status: z.enum(APPOINTMENT_STATUS_IDS).optional(),
    meeting_link: z.string().url().optional().or(z.literal('')),
    location: z.string().optional(),
    notes: z.string().optional(),
    client_id: z.string().optional(),
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
    profit: z.number().optional(),
    currency: z.string(),
    status: z.enum(STAGE_IDS),
    type: z.enum(SHIPPING_TYPE_IDS),
    client_id: z.string().optional(),
    client: z.object({
        id: z.string(),
        company_name: z.string().optional(),
        contact_name: z.string().optional(),
    }).optional(),
    updated_at: z.string().optional(),
    expected_close_date: z.string().optional(),
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
