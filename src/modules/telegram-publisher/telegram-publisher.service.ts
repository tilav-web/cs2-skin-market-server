import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Skin } from '../skin/skin.schema';
import { Bot } from 'grammy'; // Bot ni import qilish
import { ConfigService } from '@nestjs/config'; // ConfigService ni import qilish

export interface PublishSkinJobData {
  skinId: string;
  chatId: string; // Telegram kanal IDsi
  caption: string; // Post matni
  photoUrl: string; // Skin rasmi URLsi
}

export interface UpdateSkinStatusJobData {
  skinId: string;
  messageId: string;
  chatId: string;
}

export interface DeleteSkinJobData {
  messageId: string;
  chatId: string;
}

@Injectable()
export class TelegramPublisherService {
  private readonly bot: Bot; // Bot instansini qo'shish

  constructor(
    @InjectQueue('telegram-publisher') private readonly telegramQueue: Queue,
    private configService: ConfigService, // ConfigService ni inject qilish
  ) {
    const botToken = this.configService.get<string>('BOT_TOKEN');
    if (!botToken) {
      throw new Error('BOT_TOKEN is not defined in the configuration.');
    }
    this.bot = new Bot(botToken);
  }

  async addPublishSkinJob(skin: Skin, delay: number) {
    const jobData: PublishSkinJobData = {
      skinId: skin._id.toString(),
      chatId: process.env.TELEGRAM_CHANNEL_ID || '', // .env dan oling
      caption: `Yangi skin sotuvda: ${skin.market_hash_name} - ${skin.price} tilav`, // Misol matn
      photoUrl: skin.icon_url,
    };
    await this.telegramQueue.add('publish-skin', jobData, {
      delay: delay, // Millisekundlarda
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async addUpdateSkinStatusJob(skin: Skin) {
    const jobData: UpdateSkinStatusJobData = {
      skinId: skin._id.toString(),
      messageId: skin.message_id,
      chatId: process.env.TELEGRAM_CHANNEL_ID || '',
    };
    await this.telegramQueue.add('update-skin-status', jobData, {
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async addDeleteSkinJob(messageId: string, chatId: string, delay: number) {
    const jobData: DeleteSkinJobData = {
      messageId: messageId,
      chatId: chatId,
    };
    await this.telegramQueue.add('delete-skin', jobData, {
      delay: delay,
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async sendSkinListingToUser(telegramId: string, skin: Skin, publishAt: Date) {
    const formattedPublishAt = publishAt
      ? publishAt.toLocaleString('uz-UZ')
      : 'Darhol';
    const message = `Sizning skin ${skin.market_hash_name} sotuvga qo'yildi!\n\nNarxi: ${skin.price} tilav\nTavsif: ${skin.description || "Yo'q"}\nTelegram kanaliga joylash vaqti: ${formattedPublishAt}\n\nSizning skiningizni kuzatib boring!`;

    try {
      await this.bot.api.sendMessage(telegramId, message);
    } catch (error) {
      console.error(
        `Foydalanuvchiga xabar yuborishda xatolik ${telegramId}: ${error.message}`,
      );
    }
  }
}
