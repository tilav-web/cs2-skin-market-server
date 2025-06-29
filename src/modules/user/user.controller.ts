import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { UserService } from './user.service';
import { SteamAuthService } from './steam-auth.service';
import { SteamLoginDto, SteamAuthDto } from './dto/create-user.dto';

@Controller('users')
export class UserController {
  constructor(
    private readonly service: UserService,
    private readonly steamAuthService: SteamAuthService,
  ) {}

  @Post('steam-login')
  async steamLogin(@Body() steamLoginDto: SteamLoginDto, @Res() res: Response) {
    try {
      const result = await this.service.auth(steamLoginDto);

      // Set JWT token as HTTP-only cookie
      res.cookie('jwt_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure in production
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      });

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Steam login muvaffaqiyatli!',
        user: result.user,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Post('steam-auth/initiate')
  async initiateSteamAuth(
    @Body() steamAuthDto: SteamAuthDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.steamAuthService.initiateSteamAuth(
        steamAuthDto.telegram_id,
        steamAuthDto.return_url,
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Steam authentication initiated',
        data: result,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get('steam-auth/callback')
  async handleSteamCallback(@Query() query: any, @Res() res: Response) {
    try {
      const result = await this.steamAuthService.handleSteamCallback(query);

      // Set JWT token as HTTP-only cookie
      res.cookie('jwt_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      });

      // Redirect to frontend with success
      const redirectUrl = new URL(
        query.return_url || process.env.FRONTEND_URL || 'http://localhost:5173',
      );
      redirectUrl.searchParams.set('auth', 'success');
      redirectUrl.searchParams.set('telegram_id', result.user.telegram_id);

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      // Redirect to frontend with error
      const redirectUrl = new URL(
        query.return_url || process.env.FRONTEND_URL || 'http://localhost:5173',
      );
      redirectUrl.searchParams.set('auth', 'error');
      redirectUrl.searchParams.set('message', error.message);

      return res.redirect(redirectUrl.toString());
    }
  }
}
