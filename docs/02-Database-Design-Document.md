# Logship-MVP: Database Design Document

**Version:** 3.0  
**Last Updated:** February 2025  
**Database:** Neon Serverless Postgres 17 + PostGIS  

---

## 1. Overview

This document defines the database schema for Logship-MVP using **Neon** (serverless PostgreSQL) with **PostGIS** extension for geospatial operations.

### 1.1. Why Neon?

| Feature | Benefit |
|---------|---------|
| Serverless | Scale-to-zero, pay only when used |
| Free Tier | 0.5 GB storage, 190 compute hours/month |
| PostGIS Support | Built-in, just enable extension |
| Branching | Database branches for dev/staging |
| Connection Pooling | Built-in via pooler endpoint |

### 1.2. Connection Configuration

```typescript
// .env
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

// For connection pooling (recommended for serverless)
DATABASE_URL_POOLED="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
```

---

## 2. Schema Initialization

### 2.1. Enable Extensions

```sql
-- Enable PostGIS for geographic operations
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search (optional)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 2.2. Create Custom Types (ENUMs)

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('USER', 'DRIVER', 'ADMIN');

-- Driver status
CREATE TYPE driver_status AS ENUM ('ACTIVE', 'OFFLINE', 'ON_TRIP');

-- Order status
CREATE TYPE order_status AS ENUM (
  'PENDING',
  'ASSIGNED',
  'PICKING_UP',
  'DELIVERING',
  'COMPLETED',
  'CANCELLED'
);

-- Message type
CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE');
```

---

## 3. Table Definitions

### 3.1. Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Authentication
  phone VARCHAR(15) NOT NULL UNIQUE,
  firebase_uid VARCHAR(128) UNIQUE,
  
  -- Profile
  name VARCHAR(100),
  avatar_url VARCHAR(500),
  role user_role NOT NULL DEFAULT 'USER',
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_role ON users(role);
```

### 3.2. Drivers Table

```sql
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Vehicle info
  vehicle_plate VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(50) DEFAULT 'MOTORBIKE',
  vehicle_photo_url VARCHAR(500),
  
  -- Documents
  id_card_url VARCHAR(500),
  driver_license_url VARCHAR(500),
  
  -- Status
  status driver_status DEFAULT 'OFFLINE',
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  
  -- Location (GEOGRAPHY for accurate Earth-surface calculations)
  last_location GEOGRAPHY(POINT, 4326),
  last_location_updated_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GIST index for fast nearest-neighbor queries
CREATE INDEX idx_drivers_location ON drivers USING GIST(last_location);
CREATE INDEX idx_drivers_status ON drivers(status) WHERE status = 'ACTIVE';
CREATE INDEX idx_drivers_user_id ON drivers(user_id);

-- Optimized index for driver matching (critical for performance)
CREATE INDEX idx_drivers_active_location ON drivers USING GIST(last_location) 
  WHERE status = 'ACTIVE' AND is_approved = true AND last_location IS NOT NULL;

-- Index for driver approval queries
CREATE INDEX idx_drivers_approval ON drivers(is_approved, created_at DESC) 
  WHERE is_approved = false;
```

### 3.3. Addresses Table (User's saved addresses)

```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Address details
  label VARCHAR(50) DEFAULT 'Home', -- Home, Work, etc.
  address_line VARCHAR(500) NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  
  -- Metadata
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
```

### 3.4. Orders Table

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Order number (human readable)
  order_number VARCHAR(20) UNIQUE NOT NULL,
  
  -- Participants
  user_id UUID NOT NULL REFERENCES users(id),
  driver_id UUID REFERENCES users(id),
  
  -- Pickup location
  pickup_address VARCHAR(500) NOT NULL,
  pickup_location GEOGRAPHY(POINT, 4326) NOT NULL,
  pickup_contact_name VARCHAR(100),
  pickup_contact_phone VARCHAR(15),
  
  -- Dropoff location
  dropoff_address VARCHAR(500) NOT NULL,
  dropoff_location GEOGRAPHY(POINT, 4326) NOT NULL,
  dropoff_contact_name VARCHAR(100),
  dropoff_contact_phone VARCHAR(15),
  
  -- Package details
  package_description TEXT,
  package_weight_kg DECIMAL(5,2),
  
  -- Status
  status order_status DEFAULT 'PENDING',
  
  -- Pricing
  distance_km DECIMAL(6,2),
  price DECIMAL(10,2),
  
  -- Proof of delivery
  proof_image_url VARCHAR(500),
  delivery_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason VARCHAR(500)
);

-- Indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_pickup_location ON orders USING GIST(pickup_location);

-- Composite index for common queries
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);

-- Additional optimized indexes
CREATE INDEX idx_orders_user_status ON orders(user_id, status, created_at DESC);
CREATE INDEX idx_orders_driver_status ON orders(driver_id, status) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_orders_pending ON orders(created_at) WHERE status = 'PENDING';

-- Covering index for order list queries
CREATE INDEX idx_orders_list ON orders(user_id, status, created_at DESC) 
  INCLUDE (order_number, pickup_address, dropoff_address, price);
```

