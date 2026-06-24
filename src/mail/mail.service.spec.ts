import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let configServiceMock: any;
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    sendMailMock = jest.fn().mockResolvedValue({ messageId: '123' });
    
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    configServiceMock = {
      get: jest.fn().mockImplementation((key: string) => {
        const config: Record<string, any> = {
          MAIL_HOST: 'smtp.example.com',
          MAIL_PORT: 587,
          MAIL_USER: 'test@example.com',
          MAIL_PASS: 'password',
          MAIL_SECURE: 'false',
          FRONT_URL: 'http://localhost:8000',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPaymentReceipt', () => {
    it('should successfully format the receipt and send the email with string amount', async () => {
      const result = await service.sendPaymentReceipt(
        'pilot@example.com',
        'John Doe',
        '123.456.789-00',
        '50.00' as any, // Testing string amount from Sequelize DECIMAL
        new Date().toISOString(),
        'mensal',
        '2026',
      );

      expect(result).toBe(true);
      expect(sendMailMock).toHaveBeenCalled();
      const mailOptions = sendMailMock.mock.calls[0][0];
      expect(mailOptions.to).toBe('pilot@example.com');
      expect(mailOptions.subject).toContain('Recibo de Pagamento - Mensal 2026');
      expect(mailOptions.html).toContain('R$ 50.00');
    });

    it('should successfully format the receipt and send the email with number amount', async () => {
      const result = await service.sendPaymentReceipt(
        'pilot@example.com',
        'John Doe',
        '123.456.789-00',
        120.5,
        new Date().toISOString(),
        'trimestral',
        '2026',
      );

      expect(result).toBe(true);
      expect(sendMailMock).toHaveBeenCalled();
      const mailOptions = sendMailMock.mock.calls[0][0];
      expect(mailOptions.subject).toContain('Recibo de Pagamento - Trimestral 2026');
      expect(mailOptions.html).toContain('R$ 120.50');
    });

    it('should fall back to default type and amount when undefined/null is passed', async () => {
      const result = await service.sendPaymentReceipt(
        'pilot@example.com',
        'John Doe',
        '123.456.789-00',
        null as any,
        new Date().toISOString(),
        null as any,
        '2026',
      );

      expect(result).toBe(true);
      expect(sendMailMock).toHaveBeenCalled();
      const mailOptions = sendMailMock.mock.calls[0][0];
      expect(mailOptions.subject).toContain('Recibo de Pagamento - Mensal 2026');
      expect(mailOptions.html).toContain('R$ 0.00');
    });
  });
});
