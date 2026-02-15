import { Module } from '@nestjs/common';
import { AppConfigModule } from './common/config/app-config.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { SecurityModule } from './security/security.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CurrencyModule } from './currency/currency.module';
import { MailModule } from './mail/mail.module';
import { QuotesModule } from './quotes/quotes.module';
import { AiModule } from './ai/ai.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DealsModule } from './deals/deals.module';
import { ClientsModule } from './clients/clients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    AppConfigModule,
    SupabaseModule,
    SecurityModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
    DealsModule,
    ClientsModule,
    AppointmentsModule,
    NotificationsModule,
    StatsModule,
    UsersModule,
    CurrencyModule,
    MailModule,
    QuotesModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