### 3.5. Order Tracking Table (Location history)

```sql
CREATE TABLE order_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Location
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  
  -- Metadata
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Use BRIN index for time-series data (more efficient for large datasets)
CREATE INDEX idx_order_tracking_order_time ON order_tracking(order_id, recorded_at DESC);
```

### 3.6. Messages Table

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Sender
  sender_id UUID NOT NULL REFERENCES users(id),
  
  -- Content
  content TEXT NOT NULL,
  type message_type DEFAULT 'TEXT',
  image_url VARCHAR(500), -- If type = IMAGE
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_order_id ON messages(order_id, created_at);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
```

### 3.7. Notifications Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  data JSONB, -- Additional payload
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) 
  WHERE is_read = false;
```

### 3.8. System Config Table

```sql
CREATE TABLE system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Seed default config
INSERT INTO system_config (key, value, description) VALUES
  ('PRICE_PER_KM', '{"amount": 5000, "currency": "VND"}', 'Price per kilometer'),
  ('BASE_PRICE', '{"amount": 10000, "currency": "VND"}', 'Base price for all orders'),
  ('MAX_MATCHING_RADIUS_KM', '{"value": 5}', 'Maximum radius to search for drivers'),
  ('DRIVER_LOCATION_UPDATE_INTERVAL_MS', '{"value": 5000}', 'How often driver sends location');
```

### 3.9. Order Status History Table (Audit Trail)

```sql
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  previous_status order_status,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  metadata JSONB -- Additional context (driver location, reason, etc.)
);

-- Indexes for audit queries
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id, changed_at DESC);
CREATE INDEX idx_order_status_history_changed_at ON order_status_history(changed_at DESC);
```

### 3.10. Driver Earnings Table

```sql
CREATE TABLE driver_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(user_id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('ORDER', 'BONUS', 'PENALTY', 'WITHDRAWAL')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  description TEXT,
  balance_after DECIMAL(10,2), -- Running balance after this transaction
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for earnings queries
CREATE INDEX idx_driver_earnings_driver_id ON driver_earnings(driver_id, created_at DESC);
CREATE INDEX idx_driver_earnings_type_status ON driver_earnings(driver_id, type, status) WHERE status = 'PENDING';
CREATE INDEX idx_driver_earnings_created_at ON driver_earnings(created_at DESC);
```

### 3.11. Payment Records Table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('COD', 'BANK_TRANSFER', 'WALLET', 'CARD')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  transaction_id VARCHAR(100), -- External transaction ID from payment provider
  paid_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata JSONB, -- Payment provider response, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for payment queries
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_user_id ON payments(user_id, created_at DESC);
CREATE INDEX idx_payments_status ON payments(status) WHERE status IN ('PENDING', 'PROCESSING');
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id) WHERE transaction_id IS NOT NULL;
```

### 3.12. Webhook Events Table

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DELIVERED', 'FAILED')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for webhook processing
CREATE INDEX idx_webhook_events_status_created ON webhook_events(status, created_at) WHERE status = 'PENDING';
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type, created_at DESC);
```

### 3.13. Data Integrity Constraints

