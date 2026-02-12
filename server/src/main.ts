import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  // Sanitize FRONTEND_URL to remove trailing slash if present
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
  console.log(`🚀 Backend running on: http://0.0.0.0:${process.env.PORT ?? 3001}`);
  console.log(`🌍 CORS Enabled for: ${frontendUrl}`);
}
bootstrap();
