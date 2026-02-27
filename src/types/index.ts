import { User } from 'models';

export interface PassportRequest extends Request {
  user: User;
}

export enum ERoles {
  ADMIN = 'admin',
  FISCAL = 'fiscal',
  PILOTO = 'piloto',
}
