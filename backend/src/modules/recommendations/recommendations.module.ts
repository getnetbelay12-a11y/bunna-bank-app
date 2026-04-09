import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ChatConversation, ChatConversationSchema } from '../chat/schemas/chat-conversation.schema';
import {
  IdentityVerification,
  IdentityVerificationSchema,
} from '../identity-verification/schemas/identity-verification.schema';
import { InsurancePolicy, InsurancePolicySchema } from '../insurance/schemas/insurance-policy.schema';
import { MemberProfileEntity, MemberProfileSchema } from '../member-profiles/schemas/member-profile.schema';
import { Branch, BranchSchema } from '../members/schemas/branch.schema';
import { District, DistrictSchema } from '../members/schemas/district.schema';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.schema';
import { Transaction, TransactionSchema } from '../payments/schemas/transaction.schema';
import { SavingsAccount, SavingsAccountSchema } from '../savings/schemas/savings-account.schema';
import { AtmCardRequest, AtmCardRequestSchema } from '../service-placeholders/schemas/atm-card-request.schema';
import { AutopaySetting, AutopaySettingSchema } from '../service-placeholders/schemas/autopay-setting.schema';
import { Loan, LoanSchema } from '../loans/schemas/loan.schema';
import { AdminRecommendationsController } from './admin-recommendations.controller';
import { RecommendationAnalyticsService } from './recommendation-analytics.service';
import { RuleBasedRecommendationScorer } from './recommendation.scorer';
import { RecommendationEvent, RecommendationEventSchema } from './schemas/recommendation-event.schema';
import { Recommendation, RecommendationSchema } from './schemas/recommendation.schema';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recommendation.name, schema: RecommendationSchema },
      { name: RecommendationEvent.name, schema: RecommendationEventSchema },
      { name: Member.name, schema: MemberSchema },
      { name: MemberProfileEntity.name, schema: MemberProfileSchema },
      { name: IdentityVerification.name, schema: IdentityVerificationSchema },
      { name: SavingsAccount.name, schema: SavingsAccountSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Loan.name, schema: LoanSchema },
      { name: InsurancePolicy.name, schema: InsurancePolicySchema },
      { name: AutopaySetting.name, schema: AutopaySettingSchema },
      { name: AtmCardRequest.name, schema: AtmCardRequestSchema },
      { name: ChatConversation.name, schema: ChatConversationSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: District.name, schema: DistrictSchema },
    ]),
  ],
  controllers: [RecommendationsController, AdminRecommendationsController],
  providers: [
    RecommendationsService,
    RecommendationAnalyticsService,
    RuleBasedRecommendationScorer,
    {
      provide: 'RecommendationScoringPort',
      useExisting: RuleBasedRecommendationScorer,
    },
  ],
})
export class RecommendationsModule {}
