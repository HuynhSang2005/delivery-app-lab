# Logship-MVP: Backend Architecture Document

**Version:** 5.0  
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

### 1.2. Business Logic Overview

**Pricing Model:**
- **Giá cố định:** 8.000 VND/km
- **Platform Fee:** 15% giá đơn
- **Max Distance:** 25km (Hồ Chí Minh)

**Driver Matching:**
- **Timeout:** 5 phút
- **Radius:** 3km → 5km → 7km
- **Priority:** Rating cao
- **Surge:** +20% khi mở rộng

**Location Tracking:**
- **Frequency:** 30 giây/lần
- **Adaptive:** 10 giây/lần khi gần đích (<500m)

**Cancellation:**
- **Customer:** Free 5 phút, sau đó 10%
- **Driver:** Max 3 lần/ngày, -10 rating/lần

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
    "@nestjs/bullmq": "^11.0.4",
    "@nestjs/common": "^11.1.13",
    "@nestjs/config": "^4.0.3",
    "@nestjs/core": "^11.1.13",
    "@nestjs/jwt": "^11.0.2",
    "@nestjs/passport": "^11.0.5",
    "@nestjs/platform-express": "^11.1.13",
    "@nestjs/platform-socket.io": "^11.1.13",
    "@nestjs/schedule": "^5.0.1",
    "@nestjs/swagger": "^11.2.6",
    "@nestjs/terminus": "^11.0.1",
    "@nestjs/throttler": "^6.5.0",
    "@nestjs/websockets": "^11.1.13",
    "@prisma/client": "^7.4.0",
    "bullmq": "^5.69.1",
    "cloudinary": "^2.9.0",
    "date-fns": "^4.1.0",
    "firebase-admin": "^13.6.1",
    "ioredis": "^5.9.3",
    "lodash": "^4.17.21",
    "nestjs-zod": "^5.1.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0",
    "socket.io": "^4.8.3",
    "@socket.io/redis-adapter": "^8.3.0",
    "uuid": "^13.0.0",
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
    "prisma": "^7.4.0",
    "ts-jest": "^29.2.0",
    "ts-node": "^10.9.0",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.9.3"
  }
}
```

### 2.1. Essential Libraries Overview

| Category | Library | Version | Purpose |
|----------|---------|---------|---------|
| **Core** | `@nestjs/*` | ^11.1.13 | NestJS framework |
| **API Docs** | `@nestjs/swagger` | ^11.2.6 | OpenAPI/Swagger |
| **Validation** | `zod` | ^4.3.6 | Schema validation (Zod v4) |
| **Validation** | `nestjs-zod` | ^5.1.1 | Zod integration for NestJS |
| **ORM** | `@prisma/client` | ^7.4.0 | **Prisma ORM** |
| **ORM CLI** | `prisma` | ^7.4.0 | **Prisma CLI** |
| **Queue** | `bullmq` | ^5.69.1 | Message queues |
| **Redis** | `ioredis` | ^5.9.3 | Redis client |
| **Auth** | `@nestjs/jwt` | ^11.0.2 | JWT tokens |
| **Auth** | `@nestjs/passport` | ^11.0.5 | Passport integration |
| **Auth** | `passport-jwt` | ^4.0.1 | JWT strategy |
| **Auth** | `firebase-admin` | ^13.6.1 | Firebase Auth |
| **WebSocket** | `@nestjs/websockets` | ^11.1.13 | Socket.io |
| **WebSocket** | `socket.io` | ^4.8.3 | Socket.io server |
| **WebSocket** | `@socket.io/redis-adapter` | ^8.3.0 | Redis adapter |
| **Rate Limit** | `@nestjs/throttler` | ^6.5.0 | Rate limiting |
| **Health** | `@nestjs/terminus` | ^11.0.1 | Health checks |
| **Schedule** | `@nestjs/schedule` | ^5.0.1 | Cron jobs |
| **Storage** | `cloudinary` | ^2.9.0 | Image storage |
| **Utilities** | `lodash` | ^4.17.21 | Utility functions |
| **Utilities** | `uuid` | ^13.0.0 | UUID generation |
| **Utilities** | `date-fns` | ^4.1.0 | Date formatting |
| **Schema** | `zod` | ^4.3.6 | Schema validation (Zod v4 - latest) |

> **CRITICAL DISTINCTION:**
> - **Neon** = Database (Serverless PostgreSQL)
> - **Prisma** = ORM (Tool to interact with the database)
> - **PostGIS** = PostgreSQL extension for geospatial data

---

## 3. Backend Folder Structure with Repository Pattern

We use a modular structure with Repository Pattern for data access abstraction:

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
│   ├── common/                          # Shared infrastructure (@Global)
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   ├── zod-exception.filter.ts
│   │   │   └── all-exceptions.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   │
│   ├── database/                        # Database layer (Prisma + Neon)
│   │   ├── database.module.ts
│   │   ├── prisma.service.ts            # Prisma Client
│   │   └── geo.service.ts               # PostGIS helpers
│   │
│   ├── infrastructure/                  # External services
│   │   ├── firebase/
│   │   │   ├── firebase.module.ts
│   │   │   ├── firebase.service.ts
│   │   │   └── firebase.types.ts
│   │   ├── redis/
│   │   │   ├── redis.module.ts
│   │   │   └── redis.service.ts
│   │   ├── cloudinary/
│   │   │   ├── cloudinary.module.ts
│   │   │   └── cloudinary.service.ts
│   │   └── queues/
│   │       ├── queues.module.ts
│   │       └── processors/
│   │           ├── notification.processor.ts
│   │           └── order-matching.processor.ts
│   │
│   ├── gateway/                         # WebSocket Gateway
│   │   ├── gateway.module.ts
│   │   └── events.gateway.ts
│   │
│   └── modules/                         # Feature modules with Repository Pattern
│       │
│       ├── auth/                        # Auth Module
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── dto/
│       │   │   ├── login.dto.ts
│       │   │   └── register.dto.ts
│       │   └── interfaces/
│       │       └── auth.interface.ts
│       │
│       ├── users/                       # Users Module
│       │   ├── users.module.ts
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   ├── dto/
│       │   │   ├── create-user.dto.ts
│       │   │   └── update-user.dto.ts
│       │   ├── repositories/
│       │   │   ├── users.repository.ts
│       │   │   └── users.repository.interface.ts
│       │   └── interfaces/
│       │       └── user.interface.ts
│       │
│       ├── drivers/                     # Drivers Module
│       │   ├── drivers.module.ts
│       │   ├── drivers.controller.ts
│       │   ├── drivers.service.ts
│       │   ├── dto/
│       │   │   ├── create-driver.dto.ts
│       │   │   └── update-location.dto.ts
│       │   ├── repositories/
│       │   │   ├── drivers.repository.ts
│       │   │   └── drivers.repository.interface.ts
│       │   └── interfaces/
│       │       └── driver.interface.ts
│       │
│       ├── orders/                      # Orders Module
│       │   ├── orders.module.ts
│       │   ├── orders.controller.ts
│       │   ├── orders.service.ts
│       │   ├── dto/
│       │   │   ├── create-order.dto.ts
│       │   │   └── update-status.dto.ts
│       │   ├── repositories/
│       │   │   ├── orders.repository.ts
│       │   │   └── orders.repository.interface.ts
│       │   └── interfaces/
│       │       └── order.interface.ts
│       │
│       ├── chat/                        # Chat Module
│       │   ├── chat.module.ts
│       │   ├── chat.controller.ts
│       │   ├── chat.service.ts
│       │   ├── dto/
│       │   │   ├── create-message.dto.ts
│       │   │   └── create-conversation.dto.ts
│       │   ├── repositories/
│       │   │   ├── chat.repository.ts
│       │   │   └── chat.repository.interface.ts
│       │   └── interfaces/
│       │       └── chat.interface.ts
│       │
│       └── admin/                       # Admin Module
│           ├── admin.module.ts
│           ├── admin.controller.ts
│           ├── admin.service.ts
│           ├── dto/
│           └── repositories/
│               └── admin.repository.ts
│
├── prisma/
│   ├── schema.prisma                    # Prisma schema
│   └── migrations/                      # Database migrations
│
└── package.json
```

**Key Features:**
- **Repository Pattern**: Each feature module has repositories/ folder with interface + implementation
- **Dependency Inversion**: Services depend on repository interfaces, not concrete implementations
- **Testability**: Easy to mock repositories for unit testing
- **Flexibility**: Can swap database implementations without affecting business logic
- **PostGIS Support**: Complex geospatial queries centralized in repositories

---

## 3.1 NestJS Module Structure Best Practices

> **Architecture Decision:** This project uses the Repository Pattern for all data access. See [ADR-007: Repository Pattern](../adr/ADR-007-repository-pattern.md) for the rationale.

### Module Components Overview

Each feature module MUST follow this structure with Repository Pattern:

```
modules/feature/
├── feature.module.ts                    # Module definition
├── feature.controller.ts                # Route handlers
├── feature.service.ts                   # Business logic
├── dto/                                 # Data Transfer Objects
│   ├── create-feature.dto.ts
│   ├── update-feature.dto.ts
│   └── index.ts
├── repositories/                        # Repository Pattern
│   ├── feature.repository.ts            # Implementation
│   └── feature.repository.interface.ts  # Interface
├── interfaces/                          # Domain interfaces
│   └── feature.interface.ts
└── errors/                              # Custom errors (optional)
    └── feature.errors.ts
```

### Component Responsibilities

| Component | Responsibility | Example |
|-----------|---------------|---------|
| **Controller** | Handle HTTP requests/responses | `@Controller('users')` |
| **Service** | Business logic, orchestration | `UsersService.createUser()` |
| **Repository** | Database access, queries | `UsersRepository.findByEmail()` |
| **DTO** | Data validation, transformation | `CreateUserDto` with Zod schema |
| **Entity** | Domain model, type definition | `UserEntity` interface/class |
| **Error** | Custom exceptions | `UserNotFoundError` extends `NotFoundException` |
| **Guard** | Authorization checks | `JwtAuthGuard`, `RolesGuard` |
| **Pipe** | Input validation/transformation | `ValidationPipe`, `ParseIntPipe` |
| **Interceptor** | Cross-cutting concerns | `LoggingInterceptor`, `TransformInterceptor` |
| **Decorator** | Metadata, custom logic | `@CurrentUser()`, `@Public()` |

### Repository Pattern Implementation

#### Interface Definition

```typescript
// repositories/users.repository.interface.ts
export interface IUsersRepository {
  findById(id: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findByFirebaseUid(firebaseUid: string): Promise<User | null>;
  findAll(options: PaginationOptions): Promise<User[]>;
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}

// Token for Dependency Injection
export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');
```

#### Repository Implementation

```typescript
// repositories/users.repository.ts
@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { firebaseUid } });
  }

  async findAll(options: PaginationOptions): Promise<User[]> {
    return this.prisma.user.findMany({
      skip: options.skip,
      take: options.take,
      orderBy: { createdAt: 'desc' },
    });
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

  async count(): Promise<number> {
    return this.prisma.user.count();
  }
}
```

#### Module Configuration

```typescript
// users.module.ts
@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USERS_REPOSITORY,
      useClass: UsersRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
```

#### Service Usage

```typescript
// users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private usersRepository: IUsersRepository,
    private firebaseService: FirebaseService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    return user;
  }

  async createUser(data: CreateUserDto): Promise<User> {
    // Business logic
    const existing = await this.usersRepository.findByPhone(data.phone);
    if (existing) {
      throw new UserAlreadyExistsError(data.phone);
    }

    return this.usersRepository.create(data);
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

// Use NestJS built-in ParseUUIDPipe instead of custom ParseObjectIdPipe
// Example: @Param('id', ParseUUIDPipe) id: string
// Import from: import { ParseUUIDPipe } from '@nestjs/common';
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
| **ORM** | **Prisma** | 7.4.0 - Database access layer |

> **⚠️ BREAKING CHANGE (Prisma 7.4.0):** Prisma 7 introduces significant changes including ESM support requirement, driver adapters, and new configuration file. See [Prisma 7 Migration Guide](#48-prisma-7-migration-guide) below.

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

### 4.3. Prisma Schema Example (Prisma 7.4.0)

> **⚠️ BREAKING CHANGE:** Prisma 7.4.0 requires new schema format with output path and removes datasource URL (moved to `prisma.config.ts`).

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

### 4.4. Prisma Configuration File (Prisma 7.4.0)

> **⚠️ NEW REQUIREMENT:** Prisma 7.4.0 requires `prisma.config.ts` file for datasource configuration.

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

### 4.5. PrismaClient with Driver Adapter (Prisma 7.4.0)

> **⚠️ BREAKING CHANGE:** Prisma 7 requires driver adapters for database connections.

```typescript
// src/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neon } from '@neondatabase/serverless';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public readonly client: PrismaClient;

  constructor() {
    // Create driver adapter for Neon PostgreSQL
    const sql = neon(process.env.DATABASE_URL!);
    const adapter = new PrismaNeon(sql);

    this.client = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error'],
    });
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
```

**Required dependency:**
```bash
bun add @prisma/adapter-neon
```

### 4.6. PostGIS Geospatial Queries in Repository Pattern

Geospatial queries are centralized in the Drivers Repository:

```typescript
// modules/drivers/repositories/drivers.repository.interface.ts
export interface IDriversRepository {
  findById(id: string): Promise<Driver | null>;
  findByUserId(userId: string): Promise<Driver | null>;
  findNearestDrivers(
    lat: number,
    lng: number,
    radius: number,
    limit: number,
  ): Promise<Driver[]>;
  findActiveDrivers(): Promise<Driver[]>;
  create(data: CreateDriverDto): Promise<Driver>;
  updateLocation(
    driverId: string,
    lat: number,
    lng: number,
  ): Promise<Driver>;
  updateStatus(
    driverId: string,
    status: DriverStatus,
  ): Promise<Driver>;
}

export const DRIVERS_REPOSITORY = Symbol('DRIVERS_REPOSITORY');
```

```typescript
// modules/drivers/repositories/drivers.repository.ts
@Injectable()
export class DriversRepository implements IDriversRepository {
  constructor(
    private prisma: PrismaService,
    private geoService: GeoService,
  ) {}

  async findById(id: string): Promise<Driver | null> {
    return this.prisma.driver.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  /**
   * Find nearest active drivers using PostGIS
   * Centralized geospatial query in Repository
   */
  async findNearestDrivers(
    lat: number,
    lng: number,
    radius: number = 5000,
    limit: number = 10,
  ): Promise<Driver[]> {
    return this.prisma.$queryRaw`
      SELECT 
        d.*, 
        u.name, 
        u.phone, 
        u.avatar_url,
        ST_Distance(
          d.current_location,
          ST_MakePoint(${lng}, ${lat})::geography
        ) as distance
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'ACTIVE'
        AND d.is_approved = true
        AND d.is_online = true
        AND ST_DWithin(
          d.current_location,
          ST_MakePoint(${lng}, ${lat})::geography,
          ${radius}
        )
      ORDER BY distance
      LIMIT ${limit}
    `;
  }

  async updateLocation(
    driverId: string,
    lat: number,
    lng: number,
  ): Promise<Driver> {
    return this.prisma.driver.update({
      where: { id: driverId },
      data: {
        currentLocation: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        lastLocationAt: new Date(),
      },
    });
  }

  // ... other methods
}
```

### 4.7. ESM Configuration (Prisma 7.4.0)

> **⚠️ BREAKING CHANGE:** Prisma 7 requires ESM support.

```json
// package.json
{
  "name": "@logship/api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "bunx nest build",
    "dev": "bunx nest start --watch",
    "db:generate": "bunx prisma generate",
    "db:migrate": "bunx prisma migrate dev",
    "db:studio": "bunx prisma studio"
  }
}
```

### 4.8. Prisma 7 Migration Guide

#### Before (Prisma 6.x)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```typescript
// Old PrismaClient instantiation
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
```

#### After (Prisma 7.4.0)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

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

```typescript
// New PrismaClient instantiation with driver adapter
import { PrismaClient } from '../generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const adapter = new PrismaNeon(sql);