```sql
-- Orders table constraints
ALTER TABLE orders 
ADD CONSTRAINT chk_orders_price_positive CHECK (price > 0),
ADD CONSTRAINT chk_orders_distance_positive CHECK (distance_km > 0),
ADD CONSTRAINT chk_orders_weight_positive CHECK (package_weight_kg IS NULL OR package_weight_kg > 0);

-- Drivers table constraints
ALTER TABLE drivers 
ADD CONSTRAINT chk_drivers_vehicle_plate CHECK (vehicle_plate ~ '^[0-9]{2}[A-Z][0-9]-[0-9]{4,5}$');

-- Users table constraints
ALTER TABLE users 
ADD CONSTRAINT chk_users_phone CHECK (phone ~ '^\+84[0-9]{9,10}$');

-- Soft delete columns (add to main tables)
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE drivers ADD COLUMN deleted_at TIMESTAMPTZ;

-- Indexes for soft deleted records
CREATE INDEX idx_users_active ON users(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_active ON orders(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_drivers_active ON drivers(id) WHERE deleted_at IS NULL;
```

---

## 4. Database Functions

### 4.1. Generate Order Number

```sql
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
    LPAD(NEXTVAL('order_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE order_number_seq START 1;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();
```

### 4.2. Update Timestamp Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 4.3. Find Nearest Drivers Function

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

### 4.4. Calculate Order Price Function

```sql
CREATE OR REPLACE FUNCTION calculate_order_price(
  p_pickup_location GEOGRAPHY,
  p_dropoff_location GEOGRAPHY
)
RETURNS TABLE (
  distance_km DECIMAL,
  price DECIMAL
) AS $$
DECLARE
  v_distance_km DECIMAL;
  v_base_price DECIMAL;
  v_price_per_km DECIMAL;
BEGIN
  -- Calculate distance
  v_distance_km := ST_Distance(p_pickup_location, p_dropoff_location) / 1000;
  
  -- Get pricing config
  SELECT (value->>'amount')::DECIMAL INTO v_base_price 
  FROM system_config WHERE key = 'BASE_PRICE';
  
  SELECT (value->>'amount')::DECIMAL INTO v_price_per_km 
  FROM system_config WHERE key = 'PRICE_PER_KM';
  
  -- Calculate price
  RETURN QUERY SELECT 
    ROUND(v_distance_km, 2),
    ROUND(v_base_price + (v_distance_km * v_price_per_km), 0);
END;
$$ LANGUAGE plpgsql;
```

### 4.5. Order Status History Trigger

```sql
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (
      order_id,
      status,
      previous_status,
      changed_at
    ) VALUES (
      NEW.id,
      NEW.status,
      OLD.status,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_status_history
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();
```

### 4.6. Driver Earnings Calculation Function

```sql
CREATE OR REPLACE FUNCTION calculate_driver_earnings(
  p_driver_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  total_orders BIGINT,
  total_earnings DECIMAL,
  total_bonus DECIMAL,
  total_penalty DECIMAL,
  net_earnings DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE type = 'ORDER') as total_orders,
    COALESCE(SUM(amount) FILTER (WHERE type = 'ORDER'), 0) as total_earnings,
    COALESCE(SUM(amount) FILTER (WHERE type = 'BONUS'), 0) as total_bonus,
    COALESCE(SUM(amount) FILTER (WHERE type = 'PENALTY'), 0) as total_penalty,
    COALESCE(SUM(amount), 0) as net_earnings
  FROM driver_earnings
  WHERE driver_id = p_driver_id
    AND created_at BETWEEN p_start_date AND p_end_date
    AND status = 'COMPLETED';
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Materialized Views for Analytics

### 5.1. Daily Order Statistics

```sql
CREATE MATERIALIZED VIEW daily_order_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_orders,
  COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_orders,
  SUM(price) FILTER (WHERE status = 'COMPLETED') as total_revenue,
  AVG(price) FILTER (WHERE status = 'COMPLETED') as avg_order_value,
  AVG(EXTRACT(EPOCH FROM (delivered_at - created_at))/60) 
    FILTER (WHERE status = 'COMPLETED') as avg_delivery_time_minutes
FROM orders
GROUP BY DATE(created_at);

CREATE UNIQUE INDEX idx_daily_stats_date ON daily_order_stats(date);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_daily_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_order_stats;
END;
$$ LANGUAGE plpgsql;
```

### 5.2. Driver Performance Summary

```sql
CREATE MATERIALIZED VIEW driver_performance_summary AS
SELECT 
  d.user_id as driver_id,
  u.name as driver_name,
  COUNT(o.id) FILTER (WHERE o.status = 'COMPLETED') as total_completed_orders,
  COUNT(o.id) FILTER (WHERE o.status = 'CANCELLED') as total_cancelled_orders,
  AVG(EXTRACT(EPOCH FROM (o.delivered_at - o.assigned_at))/60) 
    FILTER (WHERE o.status = 'COMPLETED') as avg_delivery_time_minutes,
  AVG(r.rating) as avg_rating,
  d.status as current_status
