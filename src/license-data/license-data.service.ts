import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LicenseData, User, Pilots } from '../models';

@Injectable()
export class LicenseDataService {
  constructor(
    @InjectModel(LicenseData)
    private readonly licenseDataModel: typeof LicenseData,
  ) {}

  async findByUserId(userId: number): Promise<LicenseData | null> {
    return this.licenseDataModel.findOne({
      where: { userId },
    });
  }

  async findPending(): Promise<LicenseData[]> {
    return this.licenseDataModel.findAll({
      where: { status: 'Confirmar' },
      include: [
        { model: User, attributes: ['username'] },
        { model: Pilots, attributes: ['firstName', 'lastName'] },
      ],
    });
  }

  async createOrUpdate(data: {
    userId: number;
    civl?: string;
    pilotLevel?: string;
    cbvlExpiration?: Date;
    imgCbvl?: string;
    anacExpiration?: Date;
    imgAnac?: string;
  }): Promise<LicenseData> {
    const existing = await this.licenseDataModel.findOne({
      where: { userId: data.userId },
    });

    if (existing) {
      await existing.update(data);
      return existing;
    }

    return this.licenseDataModel.create(data as any);
  }

  async delete(userId: number): Promise<{ message: string }> {
    const existing = await this.licenseDataModel.findOne({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundException('Dados de licença não encontrados.');
    }

    await existing.destroy();
    return { message: 'Dados de licença removidos com sucesso.' };
  }

  async confirmLicense(userId: number): Promise<LicenseData> {
    const existing = await this.licenseDataModel.findOne({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundException('Dados de licença não encontrados.');
    }

    await existing.update({ status: 'Confirmado' });
    return existing;
  }
}
