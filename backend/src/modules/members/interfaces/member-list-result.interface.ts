import { MemberProfile } from './member-profile.interface';

export interface MemberListResult {
  items: MemberProfile[];
  total: number;
  page: number;
  limit: number;
}
