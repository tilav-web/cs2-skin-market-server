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
  user: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @Prop({ default: 'pending', enum: ['pending', 'completed', 'failed'] })
  status: 'pending' | 'completed' | 'failed';

  @Prop({ default: null })
  skin: {
    name: string;
    wear: string;
    image: string;
    rarity: string;
    statTrak: boolean;
    weapon: string;
  };
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
