import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { SkinService } from './skin.service';
import { CreateSkinDto } from './dto/create-skin.dto';
import { TelegramInitDataGuard } from '../user/guards/telegram-initdata.guard';

@Controller('skins')
export class SkinController {
  constructor(private readonly skinService: SkinService) {}

  @Post(':id/list-for-sale')
  @UseGuards(TelegramInitDataGuard)
  async listForSale(
    @Param('id') skinId: string,
    @Body() dto: Partial<CreateSkinDto>,
    @Req() req: Request,
  ) {
    const telegram_id = req['initData'].telegram_id;
    return this.skinService.listSkinForSale(skinId, dto, telegram_id);
  }

  @Get()
  @UseGuards(TelegramInitDataGuard)
  async findAll(@Req() req: Request) {
    const telegram_id = req['initData'].telegram_id;
    return this.skinService.findAllByUser(telegram_id);
  }

  @Get('advertising-pending')
  async findAdvertisingPending(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.skinService.findAdvertisingPending(Number(page), Number(limit));
  }

  @Get('advertised')
  async findAdvertisedSkins(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.skinService.findAdvertisedSkins(Number(page), Number(limit));
  }

  @Get(':id')
  @UseGuards(TelegramInitDataGuard)
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const telegram_id = req['initData'].telegram_id;
    return this.skinService.findOneById(id, telegram_id);
  }

  @Patch(':id')
  @UseGuards(TelegramInitDataGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateSkinDto>,
    @Req() req: Request,
  ) {
    const telegram_id = req['initData'].telegram_id;
    return this.skinService.update(id, dto, telegram_id);
  }

  @Delete(':id')
  @UseGuards(TelegramInitDataGuard)
  async remove(@Param('id') id: string, @Req() req: Request) {
    const telegram_id = req['initData'].telegram_id;
    return this.skinService.remove(id, telegram_id);
  }

  @Get('public/:id')
  async findOnePublic(@Param('id') id: string) {
    return this.skinService.findOnePublicById(id);
  }
}
