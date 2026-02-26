# Logship-MVP: Database Design Document

**Version:** 5.0  
**Last Updated:** February 2026  
**Database:** Neon Serverless PostgreSQL 17+  
**Extension:** PostGIS 3.4+  
**ORM:** Prisma 7.4.0

> **⚠️ BREAKING CHANGES (Prisma 7.4.0):** ESM support required, driver adapters mandatory, new `prisma.config.ts` file replaces datasource URL in schema. See [Prisma 7 Migration Guide](#10-prisma-7-migration-guide) below.  

---

## 1. Overview

This document defines the complete database schema for Logship-MVP, a **General Delivery App** that connects customers with drivers for transporting any type of package/item (not limited to food).

### 1.1. Key Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Spatial-First** | All location data uses PostGIS GEOGRAPHY(POINT, 4326) |
| **UUID Primary Keys** | All tables use UUID for distributed scalability |
| **Soft Deletes** | `is_deleted` + `deleted_at` for data preservation |
| **Audit Fields** | `created_at` + `updated_at` on all tables |
| **Timezone Aware** | All timestamps use TIMESTAMPTZ |

### 1.2. PostGIS Configuration

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create application schema
CREATE SCHEMA IF NOT EXISTS delivery;
SET search_path TO delivery, public;
```

---

## 2. Entity Relationship Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     users       │     │     drivers      │     │  driver_locations│
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ id (PK)         │◄────┤ user_id (FK)     │◄────┤ driver_id (FK)  │
│ phone           │     │ vehicle_type     │     │ location (GEO)  │
│ email           │     │ vehicle_plate    │     │ recorded_at     │
│ full_name       │     │ status           │     └─────────────────┘
│ role            │     │ is_approved      │
│ is_active       │     │ current_location │
└─────────────────┘     └──────────────────┘
         │
         │
         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  user_addresses │     │     orders       │     │ order_tracking  │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)          │◄────┤ order_id (FK)   │
│ user_id (FK)    │     │ customer_id (FK) │     │ location (GEO)  │
│ location (GEO)  │     │ driver_id (FK)   │     │ recorded_at     │
│ address_line    │     │ status           │     └─────────────────┘
└─────────────────┘     │ pickup_location  │
                        │ dropoff_location │
                        │ package_details  │
                        └──────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    payments     │     │     messages     │     │  notifications  │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)          │     │ id (PK)         │
│ order_id (FK)   │◄────┤ order_id (FK)    │     │ user_id (FK)    │
│ amount          │     │ sender_id (FK)   │     │ order_id (FK)   │
│ status          │     │ content          │     │ type            │
└─────────────────┘     │ message_type     │     │ is_read         │
                        └──────────────────┘     └─────────────────┘
```

---

## 3. Complete Schema DDL

### 3.1. Enums

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('customer', 'driver', 'admin');

-- Driver status
CREATE TYPE driver_status AS ENUM ('offline', 'online', 'busy', 'inactive');

-- Order status
CREATE TYPE order_status AS ENUM (
  'pending',      -- Created, waiting for driver
  'assigned',     -- Driver accepted
  'picking_up',   -- Driver heading to pickup
  'delivering',   -- Driver has package, delivering
  'completed',    -- Successfully delivered
  'cancelled'     -- Cancelled by customer or admin
);

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Payment method
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'wallet', 'bank_transfer');

-- Message type
CREATE TYPE message_type AS ENUM ('text', 'image', 'system');

-- Notification type
CREATE TYPE notification_type AS ENUM (
  'order_created',
  'driver_assigned', 
  'driver_arrived',
  'order_delivered',
  'order_cancelled',
  'promotion'
);

-- Vehicle type
CREATE TYPE vehicle_type AS ENUM ('motorbike', 'car', 'van', 'truck');

