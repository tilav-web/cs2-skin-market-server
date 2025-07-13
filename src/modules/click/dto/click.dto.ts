import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export enum ClickAction {
  PREPARE = '0',
  COMPLETE = '1',
}

export class ClickDto {
  @IsNumberString()
  @IsNotEmpty()
  click_trans_id: string;

  @IsNumberString()
  @IsNotEmpty()
  service_id: string;

  @IsNumberString()
  @IsNotEmpty()
  @IsString()
  @IsNotEmpty()
  merchant_trans_id: string;

  @IsNumberString()
  @IsNotEmpty()
  amount: string;

  @IsIn([ClickAction.PREPARE, ClickAction.COMPLETE])
  @IsNotEmpty()
  action: ClickAction;

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
