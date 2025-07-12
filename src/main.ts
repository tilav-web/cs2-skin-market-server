import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { clientUrl, serverUrl } from './utils/shared';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log(`Client URL is ${clientUrl}`);
  console.log(`Server URL is ${serverUrl}`);
  app.enableCors({
    origin: [clientUrl, serverUrl],
    credentials: true,
  });
  app.use(bodyParser.json());
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
