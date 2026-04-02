import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Branch, BranchSchema } from '../members/schemas/branch.schema';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Branch.name, schema: BranchSchema }]),
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
