import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { clientUrl, serverUrl } from './utils/shared';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [clientUrl, serverUrl],
    credentials: true,
  });
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
