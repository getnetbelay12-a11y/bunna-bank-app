import { Controller, Get } from '@nestjs/common';

import { SchoolReportsService } from './school-reports.service';

@Controller('school-reports')
export class SchoolReportsController {
  constructor(private readonly schoolReportsService: SchoolReportsService) {}

  @Get('collections-summary')
  getCollectionsSummary() {
    return this.schoolReportsService.getCollectionsSummary();
  }
}
