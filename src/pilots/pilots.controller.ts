import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'decorators';
import { Response } from 'express';
import { PilotsService } from './pilots.service';
import { ERoles, PassportRequest } from '../types';
import { Pilots } from 'models';

@Controller({
  path: 'pilots',
})
export class PilotsController {
  constructor(private pilotsService: PilotsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN, ERoles.FISCAL, ERoles.PILOTO)
  async getAllPilots(@Req() req: PassportRequest, @Res() res: Response) {
    try {
      const pilots = await this.pilotsService.getAllPilots();
      res.json(pilots);
    } catch (error) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  @Get('/status-list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN, ERoles.FISCAL, ERoles.PILOTO)
  async getPilotsByStatus(@Res() res: Response) {
    try {
      const pilots = await this.pilotsService.getStatusCadastral();
      // Filtra apenas os filiados com pagamento em dia para a decolagem
      const authorized = pilots.filter((p) => {
        const isFiliado = (p.status || '').toLowerCase() === 'filiado';
        const hasPayment =
          p.paymentMonthlies &&
          p.paymentMonthlies.some((pm) => pm.status === 'Confirmado');
        return isFiliado && hasPayment;
      });
      res.json(authorized);
    } catch (error) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN)
  @Get('/statusCadastral')
  async getStatusCadastral(@Res() res: Response) {
    try {
      const pilots = await this.pilotsService.getStatusCadastral();
      return res.json({
        success: true,
        count: pilots.length,
        data: pilots,
      });
    } catch (error: any) {
      console.error('Erro controller /statusCadastral:', error?.stack ?? error);
      const statusCode = error instanceof NotFoundException ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        error:
          statusCode === 404
            ? 'Nenhum piloto encontrado'
            : 'Erro interno do servidor',
        message: error?.message ?? 'Erro desconhecido',
      });
    }
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
  async getStatusPayment(@Res() res: Response) {
    try {
      const pilots = await this.pilotsService.getStatusPayment();
      return res.json({
        success: true,
        count: pilots.length,
        data: pilots,
      });
    } catch (error: any) {
      console.error('Erro controller /statusPayment:', error?.stack ?? error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error?.message ?? 'Erro desconhecido',
      });
    }
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
    @Query('userId') userId: number,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    try {
      // Validação dos parâmetros
      if (!userId) {
        return res.status(400).json({
          error: 'Parâmetro obrigatório',
          message: 'userId é obrigatório',
        });
      }

      if (!status) {
        return res.status(400).json({
          error: 'Parâmetro obrigatório',
          message: 'status é obrigatório',
        });
      }

      // Validação dos valores possíveis para status
      const validStatusCadastral =
        await this.pilotsService.getValidStatusCadastral();

      if (!validStatusCadastral.includes(status)) {
        return res.status(400).json({
          error: 'Status inválido',
          message: `Status deve ser um dos seguintes: ${validStatusCadastral.join(
            ', ',
          )}`,
        });
      }

      const pilot = await this.pilotsService.updatePilotStatus(userId, status);

      res.json({
        message: 'Status do piloto atualizado com sucesso',
        pilot,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(404).json({
          error: 'Piloto não encontrado',
          message: error.message,
        });
      } else {
        res.status(500).json({
          error: 'Erro interno do servidor',
          message: error.message,
        });
      }
    }
  }

  @Patch('/batch-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN)
  async batchUpdateStatus(
    @Body('userIds') userIds: number[],
    @Body('status') status: string,
    @Res() res: Response,
  ) {
    try {
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          error: 'Parâmetro inválido',
          message: 'userIds deve ser um array não vazio',
        });
      }
      if (!status) {
        return res.status(400).json({
          error: 'Parâmetro obrigatório',
          message: 'status é obrigatório',
        });
      }
      const results = await this.pilotsService.batchUpdateStatus(
        userIds,
        status,
      );
      res.json({
        message: 'Ação em lote processada',
        results,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  @Get(':userId') // Rota para buscar piloto por ID/CPF
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN, ERoles.FISCAL, ERoles.PILOTO)
  async getPilotByUserId(
    @Param('userId') userId: number, // Captura o parâmetro 'id' da URL
    @Req() req: PassportRequest,
    @Res() res: Response,
  ) {
    try {
      const pilot = await this.pilotsService.getPilotByUserId(userId);
      res.json(pilot);
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(404).json({
          error: 'Piloto não encontrado',
          message: error.message,
        });
      } else {
        res.status(500).json({
          error: 'Erro interno do servidor',
          message: error.message,
        });
      }
    }
  }

  @Get('/pilot/:cpf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.PILOTO)
  async getInfo(@Param('cpf') cpf: string, @Res() res: Response) {
    const pilot = await this.pilotsService.getInfo(cpf);
    if (!pilot) {
      return res
        .status(201)
        .json({ message: 'Nenhum piloto encontrado para o CPF informado.' });
    }
    res.json(pilot);
  }

  @Patch('/me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN, ERoles.FISCAL, ERoles.PILOTO)
  async updateMyProfile(
    @Req() req: PassportRequest,
    @Body()
    profileData: {
      name?: string;
      cellphone?: string;
      email?: string;
      photoUrl?: string;
    },
    @Res() res: Response,
  ) {
    try {
      // Usa o userId do token JWT para garantir que só o próprio usuário edite
      const userId = req.user.id;
      const result = await this.pilotsService.updatePilotProfile(
        userId,
        profileData,
      );
      return res.json({
        success: true,
        message: 'Cadastro atualizado com sucesso',
        data: result,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(404).json({
          error: 'Piloto não encontrado',
          message: error.message,
        });
      }
      return res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }
}
