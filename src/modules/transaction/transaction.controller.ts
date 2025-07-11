import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TelegramInitDataGuard } from '../user/guards/telegram-initdata.guard';
import { Request } from 'express';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @UseGuards(TelegramInitDataGuard)
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(createTransactionDto);
  }

  @Get()
  @UseGuards(TelegramInitDataGuard)
  findAll() {
    return this.transactionService.findAll();
  }

  @Get(':id')
  @UseGuards(TelegramInitDataGuard)
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(id);
  }

  @Get('my') // Foydalanuvchining o'z tranzaksiyalari uchun yangi endpoint
  @UseGuards(TelegramInitDataGuard)
  findMyTransactions(@Req() req: Request) {
    const initData = req['initData'];
    return this.transactionService.findUserTransactions(initData.telegram_id);
  }

  @UseGuards(TelegramInitDataGuard) 
  @Post('deposit/initiate')
  async initiateDeposit(
    @Req() req: Request,
    @Body('amount') amount: number,
  ) {
    const userId = req['initData'].user.id;
    const transaction = await this.transactionService.initiateDeposit(
      userId,
      amount,
    );

    const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID;
    const CLICK_MERCHANT_ID = process.env.CLICK_MERCHANT_ID;
    const return_url = 'https://t.me/your_bot_name';

    const params = new URLSearchParams({
        service_id: CLICK_SERVICE_ID,
        merchant_id: CLICK_MERCHANT_ID,
        amount: transaction.amount.toString(),
        transaction_param: transaction._id.toString(),
        return_url: return_url
    }).toString();

    return {
        url: `https://my.click.uz/services/pay?${params}`
    };
  }
}
