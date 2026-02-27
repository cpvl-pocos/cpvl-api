import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import User from './users.model';

@Table({ tableName: 'emergency_contacts' })
class EmergencyContact extends Model<EmergencyContact> {
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

  @Column({
    type: DataType.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allowNull: true,
  })
  bloodType: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  emergencyPhone: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  emergencyContactName: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  allergies: string;
}

export default EmergencyContact;
