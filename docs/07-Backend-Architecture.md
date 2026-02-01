# Logship-MVP: Backend Architecture Document

**Version:** 1.0  
**Last Updated:** January 2025  
**Framework:** NestJS 11.x  
**Runtime:** Node.js 22 LTS  

---

## 1. Overview

This document provides comprehensive technical architecture for the Logship-MVP backend, covering modular architecture, message queues, caching strategies, API client generation, and security patterns.

### 1.1. Architecture Principles

| Principle | Implementation |
|-----------|----------------|
| **Modular Monolith** | Feature-based modules with clear boundaries |
| **CQRS-lite** | Separate read/write concerns for complex operations |
| **Event-Driven** | BullMQ for async processing, Socket.io for real-time |
| **Type Safety** | End-to-end TypeScript with Hey-API client generation |
| **Defense in Depth** | Multiple security layers (auth, validation, rate limiting) |

### 1.2. High-Level Architecture Diagram

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                      CLIENTS                                 │
                                    ├─────────────────────────────────────────────────────────────┤
                                    │  Mobile App (React Native)    │    Admin Dashboard (Next.js) │
                                    │  - User App                   │    - Hey-API Generated       │
                                    │  - Driver App                 │      TypeScript Client       │
                                    └──────────────┬────────────────┴──────────────┬───────────────┘
                                                   │                               │
                                                   │  HTTPS / WSS                  │
                                                   ▼                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         NESTJS BACKEND                                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                       │
│  ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐   ┌──────────────────┐  │
│  │   API Layer         │   │   WebSocket Layer   │   │   Background Jobs   │   │   Swagger/OpenAPI│  │
│  │   (REST Controllers)│   │   (Socket.io)       │   │   (BullMQ Workers)  │   │   (Auto-gen)     │  │
│  │                     │   │                     │   │                     │   │                  │  │
│  │  - Auth Module      │   │  - EventsGateway    │   │  - NotificationQueue│   │  → Hey-API       │  │
│  │  - Users Module     │   │  - LocationGateway  │   │  - LocationQueue    │   │    Client Gen    │  │
│  │  - Drivers Module   │   │  - ChatGateway      │   │  - OrderMatchQueue  │   │                  │  │
│  │  - Orders Module    │   │                     │   │  - ReportQueue      │   │                  │  │
│  │  - Chat Module      │   │                     │   │                     │   │                  │  │
│  │  - Admin Module     │   │                     │   │                     │   │                  │  │
│  └─────────┬───────────┘   └─────────┬───────────┘   └─────────┬───────────┘   └──────────────────┘  │
│            │                         │                         │                                      │
│            └─────────────────────────┴─────────────────────────┘                                      │
│                                      │                                                                │
│  ┌───────────────────────────────────┴───────────────────────────────────────────────────────────┐   │
│  │                              SHARED INFRASTRUCTURE                                              │   │
│  │                                                                                                 │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐   │   │
│  │  │  PrismaService  │  │  RedisService   │  │  GeoService     │  │  Common Guards/Pipes    │   │   │
│  │  │  (Database)     │  │  (Cache/PubSub) │  │  (PostGIS)      │  │  - JwtAuthGuard         │   │   │
│  │  │                 │  │                 │  │                 │  │  - RolesGuard           │   │   │
│  │  │                 │  │                 │  │                 │  │  - ThrottlerGuard       │   │   │
│  │  └────────┬────────┘  └────────┬────────┘  └─────────────────┘  │  - ValidationPipe       │   │   │
│  │           │                    │                                └─────────────────────────┘   │   │
│  └───────────┼────────────────────┼──────────────────────────────────────────────────────────────┘   │
│              │                    │                                                                   │
└──────────────┼────────────────────┼───────────────────────────────────────────────────────────────────┘
               │                    │
               ▼                    ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│   Neon Postgres      │  │   Upstash Redis      │  │   Firebase Auth      │  │   Cloudinary         │
│   + PostGIS          │  │                      │  │   (Phone OTP)        │  │   (Images)           │
│                      │  │   - BullMQ Queues    │  │                      │  │                      │
│   - Users            │  │   - Driver Geo Cache │  │   - OTP Verify       │  │   - Avatars          │
│   - Orders           │  │   - Session Store    │  │   - Email Link Auth  │  │   - Proof Images     │
│   - Messages         │  │   - Socket Adapter   │  │   - ID Tokens        │  │   - Driver Docs      │
│   - Tracking         │  │   - Rate Limiting    │  │                      │  │                      │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

---

## 2. Folder Structure

