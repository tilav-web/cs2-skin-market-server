import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { botToken } from 'src/utils/shared';
import { createHmac } from 'crypto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) public model: Model<UserDocument>) {}

  validateInitData(initData: string): string | null {
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const params = new URLSearchParams(initData);
    const receivedHash = params.get('hash');
    params.delete('hash');
    const dataCheckString = Array.from(params.entries())
      .sort()
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const computedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash === receivedHash) {
      const userData = JSON.parse(params.get('user') || '{}');
      return userData.id; // telegram_id
    }
    return null;
  }

  async linkTelegramToSteam(
    telegramId: string,
    steamId: string,
    profile: any,
  ): Promise<User> {
    let user = await this.model.findOne({ telegram_id: telegramId });

    if (!user) {
      user = new this.model({
        telegram_id: telegramId,
        steam_id: steamId,
        personaname: profile.displayName || null,
        photo: profile.photos?.[2]?.value || null,
        status: 'active',
        balance: 0,
      });
    } else {
      user.steam_id = steamId;
      user.personaname = profile.displayName || user.personaname;
      user.photo = profile.photos?.[2]?.value || user.photo;
    }

    return user.save();
  }

  async findByTelegramId(telegram_id: string) {
    const user = await this.model
      .findOne({ telegram_id })
      .select('_id phone photo telegram_id balance personaname steam_id');
    return user;
  }
}
