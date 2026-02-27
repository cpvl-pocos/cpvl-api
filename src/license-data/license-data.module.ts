import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LicenseDataController } from './license-data.controller';
import { LicenseDataService } from './license-data.service';
import { LicenseData } from '../models';

@Module({
  imports: [SequelizeModule.forFeature([LicenseData])],
  controllers: [LicenseDataController],
  providers: [LicenseDataService],
  exports: [LicenseDataService],
})
export class LicenseDataModule {}
