import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createNotification(
    supabase: SupabaseClient,
    userId: string,
    type: string,
    message: string,
    link: string = '#',
  ) {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type,
        message,
        link,
        is_read: false,
      });
      if (error)
        console.error(
          `[NOTIFY_FLOW] Supabase error creating notification:`,
          error,
        );
    } catch (error) {
      console.error('[NOTIFY_FLOW] Catch error creating notification:', error);
    }
  }

  async notifyManagers(
    supabase: SupabaseClient,
    type: string,
    message: string,
    link: string = '#',
  ) {
    try {
      const { data: managers } = await supabase
        .from('profiles')
        .select('id')
        .or('role.eq.ADMIN,role.eq.MANAGER');

      if (managers) {
        await Promise.all(
          managers.map((m) =>
            this.createNotification(supabase, m.id, type, message, link),
          ),
        );
      }
    } catch (error) {
      console.error('Error notifying managers:', error);
    }
  }

  async updateNotificationInterval(
    token: string,
    userId: string,
    intervalMinutes: number,
  ) {
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('profiles')
      .update({ notification_interval: intervalMinutes })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateUserPreferences(token: string, userId: string, preferences: any) {
    const supabase = this.supabaseService.getClient(token);
    const { data, error } = await supabase
      .from('profiles')
      .update({ preferences })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async checkAndReleaseExpiredClients(
    supabase: SupabaseClient,
    userId: string,
  ) {
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
          `/dashboard/clients`,
        );
      }
    }
  }

  async checkSystemNotifications(token: string, userId: string) {
    const supabase = this.supabaseService.getClient(token);
    const notifications: string[] = [];

    await this.checkAndReleaseExpiredClients(supabase, userId);

    // 0. Get current time in America/Guatemala
    const getGTTime = () => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Guatemala',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(new Date());
      const m = new Map(parts.map((p) => [p.type, p.value]));
      return new Date(
        `${m.get('year')}-${m.get('month')}-${m.get('day')}T${m.get('hour')}:${m.get('minute')}:${m.get('second')}`,
      );
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
      console.warn(
        'Notification interval fetch failed (column might be missing):',
        error.message,
      );
    }

    // 1. Get IDs where user is participant
    const { data: participations } = await supabase
      .from('appointment_participants')
      .select('appointment_id')
      .eq('user_id', userId);

    const participantAppIds = (participations || []).map(
      (p) => p.appointment_id,
    );
    const orFilter =
      participantAppIds.length > 0
        ? `agent_id.eq.${userId},id.in.(${participantAppIds.join(',')})`
        : `agent_id.eq.${userId}`;

    // 1. Appointments for tomorrow (Daily summary)
    const tomorrow = new Date(guatemalaNow);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data: tomorrowApps } = await supabase
      .from('appointments')
      .select(
        `
                title, 
                appointment_time,
                participants:appointment_participants(user_id)
            `,
      )
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
          await this.createNotification(
            supabase,
            userId,
            'AGENDA_REMINDER',
            msg,
            '/dashboard/citas',
          );
          notifications.push(`Agenda Mañana: ${app.title}`);
        }
      }
    }

    // 2. Appointments starting SOON (Custom interval)
    const soon = new Date(guatemalaNow.getTime() + intervalMinutes * 60000);

    const { data: soonApps } = await supabase
      .from('appointments')
      .select(
        `
                id, 
                title, 
                appointment_time,
                participants:appointment_participants(user_id)
            `,
      )
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
            await this.createNotification(
              supabase,
              userId,
              'AGENDA_REMINDER_SOON',
              msg,
              '/dashboard/citas',
            );
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
      .or(
        `last_interaction_at.lt.${threeDaysAgoStr},and(last_interaction_at.is.null,created_at.lt.${threeDaysAgoStr})`,
      )
      .limit(5);

    if (inactiveClients) {
      for (const client of inactiveClients) {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('type', 'INACTIVITY')
          .ilike('message', `%${client.company_name}%`)
          .eq('is_read', false);

        if (count === 0) {
          await this.createNotification(
            supabase,
            userId,
            'INACTIVITY',
            `Alerta: Cliente "${client.company_name}" sin actividad por más de 3 días.`,
            `/dashboard/clients?id=${client.id}`,
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
          .eq('is_read', false);

        if (count === 0) {
          const daysLeft = Math.ceil(
            (new Date(client.assignment_expires_at).getTime() -
              new Date().getTime()) /
              (1000 * 3600 * 24),
          );
          await this.createNotification(
            supabase,
            userId,
            'EXPIRATION',
            `Aviso: La asignación de "${client.company_name}" vence en ${daysLeft} días.`,
            `/dashboard/clients?id=${client.id}`,
          );
          notifications.push(`Expiración: ${client.company_name}`);
        }
      }
    }

    return { notifications };
  }
}
