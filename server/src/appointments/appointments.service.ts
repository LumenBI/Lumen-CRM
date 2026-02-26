import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppointmentCreatedEvent } from '../deals/events/deals.events';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  /**
   * Check if the user is an ADMIN or MANAGER using the service-role client.
   */
  private async isAdminOrManager(userId: string): Promise<boolean> {
    const admin = this.supabaseService.getAdminClient();
    const { data } = await admin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return data?.role === 'ADMIN' || data?.role === 'MANAGER';
  }

  /**
   * Check if the user is an ADMIN or MANAGER or the owner/agent of the appointment.
   */
  private async validateOrganizer(userId: string, appointmentId: string): Promise<void> {
    // Basic UUID validation to prevent DB crashes
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(appointmentId)) {
      throw new BadRequestException('ID de cita inválido.');
    }

    const isAdmin = await this.isAdminOrManager(userId);
    if (isAdmin) return;

    const adminClient = this.supabaseService.getAdminClient();
    const { data, error } = await adminClient
      .from('appointments')
      .select('agent_id')
      .eq('id', appointmentId)
      .maybeSingle();

    if (error) {
      if (error.message.includes('Invalid API key')) {
        console.warn('[validateOrganizer] Skipping ownership check: invalid service role key in this environment.');
        return; // Fallback to DB RLS
      }
      console.error('[validateOrganizer] Error:', error);
      throw new BadRequestException('Error al validar el organizador.');
    }
    if (!data) throw new NotFoundException('La cita no existe.');

    const isOwner = data.agent_id === userId;
    if (!isOwner) {
      throw new ForbiddenException('Solo el organizador de la cita puede realizar esta acción.');
    }
  }

  async getAppointments(
    token: string,
    userId: string,
    filters?: { from?: string; to?: string; status?: string },
  ) {
    // Admins/Managers see ALL appointments (bypass RLS via service-role client)
    const isAdmin = await this.isAdminOrManager(userId);
    const supabase = isAdmin
      ? this.supabaseService.getAdminClient()
      : this.supabaseService.getClient(token);

    // For non-admins, RLS filters to only their own + invited appointments.
    // For admins, the service-role client bypasses RLS entirely.
    let query = supabase
      .from('appointments')
      .select(
        `
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
            `,
      )
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    try {
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
      if (error) {
        console.error('[getAppointments] DB Error:', error);
        throw new BadRequestException('Parámetros de búsqueda inválidos.');
      }

      return data;
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      console.error('[getAppointments] Exception:', e);
      throw new BadRequestException('Error al procesar la solicitud de citas.');
    }
  }

  async getUpcomingAppointments(
    token: string,
    userId: string,
    limit: number = 5,
  ) {
    try {
      const isAdmin = await this.isAdminOrManager(userId);
      const supabase = isAdmin
        ? this.supabaseService.getAdminClient()
        : this.supabaseService.getClient(token);

      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Guatemala',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      const { data, error } = await supabase
        .from('appointments')
        .select(
          `
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
                `,
        )
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
    const supabase = this.supabaseService.getClient(token);
    const clientId = payload.client_id || payload.clientId || payload.client?.id;

    if (!clientId) {
      throw new BadRequestException('El ID del cliente es obligatorio.');
    }
    if (!payload.title) {
      throw new BadRequestException('El título de la cita es obligatorio.');
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        agent_id: userId,
        client_id: clientId,
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
      .select(
        `
                id,
                title,
                agent:profiles!agent_id(id, full_name)
            `,
      )
      .single();

    if (error) {
      console.error('[createAppointment] DB Error:', error);
      throw new BadRequestException('Error al crear la cita en la base de datos.');
    }

    // Add participants (including the creator)
    const participantIds = Array.from(
      new Set([userId, ...(payload.participants || [])]),
    );
    const participantRows = participantIds.map((pid) => ({
      appointment_id: data.id,
      user_id: pid,
    }));

    await supabase.from('appointment_participants').insert(participantRows);

    // Fetch user email for the event
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    // Emit event for asynchronous notifications
    this.eventEmitter.emit(
      'appointment.created',
      new AppointmentCreatedEvent(
        data,
        userId,
        userProfile?.email || 'Unknown',
      ),
    );

    return data;
  }

  async updateAppointment(token: string, userId: string, id: string, payload: any) {
    await this.validateOrganizer(userId, id);
    const updateData: any = {};
    const supabase = this.supabaseService.getClient(token);

    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.description !== undefined)
      updateData.description = payload.description;
    if (payload.appointment_date !== undefined)
      updateData.appointment_date = payload.appointment_date;
    if (payload.appointment_time !== undefined)
      updateData.appointment_time = payload.appointment_time;
    if (payload.date !== undefined) updateData.appointment_date = payload.date;
    if (payload.time !== undefined) updateData.appointment_time = payload.time;
    if (payload.type !== undefined) updateData.appointment_type = payload.type;
    if (payload.appointment_type !== undefined)
      updateData.appointment_type = payload.appointment_type;
    if (payload.meetingLink !== undefined)
      updateData.meeting_link = payload.meetingLink;
    if (payload.meeting_link !== undefined)
      updateData.meeting_link = payload.meeting_link;
    if (payload.location !== undefined) updateData.location = payload.location;
    if (payload.notes !== undefined) updateData.notes = payload.notes;

    if (payload.status !== undefined) {
      const allowedStatus = ['pendiente', 'confirmada', 'completada', 'cancelada'];
      if (!allowedStatus.includes(payload.status)) {
        throw new BadRequestException('Estado de cita inválido.');
      }
      updateData.status = payload.status;
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select(
        `
                id,
                title,
                agent_id,
                agent:profiles!agent_id(full_name)
            `,
      )
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('La cita no existe o no tienes permisos para modificarla.');

    if (payload.participants !== undefined) {
      // Remove old ones
      await supabase
        .from('appointment_participants')
        .delete()
        .eq('appointment_id', id);

      // Add new ones (including owner)
      const participantIds = Array.from(
        new Set([data.agent_id, ...(payload.participants || [])]),
      );
      const participantRows = participantIds.map((pid) => ({
        appointment_id: id,
        user_id: pid,
      }));
      await supabase.from('appointment_participants').insert(participantRows);
    }

    // Notify ALL current participants (whether they changed or not)
    const { data: currentParticipants, error: partError } = await supabase
      .from('appointment_participants')
      .select('user_id')
      .eq('appointment_id', id);

    if (partError) {
      console.error(
        `[NOTIFY_FLOW] Error fetching participants for notification:`,
        partError,
      );
    }

    if (currentParticipants && currentParticipants.length > 0) {
      const msg = `Cita "${data.title}" actualizada`;
      const notifications = currentParticipants.map((p) =>
        this.notificationsService.createNotification(
          supabase,
          p.user_id,
          'APPOINTMENT_UPDATE',
          msg,
          '/dashboard/citas',
        ),
      );
      await Promise.all(notifications);
    }

    return data;
  }

  async updateAppointmentStatus(token: string, userId: string, id: string, status: string) {
    const allowedStatus = ['pendiente', 'confirmada', 'completada', 'cancelada'];
    if (!allowedStatus.includes(status)) {
      throw new BadRequestException('Estado de cita inválido.');
    }

    const updateData: any = { status };
    const supabase = this.supabaseService.getClient(token);

    if (status === 'completada') {
      updateData.completed_at = new Date();
    } else if (status === 'cancelada') {
      updateData.cancelled_at = new Date();
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select(
        `
                id,
                title,
                status,
                agent_id,
                agent:profiles!agent_id(id, full_name)
            `,
      )
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('La cita no existe o no tienes permisos para modificarla.');

    // Notify all participants
    const msg = `Cita "${data.title}" actualizada a: ${status.toUpperCase()}`;
    const { data: participants } = await supabase
      .from('appointment_participants')
      .select('user_id')
      .eq('appointment_id', id);

    if (participants) {
      const notifications = participants.map((p) =>
        this.notificationsService.createNotification(
          supabase,
          p.user_id,
          'APPOINTMENT_UPDATE',
          msg,
          '/dashboard/citas',
        ),
      );
      await Promise.all(notifications);
    }

    return data;
  }

  async deleteAppointment(token: string, userId: string, id: string) {
    await this.validateOrganizer(userId, id);
    const supabase = this.supabaseService.getClient(token);
    const { error } = await supabase.from('appointments').delete().eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  async cancelAppointment(token: string, userId: string, id: string) {
    return this.updateAppointmentStatus(token, userId, id, 'cancelada');
  }

  async finishAppointment(token: string, userId: string, id: string) {
    return this.updateAppointmentStatus(token, userId, id, 'completada');
  }

  async rateAppointment(token: string, userId: string, id: string, payload: { rating: number; notes?: string }) {
    await this.validateOrganizer(userId, id);
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('appointments')
      .update({
        rating: payload.rating,
        notes: payload.notes,
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('La cita no existe o no tienes permisos para calificarla.');
    return data;
  }
}
