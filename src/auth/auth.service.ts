import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../models';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async validateUser(
    username: string,
    password: string,
  ): Promise<Partial<User> | null> {
    console.log(`🔑 [AuthService] Validando usuário: "${username}"`);
    const user = await this.usersService.findUser({ username });

    if (!user) {
      console.log(`⚠️ [AuthService] Usuário não encontrado para "${username}"`);
      return null;
    }

    console.log(`ℹ️ [AuthService] Usuário encontrado: ${user.username}. Comparando senhas...`);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      console.log(`✅ [AuthService] Senha válida para o usuário: ${user.username}`);
      const { id, username: uname, role } = user;
      return { id, username: uname, role };
    }

    console.log(`❌ [AuthService] Senha inválida para o usuário: ${user.username}`);
    return null;
  }

  async login(user: User) {
    const payload = {
      username: user.username,
      sub: { id: user.id, role: user.role },
    };
    return this.jwtService.sign(payload);
  }
}
