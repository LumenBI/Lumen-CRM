import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DashboardService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }

    async getUserStats(userId: string) {
        const { data, error } = await this.supabase
            .from('view_daily_kpis')
            .select('*')
            .eq('agent_id', userId)
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw new Error(error.message);

        return data || {
            total_contacts: 0,
            virtual_meetings: 0,
            commercial_visits: 0,
            quotes_sent: 0,
            deals_won: 0,
            total_sales_usd: 0
        };
    }

    async getKanbanBoard(userId: string) {
        const today = new Date().toISOString();

        const { data: clients, error } = await this.supabase
            .from('clients')
            .select('*')
            .or(`assigned_agent_id.eq.${userId},assigned_agent_id.is.null,assignment_expires_at.lt.${today}`)
            .order('updated_at', { ascending: false });

        if (error) throw new Error(error.message);

        const board = {
            PENDING: clients.filter(c => c.status === 'PENDING'),
            CONTACTED: clients.filter(c => c.status === 'CONTACTED'),
            IN_NEGOTIATION: clients.filter(c => c.status === 'IN_NEGOTIATION'),
            CLOSED_WON: clients.filter(c => c.status === 'CLOSED_WON'),
            CLOSED_LOST: clients.filter(c => c.status === 'CLOSED_LOST'),
        };

        return board;
    }

    async moveCard(userId: string, clientId: string, newStatus: string) {
        const updatePayload: any = { status: newStatus };

        const { data: current } = await this.supabase
            .from('clients')
            .select('assigned_agent_id')
            .eq('id', clientId)
            .single();

        if (!current?.assigned_agent_id) {
            updatePayload.assigned_agent_id = userId;
        }

        const { data, error } = await this.supabase
            .from('clients')
            .update(updatePayload)
            .eq('id', clientId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async getClientDetails(clientId: string) {
        const { data: client, error: clientError } = await this.supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();

        if (clientError) throw new Error(clientError.message);

        const { data: interactions, error: interactionsError } = await this.supabase
            .from('interactions')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (interactionsError) throw new Error(interactionsError.message);

        return { client, interactions };
    }

    async addInteraction(userId: string, payload: any) {
        const { data, error } = await this.supabase
            .from('interactions')
            .insert({
                agent_id: userId,
                client_id: payload.clientId,
                category: payload.category,
                modality: payload.modality,
                summary: payload.summary,
                amount_usd: payload.amount_usd || 0,
                is_completed: true,
                completed_at: new Date(),
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }
}