FROM drivers d
JOIN users u ON d.user_id = u.id
LEFT JOIN orders o ON o.driver_id = d.user_id
LEFT JOIN driver_ratings r ON r.driver_id = d.user_id
GROUP BY d.user_id, u.name, d.status;

CREATE UNIQUE INDEX idx_driver_performance_driver_id ON driver_performance_summary(driver_id);
```

---

## 6. Redis Data Structures

For real-time operations, we use Redis alongside PostgreSQL:

### 5.1. Driver Locations (Geo)

```redis
# Store driver location for fast geo queries
GEOADD driver:locations <lng> <lat> <driver_id>

# Find drivers within 5km radius
GEORADIUS driver:locations <lng> <lat> 5 km WITHDIST COUNT 10 ASC

# Update frequently (every 5s from driver app)
# TTL: 5 minutes (auto-remove inactive drivers)
```

### 5.2. Active Orders

```redis
# Track active orders by driver
HSET driver:active_orders:<driver_id> order_id <order_id> status <status>

# Track which users are subscribed to order updates
SADD order:subscribers:<order_id> <user_id> <driver_id> <admin_socket_id>
```

### 5.3. Chat Rooms

```redis
# Track who's in a chat room
SADD chat:room:<order_id>:members <user_id>
SADD chat:room:<order_id>:sockets <socket_id>

