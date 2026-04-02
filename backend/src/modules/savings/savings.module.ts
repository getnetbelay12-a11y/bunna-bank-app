import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Transaction, TransactionSchema } from '../payments/schemas/transaction.schema';
import {
  SavingsAccount,
  SavingsAccountSchema,
} from './schemas/savings-account.schema';
import { SavingsController } from './savings.controller';
import { SavingsService } from './savings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SavingsAccount.name, schema: SavingsAccountSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [SavingsController],
  providers: [SavingsService],
  exports: [SavingsService],
})
export class SavingsModule {}
