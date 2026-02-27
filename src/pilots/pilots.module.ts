import { Module } from '@nestjs/common';
import { PilotsController } from './pilots.controller';
import { PilotsService } from './pilots.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Pilots, User, EmergencyContact } from 'models';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Pilots, User, EmergencyContact]),
    MailModule,
  ],
  controllers: [PilotsController],
  providers: [PilotsService],
})
export class PilotsModule {}
