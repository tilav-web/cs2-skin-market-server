import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './user.schema';
import { SteamLoginDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private model: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async auth(steamLoginDto: SteamLoginDto) {
    try {
      const {
        telegram_id,
        steam_id,
        steam_token,
        personaname,
        token_expires_at,
      } = steamLoginDto;

      // Validate required fields
      if (
        !steam_id ||
        !steam_token ||
        !personaname ||
        !token_expires_at ||
        !telegram_id
      ) {
        throw new BadRequestException(
          'Tizimga kirish uchun malumot yetarli emas!',
        );
      }

      // Find user by telegram_id
      const user = await this.model.findOne({ telegram_id });
      if (!user) {
        throw new NotFoundException('Foydalanuvchi topilmadi!');
      }

      // Update user's Steam information
      user.steam_id = steam_id;
      user.steam_token = steam_token;
      user.personaname = personaname;
      user.token_expires_at = token_expires_at;
      await user.save();

      // Generate JWT token
      const payload = {
        telegram_id: user.telegram_id,
        steam_id: user.steam_id,
        sub: user._id,
      };

      const token = this.jwtService.sign(payload, {
        expiresIn: '7d', // Token expires in 7 days
      });

      return {
        user,
        token,
      };
    } catch (error) {
      throw error;
    }
  }
}
