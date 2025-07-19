import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import {
  PublishSkinJobData,
  UpdateSkinStatusJobData,
  CancelSaleJobData,
  DeleteSkinJobData,
  CheckTradeOfferStatusJobData,
} from './telegram-publisher.service';
import { Bot } from 'grammy';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Skin, SkinDocument } from '../skin/skin.schema';
import { SteamService } from '../steam/steam.service';
import { Transaction, TransactionDocument } from '../transaction/transaction.schema';
import { TransactionState } from '../click/click.constants';
import { User, UserDocument } from '../user/user.schema';
import TradeOfferManager from 'steam-tradeoffer-manager';
import { InlineKeyboard } from 'grammy';

@Processor('telegram-publisher')
export class TelegramPublisherProcessor extends WorkerHost {
  private readonly logger = new Logger(TelegramPublisherProcessor.name);
  private readonly bot: Bot;
  private readonly telegramBotUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectModel(Skin.name) private skinModel: Model<SkinDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly steamService: SteamService,
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
    job: Job<
      | PublishSkinJobData
      | UpdateSkinStatusJobData
      | CancelSaleJobData
      | DeleteSkinJobData
    >,
  ): Promise<any> {
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
                    url: `${this.telegramBotUrl}?startapp=skins_buy_${data.skinId}`,
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
          newCaption = `✅ SOTILDI ✅\n\n<s>${skin.market_hash_name} - ${skin.price} tilav</s>\n\n👤 Xaridor: ${data.buyerPersonaname}`;
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
        try {
          await this.bot.api.editMessageReplyMarkup(
            data.chatId,
            parseInt(data.messageId),
            {
              reply_markup: { inline_keyboard: [] },
            },
          );
        } catch (error) {
          if (error.message && error.message.includes('message is not modified')) {
            this.logger.warn(`Message ${data.messageId} reply markup already updated or not modified.`);
          } else {
            throw error; // Boshqa xatoliklarni qayta tashlash
          }
        }
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
      const data = job.data as DeleteSkinJobData;
      try {
        await this.bot.api.deleteMessage(data.chatId, parseInt(data.messageId));
        this.logger.log(`Message ${data.messageId} deleted from Telegram.`);
      } catch (error) {
        this.logger.error(
          `Failed to delete message ${data.messageId}: ${error.message}`,
        );
        throw error; // BullMQ qayta urinishi uchun xatolikni qaytarish
      }
    } else if (job.name === 'check-trade-offer-status') {
      const data = job.data as unknown as CheckTradeOfferStatusJobData;
      try {
        const transaction = await this.transactionModel.findById(data.transactionId);
        if (!transaction) {
          this.logger.warn(`Transaction with ID ${data.transactionId} not found for trade offer status check.`);
          return;
        }

        const tradeOfferStatus = await this.steamService.getTradeOfferStatus(data.tradeOfferId);

        if (tradeOfferStatus.state === TradeOfferManager.ETradeOfferState.Accepted) {
          // Trade offer qabul qilindi
          transaction.state = TransactionState.Paid;
          await transaction.save();

          const skin = await this.skinModel.findById(transaction.skin);
          if (skin && skin.message_id) {
            // Telegramdagi skin e'lonini yangilash
            const buyer = await this.userModel.findById(transaction.receiver);
            if (buyer) {
              let newCaption = `✅ SOTILDI ✅\n\n<s>${skin.market_hash_name} - ${skin.price} tilav</s>\n\n👤 Xaridor: ${buyer.personaname}`;
              await this.bot.api.editMessageCaption(
                this.configService.get<string>('TELEGRAM_CHANNEL_ID'),
                parseInt(skin.message_id),
                {
                  caption: newCaption,
                  parse_mode: 'HTML',
                },
              );
              try {
                await this.bot.api.editMessageReplyMarkup(
                  this.configService.get<string>('TELEGRAM_CHANNEL_ID'),
                  parseInt(skin.message_id),
                  {
                    reply_markup: { inline_keyboard: [] },
                  },
                );
              } catch (error) {
                if (error.message && error.message.includes('message is not modified')) {
                  this.logger.warn(`Message ${skin.message_id} reply markup already updated or not modified.`);
                } else {
                  throw error; // Boshqa xatoliklarni qayta tashlash
                }
              }
            }
          }
          this.logger.log(`Trade offer ${data.tradeOfferId} accepted. Transaction ${data.transactionId} completed.`);
        } else if (
          tradeOfferStatus.state === TradeOfferManager.ETradeOfferState.Declined ||
          tradeOfferStatus.state === TradeOfferManager.ETradeOfferState.Canceled ||
          tradeOfferStatus.state === TradeOfferManager.ETradeOfferState.Expired ||
          tradeOfferStatus.state === TradeOfferManager.ETradeOfferState.InvalidItems
        ) {
          // Trade offer bekor qilindi yoki xato yuzaga keldi
          transaction.state = TransactionState.Failed;
          await transaction.save();

          // Balanslarni qaytarish
          const buyer = await this.userModel.findById(transaction.receiver);
          const seller = await this.userModel.findById(transaction.user);
          const skin = await this.skinModel.findById(transaction.skin);

          if (buyer) {
            buyer.balance += Number(transaction.amount); // Xaridorga pulni qaytarish
            await buyer.save();
          }
          if (seller && skin) {
            seller.balance -= skin.seller_revenue; // Sotuvchidan olingan pulni qaytarish
            await seller.save();
          }

          // Skin holatini qaytarish
          if (skin) {
            skin.status = 'available'; // Yoki boshqa mos holat
            skin.advertising = true; // Yoki false
            skin.buyer = null;
            await skin.save();

            if (skin.message_id) {
              // Telegramdagi skin e'lonini qayta tiklash yoki yangilash
              // Hozircha faqat captionni o'zgartiramiz
              let newCaption = `❌ Xarid bekor qilindi ❌\n\n${skin.market_hash_name} - ${skin.price} tilav\n\n<i>Sabab: Trade offer bekor qilindi.</i>`;
              await this.bot.api.editMessageCaption(
                this.configService.get<string>('TELEGRAM_CHANNEL_ID'),
                parseInt(skin.message_id),
                {
                  caption: newCaption,
                  parse_mode: 'HTML',
                },
              );
              // Tugmalarni qayta tiklash
              const telegramBotUrl = this.configService.get<string>('TELEGRAM_BOT_URL');
              const inlineKeyboard = new InlineKeyboard().url(
                skin.price === 0 ? 'TEKINGA OLISH😊' : `${skin.price} so'm`,
                `${telegramBotUrl}?startapp=skins_buy_${skin._id}`,
              );
              await this.bot.api.editMessageReplyMarkup(
                this.configService.get<string>('TELEGRAM_CHANNEL_ID'),
                parseInt(skin.message_id),
                {
                  reply_markup: inlineKeyboard,
                },
              );
            }
          }
          this.logger.warn(`Trade offer ${data.tradeOfferId} failed. Transaction ${data.transactionId} failed.`);
        } else {
          // Trade offer hali ham kutilmoqda, jobni qayta navbatga qo'yish
          throw new Error('Trade offer still pending, retrying...');
        }
      } catch (error) {
        this.logger.error(
          `Failed to check trade offer status for ${data.tradeOfferId}: ${error.message}`,
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
