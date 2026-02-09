---
name: delivery-pricing-engine
description: Use when implementing dynamic pricing for delivery apps, calculating fares based on distance, time, demand surge, vehicle type, and applying promotional discounts.
---

# Delivery Pricing Engine

## Overview

Dynamic pricing system for delivery applications. Calculates fares based on distance, time of day, demand surge, vehicle type, and promotional discounts. Supports real-time price adjustments and surge pricing during peak hours.

## When to Use

**Use this skill when:**
- Calculating delivery fares based on multiple factors
- Implementing surge pricing during high demand
- Applying promotional codes and discounts
- Estimating prices before order confirmation
- Supporting multiple vehicle types with different rates
- Building admin pricing configuration tools

**Don't use when:**
- Simple flat-rate pricing (use basic calculation)
- Static pricing without dynamic factors
- Non-delivery pricing (e.g., product pricing)

## Core Patterns

### Pattern 1: Basic Pricing Service

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

    // Base fare
    const baseFare = rates.baseFare;

    // Distance charge
    const distanceCharge = distanceKm * rates.perKm;

    // Time-based pricing (peak hours)
    const timeCharge = this.calculateTimeCharge(timestamp);

    // Surge pricing based on demand
    const surgeMultiplier = await this.getSurgeMultiplier(
      factors.pickupLat,
      factors.pickupLng,
      timestamp
    );

    // Calculate subtotal
    let subtotal = (baseFare + distanceCharge + timeCharge) * surgeMultiplier;

    // Apply minimum fare
    subtotal = Math.max(subtotal, rates.minFare);

    // Round to nearest 1000 VND
    subtotal = Math.ceil(subtotal / 1000) * 1000;

    return {
      baseFare,
      distanceCharge: Math.round(distanceCharge),
      timeCharge,
      surgeMultiplier,
      subtotal,
      discount: 0,
      total: subtotal,
      currency: 'VND',
    };
  }

  private calculateTimeCharge(timestamp: Date): number {
    const hour = timestamp.getHours();
    const day = timestamp.getDay(); // 0 = Sunday

    // Peak hours: 7-9 AM, 11 AM-1 PM, 5-8 PM on weekdays
    const isWeekday = day >= 1 && day <= 5;
    const isPeakHour =
      isWeekday &&
      ((hour >= 7 && hour < 9) ||
        (hour >= 11 && hour < 13) ||
        (hour >= 17 && hour < 20));

    return isPeakHour ? 5000 : 0;
  }

  private async getSurgeMultiplier(
    lat: number,
    lng: number,
    timestamp: Date
  ): Promise<number> {
    // Check demand in pickup area
    const demandRatio = await this.getDemandRatio(lat, lng);

    // Apply surge if demand is high
    if (demandRatio > 1.5) return 1.5;
    if (demandRatio > 1.2) return 1.3;
    if (demandRatio > 1.0) return 1.2;

    return 1.0;
  }

  private async getDemandRatio(lat: number, lng: number): Promise<number> {
    // Query active orders vs available drivers in area
    // This is a simplified example
    return 1.0; // Implement based on your data
  }
}
```

### Pattern 2: Surge Pricing with Redis

```typescript
// src/modules/pricing/surge-pricing.service.ts
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

interface ZoneDemand {
  zoneId: string;
  activeOrders: number;
  availableDrivers: number;
  demandRatio: number;
}

@Injectable()
export class SurgePricingService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async updateZoneDemand(
    zoneId: string,
    activeOrders: number,
    availableDrivers: number
  ) {
    const demandRatio =
      availableDrivers > 0 ? activeOrders / availableDrivers : 999;

    const multiplier = this.calculateMultiplier(demandRatio);

    await this.redis.hset(`zone:${zoneId}`, {
      activeOrders: activeOrders.toString(),
      availableDrivers: availableDrivers.toString(),
      demandRatio: demandRatio.toString(),
      multiplier: multiplier.toString(),
      updatedAt: Date.now().toString(),
    });

    // Set expiry for stale data
    await this.redis.expire(`zone:${zoneId}`, 300); // 5 minutes
  }

  async getSurgeMultiplier(zoneId: string): Promise<number> {
    const data = await this.redis.hget(`zone:${zoneId}`, 'multiplier');
    return data ? parseFloat(data) : 1.0;
  }

  private calculateMultiplier(demandRatio: number): number {
    if (demandRatio >= 3.0) return 2.0;
    if (demandRatio >= 2.0) return 1.8;
    if (demandRatio >= 1.5) return 1.5;
    if (demandRatio >= 1.2) return 1.3;
    if (demandRatio >= 1.0) return 1.1;
    return 1.0;
  }

  // Divide city into zones based on lat/lng
  getZoneId(lat: number, lng: number): string {
    // Simple grid-based zoning
    const latGrid = Math.floor(lat * 100); // ~1km grid
    const lngGrid = Math.floor(lng * 100);
    return `${latGrid}:${lngGrid}`;
  }
}
```

### Pattern 3: Promotional Discounts

```typescript
// src/modules/pricing/promotion.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

interface Promotion {
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'FREE_DELIVERY';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usageCount: number;
}

@Injectable()
export class PromotionService {
  constructor(private prisma: PrismaService) {}

  async validatePromoCode(
    code: string,
    userId: string,
    subtotal: number
  ): Promise<{ valid: boolean; discount?: number; error?: string }> {
    const promo = await this.prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      return { valid: false, error: 'Mã giảm giá không hợp lệ' };
    }

