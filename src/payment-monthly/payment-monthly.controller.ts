// src/payment-monthly/payment-monthly.controller.ts
import {
  Controller,
  Get,
  Patch,
  Delete,
  Req,
  Res,
  NotFoundException,
  Body,
  BadRequestException,
  Post,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { PaymentMonthlyService } from './payment-monthly.service';
import { RolesGuard } from 'auth/guards/roles.guard';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { ERoles, PassportRequest } from 'types';
import { Roles } from 'decorators';

@Controller('paymentMonthly')
export class PaymentMonthlyController {
  constructor(private readonly paymentMonthlyService: PaymentMonthlyService) {}

  // IMPORTANTE: Endpoints específicos devem vir ANTES de rotas com parâmetros
  @Patch('confirmPayment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN)
  async confirmPayment(@Body() body: any, @Res() res: Response) {
    const { userId, ref_year, ref_month } = body;

    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException('userId inválido');
    }

    try {
      const updated = await this.paymentMonthlyService.confirmPayment(
        Number(userId),
        Number(ref_year),
        Number(ref_month),
      );

      if (!updated) {
        throw new NotFoundException(
          `Pagamento não encontrado para userId=${userId}, ${ref_year}-${ref_month}`,
        );
      }

      return res.json({ success: true, payment: updated });
    } catch (err: any) {
      console.error('[confirmPayment] Erro:', err);
      return res
        .status(500)
        .json({ error: 'Erro interno', message: err.message });
    }
  }

  @Patch('confirmPaymentBatch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN)
  async confirmPaymentBatch(@Body() body: any, @Res() res: Response) {
    const { payments } = body;

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      throw new BadRequestException('Array de pagamentos inválido ou vazio');
    }

    try {
      const confirmed = await this.paymentMonthlyService.confirmPaymentBatch(
        payments,
      );

      return res.json({
        success: true,
        confirmed: confirmed.length,
        payments: confirmed,
      });
    } catch (err: any) {
      console.error('[confirmPaymentBatch] Erro:', err);
      return res
        .status(500)
        .json({ error: 'Erro interno', message: err.message });
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN)
  async getAllPaymentMonthly(
    @Req() req: PassportRequest,
    @Res() res: Response,
  ) {
    try {
      const paymentMonthly =
        await this.paymentMonthlyService.getAllPaymentMonthly();
      return res.json(paymentMonthly);
    } catch (error: any) {
      console.error('[getAllPaymentMonthly] Erro:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN, ERoles.FISCAL, ERoles.PILOTO)
  async findPaymentMonthlybyUserId(
    @Param('userId') userIdParam: string,
    @Req() req: PassportRequest,
    @Res() res: Response,
    @Query('year') year?: string,
  ) {
    console.log('='.repeat(60));
    console.log('[findPaymentMonthly] REQUISIÇÃO RECEBIDA', {
      url: req.url,
      method: req.method,
    });
    console.log(
      '[findPaymentMonthly] Param userId:',
      userIdParam,
      'Query year:',
      year,
    );

    try {
      if (!userIdParam || isNaN(Number(userIdParam))) {
        console.error('[findPaymentMonthly] userId inválido:', userIdParam);
        return res
          .status(400)
          .json({ error: 'userId inválido', received: userIdParam });
      }

      if (year && !/^\d{4}$/.test(String(year))) {
        console.error('[findPaymentMonthly] year inválido:', year);
        return res.status(400).json({
          error: 'year inválido',
          message: 'Formato esperado: YYYY (ex: 2024)',
          received: year,
        });
      }

      const userId = Number(userIdParam);

      // Verificação de permissão somente se houver req.user (rotas públicas poderão acessar sem checar)
      if (req && (req as any).user) {
        const user = (req as any).user;
        console.log('[findPaymentMonthly] Usuário autenticado:', {
          id: user.id,
          role: user.role,
        });
        if (user.role === ERoles.PILOTO && Number(user.id) !== Number(userId)) {
          console.warn('[findPaymentMonthly] Acesso negado');
          return res.status(403).json({
            error: 'Acesso negado',
            message: 'Você só pode visualizar seus próprios pagamentos',
          });
        }
      } else {
        console.log(
          '[findPaymentMonthly] Rota acessada sem autenticação (req.user ausente)',
        );
      }

      const payments =
        await this.paymentMonthlyService.findPaymentMonthlybyUserId({
          userId,
          year,
        });

      console.log(
        `[findPaymentMonthly] ${payments.length} pagamento(s) encontrado(s)`,
      );

      return res.json(payments);
    } catch (err: any) {
      console.error('[findPaymentMonthly] ERRO INESPERADO:', err);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        message:
          process.env.NODE_ENV === 'development'
            ? err.message
            : 'Erro ao buscar pagamentos',
      });
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN, ERoles.PILOTO)
  async createPaymentMonthly(
    @Body() body: any,
    @Req() req: PassportRequest,
    @Res() res: Response,
  ) {
    try {
      const requiredFields = [
        'userId',
        'ref_month',
        // 'amount', // Calculated on backend now
        'type',
        'ref_year',
      ];
      const missingFields = requiredFields.filter((f) => !(f in body));

      if (missingFields.length > 0) {
        throw new BadRequestException(
          `Campos obrigatórios faltando: ${missingFields.join(', ')}`,
        );
      }

      if (req && (req as any).user) {
        if (
          (req as any).user.role === ERoles.PILOTO &&
          Number((req as any).user.id) !== Number(body.userId)
        ) {
          return res.status(403).json({
            error: 'Acesso negado',
            message: 'Você não pode criar pagamentos para outros usuários',
          });
        }
      }

      const payment = await this.paymentMonthlyService.createPaymentMonthly(
        body,
      );
      return res.status(201).json(payment);
    } catch (error: any) {
      console.error('[createPaymentMonthly] Erro:', error);
      if (error instanceof BadRequestException) {
        return res
          .status(400)
          .json({ error: 'Requisição inválida', message: error.message });
      }
      return res
        .status(500)
        .json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  @Post('sendReceiptEmail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN)
  async sendReceiptEmail(@Body() body: any, @Res() res: Response) {
    const { paymentId, userId, email, pilotName, selectedYear } = body;

    if (!paymentId || !userId || !email) {
      throw new BadRequestException('Dados inválidos para envio de recibo');
    }

    try {
      const payment = await this.paymentMonthlyService.getPaymentById(
        paymentId,
      );

      if (!payment) {
        throw new NotFoundException('Pagamento não encontrado');
      }

      await this.paymentMonthlyService.sendReceiptEmail(
        email,
        pilotName,
        payment,
        selectedYear,
      );

      return res.json({ success: true, message: 'Recibo enviado com sucesso' });
    } catch (err: any) {
      console.error('[sendReceiptEmail] Erro:', err);
      return res
        .status(500)
        .json({ error: 'Erro ao enviar recibo', message: err.message });
    }
  }

  @Delete(':userId/:ref_year/:ref_month')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN, ERoles.PILOTO)
  async deletePaymentMonthly(
    @Param('userId') userId: string,
    @Param('ref_year') ref_year: string,
    @Param('ref_month') ref_month: string,
    @Req() req: PassportRequest,
    @Res() res: Response,
  ) {
    try {
      if (!userId || isNaN(Number(userId))) {
        throw new BadRequestException('userId inválido');
      }

      if (!ref_year || isNaN(Number(ref_year))) {
        throw new BadRequestException('ref_year inválido');
      }

      if (!ref_month || isNaN(Number(ref_month))) {
        throw new BadRequestException('ref_month inválido');
      }

      // Verificação de permissão: PILOTO só pode deletar seus próprios pagamentos
      if (req && (req as any).user) {
        if (
          (req as any).user.role === ERoles.PILOTO &&
          Number((req as any).user.id) !== Number(userId)
        ) {
          return res.status(403).json({
            error: 'Acesso negado',
            message: 'Você só pode deletar seus próprios pagamentos',
          });
        }
      }

      const result = await this.paymentMonthlyService.deletePaymentMonthly(
        Number(userId),
        Number(ref_year),
        Number(ref_month),
      );

      return res.json(result);
    } catch (err: any) {
      console.error('[deletePaymentMonthly] Erro:', err);
      if (err instanceof BadRequestException) {
        return res
          .status(400)
          .json({ error: 'Requisição inválida', message: err.message });
      }
      if (err.message.includes('não encontrado')) {
        return res
          .status(404)
          .json({ error: 'Não encontrado', message: err.message });
      }
      return res
        .status(500)
        .json({ error: 'Erro interno do servidor', message: err.message });
    }
  }
}
