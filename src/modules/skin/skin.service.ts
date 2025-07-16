import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  async listSkinForSale(
    skinId: string,
    dto: Partial<CreateSkinDto>,
    telegram_id: string,
  ) {
    const user = await this.userService.findByTelegramId(telegram_id);
    if (!user) throw new NotFoundException('User not found');

    let objectIdSkinId: Types.ObjectId;
    try {
      objectIdSkinId = new Types.ObjectId(skinId);
    } catch {
      throw new BadRequestException('Invalid Skin ID format');
    }

    let objectIdUserId: Types.ObjectId;
    try {
      objectIdUserId = new Types.ObjectId(user._id.toString());
    } catch {
      throw new BadRequestException('Invalid User ID format');
    }

    const { price, advertising, advertising_hours, description } = dto;

    const existingSkin = await this.skinModel.findOne({
      _id: objectIdSkinId,
      user: objectIdUserId,
    });
    if (!existingSkin) {
      throw new NotFoundException('Skin not found or not yours');
    }
    if (existingSkin.status === 'pending') {
      throw new BadRequestException(
        "Bu skin allaqachon sotuvga qo'yilgan va navbatda turibdi.",
      );
    }

    if (price === 0 && advertising) {
      throw new BadRequestException(
        "Narxi 0 bo'lgan skinni reklama qilish mumkin emas.",
      );
    }

    let commission_rate = price > 0 ? 0.05 : 0;
    if (advertising) {
      commission_rate += 0.02;
    }

    let advertising_cost = 0;
    let publish_at: Date | null = null;
    let expires_at: Date | null = null;

    const lastAdvertisedSkin = await this.skinModel
      .findOne({ expires_at: { $ne: null } })
      .sort({ expires_at: -1 });

    let next_publish_time = new Date(Date.now() + 2 * 60 * 1000);

    if (lastAdvertisedSkin && lastAdvertisedSkin.expires_at) {
      if (lastAdvertisedSkin.expires_at.getTime() < Date.now()) {
        next_publish_time = new Date(Date.now() + 2 * 60 * 1000);
      } else {
        next_publish_time = new Date(
          lastAdvertisedSkin.expires_at.getTime() + 2 * 60 * 1000,
        );
      }
    }

    publish_at = next_publish_time;

    if (advertising_hours && advertising_hours > 0) {
      advertising_cost = advertising_hours * 1000;
      expires_at = new Date(
        publish_at.getTime() + advertising_hours * 60 * 60 * 1000,
      );

      const currentBalance = user.balance ?? 0;
      const currentCashback = user.cashback ?? 0;

      if (currentBalance + currentCashback < advertising_cost) {
        throw new BadRequestException(
          "Reklama uchun mablag' yetarli emas (balans + cashback).",
        );
      }

      let remaining_cost = advertising_cost;
      const cashback_to_use = Math.min(currentCashback, remaining_cost);
      user.cashback = currentCashback - cashback_to_use;
      remaining_cost -= cashback_to_use;

      if (remaining_cost > 0) {
        user.balance = currentBalance - remaining_cost;
      }
      await user.save();
    } else {
      expires_at = new Date(publish_at.getTime() + 2 * 60 * 1000);
    }

    console.log('--- DEBUG: Values before findOneAndUpdate ---');
    console.log('price:', price);
    console.log('description:', description);
    console.log('advertising:', advertising);
    console.log('commission_rate:', commission_rate);
    console.log('advertising_cost:', advertising_cost);
    console.log('publish_at:', publish_at);
    console.log('expires_at:', expires_at);
    console.log('status (to be set):', 'pending');
    console.log('------------------------------------------');

    const skin = await this.skinModel.findOneAndUpdate(
      { _id: objectIdSkinId, user: objectIdUserId },
      {
        price,
        description,
        advertising,
        commission_rate,
        advertising_cost,
        publish_at,
        expires_at,
        status: 'pending',
      },
      { new: true },
    );

    if (!skin) throw new NotFoundException('Skin not found or not yours');

    if (skin.publish_at) {
      const delay = skin.publish_at.getTime() - Date.now();
      await this.telegramPublisherService.addPublishSkinJob(
        skin,
        delay > 0 ? delay : 0,
      );
    }

    await this.telegramPublisherService.sendSkinListingToUser(
      telegram_id,
      skin,
      skin.publish_at,
    );

    return skin;
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

    if (updated.advertising && updated.publish_at) {
      const delay = updated.publish_at.getTime() - Date.now();
      if (delay > 0) {
        await this.telegramPublisherService.addPublishSkinJob(updated, delay);
      } else {
        await this.telegramPublisherService.addPublishSkinJob(updated, 0);
      }
    }
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

    if (deleted.message_id && process.env.TELEGRAM_CHANNEL_ID) {
      await this.telegramPublisherService.addDeleteSkinJob(
        deleted.message_id,
        process.env.TELEGRAM_CHANNEL_ID,
        0,
      );
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

  async findAdvertisedSkins(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.skinModel
        .find({ advertising: true, status: 'available' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'personaname'),
      this.skinModel.countDocuments({ advertising: true, status: 'available' }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async cancelSale(skinId: string, telegram_id: string) {
    const user = await this.userService.findByTelegramId(telegram_id);
    if (!user) throw new NotFoundException('User not found');

    const skin = await this.skinModel.findOne({
      _id: skinId,
      user: user._id,
    });

    if (!skin) {
      throw new NotFoundException('Skin not found or not yours');
    }

    if (skin.status !== 'pending' && skin.status !== 'available') {
      throw new BadRequestException(
        'Only skins that are pending or available can be canceled.',
      );
    }

    // Agar skin kanalga joylangan bo'lsa, uni tahrirlash
    if (skin.message_id && process.env.TELEGRAM_CHANNEL_ID) {
      // 1. Postni o'zgartirish vazifasini navbatga qo'shamiz
      await this.telegramPublisherService.addCancelSaleJob(skin);

      // 2. Foydalanuvchiga xabar yuboramiz
      await this.telegramPublisherService.sendCancellationNoticeToUser(
        telegram_id,
        skin,
      );
    }

    // 3. Skin ma'lumotlarini asl holiga qaytaramiz
    skin.status = 'not_listed'; // Yoki 'available_in_inventory' kabi status
    skin.price = null;
    skin.advertising = false;
    skin.message_id = null;
    skin.publish_at = null;
    skin.expires_at = null;
    skin.description = null;
    skin.commission_rate = null;
    skin.advertising_cost = null;

    await skin.save();

    return skin;
  }
}
