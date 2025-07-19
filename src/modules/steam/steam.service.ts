import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import SteamCommunity from 'steamcommunity';
import TradeOfferManager from 'steam-tradeoffer-manager';

@Injectable()
export class SteamService {
  private readonly logger = new Logger(SteamService.name);
  private readonly steamApiKey: string;
  private readonly community: SteamCommunity;
  private readonly manager: TradeOfferManager;

  constructor(private configService: ConfigService) {
    this.steamApiKey = this.configService.get<string>('STEAM_API_KEY');
    if (!this.steamApiKey) {
      this.logger.error('STEAM_API_KEY is not defined in the configuration.');
      throw new Error('STEAM_API_KEY is not defined in the configuration.');
    }

    this.community = new SteamCommunity();
    this.manager = new TradeOfferManager({
      steam: this.community,
      language: 'en',
      pollInterval: 5000, // Har 5 soniyada trade offerlarni tekshirish
      apiKey: this.steamApiKey,
    });

    // Bot akkauntiga kirish (login)
    const steamBotAccountName = this.configService.get<string>(
      'STEAM_BOT_ACCOUNT_NAME',
    );
    const steamBotPassword =
      this.configService.get<string>('STEAM_BOT_PASSWORD');

    if (!steamBotAccountName || !steamBotPassword) {
      this.logger.warn(
        'STEAM_BOT_ACCOUNT_NAME or STEAM_BOT_PASSWORD is not defined. Steam features may not work.',
      );
    } else {
      this.community.login(
        {
          accountName: steamBotAccountName,
          password: steamBotPassword,
        },
        (err) => {
          if (err) {
            this.logger.error(`Steam bot login failed: ${err.message}`);
          } else {
            this.logger.log('Steam bot logged in successfully.');
          }
        },
      );
    }

    // Trade offer manager eventlari
    this.manager.on('newOffer', (offer) => {
      this.logger.log(
        `New trade offer #${offer.id} from ${offer.partner.getSteamID64()}`,
      );
      // Bu yerda yangi trade offerlarni qabul qilish yoki rad etish logikasi bo'ladi
    });

    this.manager.on('receivedOfferChanged', (offer, oldState) => {
      this.logger.log(
        `Trade offer #${offer.id} changed from ${TradeOfferManager.ETradeOfferState[oldState]} to ${TradeOfferManager.ETradeOfferState[offer.state]}`,
      );
      // Bu yerda trade offer holati o'zgarganda bajariladigan logikalar bo'ladi
    });
  }

  async getPlayerInventory(
    steamId: string,
    appId: number = 730,
    contextId: number = 2,
  ): Promise<any> {
    try {
      const response = await axios.get(
        `https://steamcommunity.com/inventory/${steamId}/${appId}/${contextId}?l=english&count=5000`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get inventory for Steam ID ${steamId}: ${error.message}`,
      );
      throw error;
    }
  }

  async sendTradeOffer(
    partnerSteamId: string,
    tradeOfferUrl: string,
    itemsToGive: any[],
    itemsToReceive: any[],
  ): Promise<{ success: boolean; tradeofferid?: string; message?: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        const offer = this.manager.createOffer(partnerSteamId, tradeOfferUrl);

        if (itemsToGive && itemsToGive.length > 0) {
          offer.addMyItems(itemsToGive);
        }
        if (itemsToReceive && itemsToReceive.length > 0) {
          offer.addTheirItems(itemsToReceive);
        }

        offer.send((err, status) => {
          if (err) {
            this.logger.error(
              `Failed to send trade offer to ${partnerSteamId}: ${err.message}`,
            );
            return reject({ success: false, message: err.message });
          }
          this.logger.log(
            `Trade offer sent to ${partnerSteamId}. Status: ${status}`,
          );
          resolve({ success: true, tradeofferid: offer.id });
        });
      } catch (error) {
        this.logger.error(
          `Error creating trade offer to ${partnerSteamId}: ${error.message}`,
        );
        reject({ success: false, message: error.message });
      }
    });
  }

  async getTradeOfferStatus(
    tradeOfferId: string,
  ): Promise<{ status: string; state: number }> {
    return new Promise((resolve, reject) => {
      this.manager.getOffer(tradeOfferId, (err, offer) => {
        if (err) {
          this.logger.error(
            `Failed to get trade offer status for ${tradeOfferId}: ${err.message}`,
          );
          return reject({ status: 'error', state: -1 });
        }

        if (!offer) {
          return resolve({ status: 'not_found', state: -1 });
        }

        const stateName = TradeOfferManager.ETradeOfferState[offer.state];
        this.logger.log(`Trade offer ${tradeOfferId} status: ${stateName}`);
        resolve({ status: stateName, state: offer.state });
      });
    });
  }
}
