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

    private async createNotification(supabase: SupabaseClient, userId: string, type: string, message: string, link: string = '#') {
        try {
            const { error } = await supabase.from('notifications').insert({
                user_id: userId,
                type,
                message,
                link,
                is_read: false
            });
            if (error) console.error(`Error creating notification:`, error);
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    private async notifyManagers(supabase: SupabaseClient, type: string, message: string, link: string = '#') {
        try {
            const { data: managers } = await supabase
                .from('profiles')
                .select('id')
                .or('role.eq.ADMIN,role.eq.MANAGER');

            if (managers) {
                await Promise.all(managers.map(m =>
                    this.createNotification(supabase, m.id, type, message, link)
                ));
            }
        } catch (error) {
            console.error('Error notifying managers:', error);
        }
    }

    async updateNotificationInterval(token: string, userId: string, intervalMinutes: number) {
        const supabase = this.getClient(token);
        const { data, error } = await supabase
            .from('profiles')
            .update({ notification_interval: intervalMinutes })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async getAgents(token: string) {
        const supabase = this.getClient(token);
        const { data, error } = await supabase
            .from('profiles') // Assuming profiles table stores agents
            .select('id, full_name, email')
            .order('full_name', { ascending: true });

        if (error) throw new Error(error.message);
        return data;
    }

    // ==================== APPOINTMENTS ====================

    async getAppointments(token: string, userId: string, filters?: { from?: string; to?: string; status?: string }) {
        const supabase = this.getClient(token);

        // 1. Get IDs of appointments where user is a participant
        const { data: participations } = await supabase
            .from('appointment_participants')
            .select('appointment_id')
            .eq('user_id', userId);

        const participantAppIds = (participations || []).map(p => p.appointment_id);
        const orFilter = participantAppIds.length > 0
            ? `agent_id.eq.${userId},id.in.(${participantAppIds.join(',')})`
            : `agent_id.eq.${userId}`;

        let query = supabase
            .from('appointments')
            .select(`
                id,
                title,
                description,
                appointment_date,
                appointment_time,
                appointment_type,
                meeting_link,
                location,
                notes,
                status,
                agent_id,
                client_id,
                client:clients(id, company_name, contact_name, phone, email),
                agent:profiles!agent_id(id, email, full_name),
                participants:appointment_participants(
                    user_id,
                    user:profiles(id, full_name, email)
                )
            `)
            .or(orFilter)
            .order('appointment_date', { ascending: true })
            .order('appointment_time', { ascending: true });

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

            // 1. Get IDs of appointments where user is a participant
            const { data: participations } = await supabase
                .from('appointment_participants')
                .select('appointment_id')
                .eq('user_id', userId);

            const participantAppIds = (participations || []).map(p => p.appointment_id);
            const orFilter = participantAppIds.length > 0
                ? `agent_id.eq.${userId},id.in.(${participantAppIds.join(',')})`
                : `agent_id.eq.${userId}`;

            const today = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'America/Guatemala',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(new Date());

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    title,
                    description,
                    appointment_date,
                    appointment_time,
                    appointment_type,
                    meeting_link,
                    location,
                    status,
                    agent_id,
                    client_id,
                    client:clients(id, company_name, contact_name, phone, email),
                    agent:profiles!agent_id(id, full_name),
                    participants:appointment_participants(
                        user_id,
                        user:profiles(id, full_name, email)
                    )
                `)
                .or(orFilter)
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
                client_id: payload.client_id || payload.clientId,
                title: payload.title,
                description: payload.description,
                appointment_date: payload.appointment_date || payload.date,
                appointment_time: payload.appointment_time || payload.time,
                appointment_type: payload.appointment_type || payload.type || 'virtual',
                meeting_link: payload.meeting_link || payload.meetingLink,
                location: payload.location,
                notes: payload.notes,
                status: 'pendiente',
            })
            .select(`
                id,
                title,
                agent:profiles!agent_id(id, full_name)
            `)
            .single();

        if (error) throw new Error(error.message);

        // Add participants (including the creator)
        const participantIds = Array.from(new Set([userId, ...(payload.participants || [])]));
        const participantRows = participantIds.map(pid => ({
            appointment_id: data.id,
            user_id: pid
        }));

        await supabase.from('appointment_participants').insert(participantRows);

        // Fetch agent name for notifications
        const agentName = (Array.isArray(data.agent) ? data.agent[0] : data.agent)?.full_name || 'Un agente';

        // Notify all participants (except creator, who gets a generic notification)
        const notifications = participantIds.map(pid => {
            const msg = pid === userId
                ? `Has agendado una cita: ${data.title}`
                : `[Participante] ${agentName} te ha incluido en una cita: ${data.title}`;
            return this.createNotification(supabase, pid, 'APPOINTMENT_CREATED', msg, '/dashboard/citas');
        });

        await Promise.all(notifications);

        return data;
    }

    async updateAppointment(token: string, id: string, payload: any) {
        const updateData: any = {};
        const supabase = this.getClient(token);

        if (payload.title !== undefined) updateData.title = payload.title;
        if (payload.description !== undefined) updateData.description = payload.description;
        if (payload.appointment_date !== undefined) updateData.appointment_date = payload.appointment_date;
        if (payload.appointment_time !== undefined) updateData.appointment_time = payload.appointment_time;
        if (payload.date !== undefined) updateData.appointment_date = payload.date;
        if (payload.time !== undefined) updateData.appointment_time = payload.time;
        if (payload.type !== undefined) updateData.appointment_type = payload.type;
        if (payload.appointment_type !== undefined) updateData.appointment_type = payload.appointment_type;
        if (payload.meetingLink !== undefined) updateData.meeting_link = payload.meetingLink;
        if (payload.meeting_link !== undefined) updateData.meeting_link = payload.meeting_link;
        if (payload.location !== undefined) updateData.location = payload.location;
        if (payload.notes !== undefined) updateData.notes = payload.notes;
        if (payload.status !== undefined) updateData.status = payload.status;

        const { data, error } = await supabase
            .from('appointments')
            .update(updateData)
            .eq('id', id)
            .select(`
                id,
                title,
                agent_id,
                agent:profiles!agent_id(full_name)
            `)
            .single();

        if (error) throw new Error(error.message);

        if (payload.participants !== undefined) {
            // Remove old ones
            await supabase.from('appointment_participants').delete().eq('appointment_id', id);

            // Add new ones (including owner)
            const participantIds = Array.from(new Set([data.agent_id, ...(payload.participants || [])]));
            const participantRows = participantIds.map(pid => ({
                appointment_id: id,
                user_id: pid
            }));
            await supabase.from('appointment_participants').insert(participantRows);
        }

        // Notify ALL current participants (whether they changed or not)
        const { data: currentParticipants, error: partError } = await supabase
            .from('appointment_participants')
            .select('user_id')
            .eq('appointment_id', id);
        if (partError) {
            console.error(`Error fetching participants for notification:`, partError);
        }

        if (currentParticipants && currentParticipants.length > 0) {
            const msg = `Cita "${data.title}" actualizada`;
            const notifications = currentParticipants.map(p =>
                this.createNotification(supabase, p.user_id, 'APPOINTMENT_UPDATE', msg, '/dashboard/citas')
            );
            await Promise.all(notifications);
        } else {
            console.warn(`[NOTIFY_FLOW] No participants found for appointment ${id}.`);
        }

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
            .select(`
                id,
                title,
                status,
                agent_id,
                agent:profiles!agent_id(id, full_name)
            `)
            .single();

        if (error) throw new Error(error.message);

        // Notify all participants
        const msg = `Cita "${data.title}" actualizada a: ${status.toUpperCase()}`;
        const { data: participants } = await supabase
            .from('appointment_participants')
            .select('user_id')
            .eq('appointment_id', id);

        if (participants) {
            const notifications = participants.map(p =>
                this.createNotification(supabase, p.user_id, 'APPOINTMENT_UPDATE', msg, '/dashboard/citas')
            );
            await Promise.all(notifications);
        }

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

    async getUserStats(token: string, userId: string) {
        const supabase = this.getClient(token);

        const getCADate = (date: Date) => {
            return new Intl.DateTimeFormat('en-CA', {
                timeZone: 'America/Guatemala',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(date);
        };

        const now = new Date();
        const currentYear = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guatemala', year: 'numeric' }).format(now));
        const currentMonth = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guatemala', month: 'numeric' }).format(now));

        const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);
        const startOfCurrentMonthStr = getCADate(startOfCurrentMonth);

        const startOfPrevMonth = new Date(currentYear, currentMonth - 2, 1);
        const startOfPrevMonthStr = getCADate(startOfPrevMonth);

        const { data, error } = await supabase
            .from('view_daily_kpis')
            .select('*')
            .eq('agent_id', userId)
            .gte('report_date', startOfPrevMonthStr);

        if (error) throw new Error(error.message);

        const currentMonthStats = {
            new_prospects: 0,
            total_contacts: 0,
            commercial_visits: 0,
            deals_won: 0,
        };

        const prevMonthStats = {
            new_prospects: 0,
            total_contacts: 0,
            commercial_visits: 0,
            deals_won: 0,
        };

        data?.forEach(record => {
            const isCurrentMonth = record.report_date >= startOfCurrentMonthStr;
            const target = isCurrentMonth ? currentMonthStats : prevMonthStats;

            target.new_prospects += (record.new_prospects || 0);
            target.total_contacts += (record.total_contacts || 0);
            target.commercial_visits += (record.commercial_visits || 0);
            target.deals_won += (record.deals_won || 0);
        });

        const calculateChange = (current: number, prev: number) => {
            if (prev === 0) return current > 0 ? 100 : 0;
            return ((current - prev) / prev) * 100;
        };

        const formatChange = (pct: number) => {
            const sign = pct >= 0 ? '+' : '';
            return `${sign}${pct.toFixed(1)}%`;
        };

        const getTrend = (pct: number) => pct >= 0 ? 'up' : 'down';

        const newProspectsChange = calculateChange(currentMonthStats.new_prospects, prevMonthStats.new_prospects);
        const interactionsChange = calculateChange(currentMonthStats.total_contacts, prevMonthStats.total_contacts);
        const visitsChange = calculateChange(currentMonthStats.commercial_visits, prevMonthStats.commercial_visits);
        const salesChange = calculateChange(currentMonthStats.deals_won, prevMonthStats.deals_won);

        return {
            new_prospects: currentMonthStats.new_prospects,
            new_prospects_change: formatChange(newProspectsChange),
            new_prospects_trend: getTrend(newProspectsChange),

            total_interactions: currentMonthStats.total_contacts,
            total_interactions_change: formatChange(interactionsChange),
            total_interactions_trend: getTrend(interactionsChange),

            appointments_count: currentMonthStats.commercial_visits,
            appointments_count_change: formatChange(visitsChange),
            appointments_count_trend: getTrend(visitsChange),

            won_count: currentMonthStats.deals_won,
            won_count_change: formatChange(salesChange),
            won_count_trend: getTrend(salesChange),

            virtual_meetings: 0,
            quotes_sent: 0,
            total_sales_usd: 0,
            total_volume_m3: 0
        };
    }

    async getHistory(token: string | null) {
        if (!token) throw new Error('Token is required for history');

        const scopedSupabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_KEY!,
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
            .order('report_date', { ascending: false })
            .limit(30);

        if (error) throw new Error(error.message);
        return data;
    }

    async getRecentActivities(token: string) {
        const supabase = this.getClient(token);
        const { data, error } = await supabase
            .from('interactions')
            .select('*, client:clients(company_name)')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw new Error(error.message);
        return data;
    }

    async getKanbanBoard(token: string, userId: string) {
        const supabase = this.getClient(token);
        let query = supabase
            .from('deals')
            .select(`
                *,
                client:clients!inner(id, company_name, contact_name, phone, email, assigned_agent_id)
            `)
            .order('updated_at', { ascending: false });

        // Get user role to determine visibility
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();

        if (profile && profile.role !== 'ADMIN' && profile.role !== 'MANAGER') {
            query = query.eq('assigned_agent_id', userId);
        }

        const { data: deals, error } = await query;

        if (error) throw new Error(error.message);

        return {
            PENDING: deals.filter(d => d.status === 'PENDING'),
            CONTACTADO: deals.filter(d => d.status === 'CONTACTADO'),
            CITA: deals.filter(d => d.status === 'CITA'),
            PROCESO_COTIZACION: deals.filter(d => d.status === 'PROCESO_COTIZACION'),
            COTIZACION_ENVIADA: deals.filter(d => d.status === 'COTIZACION_ENVIADA'),
            CERRADO: deals.filter(d => d.status === 'CERRADO_GANADO' || d.status === 'CERRADO_PERDIDO'),
        };
    }

    async getClients(token: string, query: string, mine: boolean = false, userId?: string) {
        const supabase = this.getClient(token);
        let builder = supabase
            .from('clients')
            .select('id, company_name, contact_name, email, phone, origin, assigned_agent_id, assignment_expires_at, agent:profiles!assigned_agent_id(full_name)')
            .order('company_name', { ascending: true });

        if (mine && userId) {
            builder = builder.eq('assigned_agent_id', userId);
        }

        if (query) {
            builder = builder.or(`company_name.ilike.%${query}%,contact_name.ilike.%${query}%`);
        }

        // Limit only if searching or viewing a general list, 
        // but for global context we might want more. 
        // However, 50 is a safe default for now.
        builder = builder.limit(100);

        const { data, error } = await builder;
        if (error) throw new Error(error.message);
        return data;
    }

    async createClient(token: string, userId: string, payload: any) {
        const defaultExpires = new Date();
        defaultExpires.setDate(defaultExpires.getDate() + 90); // Default 3 months

        const supabase = this.getClient(token);

        const { data, error } = await supabase
            .from('clients')
            .insert({
                company_name: payload.company_name,
                contact_name: payload.contact_name,
                phone: payload.phone,
                email: payload.email,
                origin: payload.origin || 'MANUAL',
                status: payload.status || 'PENDING',
                assigned_agent_id: payload.assigned_agent_id || null, // Allow null assignment
                assignment_expires_at: payload.assignment_expires_at || defaultExpires,
                assigned_at: payload.assigned_agent_id ? new Date() : null
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async updateClient(token: string, id: string, payload: any) {
        const supabase = this.getClient(token);

        const updateData: any = {};
        if (payload.company_name !== undefined) updateData.company_name = payload.company_name;
        if (payload.contact_name !== undefined) updateData.contact_name = payload.contact_name;
        if (payload.phone !== undefined) updateData.phone = payload.phone;
        if (payload.email !== undefined) updateData.email = payload.email;
        if (payload.status !== undefined) updateData.status = payload.status;
        if (payload.origin !== undefined) updateData.origin = payload.origin;

        // STRICT SECURITY: Only ADMIN/MANAGER can reassign
        if (payload.assigned_agent_id !== undefined) {
            const { data, error: authError } = await supabase.auth.getUser();
            const user = data?.user;
            if (authError) console.error('Error fetching user for reassignment check:', authError);

            if (user) {
                const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                if (profileError) console.error('Error fetching profile for reassignment check:', profileError);

                if (profile && profile.role !== 'ADMIN' && profile.role !== 'MANAGER') {
                    throw new BadRequestException('No tienes permisos para reasignar clientes.');
                }
            } else {
                console.warn('User not found during reassignment security check');
            }
            updateData.assigned_agent_id = payload.assigned_agent_id;
        }

        if (payload.assignment_expires_at !== undefined) updateData.assignment_expires_at = payload.assignment_expires_at;

        const { data, error } = await supabase
            .from('clients')
            .update(updateData)
            .eq('id', id)
            .select('*, agent:profiles!assigned_agent_id(full_name)')
            .single();

        if (error) throw new Error(error.message);

        // Notify managers of significant changes (e.g., status or assignment)
        if (payload.status || payload.assigned_agent_id) {
            const message = `Cliente "${data.company_name}" actualizado (Estado: ${data.status})`;
            await this.notifyManagers(supabase, 'CLIENT_UPDATE', `[${data.agent?.full_name || 'Agente'}] ${message}`, `/dashboard/clients?id=${id}`);
        }

        return data;
    }

    async moveCard(token: string, userId: string, dealId: string, newStatus: string) {
        const supabase = this.getClient(token);

        const { data, error } = await supabase
            .from('deals')
            .update({ status: newStatus })
            .eq('id', dealId)
            .select('*, agent:profiles!assigned_agent_id(full_name)')
            .maybeSingle();

        if (error) throw new Error(error.message);

        const message = `Negociación "${data.title}" movida a ${newStatus}`;
        await this.createNotification(supabase, userId, 'DEAL_MOVED', message, '/dashboard/kanban');
        await this.notifyManagers(supabase, 'DEAL_MOVED', `[${data.agent?.full_name || 'Agente'}] ${message}`, '/dashboard/kanban');

        if (newStatus === 'CERRADO_GANADO') {
            await this.calculateAndCreateCommission(supabase, userId, dealId);
        }

        return data;
    }

    async calculateAndCreateCommission(supabase: SupabaseClient, userId: string, dealId: string) {
        const { data: deal, error } = await supabase
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .single();

        if (error || !deal) return;

        const { data: existing } = await supabase
            .from('commissions')
            .select('id')
            .eq('deal_id', dealId)
            .single();

        if (existing) return;

        let commissionAmount = 0;
        const profit = Number(deal.profit || 0);

        switch (deal.type) {
            case 'FCL':
                commissionAmount = profit * 0.10;
                break;
            case 'AEREO':
                commissionAmount = profit * 0.10;
                break;
            case 'LCL':
                commissionAmount = 15.00; // Flat fee
                break;
            default:
                commissionAmount = 0;
        }

        if (commissionAmount > 0) {
            await supabase.from('commissions').insert({
                agent_id: deal.assigned_agent_id,
                deal_id: dealId,
                amount: commissionAmount,
                status: 'PENDING'
            });

            await this.createNotification(
                supabase,
                deal.assigned_agent_id,
                'COMMISSION_GENERATED',
                `Comisión generada: $${commissionAmount.toFixed(2)} por negocio "${deal.title}"`,
                '/dashboard/stats'
            );
        }
    }

    // ==================== DEALS ====================

    async getDeals(token: string, userId: string, clientId?: string) {
        const supabase = this.getClient(token);
        let query = supabase
            .from('deals')
            .select(`
                *,
                client:clients(id, company_name, contact_name, email)
            `)
            .order('updated_at', { ascending: false });

        if (clientId) {
            query = query.eq('client_id', clientId);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data;
    }

    async createDeal(token: string, userId: string, payload: any) {
        const supabase = this.getClient(token);
        const { data, error } = await supabase
            .from('deals')
            .insert({
                client_id: payload.client_id,
                title: payload.title,
                value: payload.value || 0,
                profit: payload.profit || 0,
                currency: payload.currency || 'USD',
                status: payload.status || 'CONTACTADO',
                type: payload.type || 'FCL',
                assigned_agent_id: userId,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);

        // Fetch agent name for notification
        const { data: agent } = await supabase.from('profiles').select('full_name').eq('id', userId).single();

        await this.createNotification(supabase, userId, 'DEAL_CREATED', `Nueva negociación: ${payload.title}`, '/dashboard/kanban');
        await this.notifyManagers(supabase, 'DEAL_CREATED', `[${agent?.full_name || 'Agente'}] Nueva negociación: ${payload.title}`, '/dashboard/kanban');

        return data;
    }

    async updateDeal(token: string, id: string, payload: any) {
        const supabase = this.getClient(token);

        const updateData: any = {};
        if (payload.title !== undefined) updateData.title = payload.title;
        if (payload.value !== undefined) updateData.value = payload.value;
        if (payload.profit !== undefined) updateData.profit = payload.profit;
        if (payload.currency !== undefined) updateData.currency = payload.currency;
        if (payload.status !== undefined) updateData.status = payload.status;
        if (payload.type !== undefined) updateData.type = payload.type;
        if (payload.expected_close_date !== undefined) updateData.expected_close_date = payload.expected_close_date;

        const { data, error } = await supabase
            .from('deals')
            .update(updateData)
            .eq('id', id)
            .select('*, agent:profiles!assigned_agent_id(full_name)')
            .single();

        if (error) throw new Error(error.message);

        // Notify managers
        const message = `Negociación "${data.title}" actualizada`;
        await this.notifyManagers(supabase, 'DEAL_UPDATE', `[${data.agent?.full_name || 'Agente'}] ${message}`, '/dashboard/kanban');

        return data;
    }

    async deleteDeal(token: string, id: string) {
        const supabase = this.getClient(token);
        const { error } = await supabase
            .from('deals')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return { success: true };
    }

    async deleteClient(token: string, id: string) {
        const supabase = this.getClient(token);
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) {
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

        const { data: deals, error: dealsError } = await supabase
            .from('deals')
            .select('*')
            .eq('client_id', clientId)
            .order('updated_at', { ascending: false });
        if (dealsError) throw new Error(dealsError.message);

        return { client, interactions, deals };
    }

    async addInteraction(token: string, userId: string, payload: any) {
        const supabase = this.getClient(token);
        const { data, error } = await supabase
            .from('interactions')
            .insert({
                agent_id: userId,
                client_id: payload.clientId,
                category: payload.category,
                modality: (payload.modality === 'N_A' || payload.modality === 'OTHER' || !payload.modality) ? 'VIRTUAL' : payload.modality,
                summary: payload.summary,
                amount_usd: payload.amount_usd || 0,
                is_completed: true,
                completed_at: new Date(),
            })
            .select('*, client:clients(company_name), agent:profiles!agent_id(full_name)')
            .single();

        if (error) throw new Error(error.message);

        await supabase
            .from('clients')
            .update({ last_interaction_at: new Date() })
            .eq('id', payload.clientId);

        // Notify managers
        await this.notifyManagers(
            supabase,
            'INTERACTION_CREATED',
            `[${data.agent?.full_name || 'Agente'}] Nueva interacción con "${data.client?.company_name || 'Cliente'}": ${payload.category}`,
            `/dashboard/clients?id=${payload.clientId}`
        );

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

    // ==================== SYSTEM NOTIFICATIONS ====================

    async checkAndReleaseExpiredClients(supabase: SupabaseClient, userId: string) {
        const nowStr = new Date().toISOString();
        const { data: expiredClients } = await supabase
            .from('clients')
            .select('id, company_name')
            .eq('assigned_agent_id', userId)
            .lt('assignment_expires_at', nowStr);

        if (expiredClients && expiredClients.length > 0) {
            for (const client of expiredClients) {
                await supabase
                    .from('clients')
                    .update({ assigned_agent_id: null, assignment_expires_at: null })
                    .eq('id', client.id);

                await this.createNotification(
                    supabase,
                    userId,
                    'EXPIRATION_RELEASE',
                    `Tu asignación con "${client.company_name}" ha expirado y el cliente ha sido liberado.`,
                    `/dashboard/clients`
                );
            }
        }
    }

    async checkSystemNotifications(token: string, userId: string) {
        const supabase = this.getClient(token);
        const notifications: string[] = [];

        await this.checkAndReleaseExpiredClients(supabase, userId);

        // 0. Get current time in America/Guatemala
        const getGTTime = () => {
            const parts = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Guatemala',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            }).formatToParts(new Date());
            const m = new Map(parts.map(p => [p.type, p.value]));
            return new Date(`${m.get('year')}-${m.get('month')}-${m.get('day')}T${m.get('hour')}:${m.get('minute')}:${m.get('second')}`);
        };

        const guatemalaNow = getGTTime();
        const todayStr = guatemalaNow.toISOString().split('T')[0];

        // Fetch user profile for notification settings
        let intervalMinutes = 30;
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('notification_interval')
                .eq('id', userId)
                .single();

            if (!error && profile?.notification_interval) {
                intervalMinutes = profile.notification_interval;
            }
        } catch (error) {
            console.warn('Notification interval fetch failed (column might be missing):', error.message);
        }

        // 1. Get IDs where user is participant
        const { data: participations } = await supabase
            .from('appointment_participants')
            .select('appointment_id')
            .eq('user_id', userId);

        const participantAppIds = (participations || []).map(p => p.appointment_id);
        const orFilter = participantAppIds.length > 0
            ? `agent_id.eq.${userId},id.in.(${participantAppIds.join(',')})`
            : `agent_id.eq.${userId}`;

        // 1. Appointments for tomorrow (Daily summary)
        const tomorrow = new Date(guatemalaNow);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const { data: tomorrowApps } = await supabase
            .from('appointments')
            .select(`
                title, 
                appointment_time,
                participants:appointment_participants(user_id)
            `)
            .or(orFilter)
            .eq('appointment_date', tomorrowStr)
            .in('status', ['pendiente', 'confirmada']);

        if (tomorrowApps) {
            for (const app of tomorrowApps) {
                const msg = `Recordatorio: Tu cita "${app.title}" es mañana a las ${app.appointment_time}`;
                const { count } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('type', 'AGENDA_REMINDER')
                    .ilike('message', `%${app.title}%`)
                    .gte('created_at', todayStr);

                if (count === 0) {
                    await this.createNotification(supabase, userId, 'AGENDA_REMINDER', msg, '/dashboard/citas');
                    notifications.push(`Agenda Mañana: ${app.title}`);
                }
            }
        }

        // 2. Appointments starting SOON (Custom interval)
        const soon = new Date(guatemalaNow.getTime() + intervalMinutes * 60000);

        const { data: soonApps } = await supabase
            .from('appointments')
            .select(`
                id, 
                title, 
                appointment_time,
                participants:appointment_participants(user_id)
            `)
            .or(orFilter)
            .eq('appointment_date', todayStr)
            .in('status', ['pendiente', 'confirmada']);

        if (soonApps) {
            for (const app of soonApps) {
                const [appH, appM] = app.appointment_time.split(':').map(Number);
                const appDate = new Date(guatemalaNow);
                appDate.setHours(appH, appM, 0, 0);


                if (appDate > guatemalaNow && appDate <= soon) {
                    const msg = `¡Alerta! Tu cita "${app.title}" comienza en menos de ${intervalMinutes} minutos (${app.appointment_time})`;

                    const { count } = await supabase
                        .from('notifications')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', userId)
                        .eq('type', 'AGENDA_REMINDER_SOON')
                        .ilike('message', `%${app.title}%`)
                        .gte('created_at', todayStr);

                    if (count === 0) {
                        await this.createNotification(supabase, userId, 'AGENDA_REMINDER_SOON', msg, '/dashboard/citas');
                        notifications.push(`Agenda Pronto: ${app.title}`);
                    }
                }
            }
        }

        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const threeDaysAgoStr = threeDaysAgo.toISOString();

        const { data: inactiveClients } = await supabase
            .from('clients')
            .select('id, company_name, last_interaction_at, created_at')
            .eq('assigned_agent_id', userId)
            .neq('status', 'CERRADO_GANADO')
            .neq('status', 'CERRADO_PERDIDO')
            .or(`last_interaction_at.lt.${threeDaysAgoStr},and(last_interaction_at.is.null,created_at.lt.${threeDaysAgoStr})`)
            .limit(5);

        if (inactiveClients) {
            for (const client of inactiveClients) {
                const { count } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('type', 'INACTIVITY')
                    .ilike('message', `%${client.company_name}%`)
                    .gte('created_at', todayStr);

                if (count === 0) {
                    await this.createNotification(
                        supabase,
                        userId,
                        'INACTIVITY',
                        `Alerta: Cliente "${client.company_name}" sin actividad por más de 3 días.`,
                        `/dashboard/clients?id=${client.id}`
                    );
                    notifications.push(`Inactividad: ${client.company_name}`);
                }
            }
        }

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString();
        const currentStr = new Date().toISOString();

        const { data: expiringClients } = await supabase
            .from('clients')
            .select('id, company_name, assignment_expires_at')
            .eq('assigned_agent_id', userId)
            .gte('assignment_expires_at', currentStr)
            .lte('assignment_expires_at', nextWeekStr);

        if (expiringClients) {
            for (const client of expiringClients) {
                const { count } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('type', 'EXPIRATION')
                    .ilike('message', `%${client.company_name}%`)
                    .gte('created_at', todayStr);

                if (count === 0) {
                    const daysLeft = Math.ceil((new Date(client.assignment_expires_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                    await this.createNotification(
                        supabase,
                        userId,
                        'EXPIRATION',
                        `Aviso: La asignación de "${client.company_name}" vence en ${daysLeft} días.`,
                        `/dashboard/clients?id=${client.id}`
                    );
                    notifications.push(`Expiración: ${client.company_name}`);
                }
            }
        }

        return { notifications };
    }

    async getBootstrapData(token: string, userId: string) {
        try {
            const [
                stats,
                clients,
                kanban,
                appointments,
                history,
                activities,
                agents
            ] = await Promise.all([
                this.getUserStats(token, userId),
                this.getClients(token, '', true, userId),
                this.getKanbanBoard(token, userId),
                this.getUpcomingAppointments(token, userId, 20),
                this.getHistory(token),
                this.getRecentActivities(token),
                this.getAgents(token)
            ]);

            return {
                stats,
                clients,
                kanban,
                appointments,
                history,
                activities,
                agents
            };
        } catch (error) {
            console.error('Error in getBootstrapData:', error);
            throw error;
        }
    }
}