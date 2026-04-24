import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'decorators';
import { PilotsService } from './pilots.service';
import { ERoles, PassportRequest } from '../types';
import { UpdatePilotProfileDto } from './dto/update-pilot-profile.dto';

@Controller({
  path: 'pilots',
})
export class PilotsController {
  constructor(private pilotsService: PilotsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN, ERoles.FISCAL, ERoles.PILOTO)
  async getAllPilots() {
    return this.pilotsService.getAllPilots();
  }

  /**
   * Returns only pilots authorized to fly (filiado + confirmed payment).
   * Now filters at SQL level instead of fetching all and filtering in JS.
   */
  @Get('/status-list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN, ERoles.FISCAL, ERoles.PILOTO)
  async getPilotsByStatus() {
    return this.pilotsService.getAuthorizedPilots();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN)
  @Get('/statusCadastral')
  async getStatusCadastral() {
    const pilots = await this.pilotsService.getStatusCadastral();
    return {
      success: true,
      count: pilots.length,
      data: pilots,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN)
  @Get('/validStatusCadastral')
  async getValidStatusCadastral() {
    return this.pilotsService.getValidStatusCadastral();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN)
  @Get('/statusPayment')
  async getStatusPayment() {
    const pilots = await this.pilotsService.getStatusPayment();
    return {
      success: true,
      count: pilots.length,
      data: pilots,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN)
  @Get('/validStatusPayment')
  async getValidStatusPayment() {
    return this.pilotsService.getValidStatusPayment();
  }

  @Patch('/statusPilot')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN)
  async updatePilotStatus(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('status') status: string,
  ) {
    if (!status) {
      throw new BadRequestException('status é obrigatório');
    }

    const validStatusCadastral =
      await this.pilotsService.getValidStatusCadastral();

    if (!validStatusCadastral.includes(status)) {
      throw new BadRequestException(
        `Status deve ser um dos seguintes: ${validStatusCadastral.join(', ')}`,
      );
    }

    const pilot = await this.pilotsService.updatePilotStatus(userId, status);

    return {
      message: 'Status do piloto atualizado com sucesso',
      pilot,
    };
  }

  @Patch('/batch-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN)
  async batchUpdateStatus(
    @Body('userIds') userIds: number[],
    @Body('status') status: string,
  ) {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestException('userIds deve ser um array não vazio');
    }
    if (!status) {
      throw new BadRequestException('status é obrigatório');
    }

    const results = await this.pilotsService.batchUpdateStatus(userIds, status);
    return {
      message: 'Ação em lote processada',
      results,
    };
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN, ERoles.FISCAL, ERoles.PILOTO)
  async getPilotByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.pilotsService.getPilotByUserId(userId);
  }

  @Get('/pilot/:cpf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.PILOTO)
  async getInfo(@Param('cpf') cpf: string) {
    const pilot = await this.pilotsService.getInfo(cpf);
    if (!pilot) {
      throw new NotFoundException(
        'Nenhum piloto encontrado para o CPF informado.',
      );
    }
    return pilot;
  }

  @Patch('/me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN, ERoles.FISCAL, ERoles.PILOTO)
  async updateMyProfile(
    @Req() req: PassportRequest,
    @Body() profileData: UpdatePilotProfileDto,
  ) {
    const userId = req.user.id;
    const result = await this.pilotsService.updatePilotProfile(
      userId,
      profileData,
    );
    return {
      success: true,
      message: 'Cadastro atualizado com sucesso',
      data: result,
    };
  }
}
