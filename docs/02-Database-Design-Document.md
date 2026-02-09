

---

## 12. Geospatial Optimization (CRITICAL)

### 12.1. PostGIS Index Strategy

For optimal geospatial query performance, ensure these indexes exist:

```sql
-- ==========================================
-- GIST Indexes for Geospatial Queries
-- ==========================================

-- 1. Driver location for nearest-neighbor (KNN) queries
-- This is the MOST CRITICAL index for driver matching
CREATE INDEX idx_drivers_location_gist 
ON drivers USING GIST (last_location);

-- 2. Partial index for active drivers only (faster queries)
CREATE INDEX idx_drivers_active_location 
ON drivers USING GIST (last_location) 
WHERE status = 'ACTIVE' 
  AND is_approved = true 
  AND last_location IS NOT NULL;

-- 3. Index for location freshness (filter stale locations)
CREATE INDEX idx_drivers_location_at 
ON drivers(last_location_at DESC);

-- 4. Composite index for driver matching query
CREATE INDEX idx_drivers_matching 
ON drivers(status, is_approved, vehicle_type) 
WHERE last_location IS NOT NULL;

-- 5. Order pickup location for spatial queries
CREATE INDEX idx_orders_pickup_gist 
ON orders USING GIST (pickup_location);

-- 6. Order dropoff location  
CREATE INDEX idx_orders_dropoff_gist 
ON orders USING GIST (dropoff_location);
```

### 12.2. Optimized Driver Matching Query

```sql
-- Optimized query using indexes
CREATE OR REPLACE FUNCTION find_nearest_drivers_v2(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_meters INTEGER DEFAULT 5000,
  p_limit INTEGER DEFAULT 5,
  p_vehicle_type VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
  driver_id UUID,
  user_id UUID,
  driver_name VARCHAR,
  phone VARCHAR,
  vehicle_type VARCHAR,
  vehicle_plate VARCHAR,
  distance_meters DOUBLE PRECISION,
  estimated_arrival_minutes INTEGER
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
      d.last_location::geography, 
      ST_MakePoint(p_lng, p_lat)::geography
    ) as distance_meters,
    -- Calculate ETA (assuming average speed of 300m/min for bike)
    CEIL(
      ST_Distance(
        d.last_location::geography, 
        ST_MakePoint(p_lng, p_lat)::geography
      ) / 300.0
    )::INTEGER as estimated_arrival_minutes
  FROM drivers d
  JOIN users u ON d.user_id = u.id
  WHERE d.status = 'ACTIVE'
    AND d.is_approved = true
    AND d.last_location IS NOT NULL
    -- Only consider drivers active in last 5 minutes
    AND d.last_location_at > NOW() - INTERVAL '5 minutes'
    -- Filter by vehicle type if specified
    AND (p_vehicle_type IS NULL OR d.vehicle_type = p_vehicle_type)
    -- Use spatial index with ST_DWithin
    AND ST_DWithin(
      d.last_location::geography, 
      ST_MakePoint(p_lng, p_lat)::geography,
      p_radius_meters
    )
  -- Use spatial index for ordering (KNN)
  ORDER BY d.last_location::geography <-> ST_MakePoint(p_lng, p_lat)::geography
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

### 12.3. Performance Monitoring Queries

```sql
-- Check if indexes are being used
EXPLAIN ANALYZE
SELECT * FROM find_nearest_drivers_v2(10.762622, 106.660172, 5000, 5);

-- Should show:
-- - Index Scan using idx_drivers_active_location
-- - Index Cond: (last_location && ...)
-- - Filter: status = 'ACTIVE' AND is_approved = true

-- Check table statistics
SELECT 
  schemaname,
  tablename,
  attname as column,
  n_distinct,
  correlation
FROM pg_stats
WHERE tablename = 'drivers' 
  AND attname = 'last_location';

-- Monitor slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE query LIKE '%find_nearest_drivers%'
ORDER BY mean_time DESC;
```

### 12.4. Common Performance Issues

#### Issue 1: Sequential Scan Instead of Index Scan

**Symptom:** Query is slow (> 100ms)

**Check:**
```sql
EXPLAIN ANALYZE SELECT * FROM find_nearest_drivers_v2(10.762622, 106.660172, 5000, 5);
```

**Fix:**
- Ensure GIST extension is enabled: `CREATE EXTENSION IF NOT EXISTS postgis;`
- Vacuum analyze: `VACUUM ANALYZE drivers;`
- Check index exists: `\di idx_drivers_*`

#### Issue 2: Stale Statistics

**Fix:**
```sql
-- Update statistics
ANALYZE drivers;
ANALYZE orders;

-- For large tables, use sampling
ANALYZE drivers(last_location) WITH (n_distinct_inherited = false);
```

#### Issue 3: Too Many Inactive Drivers

**Fix:** Add partial index condition:
```sql
-- Only index active drivers
CREATE INDEX idx_drivers_active_location 
ON drivers USING GIST (last_location) 
WHERE status = 'ACTIVE' AND is_approved = true;
```

### 12.5. Geospatial Best Practices

1. **Always use GEOGRAPHY type** (not GEOMETRY) for accurate Earth distances
2. **Use GIST indexes** for all spatial columns
3. **Add partial indexes** to filter inactive data
4. **Use ST_DWithin** before calculating exact distances
5. **Set statistics targets** for spatial columns:
   ```sql
   ALTER TABLE drivers ALTER COLUMN last_location SET STATISTICS 1000;
   ```
6. **Monitor query plans** with EXPLAIN ANALYZE
7. **Use KNN operator** (`<->`) for nearest-neighbor queries

---

**END OF DOCUMENT**
