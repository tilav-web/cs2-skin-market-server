import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

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

  @Prop({ unique: true, sparse: true, required: false })
  telegram_id: string; // Telegram foydalanuvchi ID si

  @Prop({ default: null })
  personaname: string; // Steam foydalanuvchi nomi (UI uchun)

  @Prop({ default: null })
  trade_url: string; // Steam autentifikatsiya tokeni

  @Prop({ default: null })
  action: string;

  @Prop({
    default: 'active',
    enum: ['active', 'not_active', 'block'],
    required: true,
  })
  status: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
