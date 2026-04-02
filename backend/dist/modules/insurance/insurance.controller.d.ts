import { AuthenticatedUser } from '../auth/interfaces';
import { InsuranceAlertService } from './insurance-alert.service';
export declare class InsuranceController {
    private readonly insuranceAlertService;
    constructor(insuranceAlertService: InsuranceAlertService);
    getAlerts(currentUser: AuthenticatedUser): Promise<import("./interfaces").InsuranceAlertItem[]>;
    getExpiringThirtyDays(currentUser: AuthenticatedUser): Promise<import("./interfaces").InsuranceAlertItem[]>;
    getExpiringSevenDays(currentUser: AuthenticatedUser): Promise<import("./interfaces").InsuranceAlertItem[]>;
    getExpired(currentUser: AuthenticatedUser): Promise<import("./interfaces").InsuranceAlertItem[]>;
    getWithoutValidInsurance(currentUser: AuthenticatedUser): Promise<import("./interfaces").InsuranceAlertItem[]>;
}