# Typing indicator (short TTL)
SETEX chat:typing:<order_id>:<user_id> 3 "1"
```

### 5.4. Rate Limiting

```redis
# Rate limit by user
INCR rate_limit:<user_id>:<endpoint>
EXPIRE rate_limit:<user_id>:<endpoint> 60
```

---

## 7. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis, uuid_ossp(map: "uuid-ossp")]
}

enum UserRole {
  USER
  DRIVER
  ADMIN
}

enum DriverStatus {
  ACTIVE
  OFFLINE
  ON_TRIP
}

enum OrderStatus {
  PENDING
  ASSIGNED
  PICKING_UP
  DELIVERING
  COMPLETED
  CANCELLED
}

enum MessageType {
  TEXT
  IMAGE
}

model User {
  id          String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  phone       String   @unique @db.VarChar(15)
  firebaseUid String?  @unique @map("firebase_uid") @db.VarChar(128)
  name        String?  @db.VarChar(100)
  avatarUrl   String?  @map("avatar_url") @db.VarChar(500)
  role        UserRole @default(USER)
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  driver           Driver?
  addresses        Address[]
  ordersAsUser     Order[]        @relation("UserOrders")
  ordersAsDriver   Order[]        @relation("DriverOrders")
  messagesSent     Message[]
  notifications    Notification[]
  approvedDrivers  Driver[]       @relation("ApprovedBy")

  @@index([phone])
  @@index([firebaseUid])
  @@index([role])
  @@map("users")
}

model Driver {
  id                    String       @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId                String       @unique @map("user_id") @db.Uuid
  vehiclePlate          String       @map("vehicle_plate") @db.VarChar(20)
  vehicleType           String       @default("MOTORBIKE") @map("vehicle_type") @db.VarChar(50)
  vehiclePhotoUrl       String?      @map("vehicle_photo_url") @db.VarChar(500)
  idCardUrl             String?      @map("id_card_url") @db.VarChar(500)
  driverLicenseUrl      String?      @map("driver_license_url") @db.VarChar(500)
  status                DriverStatus @default(OFFLINE)
  isApproved            Boolean      @default(false) @map("is_approved")
  approvedAt            DateTime?    @map("approved_at") @db.Timestamptz
  approvedById          String?      @map("approved_by") @db.Uuid
  lastLocationUpdatedAt DateTime?    @map("last_location_updated_at") @db.Timestamptz
  createdAt             DateTime     @default(now()) @map("created_at") @db.Timestamptz
  updatedAt             DateTime     @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  // Note: last_location is GEOGRAPHY type, handled via raw queries
  // Prisma doesn't natively support PostGIS, use $queryRaw for geo operations

  user       User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  approvedBy User? @relation("ApprovedBy", fields: [approvedById], references: [id])

  @@index([userId])
  @@map("drivers")
}

model Address {
  id          String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  label       String   @default("Home") @db.VarChar(50)
  addressLine String   @map("address_line") @db.VarChar(500)
  isDefault   Boolean  @default(false) @map("is_default")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  // Note: location is GEOGRAPHY type, handled via raw queries

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("addresses")
}

model Order {
  id                 String      @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  orderNumber        String      @unique @map("order_number") @db.VarChar(20)
  userId             String      @map("user_id") @db.Uuid
  driverId           String?     @map("driver_id") @db.Uuid
  pickupAddress      String      @map("pickup_address") @db.VarChar(500)
  pickupContactName  String?     @map("pickup_contact_name") @db.VarChar(100)
  pickupContactPhone String?     @map("pickup_contact_phone") @db.VarChar(15)
  dropoffAddress     String      @map("dropoff_address") @db.VarChar(500)
  dropoffContactName String?     @map("dropoff_contact_name") @db.VarChar(100)
  dropoffContactPhone String?    @map("dropoff_contact_phone") @db.VarChar(15)
  packageDescription String?     @map("package_description")
  packageWeightKg    Decimal?    @map("package_weight_kg") @db.Decimal(5, 2)
  status             OrderStatus @default(PENDING)
  distanceKm         Decimal?    @map("distance_km") @db.Decimal(6, 2)
  price              Decimal?    @db.Decimal(10, 2)
  proofImageUrl      String?     @map("proof_image_url") @db.VarChar(500)
  deliveryNotes      String?     @map("delivery_notes")
  createdAt          DateTime    @default(now()) @map("created_at") @db.Timestamptz
  assignedAt         DateTime?   @map("assigned_at") @db.Timestamptz
  pickedUpAt         DateTime?   @map("picked_up_at") @db.Timestamptz
  deliveredAt        DateTime?   @map("delivered_at") @db.Timestamptz
  cancelledAt        DateTime?   @map("cancelled_at") @db.Timestamptz
  cancellationReason String?     @map("cancellation_reason") @db.VarChar(500)

  // Note: pickup_location and dropoff_location are GEOGRAPHY types

  user     User            @relation("UserOrders", fields: [userId], references: [id])
  driver   User?           @relation("DriverOrders", fields: [driverId], references: [id])
  tracking OrderTracking[]
  messages Message[]

  @@index([userId])
  @@index([driverId])
  @@index([status])
  @@index([createdAt(sort: Desc)])
  @@map("orders")
}

model OrderTracking {
  id         String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  orderId    String   @map("order_id") @db.Uuid
  recordedAt DateTime @default(now()) @map("recorded_at") @db.Timestamptz

  // Note: location is GEOGRAPHY type

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId, recordedAt(sort: Desc)])
  @@map("order_tracking")
}

model Message {
  id        String      @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  orderId   String      @map("order_id") @db.Uuid
  senderId  String      @map("sender_id") @db.Uuid
  content   String
  type      MessageType @default(TEXT)
  imageUrl  String?     @map("image_url") @db.VarChar(500)
  isRead    Boolean     @default(false) @map("is_read")
  readAt    DateTime?   @map("read_at") @db.Timestamptz
  createdAt DateTime    @default(now()) @map("created_at") @db.Timestamptz

  order  Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  sender User  @relation(fields: [senderId], references: [id])

  @@index([orderId, createdAt])
  @@index([senderId])
  @@map("messages")
}

model Notification {
  id        String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  title     String   @db.VarChar(200)
  body      String
  data      Json?
  isRead    Boolean  @default(false) @map("is_read")
  readAt    DateTime? @map("read_at") @db.Timestamptz
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
  @@map("notifications")
}

model SystemConfig {
  key         String   @id @db.VarChar(100)
  value       Json
  description String?
  updatedAt   DateTime @default(now()) @map("updated_at") @db.Timestamptz
  updatedById String?  @map("updated_by") @db.Uuid

  @@map("system_config")
}
```

---

## 8. PostGIS Helper Service (NestJS)

