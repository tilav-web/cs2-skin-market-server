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
import { ClickDto } from './dto/click.dto';
import { IsNumber, Min } from 'class-validator';

class InitiateDepositDto {
  @IsNumber()
  @Min(1000)
  amount: number;
}

@Controller('click')
export class ClickController {
  constructor(private readonly clickService: ClickService) {}

  @Post('prepare')
  async prepare(@Body() data: ClickDto, @Res() res: Response) {
    try {
      const result = await this.clickService.prepare(data);
      res
        .set({
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        })
        .send(result);
    } catch (error) {
      res
        .set({
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        })
        .send({
          error: error.response?.error || -1,
          error_note: error.response?.error_note || 'Server xatosi',
        });
    }
  }

  @Post('complete')
  async complete(@Body() data: ClickDto, @Res() res: Response) {
    try {
      const result = await this.clickService.complete(data);
      res
        .set({
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        })
        .send(result);
    } catch (error) {
      res
        .set({
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        })
        .send({
          error: error.response?.error || -1,
          error_note: error.response?.error_note || 'Server xatosi',
        });
    }
  }

  @Post('initiate-deposit')
  @UseGuards(TelegramInitDataGuard)
  async initiateDeposit(
    @Body() body: InitiateDepositDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const { amount } = body;
    const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID;
    const TELEGRAM_BOT_URL = process.env.TELEGRAM_BOT_URL;
    const CLICK_MERCHANT_ID = process.env.CLICK_MERCHANT_ID;
    const CLICK_CHECKOUT_LINK = process.env.CLICK_CHECKOUT_LINK;

    const telegramId = req['initData']?.telegram_id;
    if (!telegramId) {
      throw new HttpException(
        'Foydalanuvchi ID topilmadi',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      !CLICK_SERVICE_ID ||
      !CLICK_MERCHANT_ID ||
      !CLICK_CHECKOUT_LINK ||
      !TELEGRAM_BOT_URL
    ) {
      throw new HttpException(
        'Mu hit sozlamalari noto‘g‘ri',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const params = new URLSearchParams();
    params.append('service_id', CLICK_SERVICE_ID);
    params.append('merchant_id', CLICK_MERCHANT_ID);
    params.append('amount', amount.toFixed(2));
    params.append('transaction_param', telegramId);
    params.append(
      'return_url',
      encodeURI(`${TELEGRAM_BOT_URL}/WebApp=?startapp=profile`),
    );

    const paymentUrl = `${CLICK_CHECKOUT_LINK}?${params.toString()}`;
    res.status(HttpStatus.OK).json({ payment_url: paymentUrl });
  }
}
