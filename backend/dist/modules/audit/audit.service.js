"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const audit_log_schema_1 = require("./schemas/audit-log.schema");
let AuditService = class AuditService {
    constructor(auditLogModel) {
        this.auditLogModel = auditLogModel;
    }
    async log(dto) {
        const auditLog = await this.auditLogModel.create({
            actorId: new mongoose_2.Types.ObjectId(dto.actorId),
            actorRole: dto.actorRole,
            actionType: dto.actionType,
            entityType: dto.entityType,
            entityId: new mongoose_2.Types.ObjectId(dto.entityId),
            before: dto.before ?? null,
            after: dto.after ?? null,
        });
        return this.toResult(auditLog);
    }
    async listByEntity(entityType, entityId) {
        const logs = await this.auditLogModel
            .find({
            entityType,
            entityId: new mongoose_2.Types.ObjectId(entityId),
        })
            .sort({ createdAt: -1 })
            .lean();
        return logs.map((log) => this.toResult(log));
    }
    async listByActor(actorId) {
        const logs = await this.auditLogModel
            .find({ actorId: new mongoose_2.Types.ObjectId(actorId) })
            .sort({ createdAt: -1 })
            .lean();
        return logs.map((log) => this.toResult(log));
    }
    async list(query) {
        const filter = {};
        if (query.actorId) {
            filter.actorId = new mongoose_2.Types.ObjectId(query.actorId);
        }
        if (query.entityType) {
            filter.entityType = query.entityType;
        }
        if (query.entityId) {
            filter.entityId = new mongoose_2.Types.ObjectId(query.entityId);
        }
        if (query.actionType) {
            filter.actionType = query.actionType;
        }
        const logs = await this.auditLogModel
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        return logs.map((log) => this.toResult(log));
    }
    toResult(log) {
        return {
            id: log.id ?? log._id.toString(),
            actorId: log.actorId.toString(),
            actorRole: log.actorRole,
            actionType: log.actionType,
            entityType: log.entityType,
            entityId: log.entityId.toString(),
            before: log.before,
            after: log.after,
            createdAt: log.createdAt,
            updatedAt: log.updatedAt,
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(audit_log_schema_1.AuditLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AuditService);
//# sourceMappingURL=audit.service.js.map