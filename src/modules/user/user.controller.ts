import {
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { TelegramInitDataGuard } from './guards/telegram-initdata.guard';

declare module 'express-session' {
  interface SessionData {
    initData?: string;
  }
}

@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get('steam')
  async steamLogin(@Query('initData') initData: string, @Res() res: Response) {
    if (!initData) {
      throw new UnauthorizedException('initData topilmadi');
    }

    // Cookie sifatida saqlash
    res.cookie('initData', initData, {
      httpOnly: true,
      secure: true, // HTTPS bo'lsa true
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
    });
    // Steam login flow'ni boshlash uchun redirect
    res.redirect('/users/steam/redirect');
  }

  @Get('steam/redirect')
  @UseGuards(AuthGuard('steam'))
  async steamRedirect() {
    // Passport avtomatik Steam login sahifasiga yo'naltiradi
  }

  @Get('steam/callback')
  @UseGuards(AuthGuard('steam'))
  async steamCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('Steam foydalanuvchisi aniqlanmadi');
    }
    const { steamId, profile, initData } = req.user as any;
    if (!initData) {
      throw new UnauthorizedException('initData topilmadi');
    }
    const telegramId = this.service.validateInitData(initData);
    if (!telegramId) {
      throw new UnauthorizedException('initData tasdiqlanmadi');
    }
    await this.service.linkTelegramToSteam(telegramId, steamId, profile);
    res.clearCookie('initData');
    res.redirect(`https://t.me/cs2_skin_market_bot`);
  }

  @Get('find/me')
  @UseGuards(TelegramInitDataGuard)
  async findByTelegramId(@Req() req: Request) {
    const initData = req['initData'];
    const user = await this.service.findByTelegramId(initData.telegram_id);
    return user;
  }
}
