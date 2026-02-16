import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class DealsService {
    private readonly logger = new Logger(DealsService.name);

    constructor(private readonly supabaseService: SupabaseService) { }

    async getDealsByColumn(
        token: string,
        userId: string,
        stageId: string,
        cursor?: string,
        limit: number = 20,
        agentId?: string,
    ) {
        const supabase = this.supabaseService.getClient(token);

        let query = supabase
            .from('deals')
            .select('*, client:clients(id, company_name, email, phone)')
            .eq('status', stageId);

        // If agentId is provided, filter by it. If not, manager/admin can see all, but agents might be restricted by RLS
        if (agentId) {
            query = query.eq('assigned_agent_id', agentId);
        }

        // Cursor Pagination
        // We use 'updated_at' and 'id' for deterministic ordering
        if (cursor) {
            // In a real scenario, cursor usually encodes both updated_at and id
            // For simplicity, we'll use ID if it's a simple UUID cursor
            query = query.gt('id', cursor);
        }

        const { data, error } = await query
            .order('id', { ascending: true })
            .limit(limit + 1);

        if (error) {
            this.logger.error(`Error fetching deals for stage ${stageId}`, error);
            throw new Error(error.message);
        }

        const hasNextPage = data.length > limit;
        const items = hasNextPage ? data.slice(0, limit) : data;
        const nextCursor = hasNextPage ? items[items.length - 1].id : null;

        return {
            items,
            nextCursor,
            hasNextPage,
        };
    }

    async getDeals(token: string, userId: string, clientId?: string) {
        const supabase = this.supabaseService.getClient(token);
        let query = supabase
            .from('deals')
            .select('*, client:clients(id, company_name, email, phone)');

        if (clientId) {
            query = query.eq('client_id', clientId);
        }

        const { data, error } = await query.order('updated_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }

    async createDeal(token: string, userId: string, payload: any) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase
            .from('deals')
            .insert({
                ...payload,
                created_by: userId,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async updateDeal(token: string, id: string, payload: any) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase
            .from('deals')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async moveCard(token: string, userId: string, dealId: string, newStatus: string) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase
            .from('deals')
            .update({ status: newStatus, updated_at: new Date() })
            .eq('id', dealId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async deleteDeal(token: string, id: string) {
        const supabase = this.supabaseService.getClient(token);
        const { error } = await supabase.from('deals').delete().eq('id', id);

        if (error) throw new Error(error.message);
        return { success: true };
    }

    async getFullKanban(token: string, userId: string) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase
            .from('deals')
            .select('id, status');

        if (error) throw new Error(error.message);

        // Group by status
        const grouped = data.reduce((acc: Record<string, any[]>, deal) => {
            if (!acc[deal.status]) acc[deal.status] = [];
            acc[deal.status].push(deal);
            return acc;
        }, {});

        return grouped;
    }
}
