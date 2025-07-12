import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { TransactionService } from '../transaction/transaction.service';
import { UserService } from '../user/user.service';
import { ClickDto } from './dto/click.dto';

@Injectable()
export class ClickService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

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

    if (action === '1') {
      stringToHash += `${merchant_prepare_id}`;
    }

    stringToHash += `${amount}${action}${sign_time}`;

    const generatedSign = crypto
      .createHash('md5')
      .update(stringToHash)
      .digest('hex');

    return generatedSign === sign_string;
  }

  async prepare(dto: ClickDto) {
    // Check signature
    if (!this.checkSign(dto)) {
      return { error: -1, error_note: 'SIGN CHECK FAILED!' };
    }

    const transaction = await this.transactionService.findById(
      dto.merchant_trans_id,
    );

    if (!transaction) {
      return { error: -5, error_note: 'Transaction does not exist' };
    }

    if (transaction.status === 'completed') {
      return { error: -4, error_note: 'Already paid' };
    }

    if (transaction.status === 'failed') {
      return { error: -9, error_note: 'Transaction cancelled' };
    }

    if (transaction.amount !== parseFloat(dto.amount)) {
      return { error: -2, error_note: 'Incorrect parameter amount' };
    }

    return {
      click_trans_id: dto.click_trans_id,
      merchant_trans_id: dto.merchant_trans_id,
      merchant_prepare_id: transaction._id.toString(),
      error: 0,
      error_note: 'Success',
    };
  }

  async complete(dto: ClickDto) {
    if (!this.checkSign(dto)) {
      return { error: -1, error_note: 'SIGN CHECK FAILED!' };
    }

    const transaction = await this.transactionService.findById(
      dto.merchant_prepare_id,
    );

    if (!transaction) {
      return { error: -6, error_note: 'Transaction does not exist' };
    }

    if (transaction.status === 'completed') {
      return { error: -4, error_note: 'Already paid' };
    }

    if (transaction.status === 'failed') {
      return { error: -9, error_note: 'Transaction cancelled' };
    }

    if (transaction.amount !== parseFloat(dto.amount)) {
      return { error: -2, error_note: 'Incorrect parameter amount' };
    }

    if (dto.error === '0') {
      // Success payment
      const updatedTransaction = await this.transactionService.updateStatus(
        transaction._id.toString(),
        'completed',
      );
      await this.userService.updateBalance(
        updatedTransaction.owner.toString(),
        updatedTransaction.amount,
      );
    } else {
      // Failed payment
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
