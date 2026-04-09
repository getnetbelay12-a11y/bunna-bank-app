import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AuthenticatedUser } from '../auth/interfaces';
import { RegisterDeviceTokenDto } from './dto';
import {
  DeviceToken,
  DeviceTokenDocument,
} from './schemas/device-token.schema';

@Injectable()
export class DeviceTokensService {
  constructor(
    @InjectModel(DeviceToken.name)
    private readonly deviceTokenModel: Model<DeviceTokenDocument>,
  ) {}

  async register(currentUser: AuthenticatedUser, dto: RegisterDeviceTokenDto) {
    const record = await this.deviceTokenModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(currentUser.sub),
        deviceId: dto.deviceId.trim(),
      },
      {
        $set: {
          platform: dto.platform,
          token: dto.token.trim(),
          appVersion: dto.appVersion.trim(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    return {
      id: record._id.toString(),
      userId: record.userId.toString(),
      deviceId: record.deviceId,
      platform: record.platform,
      token: record.token,
      appVersion: record.appVersion,
      updatedAt: record.updatedAt,
    };
  }

  async listForUser(userId: string) {
    return this.deviceTokenModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .lean<DeviceTokenDocument[]>();
  }
}
