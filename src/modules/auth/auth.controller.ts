import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('steam/login')
  async steamLogin(@Body() body: { steamId: string; profile: any }) {
    console.log('🔐 Steam login request for Steam ID:', body.steamId);
    return this.authService.validateSteamUser(body.steamId, body.profile);
  }

  @Post('steam/logout')
  async steamLogout(@Body() body: { steamId: string }) {
    console.log('🚪 Steam logout request for Steam ID:', body.steamId);
    return this.authService.logout(body.steamId);
  }

  @Get('session/validate')
  async validateSession(
    @Headers('steam-id') steamId: string,
    @Headers('session-token') sessionToken: string,
  ) {
    if (!steamId || !sessionToken) {
      throw new UnauthorizedException('Steam ID and session token required');
    }

    console.log('🔐 Session validation request for Steam ID:', steamId);
    return this.authService.validateSessionToken(steamId, sessionToken);
  }

  @Post('steam/:steamId/token')
  async updateSteamToken(@Param('steamId') steamId: string) {
    console.log('🔑 Steam token update request for Steam ID:', steamId);
    // This would typically be handled by the user service
    return { success: true, message: 'Token update endpoint' };
  }
}
