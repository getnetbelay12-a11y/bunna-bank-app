import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { CollectSchoolPaymentDto } from './dto/collect-school-payment.dto';
import { SchoolPaymentsService } from './school-payments.service';

@Controller('school-payments')
export class SchoolPaymentsController {
  constructor(private readonly schoolPaymentsService: SchoolPaymentsService) {}

  @Get()
  list(
    @Query('schoolId') schoolId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.schoolPaymentsService.list({ schoolId, studentId });
  }

  @Get('overview')
  getOverview() {
    return this.schoolPaymentsService.getOverview();
  }

  @Post('collect')
  collect(@Body() payload: CollectSchoolPaymentDto) {
    return this.schoolPaymentsService.collect(payload);
  }
}
