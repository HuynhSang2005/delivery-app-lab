---
name: hey-api-patterns
description: Use when generating TypeScript API clients from OpenAPI specs with Hey-API, including TanStack Query hooks, Zod validation, and type-safe fetch clients for React/Next.js applications.
---

# Hey-API Patterns

## Overview

Production-ready patterns for generating type-safe API clients from OpenAPI specifications using Hey-API.

## Important: ESM-Only Package

**Hey-API v0.91.0+ is ESM-only.** Use `"type": "module"` in package.json or `.mjs` config files.

```typescript
// openapi-ts.config.mjs
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi.json',
  output: 'src/client',
  plugins: ['@hey-api/client-fetch', '@hey-api/typescript', 'zod'],
});
```

## When to Use

**Use this skill when:**
- Generating TypeScript clients from OpenAPI/Swagger specs
- Building React/Next.js apps that consume REST APIs
- Need type-safe API calls with full TypeScript inference
- Want automatic TanStack Query hooks generation
- Need runtime validation with Zod schemas

**Don't use when:**
- Using GraphQL (use Apollo or Relay instead)
- API doesn't have OpenAPI specification

## Core Patterns

### Pattern 1: NestJS Swagger Setup

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
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('Auth', 'Authentication endpoints')
    .addServer('http://localhost:3000', 'Development')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true, docExpansion: 'none' },
  });

  // Export OpenAPI spec for Hey-API
  if (process.env.NODE_ENV !== 'production') {
    const outputPath = path.resolve(__dirname, '../../openapi.json');
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
  }

  return document;
}
```

### Pattern 2: Controller with Swagger Decorators

```typescript
// src/modules/orders/orders.controller.ts
import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto, OrderResponseDto } from './dto';

@Controller('orders')
@ApiTags('Orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  @ApiResponse({ status: 201, description: 'Order created', type: OrderResponseDto })
  create(@Body() dto: CreateOrderDto): Promise{
    return this.ordersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'ASSIGNED', 'DELIVERING'] })
  @ApiResponse({ status: 200, description: 'Order list', type: [OrderResponseDto] })
  findAll(@Query('status') status?: string, @Query('page') page = 1) {
    return this.ordersService.findAll({ status, page });
  }
}
```

### Pattern 3: DTOs with Swagger Decorators

```typescript
// src/modules/orders/dto/create-order.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'Pickup address' })
  @IsString()
  pickupAddress: string;

  @ApiProperty({ description: 'Pickup latitude' })
  @IsNumber()
  pickupLat: number;

  @ApiProperty({ description: 'Pickup longitude' })
  @IsNumber()
  pickupLng: number;

  @ApiProperty({ description: 'Dropoff address' })
  @IsString()
  dropoffAddress: string;

  @ApiProperty({ description: 'Dropoff latitude' })
  @IsNumber()
  dropoffLat: number;

  @ApiProperty({ description: 'Dropoff longitude' })
  @IsNumber()
  dropoffLng: number;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty({ enum: ['PENDING', 'ASSIGNED', 'DELIVERING', 'COMPLETED'] })
  status: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  createdAt: Date;
}
```

### Pattern 4: Hey-API Configuration

```typescript
// apps/admin/openapi-ts.config.ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../backend/openapi.json',
  output: 'src/client',
  plugins: [
    '@hey-api/client-fetch',
    '@hey-api/typescript',
    { name: 'zod', definitions: true, requests: true, responses: true },
    { name: '@tanstack/react-query', queryOptions: true, mutationOptions: true, queryKeys: true },
  ],
});
```

### Pattern 5: Package Scripts

```json
{
  "scripts": {
    "generate:api": "bunx @hey-api/openapi-ts",
    "dev": "bun run generate:api \u0026\u0026 next dev",
    "build": "bun run generate:api \u0026\u0026 next build"
  }
}
```

### Pattern 6: Using Generated Client

```typescript
// apps/admin/src/app/orders/page.tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { findAllOptions, createMutation, ordersQueryKey } from '@/client/tanstack-query.gen';
import { zOrderResponseDto } from '@/client/zod.gen';

export default function OrdersPage() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    ...findAllOptions({ query: { status: 'PENDING', page: 1, limit: 20 } }),
  });

  const createOrder = useMutation({
    ...createMutation(),
    onSuccess: (newOrder) => {
      const validated = zOrderResponseDto.parse(newOrder);
      console.log('Created:', validated.orderNumber);
      queryClient.invalidateQueries({ queryKey: ordersQueryKey() });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Orders</h1>
      <button onClick={() => createOrder.mutate({ body: { /* order data */ } })} >
        Create Order
      </button>
      <table>
        <thead>
          <tr><th>Order #</th><th>Status</th></tr>
        </thead>
        <tbody>
          {orders?.data?.map((order) => (
            <tr key={order.id}>
              <td>{order.orderNumber}</td>
              <td>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Pattern 7: Client Configuration

```typescript
// apps/admin/src/lib/api.ts
import { client } from '@/client/client.gen';

client.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

client.interceptors.request.use((request) => {
  const token = localStorage.getItem('accessToken');
  if (token) request.headers.set('Authorization', `Bearer ${token}`);
  return request;
});

client.interceptors.response.use((response) => {
  if (response.status === 401) {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }
  return response;
});
```

### Pattern 8: Type-Safe API Calls

```typescript
import { createOrder, getOrderById } from '@/client/sdk.gen';
import { CreateOrderDto } from '@/client/types.gen';

async function handleOrderCreation(orderData: CreateOrderDto) {
  const response = await createOrder({ body: orderData });
  if (response.error) {
    console.error('Error:', response.error);
    return;
  }
  console.log('Created order:', response.data.orderNumber);
}

async function fetchOrderDetails(orderId: string) {
  const response = await getOrderById({ path: { id: orderId } });
  if (response.data) {
    const { orderNumber, status, pickupAddress } = response.data;
    return { orderNumber, status, pickupAddress };
  }
}
```

## Quick Reference

| Task | Command/Pattern |
|------|-----------------|
| Generate client | `bunx @hey-api/openapi-ts` |
| Fetch data | `useQuery({ ...findAllOptions() })` |
| Mutate data | `useMutation({ ...createMutation() })` |
| Invalidate | `queryClient.invalidateQueries({ queryKey: ordersQueryKey() })` |
| Validate | `zOrderResponseDto.parse(data)` |
| Set auth | `client.interceptors.request.use(...)` |

## Generated File Structure

```
src/client/
├── client.gen.ts      # Fetch client configuration
├── sdk.gen.ts         # API functions
├── types.gen.ts       # TypeScript interfaces
├── zod.gen.ts         # Zod validation schemas
└── tanstack-query.gen.ts  # React Query hooks
```

## Extended Reference

The skill was trimmed to stay within length limits. See references/hey-api-patterns-extended.md for:

- Full UI examples (OrdersPage) and long usage examples
- Client configuration and interceptor patterns
- Longer snippets for working with generated hooks and types

All moved content was preserved verbatim in the referenced file.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Not regenerating after API changes | Add to dev/build scripts |
| Missing auth headers | Configure client interceptor |
| No error handling | Check `response.error` before using `response.data` |
| Wrong input path | Use correct relative path or URL |
| Not invalidating queries | Call `invalidateQueries` on mutations |

## Dependencies

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.60.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@hey-api/openapi-ts": "^0.92.3",
    "@hey-api/client-fetch": "^0.10.0",
    "@hey-api/typescript": "^0.4.0"
  }
}
```

## Related Skills

- **tanstack-query** - React Query patterns
- **zod** - Schema validation
- **nestjs-best-practices** - Backend Swagger setup
