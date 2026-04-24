import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Pilots, PaymentMonthly, User, EmergencyContact, LicenseData } from 'models';
import { Sequelize } from 'sequelize-typescript';
import { MailService } from '../mail/mail.service';

export interface PilotStatusData {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  cpf: string;
  email: string;
  cellphone: string;
  status: string;
  photoUrl?: string;
  bloodType?: string;
  emergencyPhone?: string;
  emergencyContactName?: string;
  allergies?: string;
  paymentMonthlies?: any[];
}

@Injectable()
export class PilotsService {
  private readonly logger = new Logger(PilotsService.name);

  constructor(
    @InjectModel(Pilots)
    private readonly pilotsModel: typeof Pilots,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(PaymentMonthly)
    private readonly paymentMonthlyModel: typeof PaymentMonthly,
    private readonly mailService: MailService,
    private readonly sequelize: Sequelize,
  ) {}

  async getAllPilots() {
    return this.pilotsModel.findAll({
      order: [
        ['firstName', 'ASC'],
        ['lastName', 'ASC'],
      ],
    });
  }

  /**
   * Get cadastral status with current month payment and emergency contact data.
   * Uses eager loading with LEFT JOINs to fetch everything in a single query.
   */
  async getStatusCadastral(): Promise<PilotStatusData[]> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const pilotsInstances = await this.pilotsModel.findAll({
      attributes: [
        'id',
        'userId',
        'firstName',
        'lastName',
        'cpf',
        'email',
        'cellphone',
        'status',
        'photoUrl',
      ],
      include: [
        {
          model: PaymentMonthly,
          as: 'paymentMonthlies',
          required: false,
          where: {
            ref_month: currentMonth,
            ref_year: currentYear,
          },
          attributes: [
            'status',
            'amount',
            'date',
            'ref_month',
            'ref_year',
            'userId',
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id'],
          include: [
            {
              model: EmergencyContact,
              as: 'emergencyContact',
              attributes: [
                'bloodType',
                'emergencyPhone',
                'emergencyContactName',
                'allergies',
              ],
            },
          ],
        },
      ],
      order: [
        ['firstName', 'ASC'],
        ['lastName', 'ASC'],
      ],
    });

    // Convert Sequelize instances to plain objects to ensure property access works
    const pilots = pilotsInstances.map((p) => p.get({ plain: true }));

    return pilots.map((pilot: any) => ({
      id: pilot.id,
      userId: pilot.userId,
      firstName: pilot.firstName,
      lastName: pilot.lastName,
      cpf: pilot.cpf,
      email: pilot.email,
      cellphone: pilot.cellphone,
      status: pilot.status ?? '',
      photoUrl: pilot.photoUrl ?? '',
      paymentMonthlies: pilot.paymentMonthlies || [],
      bloodType: pilot.user?.emergencyContact?.bloodType ?? '',
      emergencyPhone: pilot.user?.emergencyContact?.emergencyPhone ?? '',
      emergencyContactName:
        pilot.user?.emergencyContact?.emergencyContactName ?? '',
      allergies: pilot.user?.emergencyContact?.allergies ?? '',
    }));
  }

