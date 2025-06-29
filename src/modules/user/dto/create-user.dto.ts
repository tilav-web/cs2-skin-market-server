import { IsString, IsDate } from 'class-validator';

export class SteamLoginDto {
  @IsString()
  telegram_id: string;

  @IsString()
  steam_id: string;

  @IsString()
  steam_token: string;

  @IsString()
  personaname: string;

  @IsDate()
  token_expires_at: Date;
}

export class SteamAuthDto {
  @IsString()
  telegram_id: string;

  @IsString()
  return_url: string;
}
