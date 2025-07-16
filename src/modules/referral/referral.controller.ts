import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { TelegramInitDataGuard } from '../user/guards/telegram-initdata.guard';
import { Request } from 'express';
import { ReferralsPopulatedDocument } from './referral.schema';
import { UserDocument } from '../user/user.schema';

@Controller('referrals')
@UseGuards(TelegramInitDataGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('my')
  async getMyReferrals(@Req() req: Request) {
    const initData = req['initData'];
    const telegramId = initData.telegramId; // validateInitData endi { telegramId, startParam } qaytaradi

    const referrals =
      await this.referralService.getReferralsForUserByTelegramId(telegramId);

    const referredUsersData =
      (referrals as ReferralsPopulatedDocument)?.referrals.map(
        (referredUser) => ({
          id: referredUser._id,
          personaname: (referredUser as UserDocument).personaname,
          photo: (referredUser as UserDocument).photo,
          joinDate: (referredUser as UserDocument).createdAt, // Yoki boshqa tegishli sana
        }),
      ) || [];
    return referredUsersData;
  }
}
