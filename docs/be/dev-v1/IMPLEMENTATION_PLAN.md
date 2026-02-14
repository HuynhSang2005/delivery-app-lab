# Logship-MVP Backend Development Plan

**Version:** 1.0  
**Last Updated:** February 10, 2026  
**Status:** 🟡 In Progress  
**Target:** NestJS 11.1.13 + Prisma 7.4.0 + PostgreSQL + Redis  

---

## 📋 Quick Navigation

- [Overview](#1-overview)
- [Current State](#2-current-state)
- [Architecture](#3-architecture)
- [Implementation Phases](#4-implementation-phases)
- [Task Checklist](#5-task-checklist)
- [Commands Reference](#6-commands-reference)
- [Project Structure](#7-project-structure)
- [Code Standards](#8-code-standards)
- [Testing Strategy](#9-testing-strategy)
- [Success Criteria](#10-success-criteria)
- [Risks & Mitigations](#11-risks--mitigations)

---

## 1. Overview

### 1.1. Project Context

**Logship-MVP** is a General Delivery App backend that connects customers with drivers for transporting any type of package/item (not limited to food).

**Core Features:**
- Firebase Phone Authentication (OTP)
- Real-time driver matching with PostGIS
- Order management (package-based, not food)
- Real-time tracking via WebSocket
- In-app chat per order
- Push notifications via BullMQ
- Admin dashboard APIs

### 1.2. Complexity Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Overall** | 🔴 High | Multiple integrations, real-time features |
| **Database** | 🟡 Medium | PostGIS spatial queries, complex relationships |
| **Real-time** | 🔴 High | WebSocket + Redis adapter |
| **Queues** | 🟡 Medium | BullMQ for background jobs |
| **Auth** | 🟡 Medium | Firebase JWT verification |

### 1.3. Estimated Timeline

- **Total:** 4-5 weeks (solo developer)
- **Daily Capacity:** 4-6 hours
- **Buffer:** 20% for unexpected issues

---

## 2. Current State

### 2.1. Project Initialized ✅

```
apps/api/
├── src/
│   ├── main.ts              # Entry point (basic)
│   ├── app.module.ts        # Root module (empty)
│   ├── app.controller.ts    # Default controller
│   └── app.service.ts       # Default service
├── test/                    # E2E tests
├── package.json             # Dependencies (NestJS 11.x)
├── tsconfig.json            # TypeScript config
└── README.md                # Basic readme
```

### 2.2. Dependencies Installed

**Core:**
- ✅ @nestjs/common, core, platform-express (11.x)
- ✅ TypeScript 5.9.3
- ✅ Jest 30.x for testing
- ✅ ESLint + Prettier configured

**Missing (To Install):**
- ⬜ Prisma + @prisma/client
- ⬜ PostgreSQL connection
- ⬜ Redis (ioredis)
- ⬜ BullMQ + @nestjs/bullmq
- ⬜ Firebase Admin
- ⬜ JWT + Passport
- ⬜ WebSocket + Socket.io
- ⬜ Swagger/OpenAPI
- ⬜ Validation (zod, nestjs-zod)
- ⬜ Cloudinary

### 2.3. Environment Setup

**Required (.env):**
```env
# Database
DATABASE_URL="postgresql://..."
DATABASE_URL_DIRECT="postgresql://..."

# Redis
REDIS_URL="rediss://..."

# Firebase
FIREBASE_PROJECT_ID="..."
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL="..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Goong Maps
GOONG_API_KEY="..."

# App
PORT=3000
NODE_ENV=development
```

---

## 3. Architecture

### 3.1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NESTJS BACKEND                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   REST API   │  │  WebSocket   │  │   BullMQ     │          │
│  │  Controllers │  │   Gateway    │  │   Workers    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                 │
│  ┌──────┴──────────────────┴──────────────────┴───────┐         │
│  │                    SERVICES                         │         │
│  │  AuthService | UserService | DriverService         │         │
│  │  OrderService | ChatService | NotificationService  │         │
│  └──────┬─────────────────────────────────────────────┘         │
│         │                                                       │
│  ┌──────┴─────────────────────────────────────────────┐         │
│  │              REPOSITORY / PRISMA                    │         │
│  └──────┬─────────────────────────────────────────────┘         │
│         │                                                       │
└─────────┼───────────────────────────────────────────────────────┘
          │
    ┌─────┴─────┬─────────────┬─────────────┬─────────────┐
    ▼           ▼             ▼             ▼             ▼
┌────────┐ ┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Neon  │ │ Redis  │  │ Firebase │  │ Cloudinary│  │  Goong   │
│PostgreSQL│ │        │  │   Auth   │  │          │  │   Maps   │
│+PostGIS│ │        │  │          │  │          │  │          │
└────────┘ └────────┘  └──────────┘  └──────────┘  └──────────┘
```

### 3.2. Module Structure

```
src/
├── main.ts                          # Entry point
├── app.module.ts                    # Root module
│
├── config/                          # Configuration
│   ├── database.config.ts
│   ├── firebase.config.ts
│   ├── redis.config.ts
│   └── swagger.config.ts
│
├── common/                          # Shared code
│   ├── decorators/
│   ├── dto/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
│
├── database/                        # Database layer
│   ├── prisma.module.ts
│   ├── prisma.service.ts
│   └── geo.service.ts
│
├── modules/                         # Feature modules
│   ├── auth/                        # Authentication
│   ├── users/                       # User management
│   ├── drivers/                     # Driver management
│   ├── orders/                      # Order management
│   ├── chat/                        # Chat system
│   ├── notifications/               # Push notifications
│   └── admin/                       # Admin APIs
│
└── gateway/                         # WebSocket
    ├── gateway.module.ts
    └── events.gateway.ts
```

### 3.3. Database Schema

**See:** [02-Database-Design-Document.md](../../../02-Database-Design-Document.md)

**Key Tables:**
- `users` - Customers, drivers, admins
- `drivers` - Driver profiles, status, location
- `orders` - Delivery orders (package-based)
- `driver_locations` - GPS tracking history
- `messages` - In-app chat
- `notifications` - Push notifications

**PostGIS:**
- All locations use `GEOGRAPHY(POINT, 4326)`
- GiST indexes for spatial queries
- KNN operator for nearest driver search

---

## 4. Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Project setup, database, basic auth

### Phase 2: Core Features (Week 2-3)
**Goal:** Users, drivers, orders, matching

### Phase 3: Real-time & Communication (Week 3-4)
**Goal:** WebSocket, chat, notifications

### Phase 4: Polish & Testing (Week 4-5)
**Goal:** Testing, documentation, optimization

---

## 5. Task Checklist

### Phase 1: Foundation 🔨

#### 1.1. Environment Setup
- [ ] 1.1.1. Create `.env` file with all required variables
  - **Expected:** All env vars defined with placeholder values
  - **Verify:** `cat .env | grep -E "^(DATABASE|REDIS|FIREBASE)"`
  - **Time:** 30 min

- [ ] 1.1.2. Install additional dependencies
  - **Expected:** All packages installed successfully
  - **Packages:** prisma, @prisma/client, ioredis, bullmq, @nestjs/bullmq, firebase-admin, @nestjs/jwt, passport, passport-jwt, @nestjs/websockets, @nestjs/platform-socket.io, socket.io, @socket.io/redis-adapter, @nestjs/swagger, zod, nestjs-zod, cloudinary
  - **Command:** `bun add [packages]`
  - **Verify:** `bun.lock` updated, no errors
  - **Time:** 30 min

- [ ] 1.1.3. Set up environment configuration module
  - **Expected:** ConfigModule loads .env variables
  - **File:** `src/config/app.config.ts`
  - **Verify:** `console.log(process.env.DATABASE_URL)` works
  - **Time:** 1 hour

#### 1.2. Database Setup
- [ ] 1.2.1. Initialize Prisma
  - **Expected:** Prisma schema file created
  - **Command:** `bunx prisma init`
  - **Verify:** `prisma/schema.prisma` exists
  - **Time:** 15 min

- [ ] 1.2.2. Create database schema
  - **Expected:** Complete schema with all tables
  - **File:** `prisma/schema.prisma`
  - **Verify:** `bunx prisma validate` passes
  - **Reference:** [02-Database-Design-Document.md](../../../02-Database-Design-Document.md)
  - **Time:** 3 hours

- [ ] 1.2.3. Run initial migration
  - **Expected:** Database tables created in Neon
  - **Command:** `bunx prisma migrate dev --name init`
  - **Verify:** Tables visible in Prisma Studio
  - **Time:** 30 min

- [ ] 1.2.4. Create Prisma module and service
  - **Expected:** Injectable PrismaService
  - **Files:** `src/database/prisma.module.ts`, `prisma.service.ts`
  - **Verify:** Service can query database
  - **Time:** 1 hour

- [ ] 1.2.5. Create PostGIS geo service
  - **Expected:** Helper methods for spatial queries
  - **File:** `src/database/geo.service.ts`
  - **Methods:** `findNearestDrivers()`, `calculateDistance()`
  - **Verify:** Unit tests pass
  - **Time:** 2 hours

#### 1.3. Firebase Authentication Setup
- [ ] 1.3.1. Configure Firebase Admin SDK
  - **Expected:** Firebase app initialized
  - **File:** `src/config/firebase.config.ts`
  - **Verify:** Can verify test token
  - **Time:** 1 hour

- [ ] 1.3.2. Create Firebase auth strategy
  - **Expected:** Passport strategy for Firebase
  - **File:** `src/modules/auth/firebase.strategy.ts`
  - **Verify:** Can extract user from Firebase token
  - **Time:** 1.5 hours

- [ ] 1.3.3. Create JWT auth guard
  - **Expected:** Guard protects routes
  - **File:** `src/common/guards/jwt-auth.guard.ts`
  - **Verify:** Returns 401 for invalid tokens
  - **Time:** 1 hour

- [ ] 1.3.4. Create roles guard
  - **Expected:** RBAC enforcement
  - **File:** `src/common/guards/roles.guard.ts`
  - **Verify:** Returns 403 for unauthorized roles
  - **Time:** 1 hour

#### 1.4. Swagger/OpenAPI Setup
- [ ] 1.4.1. Configure Swagger documentation
  - **Expected:** Swagger UI accessible
  - **File:** `src/config/swagger.config.ts`
  - **URL:** `http://localhost:3000/api/docs`
  - **Verify:** Basic API docs visible
  - **Time:** 30 min

- [ ] 1.4.2. Add Bearer auth to Swagger
  - **Expected:** Auth button in Swagger UI
  - **Verify:** Can authenticate and test protected endpoints
  - **Time:** 30 min

**Phase 1 Completion Criteria:**
- [ ] All dependencies installed
- [ ] Database connected and migrated
- [ ] Firebase auth working
- [ ] Swagger docs accessible
- [ ] Health check endpoint returns 200

---

### Phase 2: Core Features 🚀

#### 2.1. Users Module
- [ ] 2.1.1. Create User entity and DTOs
  - **Expected:** Prisma model + validation DTOs
  - **Files:** DTOs in `src/modules/users/dto/`
  - **Verify:** DTO validation works
  - **Time:** 1 hour

- [ ] 2.1.2. Create UsersService
  - **Expected:** CRUD operations
  - **File:** `src/modules/users/users.service.ts`
  - **Methods:** create(), findById(), findByPhone(), update(), softDelete()
  - **Verify:** Unit tests pass
  - **Time:** 2 hours

- [ ] 2.1.3. Create UsersController
  - **Expected:** REST endpoints
  - **File:** `src/modules/users/users.controller.ts`
  - **Endpoints:** GET /users/me, PATCH /users/me, DELETE /users/me
  - **Verify:** Swagger shows endpoints
  - **Time:** 1.5 hours

- [ ] 2.1.4. Create user registration endpoint
  - **Expected:** POST /auth/register
  - **Logic:** Verify Firebase token, create user record
  - **Verify:** Can register new user
  - **Time:** 1 hour

#### 2.2. Drivers Module
- [ ] 2.2.1. Create Driver entity and DTOs
  - **Expected:** Driver model with vehicle info
  - **Verify:** DTO validation works
  - **Time:** 1 hour

- [ ] 2.2.2. Create DriversService
  - **Expected:** Driver management
  - **Methods:** register(), updateStatus(), updateLocation(), findNearby()
  - **Verify:** Unit tests pass
  - **Time:** 2 hours

- [ ] 2.2.3. Create DriversController
  - **Expected:** REST endpoints
  - **Endpoints:** POST /drivers/register, PATCH /drivers/status, PATCH /drivers/location
  - **Verify:** Swagger shows endpoints
  - **Time:** 1.5 hours

- [ ] 2.2.4. Implement driver approval workflow
  - **Expected:** Admin can approve drivers
  - **Endpoints:** PATCH /admin/drivers/:id/approve
  - **Verify:** Only approved drivers can accept orders
  - **Time:** 1 hour

#### 2.3. Orders Module
- [ ] 2.3.1. Create Order entity and DTOs
  - **Expected:** Order model with package details
  - **Fields:** pickup/dropoff locations, package info, pricing
  - **Verify:** DTO validation works
  - **Time:** 1.5 hours

- [ ] 2.3.2. Create OrdersService
  - **Expected:** Order management
  - **Methods:** create(), findById(), findByUser(), updateStatus(), cancel()
  - **Verify:** Unit tests pass
  - **Time:** 3 hours

- [ ] 2.3.3. Create OrdersController
  - **Expected:** REST endpoints
  - **Endpoints:** POST /orders, GET /orders, GET /orders/:id, PATCH /orders/:id/cancel
  - **Verify:** Swagger shows endpoints
  - **Time:** 2 hours

- [ ] 2.3.4. Implement pricing calculation
  - **Expected:** Fixed price per km (8.000 VND/km)
  - **Formula:** distance × 8.000đ
  - **Platform Fee:** 15%
  - **Driver Earnings:** 85%
  - **Max Distance:** 25km
  - **Verify:** Correct calculations
  - **Examples:**
    - 3km: 24.000đ (platform: 3.600đ, driver: 20.400đ)
    - 10km: 80.000đ (platform: 12.000đ, driver: 68.000đ)
    - 25km: 200.000đ (platform: 30.000đ, driver: 170.000đ)
  - **Time:** 1.5 hours

- [ ] 2.3.5. Implement cancellation logic
  - **Expected:** Cancellation policy enforcement
  - **Customer:** Free 5 phút, sau đó 10% phí
  - **Driver:** Max 3 lần/ngày, -10 rating/lần
  - **Verify:** Correct fee calculation and driver penalties
  - **Time:** 2 hours

#### 2.4. Driver Matching System
- [ ] 2.4.1. Set up BullMQ queues
  - **Expected:** Order matching queue configured
  - **File:** `src/modules/orders/order-matching.queue.ts`
  - **Verify:** Queue visible in Redis
  - **Time:** 1 hour

- [ ] 2.4.2. Create matching processor
  - **Expected:** Background job finds drivers
  - **File:** `src/modules/orders/order-matching.processor.ts`
  - **Logic:** Find nearest, send notifications, handle timeout
  - **Business Rules:**
    - Initial radius: 3km
    - Timeout: 5 phút
    - Expansion: 5km → 7km
    - Priority: Rating cao → Khoảng cách gần
    - Surge: +20% khi mở rộng bán kính
  - **Verify:** Processor runs on new order
  - **Time:** 3 hours

- [ ] 2.4.3. Implement driver offer endpoint
  - **Expected:** Drivers can accept orders
  - **Endpoint:** POST /orders/:id/accept
  - **Logic:** First accept wins, atomic operation
  - **Verify:** No race conditions
  - **Time:** 2 hours

- [ ] 2.4.4. Add retry logic
  - **Expected:** Expands radius if no acceptance
  - **Logic:** 
    - Retry 1: 3km radius, 5 phút timeout
    - Retry 2: 5km radius, +20% surge
    - Retry 3: 7km radius, +20% surge
  - **Verify:** Retries work correctly
  - **Time:** 1.5 hours

**Phase 2 Completion Criteria:**
- [ ] Users can register/login
- [ ] Drivers can register and go online
- [ ] Orders can be created
- [ ] Pricing calculated correctly (8.000đ/km, 15% platform fee)
- [ ] Driver matching works (3km → 5km → 7km, 5min timeout)
- [ ] Cancellation policy enforced (5min free, 10% after, driver limits)
- [ ] All endpoints documented in Swagger
- [ ] Pricing examples verified:
  - 3km: 24.000đ (platform: 3.600đ, driver: 20.400đ)
  - 10km: 80.000đ (platform: 12.000đ, driver: 68.000đ)
  - 25km: 200.000đ (platform: 30.000đ, driver: 170.000đ)

---

### Phase 3: Real-time & Communication 📡

#### 3.1. WebSocket Setup
- [ ] 3.1.1. Configure WebSocket gateway
  - **Expected:** Socket.io server running
  - **File:** `src/gateway/events.gateway.ts`
  - **Verify:** Can connect from client
  - **Time:** 1 hour

- [ ] 3.1.2. Set up Redis adapter
  - **Expected:** Multi-instance support
  - **Config:** Socket.io Redis adapter
  - **Verify:** Messages broadcast across instances
  - **Time:** 1 hour

- [ ] 3.1.3. Implement authentication for WebSocket
  - **Expected:** JWT validation on connection
  - **Verify:** Rejects invalid tokens
  - **Time:** 1 hour

#### 3.2. Location Tracking
- [ ] 3.2.1. Create location update endpoint
  - **Expected:** Drivers can send GPS updates
  - **Event:** `driver:location`
  - **Frequency:** 30 giây/lần (default), 10 giây/lần khi gần đích (<500m)
  - **Verify:** Updates stored in Redis + PostgreSQL
  - **Time:** 1.5 hours

- [ ] 3.2.2. Implement location broadcasting
  - **Expected:** Customers see driver moving
  - **Event:** `location:updated`
  - **Verify:** Real-time updates on map
  - **Time:** 1.5 hours

- [ ] 3.2.3. Set up location batch queue
  - **Expected:** Batch insert to PostgreSQL
  - **Queue:** location-batch
  - **Verify:** History persisted every 30s
  - **Time:** 1.5 hours

- [ ] 3.2.4. Implement adaptive tracking
  - **Expected:** Faster updates when near destination
  - **Logic:** 10s interval when <500m from destination
  - **Verify:** Adaptive logic works
  - **Time:** 1 hour

#### 3.3. Chat System
- [ ] 3.3.1. Create Message entity
  - **Expected:** Chat message model
  - **Fields:** orderId, senderId, content, type, isRead
  - **Time:** 30 min

- [ ] 3.3.2. Create ChatService
  - **Expected:** Send/receive messages
  - **Methods:** sendMessage(), getMessages(), markAsRead()
  - **Time:** 1.5 hours

- [ ] 3.3.3. Implement chat WebSocket events
  - **Expected:** Real-time messaging
  - **Events:** `chat:message`, `chat:typing`, `chat:read`
  - **Verify:** Messages delivered instantly
  - **Time:** 2 hours

- [ ] 3.3.4. Create chat REST endpoints
  - **Expected:** Get chat history
  - **Endpoints:** GET /orders/:id/messages
  - **Verify:** Pagination works
  - **Time:** 1 hour

#### 3.4. Notifications
- [ ] 3.4.1. Set up notification queue
  - **Expected:** BullMQ queue for notifications
  - **Queue:** notification
  - **Time:** 30 min

- [ ] 3.4.2. Create notification processor
  - **Expected:** Send push notifications
  - **Methods:** sendPush(), sendSMS()
  - **Integration:** Firebase Cloud Messaging
  - **Time:** 2 hours

- [ ] 3.4.3. Implement notification triggers
  - **Expected:** Notifications on events
  - **Events:** order created, driver assigned, delivered
  - **Verify:** Notifications sent
  - **Time:** 1.5 hours

**Phase 3 Completion Criteria:**
- [ ] WebSocket connections working
- [ ] Real-time location tracking (30s default, 10s adaptive)
- [ ] Chat system functional
- [ ] Push notifications working
- [ ] Location tracking adaptive logic working (<500m = 10s interval)

---

### Phase 4: Polish & Testing ✅

#### 4.1. Testing
- [ ] 4.1.1. Write unit tests for services
  - **Expected:** >80% coverage
  - **Files:** `*.spec.ts` for all services
  - **Verify:** `bun run test` passes
  - **Time:** 4 hours

- [ ] 4.1.2. Write E2E tests for controllers
  - **Expected:** All endpoints tested
  - **Files:** `test/*.e2e-spec.ts`
  - **Verify:** `bun run test:e2e` passes
  - **Time:** 4 hours

- [ ] 4.1.3. Add integration tests for WebSocket
  - **Expected:** Socket.io events tested
  - **Verify:** Real-time features work
  - **Time:** 2 hours

#### 4.2. Documentation
- [ ] 4.2.1. Complete Swagger annotations
  - **Expected:** All endpoints documented
  - **Verify:** Swagger UI shows all details
  - **Time:** 2 hours

- [ ] 4.2.2. Create API examples
  - **Expected:** Request/response examples
  - **Location:** Swagger docs
  - **Time:** 1 hour

- [ ] 4.2.3. Write README for API
  - **Expected:** Setup instructions
  - **File:** `apps/api/README.md`
  - **Time:** 1 hour

#### 4.3. Optimization
- [ ] 4.3.1. Add rate limiting
  - **Expected:** Throttling on all endpoints
  - **Config:** @nestjs/throttler
  - **Verify:** 429 returned when exceeded
  - **Time:** 1 hour

- [ ] 4.3.2. Add request logging
  - **Expected:** All requests logged
  - **Middleware:** LoggerMiddleware
  - **Time:** 30 min

- [ ] 4.3.3. Add error tracking
  - **Expected:** Errors logged with context
  - **Filter:** Global exception filter
  - **Time:** 1 hour

- [ ] 4.3.4. Performance optimization
  - **Expected:** Response time <200ms
  - **Areas:** Database queries, caching
  - **Verify:** Load testing
  - **Time:** 2 hours

#### 4.4. Deployment Prep
- [ ] 4.4.1. Create production build
  - **Expected:** Optimized build
  - **Command:** `bun run build`
  - **Verify:** No errors
  - **Time:** 30 min

- [ ] 4.4.2. Create Dockerfile
  - **Expected:** Container image builds
  - **File:** `Dockerfile`
  - **Verify:** `docker build` succeeds
  - **Time:** 1 hour

- [ ] 4.4.3. Set up health checks
  - **Expected:** /health endpoint
  - **Integration:** @nestjs/terminus
  - **Verify:** Returns DB, Redis status
  - **Time:** 1 hour

**Phase 4 Completion Criteria:**
- [ ] Test coverage >80%
- [ ] All endpoints documented
- [ ] Rate limiting active
- [ ] Production build successful
- [ ] Docker image builds

---

## 6. Commands Reference

### Development
```bash
# Start development server
bun run start:dev

# Build for production
bun run build

# Run tests
bun run test

# Run E2E tests
bun run test:e2e

# Lint code
bun run lint

# Format code
bun run format

# Type check
bun run typecheck
```

### Database
```bash
# Generate Prisma Client
bun run db:generate

# Run migrations
bun run db:migrate

# Open Prisma Studio
bun run db:studio

# Seed database
bun run db:seed
```

### API Generation
```bash
# Generate Hey-API client (from admin/mobile)
bun run generate:api
```

---

## 7. Project Structure

```
apps/api/
├── src/
│   ├── main.ts                          # Entry point
│   ├── app.module.ts                    # Root module
│   │
│   ├── config/                          # Configuration
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── firebase.config.ts
│   │   ├── redis.config.ts
│   │   └── swagger.config.ts
│   │
│   ├── common/                          # Shared code
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── dto/
│   │   │   └── pagination.dto.ts
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   │
│   ├── database/                        # Database layer
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   └── geo.service.ts
│   │
│   ├── modules/                         # Feature modules
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── firebase.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   ├── repositories/
│   │   │   │   ├── users.repository.interface.ts
│   │   │   │   └── users.repository.ts
│   │   │   └── interfaces/
│   │   │       └── user.interface.ts
│   │   │
│   │   ├── drivers/
│   │   │   ├── drivers.module.ts
│   │   │   ├── drivers.controller.ts
│   │   │   ├── drivers.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── register-driver.dto.ts
│   │   │   │   └── update-location.dto.ts
│   │   │   ├── repositories/
│   │   │   │   ├── drivers.repository.interface.ts
│   │   │   │   └── drivers.repository.ts
│   │   │   └── interfaces/
│   │   │       └── driver.interface.ts
│   │   │
│   │   ├── orders/
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── order-matching.processor.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-order.dto.ts
│   │   │   │   └── update-status.dto.ts
│   │   │   ├── repositories/
│   │   │   │   ├── orders.repository.interface.ts
│   │   │   │   └── orders.repository.ts
│   │   │   └── interfaces/
│   │   │       └── order.interface.ts
│   │   │
│   │   ├── chat/
│   │   │   ├── chat.module.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── send-message.dto.ts
│   │   │   │   └── message.dto.ts
│   │   │   ├── repositories/
│   │   │   │   ├── chat.repository.interface.ts
│   │   │   │   └── chat.repository.ts
│   │   │   └── interfaces/
│   │   │       └── chat.interface.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.service.ts
│   │   │   └── notification.processor.ts
│   │   │
│   │   └── admin/
│   │       ├── admin.module.ts
│   │       ├── admin.controller.ts
│   │       ├── admin.service.ts
│   │       └── repositories/
│   │           └── admin.repository.ts
│   │
│   └── gateway/                         # WebSocket
│       ├── gateway.module.ts
│       └── events.gateway.ts
│
├── prisma/
│   ├── schema.prisma                    # Database schema
│   └── migrations/                      # Database migrations
│
├── test/                                # E2E tests
│   ├── jest-e2e.json
│   └── app.e2e-spec.ts
│
├── .env                                 # Environment variables
├── .env.example                         # Example env file
├── package.json                         # Dependencies
├── tsconfig.json                        # TypeScript config
├── nest-cli.json                        # NestJS config
└── Dockerfile                           # Container config
```

---

## 8. Code Standards

### 8.1. Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `UsersService`, `CreateUserDto` |
| Files | kebab-case | `users.service.ts`, `create-user.dto.ts` |
| Methods | camelCase | `findById()`, `createUser()` |
| Variables | camelCase | `userId`, `isActive` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Enums | PascalCase + UPPER | `UserRole.ADMIN` |

### 8.2. File Structure Pattern (with Repository Pattern)

**Repository Interface:**
```typescript
// repositories/users.repository.interface.ts
export interface IUsersRepository {
  findById(id: string): Promise<User | null>;
  findAll(options: PaginationOptions): Promise<User[]>;
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');
```

**Repository Implementation:**
```typescript
// repositories/users.repository.ts
@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  // ... other methods
}
```

**Service:**
```typescript
// users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private usersRepository: IUsersRepository,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    return user;
  }
}
```

### 8.3. Error Handling Pattern

```typescript
// Custom errors
export class UserNotFoundError extends NotFoundException {
  constructor(userId: string) {
    super(`User with ID "${userId}" not found`);
  }
}

// Service usage (Repository Pattern)
async findById(id: string): Promise<User> {
  const user = await this.usersRepository.findById(id);
  if (!user) {
    throw new UserNotFoundError(id);
  }
  return user;
}
```

### 8.4. Response Format

```typescript
// Standard response wrapper
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-10T10:30:00Z"
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [...]
  },
  "meta": {
    "timestamp": "2026-02-10T10:30:00Z"
  }
}
```

---

## 9. Testing Strategy

### 9.1. AI-Agent Driven Testing Approach

This project uses **AI-Agent driven testing** where AI assistants generate, run, and maintain tests alongside feature development.

#### Testing Workflow for AI-Agent

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI-AGENT TESTING WORKFLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase 1: Explore        Phase 2: Generate     Phase 3: Run     │
│  ┌──────────────┐        ┌──────────────┐      ┌──────────────┐ │
│  │ Read code    │───────>│ Create tests │─────>│ Execute tests│ │
│  │ Understand   │        │ Mock deps    │      │ Check coverage│ │
│  │ dependencies │        │ Cover cases  │      │ Fix issues   │ │
│  └──────────────┘        └──────────────┘      └──────────────┘ │
│         │                       │                     │         │
│         └───────────────────────┴─────────────────────┘         │
│                              │                                   │
│                              ▼                                   │
│                    Phase 4: Iterate                             │
│                    ┌──────────────┐                             │
│                    │ Fix failures │                             │
│                    │ Add missing  │                             │
│                    │ Re-run tests │                             │
│                    └──────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2. Unit Tests

**Priority: HIGH** - Generate for every service

```typescript
// users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
      ],
    }).compile();

    service = module.get(UsersService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a new user', async () => {
      // Arrange
      const dto = { phone: '+84901234567', name: 'John' };
      const expected = { id: '1', ...dto, createdAt: new Date() };
      prisma.user.create.mockResolvedValue(expected);

      // Act
      const result = await service.create(dto);

      // Assert
      expect(result).toEqual(expected);
      expect(prisma.user.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should throw if phone already exists', async () => {
      // Arrange
      const dto = { phone: '+84901234567', name: 'John' };
      prisma.user.findUnique.mockResolvedValue({ id: '2', ...dto });

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });
});
```

**AI-Agent Commands:**
```bash
# Generate tests for specific module
"Generate unit tests for OrdersService"

# Run specific test file
bun run test -- orders.service.spec.ts

# Run with coverage
bun run test:cov -- --collectCoverageFrom="src/modules/orders/**/*.ts"
```

### 9.3. Controller Tests

**Priority: MEDIUM** - Test HTTP layer

```typescript
// users.controller.spec.ts
describe('UsersController', () => {
  let controller: UsersController;
  let service: DeepMockProxy<UsersService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockDeep<UsersService>() },
      ],
    }).compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  describe('GET /users/me', () => {
    it('should return current user', async () => {
      const user = { id: '1', phone: '+84901234567' };
      service.findById.mockResolvedValue(user);

      const result = await controller.getMe({ userId: '1' } as User);

      expect(result).toEqual(user);
    });
  });
});
```

### 9.4. E2E Tests

**Priority: MEDIUM** - Test critical flows after feature is stable

```typescript
// users.e2e-spec.ts
describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users/me (GET) - should return current user', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

### 9.5. AI-Agent Testing Commands

Use these commands when working with AI-Agent:

| Command | Purpose |
|---------|---------|
| `"Generate unit tests for [ServiceName]"` | Create comprehensive unit tests |
| `"Run tests for [module]"` | Execute specific module tests |
| `"Fix failing tests in [file]"` | Analyze and fix test failures |
| `"Check test coverage"` | Generate coverage report |
| `"Create E2E tests for [flow]"` | Generate end-to-end tests |

### 9.6. Test Coverage Requirements

| Category | Minimum Coverage | Priority |
|----------|------------------|----------|
| Services | 80% | HIGH |
| Controllers | 70% | MEDIUM |
| DTOs | 50% | LOW |
| Overall | 75% | HIGH |

### 9.7. Testing Checklist for AI-Agent

Before completing a feature, AI-Agent must:

- [ ] **Unit Tests**: All service methods have tests
- [ ] **Mocks**: Dependencies properly mocked with `mockDeep()`
- [ ] **Happy Path**: Normal operation tested
- [ ] **Error Cases**: Exceptions and errors tested
- [ ] **Edge Cases**: Boundary conditions covered
- [ ] **Type Safety**: No TypeScript errors in tests
- [ ] **Pass**: All tests pass with `bun run test`
- [ ] **Coverage**: Meet minimum coverage thresholds

---

## 10. Success Criteria

### 10.1. Functional Requirements

- [ ] User can register with phone OTP
- [ ] User can create delivery order
- [ ] Driver can register and go online
- [ ] System matches nearest driver
- [ ] Driver can accept order
- [ ] Real-time location tracking works
- [ ] In-app chat functional
- [ ] Push notifications delivered
- [ ] Admin can manage users/drivers

### 10.2. Technical Requirements

- [ ] All endpoints documented in Swagger
- [ ] Test coverage >75%
- [ ] No critical security vulnerabilities
- [ ] Response time <200ms (p95)
- [ ] Handles 50 concurrent users
- [ ] Database migrations work
- [ ] Docker image builds successfully

### 10.3. Code Quality

- [ ] ESLint passes with no errors
- [ ] Prettier formatting applied
- [ ] TypeScript strict mode enabled
- [ ] No `any` types (except necessary)
- [ ] All functions have return types
- [ ] Meaningful variable names

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Firebase Auth config issues** | Medium | High | Test with Firebase emulator first |
| **PostGIS query performance** | Medium | High | Add proper indexes, test with large dataset |
| **WebSocket scaling issues** | Low | High | Use Redis adapter from start |
| **Race condition in order matching** | Medium | High | Use database transactions |
| **BullMQ job failures** | Medium | Medium | Implement retry logic, monitoring |
| **Prisma migration conflicts** | Low | High | Use migrations in dev, direct in prod |
| **Memory leaks in long-running jobs** | Low | High | Monitor memory, restart workers periodically |

---

## 12. Resources & References

### Documentation
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

### Project Docs
- [00-Unified-Tech-Stack-Spec.md](../../../00-Unified-Tech-Stack-Spec.md)
- [02-Database-Design-Document.md](../../../02-Database-Design-Document.md)
- [03-API-Design-Document.md](../../../03-API-Design-Document.md)
- [07-Backend-Architecture.md](../../../07-Backend-Architecture.md)

### Tools
- **Prisma Studio:** `bun run db:studio`
- **Swagger UI:** `http://localhost:3000/api/docs`
- **Redis Commander:** (optional Redis GUI)

---

## 13. Progress Tracking

### Current Status
- **Phase:** 1 (Foundation)
- **Progress:** 0% (Project initialized)
- **Next Task:** 1.1.1. Create `.env` file

### Completion Log
<!-- Update this section as tasks are completed -->

#### Week 1
- [ ] Day 1-2: Environment setup, dependencies
- [ ] Day 3-4: Database setup, Prisma
- [ ] Day 5-7: Firebase auth, guards

#### Week 2
- [ ] Day 8-10: Users module
- [ ] Day 11-12: Drivers module
- [ ] Day 13-14: Orders module (basic)

#### Week 3
- [ ] Day 15-17: Orders module (matching)
- [ ] Day 18-19: WebSocket setup
- [ ] Day 20-21: Location tracking

#### Week 4
- [ ] Day 22-23: Chat system
- [ ] Day 24-25: Notifications
- [ ] Day 26-28: Testing, documentation

---

**Last Updated:** February 13, 2026  
**Next Review:** Weekly or when phase completes  
**Status:** 🟡 Ready to start Phase 1

---

## 14. Business Logic Summary

### Pricing Model
- **Giá cố định:** 8.000 VND/km
- **Platform Fee:** 15%
- **Driver Earnings:** 85%
- **Max Distance:** 25km

**Pricing Examples:**
```
3km:   24.000đ  (platform: 3.600đ,  driver: 20.400đ)
10km:  80.000đ  (platform: 12.000đ, driver: 68.000đ)
20km:  160.000đ (platform: 24.000đ, driver: 136.000đ)
25km:  200.000đ (platform: 30.000đ, driver: 170.000đ)
```

### Driver Matching
- **Initial Radius:** 3km
- **Timeout:** 5 phút
- **Expansion:** 3km → 5km → 7km
- **Priority:** Rating cao → Khoảng cách gần
- **Surge:** +20% khi mở rộng bán kính

### Location Tracking
- **Frequency:** 30 giây/lần (default)
- **Adaptive:** 10 giây/lần khi gần đích (<500m)
- **Background:** Enabled

### Cancellation Policy
**Customer:**
- Miễn phí trong 5 phút sau đặt hàng
- Sau 5 phút: 10% phí hủy (nếu tài xế đã nhận)

**Driver:**
- Tối đa 3 lần hủy/ngày
- Sau 3 lần: Khóa 24 giờ
- Penalty: -10 điểm rating mỗi lần hủy sau khi nhận

### Service Area
- **Thành phố:** Hồ Chí Minh
- **Max distance:** 25km
- **Payment:** COD only (online cho tương lai)
