import { Controller, Get, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.usersService.findAll(); // returns id/username/role
  }

  // Public endpoint for account creation
  @Post()
  async create(@Body() dto: { username: string; password: string }) {
    if (!dto.username || !dto.password) {
      throw new BadRequestException('Username and password are required');
    }
    return this.usersService.create({
      username: dto.username,
      password: dto.password,
      role: 'viewer', // enforce default role
    });
  }
}