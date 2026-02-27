import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { User } from 'models';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly configService: ConfigService;

  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => this.extractJWTFromCookie(req),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('PASSPORT_SECRET'),
    });

    this.configService = configService;
  }

  private extractJWTFromCookie(@Req() req: Request) {
    if (req.cookies) {
      const configService = this.configService;
      const tokenName = configService.get<string>('TOKEN_NAME');
      return req.cookies[tokenName];
    }
    return null;
  }

  async validate(payload: any): Promise<Partial<User>> {
    const {
      username,
      sub: { id, role },
    } = payload;
    return { username, id, role };
  }
}
