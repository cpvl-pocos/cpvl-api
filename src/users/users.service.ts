import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Pilots, User } from '../models';
import * as bcrypt from 'bcrypt';
import { UniqueConstraintError } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Pilots) private readonly pilotModel: typeof Pilots,
    private readonly sequelize: Sequelize,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) { }

  async allUsers(): Promise<User[]> {
    return this.userModel.findAll();
  }

  async findUser({
    username,
  }: {
    username: string;
  }): Promise<User | undefined> {
    console.log(`🔍 [UsersService] Procurando usuário por: "${username}"`);

    // Tenta pelo username (exato)
    const user = await this.userModel.findOne({
      where: {
        username,
      },
    });

    if (user) {
      console.log(`✅ [UsersService] Usuário encontrado por username: ${user.username}`);
      return user;
    }

    // Tenta pelo username (lowercase) para garantir
    const userLower = await this.userModel.findOne({
      where: {
        username: username.toLowerCase(),
      },
    });

    if (userLower) {
      console.log(`✅ [UsersService] Usuário encontrado por username (lowercase): ${userLower.username}`);
      return userLower;
    }

    // Se não encontrou pelo username, tenta pelo e-mail na tabela de pilotos
    console.log(`ℹ️ [UsersService] Username não encontrado, tentando por e-mail na tabela de pilotos...`);

    const pilot = await this.pilotModel.findOne({
      where: { email: username.toLowerCase().trim() },
      include: [User],
    });

    if (pilot?.user) {
      console.log(`✅ [UsersService] Usuário encontrado via e-mail do piloto: ${pilot.email} (Username: ${pilot.user.username})`);
      return pilot.user;
    }

    console.log(`❌ [UsersService] Nenhum usuário encontrado para: "${username}"`);
    return undefined;
  }

  async findById(id: number): Promise<User | undefined> {
    console.log(`🔍 [UsersService] Procurando usuário por ID: ${id}`);
    const user = await this.userModel.findByPk(id);
    if (user) {
      return user;
    }
    return undefined;
  }

  async addUser(info: any) {
    console.log('📥 [SERVICE] Recebido no addUser:', info);

    if (!info || typeof info !== 'object') {
      throw new BadRequestException('Body inválido ou ausente.');
    }

    if (!info.name || !info.cpf || !info.email || !info.password) {
      throw new BadRequestException(
        'Campos obrigatórios ausentes: name, cpf, email, password.',
      );
    }

    const email = String(info.email).trim().toLowerCase();
    const cleanedCpf = String(info.cpf).replace(/\D/g, '');

    if (cleanedCpf.length !== 11) {
      throw new BadRequestException('CPF inválido. Deve conter 11 dígitos.');
    }

    const username = email.includes('@') ? email.split('@')[0] : email;

    const nameParts = String(info.name).trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const agreeStatute = !!info.agreeStatute;
    const agreeRI = !!info.agreeRI;
    const agreeLGPD = !!info.agreeLGPD;

    const [existingUsername, existingCpf, existingEmail, existingName] =
      await Promise.all([
        this.userModel.findOne({ where: { username } }),
        this.pilotModel.findOne({ where: { cpf: cleanedCpf } }),
        this.pilotModel.findOne({ where: { email } }),
        this.pilotModel.findOne({ where: { firstName, lastName } }),
      ]);

    const genericDuplicateMsg =
      'já cadastrado. Na tela de LOGIN, digite seu E-MAIL e click em "Nova senha”.';

    if (existingUsername)
      throw new ConflictException(`E-MAIL de usuário ${genericDuplicateMsg}`);
    if (existingCpf) throw new ConflictException(`CPF ${genericDuplicateMsg}`);
    if (existingEmail)
      throw new ConflictException(`E-mail ${genericDuplicateMsg}`);
    if (existingName)
      throw new ConflictException(
        `Piloto com este nome e sobrenome ${genericDuplicateMsg}`,
      );

    try {
      const result = await this.sequelize.transaction(async (t) => {
        const user = await this.userModel.create(
          {
            username,
            password: await bcrypt.hash(info.password, 10),
            role: 'piloto',
          },
          { transaction: t },
        );

        const pilot = await this.pilotModel.create(
          {
            userId: user.id,
            firstName,
            lastName,
            cpf: cleanedCpf,
            cellphone: info.cellphone ?? null,
            email,
            status: 'pendente',
            agreeStatute,
            agreeRI,
            agreeLGPD,
          },
          { transaction: t },
        );

        console.log('✅ [SERVICE] Sucesso na transaction.');

        return {
          user,
          pilot,
        };
      });

      console.log(
        '⬅️ [SERVICE] Retornando resultado para o controller:',
        result,
      );

      return result;
    } catch (err: any) {
      console.error('❌ [SERVICE] ERRO NA TRANSACTION:', err);

      if (err instanceof UniqueConstraintError) {
        const fields = err.fields ?? {};
        if (fields.username)
          throw new ConflictException(
            'E-MAIL já cadastrado. Na tela de LOGIN, digite seu E-MAIL e click em "Nova senha”.',
          );
        if (fields.cpf)
          throw new ConflictException(
            'CPF já cadastrado. Na tela de LOGIN, digite seu E-MAIL e click em "Nova senha”.',
          );
        if (fields.email)
          throw new ConflictException(
            'E-mail já cadastrado. Na tela de LOGIN, digite seu E-MAIL e click em "Nova senha”.',
          );
        throw new ConflictException(
          'Registro duplicado. Na tela de LOGIN, digite seu E-MAIL e click em "Nova senha”.',
        );
      }

      throw new InternalServerErrorException(
        'Erro ao criar usuário: ' + (err.message ?? String(err)),
      );
    }
  }

  async forgotPassword(email: string) {
    const pilot = await this.pilotModel.findOne({ where: { email } });
    if (!pilot) {
      throw new NotFoundException('E-mail não encontrado.');
    }

    const payload = { sub: pilot.userId, email: pilot.email };
    const token = this.jwtService.sign(payload);

    await this.mailService.sendPasswordRecoveryLink(
      pilot.email,
      pilot.firstName,
      token,
    );

    return { message: 'E-mail de recuperação enviado com sucesso.' };
  }

  async resetPassword(token: string, password: string) {
    try {
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      const user = await this.userModel.findByPk(userId);
      if (!user) {
        throw new NotFoundException('Usuário não encontrado.');
      }

      user.password = await bcrypt.hash(password, 10);
      await user.save();

      return { message: 'Senha atualizada com sucesso.' };
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new BadRequestException('O link de recuperação expirou.');
      }
      throw new BadRequestException('Token de recuperação inválido.');
    }
  }
}
