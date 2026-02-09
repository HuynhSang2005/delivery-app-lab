---
name: hey-api-patterns
description: Use when generating TypeScript API clients from OpenAPI specs with Hey-API, including TanStack Query hooks, Zod validation, and type-safe fetch clients for React/Next.js applications.
---

# Hey-API Patterns

## Overview

Production-ready patterns for generating type-safe API clients from OpenAPI specifications using Hey-API. Covers client generation, TanStack Query integration, Zod validation, and best practices for React/Next.js applications.

## Important: ESM-Only Package

**Hey-API v0.91.0+ is ESM-only.** This means:
- Use `"type": "module"` in package.json
- Use `.mjs` extension for config files, OR
- Use dynamic `import()` in CommonJS files

```typescript
// openapi-ts.config.mjs (recommended)
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi.json',
  output: 'src/client',
  plugins: [
    '@hey-api/client-fetch',
    '@hey-api/typescript',
    'zod',
  ],
});
```

## When to Use

**Use this skill when:**
- Generating TypeScript clients from OpenAPI/Swagger specs
- Building React/Next.js apps that consume REST APIs
- Need type-safe API calls with full TypeScript inference
- Want automatic TanStack Query hooks generation
- Need runtime validation with Zod schemas
- Working with NestJS backends that expose Swagger docs

**Don't use when:**
- Using GraphQL (use Apollo or Relay instead)
- Building vanilla JavaScript projects
- API doesn't have OpenAPI specification
- Need highly customized client logic

## Core Patterns

### Pattern 1: NestJS Swagger Setup

Configure NestJS to generate OpenAPI spec:

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
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'access-token',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Drivers', 'Driver operations')
    .addTag('Orders', 'Order management')
    .addServer('http://localhost:3000', 'Development')
    .addServer('https://api.logship.example.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  // Setup Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
    },
  });

  // Export OpenAPI spec as JSON (for Hey-API)
  if (process.env.NODE_ENV !== 'production') {
    const outputPath = path.resolve(__dirname, '../../openapi.json');
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
    console.log(`OpenAPI spec written to ${outputPath}`);
  }

  return document;
}
```

### Pattern 2: Controller with Swagger Decorators

Add OpenAPI metadata to controllers:

```typescript
// src/modules/orders/orders.controller.ts
import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto, OrderResponseDto, UpdateOrderStatusDto } from './dto';

@Controller('orders')
@ApiTags('Orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  @ApiResponse({ status: 201, description: 'Order created', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.ordersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'ASSIGNED', 'DELIVERING'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Order list', type: [OrderResponseDto] })
  findAll(
    @Query('status') status?: string,
    @Query('page') page = 1,
  ) {
    return this.ordersService.findAll({ status, page });
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept order' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  acceptOrder(@Param('id') id: string) {
    return this.ordersService.acceptOrder(id);
  }
}
```

### Pattern 3: DTOs with Swagger Decorators

Define request/response DTOs:

```typescript
// src/modules/orders/dto/create-order.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

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

  @ApiProperty({ description: 'Package description', required: false })
  @IsString()
  @IsOptional()
  packageDescription?: string;
}

// Response DTO
export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty({ enum: ['PENDING', 'ASSIGNED', 'DELIVERING', 'COMPLETED'] })
  status: string;

  @ApiProperty()
  pickupAddress: string;

  @ApiProperty()
  dropoffAddress: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  createdAt: Date;
}
```

### Pattern 4: Hey-API Configuration

Configure Hey-API client generation:

```typescript
// apps/admin/openapi-ts.config.ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  // Input: OpenAPI spec from backend
  input: '../backend/openapi.json',
  // Or fetch directly from running server:
  // input: 'http://localhost:3000/api/docs-json',
  
  output: 'src/client',
  
  plugins: [
    // Generate Fetch-based client
    '@hey-api/client-fetch',
    
    // Generate TypeScript types
    '@hey-api/typescript',
    
    // Generate Zod schemas for validation
    {
      name: 'zod',
      definitions: true,
      requests: true,
      responses: true,
    },
    
    // Generate TanStack Query hooks
    {
      name: '@tanstack/react-query',
      queryOptions: true,
      mutationOptions: true,
      queryKeys: true,
    },
  ],
});
```

### Pattern 5: Package Scripts

Add generation scripts to package.json:

```json
{
  "scripts": {
    "generate:api": "openapi-ts",
    "dev": "npm run generate:api && next dev",
    "build": "npm run generate:api && next build"
  },
  "devDependencies": {
    "@hey-api/openapi-ts": "^0.92.3",
    "@hey-api/client-fetch": "^0.10.0",
    "@hey-api/typescript": "^0.4.0"
  }
}
```

### Pattern 6: Using Generated Client

Use generated TanStack Query hooks:

```typescript
// apps/admin/src/app/orders/page.tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findAllOptions,
  createMutation,
  updateStatusMutation,
  ordersQueryKey,
} from '@/client/tanstack-query.gen';
import { zOrderResponseDto } from '@/client/zod.gen';

