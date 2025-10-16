import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepo.find({
      relations: ['organization'], 
      order: { id: 'ASC' },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { username },
      relations: ['organization'],
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: ['organization'],
    });
  }

  async create(user: { username: string; password: string; role?: string }) {
    const exists = await this.userRepo.findOne({ where: { username: user.username } });
    if (exists) {
      throw new BadRequestException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    const roleLower = user.role?.toLowerCase();
    const newUser = this.userRepo.create({
      username: user.username,
      password: hashedPassword,
      role:
        roleLower === 'owner'
          ? UserRole.OWNER
          : roleLower === 'admin'
          ? UserRole.ADMIN
          : UserRole.VIEWER,
    });

    const saved = await this.userRepo.save(newUser);
    return this.userRepo.findOne({
      where: { id: saved.id },
      relations: ['organization'],
    });
  }

  async promoteRole(id: number, role: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new BadRequestException('User not found');

    const roleLower = role?.toLowerCase();
    user.role =
      roleLower === 'owner'
        ? UserRole.OWNER
        : roleLower === 'admin'
        ? UserRole.ADMIN
        : UserRole.VIEWER;

    const saved = await this.userRepo.save(user);
    return this.userRepo.findOne({
      where: { id: saved.id },
      relations: ['organization'], // ✅ again, consistent response
    });
  }
}
