import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../user/user.schema';

export type SkinDocument = Skin & Document;

@Schema({ timestamps: true })
export class Skin {
  @Prop({ type: String })
  _id?: string;

  @Prop({ required: true, unique: true })
  assetid: string; // Skinning noyob ID'si (trade qilish uchun kerak)

  @Prop({ required: true })
  classid: string; // Skin model turi

  @Prop({ required: true })
  instanceid: string; // Skin versiyasi (StatTrak, Souvenir va h.k.)

  @Prop({ required: true })
  market_hash_name: string; // Skinning to'liq nomi (masalan: "AK-47 | Redline (Field-Tested)")

  @Prop({ required: true })
  icon_url: string; // Skin rasmi (SteamCDN dan olinadi)

  @Prop({ required: true })
  tradable: boolean; // Trade qilish mumkinmi

  @Prop({ required: true, min: 0, default: 0 })
  price: number; // Skinning narxi (foydalanuvchi tomonidan kiritilgan)

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User; // Skin egasi (User schemasiga reference)

  @Prop({ default: false })
  advertising: boolean;

  @Prop({
    enum: ['available', 'pending', 'sold', 'canceled'],
    default: 'available',
  })
  status: string; // Skinning holati: mavjud, kutilmoqda, sotilgan yoki bekor qilingan

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  buyer: User; // Skinni sotib olgan foydalanuvchi (agar sotilgan bo‘lsa)

  @Prop({ default: null })
  message_id: string; // telegram post taxrirlsh uchun

  @Prop({ type: String, default: '' })
  description: string; // Sotuvga qo'yilgan skin uchun tavsif

  @Prop({ default: 0 })
  advertising_cost: number; // Reklama uchun to'langan summa

  @Prop({ default: 0.03 })
  commission_rate: number; // Skin sotish uchun komissiya foizi

  @Prop({ default: 0 })
  commission_amount: number; // skin sotilganda platformaga tushgan foyda

  @Prop({ default: 0 })
  seller_revenue: number; // Skin sotuvchiga tushgan foyda

  @Prop({ default: null })
  publish_at: Date; // Skinning reklama bo'limida joylashgan vaqti

  @Prop({ default: null })
  expires_at: Date; // Skinning reklama bo'limida qancha vaqt turishi kerak
}

export const SkinSchema = SchemaFactory.createForClass(Skin);
