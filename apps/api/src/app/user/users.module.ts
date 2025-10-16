import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PromoteRoleController } from './promote-role.controller';
import { User } from './user.entity';
import { Organization } from '../organization/organization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization])],
  providers: [UsersService],
  controllers: [UsersController, PromoteRoleController],
  exports: [UsersService],
})
export class UsersModule {}