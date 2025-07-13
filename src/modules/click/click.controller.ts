import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ClickService } from './click.service';
import { ClickDto, ClickAction } from './dto/click.dto';
import { TelegramInitDataGuard } from '../user/guards/telegram-initdata.guard';
import { CLICK_ERRORS } from './click.constants';

@Controller('click')
export class ClickController {
  constructor(private readonly clickService: ClickService) {}

  @UseGuards(TelegramInitDataGuard)
  @Post('create-payment')
  async createPayment(@Req() req, @Body('amount') amount: number) {
    const userId = req.user.id;
    return this.clickService.createPayment(userId, amount);
  }

  @Post('transaction')
  async handleTransaction(@Body() clickDto: ClickDto) {
    if (clickDto.action === ClickAction.PREPARE) {
      return this.clickService.prepare(clickDto);
    }
    if (clickDto.action === ClickAction.COMPLETE) {
      return this.clickService.complete(clickDto);
    }
    return CLICK_ERRORS.ACTION_NOT_FOUND;
  }
}
