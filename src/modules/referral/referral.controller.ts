import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { TelegramInitDataGuard } from '../user/guards/telegram-initdata.guard';
import { Request } from 'express';

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
      referrals?.referrals.map((referredUser) => ({
        id: referredUser._id,
        personaname: referredUser.personaname,
        photo: referredUser.photo,
        joinDate: referredUser.createdAt, // Yoki boshqa tegishli sana
      })) || [];
    return referredUsersData;
  }
}