  /**
   * Get pilots authorized to fly — filters at SQL level instead of JavaScript.
   * Only fetches pilots with status='filiado' AND confirmed payment for current month.
   */
  async getAuthorizedPilots(): Promise<PilotStatusData[]> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const pilotsInstances = await this.pilotsModel.findAll({
      attributes: [
        'id',
        'userId',
        'firstName',
        'lastName',
        'cpf',
        'email',
        'cellphone',
        'status',
        'photoUrl',
      ],
      where: {
        status: 'filiado',
      },
      include: [
        {
          model: PaymentMonthly,
          as: 'paymentMonthlies',
          required: true, // INNER JOIN — only pilots WITH payment
          where: {
            ref_month: currentMonth,
            ref_year: currentYear,
            status: 'Confirmado',
          },
          attributes: [
            'status',
            'amount',
            'date',
            'ref_month',
            'ref_year',
            'userId',
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id'],
          include: [
            {
              model: EmergencyContact,
              as: 'emergencyContact',
              attributes: [
                'bloodType',
                'emergencyPhone',
                'emergencyContactName',
                'allergies',
              ],
            },
          ],
        },
      ],
      order: [
        ['firstName', 'ASC'],
        ['lastName', 'ASC'],
      ],
    });

    const pilots = pilotsInstances.map((p) => p.get({ plain: true }));

    return pilots.map((pilot: any) => ({
      id: pilot.id,
      userId: pilot.userId,
      firstName: pilot.firstName,
      lastName: pilot.lastName,
      cpf: pilot.cpf,
      email: pilot.email,
      cellphone: pilot.cellphone,
      status: pilot.status ?? '',
      photoUrl: pilot.photoUrl ?? '',
      paymentMonthlies: pilot.paymentMonthlies || [],
      bloodType: pilot.user?.emergencyContact?.bloodType ?? '',
      emergencyPhone: pilot.user?.emergencyContact?.emergencyPhone ?? '',
      emergencyContactName:
        pilot.user?.emergencyContact?.emergencyContactName ?? '',
      allergies: pilot.user?.emergencyContact?.allergies ?? '',
    }));
  }

  async getValidStatusCadastral(): Promise<string[]> {
    const attributes = Pilots.getAttributes();
    const statusAttribute = attributes.status;

    if (statusAttribute?.type) {
      const enumType = statusAttribute.type as any;
      if (enumType.values && Array.isArray(enumType.values)) {
        return enumType.values.map((v: any) => String(v).trim());
      }
    }

    throw new Error('ENUM de status não encontrado no model Pilots');
  }

  async getStatusPayment(): Promise<PilotStatusData[]> {
    const pilots = await this.pilotsModel.findAll({
      attributes: [
        'id',
        'userId',
        'firstName',
        'lastName',
        'cpf',
        'email',
        'cellphone',
        'photoUrl',
      ],
      include: [
        {
          model: PaymentMonthly,
          as: 'paymentMonthlies',
          required: true,
          attributes: [
            'status',
            'amount',
            'date',
            'ref_month',
            'ref_year',
            'userId',
            'type',
          ],
        },
      ],
      order: [
        ['firstName', 'ASC'],
        ['lastName', 'ASC'],
      ],
    });

    // Flatten: one row per payment
    const flattenedPayments: PilotStatusData[] = [];

    pilots.forEach((pilot: any) => {
      const payments = pilot.paymentMonthlies || [];
      payments.forEach((pm: any) => {
        flattenedPayments.push({
          id: pilot.id,
          userId: pilot.userId,
          firstName: pilot.firstName,
          lastName: pilot.lastName,
          cpf: pilot.cpf,
          email: pilot.email,
          cellphone: pilot.cellphone,
          status: pm.status ? pm.status.toLowerCase() : '',
          ref_month: pm.ref_month,
          ref_year: pm.ref_year,
          type: pm.type,
        } as PilotStatusData);
      });
    });

    return flattenedPayments;
  }

  async getValidStatusPayment(): Promise<string[]> {
    const attributes = PaymentMonthly.getAttributes();
    const statusAttribute = attributes.status;

    if (statusAttribute?.type) {
      const enumType = statusAttribute.type as any;
      if (enumType.values && Array.isArray(enumType.values)) {
        return enumType.values;
      }
    }

    throw new Error('ENUM de status não encontrado no model PaymentMonthly');
  }

  async updatePilotStatus(userId: number, status: string): Promise<Pilots> {
    const pilot = await this.pilotsModel.findOne({ where: { userId } });

    if (!pilot) {
      throw new NotFoundException(`Piloto com userId ${userId} não encontrado`);
    }

    const oldStatus = pilot.status;
    pilot.status = status;
    await pilot.save();

    // Send approval email asynchronously (fire-and-forget)
    if (
      status.toLowerCase() === 'filiado' &&
      (!oldStatus || oldStatus.toLowerCase() === 'pendente')
    ) {
      const email = pilot.email;
      const firstName = pilot.firstName;
      const username = email.split('@')[0];

      if (email) {
        this.mailService
          .sendApprovalEmail(email, firstName, username)
          .catch((err) =>
            this.logger.warn(`Falha ao enviar email de aprovação: ${err.message}`),
          );
      }
    }

    return pilot;
  }

