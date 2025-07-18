import {
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { botToken } from 'src/utils/shared';
import { createHmac } from 'crypto';
import axios from 'axios';
import { Skin, SkinDocument } from '../skin/skin.schema';
import { ReferralService } from '../referral/referral.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) public model: Model<UserDocument>,
    @InjectModel(Skin.name) private skinModel: Model<SkinDocument>,
    @Inject(forwardRef(() => ReferralService))
    private readonly referralService: ReferralService,
  ) {}

  validateInitData(
    initData: string,
  ): { telegramId: string; startParam?: string } | null {
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
      const startParam = params.get('start_param');
      return { telegramId: userData.id, startParam };
    }
    return null;
  }

  async linkTelegramToSteam(
    telegramId: string,
    steamId: string,
    profile: any,
    startParam?: string,
  ): Promise<User> {
    let user = await this.model.findOne({ telegram_id: telegramId });

    if (!user) {
      // New user creation
      user = new this.model({
        telegram_id: telegramId,
        steam_id: steamId,
        personaname: profile.displayName || null,
        photo: profile.photos?.[2]?.value || null,
        status: 'active',
        balance: 0,
      });

      await user.save(); // Save the user first to get _id

      if (startParam) {
        // Handle referral after user is saved
        await this.referralService.handleReferral(startParam, telegramId);
      }
    } else {
      // Existing user update
      user.steam_id = steamId;
      user.personaname = profile.displayName || user.personaname;
      user.photo = profile.photos?.[2]?.value || user.photo;
      await user.save();
    }

    return user;
  }

  async findByTelegramId(telegram_id: string) {
    const user = await this.model.findOne({ telegram_id }).lean().exec();
    return user;
  }

  async findById(id: string): Promise<UserDocument> {
    return this.model.findById(id).exec();
  }

  async getUserSkins({
    telegram_id,
    refreshFromSteam = false,
  }: {
    telegram_id: string;
    refreshFromSteam?: boolean;
  }) {
    const user = await this.model.findOne({ telegram_id });
    if (!user || !user.steam_id) {
      throw new UnauthorizedException('Foydalanuvchi yoki Steam ID topilmadi');
    }

    let skins = await this.skinModel.find({ user: user._id });

    // Agar refreshFromSteam true bo'lsa yoki bazada skinlar bo'lmasa, Steam'dan yangilaymiz
    if (refreshFromSteam || skins.length === 0) {
      const url = `https://steamcommunity.com/inventory/${user.steam_id}/730/2`;
      try {
        const res = await axios.get(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Accept: 'application/json',
          },
        });
        if (!res.data || !res.data.assets || !res.data.descriptions) {
          throw new UnauthorizedException(
            "Inventar yopiq yoki ma'lumot topilmadi",
          );
        }
        const items = res.data.assets.map((asset: any) => {
          const description = res.data.descriptions.find(
            (desc: any) =>
              desc.classid === asset.classid &&
              desc.instanceid === asset.instanceid,
          );
          return {
            assetid: asset.assetid,
            classid: asset.classid,
            instanceid: asset.instanceid,
            market_hash_name:
              description?.market_hash_name ||
              description?.market_name ||
              description?.name ||
              '',
            icon_url: description?.icon_url
              ? `https://steamcommunity-a.akamaihd.net/economy/image/${description.icon_url}`
              : '',
            tradable: description?.tradable === 1,
            price: 0,
            user: user._id,
          };
        });

        // Bazadagi mavjud skinlarni topish
        const existingSkinAssetIds = new Set(skins.map((s) => s.assetid));

        // Yangi skinlarni aniqlash va bazaga qo'shish
        const newSkins = items.filter(
          (skin) => !existingSkinAssetIds.has(skin.assetid),
        );

        if (newSkins.length > 0) {
          await this.skinModel.insertMany(newSkins);
        }

        // Barcha skinlarni qayta yuklash (yangi qo'shilganlari bilan birga)
        skins = await this.skinModel.find({ user: user._id });
      } catch (error) {
        console.error(error.message);
        throw new UnauthorizedException(
          "Inventarni olishda xatolik: Profil yopiq bo'lishi mumkin",
        );
      }
    }

    return skins;
  }

  async updateBalance(userId: string, amount: number): Promise<void> {
    await this.model.updateOne({ _id: userId }, { $inc: { balance: amount } });
  }

  async updateCashback(userId: Types.ObjectId, amount: number): Promise<void> {
    await this.model.updateOne({ _id: userId }, { $inc: { cashback: amount } });
  }

  async updateTradeUrl(
    userId: Types.ObjectId,
    tradeUrl: string,
  ): Promise<UserDocument> {
    const user = await this.model
      .findByIdAndUpdate(
        userId,
        { trade_url: { value: tradeUrl, status: true } },
        { new: true },
      )
      .exec();
    if (!user) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }
    return user;
  }

  async updateUserStatus(telegramId: string, status: string): Promise<void> {
    await this.model.updateOne({ telegram_id: telegramId }, { status });
  }
}
