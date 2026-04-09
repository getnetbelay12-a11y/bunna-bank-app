import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { InsurancePolicy, InsurancePolicySchema } from '../insurance/schemas/insurance-policy.schema';
import { Loan, LoanSchema } from '../loans/schemas/loan.schema';
import { SchoolPayment, SchoolPaymentSchema } from '../payments/schemas/school-payment.schema';
import { Transaction, TransactionSchema } from '../payments/schemas/transaction.schema';
import { SavingsAccount, SavingsAccountSchema } from '../savings/schemas/savings-account.schema';
import { AutopaySetting, AutopaySettingSchema } from '../service-placeholders/schemas/autopay-setting.schema';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: AutopaySetting.name, schema: AutopaySettingSchema },
      { name: SchoolPayment.name, schema: SchoolPaymentSchema },
      { name: Loan.name, schema: LoanSchema },
      { name: InsurancePolicy.name, schema: InsurancePolicySchema },
      { name: SavingsAccount.name, schema: SavingsAccountSchema },
    ]),
  ],
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
