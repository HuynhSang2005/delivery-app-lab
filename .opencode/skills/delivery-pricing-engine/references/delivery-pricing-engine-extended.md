# Delivery Pricing Engine — Extended Reference

Extended examples, full service implementations, database DDL, and long code snippets moved from SKILL.md to keep the main skill concise.

Moved content includes:
- Full PricingService, SurgePricingService, PromotionService implementations
- Database schema DDL for pricing configs, promotions, surge history
- Additional notes and long examples for integration with Redis and Prisma

---

<!-- Moved verbatim from SKILL.md -->

```typescript
// src/modules/pricing/pricing.service.ts
import { Injectable } from '@nestjs/common';

interface PricingFactors {
  distanceKm: number;
  vehicleType: 'MOTORCYCLE' | 'CAR' | 'VAN';
  pickupLat: number;
  pickupLng: number;
  timestamp?: Date;
}

interface PriceBreakdown {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  surgeMultiplier: number;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
}

@Injectable()
export class PricingService {
  private readonly VEHICLE_RATES = {
    MOTORCYCLE: { baseFare: 15000, perKm: 5000, minFare: 20000 },
    CAR: { baseFare: 25000, perKm: 12000, minFare: 35000 },
    VAN: { baseFare: 50000, perKm: 20000, minFare: 70000 },
  };

  async calculatePrice(factors: PricingFactors): Promise<PriceBreakdown> {
    const { distanceKm, vehicleType, timestamp = new Date() } = factors;
    const rates = this.VEHICLE_RATES[vehicleType];

    const baseFare = rates.baseFare;
    const distanceCharge = distanceKm * rates.perKm;
    const timeCharge = this.calculateTimeCharge(timestamp);
    const surgeMultiplier = await this.getSurgeMultiplier(factors.pickupLat, factors.pickupLng, timestamp);

    let subtotal = (baseFare + distanceCharge + timeCharge) * surgeMultiplier;
    subtotal = Math.max(subtotal, rates.minFare);
    subtotal = Math.ceil(subtotal / 1000) * 1000;

    return { baseFare, distanceCharge: Math.round(distanceCharge), timeCharge, surgeMultiplier, subtotal, discount: 0, total: subtotal, currency: 'VND' };
  }

  private calculateTimeCharge(timestamp: Date): number { /* ... */ return 0; }
  private async getSurgeMultiplier(lat: number, lng: number, timestamp: Date): Promise<number> { return 1.0; }
}
```

```sql
-- Pricing configuration
CREATE TABLE pricing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type VARCHAR(20) NOT NULL,
  base_fare INTEGER NOT NULL,
  per_km_rate INTEGER NOT NULL,
  per_minute_rate INTEGER DEFAULT 0,
  min_fare INTEGER NOT NULL,
  max_fare INTEGER,
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMP DEFAULT NOW(),
  UNIQUE(vehicle_type, effective_from)
);

-- Promotions
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL,
  value INTEGER NOT NULL,
  min_order_amount INTEGER,
  max_discount INTEGER,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Surge pricing history
CREATE TABLE surge_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id VARCHAR(50) NOT NULL,
  multiplier DECIMAL(3,2) NOT NULL,
  demand_ratio DECIMAL(5,2) NOT NULL,
  active_orders INTEGER NOT NULL,
  available_drivers INTEGER NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW()
);
```
