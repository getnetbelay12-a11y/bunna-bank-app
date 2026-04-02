import { Model } from 'mongoose';
import { MemberDocument } from './schemas/member.schema';
import { MemberListResult, MemberProfile } from './interfaces';
import { CreateMemberDto, ListMembersQueryDto, UpdateMyProfileDto } from './dto';
export declare class MembersRepository {
    private readonly memberModel;
    constructor(memberModel: Model<MemberDocument>);
    findById(id: string): Promise<MemberProfile | null>;
    updateById(id: string, dto: UpdateMyProfileDto): Promise<MemberProfile>;
    create(dto: CreateMemberDto): Promise<MemberProfile>;
    list(query: ListMembersQueryDto): Promise<MemberListResult>;
    private toProfile;
}