export const prisma = new PrismaClient({ adapter });
```

#### Migration Checklist

- [ ] Add `"type": "module"` to package.json
- [ ] Update generator block with `output` path
- [ ] Remove `url` from datasource block
- [ ] Create `prisma.config.ts` file
- [ ] Install `@prisma/adapter-neon` package
- [ ] Update all PrismaClient imports to use generated path
- [ ] Add driver adapter to PrismaClient instantiation
- [ ] Run `bunx prisma generate` to regenerate client

---

## 5. Background Jobs (BullMQ)

### 5.1. Required Queues

| Queue | Purpose | Priority |
|-------|---------|----------|
| `order-matching` | Driver matching with 5min timeout | HIGH |
| `location-batch` | Batch insert location updates | MEDIUM |
| `notifications` | Push notifications | MEDIUM |

### 5.2. Order Matching Processor

**Business Rules:**
- **Initial Radius:** 3km
- **Timeout:** 5 phút
- **Expansion:** 5km → 7km
- **Surge:** +20% khi mở rộng

```typescript
// src/modules/orders/processors/order-matching.processor.ts
@Processor('order-matching')
export class OrderMatchingProcessor {
  constructor(
    private ordersService: OrdersService,
    private driversService: DriversService,
    private geoService: GeoService,
  ) {}

