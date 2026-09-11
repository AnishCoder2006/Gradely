![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6)

# 🎓 Student Record Management System

A full-stack, role-based academic platform for managing students, courses, grades, attendance, fees, and communication across three portals: **👑 Admin**, **📚 Teacher**, and **🎒 Student**.

Built to explore **production-grade patterns** — event-driven payment processing, idempotent consumers, distributed caching, and real-time communication — rather than just CRUD over a database.

> Replace `OWNER/REPO` above with your actual GitHub path once the badge is wired up.

---

## 📑 Table of Contents

- [🤔 Why this exists](#why-this-exists)
- [🏗️ Architecture](#architecture)
- [✨ Feature overview](#feature-overview)
- [🛠️ Tech stack](#tech-stack)
- [🚀 Getting started](#getting-started)
- [🔐 Environment variables](#environment-variables)
- [💓 API health](#api-health)
- [✅ Testing & CI](#testing--ci)
- [☁️ Deployment](#deployment)
- [📁 Project structure](#project-structure)
- [📌 Resume bullets](#resume-bullets)

---

## 🤔 Why this exists

Most student-management projects stop at authentication and a CRUD table. This one is built around a few **deliberate systems-design decisions** instead:

- ⚡ **Payments are event-driven, not synchronous.** A successful Razorpay payment publishes a `payment.completed` event to Kafka rather than generating a receipt inline — so receipt generation, audit logging, and real-time notification are decoupled from the payment request itself.
- 🔁 **Consumers are idempotent by design.** Kafka guarantees at-least-once delivery, not exactly-once — so every event is checked against a `ProcessedEvent` record before its side effects run, preventing duplicate receipts if a consumer rebalances or redelivers.
- 🛡️ **Infrastructure dependencies degrade gracefully instead of taking the app down.** Both Redis and Kafka can be disabled via environment flags (`REDIS_ENABLED`, `KAFKA_ENABLED`), with the application falling back to in-memory caching and synchronous payment processing respectively — so the app runs correctly **with or without** that infrastructure present.

That last point is also why this can be demoed and deployed **for free** — see [Kafka modes](#kafka-modes) below.


## 🏗️ Architecture

```text
                    React + Vite frontend
                            |
                    REST API + Socket.IO
                            |
                Express + TypeScript backend
                 /            |             \
            MongoDB         Redis          Kafka (optional)
                                              |
                                       payment.completed
                                              |
                              receipt + audit log + Socket.IO push
```

### ⚡ Kafka modes

Two modes, same idempotent processing logic underneath — only the trigger changes.

**🐳 Local / full demo — `docker compose up --build`**
Runs the complete stack including a **real Kafka broker**. `KAFKA_ENABLED=true`. A successful payment publishes `payment.completed`; the consumer performs idempotent receipt generation, audit logging, and a Socket.IO push to the paying student — the full event-driven pipeline, live.

**☁️ Production (no hosted broker required) — `KAFKA_ENABLED=false`**
The same idempotent side-effect function runs synchronously inside the payment verification request instead of via a consumer. **No behavior is lost** — receipts, audit logs, and notifications still happen — it's just triggered inline rather than asynchronously. `GET /api/health` reports Kafka as `"disabled"`, not `"down"`, since this is an intentional configuration rather than a failure.

This means the app is **fully deployable on free-tier hosting** without a paid Kafka broker, while the real event-driven pipeline remains fully functional and demoable locally via Docker Compose.

## ✨ Feature overview

### 👑 Admin portal
- Approve or reject student registrations
- Review and approve/reject teacher course proposals, with rejection reason
- Assign and unassign teachers to approved courses
- View all payment transactions, filter by status
- Audit log viewer
- Manage announcements, fees, courses, grades, and attendance

### 📚 Teacher portal
- View assigned courses and enrolled students
- Mark daily attendance per course
- Enter CIE / SEE exam grades with letter-grade mapping
- Propose new courses for admin approval
- Reply to student doubts in real time

### 🎒 Student portal
- **Dashboard:** live GPA, attendance rate, payment status, activity feed
- **Grades:** CIE/SEE breakdown with visual letter-grade cards
- **Attendance:** calendar heatmap and trend chart
- **GPA planner** with radar/bar visualizations
- Fee payment via Razorpay checkout
- Profile management
- Doubt forum with real-time threading, typing indicators, and presence

### 🔗 Cross-cutting
- 🔐 JWT authentication with TOTP-based MFA (QR-code enrollment) and bcrypt password hashing
- 🛡️ Three-tier RBAC (Admin / Teacher / Student) enforced at the middleware level
- ⚡ Redis TTL response caching with automatic invalidation on mutation, exposed via `X-Cache: HIT/MISS`
- 🚦 Redis-backed distributed rate limiting, consistent across horizontally scaled instances
- 📡 Socket.IO with a Redis pub/sub adapter for real-time events across multiple backend instances
- 📝 Structured logging via Pino, with sensitive fields redacted
- 📄 PDF report export (grades/attendance) via html2canvas + jsPDF

## 🛠️ Tech stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Redux Toolkit, RTK Query, React Router, Socket.IO Client, Recharts, Lucide React, Vite |
| **Backend** | Node.js, Express, TypeScript, MongoDB, Mongoose, Redis (ioredis), KafkaJS, Socket.IO, JWT, bcryptjs, otplib, qrcode, Razorpay, Pino |
| **Testing** | Vitest, Supertest, MongoDB Memory Server |
| **Quality** | ESLint, strict TypeScript, GitHub Actions CI |
| **Infrastructure** | Docker, Docker Compose, MongoDB, Redis, Kafka, ZooKeeper, Nginx |

## 🚀 Getting started

### Option 1 — full stack with Docker 🐳 (recommended, includes Kafka)

```bash
cp .env.example .env
# set at least JWT_SECRET in .env

docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5000 |
| Health check | http://localhost:5000/api/health |
| Kafka broker | localhost:9092 |
| MongoDB | localhost:27017 |
| Redis | localhost:6379 |

```bash
docker compose down          # stop services, keep data
docker compose down -v       # stop and wipe MongoDB/Redis volumes — only when you mean it
```

### Option 2 — frontend and backend separately (Kafka disabled by default)

**Backend** — `student-record-backend/.env`:

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

```bash
cd student-record-backend
npm ci
npm run dev
```

**Frontend** — in a second terminal:

```bash
cd student-record-management
npm ci
npm run dev
```

This profile runs the full app with Kafka disabled unless you point it at a running broker yourself. Use Docker Compose (Option 1) when you specifically want to demo the event-driven pipeline.

## 🔐 Environment variables

**Secrets are never committed** — `.env` is gitignored throughout.

**Backend**

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

**Frontend**

```text
VITE_API_URL
VITE_SOCKET_URL
```

## 💓 API health

`GET /api/health` reports live dependency status:

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

Returns `503` if an **enabled** dependency is unreachable. A deliberately disabled dependency (Redis or Kafka) never fails the check — that distinction is the whole point of the graceful-degradation design. ✅

## ✅ Testing & CI

```bash
# frontend
cd student-record-management
npm run type-check && npm run lint && npm run build

# backend
cd student-record-backend
npm run type-check && npm run lint && npm test && npm run build
```

Backend test coverage focuses on the parts of the system where correctness actually matters, not blanket line coverage:

- **Kafka consumer idempotency** — the same `payment.completed` event processed twice does not create duplicate receipts or audit entries
- **RBAC** — each of the three roles is correctly allowed/denied on representative protected routes
- **Razorpay signature verification** — valid and tampered signatures, SDK mocked
- **JWT + TOTP auth** — token issuance/expiry, valid/wrong/expired MFA codes, deterministic time source
- **Redis cache helpers** — hit/miss behavior and fallback when `REDIS_ENABLED=false`
- **`/api/health`** — correct status per dependency state

CI (GitHub Actions, `ci.yml`) runs on every push and PR to `main`: reproducible installs (`npm ci`), type-checking, linting, the full Vitest suite, and both frontend/backend builds — with `node_modules` and `mongodb-memory-server` binary caching to keep runs fast.

## ☁️ Deployment

Multi-stage Docker images 🐳: [`student-record-backend/Dockerfile`](student-record-backend/Dockerfile) (Node build → slim production runtime) and [`student-record-management/Dockerfile`](student-record-management/Dockerfile) (Vite build → Nginx).

**💸 Hobby-tier deployment (free), Kafka disabled:**

```env
NODE_ENV=production
KAFKA_ENABLED=false
REDIS_ENABLED=true
MONGO_URI=<managed MongoDB URL>
REDIS_URL=<managed Redis URL>
JWT_SECRET=<long random secret>
CLIENT_URL=<frontend URL>
```

- 🖥️ Backend → Railway or Render (Docker deploy, health check path `GET /api/health`)
- 🗄️ Database → MongoDB Atlas free tier
- ⚡ Cache → Railway/Render managed Redis free tier
- 🌐 Frontend → Vercel or Netlify, built with `VITE_API_URL` and `VITE_SOCKET_URL` pointed at the deployed backend

**If you want the live deployment to run the real Kafka pipeline** rather than the synchronous fallback, point `KAFKA_BROKERS` at a managed broker (e.g. Confluent Cloud) and set `KAFKA_ENABLED=true` — note this typically requires a paid or trial-credit plan, which is why it's off by default here.

## 📁 Project structure

```text
.
├── student-record-backend/       # Express + TypeScript API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/                # 11 Mongoose models
│   │   ├── middleware/            # auth, RBAC, rate limiting
│   │   ├── services/               # kafka, redis, cache helpers
│   │   └── tests/                  # Vitest suites
│   └── Dockerfile
├── student-record-management/    # React + TypeScript SPA
│   ├── src/
│   │   ├── features/                # Redux Toolkit slices + RTK Query APIs
│   │   ├── components/
│   │   └── pages/                   # Admin / Teacher / Student portals
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## 📌 Resume bullets

- 🚀 Designed an event-driven payment pipeline with **KafkaJS** and idempotent consumer processing for receipts, audit logs, and real-time notifications, with a synchronous fallback mode for deployments without a hosted broker.
- ⚡ Integrated **Redis** for TTL response caching, cache invalidation, distributed rate limiting, and Socket.IO horizontal-scaling support, with a full in-memory fallback when Redis is unavailable.
- 🔐 Built **TOTP-based MFA** with QR-code enrollment, JWT authentication, bcrypt password hashing, and three-tier RBAC enforced at the middleware level.
- 💬 Developed real-time announcements and a threaded doubt forum using authenticated **Socket.IO** connections, typing indicators, and presence tracking.
- 💳 Integrated **Razorpay** order creation and HMAC signature verification, with both synchronous and Kafka-backed payment-completion paths.
- 🎨 Built a responsive Admin/Teacher/Student multi-portal SPA in **React, Redux Toolkit, and RTK Query** with optimistic updates and tag-based cache invalidation.
- ✅ Added targeted **Vitest** integration coverage for Kafka idempotency, RBAC, payment verification, authentication, and Redis-backed workflows; wired into a **GitHub Actions** CI pipeline with type-checking, linting, and build verification on every PR.
