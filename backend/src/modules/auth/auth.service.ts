import { createHash } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  MemberType,
  NotificationCategory,
  NotificationChannel,
  NotificationType,
  UserRole,
} from '../../common/enums';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser, AuthPrincipal } from './interfaces';
import {
  CheckExistingAccountDto,
  LookupOnboardingStatusDto,
  MemberLoginDto,
  RefreshTokenDto,
  RecoveryOptionsDto,
  RegisterMemberDto,
  RequestOtpDto,
  ResetPinDto,
  StartLoginDto,
  StaffLoginDto,
  VerifyPinLoginDto,
  VerifyOtpDto,
} from './dto';
import {
  MEMBER_AUTH_REPOSITORY,
  STAFF_AUTH_REPOSITORY,
} from './auth.constants';
import {
  AuthTokens,
  CheckExistingAccountResult,
  LoginResult,
  MemberAuthRepository,
  StartLoginResult,
  StaffAuthRepository,
} from './auth.types';
import { Branch, BranchDocument } from '../members/schemas/branch.schema';
import { District, DistrictDocument } from '../members/schemas/district.schema';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { MemberProfilesService } from '../member-profiles/member-profiles.service';
import { IdentityVerificationService } from '../identity-verification/identity-verification.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailNotificationProvider } from '../notifications/providers/email-notification.provider';
import { SmsNotificationProvider } from '../notifications/providers/sms-notification.provider';
import { buildRegistrationCompletedNotification } from '../notifications/banking-notification-builders';
import { deriveStaffPermissions } from '../staff/staff-permissions';
import { AuthSession, AuthSessionDocument } from './schemas/auth-session.schema';
import { Device, DeviceDocument } from './schemas/device.schema';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(MEMBER_AUTH_REPOSITORY)
    private readonly memberAuthRepository: MemberAuthRepository,
    @Inject(STAFF_AUTH_REPOSITORY)
    private readonly staffAuthRepository: StaffAuthRepository,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
    @InjectModel(District.name)
    private readonly districtModel: Model<DistrictDocument>,
    @InjectModel(AuthSession.name)
    private readonly authSessionModel: Model<AuthSessionDocument>,
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
    private readonly memberProfilesService: MemberProfilesService,
    private readonly identityVerificationService: IdentityVerificationService,
    private readonly notificationsService: NotificationsService,
    private readonly emailNotificationProvider: EmailNotificationProvider,
    private readonly smsNotificationProvider: SmsNotificationProvider,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    if (!this.isDemoMode()) {
      return;
    }

    await this.ensureDemoMemberAccount();
  }

  async checkExistingAccount(
    dto: CheckExistingAccountDto,
  ): Promise<CheckExistingAccountResult> {
    const phoneNumber = this.resolvePhoneNumber(dto);
    const checks: Array<{
      filter: Record<string, unknown>;
      matchType: CheckExistingAccountResult['matchType'];
      message: string;
    }> = [];

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
          customerId:
            (existing as { customerId?: string; memberNumber?: string }).customerId ??
            (existing as { customerId?: string; memberNumber?: string }).memberNumber,
        };
      }
    }

    return {
      exists: false,
      message: 'No existing account was found. You can continue onboarding.',
    };
  }

  async getOnboardingStatus(dto: LookupOnboardingStatusDto) {
    const normalizedPhone = this.resolveRequiredPhoneNumber({
      phoneNumber: dto.phoneNumber,
    });
    const member = await this.memberModel.findOne({
      customerId: dto.customerId.trim(),
      phone: normalizedPhone,
    });

    if (!member) {
      throw new NotFoundException(
        'Onboarding status was not found for the provided details.',
      );
    }

    const profile = await this.memberProfilesService.findByMemberId(
      member._id.toString(),
    );
    const onboardingReviewStatus = profile?.onboardingReviewStatus ?? 'submitted';
    const identityVerificationStatus =
      profile?.identityVerificationStatus ?? 'not_started';

    return {
      customerId: member.customerId,
      phoneNumber: member.phone,
      branchName: member.preferredBranchName,
      onboardingReviewStatus,
      membershipStatus: profile?.membershipStatus ?? 'pending_verification',
      identityVerificationStatus,
      reviewNote: profile?.onboardingReviewNote,
      requiredAction: this.resolveOnboardingRequiredAction(
        onboardingReviewStatus,
        identityVerificationStatus,
      ),
      statusMessage: this.resolveOnboardingStatusMessage(
        onboardingReviewStatus,
        profile?.onboardingReviewNote,
      ),
      lastUpdatedAt:
        profile?.onboardingLastReviewedAt?.toISOString() ??
        profile?.updatedAt?.toISOString() ??
        (member as { updatedAt?: Date }).updatedAt?.toISOString(),
    };
  }

  async registerMember(dto: RegisterMemberDto) {
    const demoMode = this.isDemoMode();
    const normalizedDto = this.normalizeRegistrationDto(dto, demoMode);

    this.logger.log(
      `registerMember phone=${normalizedDto.phoneNumber} demoMode=${demoMode} hasFaydaFin=${Boolean(normalizedDto.faydaFin)} hasQr=${Boolean(normalizedDto.faydaQrData)} branch=${normalizedDto.preferredBranchId ?? normalizedDto.preferredBranchName ?? 'auto'}`,
    );

    this.validateRegistrationInput(normalizedDto, demoMode);

    if (normalizedDto.password !== normalizedDto.confirmPassword) {
      throw new BadRequestException('Password confirmation does not match.');
    }

    const existing = await this.checkExistingAccount({
      phoneNumber: normalizedDto.phoneNumber,
      faydaFin: normalizedDto.faydaFin,
      email: normalizedDto.email,
    });

    if (existing.exists) {
      throw new ConflictException(existing.message);
    }

    let branch = await this.resolvePreferredBranch(normalizedDto);
    if (!branch && demoMode) {
      branch = await this.resolveOrCreateDemoBranch();
      if (branch) {
        this.logger.warn(
          `registerMember fallback branch assignment applied for ${normalizedDto.phoneNumber}: ${branch.name}`,
        );
      }
    }

    if (!branch) {
      throw new NotFoundException(
        'No branch could be assigned for the selected location.',
      );
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
      memberType: MemberType.MEMBER,
      role: UserRole.MEMBER,
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

    this.logger.log(
      `registerMember saved _id=${member._id.toString()} phone=${member.phone} customerId=${member.customerId} memberNumber=${member.memberNumber} kycStatus=${member.kycStatus} active=${member.isActive}`,
    );

    await this.runRegistrationSideEffect(
      demoMode,
      'member profile creation',
      normalizedDto.phoneNumber,
      async () => {
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
      },
    );

    const currentUser: AuthenticatedUser = {
      sub: member._id.toString(),
      role: UserRole.MEMBER,
      memberType: MemberType.MEMBER,
      phone: normalizedDto.phoneNumber,
      memberId: member._id.toString(),
      branchId: branch._id.toString(),
      districtId: branch.districtId.toString(),
    };

    await this.runRegistrationSideEffect(
      demoMode,
      'identity verification start',
      normalizedDto.phoneNumber,
      async () => {
        await this.identityVerificationService.start(
          currentUser,
          normalizedDto.consentAccepted,
        );
      },
    );

    if (normalizedDto.faydaFin) {
      await this.runRegistrationSideEffect(
        demoMode,
        'identity verification FIN submission',
        normalizedDto.phoneNumber,
        async () => {
          await this.identityVerificationService.submitFin(currentUser, {
            faydaFin: normalizedDto.faydaFin!,
            faydaAlias: normalizedDto.faydaAlias,
          });
        },
      );
    }

    if (normalizedDto.faydaQrData || normalizedDto.faydaAlias) {
      await this.runRegistrationSideEffect(
        demoMode,
        'identity verification QR upload',
        normalizedDto.phoneNumber,
        async () => {
          await this.identityVerificationService.uploadQr(currentUser, {
            qrDataRaw: normalizedDto.faydaQrData,
            faydaAlias: normalizedDto.faydaAlias,
          });
        },
      );
    }

    await this.runRegistrationSideEffect(
      demoMode,
      'registration notification',
      normalizedDto.phoneNumber,
      async () => {
        const notification = buildRegistrationCompletedNotification(demoMode);
        await this.notificationsService.createNotification({
          userType: 'member',
          userId: member._id.toString(),
          userRole: UserRole.MEMBER,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          entityType: 'kyc',
          entityId: member._id.toString(),
          actionLabel: 'Review KYC',
          priority: demoMode ? 'low' : 'normal',
          deepLink: '/fayda-verification',
        });
      },
    );

    await this.runRegistrationSideEffect(
      demoMode,
      'registration audit log',
      normalizedDto.phoneNumber,
      async () => {
        await this.auditService.logActorAction({
          actorId: member._id.toString(),
          actorRole: UserRole.MEMBER,
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
      },
    );

    return {
      customerId: identifiers.customerId,
      memberId: identifiers.memberId,
      message: demoMode
        ? 'Seeded registration completed successfully. Verification checks were bypassed.'
        : 'Registration submitted successfully. Fayda verification is pending review.',
    };
  }

  async loginMember(dto: MemberLoginDto): Promise<LoginResult> {
    const principal = await this.memberAuthRepository.findByCustomerId(
      dto.customerId,
    );

    return this.loginPrincipal(principal, dto.password, true);
  }

  async startLogin(dto: StartLoginDto): Promise<StartLoginResult> {
    const identifier =
      this.resolvePhoneNumber(dto) ?? dto.customerId?.trim();
    if (identifier == null || identifier.length === 0) {
      throw new BadRequestException('Phone number or customer ID is required.');
    }

    this.logger.log(`startLogin identifier=${identifier}`);

    const principal = await this.memberAuthRepository.findByCustomerId(identifier);
    if (!principal) {
      this.logger.warn(`startLogin no account found for identifier=${identifier}`);
      throw new UnauthorizedException('No matching member account was found.');
    }

    this.logger.log(
      `startLogin found member id=${principal.id} customerId=${principal.customerId} memberNumber=${principal.memberNumber} phone=${principal.phone}`,
    );

    const challengeId = new Types.ObjectId().toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.authSessionModel.create({
      memberId: new Types.ObjectId(principal.id),
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

  async verifyPinLogin(dto: VerifyPinLoginDto): Promise<LoginResult> {
    const authSession = await this.authSessionModel.findOne({
      challengeId: dto.challengeId,
      status: 'pending',
    });

    if (!authSession || authSession.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Login challenge expired or was not found.');
    }

    const member = await this.memberModel
      .findById(authSession.memberId)
      .populate({ path: 'branchId', select: 'name' })
      .populate({ path: 'districtId', select: 'name' });

    if (!member) {
      throw new UnauthorizedException('Member account not found.');
    }

    const effectivePinHash =
      member.pinHash ?? this.hashSecret(member.phone.substring(member.phone.length - 4));
    if (effectivePinHash != this.hashSecret(dto.pin)) {
      throw new UnauthorizedException('Invalid PIN.');
    }

    authSession.status = 'verified';
    authSession.verifiedAt = new Date();
    await authSession.save();

    if (dto.deviceId != null && dto.deviceId.length > 0) {
      await this.deviceModel.findOneAndUpdate(
        { memberId: member._id, deviceId: dto.deviceId },
        {
          $set: {
            rememberDevice: dto.rememberDevice ?? false,
            biometricEnabled: dto.biometricEnabled ?? false,
            lastLoginAt: new Date(),
          },
        },
        { upsert: true, new: true },
      );
    }

    const populatedBranch = member.branchId as unknown as
      | string
      | { _id?: { toString(): string }; name?: string };
    const populatedDistrict = member.districtId as unknown as
      | string
      | { _id?: { toString(): string }; name?: string };

    return this.loginPrincipal(
      {
        id: member._id.toString(),
        role: member.role,
        passwordHash: member.passwordHash,
        customerId: member.customerId,
        memberType: member.memberType,
        fullName: member.fullName,
        memberNumber: member.memberNumber,
        phone: member.phone,
        branchId:
          typeof populatedBranch === 'string'
            ? populatedBranch
            : populatedBranch?._id?.toString?.() ??
              (populatedBranch as { toString(): string }).toString(),
        districtId:
          typeof populatedDistrict === 'string'
            ? populatedDistrict
            : populatedDistrict?._id?.toString?.() ??
              (populatedDistrict as { toString(): string }).toString(),
        branchName:
          typeof populatedBranch === 'string' ? undefined : populatedBranch?.name,
        districtName:
          typeof populatedDistrict === 'string'
            ? undefined
            : populatedDistrict?.name,
      },
      dto.pin,
      true,
      { bypassPasswordCheck: true },
    );
  }

  async loginStaff(dto: StaffLoginDto): Promise<LoginResult> {
    const principal = await this.staffAuthRepository.findByIdentifier(
      dto.identifier,
    );

    return this.loginPrincipal(principal, dto.password, false);
  }

  async getCurrentSession(currentUser: AuthenticatedUser) {
    if (
      currentUser.role !== UserRole.MEMBER &&
      currentUser.role !== UserRole.SHAREHOLDER_MEMBER
    ) {
      throw new ForbiddenException(
        'Current session endpoint is member-only in this phase.',
      );
    }

    const principal = await this.memberModel
      .findById(currentUser.sub)
      .populate({ path: 'branchId', select: 'name' })
      .populate({ path: 'districtId', select: 'name' })
      .lean<
        | ({
            _id: { toString(): string };
            customerId: string;
            memberNumber: string;
            memberType: MemberType;
            fullName: string;
            phone: string;
            branchId: { _id?: { toString(): string }; name?: string } | string;
            districtId: { _id?: { toString(): string }; name?: string } | string;
          } & Record<string, unknown>)
        | null
      >();

    if (!principal) {
      throw new NotFoundException('Member not found.');
    }

    const profile = await this.memberProfilesService.findByMemberId(currentUser.sub);

    return {
      id: principal._id.toString(),
      role: currentUser.role,
      customerId: principal.customerId,
      memberType: principal.memberType,
      fullName: principal.fullName,
      memberNumber: principal.memberNumber,
      branchId:
        typeof principal.branchId === 'string'
          ? principal.branchId
          : principal.branchId?._id?.toString?.() ??
            (principal.branchId as unknown as { toString(): string }).toString(),
      districtId:
        typeof principal.districtId === 'string'
          ? principal.districtId
          : principal.districtId?._id?.toString?.() ??
            (principal.districtId as unknown as { toString(): string }).toString(),
      branchName:
        typeof principal.branchId === 'string' ? undefined : principal.branchId?.name,
      districtName:
        typeof principal.districtId === 'string'
          ? undefined
          : principal.districtId?.name,
      phone: principal.phone,
      membershipStatus: profile?.membershipStatus ?? 'pending_verification',
      identityVerificationStatus:
        profile?.identityVerificationStatus ?? 'not_started',
      featureFlags: {
        voting: principal.memberType === MemberType.SHAREHOLDER,
        announcements: principal.memberType === MemberType.SHAREHOLDER,
        dividends: principal.memberType === MemberType.SHAREHOLDER,
        schoolPayment: true,
        loans: true,
        savings: true,
        liveChat: true,
      },
    };
  }

  async requestOtp(dto: RequestOtpDto) {
    const phoneNumber = this.resolveRequiredPhoneNumber(dto);
    const email = dto.email?.trim().toLowerCase();
    const purpose = dto.purpose?.trim() || 'general';
    let recoveryMember: Pick<MemberDocument, '_id' | 'phone' | 'email'> | null =
      null;

    if (purpose === 'pin_recovery') {
      recoveryMember = await this.memberModel
        .findOne({ phone: phoneNumber })
        .select('_id phone email');
      if (!recoveryMember) {
        throw new NotFoundException('No account was found for this phone number.');
      }
    }

    const storedRecoveryEmail = recoveryMember?.email?.trim().toLowerCase();
    const channel =
      dto.preferredOtpChannel === 'email' && (email || storedRecoveryEmail)
        ? NotificationChannel.EMAIL
        : NotificationChannel.SMS;

    if (purpose === 'pin_recovery') {
      if (
        channel === NotificationChannel.EMAIL &&
        !storedRecoveryEmail
      ) {
        throw new BadRequestException(
          'No email address is available for PIN recovery on this member profile.',
        );
      }
    }

    const otpCode = this.generateOtpCode();
    const destination =
      channel === NotificationChannel.EMAIL
        ? storedRecoveryEmail ?? email ?? phoneNumber
        : phoneNumber;

    if (channel === NotificationChannel.EMAIL && !email) {
      if (!storedRecoveryEmail) {
        throw new BadRequestException(
          'Email address is required when email OTP delivery is selected.',
        );
      }
    }

    const deliveryResult =
      channel === NotificationChannel.EMAIL
        ? await this.emailNotificationProvider.send({
            channel,
            recipient: destination,
            memberId: 'otp-pre-registration',
            category: NotificationCategory.LOAN,
            subject: 'Bunna Bank OTP Verification Code',
            messageBody: `Your Bunna Bank verification code is ${otpCode}. It expires soon.`,
            htmlBody: `<p>Your Bunna Bank verification code is <strong>${otpCode}</strong>.</p><p>It expires soon.</p>`,
          })
        : await this.smsNotificationProvider.send({
            channel,
            recipient: destination,
            memberId: 'otp-pre-registration',
            category: NotificationCategory.LOAN,
            messageBody: `Bunna Bank OTP: ${otpCode}. It expires soon.`,
          });

    this.logger.log(
      `requestOtp phone=${phoneNumber} channel=${channel} destination=${destination} status=${deliveryResult.status}`,
    );

    return {
      phoneNumber,
      email: storedRecoveryEmail ?? email,
      purpose,
      deliveryChannel: channel,
      maskedDestination:
        channel === NotificationChannel.EMAIL
          ? this.maskEmail(destination)
          : this.maskPhoneNumber(destination),
      status: 'otp_requested',
      reference: `OTP-${Date.now()}`,
      providerStatus: deliveryResult.status,
    };
  }

  async getRecoveryOptions(dto: RecoveryOptionsDto) {
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
      throw new NotFoundException(
        'No account was found for the provided phone number or email address.',
      );
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

  async verifyOtp(dto: VerifyOtpDto) {
    const phoneNumber = this.resolveRequiredPhoneNumber(dto);

    return {
      phoneNumber,
      verified: dto.otpCode.length >= 4,
      status: dto.otpCode.length >= 4 ? 'verified' : 'failed',
    };
  }

  async resetPin(dto: ResetPinDto) {
    const phoneNumber = this.resolveRequiredPhoneNumber(dto);
    const email = dto.email?.trim().toLowerCase();

    if (dto.newPin !== dto.confirmPin) {
      throw new BadRequestException('PIN confirmation does not match.');
    }

    if (!/^\d{4,6}$/.test(dto.newPin)) {
      throw new BadRequestException('PIN must be 4 to 6 digits.');
    }

    const member = await this.memberModel.findOne({ phone: phoneNumber });
    if (!member) {
      throw new NotFoundException('No account was found for this phone number.');
    }

    if (email && member.email && member.email.toLowerCase() !== email) {
      throw new BadRequestException(
        'The email address does not match the member profile.',
      );
    }

    member.pinHash = this.hashSecret(dto.newPin);
    await member.save();

    this.logger.log(
      `resetPin member=${member._id.toString()} phone=${phoneNumber} via=${email ? 'phone_email' : 'phone'}`,
    );

    return {
      status: 'pin_reset',
      phoneNumber,
      message: 'PIN updated successfully.',
    };
  }

  async logout(currentUser: AuthenticatedUser) {
    await this.authSessionModel.updateMany(
      {
        memberId: currentUser.sub,
        status: { $in: ['pending', 'verified'] },
      },
      {
        $set: {
          status: 'logged_out',
          loggedOutAt: new Date(),
        },
      },
    );

    return { success: true };
  }

  async refreshTokens(
    currentUser: AuthenticatedUser,
    _dto: RefreshTokenDto,
  ): Promise<AuthTokens> {
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

  async validateJwtPayload(
    payload: AuthenticatedUser,
  ): Promise<AuthenticatedUser> {
    if (!payload?.sub || !payload?.role) {
      throw new UnauthorizedException('Invalid authentication payload.');
    }

    return payload;
  }

  private async loginPrincipal(
    principal: AuthPrincipal | null,
    plainPassword: string,
    requireMemberRole: boolean,
    options: { bypassPasswordCheck?: boolean } = {},
  ): Promise<LoginResult> {
    if (!principal) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordIsValid = options.bypassPasswordCheck
      ? true
      : await this.verifyPassword(
          plainPassword,
          principal.passwordHash,
        );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (
      requireMemberRole &&
      principal.role !== UserRole.MEMBER &&
      principal.role !== UserRole.SHAREHOLDER_MEMBER
    ) {
      throw new ForbiddenException(
        'Principal is not allowed to use member login.',
      );
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
        type: NotificationType.LOGIN_DETECTED,
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
        permissions:
          principal.permissions ??
          (principal.staffNumber ? deriveStaffPermissions(principal.role) : undefined),
        phone: principal.phone,
        membershipStatus: profile?.membershipStatus,
        identityVerificationStatus: profile?.identityVerificationStatus,
        featureFlags: this.buildFeatureFlags(principal),
      },
    };
  }

  private buildFeatureFlags(principal: AuthPrincipal) {
    if (
      principal.role !== UserRole.MEMBER &&
      principal.role !== UserRole.SHAREHOLDER_MEMBER
    ) {
      return undefined;
    }

    return {
      voting: principal.memberType === MemberType.SHAREHOLDER,
      announcements: principal.memberType === MemberType.SHAREHOLDER,
      dividends: principal.memberType === MemberType.SHAREHOLDER,
      schoolPayment: true,
      loans: true,
      savings: true,
      liveChat: true,
    };
  }

  private async buildTokens(principal: AuthPrincipal): Promise<AuthTokens> {
    const auth = this.configService.getOrThrow<{
      accessTokenExpiresIn: string;
      refreshTokenExpiresIn: string;
      jwtIssuer: string;
      jwtAudience: string;
    }>('auth');

    const payload: AuthenticatedUser = {
      sub: principal.id,
      role: principal.role,
      customerId: principal.customerId,
      identifier: principal.identifier,
      email: principal.email,
      memberType: principal.memberType,
      fullName: principal.fullName,
      phone: principal.phone,
      memberId:
        principal.role === UserRole.MEMBER ||
        principal.role === UserRole.SHAREHOLDER_MEMBER
          ? principal.id
          : undefined,
      staffId:
        principal.role === UserRole.MEMBER ||
        principal.role === UserRole.SHAREHOLDER_MEMBER
          ? undefined
          : principal.id,
      schoolId: principal.schoolId,
      schoolName: principal.schoolName,
      branchId: principal.branchId,
      branchName: principal.branchName,
      districtId: principal.districtId,
      districtName: principal.districtName,
      permissions:
        principal.permissions ??
        (principal.staffNumber ? deriveStaffPermissions(principal.role) : undefined),
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

  private async verifyPassword(
    plainPassword: string,
    passwordHash: string,
  ): Promise<boolean> {
    return (
      plainPassword.length > 0 &&
      (passwordHash === hashSecret(plainPassword) || passwordHash === plainPassword)
    );
  }

  private async generateStandardIdentifiers() {
    const totalMembers = await this.memberModel.countDocuments();
    const sequence = String(totalMembers + 1).padStart(6, '0');
    return {
      customerId: `BUN-${sequence}`,
      memberId: `BUN-${sequence}`,
    };
  }

  private async generateDemoIdentifiers() {
    const members = await this.memberModel
      .find({
        $or: [
          { customerId: /^CUST-\d+$/i },
          { memberNumber: /^MBR-\d+$/i },
        ],
      })
      .select('customerId memberNumber')
      .lean<Array<{ customerId?: string; memberNumber?: string }>>();

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

  private hashSecret(value: string) {
    return hashSecret(value);
  }

  private async resolvePreferredBranch(dto: RegisterMemberDto) {
    if (dto.preferredBranchId) {
      const branch = await this.branchModel
        .findOne({
          _id: dto.preferredBranchId,
          isActive: true,
        })
        .lean<BranchDocument | null>();

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
        .lean<BranchDocument | null>();

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
      .lean<BranchDocument | null>();

    if (cityBranch) {
      return cityBranch;
    }

    return this.branchModel
      .findOne({
        region: dto.region,
        isActive: true,
      })
      .sort({ name: 1 })
      .lean<BranchDocument | null>();
  }

  private isDemoMode() {
    return this.configService.get<boolean>('DEMO_MODE') === true;
  }

  private validateRegistrationInput(dto: RegisterMemberDto, demoMode: boolean) {
    if (!dto.faydaFin && !dto.faydaQrData) {
      throw new BadRequestException(
        'Fayda FIN or Fayda QR data is required for secure onboarding.',
      );
    }

    if (dto.faydaFin && !/^\d{12}$/.test(dto.faydaFin)) {
      throw new BadRequestException('Fayda FIN must be exactly 12 digits.');
    }

    if (!demoMode) {
      if (!dto.dateOfBirth || Number.isNaN(new Date(dto.dateOfBirth).getTime())) {
        throw new BadRequestException('Date of birth is required.');
      }

      if (!dto.region?.trim()) {
        throw new BadRequestException('Region is required.');
      }

      if (!dto.city?.trim()) {
        throw new BadRequestException('City is required.');
      }

      if (!dto.consentAccepted) {
        throw new BadRequestException('Consent must be accepted.');
      }

      if (dto.password.length < 8) {
        throw new BadRequestException(
          'Password must be at least 8 characters long.',
        );
      }

      if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(dto.password)) {
        throw new BadRequestException(
          'Password must include at least one letter and one number.',
        );
      }
    }
  }

  private normalizeRegistrationDto(
    dto: RegisterMemberDto,
    demoMode: boolean,
  ): RegisterMemberDto & {
    dateOfBirth: string;
    region: string;
    city: string;
    consentAccepted: boolean;
  } {
    const phoneNumber = this.resolveRequiredPhoneNumber(dto);
    const fallbackPassword =
      dto.password?.trim() || phoneNumber.slice(-4) || '1234';

    return {
      ...dto,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phoneNumber,
      phone: phoneNumber,
      email: dto.email?.trim() || undefined,
      dateOfBirth:
        (dto.dateOfBirth?.trim().length ?? 0) > 0
          ? dto.dateOfBirth!.trim()
          : demoMode
            ? '1995-01-15'
            : '',
      region:
        (dto.region?.trim().length ?? 0) > 0
          ? dto.region!.trim()
          : demoMode
            ? 'Addis Ababa'
            : '',
      city:
        (dto.city?.trim().length ?? 0) > 0
          ? dto.city!.trim()
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

  private async resolveAnyActiveBranch() {
    return this.branchModel
      .findOne({ isActive: true })
      .sort({ name: 1 })
      .lean<BranchDocument | null>();
  }

  private async resolveOrCreateDemoBranch() {
    const existingBranch = await this.resolveAnyActiveBranch();
    if (existingBranch) {
      return existingBranch;
    }

    let district = await this.districtModel
      .findOne({ code: 'demo_district' })
      .lean<DistrictDocument | null>();

    if (!district) {
      district = await this.districtModel.create({
        code: 'demo_district',
        name: 'Addis Central District',
        isActive: true,
      });
    }

    const existingDemoBranch = await this.branchModel
      .findOne({ code: 'demo_branch' })
      .lean<BranchDocument | null>();

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

  private async ensureDemoMemberAccount() {
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
      this.logger.log(
        `Demo bootstrap found existing seeded member customerId=${existingDemoMember.customerId} phone=${existingDemoMember.phone}; skipping destructive overwrite.`,
      );
      return;
    }

    const demoMember = await this.memberModel.create({
      customerId: 'BUN-100001',
      memberNumber: 'BUN-100001',
      memberType: MemberType.MEMBER,
      role: UserRole.MEMBER,
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

    this.logger.log(
      `Ensured seeded member account customerId=BUN-100001 memberNumber=BUN-100001 phone=${demoPhone}`,
    );
  }

  private async runRegistrationSideEffect(
    demoMode: boolean,
    step: string,
    phoneNumber: string,
    action: () => Promise<void>,
  ) {
    try {
      await action();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown registration error.';
      this.logger.error(
        `Registration ${step} failed for ${phoneNumber}: ${message}`,
      );

      if (!demoMode) {
        throw error;
      }
    }
  }

  private resolvePhoneNumber(dto: { phoneNumber?: string; phone?: string }) {
    const rawPhone = dto.phoneNumber?.trim() || dto.phone?.trim();
    if (!rawPhone) {
      return undefined;
    }

    return this.normalizePhoneNumber(rawPhone);
  }

  private resolveRequiredPhoneNumber(dto: { phoneNumber?: string; phone?: string }) {
    const phoneNumber = this.resolvePhoneNumber(dto);
    if (!phoneNumber) {
      throw new BadRequestException('Phone number is required.');
    }

    return phoneNumber;
  }

  private resolveOnboardingRequiredAction(
    onboardingReviewStatus: string,
    identityVerificationStatus: string,
  ) {
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

  private resolveOnboardingStatusMessage(
    onboardingReviewStatus: string,
    onboardingReviewNote?: string,
  ) {
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

  private generateOtpCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private maskPhoneNumber(phoneNumber: string) {
    if (phoneNumber.length <= 4) {
      return phoneNumber;
    }

    return `${phoneNumber.substring(0, 2)}${'*'.repeat(
      phoneNumber.length - 4,
    )}${phoneNumber.substring(phoneNumber.length - 2)}`;
  }

  private maskEmail(email: string) {
    const [localPart, domain = ''] = email.split('@');
    if (!localPart) {
      return email;
    }

    const visibleLocal = localPart.length <= 1 ? localPart : localPart[0];
    return `${visibleLocal}${'*'.repeat(
      Math.max(localPart.length - 1, 1),
    )}@${domain}`;
  }

  private normalizePhoneNumber(value: string) {
    const digitsOnly = value.replace(/\D/g, '');

    if (digitsOnly.startsWith('251') && digitsOnly.length === 12) {
      return `0${digitsOnly.slice(3)}`;
    }

    if (digitsOnly.length === 9 && !digitsOnly.startsWith('0')) {
      return `0${digitsOnly}`;
    }

    return digitsOnly.length > 0 ? digitsOnly : value.trim();
  }
}

function hashSecret(value: string) {
  return createHash('sha256').update(value).digest('hex');
}
