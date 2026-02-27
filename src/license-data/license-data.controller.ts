import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
  Patch,
} from '@nestjs/common';
import { LicenseDataService } from './license-data.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PassportRequest } from '../types';

@Controller('license-data')
@UseGuards(JwtAuthGuard)
export class LicenseDataController {
  constructor(private readonly licenseDataService: LicenseDataService) {}

  @Get('pending')
  async findPending(@Req() req: PassportRequest) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException(
        'Apenas administradores podem ver pendências.',
      );
    }
    return this.licenseDataService.findPending();
  }

  @Get(':userId')
  async findByUserId(@Param('userId') userId: string) {
    return this.licenseDataService.findByUserId(+userId);
  }

  @Post()
  async createOrUpdate(
    @Req() req: PassportRequest,
    @Body()
    body: {
      userId: number;
      civl?: string;
      pilotLevel?: string;
      cbvlExpiration?: Date;
      imgCbvl?: string;
      anacExpiration?: Date;
      imgAnac?: string;
    },
  ) {
    // Only the user can update their own license data
    if (req.user.id !== body.userId) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar esses dados.',
      );
    }
    return this.licenseDataService.createOrUpdate(body);
  }

  @Delete(':userId')
  async delete(@Req() req: PassportRequest, @Param('userId') userId: string) {
    if (req.user.id !== +userId) {
      throw new ForbiddenException(
        'Você não tem permissão para remover esses dados.',
      );
    }
    return this.licenseDataService.delete(+userId);
  }

  @Patch(':userId/confirm')
  async confirm(@Req() req: PassportRequest, @Param('userId') userId: string) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException(
        'Apenas administradores podem confirmar documentos.',
      );
    }
    return this.licenseDataService.confirmLicense(+userId);
  }
}
