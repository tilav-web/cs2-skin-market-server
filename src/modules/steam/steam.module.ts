import { Module } from '@nestjs/common';
import { SteamService } from './steam.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [SteamService],
  exports: [SteamService],
})
export class SteamModule {}