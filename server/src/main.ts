import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true, // Allow all origins for local network access
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0'); // Listen on all interfaces
  console.log(`🚀 Backend running on: http://0.0.0.0:${process.env.PORT ?? 3001}`);
}
bootstrap();
