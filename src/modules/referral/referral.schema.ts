import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, PopulatedDoc } from 'mongoose';
import { UserDocument } from '../user/user.schema';

export type ReferralsDocument = Referrals & Document;

// This type represents the document after 'referrals' has been populated
export type ReferralsPopulatedDocument = Omit<
  ReferralsDocument,
  'referrals'
> & {
  referrals: PopulatedDoc<UserDocument>[];
};

@Schema({ timestamps: true })
export class Referrals {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  referrals: Types.ObjectId[]; // This remains ObjectId[] for the unpopulated schema
}

export const ReferralsSchema = SchemaFactory.createForClass(Referrals);
