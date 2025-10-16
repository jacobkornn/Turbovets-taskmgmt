// src/app/seed/seed.ts
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user/user.entity';
import { Organization } from './organization/organization.entity';
import { INestApplicationContext } from '@nestjs/common';

export async function seedDatabase(app: INestApplicationContext) {
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const orgRepo = app.get<Repository<Organization>>(getRepositoryToken(Organization));

  const existingUsers = await userRepo.count();
  const existingOrgs = await orgRepo.count();
  if (existingUsers > 0 || existingOrgs > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding organizations and users...');

  const orgA = orgRepo.create({ name: 'Organization A' });
  await orgRepo.save(orgA);

  const orgB = orgRepo.create({ name: 'Organization B', parent: orgA });
  const orgC = orgRepo.create({ name: 'Organization C', parent: orgA });
  await orgRepo.save([orgB, orgC]);

  const admin = userRepo.create({
    username: 'admin',
    password: await bcrypt.hash('admin123', 10),
    role: UserRole.ADMIN,
    organization: orgA,
  });

  const owner = userRepo.create({
    username: 'owner',
    password: await bcrypt.hash('owner123', 10),
    role: UserRole.OWNER,
    organization: orgA,
  });

  await userRepo.save([admin, owner]);

  console.log('Seed complete — Organizations A/B/C and users seeded.');
}
