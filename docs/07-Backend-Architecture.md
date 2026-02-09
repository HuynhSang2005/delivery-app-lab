# Logship-MVP: Backend Architecture Document

**Version:** 4.0  
**Last Updated:** February 2026  
**Framework:** NestJS 11.1.x  
**Runtime:** Bun 1.3+  
**Database:** Neon Serverless PostgreSQL + PostGIS  
**ORM:** Prisma 7.x

> **Reference:** See [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md) for complete tech stack details.

---

## 1. Overview

This document provides comprehensive technical architecture for the Logship-MVP backend, covering modular architecture, message queues, caching strategies, API client generation, and security patterns.

### 1.1. Architecture Principles

| Principle | Implementation |
|-----------|----------------|
| **Modular Monolith** | Feature-based modules with clear boundaries |
| **Layered Architecture** | Controller → Service → Repository pattern |
| **Type Safety** | End-to-end TypeScript with Hey-API client generation |
| **Defense in Depth** | Multiple security layers (auth, validation, rate limiting) |

### 1.2. High-Level Architecture Diagram

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                      CLIENTS                                 │
                                    ├─────────────────────────────────────────────────────────────┤
                                    │  Mobile App (React Native)    │    Admin Dashboard (Next.js) │
                                    │  - User App                   │    - Hey-API Generated       │
                                    │  - Driver App                 │      TypeScript Client       │
                                    └──────────────┬────────────────┴──────────────┬───────────────┘
                                                   │                               │
                                                   │  HTTPS / WSS                  │
                                                   ▼                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         NESTJS BACKEND                                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                       │
│  ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐   ┌──────────────────┐  │
│  │   API Layer         │   │   WebSocket Layer   │   │   Background Jobs   │   │   Swagger/OpenAPI│  │
│  │   (REST Controllers)│   │   (Socket.io)       │   │   (BullMQ Workers)  │   │   (Auto-gen)     │  │
│  │                     │   │                     │   │                     │   │                  │  │
│  │  - Auth Module      │   │  - EventsGateway    │   │  - NotificationQueue│   │  → Hey-API       │  │
│  │  - Users Module     │   │  - LocationGateway  │   │  - LocationQueue    │   │    Client Gen    │  │
│  │  - Drivers Module   │   │  - ChatGateway      │   │  - OrderMatchQueue  │   │                  │  │
│  │  - Orders Module    │   │                     │   │  - ReportQueue      │   │                  │  │
│  │  - Chat Module      │   │                     │   │                     │   │                  │  │
│  │  - Admin Module     │   │                     │   │                     │   │                  │  │
│  └─────────┬───────────┘   └─────────┬───────────┘   └─────────┬───────────┘   └──────────────────┘  │
│            │                         │                         │                                      │
│            └─────────────────────────┴─────────────────────────┘                                      │
│                                      │                                                                │
│  ┌───────────────────────────────────┴───────────────────────────────────────────────────────────┐   │
│  │                              SHARED INFRASTRUCTURE                                              │   │
│  │                                                                                                 │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐   │   │
│  │  │  Prisma ORM     │  │  RedisService   │  │  GeoService     │  │  Common Guards/Pipes    │   │   │
│  │  │  (Database      │  │  (Cache/PubSub) │  │  (PostGIS)      │  │  - JwtAuthGuard         │   │   │
│  │  │   Access Layer) │  │                 │  │                 │  │  - RolesGuard           │   │   │
│  │  │                 │  │                 │  │                 │  │  - ThrottlerGuard       │   │   │
│  │  └────────┬────────┘  └────────┬────────┘  └─────────────────┘  │  - ValidationPipe       │   │   │
│  │           │                    │                                └─────────────────────────┘   │   │
│  └───────────┼────────────────────┼──────────────────────────────────────────────────────────────┘   │
│              │                    │                                                                   │
└──────────────┼────────────────────┼───────────────────────────────────────────────────────────────────┘
               │                    │
               ▼                    ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│   Neon PostgreSQL    │  │   Upstash Redis      │  │   Firebase Auth      │  │   Cloudinary         │
