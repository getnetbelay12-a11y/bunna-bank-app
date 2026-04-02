import { Model } from 'mongoose';
import { MemberDocument } from '../../members/schemas/member.schema';
import { AuthPrincipal } from '../interfaces';
import { MemberAuthRepository } from '../auth.types';
export declare class MongooseMemberAuthRepository implements MemberAuthRepository {
    private readonly memberModel;
    private readonly logger;
    constructor(memberModel: Model<MemberDocument>);
    findByCustomerId(customerId: string): Promise<AuthPrincipal | null>;
}