  @Process('find-driver')
  async handleFindDriver(job: Job<{ orderId: string }>) {
    const { orderId } = job.data;
    const order = await this.ordersService.findById(orderId);
    
    if (!order || order.status !== 'pending') return;

    // Phase 1: Search 3km radius
    let drivers = await this.driversService.findNearest(
      order.pickupLat,
      order.pickupLng,
      3000, // 3km
      5
    );

    if (drivers.length > 0) {
      await this.notifyDrivers(order, drivers, 1.0);
      return;
    }

    // Phase 2: Expand to 5km (+20% surge)
    drivers = await this.driversService.findNearest(
      order.pickupLat,
      order.pickupLng,
      5000, // 5km
      5
    );

    if (drivers.length > 0) {
      await this.ordersService.applySurge(orderId, 1.2);
      await this.notifyDrivers(order, drivers, 1.2);
      return;
    }

    // Phase 3: Expand to 7km (+20% surge)
    drivers = await this.driversService.findNearest(
      order.pickupLat,
      order.pickupLng,
      7000, // 7km
      5
    );

    if (drivers.length > 0) {
      await this.ordersService.applySurge(orderId, 1.2);
      await this.notifyDrivers(order, drivers, 1.2);
    } else {
      // No drivers found - cancel or retry later
      await this.ordersService.markNoDriversAvailable(orderId);
    }
  }

