import { Module, forwardRef } from '@nestjs/common';
import { ClickController } from './click.controller';
import { ClickService } from './click.service';
import { TransactionModule } from '../transaction/transaction.module';
import { UserModule } from '../user/user.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Transaction,
  TransactionSchema,
} from '../transaction/transaction.schema';
import { User, UserSchema } from '../user/user.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => TransactionModule),
    forwardRef(() => UserModule),
  ],
  controllers: [ClickController],
  providers: [ClickService],
})
export class ClickModule {}
