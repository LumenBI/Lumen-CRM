import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DashboardService {
    private supabase: SupabaseClient;

    constructor() { }

    private getClient(token: string) {
        if (!token) throw new Error('Authorization token is required');
        return createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );
    }

    // ==================== APPOINTMENTS ====================

    async getAppointments(token: string, userId: string, filters?: { from?: string; to?: string; status?: string }) {
        const supabase = this.getClient(token);
        let query = supabase
            .from('appointments')
            .select(`
                *,
                client:clients(id, company_name, contact_name, phone, email),
                agent:profiles(id, email)
            `)
            .eq('agent_id', userId)
            .order('appointment_date', { ascending: true })
            .order('appointment_time', { ascending: true });

        // Apply filters
        if (filters?.from) {
            query = query.gte('appointment_date', filters.from);
        }
        if (filters?.to) {
            query = query.lte('appointment_date', filters.to);
        }
        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return data;
    }

    async getUpcomingAppointments(token: string, userId: string, limit: number = 5) {
        try {
            const supabase = this.getClient(token);
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    client:clients(id, company_name, contact_name, phone, email)
                `)
                .eq('agent_id', userId)
                .in('status', ['pendiente', 'confirmada'])
                .gte('appointment_date', today)
                .order('appointment_date', { ascending: true })
                .order('appointment_time', { ascending: true })
                .limit(limit);

            if (error) throw new Error(error.message);
            return data;
        } catch (error) {
            console.error('Error in getUpcomingAppointments:', error);
            throw error;
        }
    }

    async createAppointment(token: string, userId: string, payload: any) {
        const supabase = this.getClient(token);
        const { data, error } = await supabase
            .from('appointments')
            .insert({
                agent_id: userId,
                client_id: payload.clientId,
                title: payload.title,
                description: payload.description,
                appointment_date: payload.date,
                appointment_time: payload.time,
                appointment_type: payload.type || 'virtual',
                meeting_link: payload.meetingLink,
                location: payload.location,
                notes: payload.notes,
                status: 'pendiente',
            })
            .select(`
                *,
                client:clients(id, company_name, contact_name)
            `)
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async updateAppointment(token: string, id: string, payload: any) {
        const updateData: any = {};
        const supabase = this.getClient(token);

        if (payload.title !== undefined) updateData.title = payload.title;
        if (payload.description !== undefined) updateData.description = payload.description;
        if (payload.date !== undefined) updateData.appointment_date = payload.date;
        if (payload.time !== undefined) updateData.appointment_time = payload.time;
        if (payload.type !== undefined) updateData.appointment_type = payload.type;
        if (payload.meetingLink !== undefined) updateData.meeting_link = payload.meetingLink;
        if (payload.location !== undefined) updateData.location = payload.location;
        if (payload.notes !== undefined) updateData.notes = payload.notes;

        const { data, error } = await supabase
            .from('appointments')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async updateAppointmentStatus(token: string, id: string, status: string) {
        const updateData: any = { status };
        const supabase = this.getClient(token);

        if (status === 'completada') {
            updateData.completed_at = new Date();
        } else if (status === 'cancelada') {
            updateData.cancelled_at = new Date();
        }

        const { data, error } = await supabase
            .from('appointments')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async deleteAppointment(token: string, id: string) {
        const supabase = this.getClient(token);
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return { success: true };
    }

    // ==================== REPORTES ====================

    // --- REPORTES ---
    async getUserStats(token: string, userId: string) {
        const todayStr = new Date().toISOString().split('T')[0];
        const supabase = this.getClient(token);

        const { data, error } = await supabase
            .from('view_daily_kpis')
            .select('*')
            .eq('agent_id', userId)
            .eq('report_date', todayStr)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw new Error(error.message);

        return {
            new_prospects: data?.new_prospects || 0,
            total_interactions: data?.total_contacts || 0,
            virtual_meetings: data?.virtual_meetings || 0,
            commercial_visits: data?.commercial_visits || 0,
            quotes_sent: data?.quotes_sent || 0,
            deals_won: data?.deals_won || 0,
            total_sales_usd: data?.total_sales_usd || 0,
            total_volume_m3: data?.total_volume_m3 || 0
        };
    }

    async getHistory(token: string | null) {
        if (!token) throw new Error('Token is required for history');

        // Create a scoped client for this request to respect RLS
        const scopedSupabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_KEY!, // Public/Anon Key
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        );

        const { data, error } = await scopedSupabase
            .from('view_daily_kpis')
            .select('*')
            .order('report_date', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }

    // --- CLIENTES ---
    async getKanbanBoard(token: string, userId: string) {
        const today = new Date().toISOString();
        const supabase = this.getClient(token);
        const { data: clients, error } = await supabase
            .from('clients')
            .select('*')
            .or(`assigned_agent_id.eq.${userId},assigned_agent_id.is.null,assignment_expires_at.lt.${today}`)
            .order('updated_at', { ascending: false });

        if (error) throw new Error(error.message);

        return {
            PENDING: clients.filter(c => c.status === 'PENDING'),
            CONTACTED: clients.filter(c => c.status === 'CONTACTED'),
            IN_NEGOTIATION: clients.filter(c => c.status === 'IN_NEGOTIATION'),
            CLOSED_WON: clients.filter(c => c.status === 'CLOSED_WON'),
            CLOSED_LOST: clients.filter(c => c.status === 'CLOSED_LOST'),
        };
    }

    async getClients(token: string, query: string) {
        const supabase = this.getClient(token);
        let builder = supabase
            .from('clients')
            .select('id, company_name, contact_name, email')
            .order('company_name', { ascending: true })
            .limit(20);

        if (query) {
            builder = builder.or(`company_name.ilike.%${query}%,contact_name.ilike.%${query}%`);
        }

        const { data, error } = await builder;
        if (error) throw new Error(error.message);
        return data;
    }

    async createClient(token: string, userId: string, payload: any) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        const supabase = this.getClient(token);

        const { data, error } = await supabase
            .from('clients')
            .insert({
                company_name: payload.company_name,
                contact_name: payload.contact_name,
                phone: payload.phone,
                email: payload.email,
                status: payload.status || 'PENDING',
                assigned_agent_id: userId,
                assignment_expires_at: expiresAt,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async updateClient(token: string, id: string, payload: any) {
        const supabase = this.getClient(token);
        const { data, error } = await supabase
            .from('clients')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async moveCard(token: string, userId: string, clientId: string, newStatus: string) {
        const updatePayload: any = { status: newStatus };
        const supabase = this.getClient(token);

        const { data: current } = await supabase
            .from('clients')
            .select('assigned_agent_id')
            .eq('id', clientId)
            .single();

        if (!current?.assigned_agent_id) {
            updatePayload.assigned_agent_id = userId;
        }

        const { data, error } = await supabase
            .from('clients')
            .update(updatePayload)
            .eq('id', clientId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async deleteClient(token: string, id: string) {
        const supabase = this.getClient(token);
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) {
            // Foreign key violation
            if (error.code === '23503') {
                throw new BadRequestException('No se puede eliminar el cliente porque tiene registros relacionados (citas, interacciones, etc).');
            }
            throw new InternalServerErrorException(error.message);
        }
        return { success: true };
    }

    async getClientDetails(token: string, clientId: string) {
        const supabase = this.getClient(token);
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();
        if (clientError) throw new Error(clientError.message);

        const { data: interactions, error: interactionsError } = await supabase
            .from('interactions')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
        if (interactionsError) throw new Error(interactionsError.message);

        return { client, interactions };
    }

    async addInteraction(token: string, userId: string, payload: any) {
        const supabase = this.getClient(token);
        const { data, error } = await supabase
            .from('interactions')
            .insert({
                agent_id: userId,
                client_id: payload.clientId,
                category: payload.category,
                modality: payload.modality || 'N_A',
                summary: payload.summary,
                amount_usd: payload.amount_usd || 0,
                is_completed: true,
                completed_at: new Date(),
            })
            .select()
            .single();

        if (error) throw new Error(error.message);

        await supabase
            .from('clients')
            .update({ last_interaction_at: new Date() })
            .eq('id', payload.clientId);

        return data;
    }

    async deleteInteraction(token: string, id: string) {
        const supabase = this.getClient(token);
        const { error } = await supabase
            .from('interactions')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return { success: true };
    }
}