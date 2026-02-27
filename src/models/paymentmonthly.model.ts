import { IsCurrency } from 'class-validator';
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import Pilots from './pilots.model';

@Table({ tableName: 'paymentMonthlies' })
class PaymentMonthly extends Model<PaymentMonthly> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  id: number;

  @ForeignKey(() => Pilots)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @BelongsTo(() => Pilots, { foreignKey: 'userId', targetKey: 'userId' })
  pilot: Pilots;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  ref_year: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  ref_month: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: true,
  })
  @IsCurrency({ message: 'Forneça um valor numérico' })
  amount: number;

  @Column({
    type: DataType.ENUM('mensal', 'trimestral', 'semestral', 'anual'),
    allowNull: true,
  })
  type: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.ENUM('Confirmar', 'Confirmado'),
    allowNull: true,
  })
  status: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  date: Date;
}

export default PaymentMonthly;
