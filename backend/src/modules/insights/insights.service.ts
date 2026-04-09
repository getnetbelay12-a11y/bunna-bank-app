import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { PaymentType, UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { InsurancePolicy, InsurancePolicyDocument } from '../insurance/schemas/insurance-policy.schema';
import { Loan, LoanDocument } from '../loans/schemas/loan.schema';
import { SchoolPayment, SchoolPaymentDocument } from '../payments/schemas/school-payment.schema';
import { Transaction, TransactionDocument } from '../payments/schemas/transaction.schema';
import { SavingsAccount, SavingsAccountDocument } from '../savings/schemas/savings-account.schema';
import { AutopaySetting, AutopaySettingDocument } from '../service-placeholders/schemas/autopay-setting.schema';
import { SmartInsight, SmartInsightFeed } from './interfaces/smart-insight.interface';

type InsightCandidate = SmartInsight & { sortWeight: number };

@Injectable()
export class InsightsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(AutopaySetting.name)
    private readonly autopaySettingModel: Model<AutopaySettingDocument>,
    @InjectModel(SchoolPayment.name)
    private readonly schoolPaymentModel: Model<SchoolPaymentDocument>,
    @InjectModel(Loan.name)
    private readonly loanModel: Model<LoanDocument>,
    @InjectModel(InsurancePolicy.name)
    private readonly insurancePolicyModel: Model<InsurancePolicyDocument>,
    @InjectModel(SavingsAccount.name)
    private readonly savingsAccountModel: Model<SavingsAccountDocument>,
  ) {}

  async getMyInsights(currentUser: AuthenticatedUser): Promise<SmartInsightFeed> {
    this.ensureMemberAccess(currentUser);
    const items = await this.buildInsights(currentUser.sub);

    return this.buildFeed(items);
  }

  async getMyHomeInsights(currentUser: AuthenticatedUser): Promise<SmartInsightFeed> {
    this.ensureMemberAccess(currentUser);
    const items = await this.buildInsights(currentUser.sub);

    return this.buildFeed(items.slice(0, 3));
  }

  private async buildInsights(memberId: string): Promise<SmartInsight[]> {
    const memberObjectId = new Types.ObjectId(memberId);
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [transactions, autopaySettings, schoolPayments, loans, insurancePolicies, accounts] =
      await Promise.all([
        this.transactionModel
          .find({ memberId: memberObjectId, createdAt: { $gte: ninetyDaysAgo } })
          .sort({ createdAt: -1 })
          .lean<TransactionDocument[]>(),
        this.autopaySettingModel
          .find({ memberId: memberObjectId })
          .sort({ updatedAt: -1, createdAt: -1 })
          .lean<AutopaySettingDocument[]>(),
        this.schoolPaymentModel
          .find({ memberId: memberObjectId, createdAt: { $gte: ninetyDaysAgo } })
          .sort({ createdAt: -1 })
          .lean<SchoolPaymentDocument[]>(),
        this.loanModel
          .find({ memberId: memberObjectId })
          .sort({ createdAt: -1 })
          .lean<LoanDocument[]>(),
        this.insurancePolicyModel
          .find({ memberId: memberObjectId })
          .sort({ endDate: 1 })
          .lean<InsurancePolicyDocument[]>(),
        this.savingsAccountModel
          .find({ memberId: memberObjectId, isActive: true })
          .sort({ createdAt: 1 })
          .lean<SavingsAccountDocument[]>(),
      ]);

    const items: InsightCandidate[] = [];
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const recentDeposits = transactions.filter((item) => item.type === PaymentType.DEPOSIT);
    const loanRepayments = transactions.filter(
      (item) => item.type === PaymentType.LOAN_REPAYMENT,
    );

    items.push(...this.buildSchoolPaymentInsights(schoolPayments, now));
    items.push(...this.buildAutopayInsights(autopaySettings, now));
    items.push(...this.buildLoanInsights(loans, loanRepayments, now));
    items.push(...this.buildInsuranceInsights(insurancePolicies, now));
    items.push(...this.buildBalanceInsights(totalBalance, recentDeposits, items, now));

    return items
      .sort((left, right) => {
        if (right.sortWeight !== left.sortWeight) {
          return right.sortWeight - left.sortWeight;
        }

        const leftTime = left.dueAt ? new Date(left.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        const rightTime = right.dueAt ? new Date(right.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        return leftTime - rightTime;
      })
      .map(({ sortWeight, ...item }) => item);
  }

  private buildFeed(items: SmartInsight[]): SmartInsightFeed {
    return {
      generatedAt: new Date().toISOString(),
      total: items.length,
      urgentCount: items.filter((item) => item.priority === 'high').length,
      items,
    };
  }

  private buildSchoolPaymentInsights(
    schoolPayments: SchoolPaymentDocument[],
    now: Date,
  ): InsightCandidate[] {
    const latestByStudent = new Map<string, SchoolPaymentDocument>();

    for (const item of schoolPayments) {
      const key = `${item.studentId}:${item.schoolName}`;
      if (!latestByStudent.has(key)) {
        latestByStudent.set(key, item);
      }
    }

    return Array.from(latestByStudent.values()).flatMap((payment) => {
      const daysSinceLastPayment = this.daysBetween(payment.createdAt ?? now, now);

      if (daysSinceLastPayment > 35) {
        return [
          this.createInsight({
            id: `school-overdue-${payment.studentId}`,
            type: 'payment_overdue',
            priority: 'high',
            title: 'School payment overdue',
            message: `${payment.schoolName} tuition looks overdue for ${payment.studentId}.`,
            actionLabel: 'Pay Now',
            actionRoute: '/payments/school',
            dueAt: this.toIsoDate(this.addDays(payment.createdAt ?? now, 30)),
            amount: payment.amount,
            metadata: {
              studentId: payment.studentId,
              schoolName: payment.schoolName,
            },
          }, 100),
        ];
      }

      if (daysSinceLastPayment >= 27) {
        return [
          this.createInsight({
            id: `school-due-${payment.studentId}`,
            type: 'school_payment_due',
            priority: 'medium',
            title: 'School payment due soon',
            message: `${payment.schoolName} tuition is coming up again for ${payment.studentId}.`,
            actionLabel: 'Pay Now',
            actionRoute: '/payments/school',
            dueAt: this.toIsoDate(this.addDays(payment.createdAt ?? now, 30)),
            amount: payment.amount,
            metadata: {
              studentId: payment.studentId,
              schoolName: payment.schoolName,
            },
          }, 75),
        ];
      }

      return [];
    });
  }

  private buildAutopayInsights(
    autopaySettings: AutopaySettingDocument[],
    now: Date,
  ): InsightCandidate[] {
    return autopaySettings.flatMap((setting) => {
      const insightType = this.mapAutopayServiceType(setting.serviceType);
      if (!insightType) {
        return [];
      }

      const scheduleBase = setting.updatedAt ?? setting.createdAt ?? now;
      const daysSinceLastScheduleUpdate = this.daysBetween(scheduleBase, now);

      if (daysSinceLastScheduleUpdate < 27 || !setting.enabled) {
        return [];
      }

      const title =
        insightType === 'utility_due'
          ? 'Utility payment due'
          : insightType === 'rent_due'
            ? 'Rent payment due'
            : 'Subscription payment due';

      const cta =
        insightType === 'utility_due'
          ? 'Pay Now'
          : insightType === 'rent_due'
            ? 'Transfer Funds'
            : 'Pay Now';

      return [
        this.createInsight({
          id: `autopay-${setting._id.toString()}`,
          type: insightType,
          priority: 'medium',
          title,
          message: `${this.formatServiceType(setting.serviceType)} payment is approaching based on your saved AutoPay setup.`,
          actionLabel: cta,
          actionRoute: '/payments/autopay',
          dueAt: this.toIsoDate(this.addDays(scheduleBase, 30)),
          metadata: {
            accountId: setting.accountId,
            schedule: setting.schedule,
            enabled: setting.enabled,
          },
        }, 70),
      ];
    });
  }

  private buildLoanInsights(
    loans: LoanDocument[],
    loanRepayments: TransactionDocument[],
    now: Date,
  ): InsightCandidate[] {
    const workflowLoans = loans.filter((loan) =>
      ['submitted', 'branch_review', 'district_review', 'head_office_review'].includes(
        loan.status,
      ),
    );
    const activeLoans = loans.filter((loan) =>
      ['approved', 'disbursed'].includes(loan.status),
    );
    const items: InsightCandidate[] = [];

    for (const loan of workflowLoans) {
      items.push(
        this.createInsight(
          {
            id: `loan-workflow-${loan._id.toString()}`,
            type: 'loan_status',
            priority: loan.status === 'head_office_review' ? 'high' : 'medium',
            title: 'Loan workflow update',
            message: `Your ${loan.loanType.toLowerCase()} loan is currently at ${loan.status.replaceAll(
              '_',
              ' ',
            )}.`,
            actionLabel: 'View Loan',
            actionRoute: `/loans/${loan._id.toString()}`,
            dueAt: this.toIsoDate(now),
            metadata: {
              loanId: loan._id.toString(),
              currentLevel: loan.currentLevel,
              status: loan.status,
            },
          },
          85,
        ),
      );
    }

    if (activeLoans.length === 0) {
      return items;
    }

    const latestRepaymentAt = loanRepayments[0]?.createdAt;

    items.push(
      ...activeLoans.flatMap((loan) => {
      const anchor = latestRepaymentAt ?? loan.updatedAt ?? loan.createdAt ?? now;
      const daysSinceAnchor = this.daysBetween(anchor, now);

      if (daysSinceAnchor > 35) {
        return [
          this.createInsight({
            id: `loan-overdue-${loan._id.toString()}`,
            type: 'payment_overdue',
            priority: 'high',
            title: 'Loan repayment overdue',
            message: `A repayment follow-up may be needed for your ${loan.loanType.toLowerCase()} loan.`,
            actionLabel: 'View Loan',
            actionRoute: `/loans/${loan._id.toString()}`,
            dueAt: this.toIsoDate(this.addDays(anchor, 30)),
            amount: this.estimateMonthlyLoanInstallment(loan),
            metadata: {
              loanId: loan._id.toString(),
              loanType: loan.loanType,
            },
          }, 95),
        ];
      }

      if (daysSinceAnchor >= 27) {
        return [
          this.createInsight({
            id: `loan-due-${loan._id.toString()}`,
            type: 'loan_due',
            priority: 'medium',
            title: 'Loan repayment due soon',
            message: `Your ${loan.loanType.toLowerCase()} loan repayment window is approaching.`,
            actionLabel: 'View Loan',
            actionRoute: `/loans/${loan._id.toString()}`,
            dueAt: this.toIsoDate(this.addDays(anchor, 30)),
            amount: this.estimateMonthlyLoanInstallment(loan),
            metadata: {
              loanId: loan._id.toString(),
              loanType: loan.loanType,
            },
          }, 80),
        ];
      }

      return [];
      }),
    );

    return items;
  }

  private buildInsuranceInsights(
    policies: InsurancePolicyDocument[],
    now: Date,
  ): InsightCandidate[] {
    const activeOrExpired = policies.filter((policy) =>
      ['active', 'expired'].includes(policy.status),
    );

    return activeOrExpired.flatMap((policy) => {
      const daysUntilExpiry = this.daysBetween(now, policy.endDate);

      if (daysUntilExpiry < 0 || policy.status === 'expired') {
        return [
          this.createInsight({
            id: `insurance-overdue-${policy._id.toString()}`,
            type: 'insurance_due',
            priority: 'high',
            title: 'Insurance renewal overdue',
            message: `Policy ${policy.policyNumber} needs renewal to avoid coverage interruption.`,
            actionLabel: 'Renew Insurance',
            actionRoute: '/insurance/renew',
            dueAt: this.toIsoDate(policy.endDate),
            metadata: {
              policyNumber: policy.policyNumber,
              providerName: policy.providerName,
            },
          }, 90),
        ];
      }

      if (daysUntilExpiry <= 30) {
        return [
          this.createInsight({
            id: `insurance-due-${policy._id.toString()}`,
            type: 'insurance_due',
            priority: 'medium',
            title: 'Insurance renewal due soon',
            message: `${policy.providerName} policy ${policy.policyNumber} expires soon.`,
            actionLabel: 'Renew Insurance',
            actionRoute: '/insurance/renew',
            dueAt: this.toIsoDate(policy.endDate),
            metadata: {
              policyNumber: policy.policyNumber,
              providerName: policy.providerName,
            },
          }, 72),
        ];
      }

      return [];
    });
  }

  private buildBalanceInsights(
    totalBalance: number,
    recentDeposits: TransactionDocument[],
    currentItems: InsightCandidate[],
    now: Date,
  ): InsightCandidate[] {
    const hasHighPriority = currentItems.some((item) => item.priority === 'high');
    const dueSoonAmount = currentItems
      .filter((item) => ['high', 'medium'].includes(item.priority) && typeof item.amount === 'number')
      .reduce((sum, item) => sum + (item.amount ?? 0), 0);

    if (totalBalance <= Math.max(1000, dueSoonAmount * 0.5) && currentItems.length > 0) {
      return [
        this.createInsight({
          id: 'low-balance-warning',
          type: 'low_balance_warning',
          priority: hasHighPriority ? 'high' : 'medium',
          title: 'Low balance warning',
          message: 'Your available balance may be tight for upcoming obligations.',
          actionLabel: 'Transfer Funds',
          actionRoute: '/savings/transfer',
          amount: totalBalance,
        }, hasHighPriority ? 85 : 68),
      ];
    }

    if (!hasHighPriority && totalBalance >= 15000 && recentDeposits.length >= 2) {
      const lastDepositAt = recentDeposits[0].createdAt ?? now;
      return [
        this.createInsight({
          id: 'savings-suggestion',
          type: 'savings_suggestion',
          priority: 'low',
          title: 'Build a savings cushion',
          message: 'Your recent balance trend looks healthy. Consider moving part of it into savings.',
          actionLabel: 'Transfer Funds',
          actionRoute: '/savings/transfer',
          dueAt: this.toIsoDate(this.addDays(lastDepositAt, 7)),
          amount: totalBalance,
        }, 25),
      ];
    }

    return [];
  }

  private createInsight(
    item: Omit<SmartInsight, 'currency'> & { currency?: string },
    sortWeight: number,
  ): InsightCandidate {
    return {
      ...item,
      currency: item.currency ?? 'ETB',
      sortWeight,
    };
  }

  private mapAutopayServiceType(serviceType: string) {
    const normalized = serviceType.trim().toLowerCase();

    if (['water', 'electricity', 'utility'].includes(normalized)) {
      return 'utility_due' as const;
    }

    if (normalized == 'rent') {
      return 'rent_due' as const;
    }

    if (['subscription', 'internet', 'tv'].includes(normalized)) {
      return 'subscription_due' as const;
    }

    return null;
  }

  private formatServiceType(serviceType: string) {
    return serviceType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private estimateMonthlyLoanInstallment(loan: LoanDocument) {
    if (loan.termMonths <= 0) {
      return loan.amount;
    }

    return Math.round(loan.amount / loan.termMonths);
  }

  private daysBetween(left: Date, right: Date) {
    return Math.floor((right.getTime() - left.getTime()) / (24 * 60 * 60 * 1000));
  }

  private addDays(value: Date, days: number) {
    return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private toIsoDate(value: Date) {
    return value.toISOString();
  }

  private ensureMemberAccess(currentUser: AuthenticatedUser) {
    if (![UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER].includes(currentUser.role)) {
      throw new ForbiddenException('Only members can access smart insights.');
    }
  }
}
