import { Body, Controller, Get, Post } from '@nestjs/common';

import { CreateSchoolDto } from './dto/create-school.dto';
import { InstitutionsService } from './institutions.service';

@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get('schools')
  getSchools() {
    return this.institutionsService.getSchools();
  }

  @Get('schools/overview')
  getOverview() {
    return this.institutionsService.getOverview();
  }

  @Post('schools')
  createSchool(@Body() payload: CreateSchoolDto) {
    return this.institutionsService.createSchool(payload);
  }
}