```
apps/backend/
├── src/
│   ├── main.ts                           # Application bootstrap
│   ├── app.module.ts                     # Root module
│   │
│   ├── common/                           # Shared utilities
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts # Extract user from request
│   │   │   ├── roles.decorator.ts        # @Roles('ADMIN', 'DRIVER')
│   │   │   └── public.decorator.ts       # @Public() skip auth
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts         # JWT validation
│   │   │   ├── roles.guard.ts            # RBAC enforcement
│   │   │   └── ws-auth.guard.ts          # WebSocket auth
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts        # Zod/class-validator
│   │   ├── filters/
│   │   │   ├── all-exceptions.filter.ts  # Global error handling
│   │   │   └── prisma-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts    # Request/response logging
│   │   │   ├── transform.interceptor.ts  # Response transformation
│   │   │   └── timeout.interceptor.ts
│   │   └── dto/
│   │       ├── pagination.dto.ts         # Shared pagination
│   │       └── response.dto.ts           # Standard response wrapper
│   │
│   ├── config/                           # Configuration
│   │   ├── app.config.ts                 # General app config
│   │   ├── database.config.ts            # Neon connection
│   │   ├── redis.config.ts               # Upstash Redis
│   │   ├── firebase.config.ts            # Firebase Admin SDK
│   │   ├── bullmq.config.ts              # Queue configuration
│   │   └── swagger.config.ts             # OpenAPI setup
│   │
│   ├── database/                         # Prisma & Database
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts             # Prisma client with extensions
│   │   └── geo.service.ts                # PostGIS helper functions
│   │
│   ├── cache/                            # Redis & Caching
│   │   ├── cache.module.ts
│   │   ├── redis.service.ts              # Redis client wrapper
│   │   └── cache.service.ts              # Cache-aside pattern
│   │
│   ├── queues/                           # BullMQ Queues
│   │   ├── queues.module.ts              # Queue registration
│   │   ├── notification/
│   │   │   ├── notification.queue.ts     # Queue definition
│   │   │   ├── notification.processor.ts # Job processor (worker)
│   │   │   └── notification.producer.ts  # Job producer service
│   │   ├── location/
│   │   │   ├── location.queue.ts
│   │   │   ├── location.processor.ts     # Batch location processing
│   │   │   └── location.producer.ts
│   │   ├── order-matching/
│   │   │   ├── matching.queue.ts
│   │   │   ├── matching.processor.ts     # Driver matching logic
│   │   │   └── matching.producer.ts
│   │   └── reports/
│   │       ├── report.queue.ts
│   │       ├── report.processor.ts       # Analytics generation
│   │       └── report.producer.ts
│   │
│   ├── modules/                          # Feature Modules
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── firebase.strategy.ts
│   │   │   ├── dto/
│   │   │   │   ├── send-otp.dto.ts
│   │   │   │   ├── verify-otp.dto.ts
│   │   │   │   ├── add-email.dto.ts      # NEW: Email verification
│   │   │   │   └── refresh-token.dto.ts
│   │   │   └── guards/
│   │   │       └── firebase-auth.guard.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts       # Data access layer
│   │   │   └── dto/
│   │   │
│   │   ├── drivers/
│   │   │   ├── drivers.module.ts
│   │   │   ├── drivers.controller.ts
│   │   │   ├── drivers.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── orders/
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── orders.repository.ts
│   │   │   ├── events/                   # Domain events
│   │   │   │   ├── order-created.event.ts
│   │   │   │   ├── order-assigned.event.ts
│   │   │   │   └── order-completed.event.ts
│   │   │   └── dto/
│   │   │
│   │   ├── chat/
│   │   │   ├── chat.module.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── chat.service.ts
│   │   │   └── dto/
│   │   │
│   │   └── admin/
│   │       ├── admin.module.ts
│   │       ├── admin.controller.ts
│   │       ├── admin.service.ts
│   │       └── dto/
│   │
│   └── gateway/                          # WebSocket Gateways
│       ├── gateway.module.ts
│       ├── events.gateway.ts             # Main gateway
│       ├── adapters/
│       │   └── redis-io.adapter.ts       # Socket.io Redis adapter
│       └── dto/
│           ├── driver-location.dto.ts
│           └── chat-message.dto.ts
│
├── prisma/
│   ├── schema.prisma                     # Database schema
│   └── migrations/                       # Migration files
│
├── test/                                 # E2E tests
├── .env.example
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## 3. BullMQ Message Queue Architecture

### 3.1. Why BullMQ?

| Feature | Benefit for Logship |
|---------|---------------------|
| **Redis-backed** | Uses existing Upstash Redis infrastructure |
| **Job Scheduling** | Delayed notifications, retry scheduling |
| **Concurrency Control** | Process multiple jobs simultaneously |
| **Rate Limiting** | Prevent external API abuse (Firebase, SMS) |
| **Job Prioritization** | Urgent notifications first |
| **Dead Letter Queue** | Failed job tracking and retry |
| **Built-in Retries** | Automatic retry with exponential backoff |

### 3.2. Queue Definitions

```typescript
// src/queues/queues.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

// Queue names as constants
export const NOTIFICATION_QUEUE = 'notification';
export const LOCATION_QUEUE = 'location';
export const ORDER_MATCHING_QUEUE = 'order-matching';
export const REPORT_QUEUE = 'report';