│   + PostGIS          │  │                      │  │   (Phone OTP)        │  │   (Images)           │
│                      │  │   - BullMQ Queues    │  │                      │  │                      │
│   - Users            │  │   - Driver Geo Cache │  │   - OTP Verify       │  │   - Avatars          │
│   - Orders           │  │   - Session Store    │  │   - Email Link Auth  │  │   - Proof Images     │
│   - Messages         │  │   - Socket Adapter   │  │   - ID Tokens        │  │   - Driver Docs      │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

> **IMPORTANT:** Neon is the **Database** (PostgreSQL), Prisma is the **ORM** (Object-Relational Mapping tool).

---

## 2. Complete Package.json

```json
{
  "name": "@logship/api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "bunx nest build",
    "dev": "bunx nest start --watch",
    "start": "bun run dist/main",
    "start:debug": "bunx nest start --debug --watch",
    "start:prod": "bun run dist/main",
    "lint": "bunx eslint \"{src,apps,libs,test}/**/*.ts\"",
    "test": "bunx jest",
    "test:e2e": "bunx jest --config ./test/jest-e2e.json",
    "db:generate": "bunx prisma generate",
    "db:migrate": "bunx prisma migrate dev",
    "db:studio": "bunx prisma studio",
    "db:seed": "bunx ts-node prisma/seed.ts"
  },
  "dependencies": {
    "@nestjs/bullmq": "^11.1.6",
    "@nestjs/common": "^11.1.6",
    "@nestjs/config": "^4.0.0",
    "@nestjs/core": "^11.1.6",
    "@nestjs/jwt": "^11.1.6",
    "@nestjs/passport": "^11.1.6",
    "@nestjs/platform-express": "^11.1.6",
    "@nestjs/platform-socket.io": "^11.1.6",
    "@nestjs/schedule": "^5.0.1",
    "@nestjs/swagger": "^11.1.6",
    "@nestjs/terminus": "^11.0.1",
    "@nestjs/throttler": "^6.5.0",
    "@nestjs/websockets": "^11.1.6",
    "@prisma/client": "^7.3.0",
    "bullmq": "^5.50.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "cloudinary": "^2.5.0",
    "date-fns": "^4.1.0",
    "firebase-admin": "^13.0.0",
    "ioredis": "^5.4.0",
    "lodash": "^4.17.21",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0",
    "socket.io": "^4.8.0",
    "socket.io-redis-adapter": "^8.0.0",
    "uuid": "^11.0.0",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.0",
    "@types/lodash": "^4.17.0",
    "@types/multer": "^1.4.0",
    "@types/node": "^20.0.0",
    "@types/passport-jwt": "^4.0.0",
    "@types/uuid": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.7.0",
    "prettier": "^3.4.0",
    "prisma": "^7.3.0",
    "ts-jest": "^29.2.0",
    "ts-node": "^10.9.0",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.0"
  }
}
```

### 2.1. Essential Libraries Overview

| Category | Library | Version | Purpose |
|----------|---------|---------|---------|
| **Core** | `@nestjs/*` | ^11.1.6 | NestJS framework |
| **API Docs** | `@nestjs/swagger` | ^11.1.6 | OpenAPI/Swagger |
| **Validation** | `class-validator` | ^0.14.0 | DTO validation |
| **Transform** | `class-transformer` | ^0.5.1 | Object transformation |
| **ORM** | `@prisma/client` | ^7.3.0 | **Prisma ORM** |
| **ORM CLI** | `prisma` | ^7.3.0 | **Prisma CLI** |
| **Queue** | `bullmq` | ^5.0.0 | Message queues |
| **Redis** | `ioredis` | ^5.4.0 | Redis client |
| **Auth** | `@nestjs/jwt` | ^11.1.6 | JWT tokens |
| **Auth** | `@nestjs/passport` | ^11.1.6 | Passport integration |
| **Auth** | `passport-jwt` | ^4.0.0 | JWT strategy |
| **Auth** | `firebase-admin` | ^13.0.0 | Firebase Auth |
| **WebSocket** | `@nestjs/websockets` | ^11.1.6 | Socket.io |
| **WebSocket** | `socket.io` | ^4.8.0 | Socket.io server |
| **WebSocket** | `socket.io-redis-adapter` | ^8.0.0 | Redis adapter |
| **Rate Limit** | `@nestjs/throttler` | ^6.5.0 | Rate limiting |
| **Health** | `@nestjs/terminus` | ^11.0.1 | Health checks |
| **Schedule** | `@nestjs/schedule` | ^5.0.1 | Cron jobs |
| **Storage** | `cloudinary` | ^2.5.0 | Image storage |
| **Utilities** | `lodash` | ^4.17.21 | Utility functions |
| **Utilities** | `uuid` | ^11.0.0 | UUID generation |
| **Utilities** | `date-fns` | ^4.1.0 | Date formatting |
| **Schema** | `zod` | ^4.3.6 | Schema validation (Zod v4 - latest) |

