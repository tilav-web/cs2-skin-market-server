import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Referrals, ReferralsSchema } from './referrals.schema';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { UserModule } from '../user/user.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Referrals.name, schema: ReferralsSchema }]),
    UserModule, // UserModule'ni import qilamiz, chunki ReferralService User'ni yangilaydi
    TransactionModule, // TransactionModule'ni import qilamiz, chunki ReferralService Transaction yaratadi
  ],
  providers: [ReferralService],
  controllers: [ReferralController],
  exports: [ReferralService], // Boshqa modullar ReferralService'dan foydalanishi uchun
})
export class ReferralModule {}