@Module({
  imports: [
    // Global BullMQ configuration
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD'),
          tls: config.get('NODE_ENV') === 'production' ? {} : undefined,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: {
            age: 24 * 3600,    // Keep completed jobs for 24 hours
            count: 1000,       // Keep last 1000 completed jobs
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
          },
        },
      }),
      inject: [ConfigService],
    }),

    // Register individual queues
    BullModule.registerQueue(
      { name: NOTIFICATION_QUEUE },
      { name: LOCATION_QUEUE },
      { name: ORDER_MATCHING_QUEUE },
      { name: REPORT_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
```

### 3.3. Notification Queue (Example Implementation)

```typescript
// src/queues/notification/notification.queue.ts
export interface NotificationJobData {
  type: 'push' | 'sms' | 'email';
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export enum NotificationJobName {
  SEND_PUSH = 'send-push',
  SEND_SMS = 'send-sms',
  SEND_EMAIL = 'send-email',
  ORDER_STATUS_UPDATE = 'order-status-update',
  DRIVER_ASSIGNED = 'driver-assigned',
}
```

```typescript
// src/queues/notification/notification.producer.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NOTIFICATION_QUEUE } from '../queues.module';
import { NotificationJobData, NotificationJobName } from './notification.queue';

@Injectable()
export class NotificationProducer {
  constructor(
    @InjectQueue(NOTIFICATION_QUEUE)
    private notificationQueue: Queue<NotificationJobData>,
  ) {}

  /**
   * Add a push notification job to the queue
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    return this.notificationQueue.add(
      NotificationJobName.SEND_PUSH,
      {
        type: 'push',
        userId,
        title,
        body,
        data,
      },
      {
        priority: 1, // High priority
      },
    );
  }

  /**
   * Notify user when order status changes
   */
  async notifyOrderStatusUpdate(
    userId: string,
    orderId: string,
    status: string,
  ) {
    const statusMessages: Record<string, string> = {
      ASSIGNED: 'Driver has been assigned to your order',
      PICKING_UP: 'Driver is heading to pickup location',
      DELIVERING: 'Your package is on the way',
      COMPLETED: 'Delivery completed successfully',
    };

    return this.notificationQueue.add(
      NotificationJobName.ORDER_STATUS_UPDATE,
      {
        type: 'push',
        userId,
        title: 'Order Update',
        body: statusMessages[status] || `Order status: ${status}`,
        data: { orderId, status },
      },
      {
        // Deduplicate: only one notification per order+status
        jobId: `order-status-${orderId}-${status}`,
      },
    );
  }

  /**
   * Send delayed reminder (e.g., rate driver after 1 hour)
   */
  async scheduleRatingReminder(userId: string, orderId: string) {
    return this.notificationQueue.add(
      'rating-reminder',
      {
        type: 'push',
        userId,
        title: 'Rate your delivery',
        body: 'How was your delivery experience?',
        data: { orderId, action: 'rate' },
      },
      {
        delay: 60 * 60 * 1000, // 1 hour delay
        jobId: `rating-reminder-${orderId}`, // Prevent duplicates
      },
    );
  }
}
```

```typescript
// src/queues/notification/notification.processor.ts
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NOTIFICATION_QUEUE } from '../queues.module';
import { NotificationJobData, NotificationJobName } from './notification.queue';
import { FirebaseService } from '../../services/firebase.service';
import { PrismaService } from '../../database/prisma.service';

@Processor(NOTIFICATION_QUEUE, {
  concurrency: 10, // Process up to 10 jobs concurrently
  limiter: {
    max: 100,       // Max 100 jobs
    duration: 60000, // Per minute (Firebase rate limit)
  },
})
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private firebaseService: FirebaseService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    this.logger.debug(`Processing job ${job.id}: ${job.name}`);

    switch (job.name) {
      case NotificationJobName.SEND_PUSH:
      case NotificationJobName.ORDER_STATUS_UPDATE:
      case NotificationJobName.DRIVER_ASSIGNED:
        await this.handlePushNotification(job);
        break;
      case NotificationJobName.SEND_SMS:
        await this.handleSmsNotification(job);
        break;
      case NotificationJobName.SEND_EMAIL:
        await this.handleEmailNotification(job);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handlePushNotification(job: Job<NotificationJobData>) {
    const { userId, title, body, data } = job.data;

    // Get user's FCM token(s)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmTokens: true },
    });

    if (!user?.fcmTokens?.length) {
      this.logger.warn(`No FCM tokens for user ${userId}`);
      return;
    }

    // Update job progress
    await job.updateProgress(50);

    // Send to all user devices
    const results = await this.firebaseService.sendMulticast({
      tokens: user.fcmTokens,
      notification: { title, body },
      data: data as Record<string, string>,
    });

    // Remove invalid tokens
    if (results.failureCount > 0) {
      const invalidTokens = results.responses
        .map((resp, idx) => (!resp.success ? user.fcmTokens[idx] : null))
        .filter(Boolean);

      if (invalidTokens.length > 0) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            fcmTokens: {
              set: user.fcmTokens.filter((t) => !invalidTokens.includes(t)),
            },
          },
        });
      }
    }

    // Store notification in database
    await this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        data: data ?? {},
      },
    });

    await job.updateProgress(100);
    this.logger.log(`Push notification sent to user ${userId}`);
  }

  private async handleSmsNotification(job: Job<NotificationJobData>) {
    // Implement SMS sending (e.g., via Twilio or local Vietnam SMS provider)
    this.logger.log(`SMS notification: ${job.data.body}`);
  }

  private async handleEmailNotification(job: Job<NotificationJobData>) {
    // Implement email sending (e.g., via Resend, SendGrid)
    this.logger.log(`Email notification: ${job.data.body}`);
  }

  // Event handlers for monitoring
  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number) {
    this.logger.debug(`Job ${job.id} progress: ${progress}%`);
  }
}
```

### 3.4. Order Matching Queue

```typescript
// src/queues/order-matching/matching.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ORDER_MATCHING_QUEUE } from '../queues.module';
import { GeoService } from '../../database/geo.service';
import { RedisService } from '../../cache/redis.service';
import { EventsGateway } from '../../gateway/events.gateway';

