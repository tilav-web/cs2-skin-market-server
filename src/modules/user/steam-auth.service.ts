import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { User, UserDocument } from './user.schema';

@Injectable()
export class SteamAuthService {
  constructor(
    @InjectModel(User.name) private model: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async initiateSteamAuth(telegram_id: string, return_url: string) {
    try {
      // Check if user exists
      const user = await this.model.findOne({ telegram_id });
      if (!user) {
        throw new NotFoundException('Foydalanuvchi topilmadi!');
      }

      // Create Steam OpenID authentication URL
      const steamAuthUrl = this.createSteamAuthUrl(return_url, telegram_id);

      return {
        auth_url: steamAuthUrl,
        telegram_id: telegram_id,
      };
    } catch (error) {
      throw error;
    }
  }

  async handleSteamCallback(query: any) {
    try {
      const {
        'openid.claimed_id': claimedId,
        'openid.identity': identity,
        'openid.mode': mode,
        telegram_id,
      } = query;

      if (mode !== 'id_res') {
        throw new BadRequestException('Steam authentication failed');
      }

      // Verify Steam OpenID response
      const isValid = await this.verifySteamOpenID(query);
      if (!isValid) {
        throw new BadRequestException(
          'Steam authentication verification failed',
        );
      }

      // Extract Steam ID from the identity URL
      const steamId = this.extractSteamId(identity);
      if (!steamId) {
        throw new BadRequestException('Invalid Steam ID');
      }

      // Get Steam user info
      const steamUserInfo = await this.getSteamUserInfo(steamId);
      if (!steamUserInfo) {
        throw new BadRequestException('Steam user info not found');
      }

      // Update user in database
      const user = await this.model.findOne({ telegram_id });
      if (!user) {
        throw new NotFoundException('Foydalanuvchi topilmadi!');
      }

      user.steam_id = steamId;
      user.personaname = steamUserInfo.personaname;
      user.steam_token = this.generateSteamToken();
      user.token_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await user.save();

      // Generate JWT token
      const payload = {
        telegram_id: user.telegram_id,
        steam_id: user.steam_id,
        sub: user._id,
      };

      const token = this.jwtService.sign(payload, {
        expiresIn: '7d',
      });

      return {
        user,
        token,
        steam_user_info: steamUserInfo,
      };
    } catch (error) {
      throw error;
    }
  }

  private createSteamAuthUrl(returnUrl: string, telegram_id: string): string {
    const steamOpenIdUrl = 'https://steamcommunity.com/openid/login';
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': `${returnUrl}?telegram_id=${telegram_id}`,
      'openid.realm': returnUrl.split('?')[0],
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });

    return `${steamOpenIdUrl}?${params.toString()}`;
  }

  private async verifySteamOpenID(query: any): Promise<boolean> {
    try {
      // Add verification parameters
      const verificationParams = {
        ...query,
        'openid.mode': 'check_authentication',
      };

      const response = await axios.post(
        'https://steamcommunity.com/openid/login',
        verificationParams,
      );
      return response.data.includes('is_valid:true');
    } catch (error) {
      return false;
    }
  }

  private extractSteamId(identity: string): string | null {
    const match = identity.match(/\/id\/([^\/]+)/);
    if (match) {
      return match[1];
    }

    // Try to extract from Steam ID format
    const steamIdMatch = identity.match(/\/profiles\/(\d+)/);
    if (steamIdMatch) {
      return steamIdMatch[1];
    }

    return null;
  }

  private async getSteamUserInfo(steamId: string) {
    try {
      const steamApiKey = process.env.STEAM_API_KEY;
      if (!steamApiKey) {
        throw new Error('STEAM_API_KEY not configured');
      }

      const response = await axios.get(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamId}`,
      );

      const players = response.data.response.players;
      if (players && players.length > 0) {
        return players[0];
      }

      return null;
    } catch (error) {
      console.error('Error fetching Steam user info:', error);
      return null;
    }
  }

  private generateSteamToken(): string {
    return `steam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
