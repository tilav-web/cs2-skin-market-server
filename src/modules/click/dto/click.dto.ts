import { IsIn, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class ClickDto {
  @IsNumberString()
  @IsNotEmpty()
  click_trans_id: string;

  @IsNumberString()
  @IsNotEmpty()
  service_id: string;

  @IsNumberString()
  @IsNotEmpty()
  click_paydoc_id: string;

  @IsString()
  @IsNotEmpty()
  merchant_trans_id: string;

  @IsNumberString()
  @IsNotEmpty()
  amount: string;

  @IsIn(['0', '1'])
  @IsNotEmpty()
  action: string;

  @IsNumberString()
  @IsNotEmpty()
  error: string;

  @IsString()
  @IsNotEmpty()
  error_note: string;

  @IsString()
  @IsNotEmpty()
  sign_time: string;

  @IsString()
  @IsNotEmpty()
  sign_string: string;

  @IsNumberString()
  @IsOptional()
  merchant_prepare_id?: string;
}
