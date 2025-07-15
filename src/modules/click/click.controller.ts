import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Req,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import { ClickService } from './click.service';
import { Response, Request } from 'express';
import { TelegramInitDataGuard } from '../user/guards/telegram-initdata.guard';

@Controller('click')
export class ClickController {
  constructor(private readonly clickService: ClickService) {}

  @Post('prepare')
  async prepare(@Body() data: any, @Res() res: Response) {
    try {
      const result = await this.clickService.prepare(data);
      res
        .set({
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        })
        .send(result);
    } catch (error) {
      console.log(error);
      // NestJS da xatolar odatda Exception Filter tomonidan boshqariladi.
      // Bu yerda to'g'ridan-to'g'ri javob qaytarish o'rniga, xatoni tashlash yaxshiroq.
      // throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
      // Yoki Click.uz ga mos xato javobini qaytarish:
      res
        .set({
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        })
        .send({
          error: -1, // Umumiy xato kodi
          error_note: 'Server error',
        });
    }
  }

  @Post('complete')
  async complete(@Body() data: any, @Res() res: Response) {
    try {
      const result = await this.clickService.complete(data);
      res
        .set({
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        })
        .send(result);
    } catch (error) {
      console.log(error);
      res
        .set({
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        })
        .send({
          error: -1, // Umumiy xato kodi
          error_note: 'Server error',
        });
    }
  }

  @Post('initiate-deposit')
  @UseGuards(TelegramInitDataGuard) // TelegramInitDataGuard ni qo'shamiz
  async initiateDeposit(
    @Body('amount') amount: number,
    @Res() res: Response,
    @Req() req: Request, // Request ob'ektini olamiz
  ) {
    const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID;
    const CLICK_MERCHANT_ID = process.env.CLICK_MERCHANT_ID;
    const CLICK_MERCHANT_USER_ID = process.env.CLICK_MERCHANT_USER_ID;
    const CLICK_CHECKOUT_LINK = process.env.CLICK_CHECKOUT_LINK;

    // Foydalanuvchi ID'sini req.initData.telegram_id dan olamiz
    const userId = req['initData'].telegram_id;

    if (!userId) {
      // Agar userId topilmasa, xato qaytaramiz
      throw new HttpException('User ID not found', HttpStatus.BAD_REQUEST);
    }

    const params = new URLSearchParams();
    params.append('service_id', CLICK_SERVICE_ID);
    params.append('merchant_id', CLICK_MERCHANT_ID);
    params.append('merchant_user_id', CLICK_MERCHANT_USER_ID);
    params.append('amount', amount.toString());
    params.append('transaction_param', userId); // Foydalanuvchi ID'sini yuboramiz
    params.append(
      'return_url',
      'https://t.me/cs2_skin_market_bot/WebApp=?startapp=cs2',
    );

    const paymentUrl = `${CLICK_CHECKOUT_LINK}?${params.toString()}`;

    res.status(HttpStatus.OK).json({ payment_url: paymentUrl });
  }
}
