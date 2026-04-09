import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { GuardiansService } from './guardians.service';

@Controller('guardians')
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Get()
  list(@Query('studentId') studentId?: string) {
    return this.guardiansService.list(studentId);
  }

  @Get('overview')
  getOverview() {
    return this.guardiansService.getOverview();
  }

  @Post()
  create(@Body() payload: CreateGuardianDto) {
    return this.guardiansService.create(payload);
  }

  @Patch(':guardianId')
  update(
    @Param('guardianId') guardianId: string,
    @Body() payload: UpdateGuardianDto,
  ) {
    return this.guardiansService.update(guardianId, payload);
  }
}
