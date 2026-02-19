---
name: delivery-pricing-engine
description: Use when implementing dynamic pricing for delivery apps, calculating fares based on distance, time, demand surge, vehicle type, and applying promotional discounts.
---

# Delivery Pricing Engine

## Overview

Dynamic pricing system for delivery applications. Calculates fares based on distance, time of day, demand surge, vehicle type, and promotional discounts.

## When to Use

**Use this skill when:**
- Calculating delivery fares based on multiple factors
- Implementing surge pricing during high demand
- Applying promotional codes and discounts
- Estimating prices before order confirmation
- Supporting multiple vehicle types with different rates

**Don't use when:**
- Simple flat-rate pricing (use basic calculation)
- Static pricing without dynamic factors

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

  async calculatePrice(factors: PricingFactors): Promise{
    const { distanceKm, vehicleType, timestamp = new Date() } = factors;
    const rates = this.VEHICLE_RATES[vehicleType];

    const baseFare = rates.baseFare;
    const distanceCharge = distanceKm * rates.perKm;
    const timeCharge = this.calculateTimeCharge(timestamp);
    const surgeMultiplier = await this.getSurgeMultiplier(
      factors.pickupLat, factors.pickupLng, timestamp
    );

    let subtotal = (baseFare + distanceCharge + timeCharge) * surgeMultiplier;
    subtotal = Math.max(subtotal, rates.minFare);
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
    const day = timestamp.getDay();
    const isWeekday = day >= 1 && day <= 5;
    const isPeakHour = isWeekday && 
      ((hour >= 7 && hour < 9) || (hour >= 11 && hour < 13) || (hour >= 17 && hour < 20));
    return isPeakHour ? 5000 : 0;
  }

  private async getSurgeMultiplier(lat: number, lng: number, timestamp: Date): Promise{
    const demandRatio = await this.getDemandRatio(lat, lng);
    if (demandRatio > 1.5) return 1.5;
    if (demandRatio > 1.2) return 1.3;
    if (demandRatio > 1.0) return 1.2;
    return 1.0;
  }

  private async getDemandRatio(lat: number, lng: number): Promise{
    // Query active orders vs available drivers in area
    return 1.0;
  }
}
```

### Pattern 2: Surge Pricing with Redis

```typescript
// src/modules/pricing/surge-pricing.service.ts
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class SurgePricingService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async updateZoneDemand(zoneId: string, activeOrders: number, availableDrivers: number) {
    const demandRatio = availableDrivers > 0 ? activeOrders / availableDrivers : 999;
    const multiplier = this.calculateMultiplier(demandRatio);

    await this.redis.hset(`zone:${zoneId}`, {
      activeOrders: activeOrders.toString(),
      availableDrivers: availableDrivers.toString(),
      demandRatio: demandRatio.toString(),
      multiplier: multiplier.toString(),
      updatedAt: Date.now().toString(),
    });
    await this.redis.expire(`zone:${zoneId}`, 300);
  }

  async getSurgeMultiplier(zoneId: string): Promise{
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

  getZoneId(lat: number, lng: number): string {
    const latGrid = Math.floor(lat * 100);
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

@Injectable()
export class PromotionService {
  constructor(private prisma: PrismaService) {}

  async validatePromoCode(code: string, userId: string, subtotal: number): Promise{
    const promo = await this.prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo) return { valid: false, error: 'Mã giảm giá không hợp lệ' };

    const now = new Date();
    if (now < promo.validFrom || now > promo.validUntil) {
      return { valid: false, error: 'Mã giảm giá đã hết hạn' };
    }

    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return { valid: false, error: 'Mã giảm giá đã hết lượt sử dụng' };
    }

    if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
      return { valid: false, error: `Đơn hàng tối thiểu ${promo.minOrderAmount.toLocaleString('vi-VN')}đ` };
    }

    const existingUsage = await this.prisma.promotionUsage.findFirst({
      where: { promotionId: promo.id, userId },
    });
    if (existingUsage) return { valid: false, error: 'Bạn đã sử dụng mã này' };

    let discount = 0;
    switch (promo.type) {
      case 'PERCENTAGE':
        discount = (subtotal * promo.value) / 100;
        if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
        break;
      case 'FIXED':
        discount = Math.min(promo.value, subtotal);
        break;
      case 'FREE_DELIVERY':
        discount = subtotal;
        break;
    }

    return { valid: true, discount: Math.round(discount) };
  }
}
```

## Extended Reference

The skill was trimmed for readability. See references/delivery-pricing-engine-extended.md for:

- Full service implementations (PricingService, SurgePricingService, PromotionService)
- Database schema DDL for pricing configs, promotions, promotion usages, and surge history
- Longer integration examples for Redis and Prisma

All moved content was preserved verbatim in the referenced file.

## Quick Reference

| Factor | Calculation |
|--------|-------------|
| Base fare | Fixed per vehicle type |
| Distance | km × rate per km |
| Time | Peak hour surcharge |
| Surge | Based on demand/supply ratio |
| Discount | Promo code or campaign |
| Total | (Base + Distance + Time) × Surge - Discount |

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
