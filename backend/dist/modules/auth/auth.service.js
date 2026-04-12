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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const audit_service_1 = require("../audit/audit.service");
const auth_constants_1 = require("./auth.constants");
const branch_schema_1 = require("../members/schemas/branch.schema");
const district_schema_1 = require("../members/schemas/district.schema");
const member_schema_1 = require("../members/schemas/member.schema");
const member_profiles_service_1 = require("../member-profiles/member-profiles.service");
const identity_verification_service_1 = require("../identity-verification/identity-verification.service");
const notifications_service_1 = require("../notifications/notifications.service");
const email_notification_provider_1 = require("../notifications/providers/email-notification.provider");
const sms_notification_provider_1 = require("../notifications/providers/sms-notification.provider");
const banking_notification_builders_1 = require("../notifications/banking-notification-builders");
const staff_permissions_1 = require("../staff/staff-permissions");
const auth_session_schema_1 = require("./schemas/auth-session.schema");
const device_schema_1 = require("./schemas/device.schema");
const onboarding_evidence_schema_1 = require("./schemas/onboarding-evidence.schema");
const staff_step_up_token_schema_1 = require("./schemas/staff-step-up-token.schema");
let AuthService = AuthService_1 = class AuthService {
    constructor(configService, jwtService, memberAuthRepository, staffAuthRepository, memberModel, branchModel, districtModel, authSessionModel, deviceModel, onboardingEvidenceModel, staffStepUpTokenModel, memberProfilesService, identityVerificationService, notificationsService, emailNotificationProvider, smsNotificationProvider, auditService) {
        this.configService = configService;
        this.jwtService = jwtService;
        this.memberAuthRepository = memberAuthRepository;
        this.staffAuthRepository = staffAuthRepository;
        this.memberModel = memberModel;
        this.branchModel = branchModel;
        this.districtModel = districtModel;
        this.authSessionModel = authSessionModel;
        this.deviceModel = deviceModel;
        this.onboardingEvidenceModel = onboardingEvidenceModel;
        this.staffStepUpTokenModel = staffStepUpTokenModel;
        this.memberProfilesService = memberProfilesService;
        this.identityVerificationService = identityVerificationService;
        this.notificationsService = notificationsService;
        this.emailNotificationProvider = emailNotificationProvider;
        this.smsNotificationProvider = smsNotificationProvider;
        this.auditService = auditService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async onModuleInit() {
        if (!this.isDemoMode()) {
            return;
        }
        await this.ensureDemoMemberAccount();
    }
    async checkExistingAccount(dto) {
        const phoneNumber = this.resolvePhoneNumber(dto);
        const checks = [];
        if (phoneNumber) {
            checks.push({
                filter: { phone: phoneNumber },
                matchType: 'phone',
                message: 'An account already exists for this phone number.',
            });
        }
        if (dto.faydaFin) {
            checks.push({
                filter: { faydaFin: dto.faydaFin },
                matchType: 'fayda_fin',
                message: 'An account already exists for this Fayda FIN.',
            });
        }
        if (dto.email) {
            checks.push({
                filter: { email: dto.email },
                matchType: 'email',
                message: 'An account already exists for this email address.',
            });
        }
        for (const check of checks) {
            const existing = await this.memberModel.findOne(check.filter).lean();
            if (existing) {
                return {
                    exists: true,
                    matchType: check.matchType,
                    message: check.message,
                    customerId: existing.customerId ??
                        existing.memberNumber,
                };
            }
        }
        return {
            exists: false,
            message: 'No existing account was found. You can continue onboarding.',
        };
    }
    async getOnboardingStatus(dto) {
        const normalizedPhone = this.resolveRequiredPhoneNumber({
            phoneNumber: dto.phoneNumber,
        });
        const member = await this.memberModel.findOne({
            customerId: dto.customerId.trim(),
            phone: normalizedPhone,
        });
        if (!member) {
            throw new common_1.NotFoundException('Onboarding status was not found for the provided details.');
        }
        const profile = await this.memberProfilesService.findByMemberId(member._id.toString());
        const onboardingReviewStatus = profile?.onboardingReviewStatus ?? 'submitted';
        const identityVerificationStatus = profile?.identityVerificationStatus ?? 'not_started';
        return {
            customerId: member.customerId,
            phoneNumber: member.phone,
            branchName: member.preferredBranchName,
            onboardingReviewStatus,
            membershipStatus: profile?.membershipStatus ?? 'pending_verification',
            identityVerificationStatus,
            reviewNote: profile?.onboardingReviewNote,
            requiredAction: this.resolveOnboardingRequiredAction(onboardingReviewStatus, identityVerificationStatus),
            statusMessage: this.resolveOnboardingStatusMessage(onboardingReviewStatus, profile?.onboardingReviewNote),
            lastUpdatedAt: profile?.onboardingLastReviewedAt?.toISOString() ??
                profile?.updatedAt?.toISOString() ??
                member.updatedAt?.toISOString(),
        };
    }
    async registerMember(dto) {
        const demoMode = this.isDemoMode();
        const normalizedDto = this.normalizeRegistrationDto(dto, demoMode);
        this.logger.log(`registerMember phone=${normalizedDto.phoneNumber} demoMode=${demoMode} hasFaydaFin=${Boolean(normalizedDto.faydaFin)} hasQr=${Boolean(normalizedDto.faydaQrData)} branch=${normalizedDto.preferredBranchId ?? normalizedDto.preferredBranchName ?? 'auto'}`);
        this.validateRegistrationInput(normalizedDto, demoMode);
        if (normalizedDto.password !== normalizedDto.confirmPassword) {
            throw new common_1.BadRequestException('Password confirmation does not match.');
        }
        const existing = await this.checkExistingAccount({
            phoneNumber: normalizedDto.phoneNumber,
            faydaFin: normalizedDto.faydaFin,
            email: normalizedDto.email,
        });
        if (existing.exists) {
            throw new common_1.ConflictException(existing.message);
        }
        let branch = await this.resolvePreferredBranch(normalizedDto);
        if (!branch && demoMode) {
            branch = await this.resolveOrCreateDemoBranch();
            if (branch) {
                this.logger.warn(`registerMember fallback branch assignment applied for ${normalizedDto.phoneNumber}: ${branch.name}`);
            }
        }
        if (!branch) {
            throw new common_1.NotFoundException('No branch could be assigned for the selected location.');
        }
        const identifiers = demoMode
            ? await this.generateDemoIdentifiers()
            : await this.generateStandardIdentifiers();
        const fullName = `${normalizedDto.firstName.trim()} ${normalizedDto.lastName.trim()}`;
        const pinSource = demoMode
            ? normalizedDto.password
            : normalizedDto.phoneNumber.substring(normalizedDto.phoneNumber.length - 4);
        const member = await this.memberModel.create({
            customerId: identifiers.customerId,
            memberNumber: identifiers.memberId,
            memberType: enums_1.MemberType.MEMBER,
            role: enums_1.UserRole.MEMBER,
            fullName,
            firstName: normalizedDto.firstName.trim(),
            lastName: normalizedDto.lastName.trim(),
            phone: normalizedDto.phoneNumber,
            email: normalizedDto.email,
            region: normalizedDto.region,
            city: normalizedDto.city,
            preferredBranchName: branch.name,
            branchId: branch._id,
            districtId: branch.districtId,
            shareBalance: 0,
            faydaFin: normalizedDto.faydaFin,
            passwordHash: this.hashSecret(normalizedDto.password),
            pinHash: this.hashSecret(pinSource),
            kycStatus: demoMode
                ? 'demo_approved'
                : normalizedDto.faydaQrData != null || normalizedDto.faydaFin != null
                    ? 'pending'
                    : 'not_started',
            isActive: true,
        });
        this.logger.log(`registerMember saved _id=${member._id.toString()} phone=${member.phone} customerId=${member.customerId} memberNumber=${member.memberNumber} kycStatus=${member.kycStatus} active=${member.isActive}`);
        await this.runRegistrationSideEffect(demoMode, 'member profile creation', normalizedDto.phoneNumber, async () => {
            await this.memberProfilesService.create({
                memberId: member._id.toString(),
                dateOfBirth: new Date(normalizedDto.dateOfBirth),
                branchId: branch._id.toString(),
                districtId: branch.districtId.toString(),
                consentAccepted: normalizedDto.consentAccepted,
                membershipStatus: demoMode ? 'pending_review' : 'pending_verification',
                identityVerificationStatus: demoMode
                    ? 'demo_approved'
                    : normalizedDto.faydaQrData
                        ? 'qr_uploaded'
                        : normalizedDto.faydaFin
                            ? 'fin_submitted'
                            : 'not_started',
                onboardingReviewStatus: demoMode ? 'approved' : 'submitted',
            });
        });
        const currentUser = {
            sub: member._id.toString(),
            role: enums_1.UserRole.MEMBER,
            memberType: enums_1.MemberType.MEMBER,
            phone: normalizedDto.phoneNumber,
            memberId: member._id.toString(),
            branchId: branch._id.toString(),
            districtId: branch.districtId.toString(),
        };
        await this.runRegistrationSideEffect(demoMode, 'identity verification start', normalizedDto.phoneNumber, async () => {
            await this.identityVerificationService.start(currentUser, normalizedDto.consentAccepted);
        });
        if (normalizedDto.faydaFin) {
            await this.runRegistrationSideEffect(demoMode, 'identity verification FIN submission', normalizedDto.phoneNumber, async () => {
                await this.identityVerificationService.submitFin(currentUser, {
                    faydaFin: normalizedDto.faydaFin,
                    faydaAlias: normalizedDto.faydaAlias,
                });
            });
        }
        if (normalizedDto.faydaQrData || normalizedDto.faydaAlias) {
            await this.runRegistrationSideEffect(demoMode, 'identity verification QR upload', normalizedDto.phoneNumber, async () => {
                await this.identityVerificationService.uploadQr(currentUser, {
                    qrDataRaw: normalizedDto.faydaQrData,
                    faydaAlias: normalizedDto.faydaAlias,
                });
            });
        }
        await this.runRegistrationSideEffect(demoMode, 'onboarding evidence persistence', normalizedDto.phoneNumber, async () => {
            await this.onboardingEvidenceModel.findOneAndUpdate({ memberId: member._id }, {
                $set: {
                    phoneNumber: normalizedDto.phoneNumber,
                    faydaFrontImage: normalizedDto.faydaFrontImage,
                    faydaBackImage: normalizedDto.faydaBackImage,
                    selfieImage: this.extractSelfieStorageKey(normalizedDto.faydaQrData),
                    extractedFaydaData: normalizedDto.extractedFaydaData
                        ? {
                            ...normalizedDto.extractedFaydaData,
                            reviewRequiredFields: normalizedDto.extractedFaydaData.reviewRequiredFields ?? [],
                            dateOfBirthCandidates: normalizedDto.extractedFaydaData.dateOfBirthCandidates ?? [],
                            expiryDateCandidates: normalizedDto.extractedFaydaData.expiryDateCandidates ?? [],
                        }
                        : undefined,
                },
            }, { new: true, upsert: true, setDefaultsOnInsert: true });
        });
        await this.runRegistrationSideEffect(demoMode, 'registration notification', normalizedDto.phoneNumber, async () => {
            const notification = (0, banking_notification_builders_1.buildRegistrationCompletedNotification)(demoMode);
            await this.notificationsService.createNotification({
                userType: 'member',
                userId: member._id.toString(),
                userRole: enums_1.UserRole.MEMBER,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                entityType: 'kyc',
                entityId: member._id.toString(),
                actionLabel: 'Review KYC',
                priority: demoMode ? 'low' : 'normal',
                deepLink: '/fayda-verification',
            });
        });
        await this.runRegistrationSideEffect(demoMode, 'registration audit log', normalizedDto.phoneNumber, async () => {
            await this.auditService.logActorAction({
                actorId: member._id.toString(),
                actorRole: enums_1.UserRole.MEMBER,
                actionType: 'member_registration_completed',
                entityType: 'member',
                entityId: member._id.toString(),
                before: null,
                after: {
                    customerId: identifiers.customerId,
                    memberId: identifiers.memberId,
                    phoneNumber: normalizedDto.phoneNumber,
                    region: normalizedDto.region,
                    city: normalizedDto.city,
                    preferredBranchId: branch._id.toString(),
                    preferredBranchName: branch.name,
                    hasFaydaFrontImage: Boolean(normalizedDto.faydaFrontImage),
                    hasFaydaBackImage: Boolean(normalizedDto.faydaBackImage),
                    hasExtractedFaydaData: Boolean(normalizedDto.extractedFaydaData),
                    reviewRequiredFields: normalizedDto.extractedFaydaData?.reviewRequiredFields ?? [],
                    demoMode,
                },
            });
        });
        return {
            customerId: identifiers.customerId,
            memberId: identifiers.memberId,
            message: demoMode
                ? 'Seeded registration completed successfully. Verification checks were bypassed.'
                : 'Registration submitted successfully. Fayda verification is pending review.',
        };
    }
    extractSelfieStorageKey(faydaQrData) {
        if (!faydaQrData) {
            return undefined;
        }
        const selfieSegment = faydaQrData
            .split('|')
            .find((segment) => segment.startsWith('selfie:'));
        return selfieSegment?.slice('selfie:'.length) || undefined;
    }
    async loginMember(dto) {
        const principal = await this.memberAuthRepository.findByCustomerId(dto.customerId);
        return this.loginPrincipal(principal, dto.password, true);
    }
    async startLogin(dto) {
        const identifier = this.resolvePhoneNumber(dto) ?? dto.customerId?.trim();
        if (identifier == null || identifier.length === 0) {
            throw new common_1.BadRequestException('Phone number or customer ID is required.');
        }
        this.logger.log(`startLogin identifier=${identifier}`);
        const principal = await this.memberAuthRepository.findByCustomerId(identifier);
        if (!principal) {
            this.logger.warn(`startLogin no account found for identifier=${identifier}`);
            throw new common_1.UnauthorizedException('No matching member account was found.');
        }
        this.logger.log(`startLogin found member id=${principal.id} customerId=${principal.customerId} memberNumber=${principal.memberNumber} phone=${principal.phone}`);
        const challengeId = new mongoose_2.Types.ObjectId().toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await this.authSessionModel.create({
            memberId: new mongoose_2.Types.ObjectId(principal.id),
            challengeId,
            deviceId: dto.deviceId,
            loginIdentifier: identifier,
            status: 'pending',
            expiresAt,
        });
        return {
            challengeId,
            expiresAt: expiresAt.toISOString(),
        };
    }
    async verifyPinLogin(dto) {
        const authSession = await this.authSessionModel.findOne({
            challengeId: dto.challengeId,
            status: 'pending',
        });
        if (!authSession || authSession.expiresAt.getTime() < Date.now()) {
            throw new common_1.UnauthorizedException('Login challenge expired or was not found.');
        }
        const member = await this.memberModel
            .findById(authSession.memberId)
            .populate({ path: 'branchId', select: 'name' })
            .populate({ path: 'districtId', select: 'name' });
        if (!member) {
            throw new common_1.UnauthorizedException('Member account not found.');
        }
        const effectivePinHash = member.pinHash ?? this.hashSecret(member.phone.substring(member.phone.length - 4));
        if (effectivePinHash != this.hashSecret(dto.pin)) {
            throw new common_1.UnauthorizedException('Invalid PIN.');
        }
        authSession.status = 'verified';
        authSession.verifiedAt = new Date();
        await authSession.save();
        if (dto.deviceId != null && dto.deviceId.length > 0) {
            await this.deviceModel.findOneAndUpdate({ memberId: member._id, deviceId: dto.deviceId }, {
                $set: {
                    rememberDevice: dto.rememberDevice ?? false,
                    biometricEnabled: dto.biometricEnabled ?? false,
                    lastLoginAt: new Date(),
                },
            }, { upsert: true, new: true });
        }
        const populatedBranch = member.branchId;
        const populatedDistrict = member.districtId;
        return this.loginPrincipal({
            id: member._id.toString(),
            role: member.role,
            passwordHash: member.passwordHash,
            customerId: member.customerId,
            memberType: member.memberType,
            fullName: member.fullName,
            memberNumber: member.memberNumber,
            phone: member.phone,
            branchId: typeof populatedBranch === 'string'
                ? populatedBranch
                : populatedBranch?._id?.toString?.() ??
                    populatedBranch.toString(),
            districtId: typeof populatedDistrict === 'string'
                ? populatedDistrict
                : populatedDistrict?._id?.toString?.() ??
                    populatedDistrict.toString(),
            branchName: typeof populatedBranch === 'string' ? undefined : populatedBranch?.name,
            districtName: typeof populatedDistrict === 'string'
                ? undefined
                : populatedDistrict?.name,
        }, dto.pin, true, { bypassPasswordCheck: true });
    }
    async loginStaff(dto) {
        const principal = await this.staffAuthRepository.findByIdentifier(dto.identifier);
        return this.loginPrincipal(principal, dto.password, false);
    }
    async verifyStaffStepUp(currentUser, dto) {
        if (currentUser.role === enums_1.UserRole.MEMBER ||
            currentUser.role === enums_1.UserRole.SHAREHOLDER_MEMBER) {
            throw new common_1.ForbiddenException('Step-up verification is only available for staff users.');
        }
        const identifier = currentUser.identifier?.trim() || currentUser.email?.trim();
        if (!identifier) {
            await this.logStepUpFailure(currentUser, dto.memberId, 'missing_staff_identifier');
            throw new common_1.UnauthorizedException('Staff identifier is not available for step-up verification.');
        }
        const principal = await this.staffAuthRepository.findByIdentifier(identifier);
        if (!principal) {
            await this.logStepUpFailure(currentUser, dto.memberId, 'staff_account_not_found');
            throw new common_1.UnauthorizedException('Staff account was not found for step-up verification.');
        }
        const passwordIsValid = await this.verifyPassword(dto.password, principal.passwordHash);
        if (!passwordIsValid) {
            await this.logStepUpFailure(currentUser, dto.memberId, 'invalid_password');
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        const verifiedAt = new Date();
        const expiresAt = new Date(verifiedAt.getTime() + 5 * 60 * 1000);
        const tokenId = (0, crypto_1.randomUUID)();
        const currentDecision = await this.auditService.getCurrentOnboardingReviewDecision(dto.memberId);
        const boundDecisionVersion = currentDecision?.decisionVersion ?? 0;
        const auth = this.configService.getOrThrow('auth');
        await this.staffStepUpTokenModel.create({
            tokenId,
            staffId: new mongoose_2.Types.ObjectId(currentUser.sub),
            memberId: new mongoose_2.Types.ObjectId(dto.memberId),
            purpose: 'kyc_blocking_mismatch_approval',
            method: 'password_recheck',
            boundDecisionVersion,
            expiresAt,
        });
        const stepUpToken = await this.jwtService.signAsync({
            jti: tokenId,
            sub: currentUser.sub,
            role: currentUser.role,
            purpose: 'kyc_blocking_mismatch_approval',
            targetMemberId: dto.memberId,
            boundDecisionVersion,
            method: 'password_recheck',
            verifiedAt: verifiedAt.toISOString(),
        }, {
            expiresIn: '5m',
            issuer: auth.jwtIssuer,
            audience: auth.jwtAudience,
        });
        return {
            stepUpToken,
            verifiedAt: verifiedAt.toISOString(),
            expiresInSeconds: 300,
            method: 'password_recheck',
        };
    }
    async verifyHighRiskApprovalStepUpToken(currentUser, stepUpToken, memberId) {
        if (!stepUpToken?.trim()) {
            await this.logStepUpFailure(currentUser, memberId, 'missing_step_up_token');
            throw new common_1.UnauthorizedException('Step-up verification is required for high-risk onboarding approval.');
        }
        const auth = this.configService.getOrThrow('auth');
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(stepUpToken.trim(), {
                issuer: auth.jwtIssuer,
                audience: auth.jwtAudience,
            });
        }
        catch {
            await this.logStepUpFailure(currentUser, memberId, 'token_verification_failed');
            throw new common_1.UnauthorizedException('Invalid step-up verification token.');
        }
        if (payload.sub !== currentUser.sub ||
            payload.role !== currentUser.role) {
            await this.logStepUpFailure(currentUser, memberId, 'actor_binding_mismatch');
            throw new common_1.UnauthorizedException('Invalid step-up verification token.');
        }
        if (payload.purpose !== 'kyc_blocking_mismatch_approval') {
            await this.logStepUpFailure(currentUser, memberId, 'purpose_mismatch');
            throw new common_1.UnauthorizedException('Invalid step-up verification token.');
        }
        if (payload.targetMemberId !== memberId) {
            await this.logStepUpFailure(currentUser, memberId, 'member_binding_mismatch');
            throw new common_1.UnauthorizedException('Invalid step-up verification token.');
        }
        const consumedToken = await this.staffStepUpTokenModel.findOneAndUpdate({
            tokenId: payload.jti,
            staffId: new mongoose_2.Types.ObjectId(currentUser.sub),
            memberId: new mongoose_2.Types.ObjectId(memberId),
            purpose: 'kyc_blocking_mismatch_approval',
            boundDecisionVersion: payload.boundDecisionVersion ?? 0,
            consumedAt: { $exists: false },
            expiresAt: { $gt: new Date() },
        }, {
            $set: {
                consumedAt: new Date(),
            },
        }, {
            new: true,
        });
        if (!consumedToken) {
            await this.logStepUpFailure(currentUser, memberId, 'replayed_or_expired_token');
            throw new common_1.UnauthorizedException('Step-up verification token is expired, invalid, or already used.');
        }
        const currentDecision = await this.auditService.getCurrentOnboardingReviewDecision(memberId);
        const currentDecisionVersion = currentDecision?.decisionVersion ?? 0;
        if (currentDecisionVersion !== consumedToken.boundDecisionVersion) {
            await this.logStepUpFailure(currentUser, memberId, 'decision_version_mismatch');
            throw new common_1.UnauthorizedException('Step-up verification token is no longer valid for the current onboarding decision state.');
        }
        return {
            verifiedAt: payload.verifiedAt,
            method: payload.method,
            boundMemberId: memberId,
            boundDecisionVersion: consumedToken.boundDecisionVersion,
        };
    }
    async getCurrentSession(currentUser) {
        if (currentUser.role !== enums_1.UserRole.MEMBER &&
            currentUser.role !== enums_1.UserRole.SHAREHOLDER_MEMBER) {
            throw new common_1.ForbiddenException('Current session endpoint is member-only in this phase.');
        }
        const principal = await this.memberModel
            .findById(currentUser.sub)
            .populate({ path: 'branchId', select: 'name' })
            .populate({ path: 'districtId', select: 'name' })
            .lean();
        if (!principal) {
            throw new common_1.NotFoundException('Member not found.');
        }
        const profile = await this.memberProfilesService.findByMemberId(currentUser.sub);
        return {
            id: principal._id.toString(),
            role: currentUser.role,
            customerId: principal.customerId,
            memberType: principal.memberType,
            fullName: principal.fullName,
            memberNumber: principal.memberNumber,
            branchId: typeof principal.branchId === 'string'
                ? principal.branchId
                : principal.branchId?._id?.toString?.() ??
                    principal.branchId.toString(),
            districtId: typeof principal.districtId === 'string'
                ? principal.districtId
                : principal.districtId?._id?.toString?.() ??
                    principal.districtId.toString(),
            branchName: typeof principal.branchId === 'string' ? undefined : principal.branchId?.name,
            districtName: typeof principal.districtId === 'string'
                ? undefined
                : principal.districtId?.name,
            phone: principal.phone,
            membershipStatus: profile?.membershipStatus ?? 'pending_verification',
            identityVerificationStatus: profile?.identityVerificationStatus ?? 'not_started',
            featureFlags: {
                voting: principal.memberType === enums_1.MemberType.SHAREHOLDER,
                announcements: principal.memberType === enums_1.MemberType.SHAREHOLDER,
                dividends: principal.memberType === enums_1.MemberType.SHAREHOLDER,
                schoolPayment: true,
                loans: true,
                savings: true,
                liveChat: true,
            },
        };
    }
    async requestOtp(dto) {
        const phoneNumber = this.resolveRequiredPhoneNumber(dto);
        const email = dto.email?.trim().toLowerCase();
        const purpose = dto.purpose?.trim() || 'general';
        let recoveryMember = null;
        if (purpose === 'pin_recovery') {
            recoveryMember = await this.memberModel
                .findOne({ phone: phoneNumber })
                .select('_id phone email');
            if (!recoveryMember) {
                throw new common_1.NotFoundException('No account was found for this phone number.');
            }
        }
        const storedRecoveryEmail = recoveryMember?.email?.trim().toLowerCase();
        const channel = dto.preferredOtpChannel === 'email' && (email || storedRecoveryEmail)
            ? enums_1.NotificationChannel.EMAIL
            : enums_1.NotificationChannel.SMS;
        if (purpose === 'pin_recovery') {
            if (channel === enums_1.NotificationChannel.EMAIL &&
                !storedRecoveryEmail) {
                throw new common_1.BadRequestException('No email address is available for PIN recovery on this member profile.');
            }
        }
        const otpCode = this.generateOtpCode();
        const destination = channel === enums_1.NotificationChannel.EMAIL
            ? storedRecoveryEmail ?? email ?? phoneNumber
            : phoneNumber;
        if (channel === enums_1.NotificationChannel.EMAIL && !email) {
            if (!storedRecoveryEmail) {
                throw new common_1.BadRequestException('Email address is required when email OTP delivery is selected.');
            }
        }
        const deliveryResult = channel === enums_1.NotificationChannel.EMAIL
            ? await this.emailNotificationProvider.send({
                channel,
                recipient: destination,
                memberId: 'otp-pre-registration',
                category: enums_1.NotificationCategory.LOAN,
                subject: 'Bunna Bank OTP Verification Code',
                messageBody: `Your Bunna Bank verification code is ${otpCode}. It expires soon.`,
                htmlBody: `<p>Your Bunna Bank verification code is <strong>${otpCode}</strong>.</p><p>It expires soon.</p>`,
            })
            : await this.smsNotificationProvider.send({
                channel,
                recipient: destination,
                memberId: 'otp-pre-registration',
                category: enums_1.NotificationCategory.LOAN,
                messageBody: `Bunna Bank OTP: ${otpCode}. It expires soon.`,
            });
        this.logger.log(`requestOtp phone=${phoneNumber} channel=${channel} destination=${destination} status=${deliveryResult.status}`);
        return {
            phoneNumber,
            email: storedRecoveryEmail ?? email,
            purpose,
            deliveryChannel: channel,
            maskedDestination: channel === enums_1.NotificationChannel.EMAIL
                ? this.maskEmail(destination)
                : this.maskPhoneNumber(destination),
            status: 'otp_requested',
            reference: `OTP-${Date.now()}`,
            providerStatus: deliveryResult.status,
        };
    }
    async getRecoveryOptions(dto) {
        const identifier = dto.identifier?.trim();
        const phoneNumber = this.resolvePhoneNumber(dto);
        const normalizedEmail = dto.email?.trim().toLowerCase();
        const member = await this.memberModel
            .findOne({
            $or: [
                ...(phoneNumber != null ? [{ phone: phoneNumber }] : []),
                ...(normalizedEmail != null ? [{ email: normalizedEmail }] : []),
                ...(identifier != null
                    ? [
                        { phone: identifier },
                        { email: identifier.toLowerCase() },
                    ]
                    : []),
            ],
        })
            .select('_id phone email');
        if (!member) {
            throw new common_1.NotFoundException('No account was found for the provided phone number or email address.');
        }
        const channels = [
            {
                channel: 'sms',
                maskedDestination: this.maskPhoneNumber(member.phone),
            },
        ];
        if (member.email?.trim()) {
            channels.push({
                channel: 'email',
                maskedDestination: this.maskEmail(member.email.trim().toLowerCase()),
            });
        }
        return {
            phoneNumber: member.phone,
            channels,
        };
    }
    async verifyOtp(dto) {
        const phoneNumber = this.resolveRequiredPhoneNumber(dto);
        return {
            phoneNumber,
            verified: dto.otpCode.length >= 4,
            status: dto.otpCode.length >= 4 ? 'verified' : 'failed',
        };
    }
    async resetPin(dto) {
        const phoneNumber = this.resolveRequiredPhoneNumber(dto);
        const email = dto.email?.trim().toLowerCase();
        if (dto.newPin !== dto.confirmPin) {
            throw new common_1.BadRequestException('PIN confirmation does not match.');
        }
        if (!/^\d{4,6}$/.test(dto.newPin)) {
            throw new common_1.BadRequestException('PIN must be 4 to 6 digits.');
        }
        const member = await this.memberModel.findOne({ phone: phoneNumber });
        if (!member) {
            throw new common_1.NotFoundException('No account was found for this phone number.');
        }
        if (email && member.email && member.email.toLowerCase() !== email) {
            throw new common_1.BadRequestException('The email address does not match the member profile.');
        }
        member.pinHash = this.hashSecret(dto.newPin);
        await member.save();
        this.logger.log(`resetPin member=${member._id.toString()} phone=${phoneNumber} via=${email ? 'phone_email' : 'phone'}`);
        return {
            status: 'pin_reset',
            phoneNumber,
            message: 'PIN updated successfully.',
        };
    }
    async logout(currentUser) {
        await this.authSessionModel.updateMany({
            memberId: currentUser.sub,
            status: { $in: ['pending', 'verified'] },
        }, {
            $set: {
                status: 'logged_out',
                loggedOutAt: new Date(),
            },
        });
        return { success: true };
    }
    async refreshTokens(currentUser, _dto) {
        return this.buildTokens({
            id: currentUser.sub,
            role: currentUser.role,
            identifier: currentUser.identifier,
            email: currentUser.email,
            memberType: currentUser.memberType,
            fullName: currentUser.fullName,
            passwordHash: 'validated-refresh-token',
            phone: currentUser.phone,
            branchId: currentUser.branchId,
            branchName: currentUser.branchName,
            districtId: currentUser.districtId,
            districtName: currentUser.districtName,
            permissions: currentUser.permissions,
        });
    }
    async validateJwtPayload(payload) {
        if (!payload?.sub || !payload?.role) {
            throw new common_1.UnauthorizedException('Invalid authentication payload.');
        }
        return payload;
    }
    async loginPrincipal(principal, plainPassword, requireMemberRole, options = {}) {
        if (!principal) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        const passwordIsValid = options.bypassPasswordCheck
            ? true
            : await this.verifyPassword(plainPassword, principal.passwordHash);
        if (!passwordIsValid) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        if (requireMemberRole &&
            principal.role !== enums_1.UserRole.MEMBER &&
            principal.role !== enums_1.UserRole.SHAREHOLDER_MEMBER) {
            throw new common_1.ForbiddenException('Principal is not allowed to use member login.');
        }
        const tokens = await this.buildTokens(principal);
        const profile = requireMemberRole
            ? await this.memberProfilesService.findByMemberId(principal.id)
            : null;
        if (requireMemberRole) {
            await this.notificationsService.createNotification({
                userType: 'member',
                userId: principal.id,
                userRole: principal.role,
                type: enums_1.NotificationType.LOGIN_DETECTED,
                title: 'Login Detected',
                message: 'A new login to your Bunna Bank mobile profile was detected.',
                entityType: 'security',
                actionLabel: 'Review activity',
                priority: 'normal',
                deepLink: '/profile/security',
            });
        }
        return {
            ...tokens,
            user: {
                id: principal.id,
                role: principal.role,
                identifier: principal.identifier,
                email: principal.email,
                customerId: principal.customerId ?? principal.memberNumber,
                memberType: principal.memberType,
                fullName: principal.fullName,
                memberNumber: principal.memberNumber,
                staffNumber: principal.staffNumber,
                schoolId: principal.schoolId,
                schoolName: principal.schoolName,
                branchId: principal.branchId,
                districtId: principal.districtId,
                branchName: principal.branchName,
                districtName: principal.districtName,
                permissions: principal.permissions ??
                    (principal.staffNumber ? (0, staff_permissions_1.deriveStaffPermissions)(principal.role) : undefined),
                phone: principal.phone,
                membershipStatus: profile?.membershipStatus,
                identityVerificationStatus: profile?.identityVerificationStatus,
                featureFlags: this.buildFeatureFlags(principal),
            },
        };
    }
    buildFeatureFlags(principal) {
        if (principal.role !== enums_1.UserRole.MEMBER &&
            principal.role !== enums_1.UserRole.SHAREHOLDER_MEMBER) {
            return undefined;
        }
        return {
            voting: principal.memberType === enums_1.MemberType.SHAREHOLDER,
            announcements: principal.memberType === enums_1.MemberType.SHAREHOLDER,
            dividends: principal.memberType === enums_1.MemberType.SHAREHOLDER,
            schoolPayment: true,
            loans: true,
            savings: true,
            liveChat: true,
        };
    }
    async buildTokens(principal) {
        const auth = this.configService.getOrThrow('auth');
        const payload = {
            sub: principal.id,
            role: principal.role,
            customerId: principal.customerId,
            identifier: principal.identifier,
            email: principal.email,
            memberType: principal.memberType,
            fullName: principal.fullName,
            phone: principal.phone,
            memberId: principal.role === enums_1.UserRole.MEMBER ||
                principal.role === enums_1.UserRole.SHAREHOLDER_MEMBER
                ? principal.id
                : undefined,
            staffId: principal.role === enums_1.UserRole.MEMBER ||
                principal.role === enums_1.UserRole.SHAREHOLDER_MEMBER
                ? undefined
                : principal.id,
            schoolId: principal.schoolId,
            schoolName: principal.schoolName,
            branchId: principal.branchId,
            branchName: principal.branchName,
            districtId: principal.districtId,
            districtName: principal.districtName,
            permissions: principal.permissions ??
                (principal.staffNumber ? (0, staff_permissions_1.deriveStaffPermissions)(principal.role) : undefined),
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                expiresIn: auth.accessTokenExpiresIn,
                issuer: auth.jwtIssuer,
                audience: auth.jwtAudience,
            }),
            this.jwtService.signAsync(payload, {
                expiresIn: auth.refreshTokenExpiresIn,
                issuer: auth.jwtIssuer,
                audience: auth.jwtAudience,
            }),
        ]);
        return { accessToken, refreshToken };
    }
    async verifyPassword(plainPassword, passwordHash) {
        return (plainPassword.length > 0 &&
            (passwordHash === hashSecret(plainPassword) || passwordHash === plainPassword));
    }
    async generateStandardIdentifiers() {
        const totalMembers = await this.memberModel.countDocuments();
        const sequence = String(totalMembers + 1).padStart(6, '0');
        return {
            customerId: `BUN-${sequence}`,
            memberId: `BUN-${sequence}`,
        };
    }
    async generateDemoIdentifiers() {
        const members = await this.memberModel
            .find({
            $or: [
                { customerId: /^CUST-\d+$/i },
                { memberNumber: /^MBR-\d+$/i },
            ],
        })
            .select('customerId memberNumber')
            .lean();
        const maxSequence = members.reduce((highest, member) => {
            const values = [member.customerId, member.memberNumber];
            const localMax = values.reduce((valueMax, value) => {
                const matched = value?.match(/-(\d+)$/);
                const parsed = matched ? Number(matched[1]) : 0;
                return Math.max(valueMax, parsed);
            }, 0);
            return Math.max(highest, localMax);
        }, 1000);
        const nextSequence = maxSequence + 1;
        return {
            customerId: `CUST-${nextSequence}`,
            memberId: `MBR-${nextSequence}`,
        };
    }
    hashSecret(value) {
        return hashSecret(value);
    }
    async logStepUpFailure(currentUser, memberId, reasonCode) {
        try {
            await this.auditService.logActorAction({
                actorId: currentUser.sub,
                actorRole: currentUser.role,
                actionType: 'staff_step_up_verification_failed',
                entityType: 'member',
                entityId: memberId,
                after: {
                    reasonCode,
                    purpose: 'kyc_blocking_mismatch_approval',
                },
            });
        }
        catch {
            this.logger.warn(`Failed to write step-up failure audit for member=${memberId} reason=${reasonCode}`);
        }
    }
    async resolvePreferredBranch(dto) {
        if (dto.preferredBranchId) {
            const branch = await this.branchModel
                .findOne({
                _id: dto.preferredBranchId,
                isActive: true,
            })
                .lean();
            if (branch) {
                return branch;
            }
        }
        if (dto.preferredBranchName) {
            const branch = await this.branchModel
                .findOne({
                name: dto.preferredBranchName,
                city: dto.city,
                region: dto.region,
                isActive: true,
            })
                .lean();
            if (branch) {
                return branch;
            }
        }
        const cityBranch = await this.branchModel
            .findOne({
            city: dto.city,
            region: dto.region,
            isActive: true,
        })
            .sort({ name: 1 })
            .lean();
        if (cityBranch) {
            return cityBranch;
        }
        return this.branchModel
            .findOne({
            region: dto.region,
            isActive: true,
        })
            .sort({ name: 1 })
            .lean();
    }
    isDemoMode() {
        return this.configService.get('DEMO_MODE') === true;
    }
    validateRegistrationInput(dto, demoMode) {
        if (!dto.faydaFin && !dto.faydaQrData) {
            throw new common_1.BadRequestException('Fayda FIN or Fayda QR data is required for secure onboarding.');
        }
        if (dto.faydaFin && !/^\d{12}$/.test(dto.faydaFin)) {
            throw new common_1.BadRequestException('Fayda FIN must be exactly 12 digits.');
        }
        if (!demoMode) {
            if (!dto.dateOfBirth || Number.isNaN(new Date(dto.dateOfBirth).getTime())) {
                throw new common_1.BadRequestException('Date of birth is required.');
            }
            if (!dto.region?.trim()) {
                throw new common_1.BadRequestException('Region is required.');
            }
            if (!dto.city?.trim()) {
                throw new common_1.BadRequestException('City is required.');
            }
            if (!dto.consentAccepted) {
                throw new common_1.BadRequestException('Consent must be accepted.');
            }
            if (dto.password.length < 8) {
                throw new common_1.BadRequestException('Password must be at least 8 characters long.');
            }
            if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(dto.password)) {
                throw new common_1.BadRequestException('Password must include at least one letter and one number.');
            }
        }
    }
    normalizeRegistrationDto(dto, demoMode) {
        const phoneNumber = this.resolveRequiredPhoneNumber(dto);
        const fallbackPassword = dto.password?.trim() || phoneNumber.slice(-4) || '1234';
        return {
            ...dto,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            phoneNumber,
            phone: phoneNumber,
            email: dto.email?.trim() || undefined,
            dateOfBirth: (dto.dateOfBirth?.trim().length ?? 0) > 0
                ? dto.dateOfBirth.trim()
                : demoMode
                    ? '1995-01-15'
                    : '',
            region: (dto.region?.trim().length ?? 0) > 0
                ? dto.region.trim()
                : demoMode
                    ? 'Addis Ababa'
                    : '',
            city: (dto.city?.trim().length ?? 0) > 0
                ? dto.city.trim()
                : demoMode
                    ? 'Addis Ababa'
                    : '',
            preferredBranchId: dto.preferredBranchId?.trim() || undefined,
            preferredBranchName: dto.preferredBranchName?.trim() || undefined,
            password: fallbackPassword,
            confirmPassword: dto.confirmPassword?.trim() || fallbackPassword,
            faydaFin: dto.faydaFin?.trim() || undefined,
            faydaAlias: dto.faydaAlias?.trim() || undefined,
            faydaQrData: dto.faydaQrData?.trim() || undefined,
            faydaFrontImage: dto.faydaFrontImage?.trim() || undefined,
            faydaBackImage: dto.faydaBackImage?.trim() || undefined,
            consentAccepted: dto.consentAccepted ?? true,
        };
    }
    async resolveAnyActiveBranch() {
        return this.branchModel
            .findOne({ isActive: true })
            .sort({ name: 1 })
            .lean();
    }
    async resolveOrCreateDemoBranch() {
        const existingBranch = await this.resolveAnyActiveBranch();
        if (existingBranch) {
            return existingBranch;
        }
        let district = await this.districtModel
            .findOne({ code: 'demo_district' })
            .lean();
        if (!district) {
            district = await this.districtModel.create({
                code: 'demo_district',
                name: 'Addis Central District',
                isActive: true,
            });
        }
        const existingDemoBranch = await this.branchModel
            .findOne({ code: 'demo_branch' })
            .lean();
        if (existingDemoBranch) {
            return existingDemoBranch;
        }
        return this.branchModel.create({
            code: 'demo_branch',
            name: 'Addis Central Branch',
            districtId: district._id,
            city: 'Addis Ababa',
            region: 'Addis Ababa',
            isActive: true,
        });
    }
    async ensureDemoMemberAccount() {
        const demoPhone = '0911000001';
        const branch = await this.resolveOrCreateDemoBranch();
        if (!branch) {
            this.logger.warn('Unable to ensure seeded member account because no branch is available.');
            return;
        }
        const existingDemoMember = await this.memberModel.findOne({
            $or: [
                { phone: demoPhone },
                { customerId: 'BUN-100001' },
                { memberNumber: 'BUN-100001' },
            ],
        });
        if (existingDemoMember) {
            this.logger.log(`Demo bootstrap found existing seeded member customerId=${existingDemoMember.customerId} phone=${existingDemoMember.phone}; skipping destructive overwrite.`);
            return;
        }
        const demoMember = await this.memberModel.create({
            customerId: 'BUN-100001',
            memberNumber: 'BUN-100001',
            memberType: enums_1.MemberType.MEMBER,
            role: enums_1.UserRole.MEMBER,
            fullName: 'Selamawit Molla',
            firstName: 'Selamawit',
            lastName: 'Molla',
            phone: demoPhone,
            preferredBranchName: branch.name,
            branchId: branch._id,
            districtId: branch.districtId,
            shareBalance: 0,
            passwordHash: this.hashSecret('demo-pass'),
            pinHash: this.hashSecret('1234'),
            kycStatus: 'demo_approved',
            isActive: true,
        });
        await this.memberProfilesService.updateStatuses(demoMember._id.toString(), {
            membershipStatus: 'active_demo',
            identityVerificationStatus: 'demo_approved',
        });
        await this.memberProfilesService.create({
            memberId: demoMember._id.toString(),
            dateOfBirth: new Date('1995-01-15'),
            branchId: branch._id.toString(),
            districtId: branch.districtId.toString(),
            consentAccepted: true,
            membershipStatus: 'active_demo',
            identityVerificationStatus: 'demo_approved',
        }).catch(async () => {
            await this.memberProfilesService.updateStatuses(demoMember._id.toString(), {
                membershipStatus: 'active_demo',
                identityVerificationStatus: 'demo_approved',
            });
        });
        this.logger.log(`Ensured seeded member account customerId=BUN-100001 memberNumber=BUN-100001 phone=${demoPhone}`);
    }
    async runRegistrationSideEffect(demoMode, step, phoneNumber, action) {
        try {
            await action();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown registration error.';
            this.logger.error(`Registration ${step} failed for ${phoneNumber}: ${message}`);
            if (!demoMode) {
                throw error;
            }
        }
    }
    resolvePhoneNumber(dto) {
        const rawPhone = dto.phoneNumber?.trim() || dto.phone?.trim();
        if (!rawPhone) {
            return undefined;
        }
        return this.normalizePhoneNumber(rawPhone);
    }
    resolveRequiredPhoneNumber(dto) {
        const phoneNumber = this.resolvePhoneNumber(dto);
        if (!phoneNumber) {
            throw new common_1.BadRequestException('Phone number is required.');
        }
        return phoneNumber;
    }
    resolveOnboardingRequiredAction(onboardingReviewStatus, identityVerificationStatus) {
        if (onboardingReviewStatus === 'approved') {
            return 'You can now continue with verified-member services and login.';
        }
        if (onboardingReviewStatus === 'needs_action') {
            return 'Review the correction request and resubmit the missing or unclear onboarding evidence.';
        }
        if (identityVerificationStatus === 'qr_uploaded') {
            return 'Bank staff are validating your Fayda QR evidence and selfie submission.';
        }
        if (identityVerificationStatus === 'fin_submitted') {
            return 'Bank staff are validating your Fayda FIN record and selfie submission.';
        }
        return 'Your onboarding package is waiting for branch and KYC review.';
    }
    resolveOnboardingStatusMessage(onboardingReviewStatus, onboardingReviewNote) {
        if (onboardingReviewNote && onboardingReviewNote.trim().length > 0) {
            return onboardingReviewNote.trim();
        }
        switch (onboardingReviewStatus) {
            case 'approved':
                return 'Your onboarding package has been approved.';
            case 'review_in_progress':
                return 'Your onboarding package is currently under active staff review.';
            case 'needs_action':
                return 'Your onboarding package needs an update before approval can continue.';
            case 'submitted':
            default:
                return 'Your onboarding package has been submitted and is waiting for review.';
        }
    }
    generateOtpCode() {
        return String(Math.floor(100000 + Math.random() * 900000));
    }
    maskPhoneNumber(phoneNumber) {
        if (phoneNumber.length <= 4) {
            return phoneNumber;
        }
        return `${phoneNumber.substring(0, 2)}${'*'.repeat(phoneNumber.length - 4)}${phoneNumber.substring(phoneNumber.length - 2)}`;
    }
    maskEmail(email) {
        const [localPart, domain = ''] = email.split('@');
        if (!localPart) {
            return email;
        }
        const visibleLocal = localPart.length <= 1 ? localPart : localPart[0];
        return `${visibleLocal}${'*'.repeat(Math.max(localPart.length - 1, 1))}@${domain}`;
    }
    normalizePhoneNumber(value) {
        const digitsOnly = value.replace(/\D/g, '');
        if (digitsOnly.startsWith('251') && digitsOnly.length === 12) {
            return `0${digitsOnly.slice(3)}`;
        }
        if (digitsOnly.length === 9 && !digitsOnly.startsWith('0')) {
            return `0${digitsOnly}`;
        }
        return digitsOnly.length > 0 ? digitsOnly : value.trim();
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(auth_constants_1.MEMBER_AUTH_REPOSITORY)),
    __param(3, (0, common_1.Inject)(auth_constants_1.STAFF_AUTH_REPOSITORY)),
    __param(4, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __param(5, (0, mongoose_1.InjectModel)(branch_schema_1.Branch.name)),
    __param(6, (0, mongoose_1.InjectModel)(district_schema_1.District.name)),
    __param(7, (0, mongoose_1.InjectModel)(auth_session_schema_1.AuthSession.name)),
    __param(8, (0, mongoose_1.InjectModel)(device_schema_1.Device.name)),
    __param(9, (0, mongoose_1.InjectModel)(onboarding_evidence_schema_1.OnboardingEvidence.name)),
    __param(10, (0, mongoose_1.InjectModel)(staff_step_up_token_schema_1.StaffStepUpToken.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        jwt_1.JwtService, Object, Object, mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        member_profiles_service_1.MemberProfilesService,
        identity_verification_service_1.IdentityVerificationService,
        notifications_service_1.NotificationsService,
        email_notification_provider_1.EmailNotificationProvider,
        sms_notification_provider_1.SmsNotificationProvider,
        audit_service_1.AuditService])
], AuthService);
function hashSecret(value) {
    return (0, crypto_1.createHash)('sha256').update(value).digest('hex');
}
//# sourceMappingURL=auth.service.js.map