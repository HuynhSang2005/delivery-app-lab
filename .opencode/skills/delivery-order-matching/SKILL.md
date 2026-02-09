---
name: delivery-order-matching
description: Use when implementing driver-order matching algorithms with PostGIS KNN queries, finding nearest available drivers, calculating ETA, and optimizing delivery assignments for logistics/delivery apps.
---

# Delivery Order Matching

## Overview

Production-ready patterns for matching delivery orders with available drivers using PostGIS spatial queries. Covers KNN (K-Nearest Neighbors) search, driver availability filtering, ETA calculation, and batch matching algorithms.

## When to Use

**Use this skill when:**
- Matching orders to nearest available drivers
- Implementing driver assignment logic
- Calculating delivery ETAs based on distance
- Building real-time driver discovery systems
- Optimizing batch order assignments
- Handling driver acceptance/rejection flows

**Don't use when:**
- Simple proximity search without driver status
- Static route planning (use routing APIs instead)
- Non-spatial matching (use regular database queries)

## Core Patterns

### Pattern 1: Find Nearest Available Drivers (KNN)

Find the closest available drivers to a pickup location:

```typescript
// src/modules/drivers/drivers.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DriverMatchingService {
  constructor(private prisma: PrismaService) {}

  async findNearestDrivers(
    pickupLat: number,
    pickupLng: number,
    radiusKm: number = 5,
    limit: number = 10
  ) {
    // Convert km to meters for PostGIS
    const radiusMeters = radiusKm * 1000;

    const drivers = await this.prisma.$queryRaw`
      SELECT 
        d.id,
        d.name,
        d.phone,
        d.vehicle_type,
        d.rating,
        ST_X(d.current_location::geometry) as lng,
        ST_Y(d.current_location::geometry) as lat,
        ST_Distance(
          d.current_location,
          ST_SetSRID(ST_MakePoint(${pickupLng}, ${pickupLat}), 4326)::geography
        ) as distance_meters
      FROM drivers d
      WHERE d.is_available = true
        AND d.is_online = true
        AND d.current_location IS NOT NULL
        AND ST_DWithin(
          d.current_location,
          ST_SetSRID(ST_MakePoint(${pickupLng}, ${pickupLat}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance_meters ASC
      LIMIT ${limit}
    `;

    return drivers.map((d: any) => ({
      ...d,
      distance_km: Math.round(d.distance_meters / 100) / 10,
      eta_minutes: this.calculateETA(d.distance_meters),
    }));
  }

  private calculateETA(distanceMeters: number): number {
    // Average speed: 30 km/h in city
    const speedMetersPerMinute = 500; // ~30 km/h
    return Math.ceil(distanceMeters / speedMetersPerMinute);
  }
}
```

### Pattern 2: Driver Availability with Redis

Track driver online status and location in Redis for real-time queries:

```typescript
// src/modules/drivers/driver-location.service.ts
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class DriverLocationService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  // Driver comes online
  async setDriverOnline(
    driverId: string,
    lat: number,
    lng: number,
    vehicleType: string
  ) {
    const pipeline = this.redis.pipeline();

    // Add to geospatial index
    pipeline.geoadd('drivers:available', lng, lat, driverId);

    // Store driver metadata
    pipeline.hset(`driver:${driverId}`, {
      lat: lat.toString(),
      lng: lng.toString(),
      vehicleType,
      onlineAt: Date.now().toString(),
    });

    await pipeline.exec();
  }

  // Update driver location
  async updateLocation(driverId: string, lat: number, lng: number) {
    await this.redis.geoadd('drivers:available', lng, lat, driverId);
    await this.redis.hset(`driver:${driverId}`, 'lat', lat, 'lng', lng);
  }

  // Find nearby drivers using Redis GEORADIUS
  async findNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number = 5
  ): Promise<Array<{ driverId: string; distance: number }>> {
    const results = await this.redis.georadius(
      'drivers:available',
      lng,
      lat,
      radiusKm,
      'km',
      'WITHDIST',
      'ASC',
      'COUNT',
      10
    );

    return results.map(([driverId, distance]: [string, string]) => ({
      driverId,
      distance: parseFloat(distance),
    }));
  }

  // Driver goes offline
  async setDriverOffline(driverId: string) {
    const pipeline = this.redis.pipeline();
    pipeline.zrem('drivers:available', driverId);
    pipeline.del(`driver:${driverId}`);
    await pipeline.exec();
  }
}
```

### Pattern 3: Order Assignment Flow

Complete order assignment with driver notification and acceptance:

```typescript
// src/modules/orders/order-assignment.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { DriverLocationService } from './driver-location.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class OrderAssignmentService {
  constructor(
    private prisma: PrismaService,
    private driverLocation: DriverLocationService,
    private notifications: NotificationsService,
  ) {}

  async assignOrderToDriver(orderId: string) {
    // Get order details
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.status !== 'PENDING') {
      throw new Error('Order not available for assignment');
    }

    // Find nearest drivers
    const nearbyDrivers = await this.driverLocation.findNearbyDrivers(
      order.pickupLat,
      order.pickupLng,
      5 // 5km radius
    );

    if (nearbyDrivers.length === 0) {
      // No drivers available - add to queue or notify admin
      await this.handleNoDriversAvailable(orderId);
      return { success: false, reason: 'NO_DRIVERS' };
    }

    // Try assigning to drivers in order of proximity
    for (const { driverId, distance } of nearbyDrivers) {
      const assigned = await this.tryAssign(orderId, driverId, distance);
      if (assigned) {
        return { success: true, driverId };
      }
    }

    return { success: false, reason: 'ALL_REJECTED' };
  }

  private async tryAssign(
    orderId: string,
    driverId: string,
    distance: number
  ): Promise<boolean> {
    // Check if driver still available
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver?.isAvailable || !driver?.isOnline) {
      return false;
    }

    // Create assignment record
    const assignment = await this.prisma.orderAssignment.create({
      data: {
        orderId,
        driverId,
        status: 'PENDING',
        offeredAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 1000), // 30 seconds
      },
    });

    // Send push notification to driver
    await this.notifications.sendToDriver(driverId, {
      type: 'NEW_ORDER',
      orderId,
      distance: `${distance.toFixed(1)} km`,
      expiresIn: 30,
    });

    // Wait for acceptance (in real implementation, use WebSocket or polling)
    // This is simplified - actual implementation would be async
    return true;
  }

  async acceptOrder(assignmentId: string, driverId: string) {
    const assignment = await this.prisma.orderAssignment.findUnique({
      where: { id: assignmentId },
      include: { order: true },
    });

    if (!assignment || assignment.driverId !== driverId) {
      throw new Error('Invalid assignment');
    }

    if (assignment.status !== 'PENDING') {
      throw new Error('Assignment already processed');
    }

    if (new Date() > assignment.expiresAt) {
      throw new Error('Assignment expired');
    }

    // Update order and assignment
    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: assignment.orderId },
        data: {
          status: 'ASSIGNED',
          driverId,
          assignedAt: new Date(),
        },
      }),
      this.prisma.orderAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      }),
      this.prisma.driver.update({
        where: { id: driverId },
        data: { isAvailable: false },
      }),
    ]);

    // Notify customer
    await this.notifications.sendToCustomer(assignment.order.customerId, {
      type: 'DRIVER_ASSIGNED',
      driverId,
    });

    return { success: true };
  }

  private async handleNoDriversAvailable(orderId: string) {
    // Implement retry logic or admin notification
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'NO_DRIVER',
        notes: 'No drivers available in search radius',
      },
    });
  }
}
```

### Pattern 4: Batch Order Matching

Match multiple orders to optimize driver routes:

```typescript
// src/modules/orders/batch-matching.service.ts
import { Injectable } from '@nestjs/common';

interface Order {
  id: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}

interface Driver {
  id: string;
  lat: number;
  lng: number;
  maxOrders: number;
}

@Injectable()
export class BatchMatchingService {
  async matchBatchOrders(orders: Order[], drivers: Driver[]) {
    // Simple greedy algorithm
    const assignments: Array<{ orderId: string; driverId: string }> = [];
    const driverLoad = new Map<string, number>();

    // Sort orders by priority (e.g., time created)
    const sortedOrders = [...orders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    for (const order of sortedOrders) {
      // Find best driver for this order
      let bestDriver: Driver | null = null;
      let bestScore = Infinity;

      for (const driver of drivers) {
        const currentLoad = driverLoad.get(driver.id) || 0;
        if (currentLoad >= driver.maxOrders) continue;

        // Calculate score (distance + load penalty)
        const distance = this.calculateDistance(
          driver.lat,
          driver.lng,
          order.pickupLat,
          order.pickupLng
        );
        const score = distance + currentLoad * 0.5; // Penalty for loaded drivers

        if (score < bestScore) {
          bestScore = score;
          bestDriver = driver;
        }
      }

      if (bestDriver) {
        assignments.push({ orderId: order.id, driverId: bestDriver.id });
        driverLoad.set(bestDriver.id, (driverLoad.get(bestDriver.id) || 0) + 1);
      }
    }

    return assignments;
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
```

## Database Schema

```sql
-- Driver table with PostGIS
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  vehicle_type VARCHAR(20) NOT NULL,
  rating DECIMAL(2,1) DEFAULT 5.0,
  is_available BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  current_location GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Order assignments
CREATE TABLE order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  driver_id UUID REFERENCES drivers(id),
  status VARCHAR(20) NOT NULL, -- PENDING, ACCEPTED, REJECTED, EXPIRED
  offered_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejection_reason VARCHAR(100)
);

-- Spatial index for fast queries
CREATE INDEX idx_drivers_location ON drivers USING GIST(current_location);
CREATE INDEX idx_drivers_available ON drivers(is_available, is_online) 
  WHERE is_available = true AND is_online = true;
```

## Quick Reference

| Task | SQL/Method |
|------|------------|
| Find nearest drivers | `ST_DWithin` + `ORDER BY ST_Distance` |
| Calculate distance | `ST_Distance(geog1, geog2)` |
| Update location | `ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography` |
| Redis nearby search | `GEORADIUS key lng lat radius km` |
| ETA calculation | `distance / average_speed` |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using GEOMETRY instead of GEOGRAPHY | Use GEOGRAPHY for accurate distance calculations |
| Not indexing location column | Add GIST index on GEOGRAPHY column |
| Querying all drivers | Filter by is_available=true AND is_online=true first |
| Synchronous assignment | Use async flow with timeout for driver acceptance |
| No retry logic | Implement exponential backoff for failed assignments |

## Dependencies

```json
{
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "ioredis": "^5.4.0"
  }
}
```

## Related Skills

- **postgis-skill** - PostGIS spatial queries and functions
- **redis-patterns** - Redis caching and pub/sub
- **socket-io-nestjs-react-native** - Real-time driver location updates
