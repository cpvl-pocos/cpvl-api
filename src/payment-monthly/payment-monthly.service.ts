// src/payment-monthly/payment-monthly.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import PaymentMonthly from '../models/paymentmonthly.model';
import Pilots from '../models/pilots.model';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentMonthlyService {
  private readonly logger = new Logger(PaymentMonthlyService.name);

  constructor(
    @InjectModel(PaymentMonthly)
    private paymentMonthlyModel: typeof PaymentMonthly,
    @InjectModel(Pilots)
    private pilotsModel: typeof Pilots,
    private mailService: MailService,
  ) {}

  async getAllPaymentMonthly() {
    return this.paymentMonthlyModel.findAll();
  }

  /**
   * Find payments by userId with optional year filter.
   * FIXED: Removed redundant "fetch all without filter" query that existed only for logging.
   */
  async findPaymentMonthlybyUserId(data: {
    userId: number;
    year?: string | number;
  }) {
    const userId = Number(data.userId);
    const year = data.year ? Number(data.year) : undefined;

    const where: any = { userId };

    if (year && !Number.isNaN(year)) {
      where.ref_year = year;
    }

    return this.paymentMonthlyModel.findAll({
      where,
      order: [
        ['ref_year', 'ASC'],
        ['ref_month', 'ASC'],
      ],
    });
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
    // Check if there are any existing payments with status 'Confirmar' for this user
    const pendingPayment = await this.paymentMonthlyModel.findOne({
      where: {
        userId: Number(data.userId),
        status: 'Confirmar',
      },
    });

    if (pendingPayment) {
      throw new BadRequestException(
        'Você já possui um pagamento aguardando confirmação.',
      );
    }

    const amountMonthly = 50;
    let totalAmount = 0;
    let numberOfMonths = 1;

    switch (data.type) {
      case 'mensal':
        totalAmount = amountMonthly;
        numberOfMonths = 1;
        break;
      case 'trimestral':
        totalAmount = amountMonthly * 3;
        numberOfMonths = 3;
        break;
      case 'semestral':
        totalAmount = amountMonthly * 6;
        numberOfMonths = 6;
        break;
      case 'anual':
        numberOfMonths = 12;
        const paymentDate = new Date(data.date);
        const year = paymentDate.getFullYear();
        const januaryLimit = new Date(year, 0, 31, 23, 59, 59);

        if (paymentDate <= januaryLimit) {
          totalAmount = amountMonthly * 12 * 0.9; // 10% discount
        } else {
          totalAmount = amountMonthly * 12;
        }
        break;
      default:
        totalAmount = 0;
        numberOfMonths = 1;
    }

    const distributedAmount =
      Math.round((totalAmount / numberOfMonths) * 100) / 100;

    const payment = await this.paymentMonthlyModel.create({
      userId: Number(data.userId),
      amount: distributedAmount,
      ref_year: String(data.ref_year),
      ref_month: Number(data.ref_month),
      type: data.type,
      description: data.description,
      status: data.status || 'Confirmar',
      date: data.date,
    });

    this.logger.log(
      `Pagamento criado: ID=${payment.id}, tipo=${data.type}, valor=${distributedAmount}`,
    );
    return payment;
  }

  async confirmPayment(userId: number, ref_year: number, ref_month: number) {
    const payment = await this.paymentMonthlyModel.findOne({
      where: { userId, ref_year, ref_month },
    });

    if (!payment) {
      return null;
    }

    payment.status = 'Confirmado';
    await payment.save();

    // Send receipt email asynchronously (fire-and-forget, don't block confirmation)
    this.sendConfirmationReceipt(userId, payment).catch((err) =>
      this.logger.warn(`Falha ao enviar recibo: ${err.message}`),
    );

    return payment;
  }

  /**
   * Batch confirm payments — processes in parallel with Promise.allSettled.
   */
  async confirmPaymentBatch(
    payments: Array<{ userId: number; ref_year: number; ref_month: number }>,
  ) {
    this.logger.log(`Confirmando lote de ${payments.length} pagamentos`);

    const results = await Promise.allSettled(
      payments.map(async (paymentData) => {
        const payment = await this.paymentMonthlyModel.findOne({
          where: {
            userId: paymentData.userId,
            ref_year: paymentData.ref_year,
            ref_month: paymentData.ref_month,
          },
        });

        if (!payment) {
          this.logger.warn(
            `Pagamento não encontrado: ${paymentData.userId} ${paymentData.ref_year}-${paymentData.ref_month}`,
          );
          return null;
        }

        payment.status = 'Confirmado';
        await payment.save();

        // Send receipt asynchronously
        this.sendConfirmationReceipt(paymentData.userId, payment).catch(
          (err) =>
            this.logger.warn(
              `Falha ao enviar recibo batch: ${err.message}`,
            ),
        );

        return payment;
      }),
    );

    const confirmedPayments = results
      .filter(
        (r): r is PromiseFulfilledResult<PaymentMonthly> =>
          r.status === 'fulfilled' && r.value !== null,
      )
      .map((r) => r.value);

    this.logger.log(`Total confirmado: ${confirmedPayments.length}`);
    return confirmedPayments;
  }

  /**
   * Helper: send payment confirmation receipt email.
   * Extracted to avoid code duplication between confirmPayment and confirmPaymentBatch.
   */
  private async sendConfirmationReceipt(
    userId: number,
    payment: PaymentMonthly,
  ) {
    const pilot = await this.pilotsModel.findOne({ where: { userId } });

    if (pilot?.email) {
      await this.mailService.sendPaymentReceipt(
        pilot.email,
        `${pilot.firstName} ${pilot.lastName}`,
        pilot.cpf,
        payment.amount,
        payment.createdAt?.toString() || new Date().toISOString(),
        payment.type,
        String(payment.ref_year),
      );
    }
  }

  async getPaymentById(paymentId: number) {
    return this.paymentMonthlyModel.findByPk(paymentId);
  }

  async sendReceiptEmail(
    email: string,
    pilotName: string,
    payment: PaymentMonthly,
    selectedYear: string,
  ) {
    const pilot = await this.pilotsModel.findOne({
      where: { userId: payment.userId },
    });

    if (!pilot) {
      throw new NotFoundException('Piloto não encontrado');
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
  }

  async deletePaymentMonthly(
    userId: number,
    ref_year: number,
    ref_month: number,
  ) {
    const payment = await this.paymentMonthlyModel.findOne({
      where: { userId, ref_year, ref_month },
    });

    if (!payment) {
      throw new NotFoundException(
        `Pagamento não encontrado para userId=${userId}, ${ref_year}-${ref_month}`,
      );
    }

    await payment.destroy();
    this.logger.log(
      `Pagamento deletado: userId=${userId}, ${ref_year}-${ref_month}`,
    );
    return { success: true, message: 'Pagamento deletado com sucesso' };
  }
}
