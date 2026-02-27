import { IsEmail, IsMobilePhone, IsNotEmpty } from 'class-validator';
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  HasOne,
} from 'sequelize-typescript';
import { IsCPF } from 'class-validator-cpf';
import PaymentMonthly from './paymentmonthly.model';
import User from './users.model';
import EmergencyContact from './emergencycontact.model';
import LicenseData from './licenseData.model';

@Table({ tableName: 'pilots' })
class Pilots extends Model<Pilots> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  id!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true,
  })
  userId!: number;

  @BelongsTo(() => User)
  user: User;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  @IsNotEmpty({ message: 'O nome não pode ser vazio' })
  firstName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  @IsNotEmpty({ message: 'O sobrenome não pode ser vazio' })
  lastName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  @IsNotEmpty({ message: 'O CPF não pode ser vazio' })
  @IsCPF({ message: 'O CPF informado não é válido' })
  cpf!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  @IsNotEmpty({ message: 'O número de celular não pode ser vazio' })
  @IsMobilePhone('pt-BR', null, { message: 'O número de celular não é valido' })
  cellphone!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  @IsNotEmpty({ message: 'O e-mail não pode ser vazio' })
  @IsEmail({}, { message: 'Forneça um e-mail válido' })
  email!: string;

  @Column({
    type: DataType.ENUM(
      'filiado',
      'desfiliado',
      'expulso',
      'pendente',
      'suspenso',
      'trancado',
    ),
    allowNull: true,
  })
  status: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  agreeStatute!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  agreeRI!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  agreeLGPD!: boolean;

  @Column({
    type: DataType.TEXT('medium'),
    allowNull: true,
    field: 'photo_url',
  })
  photoUrl?: string;

  @HasMany(() => PaymentMonthly, { sourceKey: 'userId', foreignKey: 'userId' })
  paymentMonthlies: PaymentMonthly[];

  @HasOne(() => EmergencyContact, { sourceKey: 'userId', foreignKey: 'userId' })
  emergencyContact: EmergencyContact;

  @HasOne(() => LicenseData, { sourceKey: 'userId', foreignKey: 'userId' })
  licenseData: LicenseData;
}

export default Pilots;
