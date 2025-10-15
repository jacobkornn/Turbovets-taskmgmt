import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { User, UserRole } from '../user/user.entity';
import { Task } from './task.entity';

describe('Task RBAC (viewer cannot assign)', () => {
  let app: INestApplication;
  let usersRepo: Repository<User>;
  let tasksRepo: Repository<Task>;
  let token: string;
  let viewer: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    usersRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    tasksRepo = moduleFixture.get<Repository<Task>>(getRepositoryToken(Task));

    // Reset state for idempotent tests
    await tasksRepo.clear();
    await usersRepo.delete({ username: 'viewer1' });

    // Seed a viewer user
    const hashed = await bcrypt.hash('viewerpass', 10);
    viewer = usersRepo.create({
      username: 'viewer1',
      password: hashed,
      role: UserRole.VIEWER,
    });
    viewer = await usersRepo.save(viewer);

    // Login as viewer1
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'viewer1', password: 'viewerpass' })
      .expect(201);

    token = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should not allow a viewer to assign a task to someone else', async () => {
    // Create a task and attempt to spoof assignedTo = 999
    const createRes = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'RBAC test task',
        // omit status so default 'todo' is used, or explicitly:
        status: 'todo',
        assignedTo: 999,
      })
      .expect(201);

    const taskId: number = createRes.body.id;
    expect(taskId).toBeDefined();

    // Fetch from DB with relations
    const taskInDb = await tasksRepo.findOne({
      where: { id: taskId },
      relations: ['owner', 'assignedTo'],
    });
    expect(taskInDb).toBeDefined();

    // Owner must be the viewer who created it
    expect(taskInDb!.owner.id).toBe(viewer.id);

    // assignedTo must remain null (viewer couldn’t assign to another user)
    expect(taskInDb!.assignedTo).toBeNull();
  });
});