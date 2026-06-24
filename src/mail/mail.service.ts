import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private readonly defaultSender: string;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = this.configService.get<number>('MAIL_PORT');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    const secureEnv = this.configService.get<string>('MAIL_SECURE');

    this.defaultSender = user || 'noreply@cpvl.com.br';

    if (host) {
      this.logger.log(`Configurando SMTP: ${host}:${port}`);
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: secureEnv === 'true' || port === 465,
        auth: { user, pass },
      });
    } else {
      this.logger.warn(
        'SMTP não configurado no .env. Emails serão logados mas não enviados.',
      );
      // Create a null transport that logs instead of sending
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  async sendApprovalEmail(email: string, firstName: string, username: string) {
    const mailOptions = {
      from: `"CPVL - Clube Poçoscaldense de Vôo Livre" <${this.defaultSender}>`,
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
          <p><em>(O "Usuário", é a primeira parte do seu e-mail, antes do "@")</em></p>
          <br />
          <p>Atenciosamente,<br />Diretoria CPVL</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`E-mail de aprovação enviado para: ${email}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar e-mail de aprovação: ${error.message}`);
    }
  }

  async sendPasswordRecoveryLink(to: string, firstName: string, token: string) {
    const frontUrl =
      this.configService.get<string>('FRONT_URL') || 'http://localhost:8000';
    const recoveryUrl = `${frontUrl}/newpassword?token=${token}`;

    this.logger.log(`Recovery link gerado para: ${to}`);

    const mailOptions = {
      from: `"CPVL - Clube Poçoscaldense de Vôo Livre" <${this.defaultSender}>`,
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
          <p>Atenciosamente,<br />Diretoria CPVL</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`E-mail de recuperação enviado para: ${to}`);
    } catch (error) {
      this.logger.warn(
        `Falha no envio de e-mail de recuperação: ${error.message}`,
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
    const numericAmount = Number(amount) || 0;
    const safePaymentType = paymentType ? String(paymentType).toLowerCase() : 'mensal';
    const capitalizedType =
      safePaymentType.charAt(0).toUpperCase() + safePaymentType.slice(1);

    const mailOptions = {
      from: `"CPVL Tesouraria" <${this.defaultSender}>`,
      to,
      subject: `Recibo de Pagamento - ${capitalizedType} ${year}`,
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
            o pagamento no valor de <strong>R$ ${numericAmount.toFixed(2)}</strong>, 
            referente à <strong>${this.getPaymentTypeLabel(
        safePaymentType,
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
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Recibo de pagamento enviado para: ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar recibo: ${error.message}`);
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
