import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SkinController } from './skin.controller';
import { SkinService } from './skin.service';
import { Skin, SkinSchema } from './skin.schema';
import { UserModule } from '../user/user.module';
import { TelegramPublisherModule } from '../telegram-publisher/telegram-publisher.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Skin.name, schema: SkinSchema }]),
    UserModule,
    TelegramPublisherModule, // TelegramPublisherModule ni import qilish
  ],
  controllers: [SkinController],
  providers: [SkinService],
  exports: [SkinService], // Boshqa modullarda ishlatish uchun
})
export class SkinModule {}
