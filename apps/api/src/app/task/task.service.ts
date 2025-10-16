import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { User } from '../user/user.entity';
import { UsersService } from '../user/users.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    private usersService: UsersService,
  ) {}

  async getScopedTasks(user: Partial<User>): Promise<Task[]> {
    const isPrivileged = ['admin', 'owner'].includes((user.role ?? '').toLowerCase());
    const query = this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.owner', 'owner')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('task.organization', 'organization')
      .orderBy('task.id', 'DESC');

    if (!isPrivileged && user.organization?.id) {
      query.where('organization.id = :orgId', { orgId: user.organization.id });
    }

    return query.getMany();
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
      organization: creator.organization || null,
    });

    try {
      return await this.taskRepo.save(task);
    } catch (err) {
      console.error('Task save failed:', err);
      throw new InternalServerErrorException('Could not create task');
    }
  }

  async updateTask(id: number, dto: Partial<CreateTaskDto>, user: Partial<User>) {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['owner', 'assignedTo', 'organization'],
    });
    if (!task) throw new NotFoundException('Task not found');

    const isPrivileged = ['admin', 'owner'].includes((user.role ?? '').toLowerCase());
    const isOwner = task.owner?.id === user.id;
    const sameOrg = user.organization?.id === task.organization?.id;

    if (!isPrivileged && (!isOwner || !sameOrg)) {
      throw new ForbiddenException('Not authorized to update this task');
    }

    if (dto.title) task.title = dto.title;
    if (dto.status) task.status = dto.status;

    if (dto.assignedTo) {
      const assignedUser = await this.usersService.findById(dto.assignedTo);
      task.assignedTo = assignedUser ?? null;
    }

    try {
      return await this.taskRepo.save(task);
    } catch (err) {
      console.error('Task update failed:', err);
      throw new InternalServerErrorException('Could not update task');
    }
  }

  async deleteTask(id: number, user: Partial<User>) {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['owner', 'organization'],
    });
    if (!task) throw new NotFoundException('Task not found');

    const isPrivileged = ['admin', 'owner'].includes((user.role ?? '').toLowerCase());
    const isOwner = task.owner?.id === user.id;
    const sameOrg = user.organization?.id === task.organization?.id;

    if (!isPrivileged && (!isOwner || !sameOrg)) {
      throw new ForbiddenException('Not authorized to delete this task');
    }

    await this.taskRepo.remove(task);
    return { message: 'Task deleted successfully', id };
  }
}
