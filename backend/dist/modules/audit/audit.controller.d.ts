import { ListAuditLogsQueryDto } from './dto';
import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    list(query: ListAuditLogsQueryDto): Promise<import("./interfaces").AuditLogResult[]>;
    listByEntity(entityType: string, entityId: string): Promise<import("./interfaces").AuditLogResult[]>;
    listByActor(actorId: string): Promise<import("./interfaces").AuditLogResult[]>;
}
