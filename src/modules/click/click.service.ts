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

@Injectable()
export class ClickService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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

    const userId = merchant_trans_id;

    const signatureData = {
      click_trans_id,
      service_id,
      orderId: String(userId),
      amount,
      action,
      sign_time,
    }; // userId ni stringga o'tkazdik

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

    const user = await this.userModel.findById(userId);
    if (!user) {
      return { error: ClickError.UserNotFound, error_note: 'User not found' };
    }

    const existingTransaction = await this.transactionModel.findOne({
      id: click_trans_id,
      provider: 'click',
    });
    if (existingTransaction) {
      if (
        existingTransaction.state === TransactionState.Pending ||
        existingTransaction.state === TransactionState.Paid
      ) {
        return {
          error: ClickError.AlreadyPaid,
          error_note:
            'Transaction with this click_trans_id already exists and is not canceled',
        };
      }
    }

    const time = new Date().getTime();

    const newTransaction = await this.transactionModel.create({
      id: click_trans_id,
      user: user._id,
      amount: parseFloat(amount),
      state: TransactionState.Pending,
      create_time: time,
      prepare_id: time,
      provider: 'click',
      type: TransactionType.DEPOSIT,
    });

    return {
      click_trans_id,
      merchant_trans_id: newTransaction._id,
      merchant_prepare_id: time,
      error: ClickError.Success,
      error_note: 'Success',
    };
  }

  async complete(data: any) {
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

    const transactionId = merchant_trans_id;

    const order = await this.transactionModel.findById(transactionId);

    if (!order) {
      return {
        error: ClickError.TransactionNotFound,
        error_note: 'Transaction not found',
      };
    }

    const userId = order.user;
    const orderId = order._id;

    const signatureData = {
      click_trans_id,
      service_id,
      orderId: orderId.toString(),
      merchant_prepare_id,
      amount,
      action,
      sign_time,
    }; // orderId ni stringga o'tkazdik

    const checkSignature = clickCheckToken(signatureData, sign_string);

    if (!checkSignature) {
      return { error: ClickError.SignFailed, error_note: 'Invalid sign' };
    }

    if (parseInt(action) !== ClickAction.Complete) {
      return {
        error: ClickError.ActionNotFound,
        error_note: 'Action not found',
      };
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      return { error: ClickError.UserNotFound, error_note: 'User not found' };
    }

    const isPrepared = await this.transactionModel.findOne({
      prepare_id: merchant_prepare_id,
      provider: 'click',
      _id: orderId,
    });
    if (!isPrepared) {
      return {
        error: ClickError.TransactionNotFound,
        error_note: 'Transaction not found or not prepared',
      };
    }

    if (isPrepared.state === TransactionState.Paid) {
      return {
        error: ClickError.AlreadyPaid,
        error_note: 'Transaction already paid',
      };
    }

    if (parseFloat(amount) !== isPrepared.amount) {
      return {
        error: ClickError.InvalidAmount,
        error_note: 'Incorrect parameter amount',
      };
    }

    const time = new Date().getTime();

    if (error < 0) {
      await this.transactionModel.findOneAndUpdate(
        { _id: orderId },
        { state: TransactionState.PendingCanceled, cancel_time: time },
      );
      return {
        click_trans_id,
        merchant_trans_id: orderId,
        merchant_confirm_id: time,
        error: ClickError.TransactionCanceled,
        error_note: 'Transaction canceled',
      };
    }

    user.balance = (user.balance || 0) + parseFloat(amount);
    await user.save();

    await this.transactionModel.findOneAndUpdate(
      { _id: orderId },
      { state: TransactionState.Paid, perform_time: time },
    );

    return {
      click_trans_id,
      merchant_trans_id: orderId,
      merchant_confirm_id: time,
      error: ClickError.Success,
      error_note: 'Success',
    };
  }
}
