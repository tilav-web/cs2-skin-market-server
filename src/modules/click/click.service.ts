import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClickError, ClickAction, TransactionState } from './click.constants';
import clickCheckToken from '../../utils/click-check';
import {
  Transaction,
  TransactionDocument,
  TransactionType,
} from '../transaction/transaction.schema';
import { User, UserDocument } from '../user/user.schema';
import { UserService } from '../user/user.service'; // UserService ni import qilamiz

@Injectable()
export class ClickService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly userService: UserService, // UserService ni inject qilamiz
  ) {}

  async prepare(data: any) {
    const {
      click_trans_id,
      service_id,
      merchant_trans_id,
      amount,
      action,
      sign_time,
      sign_string,
    } = data;

    const telegramId = merchant_trans_id;

    const signatureData = {
      click_trans_id,
      service_id,
      orderId: telegramId,
      amount,
      action,
      sign_time,
    };

    const checkSignature = clickCheckToken(signatureData, sign_string);
    if (!checkSignature) {
      return { error: ClickError.SignFailed, error_note: 'Invalid sign' };
    }

    if (parseInt(action) !== ClickAction.Prepare) {
      return {
        error: ClickError.ActionNotFound,
        error_note: 'Action not found',
      };
    }

    const user = await this.userService.findByTelegramId(telegramId);
    if (!user) {
      return { error: ClickError.UserNotFound, error_note: 'User not found' };
    }

    const existingTransaction = await this.transactionModel.findOne({
      id: click_trans_id,
      provider: 'click',
      user: user._id,
    });
    if (
      existingTransaction &&
      [TransactionState.Pending, TransactionState.Paid].includes(
        existingTransaction.state,
      )
    ) {
      return {
        error: ClickError.AlreadyPaid,
        error_note:
          'Transaction with this click_trans_id already exists and is not canceled',
      };
    }

    const time = new Date().getTime();

    const newTransaction = await this.transactionModel.create({
      id: click_trans_id,
      user: user._id,
      amount: amount, // Keep as string
      state: TransactionState.Pending,
      create_time: time,
      prepare_id: time,
      provider: 'click',
      type: TransactionType.DEPOSIT,
    });

    return {
      click_trans_id,
      merchant_trans_id: telegramId,
      merchant_prepare_id: newTransaction._id.toString(), // Use transaction _id as merchant_prepare_id
      error: ClickError.Success,
      error_note: 'Success',
    };
  }

  async complete(data: any) {
    const session = await this.transactionModel.db.startSession();
    session.startTransaction();
    try {
      const {
        click_trans_id,
        service_id,
        merchant_trans_id,
        merchant_prepare_id,
        amount,
        action,
        sign_time,
        sign_string,
        error,
      } = data;

      const telegramId = merchant_trans_id;

      const order = await this.transactionModel
        .findOne({
          id: click_trans_id,
          provider: 'click',
        })
        .session(session);

      if (!order || order.type !== TransactionType.DEPOSIT) {
        await session.abortTransaction();
        return {
          error: ClickError.TransactionNotFound,
          error_note: 'Transaction not found or invalid type',
        };
      }

      const user = await this.userModel.findById(order.user).session(session);
      if (!user) {
        await session.abortTransaction();
        return { error: ClickError.UserNotFound, error_note: 'User not found' };
      }

      // Keep amount as string for signature verification
      const signatureData = {
        click_trans_id,
        service_id,
        orderId: telegramId,
        merchant_prepare_id,
        amount: amount.toString(), // Ensure amount is a string for clickCheckToken
        action,
        sign_time,
      };

      if (!clickCheckToken(signatureData, sign_string)) {
        await session.abortTransaction();
        return { error: ClickError.SignFailed, error_note: 'Invalid sign' };
      }

      if (parseInt(action) !== ClickAction.Complete) {
        await session.abortTransaction();
        return {
          error: ClickError.ActionNotFound,
          error_note: 'Action not found',
        };
      }

      // Check merchant_prepare_id against transaction _id
      if (order._id.toString() !== merchant_prepare_id) {
        await session.abortTransaction();
        return {
          error: ClickError.TransactionNotFound,
          error_note: 'Transaction not found or not prepared',
        };
      }

      if (order.state === TransactionState.Paid) {
        return {
          error: ClickError.AlreadyPaid,
          error_note: 'Transaction already paid',
        };
      }

      // Compare amounts
      if (amount !== order.amount) {
        await session.abortTransaction();
        return {
          error: ClickError.InvalidAmount,
          error_note: 'Incorrect parameter amount',
        };
      }

      const time = new Date().getTime();

      if (error < 0) {
        order.state = TransactionState.PendingCanceled;
        order.cancel_time = time;
        await order.save({ session });

        await session.commitTransaction();
        return {
          click_trans_id,
          merchant_trans_id: telegramId,
          merchant_confirm_id: time,
          error: ClickError.TransactionCanceled,
          error_note: 'Transaction canceled',
        };
      }

      user.balance = (user.balance || 0) + parseFloat(amount);
      await user.save({ session });

      order.state = TransactionState.Paid;
      order.perform_time = time;
      await order.save({ session });

      await session.commitTransaction();
      return {
        click_trans_id,
        merchant_trans_id: telegramId,
        merchant_confirm_id: time,
        error: ClickError.Success,
        error_note: 'Success',
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
