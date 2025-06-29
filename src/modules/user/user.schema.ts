import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ default: null })
  steam_id: string; // Steam foydalanuvchi ID si

  @Prop({ default: null })
  phone: string; // Steam foydalanuvchi ID si

  @Prop({ default: 0 })
  balance: number;

  @Prop({ unique: true })
  telegram_id: string; // Telegram foydalanuvchi ID si

  @Prop({ default: null })
  personaname: string; // Steam foydalanuvchi nomi (UI uchun)

  @Prop({ default: null })
  steam_token: string; // Steam autentifikatsiya tokeni

  @Prop({ default: null })
  token_expires_at: Date; // Token muddati

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
