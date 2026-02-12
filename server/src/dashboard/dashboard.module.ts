import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { DashboardController } from './dashboard.controller';
import { SupabaseService } from './services/supabase.service';
import { NotificationsService } from './services/notifications.service';
import { AppointmentsService } from './services/appointments.service';
import { ClientsService } from './services/clients.service';
import { DealsService } from './services/deals.service';
import { StatsService } from './services/stats.service';

@Module({
  controllers: [DashboardController],
  providers: [
    SupabaseService,
    NotificationsService,
    AppointmentsService,
    ClientsService,
    DealsService,
    StatsService
  ],
})
export class DashboardModule { }
=======
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
