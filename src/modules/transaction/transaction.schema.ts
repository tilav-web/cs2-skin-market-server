import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../user/user.schema';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  DEPOSIT = 'deposit', // Pul tashlash
  WITHDRAW = 'withdraw', // Pul yechish
  SALE = 'sale', // Skin sotish
  BONUS = 'bonus', // Bonus yoki reklama mablag‘lari
  BUY = 'buy', // skin sotib olish
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true, ref: User.name })
  owner: Types.ObjectId; // Kimning nomidan amalga oshirilgan

  @Prop({ ref: User.name, default: null })
  receiver: Types.ObjectId; // kimga sotilgan

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @Prop({ default: 'pending', enum: ['pending', 'completed', 'failed'] })
  status: 'pending' | 'completed' | 'failed';

  @Prop({ type: Types.ObjectId, ref: 'Skin', default: null }) // Skin modeliga murojaat
  skin: Types.ObjectId;

  @Prop({ default: null })
  description: string; // Qo'shimcha ma'lumot yoki izoh
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
