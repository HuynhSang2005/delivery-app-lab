---
name: nestjs-modular-monolith
description: Use when organizing NestJS applications with feature-based modules for solo developers or small teams. Simpler alternative to Clean Architecture for MVPs and logistics/delivery apps.
---

# NestJS Modular Monolith

Feature-based module organization for NestJS applications. Designed for solo developers and small teams building MVPs.

## When to Use

- Building MVPs with NestJS
- Solo developer or small team (2-3 developers)
- Logistics/delivery applications
- Real-time tracking systems
- Need clear boundaries without DDD complexity

## When NOT to Use

- Large enterprise applications (50+ developers)
- Microservices architecture
- Complex domain logic requiring DDD

## Module Structure

```
src/
├── modules/
│   ├── auth/              # Firebase Auth + JWT
│   ├── users/             # User management
│   ├── drivers/           # Driver management + location
│   ├── orders/            # Order lifecycle + matching
│   ├── chat/              # Real-time messaging
│   └── admin/             # Admin operations
├── shared/
│   ├── guards/            # JWT, Roles
│   ├── interceptors/      # Logging, Transform
│   ├── decorators/        # CurrentUser, Roles
│   └── pipes/             # Validation
├── database/
│   ├── prisma.service.ts
│   └── geo.service.ts     # PostGIS helpers
├── cache/
│   ├── redis.service.ts
│   └── cache.service.ts
├── queues/
│   ├── notification.queue.ts
│   ├── location.queue.ts
│   └── matching.queue.ts
└── gateway/
    └── events.gateway.ts  # Socket.io
```

## Feature Module Pattern

```typescript
// modules/orders/orders.module.ts
@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    BullModule.registerQueue({
      name: 'order-matching',
    }),
    forwardRef(() => DriversModule),
    forwardRef(() => ChatModule),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersRepository,
    OrderMatchingProcessor,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
```

## Shared Module Pattern

```typescript
// shared/shared.module.ts
@Global()
@Module({
  providers: [
    JwtAuthGuard,
    RolesGuard,
    LoggingInterceptor,
    TransformInterceptor,
    CurrentUserDecorator,
  ],
  exports: [
    JwtAuthGuard,
    RolesGuard,
    LoggingInterceptor,
  ],
})
export class SharedModule {}
```

## Database Module

```typescript
// database/database.module.ts
@Module({
  providers: [
    PrismaService,
    GeoService,
  ],
  exports: [
    PrismaService,
    GeoService,
  ],
})
export class DatabaseModule {}

// database/geo.service.ts
@Injectable()
export class GeoService {
  constructor(private prisma: PrismaService) {}

  async findNearestDrivers(
    lat: number,
    lng: number,
    radius: number = 5000,
  ): Promise<Driver[]> {
    return this.prisma.$queryRaw`
      SELECT d.*, u.name, u.phone
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'ACTIVE'
        AND d.is_approved = true
        AND ST_DWithin(
          d.last_location,
          ST_MakePoint(${lng}, ${lat})::geography,
          ${radius}
        )
      ORDER BY d.last_location <-> ST_MakePoint(${lng}, ${lat})::geography
      LIMIT 5
    `;
  }
}
```

## Queue Module Pattern

```typescript
// queues/queues.module.ts
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    }),
    BullModule.registerQueue(
      { name: 'notification' },
      { name: 'location' },
      { name: 'order-matching' },
    ),
  ],
  providers: [
    NotificationProcessor,
    LocationProcessor,
    OrderMatchingProcessor,
  ],
})
export class QueuesModule {}
```

## Gateway Module

```typescript
// gateway/events.gateway.ts
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/events',
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  // Room-based messaging per order
  joinOrderRoom(socket: Socket, orderId: string) {
    socket.join(`order:${orderId}`);
  }

  broadcastToOrder(orderId: string, event: string, data: any) {
    this.server.to(`order:${orderId}`).emit(event, data);
  }
}
```

## Best Practices

1. **One feature = One module**: Orders, Drivers, Chat each have their own module
2. **Shared module for cross-cutting**: Guards, interceptors, decorators
3. **Forward references for circular deps**: Use `forwardRef()` sparingly
4. **Export only what's needed**: Keep module interfaces minimal
5. **Global module for truly shared**: Config, logging, database

## Common Patterns

### Module Re-exporting

```typescript
// shared.module.ts re-exports common modules
@Module({
  imports: [DatabaseModule, CacheModule],
  exports: [DatabaseModule, CacheModule],
})
export class SharedModule {}
```

### Feature Module with Repository

```typescript
// modules/users/users.repository.ts
@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }
}

// modules/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(private repo: UsersRepository) {}

  async getUser(id: string): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
```

## Anti-Patterns to Avoid

1. **Don't create too many modules**: Keep it simple, 5-8 feature modules max
2. **Don't over-engineer**: No need for DDD/Clean Architecture for MVP
3. **Don't share business logic**: Each module owns its domain
4. **Don't bypass module boundaries**: Import modules, not services directly

## Resources

- [NestJS Modules](https://docs.nestjs.com/modules)
- [Circular Dependencies](https://docs.nestjs.com/fundamentals/circular-dependency)
- [Global Modules](https://docs.nestjs.com/modules#global-modules)
