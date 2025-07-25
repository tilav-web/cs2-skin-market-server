import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User &
  Document & { createdAt: Date; updatedAt: Date };

export enum UserStatus {
  ACTIVE = 'active',
  NOT_ACTIVE = 'not_active',
  BLOCK = 'block',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ default: null })
  steam_id: string; // Steam foydalanuvchi ID si

  @Prop({ default: null })
  phone: string; // telefon raqami

  @Prop({ default: null })
  photo: string; // Steam foydalanuvchi photo si

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: 0, min: 0 })
  cashback: number; // Reklama va boshqa xizmatlar uchun cashback balansi

  @Prop({ unique: true, sparse: true, required: false })
  telegram_id: string; // Telegram foydalanuvchi ID si

  @Prop({ default: null })
  personaname: string; // Steam foydalanuvchi nomi (UI uchun)

  @Prop({
    type: Object,
    default: {
      value: null,
      status: false,
    },
  })
  trade_url: {
    value: string; // Foydalanuvchining savdo URL manzili
    status: boolean; // Savdo URL manzilining holati
  }; // Steam autentifikatsiya tokeni

  @Prop({ default: null })
  action: string;

  @Prop({
    type: String,
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    required: true,
  })
  status: UserStatus;
}

export const UserSchema = SchemaFactory.createForClass(User);
