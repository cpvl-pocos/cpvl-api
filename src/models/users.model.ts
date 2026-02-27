import { Table, Column, Model, DataType, HasOne } from 'sequelize-typescript';
import EmergencyContact from './emergencycontact.model';

@Table({ tableName: 'users' })
class User extends Model<User> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  username: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;

  @Column({
    type: DataType.ENUM('admin', 'fiscal', 'piloto'),
    allowNull: false,
  })
  role: 'admin' | 'fiscal' | 'piloto';

  @HasOne(() => EmergencyContact)
  emergencyContact: EmergencyContact;
}

export default User;
