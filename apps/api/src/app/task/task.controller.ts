import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../user/users.service';

@Controller('tasks')
export class TaskController {
  constructor(
    private taskService: TaskService,
    private usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req) {
    const user = await this.usersService.findById(req.user.sub);
    if (!user) throw new UnauthorizedException('User not found');
    return this.taskService.getScopedTasks(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateTaskDto, @Req() req) {
    const user = await this.usersService.findById(req.user.sub);
    if (!user) throw new UnauthorizedException('User not found');
    return this.taskService.createTask(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: Partial<CreateTaskDto>, @Req() req) {
    const user = await this.usersService.findById(req.user.sub);
    if (!user) throw new UnauthorizedException('User not found');
    return this.taskService.updateTask(id, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: number, @Req() req) {
    const user = await this.usersService.findById(req.user.sub);
    if (!user) throw new UnauthorizedException('User not found');
    return this.taskService.deleteTask(id, user);
  }
}
