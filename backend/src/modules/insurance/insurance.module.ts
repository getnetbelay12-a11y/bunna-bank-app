import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Loan, LoanSchema } from '../loans/schemas/loan.schema';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { InsuranceAlertService } from './insurance-alert.service';
import { InsuranceController } from './insurance.controller';
import { InsurancePolicyService } from './insurance-policy.service';
import { InsurancePolicy, InsurancePolicySchema } from './schemas/insurance-policy.schema';
import { LoanInsuranceLink, LoanInsuranceLinkSchema } from './schemas/loan-insurance-link.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Loan.name, schema: LoanSchema },
      { name: Member.name, schema: MemberSchema },
      { name: InsurancePolicy.name, schema: InsurancePolicySchema },
      { name: LoanInsuranceLink.name, schema: LoanInsuranceLinkSchema },
    ]),
  ],
  controllers: [InsuranceController],
  providers: [InsuranceAlertService, InsurancePolicyService],
  exports: [InsuranceAlertService, InsurancePolicyService, MongooseModule],
})
export class InsuranceModule {}
