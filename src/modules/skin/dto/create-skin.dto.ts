import { IsString, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class CreateSkinDto {
  @IsString()
  assetid: string;

  @IsString()
  classid: string;

  @IsString()
  instanceid: string;

  @IsString()
  market_hash_name: string;

  @IsString()
  icon_url: string;

  @IsBoolean()
  tradable: boolean;

  @IsNumber()
  price: number;

  @IsBoolean()
  @IsOptional()
  advertising?: boolean;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  publish_at?: string;

  @IsString()
  @IsOptional()
  expires_at?: string;
}
