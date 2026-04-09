import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import type { AuthenticatedUser } from '../auth/interfaces';
import { StorageService } from '../../common/storage/storage.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly storageService: StorageService) {}

  @UseGuards(JwtAuthGuard)
  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile()
    file:
      | {
          originalname: string;
          mimetype: string;
          buffer: Buffer;
          size: number;
        }
      | undefined,
    @Body() dto: UploadDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    if (!dto.domain?.trim()) {
      throw new BadRequestException('Document domain is required.');
    }

    const safeEntityId =
      dto.entityId != null && dto.entityId.trim().length > 0
        ? dto.entityId.trim()
        : `upload_${Date.now()}`;

    const stored = await this.storageService.storeBinaryDocument({
      domain: dto.domain.trim(),
      entityId: safeEntityId,
      originalFileName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
      metadata: {
        documentType: dto.documentType,
      },
    });

    return {
      provider: stored.provider,
      storageKey: stored.storageKey,
      originalFileName: stored.originalFileName,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      entityId: safeEntityId,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPPORT_AGENT,
    UserRole.BRANCH_MANAGER,
    UserRole.DISTRICT_OFFICER,
    UserRole.DISTRICT_MANAGER,
    UserRole.HEAD_OFFICE_OFFICER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Get('documents')
  async getDocument(
    @CurrentUser() _currentUser: AuthenticatedUser,
    @Query('storageKey') storageKey: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!storageKey?.trim()) {
      throw new BadRequestException('storageKey is required.');
    }

    const stored = await this.storageService.readStoredDocument(storageKey.trim());

    response.setHeader(
      'Content-Type',
      stored.mimeType ?? 'application/octet-stream',
    );
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(stored.originalFileName)}"`,
    );

    return stored.buffer;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPPORT_AGENT,
    UserRole.BRANCH_MANAGER,
    UserRole.DISTRICT_OFFICER,
    UserRole.DISTRICT_MANAGER,
    UserRole.HEAD_OFFICE_OFFICER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Get('documents/metadata')
  async getDocumentMetadata(
    @CurrentUser() _currentUser: AuthenticatedUser,
    @Query('storageKey') storageKey: string | undefined,
  ) {
    if (!storageKey?.trim()) {
      throw new BadRequestException('storageKey is required.');
    }

    return this.storageService.getStoredDocumentMetadata(storageKey.trim());
  }
}
