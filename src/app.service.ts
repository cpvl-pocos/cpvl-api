// app.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import User from './models/users.model';
import Pilot from './models/pilots.model';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,

    @InjectModel(Pilot)
    private readonly pilotModel: typeof Pilot,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }
}
