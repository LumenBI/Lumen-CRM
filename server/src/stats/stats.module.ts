import { Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { DealsModule } from '../deals/deals.module';
import { ClientsModule } from '../clients/clients.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { SupabaseModule } from '../common/supabase/supabase.module';

@Module({
    imports: [SupabaseModule, DealsModule, ClientsModule, AppointmentsModule],
    controllers: [StatsController],
    providers: [StatsService],
    exports: [StatsService],
})
export class StatsModule { }
