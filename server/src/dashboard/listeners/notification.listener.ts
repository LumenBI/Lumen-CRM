import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SupabaseService } from '../services/supabase.service';
import { AppointmentCreatedEvent, DealCreatedEvent } from '../events/dashboard.events';

@Injectable()
export class NotificationListener {
    private readonly logger = new Logger(NotificationListener.name);

    constructor(private readonly supabaseService: SupabaseService) { }

    @OnEvent('appointment.created')
    async handleAppointmentCreated(event: AppointmentCreatedEvent) {
        this.logger.log(`Handling appointment.created for ${event.appointment.id}`);
        const admin = this.supabaseService.getAdminClient();

        // 1. Notify creator (Personal)
        await this.sendNotification(admin, {
            recipientId: event.creatorId,
            actorId: event.creatorId,
            category: 'appointments',
            title: 'Cita Programada',
            message: `Has agendado una nueva cita: "${event.appointment.title}"`,
            resourceId: event.appointment.id
        });

        // 2. Notify Managers/Admins (Team)
        const { data: managers } = await admin
            .from('profiles')
            .select('id')
            .in('role', ['ADMIN', 'MANAGER']);

        if (managers) {
            for (const manager of managers) {
                if (manager.id !== event.creatorId) {
                    await this.sendNotification(admin, {
                        recipientId: manager.id,
                        actorId: event.creatorId,
                        category: 'appointments',
                        title: 'Nueva Cita de Equipo',
                        message: `El agente ${event.creatorEmail} ha agendado una cita: "${event.appointment.title}"`,
                        resourceId: event.appointment.id
                    });
                }
            }
        }
    }

    @OnEvent('deal.created')
    async handleDealCreated(event: DealCreatedEvent) {
        this.logger.log(`Handling deal.created for ${event.deal.id}`);
        const admin = this.supabaseService.getAdminClient();

        // 1. Notify creator
        await this.sendNotification(admin, {
            recipientId: event.creatorId,
            actorId: event.creatorId,
            category: 'deals',
            title: 'Negocio Registrado',
            message: `Has registrado un nuevo negocio: "${event.deal.title}"`,
            resourceId: event.deal.id
        });

        // 2. Notify Managers/Admins
        const { data: managers } = await admin
            .from('profiles')
            .select('id')
            .in('role', ['ADMIN', 'MANAGER']);

        if (managers) {
            for (const manager of managers) {
                if (manager.id !== event.creatorId) {
                    await this.sendNotification(admin, {
                        recipientId: manager.id,
                        actorId: event.creatorId,
                        category: 'deals',
                        title: 'Nuevo Negocio de Equipo',
                        message: `El agente ${event.creatorEmail} ha registrado un negocio: "${event.deal.title}"`,
                        resourceId: event.deal.id
                    });
                }
            }
        }
    }

    private async sendNotification(
        adminClient: any,
        payload: {
            recipientId: string;
            actorId: string;
            category: 'appointments' | 'deals' | 'follows';
            title: string;
            message: string;
            resourceId?: string;
        }
    ) {
        const { data: recipient } = await adminClient
            .from('profiles')
            .select('preferences, role')
            .eq('id', payload.recipientId)
            .single();

        if (!recipient) return;

        // Default preferences if none set
        const prefs = recipient.preferences || {
            personal: { appointments: { inApp: true }, deals: { inApp: true }, follows: { inApp: true } },
            team: { appointments: { inApp: false }, deals: { inApp: true }, follows: { inApp: false } }
        };

        let shouldNotify = false;

        if (payload.actorId === payload.recipientId) {
            shouldNotify = prefs.personal?.[payload.category]?.inApp ?? true;
        } else {
            shouldNotify = prefs.team?.[payload.category]?.inApp ?? false;
        }

        if (shouldNotify) {
            await adminClient.from('notifications').insert({
                user_id: payload.recipientId,
                title: payload.title,
                message: payload.message,
                type: payload.category.toUpperCase(), // Map to existing type column if possible
                link: payload.category === 'appointments' ? '/dashboard/citas' : '/dashboard/kanban',
                is_read: false
            });
            this.logger.log(`Notification sent to ${payload.recipientId} (${payload.category})`);
        }
    }
}
