import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { Organization } from '../organization/organization.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>, // ✅ ensures we can load organizations
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

  async create(user: { username: string; password: string; role?: string; organization?: number }) {
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

    // ✅ Look up and assign organization if provided
    if (user.organization) {
      const orgEntity = await this.orgRepo.findOne({ where: { id: user.organization } });
      if (orgEntity) {
        newUser.organization = orgEntity;
      } else {
        console.warn(`⚠️ Organization with ID ${user.organization} not found.`);
      }
    }

    try {
      const saved = await this.userRepo.save(newUser);
      return this.userRepo.findOne({
        where: { id: saved.id },
        relations: ['organization'],
      });
    } catch (err) {
      console.error('❌ User creation failed:', err);
      throw new InternalServerErrorException('Could not create user');
    }
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
      relations: ['organization'],
    });
  }
}
