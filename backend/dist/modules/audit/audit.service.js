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
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const audit_log_schema_1 = require("./schemas/audit-log.schema");
const member_schema_1 = require("../members/schemas/member.schema");
const staff_schema_1 = require("../staff/schemas/staff.schema");
let AuditService = class AuditService {
    constructor(auditLogModel, staffModel, memberModel, configService) {
        this.auditLogModel = auditLogModel;
        this.staffModel = staffModel;
        this.memberModel = memberModel;
        this.configService = configService;
    }
    async log(dto) {
        const createdAt = new Date();
        const auditLog = await this.auditLogModel.create({
            actorId: new mongoose_2.Types.ObjectId(dto.actorId),
            actorRole: dto.actorRole,
            actionType: dto.actionType,
            entityType: dto.entityType,
            entityId: new mongoose_2.Types.ObjectId(dto.entityId),
            before: dto.before ?? null,
            after: dto.after ?? null,
            auditDigest: this.computeAuditDigest(dto, createdAt),
            decisionVersion: dto.decisionVersion,
            isCurrentDecision: dto.isCurrentDecision,
            supersedesAuditId: dto.supersedesAuditId
                ? new mongoose_2.Types.ObjectId(dto.supersedesAuditId)
                : undefined,
            supersededByAuditId: dto.supersededByAuditId
                ? new mongoose_2.Types.ObjectId(dto.supersededByAuditId)
                : undefined,
            createdAt,
            updatedAt: createdAt,
        });
        return this.toResult(auditLog);
    }
    async logOnboardingReviewDecision(input) {
        const memberObjectId = new mongoose_2.Types.ObjectId(input.entityId);
        const previousDecision = await this.auditLogModel
            .findOne({
            actionType: 'onboarding_review_updated',
            entityType: 'member',
            entityId: memberObjectId,
            isCurrentDecision: true,
        })
            .sort({ createdAt: -1 })
            .lean();
        if (previousDecision != null && !input.supersessionReasonCode?.trim()) {
            throw new common_1.BadRequestException('Supersession reason code is required when replacing an existing onboarding review decision.');
        }
        const changedFields = previousDecision
            ? this.buildDecisionDiff(previousDecision.after, input.after)
            : [];
        if (previousDecision != null) {
            const acknowledgedFields = new Set((input.acknowledgedSupersessionFields ?? [])
                .map((field) => field.trim())
                .filter(Boolean));
            const missingAcknowledgements = changedFields
                .map((item) => item.field)
                .filter((field) => !acknowledgedFields.has(field));
            if (missingAcknowledgements.length > 0) {
                throw new common_1.BadRequestException(`Supersession diff must be acknowledged before replacing a decision: ${missingAcknowledgements.join(', ')}.`);
            }
        }
        const nextAfter = previousDecision
            ? {
                ...(input.after ?? {}),
                supersession: {
                    reasonCode: input.supersessionReasonCode?.trim(),
                    previousAuditId: previousDecision._id.toString(),
                    previousDecisionVersion: previousDecision.decisionVersion ?? 1,
                    acknowledgedFields: input.acknowledgedSupersessionFields ?? [],
                    changedFields,
                },
            }
            : input.after;
        const decision = await this.log({
            actorId: input.actorId,
            actorRole: input.actorRole,
            actionType: 'onboarding_review_updated',
            entityType: 'member',
            entityId: input.entityId,
            before: input.before,
            after: nextAfter,
            decisionVersion: (previousDecision?.decisionVersion ?? 0) + 1,
            isCurrentDecision: true,
            supersedesAuditId: previousDecision?._id?.toString(),
        });
        if (previousDecision?._id) {
            await this.auditLogModel.updateOne({ _id: previousDecision._id }, {
                $set: {
                    isCurrentDecision: false,
                    supersededByAuditId: new mongoose_2.Types.ObjectId(decision.id),
                    updatedAt: new Date(),
                },
            });
        }
        return decision;
    }
    async getCurrentOnboardingReviewDecision(memberId) {
        const decision = await this.auditLogModel
            .findOne({
            actionType: 'onboarding_review_updated',
            entityType: 'member',
            entityId: new mongoose_2.Types.ObjectId(memberId),
            isCurrentDecision: true,
        })
            .sort({ createdAt: -1 })
            .lean();
        return decision ? this.toResult(decision) : null;
    }
    async logActorAction(input) {
        return this.log({
            actorId: input.actorId,
            actorRole: input.actorRole,
            actionType: input.actionType,
            entityType: input.entityType,
            entityId: input.entityId,
            before: input.before,
            after: input.after,
        });
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
    async verifyAuditLog(auditId) {
        const log = await this.auditLogModel.findById(auditId).lean();
        if (!log) {
            throw new common_1.NotFoundException('Audit log was not found.');
        }
        const recomputedDigest = this.computeAuditDigest({
            actorId: log.actorId.toString(),
            actorRole: log.actorRole,
            actionType: log.actionType,
            entityType: log.entityType,
            entityId: log.entityId.toString(),
            before: log.before,
            after: log.after,
        }, log.createdAt ?? new Date(0));
        return {
            auditId: log._id.toString(),
            auditDigest: log.auditDigest,
            recomputedDigest,
            isValid: log.auditDigest === recomputedDigest,
        };
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
    async listOnboardingReviewDecisions(query) {
        const filter = {
            actionType: 'onboarding_review_updated',
            entityType: 'member',
        };
        if (query.actorId) {
            filter.actorId = new mongoose_2.Types.ObjectId(query.actorId);
        }
        if (query.memberId) {
            filter.entityId = new mongoose_2.Types.ObjectId(query.memberId);
        }
        if (query.status) {
            filter['after.status'] = query.status;
        }
        if (query.approvalReasonCode) {
            filter['after.approvalReasonCode'] = query.approvalReasonCode;
        }
        if (query.currentOnly === 'true') {
            filter.isCurrentDecision = true;
        }
        if (query.dateFrom || query.dateTo) {
            const createdAt = {};
            if (query.dateFrom) {
                createdAt.$gte = new Date(query.dateFrom);
            }
            if (query.dateTo) {
                createdAt.$lte = new Date(query.dateTo);
            }
            filter.createdAt = createdAt;
        }
        const logs = await this.auditLogModel
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        return logs.map((log) => this.toResult(log));
    }
    async exportOnboardingReviewDecisionsCsv(query) {
        const logs = await this.listOnboardingReviewDecisions(query);
        const actorIds = Array.from(new Set(logs.map((log) => log.actorId)));
        const memberIds = Array.from(new Set(logs.map((log) => log.entityId)));
        const [staffRecords, memberRecords] = await Promise.all([
            actorIds.length > 0
                ? this.staffModel
                    .find({ _id: { $in: actorIds.map((id) => new mongoose_2.Types.ObjectId(id)) } })
                    .lean()
                : Promise.resolve([]),
            memberIds.length > 0
                ? this.memberModel
                    .find({ _id: { $in: memberIds.map((id) => new mongoose_2.Types.ObjectId(id)) } })
                    .lean()
                : Promise.resolve([]),
        ]);
        const staffById = new Map(staffRecords.map((record) => [record._id.toString(), record]));
        const memberById = new Map(memberRecords.map((record) => [record._id.toString(), record]));
        const headers = [
            'auditId',
            'createdAt',
            'actorId',
            'actorIdentifier',
            'actorFullName',
            'actorRole',
            'actorBranchId',
            'actorDistrictId',
            'memberId',
            'memberCustomerId',
            'memberFullName',
            'memberBranchId',
            'memberDistrictId',
            'memberPreferredBranchName',
            'status',
            'approvalReasonCode',
            'approvalJustification',
            'supersessionReasonCode',
            'acknowledgedMismatchFields',
            'blockingMismatchFields',
            'policyVersion',
            'decisionVersion',
            'isCurrentDecision',
            'supersedesAuditId',
            'supersededByAuditId',
        ];
        const rows = logs.map((log) => {
            const after = this.asRecord(log.after);
            const supersession = this.asRecord(after?.supersession);
            const reviewPolicySnapshot = this.asRecord(after?.reviewPolicySnapshot);
            const actor = staffById.get(log.actorId);
            const member = memberById.get(log.entityId);
            return [
                log.id,
                log.createdAt?.toISOString() ?? '',
                log.actorId,
                actor?.identifier ?? '',
                actor?.fullName ?? '',
                log.actorRole,
                actor?.branchId?.toString() ?? '',
                actor?.districtId?.toString() ?? '',
                log.entityId,
                member?.customerId ?? '',
                member?.fullName ?? '',
                member?.branchId?.toString() ?? '',
                member?.districtId?.toString() ?? '',
                member?.preferredBranchName ?? '',
                this.asString(after?.status),
                this.asString(after?.approvalReasonCode),
                this.asString(after?.approvalJustification),
                this.asString(supersession?.reasonCode),
                this.asStringArray(after?.acknowledgedMismatchFields).join('|'),
                this.asStringArray(after?.blockingMismatchFields).join('|'),
                this.asString(reviewPolicySnapshot?.policyVersion),
                log.decisionVersion?.toString() ?? '',
                log.isCurrentDecision == null ? '' : String(log.isCurrentDecision),
                log.supersedesAuditId ?? '',
                log.supersededByAuditId ?? '',
            ];
        });
        return [headers, ...rows]
            .map((row) => row.map((value) => this.escapeCsvValue(value)).join(','))
            .join('\n');
    }
    toResult(log) {
        return {
            id: log.id ?? log._id.toString(),
            actorId: log.actorId.toString(),
            actorRole: log.actorRole,
            actionType: log.actionType,
            entityType: log.entityType,
            entityId: log.entityId.toString(),
            auditDigest: log.auditDigest,
            decisionVersion: log.decisionVersion,
            isCurrentDecision: log.isCurrentDecision,
            supersedesAuditId: log.supersedesAuditId?.toString(),
            supersededByAuditId: log.supersededByAuditId?.toString(),
            before: log.before,
            after: log.after,
            createdAt: log.createdAt,
            updatedAt: log.updatedAt,
        };
    }
    computeAuditDigest(dto, createdAt) {
        const secret = this.configService.get('AUDIT_DIGEST_SECRET') ??
            this.configService.get('JWT_SECRET') ??
            'bunna-audit-digest-fallback';
        const payload = this.stableStringify({
            actorId: dto.actorId,
            actorRole: dto.actorRole,
            actionType: dto.actionType,
            entityType: dto.entityType,
            entityId: dto.entityId,
            before: dto.before ?? null,
            after: dto.after ?? null,
            createdAt: createdAt.toISOString(),
        });
        return (0, node_crypto_1.createHmac)('sha256', secret).update(payload).digest('hex');
    }
    stableStringify(value) {
        return JSON.stringify(this.sortValue(value));
    }
    sortValue(value) {
        if (Array.isArray(value)) {
            return value.map((item) => this.sortValue(item));
        }
        if (value != null && typeof value === 'object') {
            return Object.keys(value)
                .sort()
                .reduce((result, key) => {
                result[key] = this.sortValue(value[key]);
                return result;
            }, {});
        }
        return value;
    }
    asRecord(value) {
        if (value == null || typeof value !== 'object' || Array.isArray(value)) {
            return null;
        }
        return value;
    }
    asString(value) {
        return typeof value === 'string' ? value : '';
    }
    asStringArray(value) {
        if (!Array.isArray(value)) {
            return [];
        }
        return value.filter((item) => typeof item === 'string');
    }
    escapeCsvValue(value) {
        const normalized = String(value ?? '');
        return `"${normalized.replace(/"/g, '""')}"`;
    }
    buildDecisionDiff(previousValue, nextValue) {
        const previousFlat = this.flattenDecisionValue(previousValue);
        const nextFlat = this.flattenDecisionValue(nextValue);
        const keys = Array.from(new Set([...Object.keys(previousFlat), ...Object.keys(nextFlat)])).sort();
        return keys
            .filter((key) => previousFlat[key] !== nextFlat[key])
            .map((key) => ({
            field: key,
            previousValue: previousFlat[key] ?? '',
            nextValue: nextFlat[key] ?? '',
        }));
    }
    flattenDecisionValue(value, prefix = '') {
        if (value == null) {
            return prefix ? { [prefix]: '' } : {};
        }
        if (Array.isArray(value)) {
            return prefix ? { [prefix]: this.stableStringify(value) } : {};
        }
        if (typeof value === 'object') {
            return Object.entries(value).reduce((result, [key, nestedValue]) => {
                const nestedPrefix = prefix ? `${prefix}.${key}` : key;
                Object.assign(result, this.flattenDecisionValue(nestedValue, nestedPrefix));
                return result;
            }, {});
        }
        return prefix ? { [prefix]: String(value) } : {};
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(audit_log_schema_1.AuditLog.name)),
    __param(1, (0, mongoose_1.InjectModel)(staff_schema_1.Staff.name)),
    __param(2, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        config_1.ConfigService])
], AuditService);
//# sourceMappingURL=audit.service.js.map