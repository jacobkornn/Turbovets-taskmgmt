import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { UsersService } from '../user/users.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    private usersService: UsersService,
  ) {}

  /**
   * Return every task for any logged-in user.
   */
  async getScopedTasks(user: Partial<User>): Promise<Task[]> {
    return this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.owner', 'owner')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .orderBy('task.id', 'DESC')
      .getMany();
  }

  async createTask(dto: CreateTaskDto, creator: Partial<User>) {
    const assignedUser =
      typeof dto.assignedTo === 'number'
        ? await this.usersService.findById(dto.assignedTo)
        : creator.role !== 'admin'
        ? creator
        : null;

    const task = this.taskRepo.create({
      title: dto.title,
      status: dto.status,
      assignedTo: assignedUser,
      owner: creator,
    });

    try {
      return await this.taskRepo.save(task);
    } catch (err) {
      console.error('Task save failed:', err);
      throw new InternalServerErrorException('Could not create task');
    }
  }
}