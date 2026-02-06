---
name: redis-patterns
description: Use when implementing Redis caching, pub/sub messaging, geospatial storage, and BullMQ job queues in NestJS applications with Upstash Redis.
---

# Redis Patterns

## Overview

Production-ready patterns for Redis in NestJS applications. Covers caching strategies, pub/sub messaging, geospatial storage for driver locations, and BullMQ job queues.

## When to Use

**Use this skill when:**
- Implementing caching for frequently accessed data
- Building real-time pub/sub messaging systems
- Storing geospatial data (driver locations)
- Processing background jobs with BullMQ
- Managing rate limiting or session storage
- Using Upstash Redis (serverless Redis)

**Don't use when:**
- Simple in-memory caching is sufficient
- Data requires complex querying (use PostgreSQL)
- Need persistent storage only (use database)

## Core Patterns

### Pattern 1: Redis Service Setup

Configure Redis connection for Upstash:

```typescript
// src/cache/redis.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(private config: ConfigService) {
    this.client = new Redis({
      host: this.config.get('REDIS_HOST'),
      port: this.config.get('REDIS_PORT'),
      password: this.config.get('REDIS_PASSWORD'),
      tls: this.config.get('NODE_ENV') === 'production' ? {} : undefined,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
```

### Pattern 2: Cache-Aside Pattern

Implement caching with automatic invalidation:

```typescript
// src/cache/cache.service.ts
import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

interface CacheOptions {
  ttl?: number;  // Time to live in seconds
  key?: string;  // Custom cache key
}

@Injectable()
export class CacheService {
  private readonly DEFAULT_TTL = 300; // 5 minutes

  constructor(private redis: RedisService) {}

  /**
   * Get or set cache value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options.ttl);
    return value;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.getClient().get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    await this.redis.getClient().setex(key, ttl, JSON.stringify(value));
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    await this.redis.getClient().del(key);
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    const keys = await this.redis.getClient().keys(pattern);
    if (keys.length > 0) {
      await this.redis.getClient().del(...keys);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.redis.getClient().exists(key);
    return result === 1;
  }
}
```

### Pattern 3: Repository with Caching

Cache database queries in repository layer:

```typescript
// src/modules/users/users.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/cache/cache.service';

@Injectable()
export class UsersRepository {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findById(id: string) {
    return this.cache.getOrSet(
      `user:${id}`,
      () => this.prisma.user.findUnique({ where: { id } }),
      { ttl: 600 }, // 10 minutes
    );
  }

  async findByPhone(phone: string) {
    return this.cache.getOrSet(
      `user:phone:${phone}`,
      () => this.prisma.user.findUnique({ where: { phone } }),
      { ttl: 600 },
    );
  }

  async update(id: string, data: any) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    
    // Invalidate cache
    await this.cache.delete(`user:${id}`);
    if (data.phone) {
      await this.cache.delete(`user:phone:${data.phone}`);
    }
    
    return user;
  }
}
```

### Pattern 4: Geospatial Storage (Driver Locations)

Store and query driver locations using Redis Geo commands:

```typescript
// src/cache/geo.service.ts
import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  timestamp: number;
}

@Injectable()
export class GeoService {
  private readonly DRIVER_LOCATIONS_KEY = 'drivers:locations';
  private readonly DRIVER_STATUS_KEY = 'drivers:status';

  constructor(private redis: RedisService) {}

  /**
   * Update driver location
   */
  async updateDriverLocation(
    driverId: string, 
    lat: number, 
    lng: number
  ): Promise<void> {
    const client = this.redis.getClient();
    
    // Add to geospatial index
    await client.geoadd(this.DRIVER_LOCATIONS_KEY, lng, lat, driverId);
    
    // Store additional metadata
    await client.hset(this.DRIVER_STATUS_KEY, driverId, JSON.stringify({
      lat,
      lng,
      timestamp: Date.now(),
    }));
  }

  /**
   * Find nearby drivers within radius
   */
  async findNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number = 5,
    unit: 'km' | 'm' = 'km'
  ): Promise<Array<{ driverId: string; distance: number }>> {
    const results = await this.redis.getClient().georadius(
      this.DRIVER_LOCATIONS_KEY,
      lng,
      lat,
      radiusKm,
      unit,
      'WITHDIST',
      'ASC'
    );

    return results.map(([driverId, distance]) => ({
      driverId,
      distance: parseFloat(distance),
    }));
  }

  /**
   * Get driver location
   */
  async getDriverLocation(driverId: string): Promise<DriverLocation | null> {
    const data = await this.redis.getClient().hget(
      this.DRIVER_STATUS_KEY, 
      driverId
    );
    
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    return {
      driverId,
      ...parsed,
    };
  }

  /**
   * Remove driver from active locations
   */
  async removeDriver(driverId: string): Promise<void> {
    const client = this.redis.getClient();
    await client.zrem(this.DRIVER_LOCATIONS_KEY, driverId);
    await client.hdel(this.DRIVER_STATUS_KEY, driverId);
  }

  /**
   * Get all active driver IDs
   */
  async getActiveDriverIds(): Promise<string[]> {
    return this.redis.getClient().zrange(this.DRIVER_LOCATIONS_KEY, 0, -1);
  }
}
```

### Pattern 5: Pub/Sub for Real-time Events

Implement pub/sub for cross-instance communication:

