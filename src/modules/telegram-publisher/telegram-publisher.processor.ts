import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PublishSkinJobData, UpdateSkinStatusJobData } from './telegram-publisher.service';
import { Bot } from 'grammy';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Skin, SkinDocument } from '../skin/skin.schema';

@Processor('telegram-publisher')
export class TelegramPublisherProcessor extends WorkerHost {
  private readonly logger = new Logger(TelegramPublisherProcessor.name);
  private readonly bot: Bot;

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
  }

  async process(job: Job<PublishSkinJobData | UpdateSkinStatusJobData>): Promise<any> {
    this.logger.log(`Processing job ${job.name} with ID ${job.id}`);

    if (job.name === 'publish-skin') {
      const data = job.data as PublishSkinJobData;
      try {
        const skin = await this.skinModel.findById(data.skinId);
        if (!skin) {
          this.logger.warn(`Skin with ID ${data.skinId} not found for publishing.`);
          return;
        }

        const message = await this.bot.api.sendPhoto(data.chatId, data.photoUrl, {
          caption: data.caption,
          parse_mode: 'HTML',
        });
        // message_id ni skin modeliga saqlash
        skin.message_id = message.message_id.toString();
        await skin.save();
        this.logger.log(`Skin ${data.skinId} published to Telegram. Message ID: ${message.message_id}`);
        return message.message_id;
      } catch (error) {
        this.logger.error(`Failed to publish skin ${data.skinId}: ${error.message}`);
        throw error; // BullMQ qayta urinishi uchun xatolikni qaytarish
      }
    } else if (job.name === 'update-skin-status') {
      const data = job.data as UpdateSkinStatusJobData;
      try {
        const skin = await this.skinModel.findById(data.skinId).populate('user');
        if (!skin) {
          this.logger.warn(`Skin with ID ${data.skinId} not found for updating.`);
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

        await this.bot.api.editMessageCaption(data.chatId, parseInt(data.messageId), {
          caption: newCaption,
          parse_mode: 'HTML',
        });
        this.logger.log(`Message ${data.messageId} caption updated in Telegram.`);
      } catch (error) {
        this.logger.error(`Failed to update message ${data.messageId} caption: ${error.message}`);
        throw error; // BullMQ qayta urinishi uchun xatolikni qaytarish
      }
    } else if (job.name === 'delete-skin') {
      const data = job.data as UpdateSkinStatusJobData; // Bu yerda DeleteSkinJobData bo'lishi kerak, lekin hozircha Update bilan ishlatamiz
      try {
        await this.bot.api.deleteMessage(data.chatId, parseInt(data.messageId));
        this.logger.log(`Message ${data.messageId} deleted from Telegram.`);
      } catch (error) {
        this.logger.error(`Failed to delete message ${data.messageId}: ${error.message}`);
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
    this.logger.error(`Job ${job.id} of type ${job.name} failed: ${err.message}`);
  }
}
