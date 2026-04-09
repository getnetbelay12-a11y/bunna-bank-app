import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { UserRole } from '../../common/enums';
import { AuthenticatedUser } from './interfaces';
import { AuthSession, AuthSessionDocument } from './schemas/auth-session.schema';
import { Device, DeviceDocument } from './schemas/device.schema';
import {
  MemberSecuritySetting,
  MemberSecuritySettingDocument,
} from '../service-placeholders/schemas/member-security-setting.schema';

@Injectable()
export class AuthSecurityService {
  constructor(
    @InjectModel(AuthSession.name)
    private readonly authSessionModel: Model<AuthSessionDocument>,
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
    @InjectModel(MemberSecuritySetting.name)
    private readonly securityModel: Model<MemberSecuritySettingDocument>,
  ) {}

  async getSecurityOverview(currentUser: AuthenticatedUser) {
    const memberId = this.assertMemberAccess(currentUser);
    const [securitySetting, sessions, devices] = await Promise.all([
      this.securityModel
        .findOne({ memberId })
        .lean<MemberSecuritySettingDocument | null>(),
      this.authSessionModel
        .find({ memberId })
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean<AuthSessionDocument[]>(),
      this.deviceModel
        .find({ memberId })
        .sort({ updatedAt: -1 })
        .lean<DeviceDocument[]>(),
    ]);

    return {
      accountLockEnabled: securitySetting?.accountLockEnabled ?? false,
      highRiskActionVerification: true,
      sessions: sessions.map((session, index) => ({
        challengeId: session.challengeId,
        deviceId: session.deviceId,
        loginIdentifier: session.loginIdentifier,
        status: session.status,
        expiresAt: session.expiresAt?.toISOString(),
        verifiedAt: session.verifiedAt?.toISOString(),
        loggedOutAt: session.loggedOutAt?.toISOString(),
        createdAt: session.createdAt?.toISOString(),
        updatedAt: session.updatedAt?.toISOString(),
        isCurrent: index === 0 && session.status === 'verified',
      })),
      devices: devices.map((device, index) => ({
        deviceId: device.deviceId,
        rememberDevice: device.rememberDevice,
        biometricEnabled: device.biometricEnabled,
        lastLoginAt: device.lastLoginAt?.toISOString(),
        createdAt: device.createdAt?.toISOString(),
        updatedAt: device.updatedAt?.toISOString(),
        isCurrent: index === 0,
      })),
    };
  }

  async revokeSession(currentUser: AuthenticatedUser, challengeId: string) {
    const memberId = this.assertMemberAccess(currentUser);
    const session = await this.authSessionModel.findOneAndUpdate(
      {
        memberId,
        challengeId,
      },
      {
        $set: {
          status: 'logged_out',
          loggedOutAt: new Date(),
        },
      },
      { new: true },
    );

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    return {
      challengeId: session.challengeId,
      status: session.status,
      loggedOutAt: session.loggedOutAt?.toISOString(),
    };
  }

  private assertMemberAccess(currentUser: AuthenticatedUser) {
    if (
      currentUser.role !== UserRole.MEMBER &&
      currentUser.role !== UserRole.SHAREHOLDER_MEMBER
    ) {
      throw new ForbiddenException(
        'Security overview is only available to member sessions.',
      );
    }

    const memberId = currentUser.memberId ?? currentUser.sub;
    if (!Types.ObjectId.isValid(memberId)) {
      throw new ForbiddenException('Invalid member session.');
    }

    return new Types.ObjectId(memberId);
  }
}