-- Package size category
CREATE TYPE package_size AS ENUM ('small', 'medium', 'large', 'extra_large');
```

### 3.2. Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  firebase_uid VARCHAR(255) UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT check_phone_format CHECK (phone ~ '^\+84[0-9]{9,10}$'),
  CONSTRAINT check_not_deleted_if_active CHECK (NOT is_active OR NOT is_deleted)
);

-- Indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_is_active ON users(is_active) WHERE is_deleted = FALSE;
```

### 3.3. User Addresses Table

```sql
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50), -- 'Home', 'Work', etc.
  address_line TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_user_addresses_location ON user_addresses USING GIST(location);
```

### 3.4. Drivers Table

```sql
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL DEFAULT 'motorbike',
  vehicle_plate VARCHAR(20) NOT NULL,
  vehicle_photo_url TEXT,
  license_number VARCHAR(50),
  license_photo_url TEXT,
  id_card_photo_url TEXT,
  status driver_status NOT NULL DEFAULT 'offline',
  is_approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  current_location GEOGRAPHY(POINT, 4326),
  current_latitude FLOAT,
  current_longitude FLOAT,
  location_updated_at TIMESTAMPTZ,
  rating FLOAT DEFAULT 0,
  total_ratings INT DEFAULT 0,
  total_deliveries INT DEFAULT 0,
  daily_cancellations INT DEFAULT 0,  -- Reset daily
  total_cancellations INT DEFAULT 0,
  last_cancellation_at TIMESTAMPTZ,
  is_locked BOOLEAN DEFAULT FALSE,  -- Locked after 3 cancellations/day
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_rating_range CHECK (rating >= 0 AND rating <= 5)
);

-- Indexes
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_is_approved ON drivers(is_approved);
CREATE INDEX idx_drivers_current_location ON drivers USING GIST(current_location);
CREATE INDEX idx_drivers_location_updated_at ON drivers(location_updated_at);

-- Partial index for active drivers (optimization for matching queries)
CREATE INDEX idx_drivers_active_location 
ON drivers USING GIST(current_location) 
WHERE status = 'online' 
  AND is_approved = TRUE 
  AND current_location IS NOT NULL;
```

### 3.5. Driver Locations History Table