    // Check validity period
    const now = new Date();
    if (now < promo.validFrom || now > promo.validUntil) {
      return { valid: false, error: 'Mã giảm giá đã hết hạn' };
    }

    // Check usage limit
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return { valid: false, error: 'Mã giảm giá đã hết lượt sử dụng' };
    }

    // Check minimum order
    if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
      return {
        valid: false,
        error: `Đơn hàng tối thiểu ${promo.minOrderAmount.toLocaleString('vi-VN')}đ`,
      };
    }

    // Check if user already used
    const existingUsage = await this.prisma.promotionUsage.findFirst({
      where: { promotionId: promo.id, userId },
    });

    if (existingUsage) {
      return { valid: false, error: 'Bạn đã sử dụng mã này' };
    }

    // Calculate discount
    let discount = 0;
    switch (promo.type) {
      case 'PERCENTAGE':
        discount = (subtotal * promo.value) / 100;
        if (promo.maxDiscount) {
          discount = Math.min(discount, promo.maxDiscount);
        }
        break;
      case 'FIXED':
        discount = Math.min(promo.value, subtotal);
        break;
      case 'FREE_DELIVERY':
        discount = subtotal; // Full delivery fee
        break;
    }

    return { valid: true, discount: Math.round(discount) };
  }

  async applyPromotion(
    code: string,
    userId: string,
    orderId: string,
    discount: number
  ) {
    await this.prisma.$transaction([
      this.prisma.promotionUsage.create({
        data: {
          promotion: { connect: { code: code.toUpperCase() } },
          userId,
          orderId,
          discountAmount: discount,
        },
      }),
      this.prisma.promotion.update({
        where: { code: code.toUpperCase() },
        data: { usageCount: { increment: 1 } },
      }),
    ]);
  }
}
```

### Pattern 4: Price Estimation API

```typescript
// src/modules/pricing/pricing.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PromotionService } from './promotion.service';

@Controller('pricing')
export class PricingController {
  constructor(
    private pricingService: PricingService,
    private promotionService: PromotionService
  ) {}

  @Get('estimate')
  async estimatePrice(
    @Query('pickupLat') pickupLat: string,
    @Query('pickupLng') pickupLng: string,
    @Query('dropoffLat') dropoffLat: string,
    @Query('dropoffLng') dropoffLng: string,
    @Query('vehicleType') vehicleType: string,
    @Query('promoCode') promoCode?: string,
    @Query('userId') userId?: string
  ) {
    // Calculate distance
    const distanceKm = this.calculateDistance(
      parseFloat(pickupLat),
      parseFloat(pickupLng),
      parseFloat(dropoffLat),
      parseFloat(dropoffLng)
    );

    // Get base price
    const priceBreakdown = await this.pricingService.calculatePrice({
      distanceKm,
      vehicleType: vehicleType as any,
      pickupLat: parseFloat(pickupLat),
      pickupLng: parseFloat(pickupLng),
    });

    // Apply promo code if provided
    if (promoCode && userId) {
      const promoResult = await this.promotionService.validatePromoCode(
        promoCode,
        userId,
        priceBreakdown.subtotal
      );

      if (promoResult.valid && promoResult.discount) {
        priceBreakdown.discount = promoResult.discount;
        priceBreakdown.total = priceBreakdown.subtotal - promoResult.discount;
      }
    }

    return {
      success: true,
      data: {
        ...priceBreakdown,
        distanceKm: Math.round(distanceKm * 10) / 10,
        estimatedTime: Math.ceil(distanceKm / 0.5), // ~30 km/h avg
      },
    };
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    // Haversine formula
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
```

## Database Schema

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
  type VARCHAR(20) NOT NULL, -- PERCENTAGE, FIXED, FREE_DELIVERY
  value INTEGER NOT NULL,
  min_order_amount INTEGER,
  max_discount INTEGER,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Promotion usage tracking
CREATE TABLE promotion_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID REFERENCES promotions(id),
  user_id UUID NOT NULL,
  order_id UUID REFERENCES orders(id),
  discount_amount INTEGER NOT NULL,
  used_at TIMESTAMP DEFAULT NOW()
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

## Quick Reference

| Factor | Calculation |
|--------|-------------|
| Base fare | Fixed per vehicle type |
| Distance | km × rate per km |
| Time | Peak hour surcharge |
| Surge | Based on demand/supply ratio |
| Discount | Promo code or campaign |
| Total | (Base + Distance + Time) × Surge - Discount |

## Pricing Factors

| Factor | Impact | Implementation |
|--------|--------|----------------|
| Distance | Linear | km × rate |
| Vehicle type | Base fare | Different rates per type |
| Time of day | Surcharge | Peak hours multiplier |
| Demand surge | Dynamic | Real-time zone-based |
| Weather | Optional | External API integration |
| Promo code | Discount | Validation service |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Not rounding prices | Round to nearest 1000 VND |
| Missing minimum fare | Always apply min_fare check |
| Stale surge data | Use Redis with TTL |
| No promo validation | Check all constraints before applying |
| No price history | Log all pricing calculations |

## Dependencies

```json
{
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@prisma/client": "^6.0.0",
    "ioredis": "^5.4.0"
  }
}
```

## Related Skills

- **delivery-order-matching** - Driver assignment and ETA calculation
- **redis-patterns** - Caching demand data
- **postgis-skill** - Zone-based queries
