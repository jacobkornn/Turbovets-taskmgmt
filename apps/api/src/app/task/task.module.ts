import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { UsersModule } from '../user/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task]), UsersModule],
  providers: [TaskService],
  controllers: [TaskController],
})
export class TaskModule {}