> **CRITICAL DISTINCTION:**
> - **Neon** = Database (Serverless PostgreSQL)
> - **Prisma** = ORM (Tool to interact with the database)
> - **PostGIS** = PostgreSQL extension for geospatial data

---

## 3. Simplified Backend Folder Structure

For a solo developer MVP, we use a simplified modular structure:

```
apps/api/
├── src/
│   ├── main.ts                          # Entry point
│   ├── app.module.ts                    # Root module
│   │
│   ├── config/                          # Configuration
│   │   ├── database.config.ts           # Neon PostgreSQL config
│   │   ├── firebase.config.ts           # Firebase Auth config
│   │   └── swagger.config.ts            # OpenAPI/Swagger setup
│   │
│   ├── common/                          # Shared infrastructure
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── dto/
│   │   │   └── pagination.dto.ts
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts
│   │       └── roles.guard.ts
│   │
│   ├── database/                        # Database layer (Prisma + Neon)
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts            # Prisma Client
│   │   └── geo.service.ts               # PostGIS helpers
│   │
│   ├── modules/                         # Feature modules (Simplified)
│   │   │
│   │   ├── auth/                        # Auth Module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── dto/
│   │   │       ├── send-otp.dto.ts
│   │   │       └── verify-otp.dto.ts
│   │   │
│   │   ├── users/                       # Users Module
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-user.dto.ts
│   │   │
│   │   ├── drivers/                     # Drivers Module
│   │   │   ├── drivers.module.ts
│   │   │   ├── drivers.controller.ts
│   │   │   ├── drivers.service.ts
│   │   │   └── dto/
│   │   │       └── driver.dto.ts
│   │   │
│   │   ├── orders/                      # Orders Module
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   └── dto/
│   │   │       ├── create-order.dto.ts
│   │   │       └── update-status.dto.ts
│   │   │
│   │   ├── chat/                        # Chat Module
│   │   │   ├── chat.module.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── chat.service.ts
│   │   │   └── dto/
│   │   │       └── message.dto.ts
│   │   │
│   │   └── admin/                       # Admin Module
│   │       ├── admin.module.ts
│   │       ├── admin.controller.ts
│   │       └── admin.service.ts
│   │
│   └── gateway/                         # WebSocket Gateway
│       ├── gateway.module.ts
│       └── events.gateway.ts
│
├── prisma/
│   ├── schema.prisma                    # Prisma schema
│   └── migrations/                      # Database migrations
│
└── package.json
```

**Note:** This simplified structure removes:
- Separate repository layer (use Prisma directly in services)
- Complex sub-folders (entities/, errors/, interceptors/, listeners/)
- BullMQ queues (use simple async/await for MVP)
- Redis caching (use in-memory or skip for MVP)

---

## 3.1 NestJS Module Structure Best Practices

### Module Components Overview

Each feature module MUST follow this structure:

```
modules/feature/
├── feature.module.ts          # Module definition
├── feature.controller.ts      # Route handlers
├── feature.service.ts         # Business logic
├── feature.repository.ts      # Database access (Repository Pattern)
├── dto/                       # Data Transfer Objects
│   ├── create-feature.dto.ts
│   ├── update-feature.dto.ts
│   └── index.ts
├── entities/                  # Domain entities
│   └── feature.entity.ts
├── errors/                    # Custom errors/exceptions
│   ├── feature.errors.ts
│   └── index.ts
├── guards/                    # Route guards (if needed)
├── pipes/                     # Validation pipes (if needed)
├── decorators/                # Custom decorators (if needed)
├── interceptors/              # Interceptors (if needed)
└── listeners/                 # Event listeners (if needed)
```

### Component Responsibilities