interface MatchingJobData {
  orderId: string;
  pickupLat: number;
  pickupLng: number;
  attempt: number;
}

@Processor(ORDER_MATCHING_QUEUE, {
  concurrency: 5,
})
export class OrderMatchingProcessor extends WorkerHost {
  constructor(
    private geoService: GeoService,
    private redisService: RedisService,
    private eventsGateway: EventsGateway,
  ) {
    super();
  }

  async process(job: Job<MatchingJobData>): Promise<void> {
    const { orderId, pickupLat, pickupLng, attempt } = job.data;

    // Expand search radius with each attempt
    const radiusMeters = Math.min(5000 + attempt * 2000, 15000); // 5km → 15km max

    // Find nearest available drivers
    const nearbyDrivers = await this.geoService.findNearestDrivers(
      { lat: pickupLat, lng: pickupLng },
      radiusMeters,
      10,
    );

    if (nearbyDrivers.length === 0) {
      // No drivers found - retry with larger radius
      if (attempt < 3) {
        await job.moveToDelayed(Date.now() + 30000); // Wait 30 seconds
        throw new Error(`No drivers found, attempt ${attempt + 1}`);
      }
      // After 3 attempts, mark as no driver available
      return;
    }

    // Notify drivers about new order via WebSocket
    for (const driver of nearbyDrivers) {
      this.eventsGateway.sendToUser(driver.user_id, 'order:new', {
        orderId,
        distanceToPickup: driver.distance_meters,
        // ... order summary
      });
    }

    // Set expiry for drivers to respond (2 minutes)
    await this.redisService.setex(
      `order:matching:${orderId}`,
      120,
      JSON.stringify({ driverIds: nearbyDrivers.map((d) => d.driver_id) }),
    );
  }
}
```

### 3.5. Location Batch Processing Queue

```typescript
// src/queues/location/location.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LOCATION_QUEUE } from '../queues.module';
import { PrismaService } from '../../database/prisma.service';

interface LocationBatchData {
  driverId: string;
  orderId?: string;
  locations: Array<{
    lat: number;
    lng: number;
    timestamp: Date;
  }>;
}

/**
 * Process location updates in batches to reduce database writes.
 * Instead of writing every 5-second update, batch them every minute.
 */
@Processor(LOCATION_QUEUE, {
  concurrency: 20,
})
export class LocationProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<LocationBatchData>): Promise<void> {
    const { driverId, orderId, locations } = job.data;

    // Update driver's current location (latest only)
    const latestLocation = locations[locations.length - 1];
    await this.prisma.$executeRaw`
      UPDATE drivers 
      SET 
        last_location = ST_MakePoint(${latestLocation.lng}, ${latestLocation.lat})::geography,
        last_location_updated_at = ${latestLocation.timestamp}
      WHERE id = ${driverId}::uuid
    `;

    // If on active order, store tracking history
    if (orderId) {
      await this.prisma.orderTracking.createMany({
        data: locations.map((loc) => ({
          orderId,
          location: `POINT(${loc.lng} ${loc.lat})`,
          recordedAt: loc.timestamp,
        })),
      });
    }
  }
}
```

---

## 4. Caching Strategy

### 4.1. Redis Cache Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UPSTASH REDIS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │  Cache Layer        │  │  Real-time Layer    │  │  Queue Layer        │  │
│  │                     │  │                     │  │                     │  │
│  │  cache:user:{id}    │  │  geo:drivers        │  │  bull:notification  │  │
│  │  cache:order:{id}   │  │  socket:user:{id}   │  │  bull:location      │  │
│  │  cache:config       │  │  typing:{orderId}   │  │  bull:matching      │  │
│  │                     │  │  room:{orderId}     │  │                     │  │
│  │  TTL: 5-60 min      │  │  TTL: seconds       │  │  Persistent         │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐                           │
│  │  Session Layer      │  │  Rate Limit Layer   │                           │
│  │                     │  │                     │                           │
│  │  refresh:{token}    │  │  rate:api:{userId}  │                           │
│  │  blacklist:{token}  │  │  rate:otp:{phone}   │                           │
│  │                     │  │                     │                           │
│  │  TTL: 7 days        │  │  TTL: 1-5 min       │                           │
│  └─────────────────────┘  └─────────────────────┘                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2. Cache Service Implementation

```typescript
// src/cache/cache.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

