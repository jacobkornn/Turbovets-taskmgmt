import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class SeedAdminService implements OnApplicationBootstrap {
  constructor(private readonly usersService: UsersService) {}

  async onApplicationBootstrap() {
    const existing = await this.usersService.findByUsername('admin');
    if (!existing) {
      await this.usersService.create({
        username: 'admin',
        password: 'password',
        role: 'admin',
      });
      console.log('[seed] Admin user created');
    } else {
      console.log('[seed] Admin user already exists');
    }
  }
}