import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/user.schema';
import { Bot, Context } from 'grammy';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BotService implements OnModuleInit {
  private readonly bot: Bot;
  private readonly logger = new Logger(BotService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {
    const botToken = this.configService.get<string>('BOT_TOKEN');
    if (!botToken) {
      throw new Error('BOT_TOKEN is not defined in the environment variables.');
    }
    this.bot = new Bot(botToken);
  }

  onModuleInit() {
    this.logger.log('Initializing bot...');
    this.registerCommands();
    this.bot.start({
      onStart: () => this.logger.log('Bot has started successfully.'),
    });
  }

  private registerCommands() {
    this.bot.command('start', (ctx) => this.handleStartCommand(ctx));
    this.bot.on('message:contact', (ctx) => this.handleContact(ctx));
  }

  async handleStartCommand(ctx: Context) {
    try {
      const chatId = ctx.chat?.id;
      if (!chatId) return;

      this.logger.log(`Processing /start command for chat ID: ${chatId}`);

      let user = await this.userModel.findOne({
        telegram_id: chatId.toString(),
      });

      if (!user) {
        this.logger.log(
          `User not found. Creating new user for chat ID: ${chatId}`,
        );
        user = new this.userModel({ telegram_id: chatId.toString() });
        await user.save();
      }

      if (!user.phone) {
        this.logger.log(
          `User ${chatId} does not have a phone number. Requesting contact.`,
        );
        await ctx.reply('Iltimos, telefon raqamingizni yuboring', {
          reply_markup: {
            keyboard: [
              [{ text: '📱 Telefon raqamni yuborish', request_contact: true }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        });
      } else {
        this.logger.log(
          `User ${chatId} already has a phone number. Sending web app link.`,
        );
        await this.sendWebAppUrl(ctx);
      }
    } catch (error) {
      this.logger.error('Error in handleStartCommand:', error);
    }
  }

  async handleContact(ctx: Context) {
    try {
      const chatId = ctx.chat?.id;
      const contact = ctx.message?.contact;
      if (!chatId || !contact) return;

      this.logger.log(`Received contact from chat ID: ${chatId}`);

      const user = await this.userModel.findOne({
        telegram_id: chatId.toString(),
      });
      if (user) {
        user.phone = contact.phone_number;
        await user.save();
        this.logger.log(`Saved phone number for user ${chatId}.`);
        await ctx.reply('Rahmat! Raqamingiz qabul qilindi.', {
          reply_markup: { remove_keyboard: true },
        });
        await this.sendWebAppUrl(ctx);
      } else {
        this.logger.warn(
          `Received contact from an unknown user with chat ID: ${chatId}`,
        );
      }
    } catch (error) {
      this.logger.error('Error in handleContact:', error);
    }
  }

  private async sendWebAppUrl(ctx: Context) {
    const webAppUrl = this.configService.get<string>('CLIENT_URL');
    if (webAppUrl) {
      await ctx.reply("Ilovaga o'tishingiz mumkin:", {
        reply_markup: {
          inline_keyboard: [
            [{ text: '➡️ Ilovaga kirish', web_app: { url: webAppUrl } }],
          ],
        },
      });
    } else {
      this.logger.warn('WEB_APP_URL is not defined. Cannot send web app link.');
    }
  }

  // This method can be called from a controller for API-driven actions
  async triggerStartCommand(telegramId: string) {
    let user = await this.userModel.findOne({ telegram_id: telegramId });

    if (!user) {
      user = new this.userModel({ telegram_id: telegramId });
      await user.save();
    }

    return {
      message: 'User processed.',
      userId: user._id,
      requiresPhone: !user.phone,
    };
  }
}