interface CacheOptions {
  ttlSeconds?: number;
  prefix?: string;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTTL = 300; // 5 minutes

  constructor(private redis: RedisService) {}

  /**
   * Cache-Aside Pattern: Get from cache, or fetch and cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    const { ttlSeconds = this.defaultTTL, prefix = 'cache' } = options;
    const cacheKey = `${prefix}:${key}`;

    // Try to get from cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return JSON.parse(cached) as T;
    }

    this.logger.debug(`Cache MISS: ${cacheKey}`);

    // Fetch fresh data
    const data = await fetcher();

    // Cache the result
    if (data !== null && data !== undefined) {
      await this.redis.setex(cacheKey, ttlSeconds, JSON.stringify(data));
    }

    return data;
  }

  /**
   * Invalidate cache by key
   */
  async invalidate(key: string, prefix = 'cache'): Promise<void> {
    const cacheKey = `${prefix}:${key}`;
    await this.redis.del(cacheKey);
    this.logger.debug(`Cache INVALIDATED: ${cacheKey}`);
  }

  /**
   * Invalidate multiple keys by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
      this.logger.debug(`Cache INVALIDATED: ${keys.length} keys matching ${pattern}`);
    }
  }

  /**
   * Cache system configuration (long TTL)
   */
  async getSystemConfig(key: string): Promise<any> {
    return this.getOrSet(
      `config:${key}`,
      async () => {
        // Fetch from database
        const config = await this.prisma.systemConfig.findUnique({
          where: { key },
        });
        return config?.value;
      },
      { ttlSeconds: 3600, prefix: 'cache' }, // 1 hour
    );
  }

  /**
   * Cache order details (short TTL for active orders)
   */
  async getCachedOrder(orderId: string): Promise<any> {
    return this.getOrSet(
      `order:${orderId}`,
      async () => {
        return this.prisma.order.findUnique({
          where: { id: orderId },
          include: {
            user: { select: { id: true, name: true, phone: true } },
            driver: { select: { id: true, name: true, phone: true } },
          },
        });
      },
      { ttlSeconds: 60 }, // 1 minute for active tracking
    );
  }
}
```

### 4.3. Driver Location Geo Cache

```typescript
// src/cache/redis.service.ts (Geo methods)
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL);
  }

  /**
   * Store driver location in Redis Geo
   * Faster than PostGIS for real-time queries
   */
  async updateDriverGeo(
    driverId: string,
    lat: number,
    lng: number,
  ): Promise<void> {
    await this.client.geoadd('geo:drivers', lng, lat, driverId);
    // Also store timestamp
    await this.client.hset(`driver:meta:${driverId}`, 'lastUpdate', Date.now());
  }

  /**
   * Find nearby drivers from Redis (faster than PostGIS for hot queries)
   */
  async findNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number,
    limit = 10,
  ): Promise<Array<{ driverId: string; distance: number }>> {
    const results = await this.client.georadius(
      'geo:drivers',
      lng,
      lat,
      radiusKm,
      'km',
      'WITHDIST',
      'ASC',
      'COUNT',
      limit,
    );

    return results.map(([driverId, distance]) => ({
      driverId,
      distance: parseFloat(distance),
    }));
  }

  /**
   * Remove inactive drivers (not updated in last 5 minutes)
   */
  async removeInactiveDrivers(): Promise<void> {
    const threshold = Date.now() - 5 * 60 * 1000;
    const driverIds = await this.client.zrange('geo:drivers', 0, -1);

    for (const driverId of driverIds) {
      const lastUpdate = await this.client.hget(`driver:meta:${driverId}`, 'lastUpdate');
      if (lastUpdate && parseInt(lastUpdate) < threshold) {
        await this.client.zrem('geo:drivers', driverId);
        await this.client.del(`driver:meta:${driverId}`);
      }
    }
  }
}
```

---

## 5. Hey-API Client Generation

### 5.1. NestJS Swagger Configuration

```typescript
// src/config/swagger.config.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Logship API')
    .setDescription('Logship-MVP Delivery App API')
    .setVersion('1.0.0')
    .setContact('Developer', 'https://github.com/yourname', 'dev@example.com')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'access-token',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Drivers', 'Driver operations')
    .addTag('Orders', 'Order management')
    .addTag('Chat', 'In-order messaging')
    .addTag('Admin', 'Admin dashboard APIs')
    .addServer('http://localhost:3000', 'Development')
    .addServer('https://api.logship.example.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  // Setup Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
    },
  });

  // Export OpenAPI spec as JSON (for Hey-API)
  if (process.env.NODE_ENV !== 'production') {
    const outputPath = path.resolve(__dirname, '../../openapi.json');
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
    console.log(`OpenAPI spec written to ${outputPath}`);
  }

  return document;
}
```

### 5.2. Controller with Swagger Decorators

```typescript
// src/modules/orders/orders.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  OrderResponseDto,
  OrderListResponseDto,
  UpdateOrderStatusDto,
  CalculatePriceDto,
  PriceResponseDto,
} from './dto';
import { User, UserRole } from '@prisma/client';

