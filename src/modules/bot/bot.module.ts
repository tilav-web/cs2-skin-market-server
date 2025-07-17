import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { User, UserSchema } from '../user/user.schema';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UserModule,
  ],
  controllers: [BotController],
  providers: [BotService],
})
export class BotModule {}
