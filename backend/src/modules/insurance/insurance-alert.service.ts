import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { LoanStatus, UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { Loan, LoanDocument } from '../loans/schemas/loan.schema';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { InsuranceAlertItem } from './interfaces';
import { InsurancePolicy, InsurancePolicyDocument } from './schemas/insurance-policy.schema';
import { LoanInsuranceLink, LoanInsuranceLinkDocument } from './schemas/loan-insurance-link.schema';

@Injectable()
export class InsuranceAlertService {
  private readonly expiringThirtyDaysWindow = 30;
  private readonly expiringSevenDaysWindow = 7;

  constructor(
    @InjectModel(Loan.name)
    private readonly loanModel: Model<LoanDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    @InjectModel(InsurancePolicy.name)
    private readonly insurancePolicyModel: Model<InsurancePolicyDocument>,
    @InjectModel(LoanInsuranceLink.name)
    private readonly loanInsuranceLinkModel: Model<LoanInsuranceLinkDocument>,
  ) {}

  async getAlerts(currentUser: AuthenticatedUser): Promise<InsuranceAlertItem[]> {
    this.ensureManagerAccess(currentUser);

    const scopedLoans = await this.loanModel
      .find({
        ...this.buildScope(currentUser),
        status: {
          $in: [
            LoanStatus.SUBMITTED,
            LoanStatus.BRANCH_REVIEW,
            LoanStatus.DISTRICT_REVIEW,
            LoanStatus.HEAD_OFFICE_REVIEW,
            LoanStatus.APPROVED,
            LoanStatus.DISBURSED,
          ],
        },
      });

    if (scopedLoans.length === 0) {
      return [];
    }

    const memberIds = [...new Set(scopedLoans.map((loan) => loan.memberId.toString()))].map(
      (id) => new Types.ObjectId(id),
    );
    const loanIds = scopedLoans.map((loan) => loan._id);

    const [members, links, policies] = await Promise.all([
      this.memberModel.find({ _id: { $in: memberIds } }),
      this.loanInsuranceLinkModel.find({ loanId: { $in: loanIds } }),
      this.insurancePolicyModel
        .find({
          $or: [{ linkedLoanId: { $in: loanIds } }, { memberId: { $in: memberIds } }],
        }),
    ]);

    const memberMap = new Map(members.map((member) => [member._id.toString(), member]));
    const linksByLoanId = new Map<string, LoanInsuranceLinkDocument[]>();
    for (const link of links) {
      const key = link.loanId.toString();
      const group = linksByLoanId.get(key) ?? [];
      group.push(link);
      linksByLoanId.set(key, group);
    }

    const policiesById = new Map(policies.map((policy) => [policy._id.toString(), policy]));
    const policiesByLoanId = new Map<string, InsurancePolicyDocument[]>();
    for (const policy of policies) {
      if (policy.linkedLoanId) {
        const key = policy.linkedLoanId.toString();
        const group = policiesByLoanId.get(key) ?? [];
        group.push(policy);
        policiesByLoanId.set(key, group);
      }
    }

    const now = new Date();
    const alerts: InsuranceAlertItem[] = [];

    for (const loan of scopedLoans) {
      const member = memberMap.get(loan.memberId.toString());
      if (!member) {
        continue;
      }

      const linkedPolicies = this.resolveLinkedPolicies(
        loan._id.toString(),
        linksByLoanId,
        policiesById,
        policiesByLoanId,
      );

      if (linkedPolicies.length === 0) {
        alerts.push(this.buildAlert(loan, member, 'loan_without_linked_insurance'));
        continue;
      }

      const validPolicy = linkedPolicies.find((policy) => policy.endDate.getTime() >= now.getTime());
      if (!validPolicy) {
        const latestPolicy = linkedPolicies.sort(
          (left, right) => right.endDate.getTime() - left.endDate.getTime(),
        )[0];
        alerts.push(this.buildAlert(loan, member, 'expired', latestPolicy, now));
        alerts.push(this.buildAlert(loan, member, 'loan_without_valid_insurance', latestPolicy, now));
        continue;
      }

      const daysUntilExpiry = Math.ceil(
        (validPolicy.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilExpiry <= this.expiringSevenDaysWindow) {
        alerts.push(this.buildAlert(loan, member, 'expiring_7_days', validPolicy, now));
      } else if (daysUntilExpiry <= this.expiringThirtyDaysWindow) {
        alerts.push(this.buildAlert(loan, member, 'expiring_30_days', validPolicy, now));
      }
    }

    return alerts;
  }

  async getAlertsByType(
    currentUser: AuthenticatedUser,
    alertType: InsuranceAlertItem['alertType'],
  ) {
    const alerts = await this.getAlerts(currentUser);
    return alerts.filter((item) => item.alertType === alertType);
  }

  private buildAlert(
    loan: LoanDocument,
    member: MemberDocument,
    alertType: InsuranceAlertItem['alertType'],
    policy?: InsurancePolicyDocument,
    now = new Date(),
  ): InsuranceAlertItem {
    const daysUntilExpiry = policy?.endDate
      ? Math.ceil((policy.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    return {
      loanId: loan._id.toString(),
      memberId: member._id.toString(),
      customerId: member.customerId,
      memberName: member.fullName,
      branchId: member.branchId.toString(),
      districtId: member.districtId.toString(),
      policyId: policy?._id.toString(),
      policyNumber: policy?.policyNumber,
      providerName: policy?.providerName,
      insuranceType: policy?.insuranceType,
      alertType,
      endDate: policy?.endDate,
      daysUntilExpiry,
      requiresManagerAction: ['expired', 'loan_without_valid_insurance', 'loan_without_linked_insurance'].includes(alertType),
    };
  }

  private resolveLinkedPolicies(
    loanId: string,
    linksByLoanId: Map<string, LoanInsuranceLinkDocument[]>,
    policiesById: Map<string, InsurancePolicyDocument>,
    policiesByLoanId: Map<string, InsurancePolicyDocument[]>,
  ) {
    const linkedByJoin = (linksByLoanId.get(loanId) ?? [])
      .map((link) => policiesById.get(link.insurancePolicyId.toString()))
      .filter((policy): policy is InsurancePolicyDocument => Boolean(policy));

    if (linkedByJoin.length > 0) {
      return linkedByJoin;
    }

    return policiesByLoanId.get(loanId) ?? [];
  }

  private ensureManagerAccess(currentUser: AuthenticatedUser) {
    if (
      ![
        UserRole.BRANCH_MANAGER,
        UserRole.DISTRICT_MANAGER,
        UserRole.DISTRICT_OFFICER,
        UserRole.HEAD_OFFICE_MANAGER,
        UserRole.HEAD_OFFICE_OFFICER,
        UserRole.ADMIN,
      ].includes(currentUser.role)
    ) {
      throw new ForbiddenException('Only managers can access insurance alerts.');
    }
  }

  private buildScope(currentUser: AuthenticatedUser) {
    if (currentUser.role === UserRole.BRANCH_MANAGER && currentUser.branchId) {
      return { branchId: new Types.ObjectId(currentUser.branchId) };
    }

    if (
      [UserRole.DISTRICT_MANAGER, UserRole.DISTRICT_OFFICER].includes(currentUser.role) &&
      currentUser.districtId
    ) {
      return { districtId: new Types.ObjectId(currentUser.districtId) };
    }

    return {};
  }
}
