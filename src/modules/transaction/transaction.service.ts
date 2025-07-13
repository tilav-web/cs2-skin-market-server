import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async buySkin(buyerId: string, skinId: string): Promise<Transaction> {
    const buyer = await this.userModel.findById(buyerId);
    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }
    const skin = await this.skinModel.findById(skinId).populate('user');
    if (!skin) {
      throw new NotFoundException('Skin not found');
    }
    if (skin.status !== 'available') {
      throw new BadRequestException('Skin is not available for sale');
    }
    if (buyer.balance < skin.price) {
      throw new BadRequestException('Insufficient balance');
    }
    const seller = skin.user as UserDocument;
    const commissionAmount = skin.price * skin.commission_rate;
    const sellerRevenue = skin.price - commissionAmount;
    // Update balances
    buyer.balance -= skin.price;
    seller.balance += sellerRevenue;
    // Update skin
    skin.status = 'sold';
    skin.buyer = buyer;
    skin.commission_amount = commissionAmount;
    skin.seller_revenue = sellerRevenue;
    // Create transaction
    const transaction = new this.transactionModel({
      type: 'sale',
      amount: skin.price,
      skin: skin._id,
      owner: seller._id,
      receiver: buyer._id,
    });
    // Save everything in a session for atomicity (optional but recommended)
    await buyer.save();
    await seller.save();
    await skin.save();
    const savedTransaction = await transaction.save();
    // Update Telegram post
    if (skin.message_id) {
      await this.telegramPublisherService.addUpdateSkinStatusJob(skin);
    }
    return savedTransaction;
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
