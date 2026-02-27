import { Injectable, NotFoundException } from '@nestjs/common';
import { Pilots, PaymentMonthly, User, EmergencyContact } from 'models';
import { Op, fn, col, where as seqWhere } from 'sequelize';

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

import { MailService } from '../mail/mail.service';

@Injectable()
export class PilotsService {
  constructor(private readonly mailService: MailService) { }

  async getAllPilots() {
    try {
      const pilots = await Pilots.findAll({
        order: [
          ['firstName', 'ASC'],
          ['lastName', 'ASC'],
        ],
      });
      return pilots;
    } catch (error) {
      throw new Error(`Erro ao buscar pilotos: ${error.message}`);
    }
  }

  // Esse filiado refere-se ao status do cadastro e não do pagamento
  async getStatusCadastral(): Promise<PilotStatusData[]> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    try {
      const pilotsInstances = await Pilots.findAll({
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
            as: 'paymentMonthlies', // conforme seu model HasMany
            required: false, // LEFT JOIN -> NÃO filtra pilotos sem pagamento
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
    } catch (error: any) {
      console.error(
        'Erro em PilotsService.getStatusCadastral():',
        error?.stack ?? error,
      );
      throw new Error(error?.message ?? 'Erro ao buscar status cadastral');
    }
  }

  async getValidStatusCadastral(): Promise<string[]> {
    try {
      const attributes = Pilots.getAttributes();
      const statusAttribute = attributes.status;

      if (statusAttribute && statusAttribute.type) {
        const enumType = statusAttribute.type as any;
        if (enumType.values && Array.isArray(enumType.values)) {
          // Retorna os valores limpos (trim)
          return enumType.values.map((v: any) => String(v).trim());
        }
      }

      throw new Error('ENUM de status não encontrado no model Pilots');
    } catch (error: any) {
      throw new Error(
        `Erro ao buscar valores válidos de status: ${error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
      );
    }
  }

  async getStatusPayment(): Promise<PilotStatusData[]> {
    try {
      // Trazemos todos os pilotos que possuem pelo menos um registro de pagamento.
      const pilots = await Pilots.findAll({
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

      // Mapeia os pilotos retornando TODOS os pagamentos
      // Se um piloto tiver 3 pagamentos, retornará 3 objetos na lista final
      const flattenedPayments: PilotStatusData[] = [];

      pilots.forEach((pilot: any) => {
        const payments = pilot.paymentMonthlies || [];

        // Para cada pagamento, cria uma entrada na lista
        payments.forEach((pm: any) => {
          flattenedPayments.push({
            id: pilot.id,
            userId: pilot.userId,
            firstName: pilot.firstName,
            lastName: pilot.lastName,
            cpf: pilot.cpf,
            email: pilot.email,
            cellphone: pilot.cellphone,
            status: pm.status ? pm.status.toLowerCase() : '', // Status específico do pagamento
            ref_month: pm.ref_month,
            ref_year: pm.ref_year,
            type: pm.type,
          } as PilotStatusData);
        });
      });

      return flattenedPayments;
    } catch (error: any) {
      console.error(
        'Erro em pilots.service.getStatusPayment():',
        error?.stack ?? error,
      );
      throw new Error(error?.message ?? 'Erro ao buscar status de pagamento');
    }
  }

  async getValidStatusPayment(): Promise<string[]> {
    try {
      // Pega os atributos do model PaymentMonthly
      const attributes = PaymentMonthly.getAttributes();
      const statusAttribute = attributes.status;

      // Type assertion para acessar os valores do ENUM
      if (statusAttribute && statusAttribute.type) {
        const enumType = statusAttribute.type as any;

        if (enumType.values && Array.isArray(enumType.values)) {
          return enumType.values;
        }
      }

      throw new Error('ENUM de status não encontrado no model PaymentMonthly');
    } catch (error) {
      throw new Error(
        `Erro ao buscar valores válidos de status de pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
      );
    }
  }

  async updatePilotStatus(userId: number, status: string): Promise<Pilots> {
    // Busca o piloto pelo userId
    const pilot = await Pilots.findOne({ where: { userId } });

    if (!pilot) {
      throw new NotFoundException(`Piloto com userId ${userId} não encontrado`);
    }

    const oldStatus = pilot.status;

    // Atualiza o status
    pilot.status = status;
    await pilot.save();

    // Se mudou para 'filiado' vindo de 'pendente', envia e-mail
    if (
      status.toLowerCase() === 'filiado' &&
      (!oldStatus || oldStatus.toLowerCase() === 'pendente')
    ) {
      const email = pilot.email;
      const firstName = pilot.firstName;
      const username = email.split('@')[0];

      if (email) {
        // Não esperamos o envio do email para retornar o sucesso da atualização
        this.mailService.sendApprovalEmail(email, firstName, username);
      }
    }

    // Retorna o piloto atualizado
    return pilot;
  }

  async getPilotByUserId(userId: number) {
    try {
      let pilot: Pilots;
      if (!isNaN(Number(userId))) {
        pilot = await Pilots.findOne({ where: { userId: userId } });
      }
      if (!pilot) {
        pilot = await Pilots.findOne({
          where: { userId: userId },
        });
      }
      if (!pilot) {
        throw new NotFoundException(`
          Piloto com identificador ${userId} não encontrado`);
      }
      return pilot;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Re-lança a exceção NotFoundException
      }
      throw new Error(`Erro ao buscar piloto: ${error.message}`);
    }
  }

  async getInfo(cpf: string): Promise<Pilots | null> {
    return Pilots.findOne({ where: { cpf } });
  }

  async batchUpdateStatus(userIds: number[], status: string) {
    const results = [];
    for (const userId of userIds) {
      try {
        if (status === 'Excluído') {
          // Deleta fisicamente os registros
          await this.deletePilotAndUser(userId);
          results.push({ userId, success: true, action: 'delete' });
        } else {
          // Ajusta para 'filiado' se for essa a intenção do usuário (mantendo lowercase conforme o sistema parece usar internamente mas respeitando o desejo do user se necessário)
          // No updatePilotStatus já existe lógica para 'filiado'
          const updated = await this.updatePilotStatus(userId, status);
          results.push({
            userId,
            success: true,
            action: 'update',
            pilot: updated,
          });
        }
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }
    return results;
  }

  async deletePilotAndUser(userId: number) {
    // Busca o piloto para garantir que existe
    const pilot = await Pilots.findOne({ where: { userId } });
    if (!pilot) {
      throw new NotFoundException(`Piloto com userId ${userId} não encontrado`);
    }

    // Deleta o registro na tabela pilots
    await Pilots.destroy({ where: { userId } });

    // Deleta o registro na tabela users
    await User.destroy({ where: { id: userId } });

    // Nota: Se houver outras tabelas relacionadas (como pagamentos),
    // idealmente deveriam ser deletadas também ou ter CASCADE no DB.
    // Vamos garantir a exclusão dos pagamentos mensais também para evitar lixo.
    await PaymentMonthly.destroy({ where: { userId } });

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
    const pilot = await Pilots.findOne({ where: { userId } });
    if (!pilot) {
      throw new NotFoundException(`Piloto com userId ${userId} não encontrado`);
    }

    // Atualiza os campos permitidos
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
      // Valida tamanho da foto (max ~500KB em base64)
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
