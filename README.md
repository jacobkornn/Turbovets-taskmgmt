# Task Management System

This project was developed as part of a full-stack coding challenge to demonstrate secure role-based access control (RBAC), JWT authentication, and modular monorepo architecture using **NestJS**, **React (Vite)**, and **Nx**.  
It is a working application designed to show practical full-stack development skills, scalable structure, and thoughtful security design.

---

## Setup Instructions

1. **Clone and install**
   ```bash
   git clone <your-repo-url>
   cd task-management-system
   npm install
   ```

2. **Environment setup**  
   Create a `.env` file in the **project root**:
   ```bash
   JWT_SECRET=supersecretkey123
   ```
   The backend uses a local SQLite database (`db.sqlite`) located in the project root that gets created automatically.  
   No additional configuration is required.

3. **Run the project**
   ```bash
   npm start
   ```
   - Backend API: http://localhost:3000  
   - Frontend App: http://localhost:5173  
   (The root `package.json` script runs both using Nx and Concurrently.)

---

## Architecture Overview

### Monorepo Layout
```
apps/
 ├── api/                     # NestJS backend
 │   └── src/
 │       ├── auth/            # JWT authentication and guards
 │       ├── user/            # User entity, controller, and service
 │       └── task/            # Task entity and CRUD operations
 └── frontend/                # React + Vite frontend
     ├── src/
     │   ├── components/      # Reusable UI components
     │   │   ├── Dashboard.jsx
     │   │   ├── Login.jsx
     │   │   ├── CreateAccount.jsx
     │   ├── context/         # Shared state management
     │   │   ├── TokenContext.jsx
     │   │   └── UserContext.jsx
     └── index.html
```

### Rationale
- **Nx** provides consistent tooling and shared TypeScript configuration for both apps.  
- **NestJS** organizes the backend by feature (auth, user, task) for modularity.  
- **React (Vite)** powers the frontend with a fast, modern build system.  
- **SQLite** offers zero-setup persistence while using TypeORM to maintain production-ready structure.  
- `npm start` runs both services concurrently for simple development flow.

---

## Access Control Design & Data Models

### Role Hierarchy
| Role  | Level | Description |
|-------|--------|-------------|
| Owner | 3 | Full authority over the system and all users |
| Admin | 2 | Manage users and tasks within their organization |
| Viewer | 1 | Base role, limited to assigned or created tasks |

This numeric hierarchy allows higher roles to inherit lower-level permissions:  
**Owner (3) > Admin (2) > Viewer (1)**

Role enforcement is centralized through a custom NestJS guard that compares the user’s role level against the required role level for each route.

### Data Models

**User**
- `id` (integer, PK)  
- `username` (string)  
- `password` (hashed)  
- `role` (enum: viewer, admin, owner)

**Task**
- `id` (integer, PK)  
- `title` (string)  
- `description` (string)  
- `createdBy` (foreign key → User)  
- `assignedTo` (foreign key → User)

Access control ensures only the task creator, assignee, or privileged roles (Admin/Owner) can modify tasks.

---

## Sample API Requests & Responses

**Authentication**
- `POST /auth/signup` — Register a new user  
- `POST /auth/login` — Return a JWT access token  

**Users**
- `GET /users` — List users (Admin/Owner only)  
- `POST /users/promote` — Promote a user’s role  

**Tasks**
- `POST /tasks` — Create a new task  
- `GET /tasks` — Fetch tasks accessible to the current user  
- `PUT /tasks/:id` — Update if the user has ownership or elevated role  

All protected routes require a valid JWT.

---

## Future Enhancements

**Security**
- Add refresh tokens and token rotation  
- Implement CSRF protection and rate limiting  
- Integrate Helmet, stricter CORS, and request validation  

**Scalability**
- Migrate to PostgreSQL for production concurrency  
- Cache RBAC checks and sessions with Redis  
- Add audit logging for sensitive actions  

**Extended Features**
- Organization-level ownership and delegated roles  
- Multi-tenant separation  
- Frontend filtering, pagination, and user management enhancements  

---

## Summary

This project demonstrates:
- Secure JWT authentication and hierarchical RBAC  
- Clean Nx monorepo architecture for backend and frontend  
- TypeORM integration with SQLite for simple persistence  
- A functional React (Vite) frontend tied directly to a NestJS API  
- A codebase designed for maintainability, scalability, and clarity

Built to emphasize both **technical execution** and **architectural design quality** in a full-stack environment.
