import { Model } from 'mongoose';
import { StaffDocument } from '../../staff/schemas/staff.schema';
import { AuthPrincipal } from '../interfaces';
import { StaffAuthRepository } from '../auth.types';
export declare class MongooseStaffAuthRepository implements StaffAuthRepository {
    private readonly staffModel;
    constructor(staffModel: Model<StaffDocument>);
    findByIdentifier(identifier: string): Promise<AuthPrincipal | null>;
}
