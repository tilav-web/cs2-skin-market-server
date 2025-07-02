import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './user.schema';
import { SteamStrategy } from './steam.strategy';
import { TelegramInitDataGuard } from './guards/telegram-initdata.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [UserService, SteamStrategy, TelegramInitDataGuard],
  exports: [UserService],
})
export class UserModule {}
