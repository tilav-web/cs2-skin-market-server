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
}
