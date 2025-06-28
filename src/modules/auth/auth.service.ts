import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async validateSteamUser(steamId: string, profile: any): Promise<any> {
    console.log('🔍 Validating Steam user:', steamId);

    try {
      // Fetch detailed user data from Steam API
      const steamApiKey = process.env.STEAM_API_KEY;
      if (!steamApiKey) {
        console.warn('⚠️ Steam API key not configured');
        return this.userService.createOrUpdateSteamUser(profile);
      }

      const response = await axios.get(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamId}`,
      );

      if (
        response.data.response &&
        response.data.response.players &&
        response.data.response.players.length > 0
      ) {
        const steamUserData = response.data.response.players[0];
        console.log('✅ Steam user data fetched:', steamUserData.personaname);

        // Create or update user in database
        const user =
          await this.userService.createOrUpdateSteamUser(steamUserData);

        // Generate session token
        const sessionToken = this.generateSessionToken(steamId);
        await this.userService.updateSteamToken(steamId, sessionToken);

        return {
          user,
          sessionToken,
          message: 'Steam authentication successful',
        };
      } else {
        throw new UnauthorizedException('Failed to fetch Steam user data');
      }
    } catch (error) {
      console.error('❌ Error validating Steam user:', error);
      throw new UnauthorizedException('Steam authentication failed');
    }
  }

  async validateSessionToken(
    steamId: string,
    sessionToken: string,
  ): Promise<any> {
    console.log('🔐 Validating session token for Steam ID:', steamId);

    try {
      const user = await this.userService.findOne(steamId);

      if (user.steam_token !== sessionToken) {
        throw new UnauthorizedException('Invalid session token');
      }

      // Check if token is expired
      if (user.token_expires_at && new Date() > user.token_expires_at) {
        throw new UnauthorizedException('Session token expired');
      }

      console.log('✅ Session token validated for user:', user.personaname);
      return user;
    } catch (error) {
      console.error('❌ Session token validation failed:', error);
      throw new UnauthorizedException('Invalid session token');
    }
  }

  async logout(steamId: string): Promise<any> {
    console.log('🚪 Logging out user with Steam ID:', steamId);

    try {
      // Clear the steam token
      await this.userService.updateSteamToken(steamId, '');
      console.log('✅ User logged out successfully');

      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw new UnauthorizedException('Logout failed');
    }
  }

  private generateSessionToken(steamId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return btoa(`${steamId}:${timestamp}:${random}`);
  }
}