| Component | Responsibility | Example |
|-----------|---------------|---------|
| **Controller** | Handle HTTP requests/responses | `@Controller('users')` |
| **Service** | Business logic, orchestration | `UsersService.createUser()` |
| **Repository** | Database access, queries | `UsersRepository.findByEmail()` |
| **DTO** | Data validation, transformation | `CreateUserDto` with class-validator |
| **Entity** | Domain model, type definition | `UserEntity` interface/class |
| **Error** | Custom exceptions | `UserNotFoundError` extends `NotFoundException` |
| **Guard** | Authorization checks | `JwtAuthGuard`, `RolesGuard` |
| **Pipe** | Input validation/transformation | `ValidationPipe`, `ParseIntPipe` |
| **Interceptor** | Cross-cutting concerns | `LoggingInterceptor`, `TransformInterceptor` |
| **Decorator** | Metadata, custom logic | `@CurrentUser()`, `@Public()` |

### Repository Pattern Implementation

```typescript
// users.repository.ts
@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
```

### Custom Errors Pattern

```typescript
// errors/user.errors.ts
import { NotFoundException, ConflictException } from '@nestjs/common';

export class UserNotFoundError extends NotFoundException {
  constructor(userId: string) {
    super(`User with ID "${userId}" not found`);
  }
}

export class UserAlreadyExistsError extends ConflictException {
  constructor(email: string) {
    super(`User with email "${email}" already exists`);
  }
}

// errors/index.ts
export * from './user.errors';
```

### Guards Implementation

```typescript
// guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add custom logic here
    return super.canActivate(context);
  }
}

// guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!roles) return true;
    
    const { user } = context.switchToHttp().getRequest();
    return roles.includes(user.role);
  }
}
```

### Pipes Implementation

```typescript
// pipes/validation.pipe.ts
@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Custom validation logic
    return value;
  }
}

// pipes/parse-object-id.pipe.ts
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isValidObjectId(value)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    return value;
  }
}
```

### Interceptors Implementation

```typescript
// interceptors/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        console.log(`${request.method} ${request.url} - ${duration}ms`);
      }),
    );
  }
}

// interceptors/transform.interceptor.ts
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### Custom Decorators

```typescript
// decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// decorators/roles.decorator.ts
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// decorators/public.decorator.ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### Lifecycle Hooks

```typescript
@Injectable()
export class UsersService implements OnModuleInit, OnModuleDestroy {
  onModuleInit() {
    // Called when module initialized
    console.log('UsersService initialized');
  }

  onModuleDestroy() {
    // Called when module destroyed
    console.log('UsersService destroyed');
  }
}
```

### Module Definition

```typescript
// users.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
```

---

## 4. Database Architecture (Neon + PostGIS + Prisma)

### 4.1. Technology Stack

| Component | Technology | Role |
|-----------|------------|------|
| **Database** | **Neon** | Serverless PostgreSQL 17+ |
| **Extension** | **PostGIS** | Geospatial queries |
| **ORM** | **Prisma** | 7.x - Database access layer |

### 4.2. Connection Configuration

```typescript
// src/config/database.config.ts
export const databaseConfig = {
  // Neon PostgreSQL connection string
  // Use pooled connection for serverless
  url: process.env.DATABASE_URL,
  
  // Prisma Client options
  prismaOptions: {
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error'] 
      : ['error'],
  },
};
```

```env
# .env
# Neon PostgreSQL - Use pooled connection for serverless
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Direct connection (for migrations)
DATABASE_URL_DIRECT="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### 4.3. Prisma Schema Example

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]
}

model User {
  id          String   @id @default(uuid())
  phone       String   @unique
  firebaseUid String?  @unique
  name        String?
  avatarUrl   String?
  role        UserRole @default(USER)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("users")
}

enum UserRole {
  USER
  DRIVER
  ADMIN
}
```

### 4.4. PostGIS Geospatial Queries

