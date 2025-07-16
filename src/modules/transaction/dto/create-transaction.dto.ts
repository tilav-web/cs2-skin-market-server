import {
  IsMongoId,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { TransactionType } from '../transaction.schema';

export class CreateTransactionDto {
  @IsMongoId()
  userId: string;

  @IsOptional()
  @IsMongoId()
  receiver?: string;

  @IsNumber()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsMongoId()
  skin?: string; // ObjectId string ko'rinishida

  @IsOptional()
  @IsString()
  description?: string;
}
