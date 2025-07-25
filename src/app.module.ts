import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from './modules/user/user.module';
import { SkinModule } from './modules/skin/skin.module';
import { BotModule } from './modules/bot/bot.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { TelegramPublisherModule } from './modules/telegram-publisher/telegram-publisher.module';
import { ClickModule } from './modules/click/click.module';
import { ReferralModule } from './modules/referral/referral.module';
import { SteamModule } from './modules/steam/steam.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule.register({ session: true, defaultStrategy: 'steam' }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost/cs2-skins',
    ),
    UserModule,
    SkinModule,
    BotModule,
    TransactionModule,
    TelegramPublisherModule,
    ClickModule,
    ReferralModule,
    SteamModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
