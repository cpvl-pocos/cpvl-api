import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import EmergencyContact from '../models/emergencycontact.model';

@Injectable()
export class EmergencyContactsService {
  constructor(
    @InjectModel(EmergencyContact)
    private readonly emergencyContactModel: typeof EmergencyContact,
  ) {}

  async findByUserId(userId: number): Promise<EmergencyContact | null> {
    return this.emergencyContactModel.findOne({
      where: { userId },
    });
  }

  async createOrUpdate(data: {
    userId: number;
    bloodType?: string;
    emergencyPhone?: string;
    emergencyContactName?: string;
    allergies?: string;
  }): Promise<EmergencyContact> {
    const existing = await this.emergencyContactModel.findOne({
      where: { userId: data.userId },
    });

    if (existing) {
      await existing.update(data);
      return existing;
    }

    return this.emergencyContactModel.create(data as any);
  }

  async delete(userId: number): Promise<{ message: string }> {
    const existing = await this.emergencyContactModel.findOne({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundException('Contato de emergência não encontrado.');
    }

    await existing.destroy();
    return { message: 'Contato de emergência removido com sucesso.' };
  }
}
