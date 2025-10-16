import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { seedDatabase } from './app/seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await seedDatabase(app);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.enableCors({
    origin: /^http:\/\/localhost:\d+$/,
    credentials: true,
  });
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    'Application is running on local host'
  );
}

bootstrap();
