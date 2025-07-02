import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { clientUrl, serverUrl } from './utils/shared';
import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    session({
      secret: '76561198123456789',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: true },
    }),
  );
  app.enableCors({
    origin: [clientUrl, serverUrl],
    credentials: true,
  });
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
