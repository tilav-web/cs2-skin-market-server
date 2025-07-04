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
} from '@nestjs/common';
import { Request } from 'express';
import { SkinService } from './skin.service';
import { CreateSkinDto } from './dto/create-skin.dto';
import { TelegramInitDataGuard } from '../user/guards/telegram-initdata.guard';

@Controller('skins')
export class SkinController {
  constructor(private readonly skinService: SkinService) {}

  @Post()
  @UseGuards(TelegramInitDataGuard)
  async create(@Body() dto: CreateSkinDto, @Req() req: Request) {
    const telegram_id = req['initData'].telegram_id;
    return this.skinService.create(dto, telegram_id);
  }

  @Get()
  @UseGuards(TelegramInitDataGuard)
  async findAll(@Req() req: Request) {
    const telegram_id = req['initData'].telegram_id;
    return this.skinService.findAllByUser(telegram_id);
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

  @Get('advertising-pending')
  async findAdvertisingPending() {
    return this.skinService.findAdvertisingPending();
  }
}