export default function OrdersPage() {
  const queryClient = useQueryClient();

  // Fetch orders - fully typed!
  const { data: orders, isLoading } = useQuery({
    ...findAllOptions({
      query: { status: 'PENDING', page: 1, limit: 20 },
    }),
  });

  // Create order mutation
  const createOrder = useMutation({
    ...createMutation(),
    onSuccess: (newOrder) => {
      // Validate response with Zod
      const validated = zOrderResponseDto.parse(newOrder);
      console.log('Created:', validated.orderNumber);
      
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: ordersQueryKey(),
      });
    },
  });

  // Update status mutation
  const updateStatus = useMutation({
    ...updateStatusMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersQueryKey() });
    },
  });

  const handleCreate = () => {
    createOrder.mutate({
      body: {
        pickupAddress: '123 Main St',
        pickupLat: 10.7769,
        pickupLng: 106.7009,
        dropoffAddress: '456 Oak Ave',
        dropoffLat: 10.7629,
        dropoffLng: 106.6822,
      },
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Orders</h1>
      <button onClick={handleCreate}>Create Order</button>
      
      <table>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders?.data?.map((order) => (
            <tr key={order.id}>
              <td>{order.orderNumber}</td>
              <td>{order.status}</td>
              <td>
                <button
                  onClick={() => updateStatus.mutate({
                    path: { id: order.id },
                    body: { status: 'ASSIGNED' },
                  })}
                >
                  Assign
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Pattern 7: Client Configuration

Configure API client with auth and base URL:

```typescript
// apps/admin/src/lib/api.ts
import { client } from '@/client/client.gen';

// Set base URL
client.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

// Add auth interceptor
client.interceptors.request.use((request) => {
  const token = localStorage.getItem('accessToken');
  
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  
  return request;
});

// Handle 401 responses
client.interceptors.response.use((response) => {
  if (response.status === 401) {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }
  
  return response;
});
```

### Pattern 8: Query Client Setup

Configure TanStack Query with generated options:

```typescript
// apps/admin/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30,   // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Pattern 9: Type-Safe API Calls

Use generated types directly:

```typescript
// Direct API calls when not using TanStack Query
import { createOrder, getOrderById } from '@/client/sdk.gen';
import { CreateOrderDto } from '@/client/types.gen';

async function handleOrderCreation(orderData: CreateOrderDto) {
  // Fully typed request and response
  const response = await createOrder({
    body: orderData,
  });
  
  if (response.error) {
    console.error('Error:', response.error);
    return;
  }
  
  // response.data is fully typed as OrderResponseDto
  console.log('Created order:', response.data.orderNumber);
}

async function fetchOrderDetails(orderId: string) {
  const response = await getOrderById({
    path: { id: orderId },
  });
  
  if (response.data) {
    // TypeScript knows all properties
    const { orderNumber, status, pickupAddress } = response.data;
    return { orderNumber, status, pickupAddress };
  }
}
```

## Quick Reference

| Task | Command/Pattern |
|------|-----------------|
| Generate client | `npx @hey-api/openapi-ts` |
| Fetch data | `useQuery({ ...findAllOptions() })` |
| Mutate data | `useMutation({ ...createMutation() })` |
| Invalidate | `queryClient.invalidateQueries({ queryKey: ordersQueryKey() })` |
| Validate | `zOrderResponseDto.parse(data)` |
| Set auth | `client.interceptors.request.use(...)` |

## Generated File Structure

```
src/client/
├── client.gen.ts      # Fetch client configuration
├── sdk.gen.ts         # API functions (createOrder, getOrder, etc.)
├── types.gen.ts       # TypeScript interfaces
├── zod.gen.ts         # Zod validation schemas
└── tanstack-query.gen.ts  # React Query hooks
```

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

- **tanstack-query** - React Query patterns and best practices
- **zod** - Schema validation patterns
- **nestjs-best-practices** - Backend Swagger setup
