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
    agent?: {
        full_name: string
    }
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
    client_id?: string // Added for compatibility with API creation payloads
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
    profit?: number
    currency: string
    status: (typeof STAGE_IDS)[number]
    type: (typeof SHIPPING_TYPE_IDS)[number]
    client_id?: string
    client?: {
        id: string
        company_name: string
        contact_name: string
        phone?: string
        email?: string
    }
    created_at: string // Added to match API response
    updated_at: string
    expected_close_date?: string
}

export interface Interaction {
    id: string
    clientId: string // Note: API might return client_id, frontend seems to use clientId or client_id variously.
    client_id?: string
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

export interface QuoteItem {
    id: string;
    quote_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    total_price: number;
}

export interface Quote {
    id: string;
    deal_id: string;
    quote_number: number;
    status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
    total_amount: number;
    currency_code: string;
    exchange_rate_snapshot: number;
    valid_until: string;
    pdf_url?: string;
    created_at: string;
    updated_at: string;
    quote_items: QuoteItem[];
}