```sql
CREATE TABLE driver_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  accuracy FLOAT,
  heading FLOAT,
  speed FLOAT,
  recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX idx_driver_locations_location ON driver_locations USING GIST(location);
CREATE INDEX idx_driver_locations_recorded_at ON driver_locations(recorded_at DESC);

-- Partition by month for performance (optional, for high volume)
-- CREATE TABLE driver_locations_y2024m01 PARTITION OF driver_locations
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 3.6. Orders Table

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES users(id),
  driver_id UUID REFERENCES drivers(id),
  
  -- Pickup details
  pickup_address TEXT NOT NULL,
  pickup_location GEOGRAPHY(POINT, 4326) NOT NULL,
  pickup_latitude FLOAT NOT NULL,
  pickup_longitude FLOAT NOT NULL,
  pickup_contact_name VARCHAR(255),
  pickup_contact_phone VARCHAR(20),
  
  -- Dropoff details
  dropoff_address TEXT NOT NULL,
  dropoff_location GEOGRAPHY(POINT, 4326) NOT NULL,
  dropoff_latitude FLOAT NOT NULL,
  dropoff_longitude FLOAT NOT NULL,
  dropoff_contact_name VARCHAR(255),
  dropoff_contact_phone VARCHAR(20),
  
  -- Package details (General Delivery - not food specific)
  package_type VARCHAR(100), -- 'Document', 'Electronics', 'Clothing', etc.
  package_description TEXT,
  package_size package_size DEFAULT 'medium',
  package_weight_kg DECIMAL(8, 2), -- Weight in kilograms
  package_dimensions_cm VARCHAR(50), -- '30x20x10' format
  package_photo_url TEXT,
  is_fragile BOOLEAN DEFAULT FALSE,
  requires_signature BOOLEAN DEFAULT FALSE,
  
  -- Order status and timing
  status order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  assigned_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  estimated_delivery_at TIMESTAMPTZ,
  
  -- Pricing (Fixed: 8.000 VND/km)
  distance_km DECIMAL(8, 2),
  price_per_km DECIMAL(10, 2) DEFAULT 8000,  -- 8.000 VND/km fixed
  base_price DECIMAL(10, 2) DEFAULT 0,  -- No base price (simplified)
  distance_price DECIMAL(10, 2) NOT NULL,  -- distance_km × 8000
  surge_multiplier DECIMAL(3, 2) DEFAULT 1.00,  -- 1.20 when expanded radius
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,  -- distance_price × surge_multiplier - discount
  currency VARCHAR(3) DEFAULT 'VND',
  
  -- Platform & Driver Earnings
  platform_fee DECIMAL(10, 2) NOT NULL,  -- total_price × 15%
  driver_earnings DECIMAL(10, 2) NOT NULL,  -- total_price × 85%
  
  -- Cancellation
  cancelled_by UUID REFERENCES users(id),
  cancelled_by_role VARCHAR(20),  -- 'customer', 'driver', 'admin'
  cancellation_reason TEXT,
  cancellation_fee DECIMAL(10, 2) DEFAULT 0,  -- 10% of total if after 5min
  minutes_to_cancel INTEGER,  -- Minutes from order creation to cancellation
  

  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT check_positive_price CHECK (total_price > 0),
  CONSTRAINT check_status_transition CHECK (
    (status = 'pending' AND assigned_at IS NULL) OR
    (status = 'assigned' AND assigned_at IS NOT NULL) OR
    (status = 'picking_up') OR
    (status = 'delivering' AND picked_up_at IS NOT NULL) OR
    (status = 'completed' AND delivered_at IS NOT NULL) OR
    (status = 'cancelled' AND cancelled_at IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_pickup_location ON orders USING GIST(pickup_location);
CREATE INDEX idx_orders_dropoff_location ON orders USING GIST(dropoff_location);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Composite index for driver order queries
CREATE INDEX idx_orders_driver_status ON orders(driver_id, status) 
WHERE driver_id IS NOT NULL;
```

### 3.7. Order Tracking Table

```sql
CREATE TABLE order_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  accuracy FLOAT,
  heading FLOAT,
  speed FLOAT,
  recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX idx_order_tracking_location ON order_tracking USING GIST(location);
CREATE INDEX idx_order_tracking_recorded_at ON order_tracking(recorded_at DESC);
```

### 3.8. Payments Table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES users(id),
  payment_method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'VND',
  transaction_id VARCHAR(255),
  payment_gateway_response JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_positive_amount CHECK (amount > 0)
);

-- Indexes
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
```

### 3.9. Messages Table (Chat)

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text',
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_messages_order_id ON messages(order_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_order_created ON messages(order_id, created_at DESC);
```

### 3.10. Notifications Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_order_id ON notifications(order_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### 3.11. Driver Earnings Table

```sql
CREATE TABLE driver_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  order_id UUID UNIQUE REFERENCES orders(id),
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(50) DEFAULT 'order', -- 'order', 'bonus', 'penalty'
  description TEXT,
  balance_after DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_positive_earning CHECK (amount > 0)
);

-- Indexes
CREATE INDEX idx_driver_earnings_driver_id ON driver_earnings(driver_id);
CREATE INDEX idx_driver_earnings_order_id ON driver_earnings(order_id);
CREATE INDEX idx_driver_earnings_created_at ON driver_earnings(created_at DESC);
```

### 3.12. System Config Table

