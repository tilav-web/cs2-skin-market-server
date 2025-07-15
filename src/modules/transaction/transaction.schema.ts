import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../user/user.schema';
import { Skin } from '../skin/skin.schema'; // Skin modelini import qilamiz
import { TransactionState } from '../click/click.constants'; // Import TransactionState

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
  user: Types.ObjectId; // Tranzaksiyani boshlagan/ishtirok etgan foydalanuvchi (depozitor, xaridor, sotuvchi)

  @Prop({ ref: User.name, default: null }) // Skin/pulni qabul qiluvchi (agar o'tkazma bo'lsa)
  receiver: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @Prop({ default: TransactionState.Pending, enum: TransactionState })
  state: TransactionState;

  @Prop({ type: Types.ObjectId, ref: Skin.name, default: null }) // BUY/SALE tranzaksiyalari uchun skinga murojaat
  skin: Types.ObjectId;

  @Prop({ default: null })
  description: string; // Qo'shimcha ma'lumot yoki izoh

  // Click.uz specific fields (bular faqat DEPOSIT turidagi Click.uz tranzaksiyalari uchun ishlatiladi)
  @Prop({ unique: true, sparse: true }) // click_trans_id for Click.uz
  id: string;

  @Prop()
  create_time: number;

  @Prop()
  prepare_id: number;

  @Prop()
  perform_time: number;

  @Prop()
  cancel_time: number;

  @Prop({ default: 'manual' }) // 'click' for Click.uz deposits, 'manual' or 'system' for others
  provider: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
