import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SkinDocument } from '../skin/skin.schema';
import { Bot, InlineKeyboard } from 'grammy';
import { ConfigService } from '@nestjs/config';

export interface PublishSkinJobData {
  skinId: string;
  chatId: string; // Telegram kanal IDsi
  caption: string; // Post matni
  photoUrl: string; // Skin rasmi URLsi
  replyMarkup?: InlineKeyboard; // Yangi: InlineKeyboard
}

export interface UpdateSkinStatusJobData {
  skinId: string;
  messageId: string;
  chatId: string;
  buyerPersonaname: string; // Yangi maydon
}

export interface DeleteSkinJobData {
  messageId: string;
  chatId: string;
}

export interface CancelSaleJobData {
  skinId: string;
  messageId: string;
  chatId: string;
  newCaption: string;
  replyMarkup: InlineKeyboard;
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

 <i>Skinni ${isFree ? '🧨TEKINGA OLISH🧨' : 'sotib olish'} uchun pastdagi tugmadan foydalaning</i>
`;
    };

    const telegramBotUrl = this.configService.get<string>('TELEGRAM_BOT_URL'); // TELEGRAM_BOT_URL dan olamiz
    if (!telegramBotUrl) {
      throw new Error('TELEGRAM_BOT_URL is not defined in the configuration.');
    }

    const inlineKeyboard = new InlineKeyboard().url(
      skin.price === 0 ? '🧨TEKINGA OLISH🧨' : 'Skinni sotib olish',
      `${telegramBotUrl}/WebApp=?startapp=skins_buy_${skin._id}`,
    );

    const jobData: PublishSkinJobData = {
      skinId: skin._id.toString(),
      chatId: process.env.TELEGRAM_CHANNEL_ID || '',
      caption: generateSkinPostHTML(skin), // HTML formatidagi caption
      photoUrl: skin.icon_url,
      replyMarkup: inlineKeyboard,
    };
    await this.telegramQueue.add('publish-skin', jobData, {
      delay: delay,
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async addUpdateSkinStatusJob(skin: SkinDocument, buyerPersonaname: string) {
    const jobData: UpdateSkinStatusJobData = {
      skinId: skin._id.toString(),
      messageId: skin.message_id,
      chatId: process.env.TELEGRAM_CHANNEL_ID || '',
      buyerPersonaname,
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

  async addCancelSaleJob(skin: SkinDocument) {
    const newCaption = `<b>Skin sotuvdan olib tashlandi:</b>\n<b>${skin.market_hash_name}</b>\n\n<i>Bu skin endi sotuvda mavjud emas.</i>`;
    const emptyKeyboard = new InlineKeyboard();

    const jobData: CancelSaleJobData = {
      skinId: skin._id.toString(),
      messageId: skin.message_id,
      chatId: process.env.TELEGRAM_CHANNEL_ID || '',
      newCaption: newCaption,
      replyMarkup: emptyKeyboard,
    };
    await this.telegramQueue.add('cancel-sale-in-telegram', jobData, {
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async sendCancellationNoticeToUser(telegramId: string, skin: SkinDocument) {
    const message = `Sizning "<b>${skin.market_hash_name}</b>" nomli skiningiz sotuvdan olib tashlandi.

Kanalimizdagi e'lon tez orada yangilanadi va "Sotib olish" tugmasi olib tashlanadi. Xavotir olmang, skiningiz endi sotilmaydi.`;

    try {
      await this.bot.api.sendMessage(telegramId, message, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error(
        `Foydalanuvchiga bekor qilinganlik haqida xabar yuborishda xatolik ${telegramId}: ${error.message}`,
      );
    }
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
`;
    };

    const baseMessage = generateSkinPostHTML(skin);
    const telegramChannel = this.configService.get<string>('TELEGRAM_CHANNEL');

    const message = `${baseMessage}

Telegram kanaliga joylash vaqti: <b>${formattedPublishAt}</b>

<i>Sizning skiningizni kuzatib boring! @${telegramChannel}</i>`;

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
      });
      await this.bot.api.editMessageReplyMarkup(chatId, Number(messageId), {
        reply_markup: { inline_keyboard: [] },
      });
    } catch (error) {
      console.error(
        `Telegram xabarini tahrirlashda xatolik ${messageId}: ${error.message}`,
      );
    }
  }

  async sendPurchaseFailedNotificationToSeller(
    telegramId: string,
    buyerPersonaname: string,
    skinName: string,
    reason: string,
  ) {
    const message = `❗️ Xarid amalga oshmadi

Foydalanuvchi <b>${buyerPersonaname}</b> sizning "<b>${skinName}</b>" skiningizni sotib olmoqchi edi, ammo quyidagi muammo tufayli xarid bekor qilindi:

Sabab: <b>${reason}</b>

Iltimos, profilingizdagi ma'lumotlarni to'g'rilab qo'ying.`;

    try {
      await this.bot.api.sendMessage(telegramId, message, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error(
        `Sotuvchiga xatolik haqida xabar yuborishda xatolik ${telegramId}: ${error.message}`,
      );
    }
  }
}
