---
name: postgis-patterns
description: Use when implementing geospatial queries with PostGIS in PostgreSQL, including nearest-neighbor search, distance calculations, and location-based matching for delivery/logistics applications.
---

# PostGIS Patterns

## Overview

Production-ready patterns for geospatial operations with PostGIS. Covers nearest-neighbor queries, distance calculations, spatial indexing, and driver matching for delivery applications.

## When to Use

**Use this skill when:**
- Building location-based matching (drivers to orders)
- Calculating distances between coordinates
- Finding nearest points within a radius
- Storing and querying geographic locations
- Optimizing geospatial queries with spatial indexes
- Working with GPS coordinates in logistics apps

**Don't use when:**
- Simple coordinate storage without queries (use plain lat/lng columns)
- Non-geographic spatial data (use GEOMETRY instead of GEOGRAPHY)
- Need complex GIS analysis (use specialized GIS tools)

## Core Patterns

### Pattern 1: Database Schema with PostGIS

Enable PostGIS and create tables with geographic columns:

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drivers table with location tracking
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Vehicle info
  vehicle_plate VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(50) DEFAULT 'MOTORBIKE',
  
  -- Status
  status VARCHAR(20) DEFAULT 'OFFLINE',
  is_approved BOOLEAN DEFAULT false,
  
  -- Location (GEOGRAPHY for Earth-surface calculations)
  last_location GEOGRAPHY(POINT, 4326),
  last_location_updated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GIST index for fast spatial queries
CREATE INDEX idx_drivers_location ON drivers USING GIST(last_location);
CREATE INDEX idx_drivers_status ON drivers(status) WHERE status = 'ACTIVE';
```

### Pattern 2: Update Driver Location

Store driver location with coordinates:

```sql
-- Update driver location
UPDATE drivers 
SET 
  last_location = ST_MakePoint($1, $2)::geography,  -- lng, lat
  last_location_updated_at = NOW()
WHERE id = $3;
```

With Prisma:

```typescript
// schema.prisma
model Driver {
  id                    String    @id @default(uuid())
  userId                String    @unique
  vehiclePlate          String
  vehicleType           String    @default("MOTORBIKE")
  status                String    @default("OFFLINE")
  isApproved            Boolean   @default(false)
  lastLocation          Json?     // { lat: number, lng: number }
  lastLocationUpdatedAt DateTime?
  
  @@index([status])
}

// Raw query for geospatial operations
const updateLocation = async (
  driverId: string, 
  lat: number, 
  lng: number
) => {
  await prisma.$executeRaw`
    UPDATE drivers 
    SET 
      last_location = ST_MakePoint(${lng}, ${lat})::geography,
      last_location_updated_at = NOW()
    WHERE id = ${driverId}
  `;
};
```

### Pattern 3: Find Nearest Drivers

Query for active drivers within radius:

```sql
-- Find nearest active drivers within 5km
SELECT 
  d.id,
  d.user_id,
  u.name,
  u.phone,
  d.vehicle_type,
  d.vehicle_plate,
  ST_Distance(
    d.last_location, 
    ST_MakePoint($1, $2)::geography  -- lng, lat
  ) as distance_meters
FROM drivers d
JOIN users u ON d.user_id = u.id
WHERE d.status = 'ACTIVE'
  AND d.is_approved = true
  AND d.last_location IS NOT NULL
  AND ST_DWithin(
    d.last_location, 
    ST_MakePoint($1, $2)::geography,
    $3  -- radius in meters (default 5000)
  )
