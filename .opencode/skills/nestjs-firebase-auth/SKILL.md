---
name: nestjs-firebase-auth
description: Use when implementing Firebase token verification in NestJS backend, creating auth guards, protecting routes, and extracting user info from JWT tokens.
---

# NestJS Firebase Authentication

## Overview

Firebase token verification for NestJS backends. Validates Firebase ID tokens from mobile apps, extracts user information, and protects API routes using Guards and Decorators.

## When to Use

**Use this skill when:**
- Verifying Firebase ID tokens in NestJS
- Protecting API routes with Firebase Auth
- Extracting user info from tokens
- Implementing role-based access control
- Handling token refresh scenarios

**Don't use when:**
- Using custom JWT implementation
- Web-only authentication (use firebase-auth skill)
- Third-party auth providers (Auth0, Clerk)

## Core Patterns

### Pattern 1: Firebase Admin Setup

```typescript
// src/firebase/firebase.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: (configService: ConfigService) => {
        const privateKey = configService
          .get<string>('FIREBASE_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n');

        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
              clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
              privateKey,
            }),
          });
        }

        return admin;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule {}
```

```env
# .env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Pattern 2: Firebase Auth Guard

```typescript
// src/auth/firebase-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as admin from 'firebase-admin';

interface RequestWithUser extends Request {
  user: admin.auth.DecodedIdToken;
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @Inject('FIREBASE_ADMIN') private firebaseAdmin: typeof admin
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify token with Firebase
      const decodedToken = await this.firebaseAdmin
        .auth()
        .verifyIdToken(token);

      // Attach user to request
      request.user = decodedToken;

      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### Pattern 3: Current User Decorator

```typescript
// src/auth/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as admin from 'firebase-admin';

export const CurrentUser = createParamDecorator(
  (data: keyof admin.auth.DecodedIdToken | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as admin.auth.DecodedIdToken;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  }
);
```

### Pattern 4: Protected Controller

```typescript
// src/modules/orders/orders.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '@/auth/firebase-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
@UseGuards(FirebaseAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async getMyOrders(@CurrentUser('uid') userId: string) {
    return this.ordersService.findByUserId(userId);
  }

  @Post()
  async createOrder(
    @CurrentUser() user: any,
    @Body() dto: CreateOrderDto
  ) {
    return this.ordersService.create({
      ...dto,
      customerId: user.uid,
      customerPhone: user.phone_number,
    });
  }

  @Get(':id')
  async getOrder(
    @CurrentUser('uid') userId: string,
    @Param('id') orderId: string
  ) {
    const order = await this.ordersService.findById(orderId);
    
    // Verify ownership
    if (order.customerId !== userId && order.driverId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }
}
```

### Pattern 5: Role-Based Access Control

```typescript
// src/auth/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as admin from 'firebase-admin';

export enum UserRole {
  CUSTOMER = 'customer',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject('FIREBASE_ADMIN') private firebaseAdmin: typeof admin
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as admin.auth.DecodedIdToken;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get custom claims (roles stored in Firebase)
    const userRecord = await this.firebaseAdmin.auth().getUser(user.uid);
    const userRole = userRecord.customClaims?.role as UserRole;

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

```typescript
// Usage in controller
@Controller('admin')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class AdminController {
  @Get('users')
  @Roles(UserRole.ADMIN)
  async getAllUsers() {
    // Only admins can access
  }

  @Get('orders')
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  async getOrders() {
    // Admins and drivers can access
  }
}
```

### Pattern 6: Public Routes

```typescript
// src/auth/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

```typescript
// src/auth/firebase-auth.guard.ts (updated)
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @Inject('FIREBASE_ADMIN') private firebaseAdmin: typeof admin,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // ... rest of guard logic
  }
}
```

```typescript
// Usage
@Controller('webhooks')
export class WebhookController {
  @Post('payment')
  @Public()
  async handlePaymentWebhook(@Body() payload: any) {
    // Public endpoint - no auth required
  }
}
```

### Pattern 7: User Synchronization

```typescript
// src/auth/user-sync.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as admin from 'firebase-admin';

@Injectable()
export class UserSyncService {
  constructor(
    private prisma: PrismaService,
    @Inject('FIREBASE_ADMIN') private firebaseAdmin: typeof admin
  ) {}

  async syncUser(firebaseUid: string) {
    // Get user from Firebase
    const firebaseUser = await this.firebaseAdmin.auth().getUser(firebaseUid);

    // Upsert in local database
    const user = await this.prisma.user.upsert({
      where: { firebaseUid },
      update: {
        phone: firebaseUser.phoneNumber,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        lastSignIn: new Date(),
      },
      create: {
        firebaseUid,
        phone: firebaseUser.phoneNumber,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: 'CUSTOMER', // Default role
        createdAt: new Date(),
        lastSignIn: new Date(),
      },
    });

    return user;
  }

  async setUserRole(firebaseUid: string, role: string) {
    // Set custom claims in Firebase
    await this.firebaseAdmin.auth().setCustomUserClaims(firebaseUid, {
      role,
    });

    // Update local database
    await this.prisma.user.update({
      where: { firebaseUid },
      data: { role },
    });
  }
}
```

## Token Structure

Firebase ID tokens contain these claims:

```json
{
  "uid": "user-unique-id",
  "phone_number": "+84912345678",
  "email": "user@example.com",
  "name": "User Name",
  "picture": "https://...",
  "role": "customer",
  "iat": 1234567890,
  "exp": 1234571490,
  "auth_time": 1234567890
}
```

## Quick Reference

| Task | Implementation |
|------|----------------|
| Protect route | `@UseGuards(FirebaseAuthGuard)` |
| Get user ID | `@CurrentUser('uid') userId` |
| Get full user | `@CurrentUser() user` |
| Public route | `@Public()` decorator |
| Role check | `@Roles(UserRole.ADMIN)` + RolesGuard |
| Verify token | `admin.auth().verifyIdToken(token)` |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Not handling private key newlines | Use `.replace(/\\n/g, '\n')` |
| Missing token extraction | Check `Authorization: Bearer <token>` format |
| Not caching Firebase admin | Initialize only once in module |
| Ignoring token expiration | Firebase handles expiration automatically |
| No user sync | Sync Firebase users to local DB on first request |

## Dependencies

```json
{
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "firebase-admin": "^13.6.0"
  }
}
```

## Related Skills

- **firebase-auth** - Client-side Firebase Auth
- **vietnam-phone-validation** - Phone number validation
- **auth-implementation-patterns** - General auth patterns