```typescript
// src/database/geo.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class GeoService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find nearest active drivers using PostGIS
   * Runs on Neon PostgreSQL with PostGIS extension
   */
  async findNearestDrivers(
    lat: number,
    lng: number,
    radiusMeters: number = 5000,
    limit: number = 5,
  ) {
    // Raw query using PostGIS functions
    return this.prisma.$queryRaw`
      SELECT 
        d.id,
        d.user_id,
        u.name,
        u.phone,
        ST_Distance(
          d.last_location, 
          ST_MakePoint(${lng}, ${lat})::geography
        ) as distance_meters
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
}
```

---

## 5. Background Jobs (Optional for MVP)

> **Note:** For MVP with 50 concurrent users, you can skip BullMQ and use simple async/await. 
> Add BullMQ only if you need to process heavy background tasks.

### When to Use BullMQ
- Processing large exports
- Sending bulk notifications
- Heavy image processing

### Simple Alternative
```typescript
// Just use async/await in services
async sendNotification(data: NotificationData) {
  // Process immediately or use setTimeout for delay
  setTimeout(() => {
    this.processNotification(data);
  }, 1000);
}
```

---

## 6. Caching (Optional for MVP)

> **Note:** For MVP scale, you can skip Redis caching and rely on:
> - Prisma's built-in query caching
> - PostgreSQL's query planner
> - NestJS in-memory cache (optional)

### When to Add Redis
- Database queries become slow (>100ms)
- High read-to-write ratio
- Need rate limiting

---

## 7. Hey-API Client Generation

### 7.1. Swagger Configuration

```typescript
// src/config/swagger.config.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Logship API')
    .setDescription('Logship-MVP Delivery App API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Export for Hey-API generation
  return document;
}
```

---

## 8. Environment Variables

### 8.1. .env File

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_DIRECT="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Redis (Upstash)
REDIS_URL="rediss://default:pass@host.upstash.io:6379"

# Firebase
FIREBASE_PROJECT_ID="your-project"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="your-key"
CLOUDINARY_API_SECRET="your-secret"

# JWT
JWT_SECRET="your-secret"
JWT_EXPIRES_IN="15m"

# Goong Maps
GOONG_API_KEY="your-goong-key"
```

---

## 9. Commands Reference

| Command | Description |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun run dev` | Start development server with hot reload |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run db:generate` | Generate Prisma Client |
| `bun run db:migrate` | Run database migrations |
| `bun run db:studio` | Open Prisma Studio |
| `bun run test` | Run tests |
| `bun run lint` | Run ESLint |

---

## 10. Related Documents

| Document | Description |
|----------|-------------|
| [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md) | Complete tech stack specification |
| [01-SDD-System-Design-Document.md](./01-SDD-System-Design-Document.md) | System architecture |
| [02-Database-Design-Document.md](./02-Database-Design-Document.md) | Neon + PostGIS schema details |
| [03-API-Design-Document.md](./03-API-Design-Document.md) | API endpoints |
| [04-Mobile-App-Technical-Spec.md](./04-Mobile-App-Technical-Spec.md) | Mobile app |
| [05-Admin-Dashboard-Spec.md](./05-Admin-Dashboard-Spec.md) | Admin dashboard |
| [08-Monorepo-Structure.md](./08-Monorepo-Structure.md) | Monorepo setup with Bun |

---

## 11. Key Distinctions

### 11.1. Database vs ORM

| Term | Definition | Example |
|------|------------|---------|
| **Neon** | Serverless PostgreSQL database provider | Hosts the actual data |
| **PostgreSQL** | Relational database management system | Stores tables, indexes |
| **PostGIS** | PostgreSQL extension for geospatial data | Enables geo queries |
| **Prisma** | ORM (Object-Relational Mapping) tool | Generates type-safe database client |
| **Prisma Client** | Auto-generated database client | Used in code to query database |

### 11.2. Correct Terminology

✅ **CORRECT:**
- "We use **Neon** as our database"
- "We use **Prisma** as our ORM to access the database"
- "**PostGIS** is enabled on our Neon PostgreSQL database"

❌ **INCORRECT:**
- "We use Prisma as our database" ← WRONG
- "Prisma stores our data" ← WRONG

### 11.3. Architecture Simplification for MVP

**Skipped for MVP (can add later):**
- ❌ BullMQ queues → Use async/await
- ❌ Redis caching → Rely on PostgreSQL
- ❌ Redis GEO → Use PostGIS for all geo queries
- ❌ CQRS pattern → Simple CRUD operations
- ❌ Complex folder structure → Simplified modules

**Keep for MVP:**
- ✅ Modular monolith structure
- ✅ Repository pattern (can use Prisma directly)
- ✅ Guards for authentication
- ✅ Swagger/OpenAPI documentation
- ✅ WebSocket for real-time (optional, can use SSE)

---

**END OF DOCUMENT**