```typescript
// src/common/services/geo.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface Coordinates {
  lat: number;
  lng: number;
}

interface NearbyDriver {
  driver_id: string;
  user_id: string;
  driver_name: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate: string;
  distance_meters: number;
}

@Injectable()
export class GeoService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find nearest active drivers within radius
   */
  async findNearestDrivers(
    location: Coordinates,
    radiusMeters = 5000,
    limit = 5,
  ): Promise<NearbyDriver[]> {
    return this.prisma.$queryRaw<NearbyDriver[]>`
      SELECT * FROM find_nearest_drivers(
        ${location.lat},
        ${location.lng},
        ${radiusMeters},
        ${limit}
      )
    `;
  }

  /**
   * Update driver location
   */
  async updateDriverLocation(
    driverId: string,
    location: Coordinates,
  ): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE drivers 
      SET 
        last_location = ST_MakePoint(${location.lng}, ${location.lat})::geography,
        last_location_updated_at = NOW()
      WHERE id = ${driverId}::uuid
    `;
  }

  /**
   * Calculate distance and price between two points
   */
  async calculateOrderPrice(
    pickup: Coordinates,
    dropoff: Coordinates,
  ): Promise<{ distance_km: number; price: number }> {
    const result = await this.prisma.$queryRaw<
      Array<{ distance_km: number; price: number }>
    >`
      SELECT * FROM calculate_order_price(
        ST_MakePoint(${pickup.lng}, ${pickup.lat})::geography,
        ST_MakePoint(${dropoff.lng}, ${dropoff.lat})::geography
      )
    `;
    return result[0];
  }

  /**
   * Get driver's current location
   */
  async getDriverLocation(driverId: string): Promise<Coordinates | null> {
    const result = await this.prisma.$queryRaw<
      Array<{ lat: number; lng: number }>
    >`
      SELECT 
        ST_Y(last_location::geometry) as lat,
        ST_X(last_location::geometry) as lng
      FROM drivers
      WHERE id = ${driverId}::uuid
        AND last_location IS NOT NULL
    `;
    return result[0] || null;
  }
}
```

---

## 9. Migration Commands

```bash
# Generate Prisma client
bunx prisma generate

# Create migration
bunx prisma migrate dev --name init

# Apply migration to production
bunx prisma migrate deploy

# Reset database (development only!)
bunx prisma migrate reset

# Open Prisma Studio
bunx prisma studio
```

---

## 10. Important Notes

### 9.1. GEOGRAPHY vs GEOMETRY

| Type | Use Case | Distance Calculation |
|------|----------|---------------------|
| GEOMETRY | Small area, flat Earth approximation | Faster, less accurate |
| GEOGRAPHY | Global, spherical Earth model | Slower, accurate for real distances |

**We use GEOGRAPHY** because delivery distances need to be accurate for pricing.

### 9.2. Neon-Specific Considerations

1. **Connection Pooling**: Always use the `-pooler` endpoint for serverless apps
2. **Cold Starts**: First query after idle may be slow (1-2s)
3. **Branches**: Use branches for development/testing
4. **Limits (Free Tier)**:
   - 0.5 GB storage
   - 190 compute hours/month
   - 1 project, unlimited branches

### 9.3. Index Strategy

| Query Pattern | Index Type |
|--------------|------------|
| Nearest driver (KNN) | GIST on GEOGRAPHY |
| Time-series (tracking) | BRIN or B-tree DESC |
| Equality (status, user_id) | B-tree |
| Partial (active only) | Partial index with WHERE |

---

## 11. Redis Caching Strategy

We use **Upstash Redis** alongside Neon PostgreSQL for caching and real-time operations. This section documents the caching patterns and data structures.

> **Detailed implementation**: See [07-Backend-Architecture.md](./07-Backend-Architecture.md) for full code examples.

### 10.1. Cache Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CACHING LAYERS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐                                    ┌──────────────────────┐
    │   Request    │                                    │      Response        │
    └──────┬───────┘                                    └──────────▲───────────┘
           │                                                       │
           ▼                                                       │
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  Layer 1: MEMORY CACHE (In-Process)                                      │
    │  ─────────────────────────────────                                       │
    │  • System config (1 hour TTL)                                            │
    │  • Static data (vehicle types, etc.)                                     │
    │  • Implementation: nestjs-cache-manager / simple Map                     │
    └───────────────────────────────┬─────────────────────────────────────────┘
                                    │ MISS
                                    ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  Layer 2: UPSTASH REDIS (Distributed Cache)                              │
    │  ──────────────────────────────────────────                              │
    │                                                                          │
    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
    │  │  STRING/JSON    │  │  GEO SPATIAL    │  │  PUB/SUB                │  │
    │  │                 │  │                 │  │                         │  │
    │  │  • User profile │  │  • Driver locs  │  │  • Socket.io adapter    │  │
    │  │  • Order cache  │  │    (GEOADD)     │  │  • Location updates     │  │
    │  │  • Session data │  │  • Pickup zones │  │  • Order events         │  │
    │  │                 │  │                 │  │                         │  │
    │  │  TTL: 1-60 min  │  │  TTL: 5 min     │  │  Real-time              │  │
    │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
    │                                                                          │
    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
    │  │  LISTS/STREAMS  │  │  SETS           │  │  SORTED SETS            │  │
    │  │                 │  │                 │  │                         │  │
    │  │  • BullMQ jobs  │  │  • Chat rooms   │  │  • Rate limiting        │  │
    │  │  • Event logs   │  │  • Active users │  │  • Leaderboards         │  │
    │  │                 │  │  • Socket IDs   │  │                         │  │
    │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
    └───────────────────────────────┬─────────────────────────────────────────┘
                                    │ MISS
                                    ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  Layer 3: NEON POSTGRES (Source of Truth)                                │
    │  ────────────────────────────────────────                                │
    │  • All persistent data                                                   │
    │  • PostGIS for geospatial queries                                        │
    │  • Transactions and ACID compliance                                      │
    └─────────────────────────────────────────────────────────────────────────┘
```

