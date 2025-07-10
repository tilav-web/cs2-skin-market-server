import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { Transaction, TransactionSchema } from './transaction.schema';
import { User, UserSchema } from '../user/user.schema';
import { UserModule } from '../user/user.module';
import { Skin, SkinSchema } from '../skin/skin.schema';
import { TelegramPublisherModule } from '../telegram-publisher/telegram-publisher.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
      { name: Skin.name, schema: SkinSchema },
    ]),
    UserModule,
    TelegramPublisherModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
