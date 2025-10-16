# 🧠 Secure Task Management System

A full-stack web application implementing **Role-Based Access Control (RBAC)** for secure task management across organizations.  
Built as a modular **Nx monorepo** using **NestJS + React + SQLite**, the system demonstrates clean architecture, secure JWT authentication, and fine-grained authorization.

---

## ⚙️ Setup Instructions

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Environment Variables
Create `.env` files for both apps.

**apps/api/.env**
```
JWT_SECRET=supersecret
DATABASE_URL=sqlite://./db.sqlite
PORT=3000
```

**apps/dashboard/.env**
```
VITE_API_URL=http://localhost:3000
```

### 3️⃣ Start the Backend
```bash
npx nx serve api
```
This runs the NestJS server on `http://localhost:3000`.

### 4️⃣ Start the Frontend
```bash
npx nx serve dashboard
```
This runs the React (Vite) dashboard on `http://localhost:5173`.

### 5️⃣ Default Seeded Data
- **Users**: `owner`, `admin`, `viewer`
- **Orgs**: `ParentOrg` with children `OrgA`, `OrgB`
- Password for all: `password`

---

## 🏗️ Architecture Overview

### 🧩 Monorepo Layout
```
apps/
  api/          → NestJS backend (Auth, Tasks, Users, Orgs)
  dashboard/    → React frontend (Task board with filters, CRUD)
libs/
  auth/         → Shared RBAC guards & role constants
  data/         → Shared DTOs & TypeScript interfaces
```

### 🎯 Why Nx
Nx enables **modularity** and **type-safe sharing** between frontend and backend.  
Each component is isolated but can reuse logic from shared libs, ensuring consistency in DTOs and authentication behavior.

---

## 🔐 Access Control Design

### Roles & Permissions

| Role | Access Scope |
|------|---------------|
| **Viewer** | View tasks within own organization only |
| **Admin**  | View/edit all tasks across all organizations |
| **Owner**  | System-wide control (can delete users/orgs) |

### Organization Hierarchy
Two-tier structure:
- Parent Organization
- Multiple Child Organizations

Relationships:
- `User → Organization` (many-to-one)  
- `Organization → Task` (one-to-many)

### Enforcement Logic (Backend)
```ts
if (['admin', 'owner'].includes(user.role)) {
  return allTasks;
}
return tasks.filter(t => t.organization.id === user.organization.id);
```

### JWT Authentication
1. Users log in at `/auth/login` with username/password.  
2. Backend issues JWT signed with `JWT_SECRET`.  
3. Frontend stores token in `localStorage`.  
4. Each API call attaches:  
   ```
   Authorization: Bearer <token>
   ```
5. Backend validates token via NestJS `JwtAuthGuard`.

---

## 🧱 Data Models

### Entity Diagram

```
User ───▶ Organization ───▶ Task
  │                         │
  └────── role (Viewer/Admin/Owner)
```

### Tables

**User**
| Field | Type | Description |
|--------|------|-------------|
| id | int | PK |
| username | string | unique |
| password | string | bcrypt-hashed |
| role | enum | viewer/admin/owner |
| organizationId | FK | reference to org |

**Organization**
| Field | Type | Description |
|--------|------|-------------|
| id | int | PK |
| name | string | org name |
| parentId | int (nullable) | parent org |

**Task**
| Field | Type | Description |
|--------|------|-------------|
| id | int | PK |
| title | string | task title |
| status | enum | ToDo/InProgress/Done |
| assignedToId | FK | user |
| organizationId | FK | org |
| ownerId | FK | creator |

---

## 🧠 Sample API

### 🔹 Login
**Request**
```bash
POST /auth/login
Content-Type: application/json
{
  "username": "viewer",
  "password": "password"
}
```

**Response**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

---

### 🔹 Get Tasks (Scoped)
**Request**
```bash
GET /tasks
Authorization: Bearer <token>
```

**Response**
```json
[
  {
    "id": 1,
    "title": "Review API security",
    "status": "InProgress",
    "assignedTo": { "username": "viewer" },
    "organization": { "name": "OrgA" }
  }
]
```

---

### 🔹 Create Task
**Request**
```bash
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json
{
  "title": "Design role guard",
  "status": "ToDo",
  "assignedToId": 3,
  "organizationId": 2
}
```

**Response**
```json
{
  "id": 8,
  "title": "Design role guard",
  "status": "ToDo",
  "organization": { "id": 2, "name": "OrgB" },
  "assignedTo": { "id": 3, "username": "viewer" }
}
```

---

### 🔹 Audit Log (Owner/Admin only)
**Request**
```bash
GET /audit-log
Authorization: Bearer <token>
```

**Response**
```json
[
  {
    "timestamp": "2025-10-15T17:03:21Z",
    "action": "DELETE /tasks/4",
    "performedBy": "admin",
    "result": "success"
  }
]
```

---

## 💻 Frontend Highlights

- React (Vite) SPA using Context API for auth state.  
- Three task columns: **To Do / In Progress / Done**.  
- Filter by Status, User, Organization.  
- Inline editing + deletion (Admin/Owner only).  
- “Welcome back, {username}” header after login.  

---

## 🧪 Testing

### Backend
- Unit tests with **Jest** for:
  - JWT guard
  - Role guard
  - TaskService filtering
  - CRUD endpoints

### Frontend
- Component tests for:
  - Dashboard filters
  - Add/Save workflow
  - Auth persistence

---

## 🔮 Future Enhancements

| Area | Enhancement |
|-------|--------------|
| **Security** | Add JWT refresh tokens · CSRF protection · Password reset flow |
| **Scalability** | Switch to PostgreSQL + connection pooling · Caching layer for RBAC checks |
| **UX/UI** | Drag-and-drop task ordering · Dark/light mode toggle |
| **Analytics** | Org-level dashboards and completion metrics |
| **Auditing** | Persistent audit logs and admin export |

---

## 🧑‍💻 Author
**Jacob Korn**  
Full-Stack Developer · Focused on secure, modular web systems
