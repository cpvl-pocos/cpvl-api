import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { PilotsService } from './pilots.service';
import { Pilots, User, PaymentMonthly } from 'models';
import { MailService } from '../mail/mail.service';
import { Sequelize } from 'sequelize-typescript';

describe('PilotsService', () => {
  let service: PilotsService;
  let pilotsModelMock: any;
  let mailServiceMock: any;

  beforeEach(async () => {
    pilotsModelMock = {
      findOne: jest.fn(),
      findAll: jest.fn(),
    };

    mailServiceMock = {
      sendApprovalEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PilotsService,
        {
          provide: getModelToken(Pilots),
          useValue: pilotsModelMock,
        },
        {
          provide: getModelToken(User),
          useValue: {},
        },
        {
          provide: getModelToken(PaymentMonthly),
          useValue: {},
        },
        {
          provide: MailService,
          useValue: mailServiceMock,
        },
        {
          provide: Sequelize,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PilotsService>(PilotsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updatePilotStatus', () => {
    it('should update status and send approval email if transitioning from pendente to filiado', async () => {
      const mockPilotInstance = {
        userId: 1,
        status: 'pendente',
        email: 'testpilot@example.com',
        firstName: 'Test',
        save: jest.fn().mockResolvedValue(true),
      };

      pilotsModelMock.findOne.mockResolvedValue(mockPilotInstance);

      const result = await service.updatePilotStatus(1, 'filiado');

      expect(pilotsModelMock.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(mockPilotInstance.status).toBe('filiado');
      expect(mockPilotInstance.save).toHaveBeenCalled();
      
      // Delay briefly to allow asynchronous fire-and-forget email promise to execute
      await new Promise((resolve) => process.nextTick(resolve));

      expect(mailServiceMock.sendApprovalEmail).toHaveBeenCalledWith(
        'testpilot@example.com',
        'Test',
        'testpilot',
      );
      expect(result).toBe(mockPilotInstance);
    });

    it('should not send email if transitioning to a status other than filiado', async () => {
      const mockPilotInstance = {
        userId: 1,
        status: 'pendente',
        email: 'testpilot@example.com',
        firstName: 'Test',
        save: jest.fn().mockResolvedValue(true),
      };

      pilotsModelMock.findOne.mockResolvedValue(mockPilotInstance);

      await service.updatePilotStatus(1, 'suspenso');

      await new Promise((resolve) => process.nextTick(resolve));
      expect(mailServiceMock.sendApprovalEmail).not.toHaveBeenCalled();
    });

    it('should not send email if oldStatus is already filiado', async () => {
      const mockPilotInstance = {
        userId: 1,
        status: 'filiado',
        email: 'testpilot@example.com',
        firstName: 'Test',
        save: jest.fn().mockResolvedValue(true),
      };

      pilotsModelMock.findOne.mockResolvedValue(mockPilotInstance);

      await service.updatePilotStatus(1, 'filiado');

      await new Promise((resolve) => process.nextTick(resolve));
      expect(mailServiceMock.sendApprovalEmail).not.toHaveBeenCalled();
    });
  });
});
