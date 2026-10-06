# TaskFlow

TaskFlow is a backend-focused job queue and task processing platform built with Node.js, Express.js, MongoDB, Redis, and BullMQ.

It allows clients to create and track asynchronous jobs while dedicated background workers process those jobs independently from the API server.

---

## Overview

Traditional API applications often perform time-consuming operations directly inside an HTTP request. This can make requests slow, increase server load, and make failures harder to handle.

TaskFlow separates job creation from job execution.

A client creates a job through the REST API. The API stores the job in MongoDB and places it into a BullMQ queue backed by Redis. A separate worker consumes the queued job, processes it asynchronously, and updates the job status.

The project demonstrates practical implementation of:

- REST APIs
- JWT authentication
- Role-based authorization
- MongoDB data persistence
- Redis
- BullMQ job queues
- Background workers
- Asynchronous processing
- Job retries
- Delayed and scheduled jobs
- Job priorities
- Concurrency
- Progress tracking
- WebSocket-based real-time updates
- Request validation
- Error handling
- Rate limiting
- Docker
- Docker Compose
- Nginx

---

## Architecture

```text
                         Client
                           |
                           v
                    React Frontend
                           |
                           v
                         Nginx
                           |
                           v
                    Express API
                    /           \
                   /             \
                  v               v
             MongoDB            Redis
                                  |
                                  v
                            BullMQ Queue
                                  |
                                  v
                           Background Worker
                                  |
                                  v
                            Job Processing
                                  |
                                  v
                         Job Status Update
                                  |
                                  v
                         WebSocket Update
                                  |
                                  v
                          React Frontend
```

---

## Job Processing Flow

```text
1. Client creates a job
          |
          v
2. API validates the request
          |
          v
3. Job is stored in MongoDB
          |
          v
4. Job is added to BullMQ
          |
          v
5. Redis manages the queue
          |
          v
6. Worker picks up the job
          |
          v
7. Job status -> processing
          |
          v
8. Worker executes the task
          |
          v
9. Job status -> completed / failed
          |
          v
10. WebSocket update sent to clients
```

---

# Key Features

## Authentication & Authorization

- User registration and login
- Password hashing with bcrypt
- JWT-based authentication
- Protected routes
- Role-based authorization
- Admin-specific operations

## Job Management

- Create jobs through REST APIs
- Retrieve jobs
- Filter jobs by status and priority
- Pagination and sorting
- Job status tracking
- Job progress tracking
- Job attempts and error information

## Background Processing

TaskFlow uses BullMQ and Redis to process jobs asynchronously.

Supported concepts include:

- Background workers
- Job queues
- Job priorities
- Retries
- Delayed jobs
- Scheduled jobs
- Concurrency
- Failed jobs
- Job progress

## Real-Time Updates

Socket.IO is used to provide real-time job status updates to the frontend.

For example:

```text
pending
   |
   v
processing
   |
   v
completed
```

The frontend can receive status changes without continuously polling the API.

## Security & Reliability

- Request validation
- Centralized error handling
- Authentication middleware
- Role-based authorization
- API rate limiting
- Environment-based configuration
- Secure secret handling

---

# Tech Stack

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Redis
- BullMQ
- Socket.IO
- JWT
- bcrypt

## Frontend

- React
- Vite
- Axios
- Socket.IO Client

## Infrastructure

- Docker
- Docker Compose
- Nginx

## Testing

- Jest
- Supertest

---

# Project Structure

```text
TaskFlow/
|
├── frontend/
|   ├── src/
|   ├── public/
|   ├── Dockerfile
|   ├── nginx.conf
|   ├── package.json
|   └── vite.config.js
|
├── src/
|   ├── config/
|   ├── controllers/
|   ├── middleware/
|   ├── models/
|   ├── queues/
|   ├── routes/
|   ├── sockets/
|   ├── utils/
|   ├── validators/
|   ├── workers/
|   ├── app.js
|   └── server.js
|
├── tests/
|
├── Dockerfile
├── .dockerignore
├── compose.yaml
├── compose.prod.yaml
├── .env.example
├── jest.setup.js
├── package.json
├── package-lock.json
└── README.md
```

---

# Backend Architecture

The backend is organized into separate responsibilities.

## `controllers/`

Contains request handling and business logic for users, authentication, and jobs.

## `routes/`

Defines REST API endpoints.

## `models/`

Contains Mongoose schemas and MongoDB models.

## `middleware/`

Contains reusable middleware for:

- Authentication
- Authorization
- Validation
- Error handling
- Rate limiting

## `queues/`

Contains BullMQ queue configuration used to add jobs to Redis-backed queues.

## `workers/`

Contains background worker processes responsible for consuming and processing jobs.

## `sockets/`

Contains Socket.IO configuration and real-time job update functionality.

## `validators/`

Contains request validation schemas.

## `config/`

Contains application configuration such as database and Redis connections.

---

# Job Lifecycle

