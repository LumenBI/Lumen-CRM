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
    appointment_type: 'virtual' | 'presencial' | 'llamada'
    status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
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
    status: string
    type: 'FCL' | 'LCL' | 'AEREO'
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