  async getPilotByUserId(userId: number) {
    const pilot = await this.pilotsModel.findOne({
      where: { userId },
      include: [
        {
          model: PaymentMonthly,
          as: 'paymentMonthlies',
          required: false,
        },
        {
          model: EmergencyContact,
          as: 'emergencyContact',
          required: false,
        },
        {
          model: LicenseData,
          as: 'licenseData',
          required: false,
        },
      ],
      order: [
        [{ model: PaymentMonthly, as: 'paymentMonthlies' }, 'ref_year', 'DESC'],
        [{ model: PaymentMonthly, as: 'paymentMonthlies' }, 'ref_month', 'DESC'],
      ],
    });

    if (!pilot) {
      throw new NotFoundException(
        `Piloto com identificador ${userId} não encontrado`,
      );
    }
    return pilot;
  }

  async getInfo(cpf: string): Promise<Pilots | null> {
    return this.pilotsModel.findOne({ where: { cpf } });
  }

  async batchUpdateStatus(userIds: number[], status: string) {
    const results = await Promise.allSettled(
      userIds.map(async (userId) => {
        if (status === 'Excluído') {
          await this.deletePilotAndUser(userId);
          return { userId, success: true, action: 'delete' };
        } else {
          const updated = await this.updatePilotStatus(userId, status);
          return {
            userId,
            success: true,
            action: 'update',
            pilot: updated,
          };
        }
      }),
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        userId: userIds[index],
        success: false,
        error: result.reason?.message || 'Erro desconhecido',
      };
    });
  }

  /**
   * Delete pilot and user — now uses a transaction to ensure data consistency.
   */
  async deletePilotAndUser(userId: number) {
    const pilot = await this.pilotsModel.findOne({ where: { userId } });
    if (!pilot) {
      throw new NotFoundException(`Piloto com userId ${userId} não encontrado`);
    }

    await this.sequelize.transaction(async (t) => {
      await this.paymentMonthlyModel.destroy({
        where: { userId },
        transaction: t,
      });
      await this.pilotsModel.destroy({ where: { userId }, transaction: t });
      await this.userModel.destroy({ where: { id: userId }, transaction: t });
    });

    return { success: true };
  }

  async updatePilotProfile(
    userId: number,
    profileData: {
      name?: string;
      cellphone?: string;
      email?: string;
      photoUrl?: string;
    },
  ) {
    const pilot = await this.pilotsModel.findOne({ where: { userId } });
    if (!pilot) {
      throw new NotFoundException(`Piloto com userId ${userId} não encontrado`);
    }

    if (profileData.name) {
      const nameParts = String(profileData.name).trim().split(/\s+/);
      pilot.firstName = nameParts[0];
      pilot.lastName = nameParts.slice(1).join(' ');
    }

    if (profileData.cellphone) {
      pilot.cellphone = String(profileData.cellphone).replace(/\D/g, '');
    }

    if (profileData.email) {
      pilot.email = String(profileData.email).trim().toLowerCase();
    }

    if (profileData.photoUrl !== undefined) {
      if (profileData.photoUrl && profileData.photoUrl.length > 700000) {
        throw new Error('A foto excede o tamanho máximo permitido (500KB)');
      }
      pilot.photoUrl = profileData.photoUrl;
    }

    await pilot.save();

    return {
      id: pilot.id,
      userId: pilot.userId,
      firstName: pilot.firstName,
      lastName: pilot.lastName,
      cpf: pilot.cpf,
      cellphone: pilot.cellphone,
      email: pilot.email,
      photoUrl: pilot.photoUrl,
    };
  }
}