  private async notifyDrivers(order: Order, drivers: Driver[], surgeMultiplier: number) {
    // Sort by rating first, then distance
    const sortedDrivers = drivers.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return a.distance - b.distance;
    });

    // Notify top 5 drivers
    for (const driver of sortedDrivers.slice(0, 5)) {
      await this.notificationsService.sendDriverNotification(driver.id, {
        type: 'NEW_ORDER',
        orderId: order.id,
        surgeMultiplier,
        estimatedEarnings: order.driverEarnings * surgeMultiplier,
      });
    }
  }
}
```

### 5.3. Location Batch Processor

**Business Rules:**
- **Frequency:** 30 giây/lần
- **Adaptive:** 10 giây/lần khi gần đích (<500m)

```typescript
// src/modules/drivers/processors/location-batch.processor.ts
@Processor('location-batch')
export class LocationBatchProcessor {
  @Process('batch-insert')
  async handleBatchInsert(job: Job<{ locations: LocationUpdate[] }>) {
    const { locations } = job.data;
    
    // Batch insert to PostgreSQL
    await this.prisma.driverLocation.createMany({
      data: locations.map(loc => ({
        driverId: loc.driverId,
        latitude: loc.lat,
        longitude: loc.lng,
        accuracy: loc.accuracy,
        heading: loc.heading,
        speed: loc.speed,
        recordedAt: new Date(loc.timestamp),
      })),
    });
  }
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

### 7.2. Pricing Service

**Pricing Model:** 8.000 VND/km (fixed)

```typescript
// src/modules/orders/services/pricing.service.ts
@Injectable()
export class PricingService {
  private readonly PRICE_PER_KM = 8000;
  private readonly PLATFORM_FEE_PERCENT = 15;
  private readonly MAX_DISTANCE_KM = 25;
  private readonly SURGE_PERCENT = 20;

  calculatePrice(distanceKm: number, surgeMultiplier: number = 1): {
    distancePrice: number;
    totalPrice: number;
    platformFee: number;
    driverEarnings: number;
  } {
    // Validate max distance
    if (distanceKm > this.MAX_DISTANCE_KM) {
      throw new Error(`Distance exceeds maximum (${this.MAX_DISTANCE_KM}km)`);
    }

    const distancePrice = distanceKm * this.PRICE_PER_KM;
    const totalPrice = Math.round(distancePrice * surgeMultiplier);
    const platformFee = Math.round(totalPrice * (this.PLATFORM_FEE_PERCENT / 100));
    const driverEarnings = totalPrice - platformFee;

    return {
      distancePrice,
      totalPrice,
      platformFee,
      driverEarnings,
    };
  }

  calculateCancellationFee(
    totalPrice: number,
    minutesSinceOrder: number,
    driverAssigned: boolean
  ): number {
    const FREE_MINUTES = 5;
    const CANCELLATION_FEE_PERCENT = 10;

    if (minutesSinceOrder <= FREE_MINUTES) {
      return 0;
    }

    if (!driverAssigned) {
      return 0;
    }

    return Math.round(totalPrice * (CANCELLATION_FEE_PERCENT / 100));
  }

  getSurgeMultiplier(radiusExpanded: boolean): number {
    return radiusExpanded ? 1 + (this.SURGE_PERCENT / 100) : 1;
  }
}
```

### 7.3. Cancellation Service

**Cancellation Policy:**
- **Customer:** Free 5 phút, sau đó 10%
- **Driver:** Max 3 lần/ngày, -10 rating/lần

```typescript
// src/modules/orders/services/cancellation.service.ts
@Injectable()
export class CancellationService {
  constructor(
    private ordersRepository: IOrdersRepository,
    private driversRepository: IDriversRepository,
    private pricingService: PricingService,
  ) {}

  async cancelOrder(
    orderId: string,
    cancelledBy: string,
    cancelledByRole: 'customer' | 'driver' | 'admin',
    reason?: string
  ): Promise<CancelOrderResult> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    // Check if can cancel
    if (['delivered', 'cancelled'].includes(order.status)) {
      throw new CannotCancelError('Order already completed or cancelled');
    }

    // Driver cancellation limits
    if (cancelledByRole === 'driver') {
      const driver = await this.driversRepository.findById(order.driverId);
      if (driver.dailyCancellations >= 3) {
        throw new CancellationLimitError('Daily cancellation limit reached (3/day)');
      }

      // Update driver stats
      await this.driversRepository.incrementCancellations(driver.id);
      await this.driversRepository.updateRating(driver.id, -10); // -10 points
    }

    // Calculate cancellation fee
    const minutesSinceOrder = differenceInMinutes(new Date(), order.createdAt);
    const cancellationFee = this.pricingService.calculateCancellationFee(
      order.totalPrice,
      minutesSinceOrder,
      !!order.driverId
    );

    // Update order
    await this.ordersRepository.update(orderId, {
      status: 'cancelled',
      cancelledBy,
      cancelledByRole,
      cancellationReason: reason,
      cancellationFee,
      cancelledAt: new Date(),
    });

    return {
      orderId,
      status: 'cancelled',
      cancellationFee,
      refundAmount: order.totalPrice - cancellationFee,
    };
  }
}
```

### 7.4. Zod + OpenAPI Integration

We use **nestjs-zod** for DTO validation with automatic OpenAPI schema generation.

#### DTO with Zod Schema

```typescript
// src/modules/users/dto/create-user.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Define schema with Zod v4
export const CreateUserSchema = z.object({
  pickupAddress: z.string().min(1),
  deliveryAddress: z.string().min(1),
  description: z.string().optional(),
});

// Create DTO class from schema
export class CreateUserDto extends createZodDto(CreateUserSchema) {}
```

#### Controller with Swagger Decorators

```typescript
// src/modules/users/users.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() createUserDto: CreateUserDto) {
    // Zod validation happens automatically via nestjs-zod
    return this.usersService.create(createUserDto);
  }
}
```

#### Zod Validation Pipe Setup

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Use ZodValidationPipe globally for automatic Zod validation
  app.useGlobalPipes(new ZodValidationPipe());
  
