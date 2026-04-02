import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateNotificationTemplateDto, UpdateNotificationTemplateDto } from './dto';
import {
  getNotificationTemplateDefinition,
  NOTIFICATION_TEMPLATE_DEFINITIONS,
} from './notification-template.registry';
import {
  NotificationTemplate,
  NotificationTemplateDocument,
} from './schemas/notification-template.schema';

@Injectable()
export class NotificationTemplateService {
  constructor(
    @InjectModel(NotificationTemplate.name)
    private readonly notificationTemplateModel: Model<NotificationTemplateDocument>,
  ) {}

  async listTemplates() {
    const storedTemplates = await this.notificationTemplateModel
      .find({})
      .sort({ category: 1, templateType: 1 })
      .lean<NotificationTemplateDocument[]>();

    const storedByType = new Map(
      storedTemplates.map((item) => [item.templateType, item]),
    );

    return NOTIFICATION_TEMPLATE_DEFINITIONS.map((definition) => {
      const stored = storedByType.get(definition.templateType);

      return stored ?? {
        _id: definition.templateType,
        category: definition.category,
        templateType: definition.templateType,
        title: definition.title,
        subject: definition.subject,
        messageBody: definition.messageBody,
        channelDefaults: definition.channelDefaults,
        isActive: true,
      };
    });
  }

  async createTemplate(dto: CreateNotificationTemplateDto) {
    return this.notificationTemplateModel.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });
  }

  async updateTemplate(templateId: string, dto: UpdateNotificationTemplateDto) {
    const template = await this.notificationTemplateModel.findByIdAndUpdate(
      templateId,
      { $set: dto },
      { new: true },
    );

    if (!template) {
      throw new NotFoundException('Notification template not found.');
    }

    return template;
  }

  async getTemplateByType(templateType: string) {
    const template = await this.notificationTemplateModel.findOne({
      templateType,
      isActive: true,
    });

    if (template) {
      return template;
    }

    const definition = getNotificationTemplateDefinition(templateType);
    if (!definition) {
      throw new NotFoundException('Active notification template not found.');
    }

    return {
      _id: definition.templateType,
      category: definition.category,
      templateType: definition.templateType,
      title: definition.title,
      subject: definition.subject,
      messageBody: definition.messageBody,
      channelDefaults: definition.channelDefaults,
      isActive: true,
    };
  }
}
