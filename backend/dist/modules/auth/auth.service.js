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
const auth_session_schema_1 = require("./schemas/auth-session.schema");
const device_schema_1 = require("./schemas/device.schema");
let AuthService = AuthService_1 = class AuthService {
    constructor(configService, jwtService, memberAuthRepository, staffAuthRepository, memberModel, branchModel, districtModel, authSessionModel, deviceModel, memberProfilesService, identityVerificationService, notificationsService, auditService) {
        this.configService = configService;
        this.jwtService = jwtService;
        this.memberAuthRepository = memberAuthRepository;
        this.staffAuthRepository = staffAuthRepository;
        this.memberModel = memberModel;
        this.branchModel = branchModel;
        this.districtModel = districtModel;
        this.authSessionModel = authSessionModel;
        this.deviceModel = deviceModel;
        this.memberProfilesService = memberProfilesService;
        this.identityVerificationService = identityVerificationService;
        this.notificationsService = notificationsService;
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
        const checks = [];
        if (dto.phoneNumber) {
            checks.push({
                filter: { phone: dto.phoneNumber },
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
                };
            }
        }
        return {
            exists: false,
            message: 'No existing account was found. You can continue onboarding.',
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
        await this.runRegistrationSideEffect(demoMode, 'registration notification', normalizedDto.phoneNumber, async () => {
            await this.notificationsService.createNotification({
                userType: 'member',
                userId: member._id.toString(),
                userRole: enums_1.UserRole.MEMBER,
                type: enums_1.NotificationType.SYSTEM,
                title: 'Registration Completed',
                message: demoMode
                    ? 'Your demo account has been created. Verification is bypassed in demo mode.'
                    : 'Your account has been created. Fayda verification is pending and the submission may require manual review.',
            });
        });
        await this.runRegistrationSideEffect(demoMode, 'registration audit log', normalizedDto.phoneNumber, async () => {
            await this.auditService.log({
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
                    demoMode,
                },
            });
        });
        return {
            customerId: identifiers.customerId,
            memberId: identifiers.memberId,
            message: demoMode
                ? 'Demo registration completed successfully. Verification checks were bypassed.'
                : 'Registration submitted successfully. Fayda verification is pending review.',
        };
    }
    async loginMember(dto) {
        const principal = await this.memberAuthRepository.findByCustomerId(dto.customerId);
        return this.loginPrincipal(principal, dto.password, true);
    }
    async startLogin(dto) {
        const identifier = dto.phoneNumber?.trim() ?? dto.customerId?.trim();
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
        this.logStaffLoginAttempt(dto.identifier);
        const principal = await this.staffAuthRepository.findByIdentifier(dto.identifier);
        return this.loginPrincipal(principal, dto.password, false);
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
                schoolPayment: true,
                loans: true,
                savings: true,
                liveChat: true,
            },
        };
    }
    async requestOtp(dto) {
        return {
            phoneNumber: dto.phoneNumber,
            deliveryChannel: 'sms',
            status: 'otp_requested',
            reference: `OTP-${Date.now()}`,
        };
    }
    async verifyOtp(dto) {
        return {
            phoneNumber: dto.phoneNumber,
            verified: dto.otpCode.length >= 4,
            status: dto.otpCode.length >= 4 ? 'verified' : 'failed',
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
            memberType: currentUser.memberType,
            passwordHash: 'validated-refresh-token',
            phone: currentUser.phone,
            branchId: currentUser.branchId,
            districtId: currentUser.districtId,
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
            this.logStaffAuthDecision({
                identifier: undefined,
                email: undefined,
                role: undefined,
                found: false,
                passwordAccepted: false,
                decision: 'rejected_user_not_found',
            });
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        const passwordIsValid = options.bypassPasswordCheck
            ? true
            : await this.verifyPassword(plainPassword, principal.passwordHash);
        this.logStaffAuthDecision({
            identifier: principal.identifier,
            email: principal.email,
            role: principal.role,
            found: true,
            passwordAccepted: passwordIsValid,
            decision: passwordIsValid ? 'password_accepted' : 'rejected_bad_password',
        });
        if (!passwordIsValid) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        if (requireMemberRole &&
            principal.role !== enums_1.UserRole.MEMBER &&
            principal.role !== enums_1.UserRole.SHAREHOLDER_MEMBER) {
            throw new common_1.ForbiddenException('Principal is not allowed to use member login.');
        }
        const tokens = await this.buildTokens(principal);
        this.logTokenCreation(principal);
        const profile = requireMemberRole
            ? await this.memberProfilesService.findByMemberId(principal.id)
            : null;
        return {
            ...tokens,
            user: {
                id: principal.id,
                role: principal.role,
                customerId: principal.customerId ?? principal.memberNumber,
                memberType: principal.memberType,
                fullName: principal.fullName,
                memberNumber: principal.memberNumber,
                staffNumber: principal.staffNumber,
                branchId: principal.branchId,
                districtId: principal.districtId,
                branchName: this.resolveStaffScopeName(principal),
                districtName: principal.districtName,
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
            memberType: principal.memberType,
            phone: principal.phone,
            memberId: principal.role === enums_1.UserRole.MEMBER ||
                principal.role === enums_1.UserRole.SHAREHOLDER_MEMBER
                ? principal.id
                : undefined,
            staffId: principal.role === enums_1.UserRole.MEMBER ||
                principal.role === enums_1.UserRole.SHAREHOLDER_MEMBER
                ? undefined
                : principal.id,
            branchId: principal.branchId,
            districtId: principal.districtId,
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
    resolveStaffScopeName(principal) {
        if (principal.role === enums_1.UserRole.ADMIN ||
            principal.role === enums_1.UserRole.HEAD_OFFICE_MANAGER ||
            principal.role === enums_1.UserRole.HEAD_OFFICE_OFFICER) {
            return principal.branchName ?? 'Head Office';
        }
        return principal.branchName ?? principal.districtName;
    }
    logStaffLoginAttempt(identifier) {
        if (!this.isDevelopmentAuthLoggingEnabled()) {
            return;
        }
        this.logger.debug(`Staff login payload received identifier=${identifier.trim()}`);
    }
    logStaffAuthDecision(details) {
        if (!this.isDevelopmentAuthLoggingEnabled()) {
            return;
        }
        this.logger.debug(`Staff auth decision found=${details.found} identifier=${details.identifier ?? 'n/a'} email=${details.email ?? 'n/a'} role=${details.role ?? 'n/a'} passwordAccepted=${details.passwordAccepted} decision=${details.decision}`);
    }
    logTokenCreation(principal) {
        if (!this.isDevelopmentAuthLoggingEnabled()) {
            return;
        }
        this.logger.debug(`JWT/session created for principal=${principal.id} role=${principal.role}`);
    }
    isDevelopmentAuthLoggingEnabled() {
        return this.configService.get?.('NODE_ENV') !== 'production';
    }
    async generateStandardIdentifiers() {
        const totalMembers = await this.memberModel.countDocuments();
        const sequence = String(totalMembers + 1).padStart(6, '0');
        return {
            customerId: `CBE-${sequence}`,
            memberId: `CBE-${sequence}`,
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
        const phoneNumber = dto.phoneNumber.trim();
        const fallbackPassword = dto.password?.trim() || phoneNumber.slice(-4) || '1234';
        return {
            ...dto,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            phoneNumber,
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
                name: 'Demo District',
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
            name: 'Demo Branch',
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
            this.logger.warn('Unable to ensure demo member account because no branch is available.');
            return;
        }
        const demoMember = await this.memberModel.findOneAndUpdate({
            $or: [
                { phone: demoPhone },
                { customerId: 'CUST-1001' },
                { memberNumber: 'MBR-1001' },
            ],
        }, {
            $set: {
                customerId: 'CUST-1001',
                memberNumber: 'MBR-1001',
                memberType: enums_1.MemberType.MEMBER,
                role: enums_1.UserRole.MEMBER,
                fullName: 'Demo User',
                firstName: 'Demo',
                lastName: 'User',
                phone: demoPhone,
                preferredBranchName: branch.name,
                branchId: branch._id,
                districtId: branch.districtId,
                shareBalance: 0,
                passwordHash: this.hashSecret('1234'),
                pinHash: this.hashSecret('1234'),
                kycStatus: 'demo_approved',
                isActive: true,
            },
        }, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
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
        this.logger.log(`Ensured demo member account customerId=CUST-1001 memberNumber=MBR-1001 phone=${demoPhone}`);
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
    __metadata("design:paramtypes", [config_1.ConfigService,
        jwt_1.JwtService, Object, Object, mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        member_profiles_service_1.MemberProfilesService,
        identity_verification_service_1.IdentityVerificationService,
        notifications_service_1.NotificationsService,
        audit_service_1.AuditService])
], AuthService);
function hashSecret(value) {
    return (0, crypto_1.createHash)('sha256').update(value).digest('hex');
}
//# sourceMappingURL=auth.service.js.map