```typescript
// src/cache/pubsub.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

type MessageHandler = (channel: string, message: string) => void;

@Injectable()
export class PubSubService implements OnModuleInit {
  private subscriber: ReturnType<Redis['duplicate']>;

  constructor(
    private redis: RedisService,
    private eventEmitter: EventEmitter2,
  ) {
    // Create separate connection for subscriber
    this.subscriber = this.redis.getClient().duplicate();
  }

  onModuleInit() {
    // Subscribe to channels
    this.subscriber.subscribe('driver:location', 'order:events');
    
    this.subscriber.on('message', (channel, message) => {
      // Emit as local event
      this.eventEmitter.emit(`redis:${channel}`, JSON.parse(message));
    });
  }

  /**
   * Publish message to channel
   */
  async publish(channel: string, data: unknown): Promise<void> {
    await this.redis.getClient().publish(channel, JSON.stringify(data));
  }

  /**
   * Subscribe to channel
   */
  async subscribe(channel: string, handler: MessageHandler): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        handler(ch, msg);
      }
    });
  }
}
```

### Pattern 6: Rate Limiting

Implement rate limiting with Redis:

```typescript
// src/common/guards/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { RedisService } from '@/cache/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.ip;
    const key = `ratelimit:${userId}`;
    
    const client = this.redis.getClient();
    
    // Increment counter
    const current = await client.incr(key);
    
    // Set expiry on first request
    if (current === 1) {
      await client.expire(key, 60); // 1 minute window
    }
    
    // Allow if under limit (e.g., 100 requests per minute)
    return current <= 100;
  }
}
```

### Pattern 7: BullMQ Queue Setup

Configure BullMQ with Redis:

```typescript
// src/queues/queues.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

export const NOTIFICATION_QUEUE = 'notification';
export const LOCATION_QUEUE = 'location';

@Module({
  imports: [
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
            age: 24 * 3600,    // Keep for 24 hours
            count: 1000,
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Keep for 7 days
          },
        },
      }),
      inject: [ConfigService],
    }),

    BullModule.registerQueue(
      { name: NOTIFICATION_QUEUE },
      { name: LOCATION_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
```

### Pattern 8: BullMQ Job Producer

Add jobs to queue:

```typescript
// src/queues/notification/notification.producer.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NOTIFICATION_QUEUE } from '../queues.module';

interface NotificationJob {
  type: 'push' | 'sms';
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationProducer {
  constructor(
    @InjectQueue(NOTIFICATION_QUEUE)
    private queue: Queue<NotificationJob>,
  ) {}

  async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ) {
    return this.queue.add('send-push', {
      type: 'push',
      userId,
      title,
      body,
      data,
    }, {
      priority: 1,
    });
  }

  async scheduleReminder(
    userId: string,
    orderId: string,
    delayMs: number
  ) {
    return this.queue.add('rating-reminder', {
      type: 'push',
      userId,
      title: 'Rate your delivery',
      body: 'How was your experience?',
      data: { orderId },
    }, {
      delay: delayMs,
      jobId: `reminder:${orderId}`, // Deduplication
    });
  }
}
```

### Pattern 9: BullMQ Job Processor

Process jobs from queue:

```typescript
// src/queues/notification/notification.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NOTIFICATION_QUEUE } from '../queues.module';
import { NotificationService } from './notification.service';

interface NotificationJob {
  type: 'push' | 'sms';
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Processor(NOTIFICATION_QUEUE, {
  concurrency: 5, // Process 5 jobs simultaneously
})
export class NotificationProcessor extends WorkerHost {
  constructor(private notificationService: NotificationService) {
    super();
  }

  async process(job: Job<NotificationJob>): Promise<void> {
    const { type, userId, title, body, data } = job.data;

    switch (job.name) {
      case 'send-push':
        await this.notificationService.sendPush(userId, title, body, data);
        break;
      
      case 'send-sms':
        await this.notificationService.sendSMS(userId, body);
        break;
      
      case 'rating-reminder':
        await this.notificationService.sendRatingReminder(userId, data?.orderId);
        break;
      
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }

    console.log(`Processed job ${job.id} of type ${job.name}`);
  }
}
```

## Quick Reference

| Task | Command | Notes |
|------|---------|-------|
| Set with TTL | `setex key ttl value` | Auto-expire |
| Get value | `get key` | Returns string |
| Delete | `del key` | Remove key |
| Check exists | `exists key` | Returns 0 or 1 |
| Geo add | `geoadd key lng lat member` | Add location |
| Geo radius | `georadius key lng lat radius unit` | Find nearby |
| Publish | `publish channel message` | Pub/sub |
| Subscribe | `subscribe channel` | Listen to channel |

## Environment Configuration

```bash
# .env
REDIS_HOST=your-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| No connection retry | Configure `retryStrategy` in ioredis |
| Using same connection for pub/sub | Create separate subscriber connection |
| Not handling Redis errors | Add error event listener |
| No TTL on cache keys | Always set expiration |
| Forgetting to invalidate cache | Delete cache keys on data update |

## Dependencies

```json
{
  "dependencies": {
    "ioredis": "^5.4.0",
    "@nestjs/bullmq": "^11.0.0",
    "bullmq": "^5.0.0"
  }
}
```

## Related Skills

- **nestjs-queue-architect** - Advanced BullMQ patterns
- **postgis-patterns** - Database geospatial queries
- **nestjs-best-practices** - Service layer patterns
