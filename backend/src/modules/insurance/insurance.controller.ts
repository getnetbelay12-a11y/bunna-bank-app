import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { InsuranceAlertService } from './insurance-alert.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.BRANCH_MANAGER,
  UserRole.DISTRICT_OFFICER,
  UserRole.DISTRICT_MANAGER,
  UserRole.HEAD_OFFICE_OFFICER,
  UserRole.HEAD_OFFICE_MANAGER,
  UserRole.ADMIN,
)
@Controller('manager/insurance')
export class InsuranceController {
  constructor(private readonly insuranceAlertService: InsuranceAlertService) {}

  @Get('alerts')
  getAlerts(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.insuranceAlertService.getAlerts(currentUser);
  }

  @Get('alerts/expiring-30-days')
  getExpiringThirtyDays(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.insuranceAlertService.getAlertsByType(currentUser, 'expiring_30_days');
  }

  @Get('alerts/expiring-7-days')
  getExpiringSevenDays(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.insuranceAlertService.getAlertsByType(currentUser, 'expiring_7_days');
  }

  @Get('alerts/expired')
  getExpired(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.insuranceAlertService.getAlertsByType(currentUser, 'expired');
  }

  @Get('alerts/loan-without-valid-insurance')
  getWithoutValidInsurance(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.insuranceAlertService.getAlerts(currentUser).then((alerts) =>
      alerts.filter((item) =>
        ['loan_without_valid_insurance', 'loan_without_linked_insurance'].includes(
          item.alertType,
        ),
      ),
    );
  }
}