### 10.2. Cache Key Naming Convention

```
{domain}:{entity}:{identifier}:{sub-entity?}

Examples:
- user:profile:uuid-xxx              # User profile cache
- driver:location:uuid-xxx           # Single driver location
- driver:locations                   # All driver locations (GEO)
- order:active:uuid-xxx              # Active order cache
- order:room:uuid-xxx:members        # Chat room members (SET)
- config:system                      # System configuration
- rate:user:uuid-xxx:orders          # Rate limiting
```

### 10.3. Caching Patterns

#### Cache-Aside Pattern (Lazy Loading)

```typescript
// Cache-aside pattern implementation
async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300,
): Promise<T> {
  // 1. Try cache first
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached) as T;
  }

  // 2. Cache miss - fetch from database
  const data = await fetchFn();

  // 3. Store in cache
  await redis.setex(key, ttlSeconds, JSON.stringify(data));

  return data;
}

// Usage example
const user = await getOrSet(
  `user:profile:${userId}`,
  () => prisma.user.findUnique({ where: { id: userId } }),
  300, // 5 minutes
);
```

#### Write-Through Pattern (for critical updates)

```typescript
async function updateUserProfile(userId: string, data: UpdateUserDto) {
  // 1. Update database
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  // 2. Immediately update cache
  await redis.setex(
    `user:profile:${userId}`,
    300,
    JSON.stringify(user),
  );

  return user;
}
```

### 10.4. Driver Location Caching (Redis GEO)

Driver locations are cached in Redis for fast nearest-neighbor queries:

```redis
# Key structure
driver:locations

# Add/Update driver location
GEOADD driver:locations 106.7009 10.7769 "driver-uuid-123"

# Find drivers within 5km radius
GEORADIUS driver:locations 106.7009 10.7769 5 km 
  WITHDIST WITHCOORD ASC COUNT 10

# Get specific driver location
GEOPOS driver:locations "driver-uuid-123"

# Remove inactive driver
ZREM driver:locations "driver-uuid-123"
```

```typescript
// NestJS service for driver geo caching
@Injectable()
export class DriverCacheService {
  constructor(private redis: RedisService) {}

  private readonly GEO_KEY = 'driver:locations';
  private readonly TTL_SECONDS = 300; // 5 minutes

  async updateLocation(driverId: string, lat: number, lng: number) {
    // Update geospatial index
    await this.redis.geoadd(this.GEO_KEY, lng, lat, driverId);
    
    // Set TTL for individual driver (using separate key)
    await this.redis.setex(`driver:active:${driverId}`, this.TTL_SECONDS, '1');
  }

  async findNearbyDrivers(lat: number, lng: number, radiusKm: number = 5) {
    return this.redis.georadius(
      this.GEO_KEY,
      lng,
      lat,
      radiusKm,
      'km',
      'WITHDIST',
      'ASC',
      'COUNT',
      10,
    );
  }
}
```