  // Setup Swagger/OpenAPI
  setupSwagger(app);
  
  await app.listen(3000);
}
bootstrap();
```

#### Zod Exception Filter

```typescript
// src/common/filters/zod-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { Response } from 'express';

@Catch(ZodValidationException)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const zodError = exception.getZodError();

    response.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: zodError.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  }
}
```

Register the filter in your app module:

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ZodExceptionFilter } from './common/filters/zod-exception.filter';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: ZodExceptionFilter,
    },
  ],
})
export class AppModule {}
```

### 7.3. Hey-API Configuration with Zod

```typescript
// hey-api.config.ts (in frontend project)
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: '@hey-api/client-fetch',
  input: 'http://localhost:3000/api/docs-json',
  output: {
    format: 'prettier',
    path: 'src/lib/api/generated',
  },
  plugins: [
    '@hey-api/sdk',
    '@hey-api/typescript',
    {
      name: '@hey-api/zod',
      output: 'zod',
    },
    {
      name: '@tanstack/react-query',
      output: 'queries',
    },
  ],
});
```

This configuration:
1. Generates TypeScript types from OpenAPI spec
2. Generates Zod schemas for runtime validation
3. Generates TanStack Query hooks for data fetching
4. All types are derived from your Zod schemas automatically

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

# Goong Maps
GOONG_API_KEY="your-goong-key"
```

---

## 9. Testing Architecture

### 9.1. AI-Agent Driven Testing Strategy

This backend uses **AI-Agent driven testing** where AI assistants generate, execute, and maintain tests alongside feature development.

#### Testing Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      TESTING PYRAMID                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    ┌──────────────┐                             │
│                    │   E2E Tests  │  ← Critical flows only      │
│                    │   (~10%)     │    (AI-Agent generates      │
│                    └──────┬───────┘     after feature stable)   │
│                           │                                     │
│              ┌────────────┴────────────┐                       │
│              │   Integration Tests     │  ← Module interactions │
│              │        (~20%)           │    (Optional for MVP)  │
│              └────────────┬────────────┘                       │
│                           │                                     │
│     ┌─────────────────────┴─────────────────────┐              │
│     │              Unit Tests                    │  ← Primary  │
│     │                 (~70%)                     │    focus    │
│     │  - Services (mocked dependencies)          │             │
│     │  - Controllers (mocked services)           │             │
│     │  - DTOs (validation)                       │             │
│     └───────────────────────────────────────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### AI-Agent Testing Workflow

**Phase 1: Explore & Understand**
```typescript
// AI-Agent reads implementation
@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private geoService: GeoService,
  ) {}

  async create(dto: CreateOrderDto, userId: string): Promise<Order> {
    // Business logic here
  }
}

