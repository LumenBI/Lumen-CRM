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
        // .eq('is_archived', false) — add after running the migration to add this column

        if (agentId) {
            query = query.eq('assigned_agent_id', agentId);
        }

        // Cursor-based pagination using created_at timestamp (ISO string)
        if (cursor && cursor !== '0' && cursor !== 'undefined' && cursor !== 'null') {
            try {
                // Validate that cursor looks like an ISO timestamp
                const ts = new Date(cursor);
                if (!isNaN(ts.getTime())) {
                    query = query.lt('created_at', cursor);
                } else {
                    this.logger.warn(`Invalid timestamp cursor received: ${cursor}`);
                }
            } catch (e) {
                this.logger.error(`Error applying cursor filter: ${e.message}`);
            }
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(limit + 1);

        if (error) {
            this.logger.error(`Error fetching deals for stage ${stageId}`, error);
            throw new Error(error.message);
        }

        const hasNextPage = data.length > limit;
        const items = hasNextPage ? data.slice(0, limit) : data;

        // Next cursor is the created_at of the last item (for next page)
        const nextCursor = hasNextPage && items.length > 0
            ? items[items.length - 1].created_at
            : null;

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
        // .eq('is_archived', false) — add after running the migration to add this column

        if (clientId) {
            query = query.eq('client_id', clientId);
        }

        const { data, error } = await query
            .order('updated_at', { ascending: false })
            .limit(200);

        if (error) throw new Error(error.message);
        return data;
    }

    async createDeal(token: string, userId: string, payload: any) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase
            .from('deals')
            .insert({
                ...payload,
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
            .select('id, status')
            // .eq('is_archived', false) — add after running the migration to add this column
            .limit(500);

        if (error) throw new Error(error.message);

        const grouped = data.reduce((acc: Record<string, any[]>, deal) => {
            if (!acc[deal.status]) acc[deal.status] = [];
            acc[deal.status].push(deal);
            return acc;
        }, {});

        return grouped;
    }
}