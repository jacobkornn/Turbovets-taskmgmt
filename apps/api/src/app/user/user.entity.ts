import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn, // ✅ add this
} from 'typeorm';
import { Task } from '../task/task.entity';
import { Organization } from '../organization/organization.entity';

export enum UserRole {
  VIEWER = 'viewer',
  ADMIN = 'admin',
  OWNER = 'owner',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({
    type: 'varchar',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role: UserRole;

  @OneToMany(() => Task, (task) => task.owner)
  tasksOwned: Task[];

  @OneToMany(() => Task, (task) => task.assignedTo)
  tasksAssigned: Task[];

  @ManyToOne(() => Organization, (org) => org.users, { nullable: true, eager: true })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;
}
