import { SupabaseService } from '../common/supabase/supabase.service';
import { LumenDeal } from '@lumen/shared-types';

@Injectable()
export class DealsService {
    private readonly logger = new Logger(DealsService.name);

    private isValidUuid(uuid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

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
            throw new BadRequestException('Error al recuperar los tratos por columna.');
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

        if (clientId && !this.isValidUuid(clientId)) {
            throw new BadRequestException('ID de cliente inválido.');
        }

        const { data, error } = await query
            .order('updated_at', { ascending: false })
            .limit(200);

        if (error) {
            this.logger.error(`Error fetching deals`, error);
            throw new BadRequestException('Error al recuperar los tratos.');
        }
        return data;
    }

    async createDeal(token: string, userId: string, payload: any) {
        if (!payload.client_id || !this.isValidUuid(payload.client_id)) {
            throw new BadRequestException('El ID del cliente es obligatorio y debe ser un UUID válido.');
        }
        if (!payload.title) {
            throw new BadRequestException('El título del trato es obligatorio.');
        }

        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase
            .from('deals')
            .insert({
                ...payload,
            })
            .select()
            .single();

        if (error) {
            this.logger.error(`Error creating deal`, error);
            throw new BadRequestException(`Error al crear el trato: ${error.message}`);
        }
        return data;
    }

    async updateDeal(token: string, id: string, payload: any) {
        if (!this.isValidUuid(id)) {
            throw new BadRequestException('ID de trato inválido.');
        }
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase
            .from('deals')
            .update(payload)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) {
            this.logger.error(`Error updating deal ${id}`, error);
            throw new BadRequestException('Error al actualizar el trato.');
        }
        if (!data) throw new NotFoundException('Trato no encontrado.');
        return data;
    }

    async moveCard(token: string, userId: string, dealId: string, newStatus: string) {
        if (!this.isValidUuid(dealId)) {
            throw new BadRequestException('ID de trato inválido.');
        }
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase
            .from('deals')
            .update({ status: newStatus, updated_at: new Date() })
            .eq('id', dealId)
            .select()
            .maybeSingle();

        if (error) {
            this.logger.error(`Error moving deal ${dealId}`, error);
            throw new BadRequestException('Error al mover el trato.');
        }
        if (!data) throw new NotFoundException('Trato no encontrado.');
        return data;
    }

    async deleteDeal(token: string, id: string) {
        if (!this.isValidUuid(id)) {
            throw new BadRequestException('ID de trato inválido.');
        }
        const supabase = this.supabaseService.getClient(token);
        const { error } = await supabase.from('deals').delete().eq('id', id);

        if (error) {
            this.logger.error(`Error deleting deal ${id}`, error);
            throw new BadRequestException('Error al eliminar el trato.');
        }
        return { success: true };
    }

    async getFullKanban(token: string, userId: string) {
        const supabase = this.supabaseService.getClient(token);
        const { data, error } = await supabase
            .from('deals')
            .select('id, status')
            // .eq('is_archived', false) — add after running the migration to add this column
            .limit(500);

        if (error) {
            this.logger.error(`Error fetching full kanban`, error);
            throw new BadRequestException('Error al recuperar el tablero Kanban.');
        }

        const grouped = data.reduce((acc: Record<string, any[]>, deal) => {
            if (!acc[deal.status]) acc[deal.status] = [];
            acc[deal.status].push(deal);
            return acc;
        }, {});

        return grouped;
    }
}