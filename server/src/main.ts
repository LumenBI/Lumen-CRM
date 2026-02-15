import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NotificationsService } from './notifications/notifications.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const { httpAdapter } = app.get(HttpAdapterHost);
  const notificationsService = app.get(NotificationsService);
  app.useGlobalFilters(
    new AllExceptionsFilter(app.get(HttpAdapterHost), notificationsService),
  );

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Sanitize FRONTEND_URL to remove trailing slash if present
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');

  if (!frontendUrl && process.env.NODE_ENV === 'production') {
    throw new Error('FRONTEND_URL must be defined in production');
  }

  const origins = [frontendUrl, 'http://localhost:3000'].filter(Boolean);

  app.enableCors({
    origin: origins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization, x-google-token',
  });
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
  console.log(
    `🚀 Backend running on: http://0.0.0.0:${process.env.PORT ?? 3001}`,
  );
  console.log(`🌍 CORS Enabled for: ${frontendUrl}`);
}
bootstrap();
