import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Branch, BranchDocument } from '../members/schemas/branch.schema';

const DEFAULT_REGION = 'National';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
  ) {}

  async getRegions() {
    const rows = await this.branchModel
      .find({ isActive: true })
      .select('region')
      .lean<Array<{ region?: string }>>();

    const regions = Array.from(
      new Set(
        rows
          .map((item) => item.region?.trim() || DEFAULT_REGION)
          .filter((item) => item.length > 0),
      ),
    ).sort();

    return regions.map((name) => ({ name }));
  }

  async getCities(region: string) {
    const rows = await this.branchModel
      .find({ isActive: true, region: region || DEFAULT_REGION })
      .select('city')
      .lean<Array<{ city?: string }>>();

    const cities = Array.from(
      new Set(
        rows
          .map((item) => item.city?.trim())
          .filter((item): item is string => Boolean(item && item.length > 0)),
      ),
    ).sort();

    return cities.map((name) => ({ name, region: region || DEFAULT_REGION }));
  }

  async getBranches(region?: string, city?: string) {
    const filter: Record<string, unknown> = { isActive: true };
    if (region) {
      filter.region = region;
    }
    if (city) {
      filter.city = city;
    }

    const rows = await this.branchModel
      .find(filter)
      .select('name city region')
      .sort({ name: 1 })
      .lean<Array<{ _id: { toString(): string }; name: string; city?: string; region?: string }>>();

    return rows.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      city: item.city ?? '',
      region: item.region ?? DEFAULT_REGION,
    }));
  }
}