// AI-Agent identifies:
// - Dependencies: PrismaService, GeoService
// - Test scenarios: Create order, validation, error cases
// - Mock strategy: mockDeep<PrismaService>(), mockDeep<GeoService>()
```

**Phase 2: Generate Tests**
```typescript
// AI-Agent generates: orders.service.spec.ts
describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: DeepMockProxy<PrismaService>;
  let geoService: DeepMockProxy<GeoService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: GeoService, useValue: mockDeep<GeoService>() },
      ],
    }).compile();

    service = module.get(OrdersService);
    prisma = module.get(PrismaService);
    geoService = module.get(GeoService);
  });

  describe('create', () => {
    it('should create order with valid data', async () => {
      // Test implementation
    });

    it('should calculate price using geoService', async () => {
      // Test implementation
    });

    it('should throw if pickup location is invalid', async () => {
      // Test implementation
    });
  });
});
```

**Phase 3: Execute & Validate**
```bash
# AI-Agent runs tests
bun run typecheck              # 1. TypeScript validation
bun run test orders.service    # 2. Run specific tests
bun run test:cov               # 3. Check coverage
```

**Phase 4: Iterate**
- Fix failing tests
- Add missing test cases
- Re-run until all pass

### 9.2. Test File Organization

```
apps/api/
├── src/
│   └── modules/
│       └── orders/
│           ├── orders.module.ts
│           ├── orders.controller.ts
│           ├── orders.service.ts
│           ├── orders.controller.spec.ts     # Controller tests
│           ├── orders.service.spec.ts        # Service tests
│           └── dto/
│               ├── create-order.dto.ts
│               └── create-order.dto.spec.ts  # DTO validation tests
│
├── test/                                     # E2E tests
│   ├── jest-e2e.json
│   ├── app.e2e-spec.ts
│   ├── auth.e2e-spec.ts
│   └── orders.e2e-spec.ts
│
└── jest.config.js                            # Jest configuration
```

### 9.3. Testing Tools & Libraries

| Tool | Purpose | Usage |
|------|---------|-------|
| **Jest** | Test runner | `bun run test` |
| **@nestjs/testing** | NestJS test utilities | `Test.createTestingModule()` |
| **jest-mock-extended** | Deep mocking | `mockDeep<PrismaService>()` |
| **Supertest** | HTTP assertions | E2E testing |
| **@golevelup/ts-jest** | Testing utilities | `createMock()` helper |

### 9.4. Mocking Strategy

```typescript
// Mock external services
const mockPrisma = mockDeep<PrismaService>();
const mockFirebase = mockDeep<FirebaseAdminService>();
const mockGeo = mockDeep<GeoService>();

