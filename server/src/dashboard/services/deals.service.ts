import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { NotificationsService } from './notifications.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DealCreatedEvent } from '../events/dashboard.events';

@Injectable()
export class DealsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getKanbanBoard(token: string, userId: string) {
    const supabase = this.supabaseService.getClient(token);

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    let query = supabase
      .from('deals')
      .select(
        `
                *,
                client:clients!inner(id, company_name, contact_name, phone, email, assigned_agent_id)
            `,
      )
      .order('updated_at', { ascending: false });

    if (profile && profile.role !== 'ADMIN' && profile.role !== 'MANAGER') {
      query = query.eq('assigned_agent_id', userId);
    }

    const { data: deals, error } = await query;

    if (error) throw new Error(error.message);

    return {
      PENDING: deals.filter((d) => d.status === 'PENDING'),
      CONTACTADO: deals.filter((d) => d.status === 'CONTACTADO'),
      CITA: deals.filter((d) => d.status === 'CITA'),
      PROCESO_COTIZACION: deals.filter(
        (d) => d.status === 'PROCESO_COTIZACION',
      ),
      COTIZACION_ENVIADA: deals.filter(
        (d) => d.status === 'COTIZACION_ENVIADA',
      ),
      CERRADO: deals.filter(
        (d) => d.status === 'CERRADO_GANADO' || d.status === 'CERRADO_PERDIDO',
      ),
    };
  }

  async moveCard(
    token: string,
    userId: string,
    dealId: string,
    newStatus: string,
  ) {
    const supabase = this.supabaseService.getClient(token);

    // Security check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (profile && profile.role !== 'ADMIN' && profile.role !== 'MANAGER') {
      const { data: deal } = await supabase
        .from('deals')
        .select('assigned_agent_id')
        .eq('id', dealId)
        .single();
      if (deal && deal.assigned_agent_id !== userId) {
        throw new Error('No tienes permiso para mover esta negociación.');
      }
    }

    const { data, error } = await supabase
      .from('deals')
      .update({ status: newStatus })
      .eq('id', dealId)
      .select('*, agent:profiles!assigned_agent_id(full_name)')
      .maybeSingle();

    if (error) throw new Error(error.message);

    const message = `ha movido la negociación "${data.title}" a la etapa ${newStatus.replace('_', ' ')}`;
    await this.notificationsService.createNotification(
      supabase,
      userId,
      'DEAL_MOVED',
      `Has movido la negociación "${data.title}" a ${newStatus.replace('_', ' ')}`,
      '/dashboard/kanban',
    );
    await this.notificationsService.notifyManagers(
      supabase,
      'DEAL_MOVED',
      `[${data.agent?.full_name || 'Agente'}] ${message}`,
      '/dashboard/kanban',
    );

    if (newStatus === 'CERRADO_GANADO') {
      await this.calculateAndCreateCommission(supabase, userId, dealId);
    }

    return data;
  }

  async calculateAndCreateCommission(
    supabase: SupabaseClient,
    userId: string,
    dealId: string,
  ) {
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
        commissionAmount = profit * 0.1;
        break;
      case 'AEREO':
        commissionAmount = profit * 0.1;
        break;
      case 'LCL':
        commissionAmount = 15.0; // Flat fee
        break;
      default:
        commissionAmount = 0;
    }

    if (commissionAmount > 0) {
      await supabase.from('commissions').insert({
        agent_id: deal.assigned_agent_id,
        deal_id: dealId,
        amount: commissionAmount,
        status: 'PENDING',
      });

      await this.notificationsService.createNotification(
        supabase,
        deal.assigned_agent_id,
        'COMMISSION_GENERATED',
        `Comisión generada: $${commissionAmount.toFixed(2)} por negocio "${deal.title}"`,
        '/dashboard/stats',
      );
    }
  }

  async getDeals(token: string, userId: string, clientId?: string) {
    const supabase = this.supabaseService.getClient(token);

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    let query = supabase
      .from('deals')
      .select(
        `
                *,
                client:clients(id, company_name, contact_name, email)
            `,
      )
      .order('updated_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (profile && profile.role !== 'ADMIN' && profile.role !== 'MANAGER') {
      query = query.eq('assigned_agent_id', userId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async createDeal(token: string, userId: string, payload: any) {
    const supabase = this.supabaseService.getClient(token);
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
        assigned_agent_id: payload.assigned_agent_id || userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Fetch agent name and email for the event
    const { data: agent } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    // Emit event for asynchronous notifications
    this.eventEmitter.emit(
      'deal.created',
      new DealCreatedEvent(data, userId, agent?.email || 'Unknown'),
    );

    return data;
  }

  async updateDeal(token: string, id: string, payload: any) {
    const supabase = this.supabaseService.getClient(token);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile && profile.role !== 'ADMIN' && profile.role !== 'MANAGER') {
        const { data: deal } = await supabase
          .from('deals')
          .select('assigned_agent_id')
          .eq('id', id)
          .single();
        if (deal && deal.assigned_agent_id !== user.id) {
          throw new Error('No tienes permiso para editar esta negociación.');
        }
      }
    }

    const updateData: any = {};
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.value !== undefined) updateData.value = payload.value;
    if (payload.profit !== undefined) updateData.profit = payload.profit;
    if (payload.currency !== undefined) updateData.currency = payload.currency;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.type !== undefined) updateData.type = payload.type;
    if (payload.expected_close_date !== undefined)
      updateData.expected_close_date = payload.expected_close_date;

    const { data, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select('*, agent:profiles!assigned_agent_id(full_name)')
      .single();

    if (error) throw new Error(error.message);

    // Notify managers
    const message = `ha actualizado la negociación "${data.title}"`;
    await this.notificationsService.notifyManagers(
      supabase,
      'DEAL_UPDATE',
      `[${data.agent?.full_name || 'Agente'}] ${message}`,
      '/dashboard/kanban',
    );

    return data;
  }

  async deleteDeal(token: string, id: string) {
    const supabase = this.supabaseService.getClient(token);
    const { error } = await supabase.from('deals').delete().eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  }
}
