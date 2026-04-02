import { Model } from 'mongoose';
import { AuthenticatedUser } from '../auth/interfaces';
import { LoanDocument } from '../loans/schemas/loan.schema';
import { MemberDocument } from '../members/schemas/member.schema';
import { InsuranceAlertItem } from './interfaces';
import { InsurancePolicyDocument } from './schemas/insurance-policy.schema';
import { LoanInsuranceLinkDocument } from './schemas/loan-insurance-link.schema';
export declare class InsuranceAlertService {
    private readonly loanModel;
    private readonly memberModel;
    private readonly insurancePolicyModel;
    private readonly loanInsuranceLinkModel;
    private readonly expiringThirtyDaysWindow;
    private readonly expiringSevenDaysWindow;
    constructor(loanModel: Model<LoanDocument>, memberModel: Model<MemberDocument>, insurancePolicyModel: Model<InsurancePolicyDocument>, loanInsuranceLinkModel: Model<LoanInsuranceLinkDocument>);
    getAlerts(currentUser: AuthenticatedUser): Promise<InsuranceAlertItem[]>;
    getAlertsByType(currentUser: AuthenticatedUser, alertType: InsuranceAlertItem['alertType']): Promise<InsuranceAlertItem[]>;
    private buildAlert;
    private resolveLinkedPolicies;
    private ensureManagerAccess;
    private buildScope;
}
