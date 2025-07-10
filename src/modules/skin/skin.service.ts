import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Skin, SkinDocument } from './skin.schema';
import { CreateSkinDto } from './dto/create-skin.dto';
import { UserService } from '../user/user.service';
import { TelegramPublisherService } from '../telegram-publisher/telegram-publisher.service';

@Injectable()
export class SkinService {
  constructor(
    @InjectModel(Skin.name) private readonly skinModel: Model<SkinDocument>,
    private readonly userService: UserService,
    private readonly telegramPublisherService: TelegramPublisherService,
  ) {}

  async create(createSkinDto: CreateSkinDto, telegram_id: string) {
    const user = await this.userService.findByTelegramId(telegram_id);
    if (!user) throw new NotFoundException('User not found');

    const { price, advertising, advertising_hours, description } =
      createSkinDto;

    // 1. Komissiya va reklama narxini hisoblash
    let commission_rate = price > 0 ? 0.05 : 0;
    let advertising_cost = 0;

    if (advertising) {
      if (!advertising_hours || advertising_hours <= 0) {
        throw new BadRequestException(
          'Advertising hours must be provided and positive.',
        );
      }
      commission_rate += 0.02;
      advertising_cost = advertising_hours * 1000;

      if (user.balance < advertising_cost) {
        throw new BadRequestException('Insufficient balance for advertising.');
      }
    }

    // 2. publish_at va expires_at ni hisoblash
    let publish_at = new Date();
    let expires_at = null;

    if (advertising) {
      const lastAdvertisedSkin = await this.skinModel
        .findOne({ advertising: true, expires_at: { $ne: null } })
        .sort({ expires_at: -1 });

      if (lastAdvertisedSkin && lastAdvertisedSkin.expires_at) {
        publish_at = new Date(
          lastAdvertisedSkin.expires_at.getTime() + 2 * 60 * 1000,
        ); // 2 daqiqa qo'shamiz
      }

      expires_at = new Date(
        publish_at.getTime() + advertising_hours * 60 * 60 * 1000,
      );
    }

    // 3. Balansdan yechib olish va skinni yaratish
    if (advertising_cost > 0) {
      user.balance -= advertising_cost;
      await user.save();
    }

    const createdSkin = new this.skinModel({
      ...createSkinDto,
      user: user._id,
      description,
      commission_rate,
      advertising_cost,
      publish_at: advertising ? publish_at : null,
      expires_at: advertising ? expires_at : null,
      status: 'available',
    });

    const savedSkin = await createdSkin.save();

    // 4. Telegramga post qilish uchun vazifa qo'shish
    if (savedSkin.advertising && savedSkin.publish_at) {
      const delay = savedSkin.publish_at.getTime() - Date.now();
      await this.telegramPublisherService.addPublishSkinJob(
        savedSkin,
        delay > 0 ? delay : 0,
      );
    }

    return savedSkin;
  }

  async findAllByUser(telegram_id: string) {
    const user = await this.userService.findByTelegramId(telegram_id);
    if (!user) throw new NotFoundException('User not found');
    return this.skinModel.find({ user: user._id });
  }

  async findOneById(id: string, telegram_id: string) {
    const user = await this.userService.findByTelegramId(telegram_id);
    if (!user) throw new NotFoundException('User not found');
    const skin = await this.skinModel.findOne({ _id: id, user: user._id });
    if (!skin) throw new NotFoundException('Skin not found');
    return skin;
  }

  async update(id: string, dto: Partial<CreateSkinDto>, telegram_id: string) {
    const user = await this.userService.findByTelegramId(telegram_id);
    if (!user) throw new NotFoundException('User not found');
    const updated = await this.skinModel.findOneAndUpdate(
      {
        _id: id,
        user: user._id,
      },
      dto,
      { new: true },
    );
    if (!updated) throw new NotFoundException('Skin not found or not yours');

    // Agar skin reklama uchun belgilangan bo'lsa va publish_at/expires_at o'zgargan bo'lsa
    if (updated.advertising && updated.publish_at) {
      const delay = updated.publish_at.getTime() - Date.now();
      if (delay > 0) {
        await this.telegramPublisherService.addPublishSkinJob(updated, delay);
      } else {
        await this.telegramPublisherService.addPublishSkinJob(updated, 0);
      }
    }
    // Agar expires_at mavjud bo'lsa va message_id mavjud bo'lsa, o'chirish vazifasini qo'shish
    if (updated.advertising && updated.expires_at && updated.message_id) {
      const deleteDelay = updated.expires_at.getTime() - Date.now();
      if (deleteDelay > 0) {
        await this.telegramPublisherService.addDeleteSkinJob(
          updated.message_id,
          process.env.TELEGRAM_CHANNEL_ID || '',
          deleteDelay,
        );
      }
    }

    return updated;
  }

  async remove(id: string, telegram_id: string) {
    const user = await this.userService.findByTelegramId(telegram_id);
    if (!user) throw new NotFoundException('User not found');
    const deleted = await this.skinModel.findOneAndDelete({
      _id: id,
      user: user._id,
    });
    if (!deleted) throw new NotFoundException('Skin not found or not yours');

    // Agar skin Telegramda joylangan bo'lsa, uni o'chirish vazifasini qo'shish
    if (deleted.message_id && process.env.TELEGRAM_CHANNEL_ID) {
      await this.telegramPublisherService.addDeleteSkinJob(
        deleted.message_id,
        process.env.TELEGRAM_CHANNEL_ID,
        0,
      ); // Darhol o'chirish
    }

    return deleted;
  }

  async findAdvertisingPending(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.skinModel
        .find({ advertising: true, status: 'pending' })
        .skip(skip)
        .limit(limit),
      this.skinModel.countDocuments({ advertising: true, status: 'pending' }),
    ]);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOnePublicById(id: string) {
    const skin = await this.skinModel.findById(id);
    if (!skin) throw new NotFoundException('Skin not found');
    return skin;
  }
}
