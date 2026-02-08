# TaskFlow API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Sign Up
**POST** `/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

#### Login
**POST** `/auth/login`

Authenticate and get a JWT token.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

#### Get Current User
**GET** `/auth/me`

Get the authenticated user's information.

**Response (200):**
```json
{
  "_id": "user_id",
  "email": "admin@example.com",
  "name": "Admin User",
  "role": "admin",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### Projects

#### Get All Projects
**GET** `/projects`

Get all projects owned or member of by the current user.

**Response (200):**
```json
[
  {
    "_id": "project_id",
    "name": "Project Alpha",
    "description": "Main project",
    "owner": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "members": [
      {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### Create Project
**POST** `/projects`

Create a new project.

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description"
}
```

**Response (201):**
```json
{
  "_id": "project_id",
  "name": "New Project",
  "description": "Project description",
  "owner": { ... },
  "members": [ ... ],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Get Project by ID
**GET** `/projects/:id`

Get a specific project details.

**Response (200):**
```json
{
  "_id": "project_id",
  "name": "Project Alpha",
  "description": "Main project",
  "owner": { ... },
  "members": [ ... ],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Update Project
**PUT** `/projects/:id`

Update project details (owner only).

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "_id": "project_id",
  "name": "Updated Project Name",
  "description": "Updated description",
  "owner": { ... },
  "members": [ ... ],
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

#### Delete Project
**DELETE** `/projects/:id`

Delete a project (owner only).

**Response (200):**
```json
{
  "message": "Project deleted"
}
```

---

### Tasks

#### Get Tasks by Project
**GET** `/tasks/project/:projectId`

Get all tasks for a specific project.

**Response (200):**
```json
[
  {
    "_id": "task_id",
    "title": "Task Title",
    "description": "Task description",
    "status": "todo",
    "priority": "high",
    "project": "project_id",
    "assignee": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "dueDate": "2024-01-20T10:30:00Z",
    "order": 0,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### Create Task
**POST** `/tasks`

Create a new task.

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "projectId": "project_id",
  "priority": "medium",
  "dueDate": "2024-01-20T10:30:00Z"
}
```

**Response (201):**
```json
{
  "_id": "task_id",
  "title": "New Task",
  "description": "Task description",
  "status": "todo",
  "priority": "medium",
  "project": "project_id",
  "assignee": null,
  "dueDate": "2024-01-20T10:30:00Z",
  "order": 0,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Update Task
**PUT** `/tasks/:id`

Update task details.

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "inprogress",
  "priority": "high",
  "assignee": "user_id",
  "dueDate": "2024-01-25T10:30:00Z"
}
```

**Response (200):**
```json
{
  "_id": "task_id",
  "title": "Updated Title",
  "description": "Updated description",
  "status": "inprogress",
  "priority": "high",
  "project": "project_id",
  "assignee": { ... },
  "dueDate": "2024-01-25T10:30:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

#### Reorder Task (Drag & Drop)
**PUT** `/tasks/:id/reorder`

Move task to a different column.

**Request Body:**
```json
{
  "status": "done",
  "order": 2
}
```

**Response (200):**
```json
{
  "_id": "task_id",
  "title": "Task Title",
  "status": "done",
  "order": 2,
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

#### Delete Task
**DELETE** `/tasks/:id`

Delete a task.

**Response (200):**
```json
{
  "message": "Task deleted"
}
```

---

## WebSocket Events

The application uses WebSockets for real-time updates. Connect to:

```
ws://localhost:3001
```

### Events Broadcast by Server

#### task-created
```json
{
  "type": "task-created",
  "data": { ...task object },
  "timestamp": 1705315800000
}
```

#### task-updated
```json
{
  "type": "task-updated",
  "data": { ...updated task object },
  "timestamp": 1705315800000
}
```

#### task-deleted
```json
{
  "type": "task-deleted",
  "data": {
    "taskId": "task_id"
  },
  "timestamp": 1705315800000
}
```

#### task-reordered
```json
{
  "type": "task-reordered",
  "data": { ...reordered task object },
  "timestamp": 1705315800000
}
```

---

## Status Codes

- **200** - OK
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **500** - Server Error

## Error Response Format

```json
{
  "error": "Error message describing what went wrong"
}
```

---

## Demo Credentials

- **Admin**: 
  - Email: `admin@example.com`
  - Password: `123456`

- **User**:
  - Email: `user@example.com`
  - Password: `123456`

---

## Feature Checklist

- ✅ User Authentication (JWT + bcrypt)
- ✅ Project Management (CRUD operations)
- ✅ Task Management with Kanban board
- ✅ Drag-and-drop task reordering
- ✅ Task Priority levels (low, medium, high)
- ✅ Task status (todo, inprogress, done)
- ✅ Real-time updates via WebSocket
- ✅ Protected routes and endpoints
- ✅ MongoDB integration
- ✅ Responsive UI with Tailwind CSS

---

## Environment Variables

Create a `.env` file in the root directory:

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your-super-secret-jwt-key-change-this

VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

---

## Running the Application

### Development

1. **Frontend**:
```bash
npm run dev
```

2. **Backend** (in a separate terminal):
```bash
npm run backend:dev
```

3. Make sure MongoDB is running locally or update `MONGODB_URI` in `.env`

### Production Build

```bash
npm run build
```
