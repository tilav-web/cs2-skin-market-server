import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './user.schema';
import { SteamStrategy } from './steam.strategy';
import { TelegramInitDataGuard } from './guards/telegram-initdata.guard';
import { Skin, SkinSchema } from '../skin/skin.schema';
import { forwardRef } from '@nestjs/common';
import { ReferralModule } from '../referral/referral.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Skin.name, schema: SkinSchema },
    ]),
    forwardRef(() => ReferralModule), // Aylanma bog'liqlikni hal qilish uchun
  ],
  controllers: [UserController],
  providers: [UserService, SteamStrategy, TelegramInitDataGuard],
  exports: [UserService],
})
export class UserModule {}
