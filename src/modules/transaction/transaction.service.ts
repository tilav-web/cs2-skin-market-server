import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from './transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { User, UserDocument } from '../user/user.schema';
import { Skin, SkinDocument } from '../skin/skin.schema';
import { TelegramPublisherService } from '../telegram-publisher/telegram-publisher.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Skin.name) private skinModel: Model<SkinDocument>,
    private readonly telegramPublisherService: TelegramPublisherService,
  ) {}

  async buySkin(
    buyerTelegramId: string,
    skinId: string,
  ): Promise<TransactionDocument> {
    const session = await this.transactionModel.db.startSession();
    session.startTransaction();

    try {
      const buyer = await this.userModel
        .findOne({ telegram_id: buyerTelegramId })
        .session(session);
      if (!buyer) {
        throw new NotFoundException('Xaridor topilmadi');
      }

      const skin = await this.skinModel
        .findById(skinId)
        .populate('user')
        .session(session);
      if (!skin) {
        throw new NotFoundException('Skin topilmadi');
      }
      const seller = skin.user as unknown as UserDocument;

      // 1. Tekshiruvlar
      if (skin.status !== 'pending') {
        throw new BadRequestException('Ushbu skin sotuvda emas');
      }
      if (buyer.balance < skin.price) {
        throw new BadRequestException(
          "Balansingizda mablag' yetarli emas. Iltimos, hisobingizni to'ldiring.",
        );
      }
      if ((buyer._id as Types.ObjectId).equals(seller._id as Types.ObjectId)) {
        throw new BadRequestException(
          "O'zingizning skiningizni sotib ololmaysiz",
        );
      }

      // 2. Xaridor va sotuvchi ma'lumotlarini tekshirish
      const buyerValidation = this.validateUser(buyer);
      if (!buyerValidation.valid) {
        if (buyerValidation.field === 'trade_url') {
          buyer.trade_url.status = false;
          await buyer.save({ session });
        }
        throw new BadRequestException(
          `Xatolik (Xaridor): ${buyerValidation.message}`,
        );
      }

      const sellerValidation = this.validateUser(seller);
      if (!sellerValidation.valid) {
        if (sellerValidation.field === 'trade_url') {
          seller.trade_url.status = false;
          await seller.save({ session });
        }
        // Sotuvchiga xabar yuborish
        await this.telegramPublisherService.sendPurchaseFailedNotificationToSeller(
          seller.telegram_id,
          buyer.personaname,
          skin.market_hash_name,
          sellerValidation.message,
        );
        throw new BadRequestException(
          `Sotuvchi bilan bog'liq muammo tufayli xaridni amalga oshirib bo'lmadi.`,
        );
      }

      // 3. Muvaffaqiyatli xarid amallari
      const commissionAmount = skin.price * (skin.commission_rate || 0.05);
      const sellerRevenue = skin.price - commissionAmount;

      // Balanslarni yangilash
      buyer.balance -= skin.price;
      seller.balance += sellerRevenue;

      // Skin ma'lumotlarini yangilash
      skin.status = 'sold';
      skin.user = buyer._id as Types.ObjectId; // Egalik huquqini o'tkazish
      skin.buyer = buyer._id as Types.ObjectId;
      skin.advertising = false;
      skin.commission_amount = commissionAmount;
      skin.seller_revenue = sellerRevenue;

      // Tranzaksiya yaratish
      const transaction = new this.transactionModel({
        user: seller._id,
        receiver: buyer._id,
        amount: skin.price,
        type: 'sale',
        state: 'completed',
        skin: skin._id,
        description: `${seller.personaname} dan ${buyer.personaname} ga skin sotildi`,
      });

      await buyer.save({ session });
      await seller.save({ session });
      await skin.save({ session });
      const savedTransaction = await transaction.save({ session });

      // Telegram postini yangilash
      if (skin.message_id) {
        await this.telegramPublisherService.addUpdateSkinStatusJob(
          skin,
          buyer.personaname,
        );
      }

      await session.commitTransaction();
      return savedTransaction;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private validateUser(user: UserDocument): {
    valid: boolean;
    message?: string;
    field?: string;
  } {
    if (!user.steam_id) {
      return { valid: false, message: 'Steam akkaunt bog‘lanmagan.' };
    }
    if (!user.phone) {
      return { valid: false, message: 'Telefon raqam tasdiqlanmagan.' };
    }
    if (!user.trade_url || !user.trade_url.value) {
      return {
        valid: false,
        message: 'Trade URL manzili kiritilmagan.',
        field: 'trade_url',
      };
    }
    return { valid: true };
  }

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionDocument> {
    const createdTransaction = new this.transactionModel({
      ...createTransactionDto,
      status: 'pending',
    });
    return createdTransaction.save();
  }

  async findAll(): Promise<Transaction[]> {
    return this.transactionModel.find().exec();
  }

  async findOne(id: string): Promise<Transaction | null> {
    return this.transactionModel.findById(id).exec();
  }

  async findUserTransactions(telegramId: string): Promise<Transaction[]> {
    const user = await this.userModel.findOne({ telegram_id: telegramId });
    if (!user) {
      return [];
    }
    return this.transactionModel
      .find({ $or: [{ owner: user._id }, { receiver: user._id }] })
      .populate('owner', 'personaname')
      .populate('receiver', 'personaname')
      .populate('skin', 'market_hash_name icon_url')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<TransactionDocument> {
    // Transactionni faqat mavjud bo'lsa qaytaradi, aks holda null
    return this.transactionModel.findById(id).exec();
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'completed' | 'failed',
  ): Promise<TransactionDocument> {
    // Transaction statusini yangilaydi va yangilangan obyektni qaytaradi
    return this.transactionModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
  }

  async initiateDeposit(
    ownerId: string,
    amount: number,
  ): Promise<TransactionDocument> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    const newTransaction = new this.transactionModel({
      owner: ownerId,
      amount,
      type: 'deposit',
      status: 'pending',
    });
    return newTransaction.save();
  }
}