ORDER BY d.last_location <-> ST_MakePoint($1, $2)::geography
LIMIT $4;  -- limit (default 5)
```

As reusable function:

```sql
CREATE OR REPLACE FUNCTION find_nearest_drivers(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_meters INTEGER DEFAULT 5000,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  driver_id UUID,
  user_id UUID,
  driver_name VARCHAR,
  phone VARCHAR,
  vehicle_type VARCHAR,
  vehicle_plate VARCHAR,
  distance_meters DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as driver_id,
    d.user_id,
    u.name as driver_name,
    u.phone,
    d.vehicle_type,
    d.vehicle_plate,
    ST_Distance(
      d.last_location, 
      ST_MakePoint(p_lng, p_lat)::geography
    ) as distance_meters
  FROM drivers d
  JOIN users u ON d.user_id = u.id
  WHERE d.status = 'ACTIVE'
    AND d.is_approved = true
    AND d.last_location IS NOT NULL
    AND ST_DWithin(
      d.last_location, 
      ST_MakePoint(p_lng, p_lat)::geography,
      p_radius_meters
    )
  ORDER BY d.last_location <-> ST_MakePoint(p_lng, p_lat)::geography
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

Usage:

```sql
-- Find 10 nearest drivers within 10km
SELECT * FROM find_nearest_drivers(10.7769, 106.7009, 10000, 10);
```

### Pattern 4: Calculate Distance Between Points

Calculate distance between two locations:

```sql
-- Distance between pickup and dropoff
SELECT 
  o.id,
  o.order_number,
  ST_Distance(
    o.pickup_location,
    o.dropoff_location
  ) as distance_meters,
  ST_Distance(
    o.pickup_location,
    o.dropoff_location
  ) / 1000 as distance_km
FROM orders o
WHERE o.id = $1;
```

For pricing calculation:

```sql
-- Calculate price based on distance
SELECT 
  CEIL(
    ST_Distance(
      ST_MakePoint($1, $2)::geography,   -- pickup lng, lat
      ST_MakePoint($3, $4)::geography    -- dropoff lng, lat
    ) / 1000
  ) * (SELECT (value->>'amount')::int FROM system_config WHERE key = 'PRICE_PER_KM')
  + (SELECT (value->>'amount')::int FROM system_config WHERE key = 'BASE_PRICE')
  as estimated_price;
```

### Pattern 5: Check If Driver Is Within Delivery Zone

Verify driver proximity to pickup location:

```sql
-- Check if driver is within 100m of pickup (for arrival confirmation)
SELECT 
  ST_DWithin(
    d.last_location,
    o.pickup_location,
    100  -- meters
  ) as is_at_pickup
FROM drivers d
JOIN orders o ON o.driver_id = d.user_id
WHERE o.id = $1
  AND d.id = $2;
```

### Pattern 6: Store Location History

Track order delivery path:

```sql
CREATE TABLE order_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- BRIN index for time-series data (efficient for large datasets)
CREATE INDEX idx_order_tracking_order_time 
ON order_tracking(order_id, recorded_at DESC);

-- Insert tracking point
INSERT INTO order_tracking (order_id, location)
VALUES (
  $1,
  ST_MakePoint($2, $3)::geography  -- lng, lat
);

-- Get route for order
SELECT 
  ST_X(location::geometry) as lng,
  ST_Y(location::geometry) as lat,
  recorded_at
FROM order_tracking
WHERE order_id = $1
ORDER BY recorded_at ASC;
```

## Quick Reference

| Task | Function | Notes |
|------|----------|-------|
| Create point | `ST_MakePoint(lng, lat)` | lng first, then lat |
| Cast to geography | `::geography` | For Earth-surface calculations |
| Calculate distance | `ST_Distance(geo1, geo2)` | Returns meters |
| Check within radius | `ST_DWithin(geo1, geo2, meters)` | Boolean result |
| Nearest neighbor | `<->` operator | Use with ORDER BY |
| Get coordinates | `ST_X(geo)`, `ST_Y(geo)` | Extract lng/lat |

## Index Types

### GIST Index (for GEOGRAPHY)

```sql
-- Best for: nearest neighbor, distance queries, spatial relationships
CREATE INDEX idx_location ON drivers USING GIST(last_location);
```

### BRIN Index (for time-series)

```sql
-- Best for: large time-series data, naturally ordered
CREATE INDEX idx_tracking_time ON order_tracking 
USING BRIN(recorded_at) 
WITH (pages_per_range = 128);
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Lat/lng order wrong | PostGIS uses `ST_MakePoint(lng, lat)` - longitude first! |
| Using GEOMETRY for GPS | Use GEOGRAPHY for Earth-surface calculations |
| No spatial index | Always create GIST index on GEOGRAPHY columns |
| Distance in wrong units | ST_Distance returns meters for GEOGRAPHY |
| Missing SRID | Use `::geography` with SRID 4326 (WGS84) |

## Prisma Integration

### Schema

```prisma
model Driver {
  id                    String    @id @default(uuid())
  userId                String    @unique
  vehiclePlate          String
  status                String    @default("OFFLINE")
  isApproved            Boolean   @default(false)
  
  // Store as JSON for Prisma compatibility
  lastLocation          Json?
  lastLocationUpdatedAt DateTime?
  
  @@index([status])
}
```

### Repository Pattern

```typescript
// drivers.repository.ts
export class DriversRepository {
  constructor(private prisma: PrismaService) {}

  async updateLocation(driverId: string, lat: number, lng: number) {
    await this.prisma.$executeRaw`
      UPDATE drivers 
      SET 
        last_location = ST_MakePoint(${lng}, ${lat})::geography,
        last_location_updated_at = NOW()
      WHERE id = ${driverId}
    `;
  }

  async findNearest(
    lat: number, 
    lng: number, 
    radiusMeters: number = 5000,
    limit: number = 5
  ) {
    return await this.prisma.$queryRaw`
      SELECT 
        d.id,
        d.user_id as userId,
        u.name,
        u.phone,
        d.vehicle_type as vehicleType,
        d.vehicle_plate as vehiclePlate,
        ST_Distance(
          d.last_location, 
          ST_MakePoint(${lng}, ${lat})::geography
        ) as distanceMeters
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'ACTIVE'
        AND d.is_approved = true
        AND d.last_location IS NOT NULL
        AND ST_DWithin(
          d.last_location, 
          ST_MakePoint(${lng}, ${lat})::geography,
          ${radiusMeters}
        )
      ORDER BY d.last_location <-> ST_MakePoint(${lng}, ${lat})::geography
      LIMIT ${limit}
    `;
  }

  async calculateDistance(
    fromLat: number, 
    fromLng: number,
    toLat: number, 
    toLng: number
  ): Promise<number> {
    const result = await this.prisma.$queryRaw<{ distance: number }[]>`
      SELECT 
        ST_Distance(
          ST_MakePoint(${fromLng}, ${fromLat})::geography,
          ST_MakePoint(${toLng}, ${toLat})::geography
        ) as distance
    `;
    return result[0]?.distance ?? 0;
  }
}
```

## NestJS Service Example

```typescript
// drivers.service.ts
@Injectable()
export class DriversService {
  constructor(private driversRepo: DriversRepository) {}

  async updateLocation(driverId: string, lat: number, lng: number) {
    await this.driversRepo.updateLocation(driverId, lat, lng);
    
    // Broadcast to connected clients via WebSocket
    this.eventsGateway.broadcastDriverLocation(driverId, { lat, lng });
  }

  async findNearestDrivers(
    lat: number, 
    lng: number,
    radiusKm: number = 5
  ) {
    const drivers = await this.driversRepo.findNearest(
      lat, 
      lng, 
      radiusKm * 1000  // Convert to meters
    );
    
    return drivers.map(d => ({
      ...d,
      distanceKm: Math.round(d.distanceMeters / 100) / 10,
    }));
  }
}
```

## Configuration

### Enable PostGIS

```sql
-- Run once after database creation
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify installation
SELECT PostGIS_Version();
```

### Neon Postgres

PostGIS is available on all Neon plans. No additional setup needed.

```bash
# Connection string with SSL
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

## Related Skills

- **sql-optimization-patterns** - Index optimization, query performance
- **nestjs-best-practices** - Repository pattern, service layer
- **redis-patterns** - Caching driver locations
