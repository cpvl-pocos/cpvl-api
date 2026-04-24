// src/payment-monthly/payment-monthly.controller.ts
import {
  Controller,
  Get,
  Patch,
  Delete,
  Req,
  NotFoundException,
  Body,
  Post,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentMonthlyService } from './payment-monthly.service';
import { RolesGuard } from 'auth/guards/roles.guard';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { ERoles, PassportRequest } from 'types';
import { Roles } from 'decorators';
import {
  ConfirmPaymentDto,
  ConfirmPaymentBatchDto,
  CreatePaymentMonthlyDto,
  SendReceiptEmailDto,
} from './dto/confirm-payment.dto';

@Controller('paymentMonthly')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentMonthlyController {
  constructor(private readonly paymentMonthlyService: PaymentMonthlyService) {}

  @Patch('confirmPayment')
  @Roles(ERoles.ADMIN)
  async confirmPayment(@Body() body: ConfirmPaymentDto) {
    const updated = await this.paymentMonthlyService.confirmPayment(
      body.userId,
      Number(body.ref_year),
      body.ref_month,
    );

    if (!updated) {
      throw new NotFoundException(
        `Pagamento não encontrado para userId=${body.userId}, ${body.ref_year}-${body.ref_month}`,
      );
    }

    return { success: true, payment: updated };
  }

  @Patch('confirmPaymentBatch')
  @Roles(ERoles.ADMIN)
  async confirmPaymentBatch(@Body() body: ConfirmPaymentBatchDto) {
    const confirmed = await this.paymentMonthlyService.confirmPaymentBatch(
      body.payments,
    );

    return {
      success: true,
      confirmed: confirmed.length,
      payments: confirmed,
    };
  }

  @Get()
  @Roles(ERoles.ADMIN)
  async getAllPaymentMonthly() {
    return this.paymentMonthlyService.getAllPaymentMonthly();
  }

  @Get(':userId')
  @Roles(ERoles.ADMIN, ERoles.FISCAL, ERoles.PILOTO)
  async findPaymentMonthlybyUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: PassportRequest,
    @Query('year') year?: string,
  ) {
    if (year && !/^\d{4}$/.test(String(year))) {
      throw new BadRequestException(
        'year inválido. Formato esperado: YYYY (ex: 2024)',
      );
    }

    // Pilots can only view their own payments
    if (req.user.role === ERoles.PILOTO && Number(req.user.id) !== userId) {
      throw new ForbiddenException(
        'Você só pode visualizar seus próprios pagamentos',
      );
    }

    return this.paymentMonthlyService.findPaymentMonthlybyUserId({
      userId,
      year,
    });
  }

  @Post()
  @Roles(ERoles.ADMIN, ERoles.PILOTO)
  async createPaymentMonthly(
    @Body() body: CreatePaymentMonthlyDto,
    @Req() req: PassportRequest,
  ) {
    // Pilots can only create their own payments
    if (
      req.user.role === ERoles.PILOTO &&
      Number(req.user.id) !== body.userId
    ) {
      throw new ForbiddenException(
        'Você não pode criar pagamentos para outros usuários',
      );
    }

    return this.paymentMonthlyService.createPaymentMonthly(body);
  }

  @Post('sendReceiptEmail')
  @Roles(ERoles.ADMIN)
  async sendReceiptEmail(@Body() body: SendReceiptEmailDto) {
    const payment = await this.paymentMonthlyService.getPaymentById(
      body.paymentId,
    );

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    await this.paymentMonthlyService.sendReceiptEmail(
      body.email,
      body.pilotName || '',
      payment,
      body.selectedYear || '',
    );

    return { success: true, message: 'Recibo enviado com sucesso' };
  }

  @Delete(':userId/:ref_year/:ref_month')
  @Roles(ERoles.ADMIN, ERoles.PILOTO)
  async deletePaymentMonthly(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('ref_year', ParseIntPipe) ref_year: number,
    @Param('ref_month', ParseIntPipe) ref_month: number,
    @Req() req: PassportRequest,
  ) {
    // Pilots can only delete their own payments
    if (req.user.role === ERoles.PILOTO && Number(req.user.id) !== userId) {
      throw new ForbiddenException(
        'Você só pode deletar seus próprios pagamentos',
      );
    }

    return this.paymentMonthlyService.deletePaymentMonthly(
      userId,
      ref_year,
      ref_month,
    );
  }
}
