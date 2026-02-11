# Logship-MVP: System Design Document (SDD)

**Version:** 3.0  
**Last Updated:** February 2025  
**Author:** Solo Developer  
**Project:** Logistics Delivery App - Mobile-first React Native, Web Admin Dashboard, NestJS Backend  
**Purpose:** Learning project for CV/Portfolio demonstration  

---

## 1. Introduction

### 1.1. Project Description

Logship-MVP is a logistics delivery application connecting **Users** (customers) with **Drivers** for real-time package delivery. The system focuses on:

- Real-time GPS tracking
- Nearest driver matching using PostGIS
- In-app chat per order
- Mobile-first experience with React Native + Expo

### 1.2. MVP Goals

- **Core Flow:** Create order → Match driver → Track delivery → Complete
- **Learning Focus:** Demonstrate full-stack skills with modern tech stack
- **Scale:** Maximum 50 concurrent users (fits Neon free tier)
- **Deployment:** Neon (managed Postgres), Railway/Render (backend), Expo EAS (mobile)

### 1.3. Non-Goals (Out of Scope)

| Feature | Reason |
|---------|--------|
| Payment gateway | Complexity; use COD/bank transfer |
| Route optimization (AI/ML) | Requires dedicated infrastructure |
| Multi-city/warehouse | Single city MVP |
| VoIP calls | Use `tel:` deeplink instead |
| Complex pricing algorithms | Fixed price per km |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │   Mobile App     │    │   Mobile App     │    │   Admin Web      │  │
│  │   (User)         │    │   (Driver)       │    │   Dashboard      │  │
│  │                  │    │                  │    │                  │  │
│  │  React Native    │    │  React Native    │    │  React/Next.js   │  │
│  │  + Expo SDK 54   │    │  + Expo SDK 54   │    │  + TanStack      │  │
│  │  + Zustand       │    │  + Zustand       │    │  Query           │  │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘  │
│           │                       │                       │             │
└───────────┼───────────────────────┼───────────────────────┼─────────────┘
            │                       │                       │
            └───────────────────────┼───────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │         BACKEND               │
                    │         NestJS                │
                    │                               │
                    │  ┌─────────────────────────┐  │
                    │  │     REST API            │  │
                    │  │     /api/v1/*           │  │
                    │  └─────────────────────────┘  │
                    │                               │
                    │  ┌─────────────────────────┐  │
                    │  │   WebSocket Gateway     │  │
                    │  │   Socket.io             │  │
                    │  └─────────────────────────┘  │
                    │                               │
                    └───────────────┬───────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
    ┌───────┴───────┐      ┌───────┴───────┐      ┌───────┴───────┐
    │    Neon       │      │    Redis      │      │  Cloudinary   │
    │   Postgres    │      │   (Upstash)   │      │   (Images)    │
    │  + PostGIS    │      │               │      │               │
    │               │      │  - Sessions   │      │  - Avatars    │
    │  - Users      │      │  - Pub/Sub    │      │  - Proofs     │
    │  - Orders     │      │  - Driver Geo │      │  - Documents  │
    │  - Messages   │      │               │      │               │
    └───────────────┘      └───────────────┘      └───────────────┘
```

### 2.1. Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend Architecture | Monolith | Solo dev, simpler deployment |
| Database | Neon (Serverless Postgres) | Free tier, PostGIS support, scale-to-zero |
| Real-time | Socket.io + Redis Adapter | Room-based broadcasting, scalable |
| Mobile Framework |  React Native + Expo SDK 54   | Cross-platform, OTA updates |
| Mobile Framework |  React Native 0.81.0   | Latest stable |
| Mobile Framework |  React 19.1.0   | Latest React |
| State Management | Zustand + TanStack Query | Simple local state + powerful server state |
| Authentication | Firebase Auth (OTP + Email) | Free tier, phone auth built-in |
| Maps (Vietnam) | Goong Maps | Vietnam-optimized, competitive pricing |
| Message Queue | BullMQ | Async jobs (notifications, matching) |
| API Client Gen | Hey-API | Type-safe client from OpenAPI spec |

---

## 3. User Roles & Permissions

### 3.1. Role Definitions

| Role | Description | Platform |
|------|-------------|----------|
| **USER** | Customer who creates delivery orders | Mobile App |
| **DRIVER** | Delivery personnel who fulfills orders | Mobile App |
| **ADMIN** | System administrator | Web Dashboard |

### 3.2. Role-Based Access Control (RBAC)

```typescript
// NestJS Guard example
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

### 3.3. Feature Access Matrix

| Feature | USER | DRIVER | ADMIN |
|---------|:----:|:------:|:-----:|
| Create Order | ✅ | ❌ | ✅ |
| Accept Order | ❌ | ✅ | ❌ |
| Track Order | ✅ | ✅ | ✅ |
| Update Location | ❌ | ✅ | ❌ |
| Chat (per order) | ✅ | ✅ | 👁️ |
| View All Orders | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Approve Drivers | ❌ | ❌ | ✅ |

---

## 4. Core Features

### 4.1. Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────────┐     ┌─────────┐
│  User   │────>│  App    │────>│  Firebase   │────>│ Backend │
│         │     │         │     │  Auth       │     │         │
└─────────┘     └─────────┘     └─────────────┘     └─────────┘
     │               │                 │                  │
     │  Enter Phone  │                 │                  │
     │──────────────>│                 │                  │
     │               │  Send OTP       │                  │
     │               │────────────────>│                  │
     │               │                 │  SMS to Phone    │
     │               │                 │─────────────────>│
     │  Enter OTP    │                 │                  │
     │──────────────>│                 │                  │
     │               │  Verify OTP     │                  │
     │               │────────────────>│                  │
     │               │                 │  Firebase Token  │
     │               │<────────────────│                  │
     │               │                 │                  │
     │               │  Exchange Token (Firebase → JWT)   │
     │               │───────────────────────────────────>│
     │               │                 │     Access Token │
     │               │<───────────────────────────────────│
     │   Logged In   │                 │                  │
     │<──────────────│                 │                  │
```

### 4.2. Order Lifecycle

```
┌─────────┐     ┌──────────┐     ┌────────────┐     ┌───────────┐     ┌───────────┐
│ PENDING │────>│ ASSIGNED │────>│ PICKING_UP │────>│DELIVERING │────>│ COMPLETED │
└─────────┘     └──────────┘     └────────────┘     └───────────┘     └───────────┘
     │                                                                       │
     │                         ┌───────────┐                                 │
     └────────────────────────>│ CANCELLED │<────────────────────────────────┘
                               └───────────┘
```

| Status | Description | Who Can Trigger |
|--------|-------------|-----------------|
| PENDING | Order created, waiting for driver | Auto (on create) |
| ASSIGNED | Driver accepted order | Driver |
| PICKING_UP | Driver heading to pickup | Driver |
| DELIVERING | Driver picked up, heading to dropoff | Driver |
| COMPLETED | Delivery successful | Driver |
| CANCELLED | Order cancelled | User (before ASSIGNED) or Admin |

### 4.3. Driver Matching Algorithm

```sql
-- Find nearest active drivers using PostGIS KNN operator
SELECT 
  d.user_id,
  u.name,
  ST_Distance(d.last_location, pickup_point) as distance_meters
FROM drivers d
JOIN users u ON d.user_id = u.id
WHERE d.status = 'ACTIVE'
  AND d.is_approved = true
  AND ST_DWithin(
    d.last_location, 
    ST_MakePoint(:lng, :lat)::geography,
    5000  -- 5km radius
  )
ORDER BY d.last_location <-> ST_MakePoint(:lng, :lat)::geography
LIMIT 5;
```

### 4.4. Real-time Tracking

```
Driver App                    Backend                      User App
    │                            │                            │
    │  GPS Update (5s interval)  │                            │
    │  emit('driver:location')   │                            │
    │───────────────────────────>│                            │
    │                            │  Update Redis GEOADD       │
    │                            │  Broadcast to room         │
    │                            │  emit('location:updated')  │
    │                            │───────────────────────────>│
    │                            │                            │  Update map marker
    │                            │                            │  (AnimatedRegion)
```

### 4.5. Chat System

- **Room-based:** Each order has a chat room (`order:{orderId}`)
- **Participants:** User + Driver (Admin can view)
- **Message Types:** Text, Image (Cloudinary URL)
- **Persistence:** Messages stored in PostgreSQL
- **Delivery Status:** sent → delivered → read

### 4.6. Complete Order Flow Sequence

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│   User   │   │   App    │   │  Backend │   │  BullMQ  │   │  Driver  │   │  Redis   │
│          │   │ (Mobile) │   │ (NestJS) │   │ (Queue)  │   │   App    │   │ (Cache)  │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │              │              │              │
     │ 1. Create    │              │              │              │              │
     │    Order     │              │              │              │              │
     │─────────────>│              │              │              │              │
     │              │ POST /orders │              │              │              │
     │              │─────────────>│              │              │              │
     │              │              │              │              │              │
     │              │              │ 2. Save order│              │              │
     │              │              │    (PENDING) │              │              │
     │              │              │──────────────────────────────────────────>│
     │              │              │              │              │              │
     │              │              │ 3. Queue     │              │              │
     │              │              │    matching  │              │              │
     │              │              │─────────────>│              │              │
     │              │              │              │              │              │
     │              │ Order created│              │              │              │
     │              │<─────────────│              │              │              │
     │ Show pending │              │              │              │              │
     │<─────────────│              │              │              │              │
     │              │              │              │              │              │
     │              │              │              │ 4. Find      │              │
     │              │              │              │    nearby    │              │
     │              │              │              │    drivers   │              │
     │              │              │              │─────────────────────────────>│
     │              │              │              │              │  GEORADIUS   │
     │              │              │              │<─────────────────────────────│
     │              │              │              │              │              │
     │              │              │              │ 5. Notify    │              │
     │              │              │              │    drivers   │              │
     │              │              │              │─────────────>│              │
     │              │              │              │   (Socket)   │ New order!   │
     │              │              │              │              │              │
     │              │              │              │              │ 6. Accept    │
     │              │              │              │              │    order     │
     │              │              │              │              │─────────────>│
     │              │              │ PATCH /orders│              │              │
     │              │              │<─────────────┼──────────────│              │
     │              │              │              │              │              │
     │              │              │ 7. Update    │              │              │
     │              │              │    ASSIGNED  │              │              │
     │              │              │──────────────────────────────────────────>│
     │              │              │              │              │              │
     │              │ Socket:      │              │              │              │
     │              │ order:updated│              │              │              │
     │              │<─────────────│              │              │              │
     │ Driver       │              │              │              │              │
     │ assigned!    │              │              │              │              │
     │<─────────────│              │              │              │              │
     │              │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼              ▼
   [Continue with PICKING_UP → DELIVERING → COMPLETED flow...]
```

### 4.7. Driver Matching Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DRIVER MATCHING WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │  Order Created  │
                              │  (PENDING)      │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Add to BullMQ   │
                              │ Matching Queue  │
                              └────────┬────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │     Matching Processor (Worker)       │
                    └──────────────────┬───────────────────┘
                                       │
                          ┌────────────┴────────────┐
                          ▼                         ▼
               ┌───────────────────┐     ┌───────────────────┐
               │  Search Radius:   │     │  Query Redis GEO  │
               │  Start at 1km     │     │  for active       │
               │                   │     │  drivers          │
               └─────────┬─────────┘     └─────────┬─────────┘
                         │                         │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │  Drivers found within   │───NO───┐
                         │  current radius?        │        │
                         └────────────┬────────────┘        │
                                      │ YES                 │
                                      ▼                     ▼
                         ┌─────────────────────────┐  ┌─────────────────┐
                         │  Sort by:               │  │ Expand radius   │
                         │  1. Distance (nearest)  │  │ by 1km          │
                         │  2. Rating (future)     │  │ (max 10km)      │
                         │  3. Completion rate     │  └────────┬────────┘
                         └────────────┬────────────┘           │
                                      │                        │
                                      │           ┌────────────┘
                                      │           │
                                      ▼           ▼
                         ┌─────────────────────────┐
                         │  Send push notification │
                         │  to top 5 drivers       │
                         │  (via Socket.io)        │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │  Wait for acceptance    │
                         │  (30 second timeout)    │
                         └────────────┬────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
         ┌─────────────────┐               ┌─────────────────┐
         │ Driver accepts  │               │ Timeout/Reject  │
         │ first           │               │ all             │
         └────────┬────────┘               └────────┬────────┘
                  │                                 │
                  ▼                                 ▼
         ┌─────────────────┐               ┌─────────────────┐
         │ Assign driver   │               │ Retry with      │
         │ Update: ASSIGNED│               │ expanded radius │
         │ Notify user     │               │ (max 3 retries) │
         └─────────────────┘               └─────────────────┘
```

### 4.8. Real-time Location Tracking Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     REAL-TIME LOCATION TRACKING                              │
└─────────────────────────────────────────────────────────────────────────────┘

Driver App                          Backend                              User App
    │                                  │                                    │
    │    ┌─────────────────────────────┴─────────────────────────────┐     │
    │    │  BACKGROUND LOCATION TASK (expo-task-manager)              │     │
    │    │  - Runs every 5 seconds when driver is ON_TRIP             │     │
    │    │  - Uses significant location changes when in background    │     │
    │    └─────────────────────────────┬─────────────────────────────┘     │
    │                                  │                                    │
    │ 1. GPS coordinates               │                                    │
    │    captured                      │                                    │
    │─────────────────────────────────>│                                    │
    │    Socket: driver:location       │                                    │
    │    { orderId, lat, lng,          │                                    │
    │      timestamp, speed }          │                                    │
    │                                  │                                    │
    │                                  │ 2. Update Redis GEO              │
    │                                  │    GEOADD driver:locations        │
    │                                  │    <lng> <lat> <driver_id>        │
    │                                  │                                    │
    │                                  │ 3. Batch insert to PostgreSQL     │
    │                                  │    (via BullMQ - every 30s)       │
    │                                  │    → order_tracking table         │
    │                                  │                                    │
    │                                  │ 4. Broadcast to order room        │
    │                                  │────────────────────────────────────>│
    │                                  │    Socket: location:updated       │
    │                                  │    { orderId, lat, lng,           │
    │                                  │      heading, eta }               │
    │                                  │                                    │
    │                                  │                    ┌───────────────┤
    │                                  │                    │ 5. Update map │
    │                                  │                    │    marker     │
    │                                  │                    │    Animate    │
    │                                  │                    │    polyline   │
    │                                  │                    └───────────────┤
    │                                  │                                    │
    ▼                                  ▼                                    ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│  REDIS GEO STRUCTURE                                                         │
│  ─────────────────────                                                       │
│  Key: driver:locations                                                       │
│  Type: GEOSPATIAL                                                           │
│  TTL: 5 minutes (auto-expire inactive)                                      │
│                                                                              │
│  Commands:                                                                   │
│  - GEOADD driver:locations <lng> <lat> <driver_id>                          │
│  - GEORADIUS driver:locations <lng> <lat> 5 km WITHDIST ASC COUNT 10        │
│  - GEOPOS driver:locations <driver_id>                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.8.1. WebSocket Events Reference

The following Socket.io events are used for real-time communication:

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `order:join` | Client → Server | `{ orderId: string }` | Join order room for tracking |
| `order:leave` | Client → Server | `{ orderId: string }` | Leave order room |
| `driver:location` | Client → Server | `{ orderId?, lat, lng, heading?, speed? }` | Driver location update (every 5s) |
| `location:updated` | Server → Client | `{ orderId, driverId, lat, lng, heading?, eta? }` | Location broadcast to order room |
| `order:new` | Server → Client | Order object | New order available for drivers |
| `order:status` | Server → Client | `{ orderId, status, updatedAt, driverLocation? }` | Order status changed |
| `order:assigned` | Server → Client | `{ orderId, driver: {...} }` | Driver assigned to order |
| `chat:message` | Bidirectional | `{ orderId, content, type? }` | Chat message |
| `chat:typing` | Bidirectional | `{ orderId }` | Typing indicator |
| `chat:read` | Server → Client | `{ orderId, readBy, readAt }` | Messages read receipt |
| `notification` | Server → Client | `{ id, title, body, data?, createdAt }` | Push notification via WebSocket |

### 4.9. Notification Flow

```
Order Event                    BullMQ                         External Services
    │                            │                                    │
    │  Order Created/Updated     │                                    │
    │───────────────────────────>│                                    │
    │                            │                                    │
    │                     ┌──────┴──────┐                             │
    │                     │ Notification │                             │
    │                     │ Queue        │                             │
    │                     └──────┬──────┘                             │
    │                            │                                    │
    │                     ┌──────┴──────┐                             │
    │                     │  Processor  │                             │
    │                     └──────┬──────┘                             │
    │                            │                                    │
    │              ┌─────────────┼─────────────┐                      │
    │              ▼             ▼             ▼                      │
    │       ┌───────────┐ ┌───────────┐ ┌───────────┐                │
    │       │   Push    │ │   SMS     │ │   Email   │                │
    │       │ (Firebase │ │ (Twilio/  │ │ (Resend)  │                │
    │       │  FCM)     │ │  Vonage)  │ │           │                │
    │       └─────┬─────┘ └─────┬─────┘ └─────┬─────┘                │
    │             │             │             │                      │
    │             └─────────────┴─────────────┘                      │
    │                           │                                    │
    │                           └───────────────────────────────────>│
    │                                   Deliver notification          │
    ▼                                                                ▼
```

---

## 5. Technology Stack

### 5.1. Frontend (Mobile)

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React Native | 0.81.0 |
| Platform | Expo SDK | 54 |
| Navigation | Expo Router | 5.x |
| State (Local) | Zustand | 5.x |
| State (Server) | TanStack Query | 5.x |
| Maps | react-native-maps + **Goong Maps** | 1.x |
| Location | expo-location + expo-task-manager | SDK 52 |
| WebSocket | socket.io-client | 4.x |
| Forms | React Hook Form + Zod | ^7.54.2 / ^4.3.6 |

### 5.2. Frontend (Web Admin)

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| State | TanStack Query v5 |
| UI Components | Tailwind CSS v4 + Shadcn/ui |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| Maps | **Goong JS** (Mapbox GL compatible) |
| API Client | **Hey-API** (auto-generated from OpenAPI) |
| Forms | React Hook Form + Zod |

### 5.3. Backend

| Category | Technology | Version |
|----------|------------|---------|
| Framework | NestJS | 11.1.6 |
| ORM | Prisma | 7.3.0 |
| **Data Access** | **Repository Pattern** | Interface-based |
| WebSocket | @nestjs/websockets + Socket.io | 4.x |
| Validation | Zod v4 + nestjs-zod | ^4.3.6 / ^4.0.0 |
| Auth | Passport + JWT + Firebase Admin | Latest |
| API Docs | Swagger/OpenAPI | Latest |
| **Message Queue** | **@nestjs/bullmq** | 11.1.x |
| API Client Gen | **Hey-API** | Latest |

### 5.4. Database & Infrastructure

| Category | Technology | Details |
|----------|------------|---------|
| Database | Neon | Serverless Postgres 17, PostGIS enabled |
| Cache/Pub-Sub | Upstash Redis | Serverless Redis, BullMQ backing |
| File Storage | Cloudinary | Image optimization, transformations |
| Auth Provider | Firebase Auth | Phone OTP + Email link authentication |
| Hosting (Backend) | Railway or Render | Docker container hosting |
| Hosting (Mobile) | Expo EAS | Build & OTA updates |
| Hosting (Admin) | Vercel | Edge-optimized Next.js hosting |
| Maps Service | **Goong Maps** | Vietnam-optimized geocoding & routing |

---

## 6. Security Considerations

### 6.1. Authentication & Authorization

- Firebase Auth tokens verified server-side
- JWT tokens for API authentication (short-lived: 15min)
- Refresh tokens stored securely (HTTP-only cookies for web, SecureStore for mobile)
- RBAC guards on all protected endpoints

### 6.2. Data Protection

- HTTPS everywhere (TLS 1.3)
- Database connections via SSL
- Sensitive data encrypted at rest (Neon default)
- No PII in logs

### 6.3. API Security

- Rate limiting (100 req/min per user)
- Input validation with Zod v4 + nestjs-zod
- SQL injection prevention (Prisma parameterized queries)
- CORS configured for known origins

---

## 7. Scalability Notes

This MVP is designed for **50 concurrent users**. For scaling beyond:

| Concern | Current Approach | Future Scale |
|---------|------------------|--------------|
| Database | Neon free tier (0.5 GB) | Neon Pro with autoscaling |
| Real-time | Single Redis instance | Redis Cluster |
| Backend | Single instance | Horizontal scaling with load balancer |
| Location Updates | 5s interval | Adaptive intervals based on speed |

---

## 8. Related Documents

| Document | Description |
|----------|-------------|
| [02-Database-Design-Document.md](./02-Database-Design-Document.md) | Schema, PostGIS, indexes, Prisma |
| [03-API-Design-Document.md](./03-API-Design-Document.md) | REST + WebSocket endpoints, Hey-API |
| [04-Mobile-App-Technical-Spec.md](./04-Mobile-App-Technical-Spec.md) | React Native + Expo, Goong Maps |
| [05-Admin-Dashboard-Spec.md](./05-Admin-Dashboard-Spec.md) | Web admin panel, TanStack Table |
| [06-Development-Phases.md](./06-Development-Phases.md) | Timeline & milestones |
| [07-Backend-Architecture.md](./07-Backend-Architecture.md) | **Repository Pattern, Modular Monolith, Security** |

---

## 9. Glossary

| Term | Definition |
|------|------------|
| KNN | K-Nearest Neighbors - algorithm for finding closest drivers |
| PostGIS | PostgreSQL extension for geographic objects |
| GEOGRAPHY | PostGIS type using spherical Earth model (accurate distances) |
| OTA | Over-The-Air updates (Expo feature) |
| RBAC | Role-Based Access Control |
| COD | Cash On Delivery |
| **Repository Pattern** | **Abstract data access layer with interfaces** |
| BullMQ | Redis-based message queue for Node.js background jobs |
| Hey-API | Tool to generate TypeScript clients from OpenAPI specs |
| Goong Maps | Vietnam-optimized map service (geocoding, routing, tiles) |
| GEOADD | Redis command for adding geospatial data |
| GEORADIUS | Redis command for finding items within a radius |