```sql
CREATE TABLE system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Default pricing config
INSERT INTO system_config (config_key, config_value, description) VALUES
('pricing_per_km', '{"amount": 8000, "currency": "VND"}', 'Fixed price per kilometer - 8.000 VND/km'),
('platform_fee_percent', '{"percent": 15}', 'Platform fee percentage (15%)'),
('cancellation_fee_percent', '{"percent": 10}', 'Cancellation fee after 5 minutes (10%)'),
('cancellation_free_minutes', '{"minutes": 5}', 'Free cancellation window (5 minutes)'),
('driver_matching_radius', '{"initial_km": 3, "max_km": 7}', 'Driver search radius settings'),
('driver_matching_timeout', '{"minutes": 5}', 'Driver matching timeout (5 minutes)'),
('location_update_interval', '{"seconds": 30}', 'Driver location update interval (30 seconds)'),
('location_adaptive_distance', '{"meters": 500}', 'Distance to trigger adaptive tracking (500m)'),
('location_adaptive_interval', '{"seconds": 10}', 'Adaptive tracking interval when near destination (10 seconds)'),
('max_order_distance', '{"km": 25}', 'Maximum order distance (25km)'),
('driver_daily_cancellation_limit', '{"count": 3}', 'Max driver cancellations per day (3)'),
('driver_cancellation_penalty', '{"rating_points": -10}', 'Rating penalty per cancellation (-10 points)'),
('surge_pricing_expansion', '{"percent": 20}', 'Surge pricing when expanding radius (20%)');

-- Insert pricing examples
INSERT INTO system_config (config_key, config_value, description) VALUES
('pricing_examples', '{"examples": [
  {"distance_km": 3, "total": 24000, "platform_fee": 3600, "driver_earnings": 20400},
  {"distance_km": 10, "total": 80000, "platform_fee": 12000, "driver_earnings": 68000},
  {"distance_km": 20, "total": 160000, "platform_fee": 24000, "driver_earnings": 136000},
  {"distance_km": 25, "total": 200000, "platform_fee": 30000, "driver_earnings": 170000}
]}', 'Pricing examples for reference');
```

---

## 4. Prisma Schema (Prisma 7.4.0)

> **⚠️ BREAKING CHANGES:** Prisma 7.4.0 requires:
> - `output` path in generator block
> - Removal of `url` from datasource (moved to `prisma.config.ts`)
> - Driver adapter for database connections

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider   = "postgresql"
  extensions = [postgis]
}
```

### 4.1. Prisma Configuration File (New in 7.4.0)

> **⚠️ NEW REQUIREMENT:** Prisma 7.4.0 requires `prisma.config.ts` file.

```typescript
// prisma.config.ts
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

### 4.2. PrismaClient with Driver Adapter

> **⚠️ BREAKING CHANGE:** Prisma 7 requires driver adapters.

```typescript
// prisma/client.ts
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });
```

**Required dependency:**
```bash
bun add @prisma/adapter-pg
```

// Enums
enum UserRole {
  customer
  driver
  admin
}

enum DriverStatus {
  offline
  online
  busy
  inactive
}

enum OrderStatus {
  pending
  assigned
  picking_up
  delivering
  completed
  cancelled
}

enum PaymentStatus {
  pending
  completed
  failed
  refunded
}

enum PaymentMethod {
  cash
  card
  wallet
  bank_transfer
}

enum MessageType {
  text
  image
  system
}

enum NotificationType {
  order_created
  driver_assigned
  driver_arrived
  order_delivered
  order_cancelled
  promotion
}

enum VehicleType {
  motorbike
  car
  van
  truck
}

enum PackageSize {
  small
  medium
  large
  extra_large
}

// Models
model User {
  id            String    @id @default(uuid())
  phone         String    @unique
  email         String?   @unique
  fullName      String?
  avatarUrl     String?
  role          UserRole  @default(customer)
  firebaseUid   String?   @unique
  isVerified    Boolean   @default(false)
  isActive      Boolean   @default(true)
  isDeleted     Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  // Relations
  addresses     UserAddress[]
  driver        Driver?
  orders        Order[]       @relation("CustomerOrders")
  messages      Message[]
  notifications Notification[]
  payments      Payment[]

  @@index([phone])
  @@index([role])
  @@index([isActive])
  @@map("users")
}

