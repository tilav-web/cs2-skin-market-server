import { IsString, IsOptional, IsDate } from 'class-validator';

export class CreateUserDto {
  @IsString()
  steam_id: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  telegram_id?: string;

  @IsString()
  personaname: string;

  @IsOptional()
  @IsString()
  steam_token?: string;

  @IsOptional()
  @IsDate()
  token_expires_at?: Date;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  personaname?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  telegram_id?: string;

  @IsOptional()
  @IsString()
  steam_token?: string;

  @IsOptional()
  @IsDate()
  token_expires_at?: Date;
} 