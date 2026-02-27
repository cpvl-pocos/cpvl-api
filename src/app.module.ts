import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PilotsModule } from 'pilots/pilots.module';
import { UsersModule } from 'users/users.module';
import { PaymentMonthlyModule } from './payment-monthly/payment-monthly.module';
import { EmergencyContactsModule } from './emergency-contacts/emergency-contacts.module';
import { LicenseDataModule } from './license-data/license-data.module';
import User from './models/users.model';
import Pilot from './models/pilots.model';
import PaymentMonthly from './models/paymentmonthly.model';
import EmergencyContact from './models/emergencycontact.model';
import LicenseData from './models/licenseData.model';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'apps/cpvl-api/.env'],
    }),
    SequelizeModule.forRootAsync({
      useFactory: async () => ({
        dialect: 'mysql',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        models: [User, Pilot, PaymentMonthly, EmergencyContact, LicenseData],
        autoLoadModels: true,
        synchronize: true,
      }),
    }),
    SequelizeModule.forFeature([
      User,
      Pilot,
      PaymentMonthly,
      EmergencyContact,
      LicenseData,
    ]),
    AuthModule,
    PilotsModule,
    UsersModule,
    PaymentMonthlyModule,
    EmergencyContactsModule,
    LicenseDataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
