import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { BotService } from './bot.service';

class TriggerDto {
  telegramId: string;
}

@Controller('bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post('trigger-start')
  @HttpCode(HttpStatus.OK)
  async triggerStart(@Body() triggerDto: TriggerDto) {
    if (!triggerDto.telegramId) {
      return { error: 'telegramId is required' };
    }
    return this.botService.triggerStartCommand(triggerDto.telegramId);
  }
}
