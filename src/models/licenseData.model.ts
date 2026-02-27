import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import User from './users.model';
import Pilots from './pilots.model';

@Table({ tableName: 'license_data' })
class LicenseData extends Model<LicenseData> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true,
  })
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Pilots, { foreignKey: 'userId', targetKey: 'userId' })
  pilot: Pilots;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  civl: string;

  @Column({
    type: DataType.ENUM('I', 'II', 'III', 'IV', 'V'),
    allowNull: true,
  })
  pilotLevel: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  cbvlExpiration: Date;

  @Column({
    type: DataType.TEXT('medium'),
    allowNull: true,
  })
  imgCbvl: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  anacExpiration: Date;

  @Column({
    type: DataType.TEXT('medium'),
    allowNull: true,
  })
  imgAnac: string;

  @Column({
    type: DataType.ENUM('Confirmar', 'Confirmado'),
    allowNull: false,
    defaultValue: 'Confirmar',
  })
  status: string;
}

export default LicenseData;
