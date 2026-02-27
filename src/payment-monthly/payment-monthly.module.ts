import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import PaymentMonthly from 'models/paymentmonthly.model';
import { PaymentMonthlyService } from './payment-monthly.service';
import { PaymentMonthlyController } from './payment-monthly.controller';
import Pilots from 'models/pilots.model';
import { MailModule } from 'mail/mail.module';

@Module({
  imports: [SequelizeModule.forFeature([Pilots, PaymentMonthly]), MailModule],
  controllers: [PaymentMonthlyController],
  providers: [PaymentMonthlyService],
  exports: [PaymentMonthlyService],
})
export class PaymentMonthlyModule {}
