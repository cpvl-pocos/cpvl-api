import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { EmergencyContactsService } from './emergency-contacts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('emergency-contacts')
@UseGuards(JwtAuthGuard)
export class EmergencyContactsController {
  constructor(
    private readonly emergencyContactsService: EmergencyContactsService,
  ) {}

  @Get(':userId')
  async findByUserId(@Param('userId') userId: string) {
    return this.emergencyContactsService.findByUserId(+userId);
  }

  @Post()
  async createOrUpdate(
    @Body()
    body: {
      userId: number;
      bloodType?: string;
      emergencyPhone?: string;
      emergencyContactName?: string;
      allergies?: string;
    },
  ) {
    return this.emergencyContactsService.createOrUpdate(body);
  }

  @Delete(':userId')
  async delete(@Param('userId') userId: string) {
    return this.emergencyContactsService.delete(+userId);
  }
}