@Controller('orders')
@ApiTags('Orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('calculate-price')
  @ApiOperation({
    summary: 'Calculate order price',
    description: 'Preview price based on pickup and dropoff locations',
  })
  @ApiResponse({
    status: 200,
    description: 'Price calculation result',
    type: PriceResponseDto,
  })
  calculatePrice(@Body() dto: CalculatePriceDto): Promise<PriceResponseDto> {
    return this.ordersService.calculatePrice(dto);
  }

  @Post()
  @Roles(UserRole.USER)
  @ApiOperation({
    summary: 'Create new order',
    description: 'Create a delivery order as a customer',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List orders',
    description: 'Get paginated list of orders for current user',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'ASSIGNED', 'DELIVERING', 'COMPLETED', 'CANCELLED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Paginated order list',
    type: OrderListResponseDto,
  })
  findAll(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<OrderListResponseDto> {
    return this.ordersService.findAllForUser(user, { status, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.findOneForUser(id, user);
  }

  @Post(':id/accept')
  @Roles(UserRole.DRIVER)
  @ApiOperation({
    summary: 'Accept order',
    description: 'Driver accepts a pending order',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  @ApiResponse({ status: 409, description: 'Order already assigned' })
  acceptOrder(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.acceptOrder(id, user.driver.id);
  }

  @Patch(':id/status')
  @Roles(UserRole.DRIVER)
  @ApiOperation({
    summary: 'Update order status',
    description: 'Driver updates order status during delivery',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  updateStatus(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateStatus(id, user.driver.id, dto);
  }
}
```

### 5.3. Hey-API Configuration (Frontend)

```typescript
// apps/admin/openapi-ts.config.ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../backend/openapi.json', // Or 'http://localhost:3000/api/docs-json'
  output: 'src/client',
  plugins: [
    // Generate Fetch-based client
    '@hey-api/client-fetch',
    
    // Generate TypeScript types
    '@hey-api/typescript',
    
    // Generate Zod schemas for validation
    {
      name: 'zod',
      definitions: true,
      requests: true,
      responses: true,
    },
    
    // Generate TanStack Query hooks
    {
      name: '@tanstack/react-query',
      queryOptions: true,
      mutationOptions: true,
      queryKeys: true,
      infiniteQueryOptions: true,
    },
  ],
});
```

```json
// apps/admin/package.json (scripts)
{
  "scripts": {
    "generate:api": "openapi-ts",
    "dev": "npm run generate:api && next dev",
    "build": "npm run generate:api && next build"
  }
}
```

### 5.4. Using Generated Client (Admin Dashboard)

```typescript
// apps/admin/src/app/orders/page.tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findAllOptions,
  findOneOptions,
  updateStatusMutation,
  ordersQueryKey,
} from '@/client/tanstack-query.gen';
import { zOrderResponseDto } from '@/client/zod.gen';

export default function OrdersPage() {
  const queryClient = useQueryClient();

  // Fetch orders with type-safe options
  const { data: orders, isLoading, error } = useQuery({
    ...findAllOptions({
      query: { status: 'PENDING', page: 1, limit: 20 },
    }),
  });

  // Update order status mutation
  const updateStatus = useMutation({
    ...updateStatusMutation(),
    onSuccess: (updatedOrder) => {
      // Invalidate order list
      queryClient.invalidateQueries({
        queryKey: ordersQueryKey(),
      });
      
      // Validate response with Zod
      const validated = zOrderResponseDto.parse(updatedOrder);
      console.log('Order updated:', validated.orderNumber);
    },
  });

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateStatus.mutate({
      path: { id: orderId },
      body: { status: newStatus },
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Orders</h1>
      <table>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders?.data?.map((order) => (
            <tr key={order.id}>
              <td>{order.orderNumber}</td>
              <td>{order.status}</td>
              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}>
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 6. Email Verification Flow

### 6.1. Overview

After phone OTP registration, users can optionally add and verify an email for:
- Password recovery (future)
- Email notifications
- Admin login (web dashboard)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EMAIL VERIFICATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. User logged in via Phone OTP                                            │
│     │                                                                        │
│     ▼                                                                        │
│  2. User requests to add email                                              │
│     POST /auth/email/request-verification                                    │
│     Body: { email: "user@example.com" }                                     │
│     │                                                                        │
│     ▼                                                                        │
│  3. Backend sends verification link via Firebase Auth                       │
│     Email contains: https://app.logship.com/verify-email?token=xxx          │
│     │                                                                        │
│     ▼                                                                        │
│  4. User clicks link (opens in app or web)                                  │
│     │                                                                        │
│     ▼                                                                        │
│  5. App/Web sends token to backend                                          │
│     POST /auth/email/verify                                                  │
│     Body: { token: "xxx" }                                                  │
│     │                                                                        │
│     ▼                                                                        │
│  6. Backend verifies with Firebase and updates user                         │
│     - Set user.email                                                        │
│     - Set user.emailVerified = true                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2. Auth Controller Endpoints

```typescript
// src/modules/auth/auth.controller.ts

@Post('email/request-verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Request email verification',
  description: 'Send verification link to user email',
})
@ApiResponse({ status: 200, description: 'Verification email sent' })
@ApiResponse({ status: 409, description: 'Email already in use' })
async requestEmailVerification(
  @CurrentUser() user: User,
  @Body() dto: RequestEmailVerificationDto,
): Promise<{ message: string }> {
  return this.authService.requestEmailVerification(user.id, dto.email);
}

@Post('email/verify')
@Public() // Can be called from email link without auth
@ApiOperation({
  summary: 'Verify email',
  description: 'Complete email verification with token from email link',
})
@ApiResponse({ status: 200, description: 'Email verified successfully' })
@ApiResponse({ status: 400, description: 'Invalid or expired token' })
async verifyEmail(
  @Body() dto: VerifyEmailDto,
): Promise<{ message: string; user: UserResponseDto }> {
  return this.authService.verifyEmail(dto.token);
}
```

### 6.3. Auth Service Implementation

```typescript
// src/modules/auth/auth.service.ts

async requestEmailVerification(userId: string, email: string) {
  // Check if email already used by another user
  const existingUser = await this.prisma.user.findFirst({
    where: { email, NOT: { id: userId } },
  });

  if (existingUser) {
    throw new ConflictException('Email already in use');
  }

  // Get user's Firebase UID
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { firebaseUid: true },
  });

  if (!user?.firebaseUid) {
    throw new BadRequestException('User not linked to Firebase');
  }

  // Update Firebase user email and send verification
  await this.firebaseAdmin.auth().updateUser(user.firebaseUid, {
    email,
    emailVerified: false,
  });

  // Generate email verification link
  const link = await this.firebaseAdmin.auth().generateEmailVerificationLink(email, {
    url: `${process.env.APP_URL}/verify-email`,
  });

  // Queue email sending (via BullMQ)
  await this.notificationProducer.sendEmail(
    email,
    'Verify your email - Logship',
    `Click here to verify: ${link}`,
  );

  // Temporarily store pending email
  await this.prisma.user.update({
    where: { id: userId },
    data: { pendingEmail: email },
  });

  return { message: 'Verification email sent' };
}

async verifyEmail(oobCode: string) {
  try {
    // Verify the action code with Firebase
    const info = await this.firebaseAdmin.auth().checkActionCode(oobCode);
    
    if (info.operation !== 'VERIFY_EMAIL') {
      throw new BadRequestException('Invalid verification token');
    }

    // Apply the action code
    await this.firebaseAdmin.auth().applyActionCode(oobCode);

    // Get Firebase user
    const firebaseUser = await this.firebaseAdmin.auth().getUserByEmail(info.data.email!);

    // Update our database
    const user = await this.prisma.user.update({
      where: { firebaseUid: firebaseUser.uid },
      data: {
        email: info.data.email,
        emailVerified: true,
        pendingEmail: null,
      },
    });

    return {
      message: 'Email verified successfully',
      user: this.toUserResponse(user),
    };
  } catch (error) {
    if (error.code === 'auth/invalid-action-code') {
      throw new BadRequestException('Invalid or expired verification link');
    }
    throw error;
  }
}
```

---

## 7. Security Implementation

### 7.1. Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYERS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Layer 1: Transport Security                                          │    │
│  │ - HTTPS/TLS 1.3 everywhere                                           │    │
│  │ - Secure WebSocket (WSS)                                             │    │
│  │ - HTTP Strict Transport Security (HSTS)                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Layer 2: Rate Limiting (ThrottlerGuard)                              │    │
│  │ - API: 100 req/min per user                                          │    │
│  │ - Auth: 5 req/5min per IP                                            │    │
│  │ - Location: 20 req/min per driver                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Layer 3: Authentication (JwtAuthGuard)                               │    │
│  │ - Firebase token verification                                        │    │
│  │ - JWT access token (15min expiry)                                    │    │
│  │ - Refresh token rotation                                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Layer 4: Authorization (RolesGuard)                                  │    │
│  │ - Role-based access control (USER, DRIVER, ADMIN)                    │    │
│  │ - Resource ownership checks                                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Layer 5: Input Validation (ValidationPipe)                           │    │
│  │ - Zod schema validation                                              │    │
│  │ - class-validator decorators                                         │    │
│  │ - Sanitization (trim, escape)                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Layer 6: Database Security (Prisma)                                  │    │
│  │ - Parameterized queries (SQL injection prevention)                   │    │
│  │ - SSL connections to Neon                                            │    │
│  │ - Sensitive data encryption                                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2. Rate Limiting Configuration

```typescript
// src/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000,    // 1 second
            limit: 3,     // 3 requests
          },
          {
            name: 'medium',
            ttl: 60000,   // 1 minute
            limit: 100,   // 100 requests
          },
          {
            name: 'long',
            ttl: 3600000, // 1 hour
            limit: 1000,  // 1000 requests
          },
        ],
        storage: new ThrottlerStorageRedisService({
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
        }),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

```typescript
// Custom rate limit per endpoint
// src/modules/auth/auth.controller.ts
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Post('otp/send')
  @Throttle({ short: { limit: 1, ttl: 30000 } }) // 1 per 30 seconds
  async sendOtp(@Body() dto: SendOtpDto) {
    // ...
  }

  @Post('otp/verify')
  @Throttle({ short: { limit: 5, ttl: 300000 } }) // 5 per 5 minutes
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    // ...
  }

  @Get('me')
  @SkipThrottle() // No rate limit for profile fetch
  async getProfile(@CurrentUser() user: User) {
    // ...
  }
}
```

### 7.3. JWT Strategy

```typescript
// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../cache/redis.service';

interface JwtPayload {
  sub: string;      // User ID
  role: string;     // User role
  iat: number;      // Issued at
  exp: number;      // Expiry
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // Check if token is blacklisted (logout)
    const isBlacklisted = await this.redis.exists(`blacklist:${payload.sub}:${payload.iat}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Get user from database
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        driver: {
          select: {
            id: true,
            status: true,
            isApproved: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
```

### 7.4. CORS Configuration

```typescript
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3001',          // Admin dev
        'http://localhost:8081',          // Expo dev
        'https://admin.logship.example.com',
        'https://app.logship.example.com',
      ];

      // Allow requests with no origin (mobile apps, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Total-Pages'],
  });

  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for Swagger UI
    crossOriginEmbedderPolicy: false,
  }));

  await app.listen(3000);
}
```

---

## 8. Observability & Monitoring

### 8.1. Logging Interceptor

```typescript
// src/common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const userAgent = request.get('user-agent') || '';
    const ip = request.ip;
    const now = Date.now();

    // Don't log sensitive data
    const sanitizedBody = this.sanitizeBody(body);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - now;

          this.logger.log(
            `${method} ${url} ${statusCode} ${duration}ms - ${ip} - ${userAgent} - user:${user?.id || 'anonymous'}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `${method} ${url} ${error.status || 500} ${duration}ms - ${ip} - ${error.message}`,
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    const sensitive = ['password', 'token', 'otp', 'firebaseToken', 'refreshToken'];
    const sanitized = { ...body };
    for (const key of sensitive) {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
```

### 8.2. Health Check Endpoint

```typescript
// src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { RedisHealthIndicator } from './redis.health';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prisma.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness check' })
  ready() {
    return { status: 'ready', timestamp: new Date().toISOString() };
  }
}
```

---

## 9. Environment Configuration

### 9.1. Environment Variables

```bash
# .env.example

# App
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database (Neon)
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_POOLED="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Redis (Upstash)
REDIS_URL="rediss://default:xxx@xxx.upstash.io:6379"
REDIS_HOST=xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=xxx

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# External APIs (Goong Maps for Vietnam)
GOONG_API_KEY=xxx
GOONG_MAPTILES_KEY=xxx
```

### 9.2. Configuration Module

```typescript
// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL,
    pooledUrl: process.env.DATABASE_URL_POOLED,
  },
  
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  
  goong: {
    apiKey: process.env.GOONG_API_KEY,
    maptilesKey: process.env.GOONG_MAPTILES_KEY,
  },
});
```

---

## 10. Related Documents

| Document | Description |
|----------|-------------|
| [01-SDD-System-Design-Document.md](./01-SDD-System-Design-Document.md) | Architecture overview |
| [02-Database-Design-Document.md](./02-Database-Design-Document.md) | Schema, PostGIS, indexes |
| [03-API-Design-Document.md](./03-API-Design-Document.md) | REST + WebSocket endpoints |
| [04-Mobile-App-Technical-Spec.md](./04-Mobile-App-Technical-Spec.md) | React Native + Expo |
| [05-Admin-Dashboard-Spec.md](./05-Admin-Dashboard-Spec.md) | Web admin panel |
| [06-Development-Phases.md](./06-Development-Phases.md) | Timeline & milestones |
