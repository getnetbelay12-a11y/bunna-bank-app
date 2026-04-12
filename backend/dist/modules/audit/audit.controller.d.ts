import type { Response } from 'express';
import { ListAuditLogsQueryDto, ListOnboardingReviewAuditQueryDto } from './dto';
import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    list(query: ListAuditLogsQueryDto): Promise<import("./interfaces").AuditLogResult[]>;
    listOnboardingReviewDecisions(query: ListOnboardingReviewAuditQueryDto): Promise<import("./interfaces").AuditLogResult[]>;
    exportOnboardingReviewDecisions(query: ListOnboardingReviewAuditQueryDto, response: Response): Promise<string>;
    verifyAuditLog(auditId: string): Promise<import("./interfaces").AuditLogVerificationResult>;
    listByEntity(entityType: string, entityId: string): Promise<import("./interfaces").AuditLogResult[]>;
    listByActor(actorId: string): Promise<import("./interfaces").AuditLogResult[]>;
}
