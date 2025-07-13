import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

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

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  advertising?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  advertising_hours?: number;
}
