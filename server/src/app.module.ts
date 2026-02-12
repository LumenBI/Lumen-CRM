import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
<<<<<<< HEAD
import { ScheduleModule } from '@nestjs/schedule';
=======
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
<<<<<<< HEAD
import { CurrencyModule } from './currency/currency.module';
import { MailModule } from './mail/mail.module';
import { QuotesModule } from './quotes/quotes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthModule,
    DashboardModule,
    UsersModule,
    CurrencyModule,
    MailModule,
    QuotesModule
  ],
=======

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, DashboardModule, UsersModule],
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
