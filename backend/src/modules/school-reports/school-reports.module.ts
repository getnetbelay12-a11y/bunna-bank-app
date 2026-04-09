import { Module } from '@nestjs/common';

import { SchoolReportsController } from './school-reports.controller';
import { SchoolReportsService } from './school-reports.service';

@Module({
  controllers: [SchoolReportsController],
  providers: [SchoolReportsService],
  exports: [SchoolReportsService],
})
export class SchoolReportsModule {}
