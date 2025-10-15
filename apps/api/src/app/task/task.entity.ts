import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
//import { Organization } from '../organization/organization.entity';

export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'varchar', default: 'todo' })
  status: TaskStatus;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'varchar', default: 'medium' })
  priority: TaskPriority;

  @Column({ type: 'datetime', nullable: true })
  dueDate: Date;

  @ManyToOne(() => User, { nullable: true })
  assignedTo: User;

  @ManyToOne(() => User)
  owner: User;

//   @ManyToOne(() => Organization)
//   organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}