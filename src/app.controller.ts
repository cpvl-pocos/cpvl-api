import { Controller, Req, Res, Post, UseGuards, Get } from '@nestjs/common';
import { Response } from 'express';
import { LocalAuthGuard } from './auth/guards/auth.local-auth.guard';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'decorators';
import { AppService } from './app.service';
import { ERoles, PassportRequest } from 'types';
import { LicenseDataService } from './license-data/license-data.service';

@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly userService: AppService,
    private readonly licenseDataService: LicenseDataService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: PassportRequest, @Res() res: Response) {
    const token = await this.authService.login(req.user);
    const tokenName = this.configService.get<string>('TOKEN_NAME');
    res.cookie(tokenName, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    res.send({ status: 'ok' });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN, ERoles.FISCAL, ERoles.PILOTO)
  @Get('profile')
  async getProfile(@Req() req: PassportRequest, @Res() res: Response) {
    const userRole = (req.user.role || '').trim().toLowerCase();
    const userId = req.user.id;
    console.log(`DEBUG: getProfile userRole: '${userRole}'`);

    const pages = {
      datapanel: { label: 'Painel de dados', route: 'datapanel' },
      pilots: { label: 'Pilotos', route: 'pilots' },
      pilotsDetails: { label: 'Meus dados', route: `pilots/${userId}` },
      status: { label: 'Autorizados à decolar', route: 'status-list' },
      emergencyContact: {
        label: 'Contato Emergência',
        route: 'emergency-contact',
      },
      editProfile: { label: 'Editar Cadastro', route: 'edit-profile' },
      licenseData: { label: 'Documentação', route: 'license-data' },
      documents: { label: 'Documentos', route: 'license-review' },
    };

    const allowedPages = {
      [ERoles.ADMIN]: [
        pages.status,
        pages.datapanel,
        pages.pilots,
        pages.documents,
      ],
      [ERoles.FISCAL]: [pages.status, pages.datapanel, pages.emergencyContact],
      [ERoles.PILOTO]: [
        pages.status,
        pages.datapanel,
        pages.pilotsDetails,
        pages.emergencyContact,
        pages.editProfile,
        pages.licenseData,
      ],
    };

    const response = allowedPages[userRole] || [];
    const warnings: string[] = [];

    if (userRole === ERoles.PILOTO) {
      const license = await this.licenseDataService.findByUserId(userId);
      if (license) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (license.cbvlExpiration) {
          const cbvlDate = new Date(license.cbvlExpiration);
          const diffTime = cbvlDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 30) {
            warnings.push(`Seu documento CBVL vencerá em ${diffDays} dias.`);
          }
        }

        if (license.anacExpiration) {
          const anacDate = new Date(license.anacExpiration);
          const diffTime = anacDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 30) {
            warnings.push(`Seu documento ANAC vencerá em ${diffDays} dias.`);
          }
        }
      }
    }

    res.send({ routes: response, warnings });
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN, ERoles.FISCAL, ERoles.PILOTO)
  @Get('me')
  getMe(@Req() req: PassportRequest) {
    return req.user;
  }
}