TaskFlow uses a defined job lifecycle:

```text
pending
   |
   v
processing
   |
   +-------------> completed
   |
   +-------------> failed
```

Jobs can also be delayed, scheduled, retried, or cancelled depending on their state and configuration.

---

# API

## Health Check

```http
GET /api/health
```

Used to verify that the API is running.

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

## Users

```http
GET    /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id
```

## Jobs

The job API provides endpoints for creating and managing background jobs, including filtering, pagination, sorting, status tracking, and job processing.

---

# Environment Variables

Create a `.env` file in the project root.

Example:

```env
PORT=3000

MONGODB_URI=mongodb://mongodb:27017/

REDIS_URL=redis://redis:6379

JWT_SECRET=your_secure_jwt_secret
```

Never commit the real `.env` file.

A safe template is provided in:

```text
.env.example
```

---

# Running the Project

## Prerequisites

Install:

- Node.js
- Docker Desktop
- Git

---

## Run with Docker Compose

The recommended way to run the complete application is:

```bash
docker compose up --build
```

This starts:

```text
Frontend
API
Worker
MongoDB
Redis
```

The frontend is available at:

```text
http://localhost:5173
```

The API is available at:

```text
http://localhost:3000
```

Stop the application with:

```bash
docker compose down
```

---

# Production Docker Configuration

A production-oriented Compose configuration is provided in:

```text
compose.prod.yaml
```

The production configuration includes:

- Internal MongoDB and Redis services
- Persistent MongoDB storage
- Container restart policies
- API health checks
- Service dependency conditions
- Separate API and worker services
- Nginx-based frontend serving

Validate the production Compose configuration with:

```bash
docker compose -f compose.prod.yaml config
```

---

# Docker Architecture

TaskFlow uses separate containers for its major components.

```text
+------------------------------------------------+
|                 Docker Compose                 |
|                                                |
|  +------------+                                |
|  |  Frontend  |                                |
|  |   Nginx    |                                |
|  +------+-----+                                |
|         |                                      |
|         v                                      |
|  +------------+       +---------------+        |
|  |    API     |------>|    Redis      |        |
|  |  Express   |       |    BullMQ     |        |
|  +------+-----+       +-------+-------+        |
|         |                     |                |
|         v                     v                |
|  +------------+       +---------------+        |
|  |  MongoDB   |<------|    Worker     |        |
|  +------------+       +---------------+        |
|                                                |
+------------------------------------------------+
```

The API and worker use separate processes and containers even though they share the same backend codebase.

---

# Why Redis and BullMQ?

The API should not perform potentially long-running work directly during an HTTP request.

Instead:

```text
HTTP Request
     |
     v
    API
     |
     v
 Create Job
     |
     v
Redis / BullMQ
     |
     v
  Worker
     |
     v
Process Job
```

This allows the API to remain responsive while workers process tasks asynchronously.

---

# Why a Separate Worker?

Separating the worker from the API provides:

- Independent job processing
- Better scalability
- Isolation of background workloads
- Ability to run multiple workers
- Reduced API blocking
- Better failure isolation

For example:

```text
API
 |
 +-- handles HTTP requests
 |
 +-- adds jobs to queue


Worker
 |
 +-- consumes jobs
 |
 +-- processes background tasks
```

---

# Docker Networking

Docker Compose provides an internal network where services can communicate using their service names.

For example:

```text
api       -> mongodb:27017
api       -> redis:6379
worker    -> mongodb:27017
worker    -> redis:6379
frontend  -> api:3000
```

This avoids relying on hardcoded container IP addresses.

---

# Frontend Reverse Proxy

Nginx serves the production React build and forwards backend traffic.

```text
Browser
   |
   v
 Nginx
   |
   +-- /              -> React application
   |
   +-- /api           -> Express API
   |
   +-- /socket.io     -> Express / Socket.IO
```

This allows the frontend to communicate with the backend without hardcoding a backend host into the production frontend.

---

# Frontend Development

To run the frontend separately during development:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server runs the React application and proxies API and Socket.IO requests to the backend.

---

# Backend Development

Install backend dependencies:

```bash
npm install
```

Start the backend development server:

```bash
npm run dev
```

Start the background worker separately:

```bash
npm run worker
```

---

# Testing

The backend uses Jest and Supertest for automated testing.

Run the test suite with:

```bash
npm test
```

---

# Learning Outcomes

This project was built to gain practical experience with backend and distributed-system concepts including:

- REST API design
- Authentication and authorization
- Database modeling
- Asynchronous processing
- Job queues
- Redis
- Background workers
- Retry mechanisms
- Scheduling
- Concurrency
- Real-time communication
- API security
- Docker
- Container networking
- Docker Compose
- Nginx
- Production-oriented container configuration

---

# Author

## Aaditya Kalra

B.E. Computer Science & Engineering

GitHub: [Aadityakalra07](https://github.com/Aadityakalra07)