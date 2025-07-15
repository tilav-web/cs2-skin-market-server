import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { ClickService } from './click.service';
import { Response } from 'express';

@Controller('click')
export class ClickController {
  constructor(private readonly clickService: ClickService) {}

  @Post('prepare')
  async prepare(@Body() data: any, @Res() res: Response) {
    const result = await this.clickService.prepare(data);
    res
      .set({
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      })
      .status(HttpStatus.OK)
      .send(result);
  }

  @Post('complete')
  async complete(@Body() data: any, @Res() res: Response) {
    const result = await this.clickService.complete(data);
    res
      .set({
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      })
      .status(HttpStatus.OK)
      .send(result);
  }

  @Post('initiate-deposit')
  async initiateDeposit(@Body('amount') amount: number, @Res() res: Response) {
    const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID;
    const CLICK_MERCHANT_ID = process.env.CLICK_MERCHANT_ID;
    const CLICK_MERCHANT_USER_ID = process.env.CLICK_MERCHANT_USER_ID; // Bu yerda ishlatiladi
    const CLICK_CHECKOUT_LINK = process.env.CLICK_CHECKOUT_LINK;

    // Foydalanuvchi ID'sini olish (masalan, autentifikatsiya qilingan foydalanuvchidan)
    // Hozircha, misol uchun, foydalanuvchi ID'sini qattiq kodlaymiz yoki req.user dan olamiz
    const userId = '60d5ec49f8c7d00015f8e7b0'; // Misol uchun foydalanuvchi ID'si. Buni o'zgartiring!

    const params = new URLSearchParams();
    params.append('service_id', CLICK_SERVICE_ID);
    params.append('merchant_id', CLICK_MERCHANT_ID);
    params.append('merchant_user_id', CLICK_MERCHANT_USER_ID); // Qo'shildi
    params.append('amount', amount.toString());
    params.append('transaction_param', userId);
    params.append('return_url', 'http://localhost:3000/profile');

    const paymentUrl = `${CLICK_CHECKOUT_LINK}?${params.toString()}`;

    res.status(HttpStatus.OK).json({ payment_url: paymentUrl });
  }
}
