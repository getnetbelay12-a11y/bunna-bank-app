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
exports.IdentityVerificationService = exports.FAYDA_VERIFICATION_PROVIDER = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const member_profiles_service_1 = require("../member-profiles/member-profiles.service");
const identity_verification_schema_1 = require("./schemas/identity-verification.schema");
exports.FAYDA_VERIFICATION_PROVIDER = 'FAYDA_VERIFICATION_PROVIDER';
let IdentityVerificationService = class IdentityVerificationService {
    constructor(identityVerificationModel, memberProfilesService, configService, provider) {
        this.identityVerificationModel = identityVerificationModel;
        this.memberProfilesService = memberProfilesService;
        this.configService = configService;
        this.provider = provider;
    }
    async start(currentUser, consentAccepted) {
        const result = await this.provider.start({
            memberId: currentUser.sub,
            phoneNumber: currentUser.phone ?? '',
            consentAccepted,
        });
        const record = await this.identityVerificationModel.create({
            memberId: new mongoose_2.Types.ObjectId(currentUser.sub),
            phoneNumber: currentUser.phone ?? '',
            verificationMethod: result.verificationMethod,
            verificationStatus: result.verificationStatus,
            verificationReference: result.verificationReference,
        });
        await this.memberProfilesService.updateStatuses(currentUser.sub, {
            identityVerificationStatus: result.verificationStatus,
            membershipStatus: 'pending_verification',
        });
        return this.toResult(record);
    }
    async submitFin(currentUser, dto) {
        const result = await this.provider.submitFin({
            memberId: currentUser.sub,
            phoneNumber: currentUser.phone ?? '',
            faydaFin: dto.faydaFin,
            faydaAlias: dto.faydaAlias,
        });
        const record = await this.identityVerificationModel.findOneAndUpdate({ memberId: new mongoose_2.Types.ObjectId(currentUser.sub) }, {
            $set: {
                phoneNumber: currentUser.phone ?? '',
                faydaFin: dto.faydaFin,
                faydaAlias: dto.faydaAlias,
                verificationMethod: result.verificationMethod,
                verificationStatus: result.verificationStatus,
                verificationReference: result.verificationReference,
            },
        }, { new: true, upsert: true, setDefaultsOnInsert: true });
        await this.memberProfilesService.updateStatuses(currentUser.sub, {
            identityVerificationStatus: result.verificationStatus,
        });
        return this.toResult(record);
    }
    async uploadQr(currentUser, dto) {
        const result = await this.provider.uploadQr({
            memberId: currentUser.sub,
            phoneNumber: currentUser.phone ?? '',
            qrDataRaw: dto.qrDataRaw,
            faydaAlias: dto.faydaAlias,
        });
        const record = await this.identityVerificationModel.findOneAndUpdate({ memberId: new mongoose_2.Types.ObjectId(currentUser.sub) }, {
            $set: {
                phoneNumber: currentUser.phone ?? '',
                qrDataRaw: dto.qrDataRaw,
                faydaAlias: dto.faydaAlias,
                verificationMethod: result.verificationMethod,
                verificationStatus: result.verificationStatus,
                verificationReference: result.verificationReference,
            },
        }, { new: true, upsert: true, setDefaultsOnInsert: true });
        await this.memberProfilesService.updateStatuses(currentUser.sub, {
            identityVerificationStatus: result.verificationStatus,
        });
        return this.toResult(record);
    }
    async verify(currentUser) {
        const existing = await this.identityVerificationModel.findOne({
            memberId: new mongoose_2.Types.ObjectId(currentUser.sub),
        });
        if (!existing) {
            throw new common_1.NotFoundException('Fayda verification has not been started.');
        }
        if (existing.verificationStatus === 'verified') {
            return this.toResult(existing);
        }
        const result = await this.provider.verify({
            memberId: currentUser.sub,
            phoneNumber: existing.phoneNumber,
        });
        existing.verificationMethod = result.verificationMethod;
        existing.verificationStatus = result.verificationStatus;
        existing.verificationReference = result.verificationReference;
        existing.verifiedAt = result.verifiedAt;
        existing.failureReason = result.failureReason;
        await existing.save();
        await this.memberProfilesService.updateStatuses(currentUser.sub, {
            identityVerificationStatus: result.verificationStatus,
            membershipStatus: result.verificationStatus === 'verified'
                ? 'active'
                : 'pending_verification',
        });
        return this.toResult(existing);
    }
    async getStatus(currentUser) {
        const record = await this.identityVerificationModel
            .findOne({ memberId: new mongoose_2.Types.ObjectId(currentUser.sub) })
            .sort({ createdAt: -1 });
        if (!record) {
            return {
                memberId: currentUser.sub,
                phoneNumber: currentUser.phone ?? '',
                verificationStatus: 'not_started',
                verificationMethod: this.resolveIntegrationMode() ? 'official_online_ekyc' : 'fin_plus_manual_review',
            };
        }
        return this.toResult(record);
    }
    resolveIntegrationMode() {
        return this.configService.get('FAYDA_PROVIDER_MODE') === 'official';
    }
    toResult(record) {
        return {
            id: record.id ?? record._id.toString(),
            memberId: record.memberId.toString(),
            phoneNumber: record.phoneNumber,
            faydaFin: this.maskFaydaFin(record.faydaFin),
            faydaAlias: record.faydaAlias,
            qrDataRaw: record.qrDataRaw ? '[redacted]' : undefined,
            verificationMethod: record.verificationMethod,
            verificationStatus: record.verificationStatus,
            verifiedAt: record.verifiedAt,
            verificationReference: record.verificationReference,
            failureReason: record.failureReason,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }
    maskFaydaFin(faydaFin) {
        if (!faydaFin) {
            return undefined;
        }
        if (faydaFin.length <= 4) {
            return '*'.repeat(faydaFin.length);
        }
        return `${'*'.repeat(faydaFin.length - 4)}${faydaFin.slice(-4)}`;
    }
};
exports.IdentityVerificationService = IdentityVerificationService;
exports.IdentityVerificationService = IdentityVerificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(identity_verification_schema_1.IdentityVerification.name)),
    __param(3, (0, common_1.Inject)(exports.FAYDA_VERIFICATION_PROVIDER)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        member_profiles_service_1.MemberProfilesService,
        config_1.ConfigService, Object])
], IdentityVerificationService);
//# sourceMappingURL=identity-verification.service.js.map