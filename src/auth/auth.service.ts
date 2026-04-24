import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../models';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<Partial<User> | null> {
    const user = await this.usersService.findUser({ username });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      const { id, username: uname, role } = user;
      return { id, username: uname, role };
    }

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
