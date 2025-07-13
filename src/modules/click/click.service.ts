import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { TransactionService } from '../transaction/transaction.service';
import { UserService } from '../user/user.service';
import { ClickDto, ClickAction } from './dto/click.dto';
import { TransactionType } from '../transaction/transaction.schema';
import { CLICK_ERRORS } from './click.constants';

@Injectable()
export class ClickService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async createPayment(userId: string, amount: number) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const transaction = await this.transactionService.create({
      owner: userId,
      amount,
      type: TransactionType.DEPOSIT,
    });
    const serviceId = this.configService.get('CLICK_SERVICE_ID');
    const merchantId = this.configService.get('CLICK_MERCHANT_ID');
    const transactionId = transaction._id.toString();
    const url = `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${amount}&transaction_param=${transactionId}`;
    return { payment_url: url };
  }

  private checkSign(dto: ClickDto): boolean {
    const {
      click_trans_id,
      service_id,
      sign_time,
      sign_string,
      amount,
      action,
      merchant_trans_id,
      merchant_prepare_id,
    } = dto;
    const secretKey = this.configService.get('CLICK_SECRET_KEY');
    let stringToHash = `${click_trans_id}${service_id}${secretKey}${merchant_trans_id}`;
    if (action === ClickAction.COMPLETE) {
      stringToHash += `${merchant_prepare_id}`;
    }
    stringToHash += `${amount}${action}${sign_time}`;
    const hash = crypto.createHash('md5');
    hash.update(stringToHash);
    const generatedSign = hash.digest('hex');
    return generatedSign === sign_string;
  }

  private async _validateTransaction(
    dto: ClickDto,
    transactionId: string,
  ): Promise<any> {
    if (!this.checkSign(dto)) {
      return CLICK_ERRORS.SIGN_CHECK_FAILED;
    }

    const transaction = await this.transactionService.findById(transactionId);

    if (!transaction) {
      return CLICK_ERRORS.TRANSACTION_NOT_FOUND;
    }

    if (transaction.status === 'completed') {
      return CLICK_ERRORS.ALREADY_PAID;
    }

    if (transaction.status === 'failed') {
      return CLICK_ERRORS.TRANSACTION_CANCELLED;
    }

    if (transaction.amount !== parseFloat(dto.amount)) {
      return CLICK_ERRORS.INCORRECT_AMOUNT;
    }

    return transaction;
  }

  async prepare(dto: ClickDto) {
    const validationResult = await this._validateTransaction(
      dto,
      dto.merchant_trans_id,
    );

    if (validationResult.error) {
      return validationResult;
    }

    const transaction = validationResult;

    return {
      click_trans_id: dto.click_trans_id,
      merchant_trans_id: dto.merchant_trans_id,
      merchant_prepare_id: transaction._id.toString(),
      error: 0,
      error_note: 'Success',
    };
  }

  async complete(dto: ClickDto) {
    const validationResult = await this._validateTransaction(
      dto,
      dto.merchant_prepare_id,
    );

    if (validationResult.error) {
      return validationResult;
    }

    const transaction = validationResult;

    if (dto.error === '0') {
      const updatedTransaction = await this.transactionService.updateStatus(
        transaction._id.toString(),
        'completed',
      );
      await this.userService.updateBalance(
        updatedTransaction.owner.toString(),
        updatedTransaction.amount,
      );
    } else {
      await this.transactionService.updateStatus(
        transaction._id.toString(),
        'failed',
      );
    }

    return {
      click_trans_id: dto.click_trans_id,
      merchant_trans_id: dto.merchant_trans_id,
      merchant_confirm_id: transaction._id.toString(),
      error: 0,
      error_note: 'Success',
    };
  }
}
