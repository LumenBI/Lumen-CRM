/**
 * Shared type definitions used across multiple components.
 * Consolidates Client type from NewDealModal, NewTrackingModal,
 * EditClientModal, and clients/page.
 */

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
