import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Referrals, ReferralsSchema } from './referral.schema';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { UserModule } from '../user/user.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Referrals.name, schema: ReferralsSchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => TransactionModule),
  ],
  providers: [ReferralService],
  controllers: [ReferralController],
  exports: [ReferralService],
})
export class ReferralModule {}
