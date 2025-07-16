import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Referrals,
  ReferralsDocument,
  ReferralsPopulatedDocument,
} from './referral.schema';
import { UserService } from '../user/user.service';
import { TransactionService } from '../transaction/transaction.service';
import { TransactionType } from '../transaction/transaction.schema';

@Injectable()
export class ReferralService {
  constructor(
    @InjectModel(Referrals.name)
    private referralsModel: Model<ReferralsDocument>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly transactionService: TransactionService,
  ) {}

  async handleReferral(
    referrerTelegramId: string,
    referredUserTelegramId: string,
  ): Promise<void> {
    // Find the referrer user by telegram_id
    const referrer =
      await this.userService.findByTelegramId(referrerTelegramId);
    if (!referrer) {
      console.warn(
        `Referrer with Telegram ID ${referrerTelegramId} not found.`,
      );
      return;
    }

    // Find the referred user by telegram_id
    const referredUser = await this.userService.findByTelegramId(
      referredUserTelegramId,
    );
    if (!referredUser) {
      console.warn(
        `Referred user with Telegram ID ${referredUserTelegramId} not found.`,
      );
      return;
    }

    // Check if the referred user is already in the referrer's list
    const existingReferral = await this.referralsModel.findOne({
      user: referrer._id,
      referrals: referredUser._id,
    });

    if (existingReferral) {
      console.log(
        `User ${referredUserTelegramId} already referred by ${referrerTelegramId}.`,
      );
      return;
    }

    // Add referred user to the referrer's referrals list
    await this.referralsModel.findOneAndUpdate(
      { user: referrer._id },
      { $addToSet: { referrals: referredUser._id } },
      { upsert: true, new: true },
    );

    // Award bonus to the referrer
    const bonusAmount = 500; // Example bonus amount
    await this.userService.updateCashback(
      referrer._id as Types.ObjectId,
      bonusAmount,
    );

    // Create a transaction record for the bonus
    await this.transactionService.create({
      userId: referrer._id.toString(), // userId string bo'lishi kerak
      amount: bonusAmount,
      type: TransactionType.BONUS,
      description: `Referral bonus for ${referredUser.personaname}`,
    });

    console.log(
      `Referral successful: ${referredUser.personaname} referred by ${referrer.personaname}. Bonus awarded.`,
    );
  }

  async getReferralsForUser(
    userId: Types.ObjectId,
  ): Promise<ReferralsPopulatedDocument | null> {
    return this.referralsModel
      .findOne({ user: userId })
      .populate('referrals')
      .exec() as Promise<ReferralsPopulatedDocument | null>;
  }

  async getReferralsForUserByTelegramId(
    telegramId: string,
  ): Promise<ReferralsPopulatedDocument | null> {
    const user = await this.userService.findByTelegramId(telegramId);
    if (!user) {
      return null;
    }
    return this.getReferralsForUser(user._id as Types.ObjectId);
  }
}
