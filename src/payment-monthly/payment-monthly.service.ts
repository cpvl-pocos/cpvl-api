// src/payment-monthly/payment-monthly.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import PaymentMonthly from '../models/paymentmonthly.model';
import Pilots from '../models/pilots.model';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentMonthlyService {
  constructor(
    @InjectModel(PaymentMonthly)
    private paymentMonthlyModel: typeof PaymentMonthly,
    @InjectModel(Pilots)
    private pilotsModel: typeof Pilots,
    private mailService: MailService,
  ) {}

  async getAllPaymentMonthly() {
    try {
      const paymentMonthly = await this.paymentMonthlyModel.findAll();
      return paymentMonthly;
    } catch (error: any) {
      console.error('[getAllPaymentMonthly] Erro:', error);
      throw new Error(`Erro ao buscar os pagamentos mensais: ${error.message}`);
    }
  }

  async findPaymentMonthlybyUserId(data: {
    userId: number;
    year?: string | number;
  }) {
    const userId = Number(data.userId);
    const year = data.year ? Number(data.year) : undefined;

    console.log('[Service] findPaymentMonthlybyUserId INICIADO', {
      userId,
      year,
    });

    const where: any = { userId };

    if (year && !Number.isNaN(year)) {
      where.ref_year = year;
    }

    try {
      // Busca todos do usuário (sem filtro de ano) para análise
      const allPaymentsForUser = await this.paymentMonthlyModel.findAll({
        where: { userId },
      });

      const years =
        allPaymentsForUser.length > 0
          ? [...new Set(allPaymentsForUser.map((p) => p.ref_year))]
          : [];

      console.log(
        `[Service] Total de pagamentos para userId ${userId}:`,
        allPaymentsForUser.length,
      );
      if (years.length > 0) console.log('[Service] Anos disponíveis:', years);

      const paymentsMonthly = await this.paymentMonthlyModel.findAll({
        where,
        order: [
          ['ref_year', 'ASC'],
          ['ref_month', 'ASC'],
        ],
      });

      console.log(
        '[Service] pagamentos encontrados com filtro:',
        paymentsMonthly.length,
      );

      // Mensagem de aviso se há registros mas não para o ano filtrado
      if (
        paymentsMonthly.length === 0 &&
        allPaymentsForUser.length > 0 &&
        year
      ) {
        console.warn(
          '[Service] Existem pagamentos para este usuário, mas nenhum para o ano filtrado',
        );
        console.warn('[Service] Anos disponíveis:', years.join(', '));
      }

      return paymentsMonthly;
    } catch (err: any) {
      console.error('[Service] DB error:', err);
      throw err;
    }
  }

  private getPaymentValue(paymentType: string): number {
    const amountMonthly = 50;
    switch (paymentType) {
      case 'mensal':
        return amountMonthly;
      case 'trimestral':
        return amountMonthly * 3;
      case 'semestral':
        return amountMonthly * 6;
      case 'anual':
        return amountMonthly * 12;
      default:
        return 0;
    }
  }

  private getDiscount(paymentType: string): number {
    switch (paymentType) {
      case 'trimestral':
        return 0.0;
      case 'semestral':
        return 0.0;
      case 'anual':
        return 0.1;
      default:
        return 0;
    }
  }

  private calculateFinalValue(paymentType: string): number {
    const baseValue = this.getPaymentValue(paymentType);
    const discount = this.getDiscount(paymentType);
    return Math.round(baseValue * (1 - discount) * 100) / 100;
  }

  async createPaymentMonthly(data: any) {
    try {
      const amountMonthly = 50;
      let totalAmount = 0;
      let numberOfMonths = 1;

      // Calculate total amount and number of months based on payment type
      switch (data.type) {
        case 'mensal':
          totalAmount = amountMonthly;
          numberOfMonths = 1;
          break;
        case 'trimestral':
          totalAmount = amountMonthly * 3; // 150.00
          numberOfMonths = 3;
          break;
        case 'semestral':
          totalAmount = amountMonthly * 6; // 300.00
          numberOfMonths = 6;
          break;
        case 'anual':
          numberOfMonths = 12;
          // Check payment date for discount eligibility
          const paymentDate = new Date(data.date);
          const year = paymentDate.getFullYear();
          const januaryLimit = new Date(year, 0, 31, 23, 59, 59); // January 31st, end of day

          if (paymentDate <= januaryLimit) {
            // Payment on or before January 31st: 10% discount
            totalAmount = amountMonthly * 12 * 0.9; // 540.00
          } else {
            // Payment after January 31st: no discount
            totalAmount = amountMonthly * 12; // 600.00
          }
          break;
        default:
          totalAmount = 0;
          numberOfMonths = 1;
      }

      // Calculate amount per record (distribute evenly)
      // Using 2 decimal places to match currency format
      const distributedAmount =
        Math.round((totalAmount / numberOfMonths) * 100) / 100;

      const payment = await this.paymentMonthlyModel.create({
        userId: Number(data.userId),
        amount: distributedAmount, // Use distributed amount per month
        ref_year: String(data.ref_year),
        ref_month: Number(data.ref_month),
        type: data.type,
        description: data.description,
        status: data.status || 'Confirmar',
        date: data.date,
      });

      console.log(
        '[createPaymentMonthly] Pagamento criado com ID:',
        payment.id,
        'Tipo:',
        data.type,
        'Data:',
        data.date,
        'Valor Total Pacote:',
        totalAmount,
        'Meses:',
        numberOfMonths,
        'Valor Distribuído (Unitário):',
        distributedAmount,
      );
      return payment;
    } catch (error: any) {
      console.error('[createPaymentMonthly] Erro:', error);
      throw error;
    }
  }

  async confirmPayment(userId: number, ref_year: number, ref_month: number) {
    try {
      const payment = await this.paymentMonthlyModel.findOne({
        where: {
          userId,
          ref_year,
          ref_month,
        },
      });

      if (!payment) {
        console.warn('[confirmPayment] Pagamento não encontrado');
        return null;
      }

      payment.status = 'Confirmado';
      await payment.save();

      // Buscar dados do piloto para enviar email
      const pilot = await this.pilotsModel.findOne({
        where: { userId },
      });

      if (pilot && pilot.email) {
        try {
          await this.mailService.sendPaymentReceipt(
            pilot.email,
            `${pilot.firstName} ${pilot.lastName}`,
            pilot.cpf,
            payment.amount,
            payment.createdAt?.toString() || new Date().toISOString(),
            payment.type,
            String(payment.ref_year),
          );
          console.log('[confirmPayment] Recibo enviado por email');
        } catch (emailError) {
          console.error('[confirmPayment] Erro ao enviar recibo:', emailError);
          // Não lançar erro para não interromper a confirmação do pagamento
        }
      }

      console.log('[confirmPayment] Status atualizado com sucesso');
      return payment;
    } catch (error: any) {
      console.error('[confirmPayment] Erro:', error);
      throw error;
    }
  }

  async confirmPaymentBatch(
    payments: Array<{ userId: number; ref_year: number; ref_month: number }>,
  ) {
    try {
      console.log(
        '[confirmPaymentBatch] Confirmando lote de',
        payments.length,
        'pagamentos',
      );

      const confirmedPayments = [];

      for (const paymentData of payments) {
        const payment = await this.paymentMonthlyModel.findOne({
          where: {
            userId: paymentData.userId,
            ref_year: paymentData.ref_year,
            ref_month: paymentData.ref_month,
          },
        });

        if (payment) {
          payment.status = 'Confirmado';
          await payment.save();
          confirmedPayments.push(payment);

          // Buscar dados do piloto para enviar email
          const pilot = await this.pilotsModel.findOne({
            where: { userId: paymentData.userId },
          });

          if (pilot && pilot.email) {
            try {
              await this.mailService.sendPaymentReceipt(
                pilot.email,
                `${pilot.firstName} ${pilot.lastName}`,
                pilot.cpf,
                payment.amount,
                payment.createdAt?.toString() || new Date().toISOString(),
                payment.type,
                String(payment.ref_year),
              );
            } catch (emailError) {
              console.error(
                '[confirmPaymentBatch] Erro ao enviar recibo:',
                emailError,
              );
            }
          }

          console.log(
            `[confirmPaymentBatch] Confirmado: ${paymentData.ref_year}-${paymentData.ref_month}`,
          );
        } else {
          console.warn(
            `[confirmPaymentBatch] Pagamento não encontrado: ${paymentData.userId} ${paymentData.ref_year}-${paymentData.ref_month}`,
          );
        }
      }

      console.log(
        '[confirmPaymentBatch] Total confirmado:',
        confirmedPayments.length,
      );
      return confirmedPayments;
    } catch (error: any) {
      console.error('[confirmPaymentBatch] Erro:', error);
      throw error;
    }
  }

  async getPaymentById(paymentId: number) {
    try {
      const payment = await this.paymentMonthlyModel.findByPk(paymentId);
      return payment;
    } catch (error: any) {
      console.error('[getPaymentById] Erro:', error);
      throw error;
    }
  }

  async sendReceiptEmail(
    email: string,
    pilotName: string,
    payment: PaymentMonthly,
    selectedYear: string,
  ) {
    try {
      const pilot = await this.pilotsModel.findOne({
        where: { userId: payment.userId },
      });

      if (!pilot) {
        throw new Error('Piloto não encontrado');
      }

      await this.mailService.sendPaymentReceipt(
        email,
        pilotName,
        pilot.cpf,
        payment.amount,
        payment.createdAt?.toString() || new Date().toISOString(),
        payment.type,
        selectedYear,
      );

      console.log('[sendReceiptEmail] Recibo enviado com sucesso');
    } catch (error: any) {
      console.error('[sendReceiptEmail] Erro:', error);
      throw error;
    }
  }

  async deletePaymentMonthly(
    userId: number,
    ref_year: number,
    ref_month: number,
  ) {
    try {
      const payment = await this.paymentMonthlyModel.findOne({
        where: {
          userId,
          ref_year,
          ref_month,
        },
      });

      if (!payment) {
        throw new Error(
          `Pagamento não encontrado para userId=${userId}, ${ref_year}-${ref_month}`,
        );
      }

      await payment.destroy();
      console.log(
        `[deletePaymentMonthly] Pagamento deletado: userId=${userId}, ${ref_year}-${ref_month}`,
      );
      return { success: true, message: 'Pagamento deletado com sucesso' };
    } catch (error: any) {
      console.error('[deletePaymentMonthly] Erro:', error);
      throw error;
    }
  }
}
