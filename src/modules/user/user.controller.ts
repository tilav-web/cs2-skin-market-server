import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('with-phone')
  getUsersWithPhone() {
    return this.userService.getUsersWithPhone();
  }

  @Get('with-telegram')
  getUsersWithTelegram() {
    return this.userService.getUsersWithTelegram();
  }

  @Get(':steamId')
  findOne(@Param('steamId') steamId: string) {
    return this.userService.findOne(steamId);
  }

  @Patch(':steamId')
  update(
    @Param('steamId') steamId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(steamId, updateUserDto);
  }

  @Delete(':steamId')
  remove(@Param('steamId') steamId: string) {
    return this.userService.remove(steamId);
  }

  // Steam specific endpoints
  @Post('steam/login')
  async steamLogin(@Body() steamData: any) {
    console.log('🔐 Steam login request:', steamData);
    const user = await this.userService.createOrUpdateSteamUser(steamData);
    console.log('✅ User created/updated:', user.personaname);
    return user;
  }

  @Post(':steamId/token')
  async updateToken(
    @Param('steamId') steamId: string,
    @Body() body: { token: string },
  ) {
    console.log('🔑 Updating token for Steam ID:', steamId);
    const user = await this.userService.updateSteamToken(steamId, body.token);
    console.log('✅ Token updated for user:', user.personaname);
    return { success: true, message: 'Token updated successfully' };
  }

  @Post(':steamId/phone')
  async updatePhone(
    @Param('steamId') steamId: string,
    @Body() body: { phone: string },
  ) {
    console.log('📱 Updating phone for Steam ID:', steamId);
    const user = await this.userService.updatePhone(steamId, body.phone);
    console.log('✅ Phone updated for user:', user.personaname);
    return { success: true, message: 'Phone updated successfully' };
  }

  @Post(':steamId/telegram')
  async updateTelegram(
    @Param('steamId') steamId: string,
    @Body() body: { telegramId: string },
  ) {
    console.log('📱 Updating Telegram ID for Steam ID:', steamId);
    const user = await this.userService.updateTelegramId(
      steamId,
      body.telegramId,
    );
    console.log('✅ Telegram ID updated for user:', user.personaname);
    return { success: true, message: 'Telegram ID updated successfully' };
  }

  @Get('phone/:phone')
  async findByPhone(@Param('phone') phone: string) {
    console.log('📱 Finding user by phone:', phone);
    const user = await this.userService.findByPhone(phone);
    return user
      ? { success: true, user }
      : { success: false, message: 'User not found' };
  }

  @Get('telegram/:telegramId')
  async findByTelegramId(@Param('telegramId') telegramId: string) {
    console.log('📱 Finding user by Telegram ID:', telegramId);
    const user = await this.userService.findByTelegramId(telegramId);
    return user
      ? { success: true, user }
      : { success: false, message: 'User not found' };
  }
}