### 10.5. Cache Invalidation Strategy

| Entity | Invalidation Trigger | Strategy |
|--------|---------------------|----------|
| User Profile | User update | Write-through |
| Driver Location | Location update | TTL (5 min auto-expire) |
| Active Order | Status change | Event-driven invalidation |
| System Config | Admin update | Broadcast invalidation |
| Chat Room | User join/leave | Real-time via Socket.io |

```typescript
// Event-driven cache invalidation
@Injectable()
export class OrderCacheService {
  async invalidateOrderCache(orderId: string) {
    const keys = [
      `order:active:${orderId}`,
      `order:tracking:${orderId}`,
    ];
    
    // Delete all related keys
    await this.redis.del(...keys);
    
    // Publish invalidation event (for multi-instance)
    await this.redis.publish('cache:invalidate', JSON.stringify({
      entity: 'order',
      id: orderId,
    }));
  }
}
```

### 10.6. Cache TTL Guidelines

| Data Type | TTL | Reason |
|-----------|-----|--------|
| System Config | 1 hour | Rarely changes, high read |
| User Profile | 5 minutes | Balance freshness & performance |
| Driver Location | 5 minutes | Auto-expire inactive drivers |
| Active Order | 1 minute | Need near real-time updates |
| Order History | 30 minutes | Read-heavy, rarely changes |
| Session/Auth | 15 minutes | Security consideration |

### 10.7. Redis Memory Management

```typescript
// Upstash Redis free tier: 10,000 commands/day, 256MB
// Key strategies for memory optimization:

// 1. Use short keys
const key = `u:${userId}`;  // Instead of user:profile:${userId}

// 2. Compress large values
import { gzip, gunzip } from 'zlib';

async function setCompressed(key: string, data: object) {
  const compressed = await gzip(JSON.stringify(data));
  await redis.setex(key, 300, compressed.toString('base64'));
}

// 3. Use Hash for related fields
await redis.hset(`driver:${driverId}`, {
  status: 'ACTIVE',
  lat: '10.7769',
  lng: '106.7009',
  updated: Date.now().toString(),
});

// 4. Set appropriate TTLs to auto-cleanup
// 5. Monitor with Upstash dashboard
```

---

## 12. Data Synchronization

### 11.1. Redis ↔ PostgreSQL Sync

For driver locations, we use a dual-write pattern:

```
Driver App → Backend → Redis (real-time, 5s interval)
                    ↓
                    → PostgreSQL (batch, every 30s via BullMQ)
```

```typescript
// Location batch processor (BullMQ)
@Processor('LOCATION_QUEUE')
export class LocationProcessor {
  @Process('batch-insert')
  async handleBatchInsert(job: Job<{ locations: LocationUpdate[] }>) {
    // Batch insert to PostgreSQL
    await this.prisma.$executeRaw`
      INSERT INTO order_tracking (order_id, location, recorded_at)
      VALUES ${Prisma.join(
        job.data.locations.map(loc => 
          Prisma.sql`(${loc.orderId}::uuid, 
            ST_MakePoint(${loc.lng}, ${loc.lat})::geography, 
            ${loc.timestamp})`
        )
      )}
    `;
  }
}
```

### 11.2. Eventual Consistency Handling

```typescript
// For non-critical data, accept eventual consistency
// For critical data (orders, payments), use transactions

// Example: Order status update with cache invalidation
async updateOrderStatus(orderId: string, status: OrderStatus) {
  await this.prisma.$transaction(async (tx) => {
    // 1. Update database (source of truth)
    await tx.order.update({
      where: { id: orderId },
      data: { status },
    });

    // 2. Invalidate cache (after transaction commits)
  });

  // 3. Cache invalidation (after successful transaction)
  await this.cacheService.invalidateOrderCache(orderId);
  
  // 4. Broadcast via Socket.io
  this.socketGateway.emitToRoom(`order:${orderId}`, 'status:updated', { status });
}
```
