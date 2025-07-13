import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SkinDocument } from '../skin/skin.schema';
import { Bot } from 'grammy';
import { ConfigService } from '@nestjs/config';

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
  private readonly bot: Bot;

  constructor(
    @InjectQueue('telegram-publisher') private readonly telegramQueue: Queue,
    private configService: ConfigService,
  ) {
    const botToken = this.configService.get<string>('BOT_TOKEN');
    if (!botToken) {
      throw new Error('BOT_TOKEN is not defined in the configuration.');
    }
    this.bot = new Bot(botToken);
  }

  async addPublishSkinJob(skin: SkinDocument, delay: number) {
    console.log(
      `[DEBUG] addPublishSkinJob qabul qilindi. Skin ID: ${skin._id}, Delay: ${delay}ms`,
    );
    const generateSkinPostHTML = (skin: SkinDocument): string => {
      const isFree = skin.price === 0;
      const tradeStatus = skin.tradable
        ? '✅ Trade mumkin'
        : '❌ Trade mumkin emas';
      const skinName = skin.market_hash_name;
      const description = skin.description?.trim();

      const priceBlock = isFree
        ? ' <b>BEPUL! Faqat birinchi foydalanuvchi uchun!</b>'
        : `<b>${skin.price} so'm</b>`;

      const descriptionBlock =
        isFree && description
          ? `
<b> Tavsif (Muallifdan):</b>
<i>${description}</i>`
          : description && !isFree
            ? `
 ${description}`
            : '';

      return `
<b> Skin nomi:</b> ${skinName}
<b> Narxi:</b> ${priceBlock}
<b>♻️ Holati:</b> ${skin.status}
<b> Trade:</b> ${tradeStatus}
${descriptionBlock}

 <i>Skinni ${isFree ? 'olish' : 'sotib olish'} uchun pastdagi tugmadan foydalaning</i>
`;
    };

    const jobData: PublishSkinJobData = {
      skinId: skin._id.toString(),
      chatId: process.env.TELEGRAM_CHANNEL_ID || '',
      caption: generateSkinPostHTML(skin), // HTML formatidagi caption
      photoUrl: skin.icon_url,
    };
    await this.telegramQueue.add('publish-skin', jobData, {
      delay: delay,
      removeOnComplete: true,
      removeOnFail: false,
    });
    console.log(`[DEBUG] Job 'publish-skin' navbatga qo'shildi.`);
  }

  async addUpdateSkinStatusJob(skin: SkinDocument) {
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

  async sendSkinListingToUser(
    telegramId: string,
    skin: SkinDocument,
    publishAt: Date,
  ) {
    const formattedPublishAt = publishAt
      ? publishAt.toLocaleString('uz-UZ')
      : 'Darhol';

    const generateSkinPostHTML = (skin: SkinDocument): string => {
      const isFree = skin.price === 0;
      const tradeStatus = skin.tradable
        ? '✅ Trade mumkin'
        : '❌ Trade mumkin emas';
      const skinName = skin.market_hash_name;
      const description = skin.description?.trim();

      const priceBlock = isFree
        ? ' <b>BEPUL! Faqat birinchi foydalanuvchi uchun!</b>'
        : `<b>${skin.price} so'm</b>`;

      const descriptionBlock =
        isFree && description
          ? `
<b> Tavsif (Muallifdan):</b>
<i>${description}</i>`
          : description && !isFree
            ? `
 ${description}`
            : '';

      return `
<b> Skin nomi:</b> ${skinName}
<b> Narxi:</b> ${priceBlock}
<b>♻️ Holati:</b> ${skin.status}
<b> Trade:</b> ${tradeStatus}
${descriptionBlock}
`; // Tugma va oxirgi matnni olib tashladik
    };

    const baseMessage = generateSkinPostHTML(skin);

    const message = `${baseMessage}

Telegram kanaliga joylash vaqti: <b>${formattedPublishAt}</b>

<i>Sizning skiningizni kuzatib boring!</i>`;

    try {
      await this.bot.api.sendPhoto(telegramId, skin.icon_url, {
        caption: message,
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error(
        `Foydalanuvchiga xabar yuborishda xatolik ${telegramId}: ${error.message}`,
      );
    }
  }

  async deleteMessage(chatId: string, messageId: string) {
    try {
      await this.bot.api.deleteMessage(chatId, Number(messageId));
    } catch (error) {
      console.error(
        `Telegram xabarini o'chirishda xatolik ${messageId}: ${error.message}`,
      );
    }
  }

  async editMessageText(chatId: string, messageId: string, text: string) {
    try {
      await this.bot.api.editMessageText(chatId, Number(messageId), text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [] }, // Inline tugmalarni olib tashlash
      });
    } catch (error) {
      console.error(
        `Telegram xabarini tahrirlashda xatolik ${messageId}: ${error.message}`,
      );
    }
  }
}
