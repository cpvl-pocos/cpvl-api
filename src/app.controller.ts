import { Controller, Req, Res, Post, UseGuards, Get, Logger } from '@nestjs/common';
import { Response } from 'express';
import { LocalAuthGuard } from './auth/guards/auth.local-auth.guard';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'decorators';
import { ERoles, PassportRequest } from 'types';
import { LicenseDataService } from './license-data/license-data.service';
import { PilotsService } from './pilots/pilots.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly licenseDataService: LicenseDataService,
    private readonly pilotsService: PilotsService,
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
    res.send({ status: 'ok', token });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERoles.ADMIN, ERoles.FISCAL, ERoles.PILOTO)
  @Get('profile')
  async getProfile(@Req() req: PassportRequest) {
    const userRole = (req.user.role || '').trim().toLowerCase();
    const userId = req.user.id;

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
      ],
    };

    const routes = allowedPages[userRole] || [];
    const warnings: string[] = [];
    let pilotInfo = null;

    if (userRole === ERoles.PILOTO) {
      // Fetch pilot info and license in parallel for faster response
      const [pilot, license] = await Promise.all([
        this.pilotsService.getPilotByUserId(userId),
        this.licenseDataService.findByUserId(userId),
      ]);

      pilotInfo = pilot;

      if (license) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const EXPIRY_WARNING_DAYS = 30;

        const checkExpiration = (date: Date | null, docName: string) => {
          if (!date) return;
          const expDate = new Date(date);
          const diffDays = Math.ceil(
            (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );
          if (diffDays >= 0 && diffDays <= EXPIRY_WARNING_DAYS) {
            warnings.push(`Seu documento ${docName} vencerá em ${diffDays} dias.`);
          }
        };

        checkExpiration(license.cbvlExpiration, 'CBVL');
        checkExpiration(license.anacExpiration, 'ANAC');
      }
    }

    return { routes, warnings, user: req.user, pilotInfo };
  }
}
