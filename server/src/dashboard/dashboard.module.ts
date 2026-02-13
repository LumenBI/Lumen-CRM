import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { SupabaseService } from './services/supabase.service';
import { NotificationsService } from './services/notifications.service';
import { AppointmentsService } from './services/appointments.service';
import { ClientsService } from './services/clients.service';
import { DealsService } from './services/deals.service';
import { StatsService } from './services/stats.service';
import { NotificationListener } from './listeners/notification.listener';

@Module({
  controllers: [DashboardController],
  providers: [
    SupabaseService,
    NotificationsService,
    AppointmentsService,
    ClientsService,
    DealsService,
    StatsService,
    NotificationListener
  ],
})
export class DashboardModule { }
