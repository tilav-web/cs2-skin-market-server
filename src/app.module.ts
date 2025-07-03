import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from './modules/user/user.module';
import { SkinModule } from './modules/skin/skin.module';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
