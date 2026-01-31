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

    // ==================== APPOINTMENTS ====================

    async getAppointments(userId: string, filters?: { from?: string; to?: string; status?: string }) {
        let query = this.supabase
            .from('appointments')
            .select(`
                *,
                client:clients(id, company_name, contact_name, phone, email),
                agent:users(id, email)
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

    async getUpcomingAppointments(userId: string, limit: number = 5) {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await this.supabase
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
    }

    async createAppointment(userId: string, payload: any) {
        const { data, error } = await this.supabase
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

    async updateAppointment(id: string, payload: any) {
        const updateData: any = {};

        if (payload.title !== undefined) updateData.title = payload.title;
        if (payload.description !== undefined) updateData.description = payload.description;
        if (payload.date !== undefined) updateData.appointment_date = payload.date;
        if (payload.time !== undefined) updateData.appointment_time = payload.time;
        if (payload.type !== undefined) updateData.appointment_type = payload.type;
        if (payload.meetingLink !== undefined) updateData.meeting_link = payload.meetingLink;
        if (payload.location !== undefined) updateData.location = payload.location;
        if (payload.notes !== undefined) updateData.notes = payload.notes;

        const { data, error } = await this.supabase
            .from('appointments')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async updateAppointmentStatus(id: string, status: string) {
        const updateData: any = { status };

        if (status === 'completada') {
            updateData.completed_at = new Date();
        } else if (status === 'cancelada') {
            updateData.cancelled_at = new Date();
        }

        const { data, error } = await this.supabase
            .from('appointments')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async deleteAppointment(id: string) {
        const { error } = await this.supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return { success: true };
    }

    // ==================== REPORTES ====================

    // --- REPORTES ---
    async getUserStats(userId: string) {
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // 1. Obtener métricas de Actividades (Desde la Vista)
        const { data: kpis, error } = await this.supabase
            .from('view_daily_kpis')
            .select('*')
            .eq('agent_id', userId)
            .eq('report_date', todayStr)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw new Error(error.message);

        // 2. NUEVO: Contar Clientes Reales creados HOY (Desde la Tabla)
        // Definimos el rango de tiempo de hoy (00:00 a 23:59)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const { count: newProspectsCount, error: countError } = await this.supabase
            .from('clients')
            .select('*', { count: 'exact', head: true }) // count: 'exact' solo nos devuelve el número
            .eq('assigned_agent_id', userId)
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString());

        if (countError) throw new Error(countError.message);

        // 3. Combinamos ambos resultados
        return {
            new_prospects: newProspectsCount || 0, // <--- Dato Real de Registros
            total_interactions: kpis?.total_contacts || 0, // Cambiamos nombre para ser claros
            virtual_meetings: kpis?.virtual_meetings || 0,
            commercial_visits: kpis?.commercial_visits || 0,
            quotes_sent: kpis?.quotes_sent || 0,
            deals_won: kpis?.deals_won || 0,
            total_sales_usd: kpis?.total_sales_usd || 0
        };
    }

    // --- CLIENTES ---
    async getKanbanBoard(userId: string) {
        const today = new Date().toISOString();
        const { data: clients, error } = await this.supabase
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

    async createClient(userId: string, payload: any) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const { data, error } = await this.supabase
            .from('clients')
            .insert({
                company_name: payload.company_name,
                contact_name: payload.contact_name,
                phone: payload.phone,
                email: payload.email,
                status: 'PENDING',
                assigned_agent_id: userId,
                assignment_expires_at: expiresAt,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async updateClient(id: string, payload: any) {
        const { data, error } = await this.supabase
            .from('clients')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
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

    async deleteClient(id: string) {
        const { error } = await this.supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return { success: true };
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
                modality: payload.modality || 'N_A',
                summary: payload.summary,
                amount_usd: payload.amount_usd || 0,
                is_completed: true,
                completed_at: new Date(),
            })
            .select()
            .single();

        if (error) throw new Error(error.message);

        await this.supabase
            .from('clients')
            .update({ last_interaction_at: new Date() })
            .eq('id', payload.clientId);

        return data;
    }

    async deleteInteraction(id: string) {
        const { error } = await this.supabase
            .from('interactions')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return { success: true };
    }
}