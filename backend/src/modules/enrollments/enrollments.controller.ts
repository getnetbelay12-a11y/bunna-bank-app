import { Controller, Get, Query } from '@nestjs/common';

import { EnrollmentsService } from './enrollments.service';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  list(@Query('schoolId') schoolId?: string, @Query('studentId') studentId?: string) {
    return this.enrollmentsService.list(schoolId, studentId);
  }

  @Get('overview')
  getOverview() {
    return this.enrollmentsService.getOverview();
  }
}
