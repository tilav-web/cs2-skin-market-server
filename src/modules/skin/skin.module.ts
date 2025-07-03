import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Skin, SkinSchema } from './skin.schema';
import { SkinService } from './skin.service';
import { SkinController } from './skin.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Skin.name, schema: SkinSchema }]),
    UserModule,
  ],
  controllers: [SkinController],
  providers: [SkinService],
})
export class SkinModule {}
