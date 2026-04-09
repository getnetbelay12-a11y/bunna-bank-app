import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { CreateGuardianStudentLinkDto } from './dto/create-guardian-student-link.dto';
import { UpdateGuardianStudentLinkDto } from './dto/update-guardian-student-link.dto';
import { GuardianStudentLinksService } from './guardian-student-links.service';

@Controller('guardian-student-links')
export class GuardianStudentLinksController {
  constructor(
    private readonly guardianStudentLinksService: GuardianStudentLinksService,
  ) {}

  @Get()
  list(
    @Query('studentId') studentId?: string,
    @Query('guardianId') guardianId?: string,
    @Query('memberCustomerId') memberCustomerId?: string,
    @Query('status') status?: string,
  ) {
    return this.guardianStudentLinksService.list({
      studentId,
      guardianId,
      memberCustomerId,
      status,
    });
  }

  @Get('overview')
  getOverview() {
    return this.guardianStudentLinksService.getOverview();
  }

  @Post()
  create(@Body() payload: CreateGuardianStudentLinkDto) {
    return this.guardianStudentLinksService.create(payload);
  }

  @Patch(':linkId')
  update(
    @Param('linkId') linkId: string,
    @Body() payload: UpdateGuardianStudentLinkDto,
  ) {
    return this.guardianStudentLinksService.update(linkId, payload);
  }
}
