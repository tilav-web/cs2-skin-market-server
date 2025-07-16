import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReferralsDocument = Referrals & Document;

@Schema({ timestamps: true })
export class Referrals {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  referrals: Types.ObjectId[];
}

export const ReferralsSchema = SchemaFactory.createForClass(Referrals);
