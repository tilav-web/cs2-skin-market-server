import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../user/user.schema';
import { Skin } from '../skin/skin.schema';
import { TransactionState } from '../click/click.constants';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  DEPOSIT = 'deposit', // Pul tashlash
  WITHDRAW = 'withdraw', // Pul yechish
  TRADE = 'trade', // Skin savdosi (sotish/sotib olish)
  BONUS = 'bonus', // Bonus yoki reklama mablag‘lari
}

@Schema()
export class Transaction {
  @Prop({ required: true, ref: User.name })
  user: Types.ObjectId; // Tranzaksiyani boshlagan foydalanuvchi (depozitor, xaridor, sotuvchi)

  @Prop({ ref: User.name, default: null }) // Pul/skin qabul qiluvchi (o‘tkazma bo‘lsa)
  receiver: Types.ObjectId;

  @Prop({ required: true, min: 0 }) // Manfiy bo‘lmasligi uchun validatsiya
  amount: string;

  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @Prop({
    required: true,
    enum: TransactionState,
    default: TransactionState.Pending,
  })
  state: TransactionState;

  @Prop({ type: Types.ObjectId, ref: Skin.name, default: null }) // BUY/SALE uchun
  skin: Types.ObjectId;

  @Prop({ default: null }) // Qo‘shimcha izoh
  description: string;

  @Prop({ unique: true, sparse: true, default: null }) // Steam Trade Offer ID
  trade_offer_id: string;

  // CLICK API uchun maxsus maydonlar
  @Prop({ unique: true, sparse: true }) // click_trans_id, faqat CLICK uchun
  id: string;

  @Prop({ default: null }) // Tranzaksiya yaratilgan vaqt (Unix timestamp)
  create_time: number;

  @Prop({ default: null }) // Prepare bosqichi IDsi
  prepare_id: number;

  @Prop({ default: null }) // To‘lov amalga oshirilgan vaqt
  perform_time: number;

  @Prop({ default: null }) // Bekor qilingan vaqt
  cancel_time: number;

  @Prop({ default: 'manual', enum: ['click', 'manual', 'system'] }) // To‘lov provayderi
  provider: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
