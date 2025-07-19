import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TelegramInitDataGuard } from '../user/guards/telegram-initdata.guard';
import { Request } from 'express';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('buy/:skinId')
  @UseGuards(TelegramInitDataGuard)
  async buySkin(@Req() req: Request, @Param('skinId') skinId: string) {
    const initData = req['initData'];
    return this.transactionService.buySkin(initData.telegram_id, skinId);
  }

  @Get()
  @UseGuards(TelegramInitDataGuard)
  findAll() {
    return this.transactionService.findAll();
  }

  @Get('my') // Foydalanuvchining o'z tranzaksiyalari uchun yangi endpoint
  @UseGuards(TelegramInitDataGuard)
  findMyTransactions(@Req() req: Request) {
    const initData = req['initData'];
    return this.transactionService.findUserTransactions(initData.telegram_id);
  }

  @Get(':id')
  @UseGuards(TelegramInitDataGuard)
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(id);
  }
}
