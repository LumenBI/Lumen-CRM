import { APPOINTMENT_STATUS_IDS, APPOINTMENT_TYPE_IDS } from '@/constants/appointments'
import { SHIPPING_TYPE_IDS } from '@/constants/shipping'
import { STAGE_IDS } from '@/constants/stages'

export interface Client {
    id: string
    company_name: string
    contact_name: string
    email: string
    phone?: string
    origin?: string
    status?: string
    created_at?: string
    assigned_agent_id?: string
    assignment_expires_at?: string
}

export interface Appointment {
    id: string
    title: string
    description?: string
    appointment_date: string
    appointment_time: string
    appointment_type: (typeof APPOINTMENT_TYPE_IDS)[number]
    status: (typeof APPOINTMENT_STATUS_IDS)[number]
    meeting_link?: string
    location?: string
    client: {
        id: string
        company_name: string
        contact_name: string
        phone?: string
        email?: string
    }
}

export type Deal = {
    id: string
    title: string
    value: number
    currency: string
    status: (typeof STAGE_IDS)[number]
    type: (typeof SHIPPING_TYPE_IDS)[number]
    client: {
        id: string
        company_name: string
        contact_name: string
    }
    updated_at: string
    expected_close_date?: string
}

export interface Interaction {
    id: string
    clientId: string
    agent_id: string
    category: string
    summary: string
    modality?: string
    amount_usd?: number
    is_completed: boolean
    created_at: string
    client?: {
        company_name: string
    }
}