model UserAddress {
  id           String   @id @default(uuid())
  userId       String
  label        String?
  addressLine  String
  // PostGIS geography type - use raw SQL for spatial queries
  location     Unsupported("geography(Point, 4326)")
  latitude     Float
  longitude    Float
  isDefault    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([location], type: Gist)
  @@map("user_addresses")
}

model Driver {
  id                String       @id @default(uuid())
  userId            String       @unique
  vehicleType       VehicleType  @default(motorbike)
  vehiclePlate      String
  vehiclePhotoUrl   String?
  licenseNumber     String?
  licensePhotoUrl   String?
  idCardPhotoUrl    String?
  status            DriverStatus @default(offline)
  isApproved        Boolean      @default(false)
  approvedAt        DateTime?
  currentLocation   Unsupported("geography(Point, 4326)")?
  currentLatitude   Float?
  currentLongitude  Float?
  locationUpdatedAt DateTime?
  rating            Float        @default(0)
  totalRatings      Int          @default(0)
  totalDeliveries   Int          @default(0)
  dailyCancellations  Int        @default(0)
  totalCancellations  Int        @default(0)
  isLocked          Boolean      @default(false)
  lockedUntil       DateTime?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  // Relations
  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders           Order[]
  locations        DriverLocation[]
  earnings         DriverEarning[]

  @@index([userId])
  @@index([status])
  @@index([isApproved])
  @@index([currentLocation], type: Gist)
  @@map("drivers")
}

model DriverLocation {
  id         String   @id @default(uuid())
  driverId   String
  location   Unsupported("geography(Point, 4326)")
  latitude   Float
  longitude  Float
  accuracy   Float?
  heading    Float?
  speed      Float?
  recordedAt DateTime @default(now())

  driver     Driver   @relation(fields: [driverId], references: [id], onDelete: Cascade)

  @@index([driverId])
  @@index([location], type: Gist)
  @@index([recordedAt])
  @@map("driver_locations")
}

model Order {
  id                      String      @id @default(uuid())
  orderNumber             String      @unique
  customerId              String
  driverId                String?
  
  // Pickup
  pickupAddress           String
  pickupLocation          Unsupported("geography(Point, 4326)")
  pickupLatitude          Float
  pickupLongitude         Float
  pickupContactName       String?
  pickupContactPhone      String?
  
  // Dropoff
  dropoffAddress          String
  dropoffLocation         Unsupported("geography(Point, 4326)")
  dropoffLatitude         Float
  dropoffLongitude        Float
  dropoffContactName      String?
  dropoffContactPhone     String?
  
  // Package details
  packageType             String?
  packageDescription      String?
  packageSize             PackageSize @default(medium)
  packageWeightKg         Decimal?    @db.Decimal(8, 2)
  packageDimensionsCm     String?
  packagePhotoUrl         String?
  isFragile               Boolean     @default(false)
  requiresSignature       Boolean     @default(false)
  
  // Status
  status                  OrderStatus @default(pending)
  createdAt               DateTime    @default(now())
  updatedAt               DateTime    @updatedAt
  assignedAt              DateTime?
  pickedUpAt              DateTime?
  deliveredAt             DateTime?
  cancelledAt             DateTime?
  estimatedDeliveryAt     DateTime?
  
  // Pricing
  distanceKm              Decimal?    @db.Decimal(8, 2)
  basePrice               Decimal     @db.Decimal(10, 2)
  distancePrice           Decimal     @db.Decimal(10, 2)
  weightPrice             Decimal     @default(0) @db.Decimal(10, 2)
  platformFee             Decimal     @default(0) @db.Decimal(10, 2)
  pricePerKm              Decimal?    @db.Decimal(6, 0)
  surgeMultiplier         Decimal     @default(1.00) @db.Decimal(3, 2)
  discountAmount          Decimal     @default(0) @db.Decimal(10, 2)
  totalPrice              Decimal     @db.Decimal(10, 2)
  currency                String      @default("VND")
  
  // Cancellation
  cancelledBy             String?
  cancelledByRole         String?     // 'customer' | 'driver' | 'admin'
  cancellationReason      String?
  cancellationFee         Decimal     @default(0) @db.Decimal(10, 2)
  minutesToCancel         Int?        // minutes elapsed before cancellation
  
  // Driver earnings
  driverEarnings          Decimal?    @db.Decimal(10, 2)
  
  // Soft delete
  isDeleted               Boolean     @default(false)
  deletedAt               DateTime?

  // Relations
  customer        User              @relation("CustomerOrders", fields: [customerId], references: [id])
  driver          Driver?           @relation(fields: [driverId], references: [id])
  payment         Payment?
  messages        Message[]
  tracking        OrderTracking[]
  earnings        DriverEarning?

  @@index([customerId])
  @@index([driverId])
  @@index([status])
  @@index([createdAt])
  @@index([pickupLocation], type: Gist)
  @@index([dropoffLocation], type: Gist)
  @@map("orders")
}

