import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose'; // MongooseModule ni import qilish
import { TelegramPublisherService } from './telegram-publisher.service';
import { TelegramPublisherProcessor } from './telegram-publisher.processor';
import { Skin, SkinSchema } from '../skin/skin.schema'; // Skin modelini import qilish

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'telegram-publisher',
    }),
    MongooseModule.forFeature([{ name: Skin.name, schema: SkinSchema }]), // Skin modelini shu yerda taqdim etish
  ],
  providers: [TelegramPublisherService, TelegramPublisherProcessor],
  exports: [TelegramPublisherService],
})
export class TelegramPublisherModule {}
