![CI](actions/workflows/ci.yml/badge.svg)

# Student Record Management System

A full-stack, role-based student portal built with React, TypeScript, Express, MongoDB, Redis, Kafka, and Socket.IO. The platform supports three portals: Admin, Teacher, and Student.

## Highlights

- Event-driven payment processing with KafkaJS and a `payment.completed` producer/consumer pipeline
- Idempotent payment side effects using the MongoDB `ProcessedEvent` model
- Redis TTL caching, cache invalidation, distributed rate limiting, and Socket.IO adapter support
- Graceful Redis fallback when `REDIS_ENABLED=false`
- Optional Kafka pipeline controlled by `KAFKA_ENABLED`
- JWT authentication with TOTP MFA, QR-code enrollment, bcrypt password hashing, and RBAC
- Razorpay order creation and HMAC signature verification
- Real-time announcements, doubt replies, typing indicators, presence, and payment notifications
- Audit logging for important domain actions
- Responsive React SPA with Redux Toolkit, RTK Query, Recharts, Lucide icons, theme tokens, toasts, tables, and PDF exports

## Architecture

```text
React + Vite frontend
        |
        | REST API + Socket.IO
        v
Express + TypeScript backend
   |          |          |
MongoDB    Redis      Kafka
                       |
                 payment.completed
                       |
                 receipt + audit + notification
```

### Kafka modes

The local Docker stack runs the complete event-driven pipeline:

```bash
docker compose up --build
```

It sets `KAFKA_ENABLED=true`. Payment verification publishes `payment.completed`, and the Kafka consumer performs idempotent receipt generation, audit logging, and Socket.IO notification.

Production can run without a hosted Kafka broker by setting:

```env
KAFKA_ENABLED=false
```

In that mode, the same idempotent processing function runs synchronously inside the payment verification flow. `/api/health` reports Kafka as `disabled`, not `down`.

## Domain Features

### Admin portal

- Approve or reject student registrations
- Review and approve teacher course requests
- Assign and unassign teachers to courses
- View payment records and audit logs
- Manage announcements, fees, courses, grades, and attendance

### Teacher portal

- View assigned courses and students
- Mark daily attendance
- Enter CIE and SEE grades
- Request new courses
- Reply to student doubts

### Student portal

- Dashboard with GPA, attendance, payments, and activity
- CIE/SEE grade breakdown and letter grades
- Attendance history and trend visualizations
- Progress and GPA planning tools
- Razorpay fee payments
- Profile management
- Doubt forum and real-time announcements

## Technology

**Frontend:** React 18, TypeScript, Redux Toolkit, RTK Query, React Router, Socket.IO Client, Recharts, Lucide React, Vite

**Backend:** Node.js, Express, TypeScript, MongoDB, Mongoose, Redis, KafkaJS, Socket.IO, JWT, bcryptjs, otplib, QRCode, Razorpay, Pino

**Testing and quality:** Vitest, Supertest, MongoDB Memory Server, ESLint, TypeScript checks, GitHub Actions CI

**Infrastructure:** Docker, Docker Compose, MongoDB, Redis, Kafka, ZooKeeper, Nginx

## Local Setup

### Option 1: Full stack with Docker

Copy the example environment file at the repository root:

```bash
cp .env.example .env
```

Set at least `JWT_SECRET`, then start the complete stack:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health: `http://localhost:5000/api/health`
- Kafka: `localhost:9092`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`

Stop services:

```bash
docker compose down
```

Use `docker compose down -v` only when you intentionally want to delete the MongoDB and Redis volumes.

### Option 2: Run frontend and backend separately

Start MongoDB locally and optionally Redis. In `student-record-backend/.env`, configure:

```env
MONGO_URI=mongodb://localhost:27017/student-record-management
PORT=5000
NODE_ENV=development
JWT_SECRET=replace-with-a-long-local-secret
JWT_EXPIRES_IN=7d
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
KAFKA_ENABLED=false
CLIENT_URL=http://localhost:5173
```

Install and run the backend:

```bash
cd student-record-backend
npm ci
npm run dev
```

Install and run the frontend in another terminal:

```bash
cd student-record-management
npm ci
npm run dev
```

The plain development profile keeps Kafka disabled unless a broker is running. Use Docker Compose when you want to demo Kafka locally.

## Environment Variables

Never commit secrets. The repository ignores `.env` files.

### Backend

```text
MONGO_URI
REDIS_URL
REDIS_ENABLED
KAFKA_ENABLED
KAFKA_BROKERS
JWT_SECRET
JWT_EXPIRES_IN
CLIENT_URL
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
LOG_LEVEL
```

### Frontend

```text
VITE_API_URL
VITE_SOCKET_URL
```

## API Health

`GET /api/health` reports the application and dependency state:

```json
{
  "success": true,
  "message": "API running",
  "dependencies": {
    "mongo": "up",
    "redis": "up",
    "kafka": "disabled"
  }
}
```

The endpoint returns HTTP `503` when an enabled dependency is unavailable. Disabled Redis or Kafka does not fail the health check.

## Quality Checks

Frontend:

```bash
cd student-record-management
npm run type-check
npm run lint
npm run build
```

Backend:

```bash
cd student-record-backend
npm run type-check
npm run lint
npm test
npm run build
```

The backend test suite covers Kafka consumer idempotency, RBAC, Razorpay signature verification, JWT and TOTP authentication, Redis cache helpers, and API health behavior.

## Deployment

The backend uses a multi-stage Docker image at [student-record-backend/Dockerfile](student-record-backend/Dockerfile). The frontend has a Vite-to-Nginx image at [student-record-management/Dockerfile](student-record-management/Dockerfile).

For a hobby production deployment, host the backend on Railway or Render, use managed MongoDB and Redis, and set:

```env
NODE_ENV=production
KAFKA_ENABLED=false
REDIS_ENABLED=true
MONGO_URI=<managed MongoDB URL>
REDIS_URL=<managed Redis URL>
JWT_SECRET=<long random secret>
CLIENT_URL=<frontend URL>
```

Build the frontend with `VITE_API_URL` pointing to the deployed backend API and `VITE_SOCKET_URL` pointing to the backend origin. Configure the hosting health check as `GET /api/health`.

To use Kafka in production, provide a managed broker such as Upstash Kafka or Confluent Cloud and set `KAFKA_ENABLED=true` and `KAFKA_BROKERS` accordingly.

## Resume Bullets

- Designed an event-driven payment pipeline with KafkaJS and idempotent consumer processing for receipts, audit logs, and real-time notifications.
- Integrated Redis for TTL caching, cache invalidation, distributed rate limiting, and Socket.IO horizontal-scaling support.
- Built TOTP MFA with QR enrollment, JWT authentication, bcrypt password hashing, and three-tier RBAC.
- Developed real-time announcements and a threaded doubt forum with authenticated Socket.IO connections, typing indicators, and presence tracking.
- Integrated Razorpay order creation and HMAC signature verification with synchronous and Kafka-backed payment completion modes.
- Built a responsive Admin, Teacher, and Student multi-portal SPA using React, Redux Toolkit, RTK Query, Recharts, and TypeScript.
- Added targeted Vitest integration coverage for Kafka idempotency, RBAC, payments, authentication, Redis, and MongoDB-backed workflows.