model OrderTracking {
  id         String   @id @default(uuid())
  orderId    String
  driverId   String
  location   Unsupported("geography(Point, 4326)")
  latitude   Float
  longitude  Float
  accuracy   Float?
  heading    Float?
  speed      Float?
  recordedAt DateTime @default(now())

  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@index([location], type: Gist)
  @@index([recordedAt])
  @@map("order_tracking")
}

model Payment {
  id                    String        @id @default(uuid())
  orderId               String        @unique
  customerId            String
  paymentMethod         PaymentMethod
  status                PaymentStatus @default(pending)
  amount                Decimal       @db.Decimal(10, 2)
  currency              String        @default("VND")
  transactionId         String?
  paymentGatewayResponse Json?
  paidAt                DateTime?
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  order                 Order         @relation(fields: [orderId], references: [id])
  customer              User          @relation(fields: [customerId], references: [id])

  @@index([orderId])
  @@index([customerId])
  @@index([status])
  @@map("payments")
}

model Message {
  id          String      @id @default(uuid())
  orderId     String
  senderId    String
  content     String
  messageType MessageType @default(text)
  mediaUrl    String?
  isRead      Boolean     @default(false)
  readAt      DateTime?
  createdAt   DateTime    @default(now())

  order       Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  sender      User        @relation(fields: [senderId], references: [id])

  @@index([orderId])
  @@index([senderId])
  @@index([createdAt])
  @@map("messages")
}

