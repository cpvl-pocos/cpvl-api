import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  private readonly MAIL_HOST = 'smtp.ethereal.email';
  private readonly MAIL_PORT = 587;
  private readonly MAIL_USER = 'xavier98@ethereal.email';
  private readonly MAIL_PASS = 'pYzyebxYSb3uCUqY2s';

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = this.configService.get<number>('MAIL_PORT');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    const secureEnv = this.configService.get<string>('MAIL_SECURE');

    // Se houver host configurado, usa as envs, senão cai no fallback da Ethereal
    if (host) {
      console.log(`📧 [MAIL] Configurando SMTP real: ${host}:${port}`);
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: secureEnv === 'true' || port === 465,
        auth: {
          user,
          pass,
        },
      });
    } else {
      console.warn(
        '⚠️ [MAIL] SMTP não configurado no .env. Usando fallback Ethereal (Apenas Testes).',
      );
      this.transporter = nodemailer.createTransport({
        host: this.MAIL_HOST,
        port: this.MAIL_PORT,
        secure: false,
        auth: {
          user: this.MAIL_USER,
          pass: this.MAIL_PASS,
        },
      });
    }
  }

  async sendApprovalEmail(email: string, firstName: string, username: string) {
    const mailOptions = {
      from: '"CPVL" <noreply@cpvl.com.br>',
      to: `${email}`,
      subject: 'Seu cadastro no CPVL foi aprovado!',
      text: `Olá ${firstName}, seu cadastro foi aprovado! Você já pode logar no sistema. Lembre-se que seu usuário é a primeira parte do seu email: ${username}`,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Olá ${firstName},</h2>
          <p>Seu cadastro no <strong>CPVL</strong> foi aprovado pelo administrador!</p>
          <p>Você já pode acessar o sistema utilizando suas credenciais.</p>
          <a href="http://www.cpvl.esp.br" target="_blank">www.cpvl.esp.br</a>
          <p><strong>Usuário:</strong> ${username}</p>
          <p><em>(O usuário é a primeira parte do seu e-mail antes do @)</em></p>
          <br />
          <p>Atenciosamente,<br />Equipe CPVL</p>
        </div>
      `,
    };

    try {
      console.log(`📤 Enviando e-mail de aprovação para: ${email}`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ E-mail enviado:', info.messageId);
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail:', error);
    }
  }

  async sendPasswordRecoveryLink(to: string, firstName: string, token: string) {
    const frontUrl =
      this.configService.get<string>('FRONT_URL') || 'http://localhost:3000';
    const recoveryUrl = `${frontUrl}/newpassword?token=${token}`;

    console.log('---------------------------------------------------------');
    console.log('🔑 [RECOVERY LINK]:', recoveryUrl);
    console.log('---------------------------------------------------------');

    const mailOptions = {
      from: '"CPVL" <noreply@cpvl.com.br>',
      to,
      subject: 'Recuperação de Senha - CPVL',
      text: `Olá ${firstName}, clique no link para resetar sua senha: ${recoveryUrl}`,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Olá ${firstName},</h2>
          <p>Você solicitou a recuperação de senha no portal <strong>CPVL</strong>.</p>
          <p>Clique no botão abaixo para criar uma nova senha:</p>
          <a href="${recoveryUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1d222d; color: #fff; text-decoration: none; border-radius: 5px;">Resetar Minha Senha</a>
          <p>O link expira em 15 minutos.</p>
          <p>Se você não solicitou isso, ignore este e-mail.</p>
          <br />
          <p>Atenciosamente,<br />Equipe CPVL</p>
        </div>
      `,
    };

    try {
      // Verifica se existe configuração mínima de SMTP
      const host = this.configService.get<string>('MAIL_HOST', this.MAIL_HOST);
      if (!host) {
        console.warn(
          '⚠️ SMTP não configurado. O link de recuperação acima deve ser usado manualmente.',
        );
        return;
      }

      console.log(`📤 Enviando e-mail de recuperação para: ${to}`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ E-mail de recuperação enviado:', info.messageId);
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail de recuperação:', error.message);
      console.warn(
        '⚠️ Falha no envio de e-mail. Use o link logado no console acima.',
      );
    }
  }

  async sendPaymentReceipt(
    to: string,
    pilotName: string,
    pilotCpf: string,
    amount: number,
    paymentDate: string,
    paymentType: string,
    year: string,
  ) {
    const mailOptions = {
      from: '"CPVL Tesouraria" <noreply@cpvl.com.br>',
      to,
      subject: `Recibo de Pagamento - ${
        paymentType.charAt(0).toUpperCase() + paymentType.slice(1)
      } ${year}`,
      html: `
        <div style="font-family: serif; color: #333; padding: 20px;">
          <h2 style="text-align: center;">RECIBO</h2>
          
          <p style="text-align: justify; line-height: 1.8; margin: 20px 0;">
            ${new Date().toLocaleDateString('pt-BR')},
          </p>
          
          <p style="text-align: justify; line-height: 1.8; margin: 20px 0;">
            Recebemos no dia <strong>${new Date(paymentDate).toLocaleDateString(
              'pt-BR',
            )}</strong> do
            piloto <strong>${pilotName}</strong>, CPF nº <strong>${pilotCpf}</strong>, 
            o pagamento no valor de <strong>R$ ${amount.toFixed(2)}</strong>, 
            referente à <strong>${this.getPaymentTypeLabel(
              paymentType,
            )}</strong> do ano de 
            <strong>${year}</strong>.
          </p>
          
          <div style="margin-top: 60px; text-align: center;">
            <p style="font-size: 12px; margin-bottom: 40px;">
              Tesoureiro: Talyson Bolleli
            </p>
            
            <p style="font-size: 12px; margin-top: 20px; font-weight: bold;">
              CPVL - Clube Poçoscaldense de Vôo Livre
            </p>
          </div>
        </div>
      `,
    };

    try {
      console.log(`📤 Enviando recibo de pagamento para: ${to}`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Recibo enviado:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar recibo:', error);
      throw error;
    }
  }

  private getPaymentTypeLabel(type: string): string {
    const typeMap: Record<string, string> = {
      mensal: 'mensalidade',
      trimestral: 'trimestre',
      semestral: 'semestre',
      anual: 'anuidade',
    };
    return typeMap[type] || type;
  }
}
