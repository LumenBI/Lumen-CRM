import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AppointmentsService } from './services/appointments.service';
import { ClientsService } from './services/clients.service';
import { DealsService } from './services/deals.service';
import { StatsService } from './services/stats.service';
import { NotificationListener } from './listeners/notification.listener';

@Module({
  imports: [NotificationsModule],
  controllers: [DashboardController],
  providers: [
    AppointmentsService,
    ClientsService,
    DealsService,
    StatsService,
    NotificationListener,
  ],
})
export class DashboardModule { }
