import { UserRole } from '../../../common/enums';
export interface AuditLogResult {
    id: string;
    actorId: string;
    actorRole: UserRole;
    actionType: string;
    entityType: string;
    entityId: string;
    auditDigest: string;
    decisionVersion?: number;
    isCurrentDecision?: boolean;
    supersedesAuditId?: string;
    supersededByAuditId?: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface AuditLogVerificationResult {
    auditId: string;
    auditDigest: string;
    recomputedDigest: string;
    isValid: boolean;
}
