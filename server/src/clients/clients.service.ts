import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ClientsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly notificationsService: NotificationsService,
  ) { }

  async getClientsList(
    token: string,
    userId: string,
    query: string,
    cursor?: string,
    limit: number = 50,
    mine: boolean = false,
  ) {
    const supabase = this.supabaseService.getClient(token);

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    let q = supabase
      .from('clients')
      .select(
        'id, company_name, contact_name, email, phone, origin, assigned_agent_id, assignment_expires_at, agent:profiles!assigned_agent_id(full_name)',
      );

    // Force mine filter for agents
    if (
      (mine ||
        (profile && profile.role !== 'ADMIN' && profile.role !== 'MANAGER')) &&
      userId
    ) {
      q = q.eq('assigned_agent_id', userId);
    }

    if (query) {
      // Sanitize query to prevent breaking the .or() filter (commas are used as separators)
      const sanitizedQuery = query.replace(/,/g, ' ').trim();
      q = q.or(
        `company_name.ilike.%${sanitizedQuery}%,contact_name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%`,
      );
    }

    // Cursor Pagination
    if (cursor) {
      q = q.gt('id', cursor);
    }

    const { data: clients, error } = await q
      .order('id', { ascending: true })
      .limit(limit + 1);

    if (error) throw new Error(error.message);

    const hasNextPage = clients.length > limit;
    const items = hasNextPage ? clients.slice(0, limit) : clients;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasNextPage,
    };
  }

  async createClient(token: string, userId: string, payload: any) {
    const defaultExpires = new Date();
    defaultExpires.setDate(defaultExpires.getDate() + 90); // Default 3 months

    const supabase = this.supabaseService.getClient(token);

    // 1. Determine Agent assignment
    let assignedAgentId = payload.assigned_agent_id || null;

    if (!assignedAgentId && userId) {
      // Check if current user is an agent (and not just an admin)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile && profile.role !== 'ADMIN' && profile.role !== 'MANAGER') {
        assignedAgentId = userId;
      }
    }

    // 2. Insert Client
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        company_name: payload.company_name,
        contact_name: payload.contact_name,
        phone: payload.phone,
        email: payload.email,
        origin: payload.origin || 'MANUAL',
        status: payload.status || 'PENDING',
        assigned_agent_id: assignedAgentId,
        assignment_expires_at: payload.assignment_expires_at || defaultExpires,
        assigned_at: assignedAgentId ? new Date() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('[ClientsService.createClient] Error creating client:', error);
      throw new Error(error.message);
    }

    // 3. Auto-create Deal if status is provided and not PENDING
    // This ensures the client appears in the Kanban board immediately
    if (payload.status && payload.status !== 'PENDING') {
      const adminSupabase = this.supabaseService.getAdminClient();
      const { error: dealError } = await adminSupabase.from('deals').insert({
        client_id: client.id,
        title: `${client.company_name}`,
        value: payload.dealMetadata?.value || 0,
        currency: payload.dealMetadata?.currency || 'USD',
        status: payload.status,
        assigned_agent_id: assignedAgentId,
        type: payload.dealMetadata?.type || 'AEREO',
        updated_at: new Date(),
      });

      if (dealError) {
        console.warn(
          '[ClientsService.createClient] Client created but failed to create auto-deal:',
          dealError,
        );
        // We don't throw here to avoid failing the client creation
      }
    }

    return client;
  }

  async updateClient(token: string, id: string, payload: any) {
    const supabase = this.supabaseService.getClient(token);

    const updateData: any = {};
    if (payload.company_name !== undefined)
      updateData.company_name = payload.company_name;
    if (payload.contact_name !== undefined)
      updateData.contact_name = payload.contact_name;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.email !== undefined) updateData.email = payload.email;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.origin !== undefined) updateData.origin = payload.origin;

    // STRICT SECURITY: Only ADMIN/MANAGER can reassign
    if (payload.assigned_agent_id !== undefined) {
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
          throw new BadRequestException(
            'No tienes permisos para reasignar clientes.',
          );
        }
      }
      updateData.assigned_agent_id = payload.assigned_agent_id;
    }

    if (payload.assignment_expires_at !== undefined)
      updateData.assignment_expires_at = payload.assignment_expires_at;

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select('*, agent:profiles!assigned_agent_id(full_name)')
      .single();

    if (error) throw new Error(error.message);

    // Notify managers of significant changes (e.g., status or assignment)
    if (payload.status || payload.assigned_agent_id) {
      const message = `ha actualizado el cliente "${data.company_name}" (Estado: ${data.status})`;
      await this.notificationsService.notifyManagers(
        supabase,
        'CLIENT_UPDATE',
        `[${data.agent?.full_name || 'Agente'}] ${message}`,
        `/dashboard/clients?id=${id}`,
      );
    }

    return data;
  }

  async deleteClient(token: string, id: string) {
    const supabase = this.supabaseService.getClient(token);
    const { error } = await supabase.from('clients').delete().eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new BadRequestException(
          'No se puede eliminar el cliente porque tiene registros relacionados (citas, interacciones, etc).',
        );
      }
      throw new InternalServerErrorException(error.message);
    }
    return { success: true };
  }

  async getClientDetails(token: string, clientId: string) {
    const supabase = this.supabaseService.getClient(token);
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle();

    if (clientError) {
      console.error(
        `[ClientsService.getClientDetails] Error fetching client ${clientId}:`,
        clientError,
      );
      throw new InternalServerErrorException(clientError.message);
    }

    if (!client) {
      console.warn(
        `[ClientsService.getClientDetails] Client ${clientId} not found or access denied by RLS`,
      );
      throw new NotFoundException(
        'Cliente no encontrado o no tienes permisos para verlo',
      );
    }

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
    const supabase = this.supabaseService.getClient(token);

    if (!payload.clientId) {
      console.error(
        '[ClientsService.addInteraction] Missing clientId in payload:',
        payload,
      );
      throw new BadRequestException(
        'El ID del cliente es obligatorio para registrar una interacción',
      );
    }

    const { data, error } = await supabase
      .from('interactions')
      .insert({
        agent_id: userId,
        client_id: payload.clientId,
        category: payload.category,
        modality:
          payload.modality === 'N_A' ||
            payload.modality === 'OTHER' ||
            !payload.modality
            ? 'VIRTUAL'
            : payload.modality,
        summary: payload.summary,
        amount_usd: payload.amount_usd || 0,
        is_completed: true,
        completed_at: new Date(),
      })
      .select(
        '*, client:clients(company_name), agent:profiles!agent_id(full_name)',
      )
      .maybeSingle();

    if (error) {
      console.error(
        '[ClientsService.addInteraction] Error inserting interaction:',
        error,
      );
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new InternalServerErrorException(
        'Error al recuperar la interacción creada',
      );
    }

    await supabase
      .from('clients')
      .update({ last_interaction_at: new Date() })
      .eq('id', payload.clientId);

    const CATEGORY_LABELS: Record<string, string> = {
      CALL: 'Llamada',
      EMAIL: 'Correo',
      MEETING: payload.modality === 'IN_PERSON' ? 'Visita comercial' : 'Reunión',
      WHATSAPP: 'WhatsApp',
      QUOTE_DECISION: 'Venta cerrada',
      SEGUIMIENTO: 'Seguimiento',
    };
    const translatedCategory = CATEGORY_LABELS[payload.category] || payload.category;

    // Notify managers
    await this.notificationsService.notifyManagers(
      supabase,
      'INTERACTION_CREATED',
      `[${data.agent?.full_name || 'Agente'}] ha registrado una nueva interacción con "${data.client?.company_name || 'Cliente'}": ${translatedCategory}`,
      `/dashboard/clients?id=${payload.clientId}`,
    );

    return data;
  }

  async deleteInteraction(token: string, id: string) {
    const supabase = this.supabaseService.getClient(token);
    const { error } = await supabase.from('interactions').delete().eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  async getRecentActivities(token: string) {
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('interactions')
      .select('*, client:clients(company_name)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw new Error(error.message);
    return data;
  }
}