// Mock return values
mockPrisma.order.create.mockResolvedValue(mockOrder);
mockGeo.calculateDistance.mockReturnValue(5000); // 5km

// Mock implementations
mockPrisma.$transaction.mockImplementation(async (callback) => {
  return callback(mockPrisma);
});
```

### 9.5. Test Coverage Targets

| Layer | Target | Priority |
|-------|--------|----------|
| Services | 80%+ | HIGH |
| Controllers | 70%+ | MEDIUM |
| DTOs | 50%+ | LOW |
| Overall | 75%+ | HIGH |

### 9.6. AI-Agent Testing Commands

```bash
# Generate tests for module
"Generate unit tests for OrdersService"

# Run specific tests
bun run test -- orders.service

# Run with coverage
bun run test:cov -- --collectCoverageFrom="src/modules/orders/**/*.ts"

# Watch mode for development
bun run test:watch -- orders

# E2E tests
bun run test:e2e
```

---

## 10. Commands Reference

| Command | Description |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun run dev` | Start development server with hot reload |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run db:generate` | Generate Prisma Client |
| `bun run db:migrate` | Run database migrations |
| `bun run db:studio` | Open Prisma Studio |
| `bun run test` | Run unit tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run test:cov` | Run tests with coverage |
| `bun run test:e2e` | Run E2E tests |
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
