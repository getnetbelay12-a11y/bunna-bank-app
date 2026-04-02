import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  NotificationDispatchPayload,
  NotificationProviderPort,
} from './notification-provider.port';

@Injectable()
export class NotificationProviderService implements NotificationProviderPort {
  private readonly logger = new Logger(NotificationProviderService.name);

  constructor(private readonly configService: ConfigService) {}

  async dispatch(payload: NotificationDispatchPayload): Promise<boolean> {
    const config = this.configService.getOrThrow<{
      sms: {
        enabled: boolean;
        provider: string;
        senderId: string;
        endpoint: string;
        apiKey: string;
      };
      email: {
        enabled: boolean;
        provider: string;
        sender: string;
        endpoint: string;
        apiKey: string;
        smtpHost: string;
        smtpPort: number;
        smtpSecure: boolean;
        smtpUser: string;
        smtpPass: string;
      };
      push: {
        enabled: boolean;
        provider: string;
        endpoint: string;
        apiKey: string;
        firebaseProjectId: string;
        firebaseClientEmail: string;
        firebasePrivateKey: string;
      };
    }>('notifications');

    const channelResults = await Promise.all([
      this.dispatchPush(config.push, payload),
      this.dispatchSms(config.sms, payload),
      this.dispatchEmail(config.email, payload),
    ]);

    const enabledChannels = [
      config.push.enabled,
      config.sms.enabled,
      config.email.enabled,
    ].filter(Boolean).length;

    if (enabledChannels === 0) {
      this.logger.debug(
        `No outbound notification channels enabled for ${payload.userType}:${payload.userId}.`,
      );
      return true;
    }

    return channelResults.some(Boolean);
  }

  private async dispatchPush(
    config: {
      enabled: boolean;
      provider: string;
      endpoint: string;
      apiKey: string;
      firebaseProjectId: string;
      firebaseClientEmail: string;
      firebasePrivateKey: string;
    },
    payload: NotificationDispatchPayload,
  ): Promise<boolean> {
    if (!config.enabled) {
      return false;
    }

    if (config.provider === 'log') {
      this.logger.log(
        `Push notification queued in log mode for ${payload.userType}:${payload.userId} - ${payload.title}`,
      );
      return true;
    }

    if (config.provider === 'generic_http') {
      return this.postToGenericEndpoint(config.endpoint, config.apiKey, {
        channel: 'push',
        ...payload,
      });
    }

    if (config.provider === 'firebase') {
      if (
        !config.firebaseProjectId ||
        !config.firebaseClientEmail ||
        !config.firebasePrivateKey
      ) {
        this.logger.warn(
          'Firebase push provider is enabled but FIREBASE_* credentials are incomplete.',
        );
        return false;
      }

      this.logger.warn(
        'Firebase provider is configured but no firebase-admin integration is installed in this PoC yet.',
      );
      return false;
    }

    return false;
  }

  private async dispatchSms(
    config: {
      enabled: boolean;
      provider: string;
      senderId: string;
      endpoint: string;
      apiKey: string;
    },
    payload: NotificationDispatchPayload,
  ): Promise<boolean> {
    if (!config.enabled) {
      return false;
    }

    if (config.provider === 'log') {
      this.logger.log(
        `SMS notification queued in log mode for ${payload.userType}:${payload.userId} - ${payload.title}`,
      );
      return true;
    }

    if (config.provider === 'generic_http') {
      return this.postToGenericEndpoint(config.endpoint, config.apiKey, {
        channel: 'sms',
        senderId: config.senderId,
        ...payload,
      });
    }

    return false;
  }

  private async dispatchEmail(
    config: {
      enabled: boolean;
      provider: string;
      sender: string;
      endpoint: string;
      apiKey: string;
      smtpHost: string;
      smtpPort: number;
      smtpSecure: boolean;
      smtpUser: string;
      smtpPass: string;
    },
    payload: NotificationDispatchPayload,
  ): Promise<boolean> {
    if (!config.enabled) {
      return false;
    }

    if (config.provider === 'log') {
      this.logger.log(
        `Email notification queued in log mode for ${payload.userType}:${payload.userId} - ${payload.title}`,
      );
      return true;
    }

    if (config.provider === 'generic_http') {
      return this.postToGenericEndpoint(config.endpoint, config.apiKey, {
        channel: 'email',
        sender: config.sender,
        ...payload,
      });
    }

    if (config.provider === 'smtp') {
      if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
        this.logger.warn(
          'SMTP email provider is enabled but EMAIL_SMTP_* settings are incomplete.',
        );
        return false;
      }

      this.logger.warn(
        'SMTP provider is configured but no SMTP transport is installed in this PoC yet.',
      );
      return false;
    }

    return false;
  }

  private async postToGenericEndpoint(
    endpoint: string,
    apiKey: string,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    if (!endpoint) {
      this.logger.warn('Generic notification endpoint is missing.');
      return false;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      this.logger.warn(
        `Generic notification endpoint returned HTTP ${response.status}.`,
      );
      return false;
    }

    return true;
  }
}
