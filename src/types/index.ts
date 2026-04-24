import { Request } from 'express';
import { User } from 'models';

export interface PassportRequest extends Request {
  user: User & { id: number; role: string; username: string };
}

export enum ERoles {
  ADMIN = 'admin',
  FISCAL = 'fiscal',
  PILOTO = 'piloto',
}
