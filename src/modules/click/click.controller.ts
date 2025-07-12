import { Body, Controller, Post } from '@nestjs/common';
import { ClickService } from './click.service';
import { ClickDto } from './dto/click.dto';

@Controller('click')
export class ClickController {
  constructor(private readonly clickService: ClickService) {}

  @Post('transaction')
  async handleTransaction(@Body() clickDto: ClickDto) {
    if (clickDto.action === '0') {
      return this.clickService.prepare(clickDto);
    }
    if (clickDto.action === '1') {
      return this.clickService.complete(clickDto);
    }
  }
}