model Notification {
  id        String           @id @default(uuid())
  userId    String
  orderId   String?
  type      NotificationType
  title     String
  body      String
  data      Json?
  isRead    Boolean          @default(false)
  readAt    DateTime?
  sentAt    DateTime         @default(now())
  createdAt DateTime         @default(now())

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  order     Order?           @relation(fields: [orderId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([orderId])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}

model DriverEarning {
  id            String   @id @default(uuid())
  driverId      String
  orderId       String?  @unique
  amount        Decimal  @db.Decimal(10, 2)
  type          String   @default("order")
  description   String?
  balanceAfter  Decimal  @db.Decimal(10, 2)
  createdAt     DateTime @default(now())

  driver        Driver   @relation(fields: [driverId], references: [id], onDelete: Cascade)
  order         Order?   @relation(fields: [orderId], references: [id])

  @@index([driverId])
  @@index([orderId])
  @@index([createdAt])
  @@map("driver_earnings")
}

model SystemConfig {
  id          String   @id @default(uuid())
  configKey   String   @unique
  configValue Json
  description String?
  updatedBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([configKey])
  @@map("system_config")
}
```

---

## 5. Geospatial Queries

### 5.1. Find Nearest Available Drivers (KNN Query)

```sql
-- Find nearest active drivers within radius
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
  distance_meters DOUBLE PRECISION,
  estimated_arrival_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as driver_id,
    d.user_id,
    u.full_name as driver_name,
    u.phone,
    d.vehicle_type::text,
    ST_Distance(
      d.current_location, 
      ST_MakePoint(p_lng, p_lat)::geography
    )::DOUBLE PRECISION as distance_meters,
    CEIL(
      ST_Distance(
        d.current_location, 
        ST_MakePoint(p_lng, p_lat)::geography
      ) / 300.0
    )::INTEGER as estimated_arrival_minutes
  FROM drivers d
  JOIN users u ON d.user_id = u.id
  WHERE d.status = 'online'
    AND d.is_approved = true
    AND d.current_location IS NOT NULL
    AND d.location_updated_at > NOW() - INTERVAL '5 minutes'
    AND ST_DWithin(
      d.current_location, 
      ST_MakePoint(p_lng, p_lat)::geography,
      p_radius_meters
    )
  ORDER BY d.current_location <-> ST_MakePoint(p_lng, p_lat)::geography
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Usage:
-- SELECT * FROM find_nearest_drivers(10.762622, 106.660172, 5000, 5);
```

### 5.2. Calculate Distance Between Two Points

```sql
-- Calculate distance between pickup and dropoff
CREATE OR REPLACE FUNCTION calculate_order_distance(
  p_pickup_lat DOUBLE PRECISION,
  p_pickup_lng DOUBLE PRECISION,
  p_dropoff_lat DOUBLE PRECISION,
  p_dropoff_lng DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  v_distance_meters DOUBLE PRECISION;
BEGIN
  SELECT ST_Distance(
    ST_MakePoint(p_pickup_lng, p_pickup_lat)::geography,
    ST_MakePoint(p_dropoff_lng, p_dropoff_lat)::geography
  ) INTO v_distance_meters;
  
  RETURN v_distance_meters;
END;
$$ LANGUAGE plpgsql;
```

### 5.3. Get Drivers Within Bounding Box

```sql
-- Find drivers within a map viewport (for admin dashboard)
CREATE OR REPLACE FUNCTION get_drivers_in_viewport(
  p_min_lat DOUBLE PRECISION,
  p_min_lng DOUBLE PRECISION,
  p_max_lat DOUBLE PRECISION,
  p_max_lng DOUBLE PRECISION
)
RETURNS TABLE (
  driver_id UUID,
  status VARCHAR,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.status::text,
    d.current_latitude,
    d.current_longitude
  FROM drivers d
  WHERE d.current_location IS NOT NULL
    AND d.current_latitude BETWEEN p_min_lat AND p_max_lat
    AND d.current_longitude BETWEEN p_min_lng AND p_max_lng
    AND d.location_updated_at > NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Indexes Summary

| Table | Index Name | Type | Columns | Purpose |
|-------|-----------|------|---------|---------|
| users | idx_users_phone | B-tree | phone | Fast lookup by phone |
| users | idx_users_role | B-tree | role | Filter by role |
| drivers | idx_drivers_status | B-tree | status | Filter by status |
| drivers | idx_drivers_active_location | GiST | current_location | Spatial query for active drivers |
| orders | idx_orders_status | B-tree | status | Filter orders by status |
| orders | idx_orders_pickup_location | GiST | pickup_location | Spatial search |
| orders | idx_orders_dropoff_location | GiST | dropoff_location | Spatial search |
| driver_locations | idx_driver_locations_location | GiST | location | Spatial history queries |
| messages | idx_messages_order_created | B-tree | order_id, created_at | Chat history |

---

## 7. Data Retention & Archival

### 7.1. Driver Location History

```sql
-- Archive locations older than 30 days
-- Run as a scheduled job (pg_cron or external scheduler)

-- Move to archive table
INSERT INTO driver_locations_archive
SELECT * FROM driver_locations
WHERE recorded_at < NOW() - INTERVAL '30 days';

-- Delete from main table
DELETE FROM driver_locations
WHERE recorded_at < NOW() - INTERVAL '30 days';
```

### 7.2. Order Tracking History

```sql
-- Keep only last 100 tracking points per order for active orders
-- Archive all tracking for completed orders after 7 days
```

---

## 8. Migration Strategy

### 8.1. Initial Migration

```sql
-- Run extensions first
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema
CREATE SCHEMA IF NOT EXISTS delivery;

-- Run DDL in order:
-- 1. Enums
-- 2. users
-- 3. user_addresses
-- 4. drivers
-- 5. driver_locations
-- 6. orders
-- 7. order_tracking
-- 8. payments
-- 9. messages
-- 10. notifications
-- 11. driver_earnings
-- 12. system_config

-- Create indexes
-- Create functions
-- Seed system_config
```

### 8.2. Prisma Migration (Prisma 7.4.0)

```bash
# Generate migration
bunx prisma migrate dev --name init_general_delivery

# Apply to production
bunx prisma migrate deploy

# Generate Prisma Client
bunx prisma generate
```

> **⚠️ NOTE:** Prisma 7.4.0 does NOT automatically run seed during migrations. Run seed manually:
```bash
bunx prisma db seed
```

**Seed script configuration in package.json:**
```json
{
  "prisma": {
    "seed": "bunx ts-node prisma/seed.ts"
  }
}
```

---

## 9. Prisma 7 Migration Guide

### Breaking Changes Summary

| Feature | Old (Prisma 6.x) | New (Prisma 7.4.0) |
|---------|------------------|---------------------|
| Module System | CommonJS | ESM ("type": "module") |
| Generator | `prisma-client-js` | `prisma-client` |
| Output Path | Optional | Required |
| Datasource URL | In schema.prisma | In prisma.config.ts |
| Client Import | `@prisma/client` | Generated path |
| Connection | Direct | Driver adapter required |
| Auto Seed | During migration | Manual only |
| Env Loading | Automatic | Use dotenv |

### Migration Checklist

- [ ] Add `"type": "module"` to package.json
- [ ] Update generator block:
  - Change `provider = "prisma-client-js"` to `provider = "prisma-client"`
  - Add `output = "../generated/prisma"`
- [ ] Update datasource block:
  - Remove `url = env("DATABASE_URL")`
- [ ] Create `prisma.config.ts` file with datasource URL
- [ ] Install driver adapter: `bun add @prisma/adapter-pg`
- [ ] Update PrismaClient instantiation with adapter
- [ ] Update all imports from `@prisma/client` to generated path
- [ ] Add `import 'dotenv/config'` to entry points
- [ ] Update seed script configuration (no auto-seed)

### Before/After Examples

#### Schema

**Before:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**After:**
```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

#### Configuration File

**New file: prisma.config.ts**
```typescript
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

#### Client Instantiation

**Before:**
```typescript
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
```

**After:**
```typescript
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });
```

#### package.json

**Before:**
```json
{
  "name": "@logship/api",
  "scripts": {
    "db:seed": "bunx ts-node prisma/seed.ts"
  }
}
```

**After:**
```json
{
  "name": "@logship/api",
  "type": "module",
  "scripts": {
    "db:seed": "bunx ts-node prisma/seed.ts"
  },
  "prisma": {
    "seed": "bunx ts-node prisma/seed.ts"
  }
}
```

---

## 10. Related Documents

| Document | Description |
|----------|-------------|
| [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md) | Complete tech stack |
| [01-SDD-System-Design-Document.md](./01-SDD-System-Design-Document.md) | System architecture |
| [03-API-Design-Document.md](./03-API-Design-Document.md) | API endpoints |
| [07-Backend-Architecture.md](./07-Backend-Architecture.md) | Backend implementation |

---

**END OF DOCUMENT**
