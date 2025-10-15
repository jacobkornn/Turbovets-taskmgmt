import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SeedAdminService } from './seed-admin.service';
import { PromoteRoleController } from './promote-role.controller';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, SeedAdminService],
  controllers: [UsersController, PromoteRoleController],
  exports: [UsersService],
})
export class UsersModule {}