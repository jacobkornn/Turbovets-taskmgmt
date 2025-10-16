# Task Management System

A full-stack web application implementing **Role-Based Access Control (RBAC)** for task management across organizations.  
Built using **NestJS**, **React (Vite)**, and **SQLite**, the project demonstrates authentication, access control, and modular architecture within an **Nx monorepo**.

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- npm 9+
- Nx CLI (`npm install -g nx`)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create an `.env` at the project root:

```
JWT_SECRET=supersecret
```

### 3. Run Backend and Frontend one command
```bash
npm start
```

### 4. Default Seed Data
When the backend starts, it seeds:
- One **Owner** and one **Admin**
- Parent org (Org A) with two children (Org B, Org C)

---

## 🏗️ Architecture Overview

### Monorepo Layout
```
## 🗃 Repository Structure (important backend & frontend files)

```bash
apps/
├── api/                                   # Backend (NestJS + TypeORM + SQLite)
│   └── src/app/
│       ├── app.controller.ts              # Root controller (health/default)
│       ├── app.module.ts                  
│       ├── app.service.ts                 
│       │
│       ├── auth/                          # Authentication & RBAC
│       │   ├── auth.controller.ts         # /auth routes (e.g., login)
│       │   ├── auth.module.ts             
│       │   ├── auth.service.ts            # Verifies users, issues JWTs
│       │   ├── jwt-auth.guard.ts          # Protects routes with JWT
│       │   ├── jwt.strategy.ts            # Passport JWT strategy
│       │   ├── roles.decorator.ts         
│       │   └── roles.guard.ts             # Role-based access guard
│       │
│       ├── organization/                  # Organization hierarchy
│       │   ├── organization.controller.ts
│       │   ├── organization.module.ts
│       │   ├── organization.service.ts
│       │   └── organization.entity.ts
│       │
│       ├── task/                          # Task management
│       │   ├── task.controller.ts         # CRUD endpoints
│       │   ├── task.module.ts             # Task feature module
│       │   ├── task.service.ts            # Business logic (org/role scoping)
│       │   ├── task.entity.ts             
│       │   └── task.rbac.spec.ts          # Jest: viewer cannot assign others
│       │
│       └── user/                          # User management
│           ├── users.controller.ts
│           ├── users.module.ts
│           ├── users.service.ts
│           └── user.entity.ts
│
└── frontend/                              # Frontend (React + Vite, TypeScript)
    └── src/
        ├── App.tsx                        
        ├── main.tsx                       # Entry point / bootstrap
        │
        │
        ├── components/                    # Page-level components
        │   ├── Dashboard.tsx              # Main authenticated task view
        │   ├── Login.tsx                  # Login form + auth flow
        │   └── CreateAccount.tsx          # User signup flow
        │
        └── context/                       # Global state providers
            ├── AuthContext.tsx            # Auth/token state + helpers
            └── UserContext.tsx            # Current user profile/role/org

```

- **apps/api** handles authentication, role enforcement, and CRUD operations.
- **apps/dashboard** consumes these APIs for login and task management.
- **libs/** modules ensure type-safe sharing between frontend and backend.

---

## 🔐 Access Control Design

### Roles

| Role | Scope |
|------|--------|
| **Viewer** | Can view and create tasks only within their own organization |
| **Admin**  | Can view/edit tasks across all organizations |
| **Owner**  | Full control (manage users, orgs, and tasks) |

### Organization Hierarchy
- Parent organization can contain multiple child organizations.
- Relationships:
  - `User → Organization` (many-to-one)
  - `Organization → Task` (one-to-many)

### Enforcement Logic
```ts
if (['admin', 'owner'].includes(user.role)) {
  return allTasks;
}
return tasks.filter(t => t.organization.id === user.organization.id);
```

---

## 🧱 Data Models

### User
| Field | Type | Description |
|--------|------|-------------|
| id | int | PK |
| username | string | unique |
| password | string | bcrypt hash |
| role | enum | viewer/admin/owner |
| organizationId | FK | user's organization |

### Organization
| Field | Type | Description |
|--------|------|-------------|
| id | int | PK |
| name | string | organization name |
| parentId | int (nullable) | parent organization reference |

### Task
| Field | Type | Description |
|--------|------|-------------|
| id | int | PK |
| title | string | task title |
| status | enum | todo/inprogress/done |
| assignedToId | FK | user assigned |
| organizationId | FK | organization |
| ownerId | FK | task creator |

---

## 🔑 Authentication

- Implemented using **JWT**.
- `/auth/login` issues a signed token.
- Token is stored in localStorage on the frontend.
- All secured routes require:
  ```
  Authorization: Bearer <token>
  ```
- Backend validates tokens via `JwtAuthGuard`.

---

# 🧠 API Overview

All secured routes require:
```
Authorization: Bearer <token>
```

---

## 🔹 Auth
**POST /auth/login** — Authenticate user  
_Request_
```json
{ "username": "viewer", "password": "password" }
```
_Response_
```json
{ "access_token": "<jwt>" }
```

---

## 🔹 Users
**GET /users** — Get all users (JWT required)  
```json
[
  { "id": 1, "username": "owner", "role": "owner" },
  { "id": 2, "username": "admin", "role": "admin" }
]
```

**POST /users** — Create new user  
```json
{ "username": "newuser", "password": "testpass" }
```
_Response_
```json
{ "id": 4, "username": "newuser", "role": "viewer" }
```

---

## 🔹 Tasks
**GET /tasks** — Fetch tasks (scoped by role/org)  
```json
[
  { "id": 1, "title": "Review API security", "status": "in-progress" }
]
```

**POST /tasks** — Create new task  
```json
{ "title": "Design RBAC guard", "status": "todo" }
```

**PUT /tasks/:id** — Update task  
```json
{ "status": "done" }
```

**DELETE /tasks/:id** — Remove task (admin/owner only)

---

## 🧪 Testing

Limited testing was implemented to validate **RBAC enforcement**.

### Example: Viewer cannot assign others to a task
```ts
it('should not allow a viewer to assign a task to someone else', async () => {
  const createRes = await request(app.getHttpServer())
    .post('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'RBAC test task', assignedTo: 999 })
    .expect(201);

  const taskId = createRes.body.id;
  const taskInDb = await tasksRepo.findOne({
    where: { id: taskId },
    relations: ['owner', 'assignedTo'],
  });

  expect(taskInDb!.owner.id).toBe(viewer.id);
  expect(taskInDb!.assignedTo).toBeNull();
});
```

---

## 🧩 Future Enhancements

| Area | Potential Improvement |
|-------|------------------------|
| **Security** | JWT refresh tokens, CSRF protection |
| **Scalability** | Switch to PostgreSQL, add caching layer |
| **Access Control** | Role delegation and granular permissions |
| **UI/UX** | Drag-and-drop task ordering, dark/light mode |
| **Auditing** | Persisted audit log and admin export |

---

## 🧑‍💻 Author
**Jacob Korn**  
Task Management System – Coding Challenge Implementation
