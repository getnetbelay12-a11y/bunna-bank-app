import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { GuardianStudentLinksController } from './guardian-student-links.controller';
import { GuardianStudentLinksService } from './guardian-student-links.service';
import {
  GuardianStudentLinkEntity,
  GuardianStudentLinkSchema,
} from './schemas/guardian-student-link.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GuardianStudentLinkEntity.name, schema: GuardianStudentLinkSchema },
    ]),
  ],
  controllers: [GuardianStudentLinksController],
  providers: [GuardianStudentLinksService],
  exports: [GuardianStudentLinksService],
})
export class GuardianStudentLinksModule {}
