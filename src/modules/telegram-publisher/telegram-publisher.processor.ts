import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import {
  PublishSkinJobData,
  UpdateSkinStatusJobData,
  CancelSaleJobData,
} from './telegram-publisher.service';
import { Bot } from 'grammy';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Skin, SkinDocument } from '../skin/skin.schema';

@Processor('telegram-publisher')
export class TelegramPublisherProcessor extends WorkerHost {
  private readonly logger = new Logger(TelegramPublisherProcessor.name);
  private readonly bot: Bot;
  private readonly telegramBotUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectModel(Skin.name) private skinModel: Model<SkinDocument>,
  ) {
    super();
    const botToken = this.configService.get<string>('BOT_TOKEN');
    if (!botToken) {
      throw new Error('BOT_TOKEN is not defined in the configuration.');
    }
    this.bot = new Bot(botToken);
    this.telegramBotUrl = this.configService.get<string>('TELEGRAM_BOT_URL'); // TELEGRAM_BOT_URL ga o'zgartirildi
    if (!this.telegramBotUrl) {
      this.logger.error(
        'TELEGRAM_BOT_URL is not defined in the configuration.',
      );
      throw new Error('TELEGRAM_BOT_URL is not defined in the configuration.');
    }
  }

  async process(
    job: Job<PublishSkinJobData | UpdateSkinStatusJobData>,
  ): Promise<any> {
    this.logger.log(`Processing job ${job.name} with ID ${job.id}`);
    console.log(`[DEBUG] Processor job data:`, job.data);

    if (job.name === 'publish-skin') {
      const data = job.data as PublishSkinJobData;
      try {
        const skin = await this.skinModel.findById(data.skinId);
        if (!skin) {
          this.logger.warn(
            `Skin with ID ${data.skinId} not found for publishing.`,
          );
          return;
        }

        const message = await this.bot.api.sendPhoto(
          data.chatId,
          data.photoUrl,
          {
            caption: data.caption,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text:
                      skin.price === 0
                        ? 'TEKINGA OLING😊'
                        : `${skin.price} so'm`,
                    url: `${this.telegramBotUrl}/WebApp=?startapp=skins_buy_${data.skinId}`,
                  },
                ],
              ],
            },
          },
        );
        // message_id ni skin modeliga saqlash
        await this.skinModel.findByIdAndUpdate(data.skinId, {
          message_id: message.message_id.toString(),
        });

        this.logger.log(
          `Skin ${data.skinId} published to Telegram. Message ID: ${message.message_id} saved.`,
        );
        return message.message_id;
      } catch (error) {
        this.logger.error(
          `Failed to publish skin ${data.skinId}: ${error.message}`,
        );
        throw error; // BullMQ qayta urinishi uchun xatolikni qaytarish
      }
    } else if (job.name === 'update-skin-status') {
      const data = job.data as UpdateSkinStatusJobData;
      try {
        const skin = await this.skinModel
          .findById(data.skinId)
          .populate('user');
        if (!skin) {
          this.logger.warn(
            `Skin with ID ${data.skinId} not found for updating.`,
          );
          return;
        }

        let newCaption = '';
        if (skin.status === 'sold') {
          newCaption = `✅ SOTILDI ✅\n\n<s>${skin.market_hash_name} - ${skin.price} tilav</s>`;
        } else {
          // Boshqa statuslar uchun ham matnni o'zgartirish mumkin
          // Hozircha faqat 'sold' holati uchun o'zgartiramiz
          newCaption = `Yangi skin sotuvda: ${skin.market_hash_name} - ${skin.price} tilav`;
        }

        await this.bot.api.editMessageCaption(
          data.chatId,
          parseInt(data.messageId),
          {
            caption: newCaption,
            parse_mode: 'HTML',
          },
        );
        this.logger.log(
          `Message ${data.messageId} caption updated in Telegram.`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to update message ${data.messageId} caption: ${error.message}`,
        );
        throw error; // BullMQ qayta urinishi uchun xatolikni qaytarish
      }
    } else if (job.name === 'cancel-sale-in-telegram') {
      const data = job.data as CancelSaleJobData;
      try {
        await this.bot.api.editMessageCaption(
          data.chatId,
          parseInt(data.messageId),
          {
            caption: data.newCaption,
            parse_mode: 'HTML',
            reply_markup: data.replyMarkup,
          },
        );
        this.logger.log(
          `Sale canceled for message ${data.messageId} in Telegram.`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to cancel sale for message ${data.messageId}: ${error.message}`,
        );
        throw error;
      }
    } else if (job.name === 'delete-skin') {
      const data = job.data as UpdateSkinStatusJobData; // Bu yerda DeleteSkinJobData bo'lishi kerak, lekin hozircha Update bilan ishlatamiz
      try {
        await this.bot.api.deleteMessage(data.chatId, parseInt(data.messageId));
        this.logger.log(`Message ${data.messageId} deleted from Telegram.`);
      } catch (error) {
        this.logger.error(
          `Failed to delete message ${data.messageId}: ${error.message}`,
        );
        throw error; // BullMQ qayta urinishi uchun xatolikni qaytarish
      }
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} of type ${job.name} completed.`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(
      `Job ${job.id} of type ${job.name} failed: ${err.message}`,
    );
  }
}
