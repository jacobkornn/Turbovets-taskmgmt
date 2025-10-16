import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto } from './create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ Protected endpoint (requires valid JWT)
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.usersService.findAll(); // returns id/username/role/organization
  }

  // ✅ Public endpoint for account creation
  @Post()
  async create(@Body() dto: CreateUserDto) {
    if (!dto.username || !dto.password) {
      throw new BadRequestException('Username and password are required');
    }

    return this.usersService.create({
      username: dto.username,
      password: dto.password,
      role: dto.role || 'viewer', // default role
      organization: dto.organization, // ✅ forward organization to service
    });
  }
}
