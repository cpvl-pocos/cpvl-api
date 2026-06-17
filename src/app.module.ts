import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PilotsModule } from './pilots/pilots.module';
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
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}.local`,
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env',
      ],
    }),
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT'), 10),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        models: [User, Pilot, PaymentMonthly, EmergencyContact, LicenseData],
        autoLoadModels: true,
        synchronize: false,
        pool: {
          max: 10,
          min: 2,
          acquire: 30000,
          idle: 10000,
        },
        logging: configService.get<string>('NODE_ENV') === 'development'
          ? console.log
          : false,
      }),
    }),
    AuthModule,
    PilotsModule,
    UsersModule,
    PaymentMonthlyModule,
    EmergencyContactsModule,
    LicenseDataModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
