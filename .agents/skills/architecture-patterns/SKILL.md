---
name: architecture-patterns
description: Implement proven backend architecture patterns including Clean Architecture, Hexagonal Architecture, and Domain-Driven Design. Use when architecting complex backend systems or refactoring existing applications for better maintainability.
---

# Architecture Patterns

Master proven backend architecture patterns including Clean Architecture, Hexagonal Architecture, and Domain-Driven Design to build maintainable, testable, and scalable systems.

## When to Use This Skill

- Designing new backend systems from scratch
- Refactoring monolithic applications for better maintainability
- Establishing architecture standards for your team
- Migrating from tightly coupled to loosely coupled architectures
- Implementing domain-driven design principles
- Creating testable and mockable codebases
- Planning microservices decomposition

## Core Concepts

### 1. Clean Architecture (Uncle Bob)

**Layers (dependency flows inward):**

- **Entities**: Core business models
- **Use Cases**: Application business rules
- **Interface Adapters**: Controllers, presenters, gateways
- **Frameworks & Drivers**: UI, database, external services

**Key Principles:**

- Dependencies point inward
- Inner layers know nothing about outer layers
- Business logic independent of frameworks
- Testable without UI, database, or external services

### 2. Hexagonal Architecture (Ports and Adapters)

**Components:**

- **Domain Core**: Business logic
- **Ports**: Interfaces defining interactions
- **Adapters**: Implementations of ports (database, REST, message queue)

**Benefits:**

- Swap implementations easily (mock for testing)
- Technology-agnostic core
- Clear separation of concerns

### 3. Domain-Driven Design (DDD)

**Strategic Patterns:**

- **Bounded Contexts**: Separate models for different domains
- **Context Mapping**: How contexts relate
- **Ubiquitous Language**: Shared terminology

**Tactical Patterns:**

- **Entities**: Objects with identity
- **Value Objects**: Immutable objects defined by attributes
- **Aggregates**: Consistency boundaries
- **Repositories**: Data access abstraction
- **Domain Events**: Things that happened

## Clean Architecture Pattern

### Directory Structure

```
src/
├── domain/           # Entities & business rules
│   ├── entities/
│   │   ├── user.entity.ts
│   │   └── order.entity.ts
│   ├── value-objects/
│   │   ├── email.vo.ts
│   │   └── money.vo.ts
│   └── interfaces/   # Abstract interfaces (ports)
│       ├── user-repository.interface.ts
│       └── payment-gateway.interface.ts
├── use-cases/        # Application business rules
│   ├── create-user.use-case.ts
│   ├── process-order.use-case.ts
│   └── send-notification.use-case.ts
├── adapters/         # Interface implementations
│   ├── repositories/
│   │   ├── postgres-user.repository.ts
│   │   └── redis-cache.repository.ts
│   ├── controllers/
│   │   └── user.controller.ts
│   └── gateways/
│       ├── stripe-payment.gateway.ts
│       └── sendgrid-email.gateway.ts
└── infrastructure/   # Framework & external concerns
    ├── database.module.ts
    ├── config.module.ts
    └── logger.service.ts
```

### Implementation Example

```typescript
// domain/entities/user.entity.ts
export class User {
  /** Core user entity - no framework dependencies. */
  constructor(
    public readonly id: string,
    public email: string,
    public name: string,
    public readonly createdAt: Date,
    public isActive: boolean = true,
  ) {}

  deactivate(): void {
    this.isActive = false;
  }

  canPlaceOrder(): boolean {
    return this.isActive;
  }
}

// domain/interfaces/user-repository.interface.ts
export interface IUserRepository {
  /** Port: defines contract, no implementation. */
  findById(userId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(userId: string): Promise<boolean>;
}

// use-cases/create-user.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { User } from '../domain/entities/user.entity';
import { IUserRepository, USER_REPOSITORY } from '../domain/interfaces/user-repository.interface';

export interface CreateUserRequest {
  email: string;
  name: string;
}

export interface CreateUserResponse {
  user: User | null;
  success: boolean;
  error?: string;
}

@Injectable()
export class CreateUserUseCase {
  /** Use case: orchestrates business logic. */
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    // Business validation
    const existing = await this.userRepository.findByEmail(request.email);
    if (existing) {
      return {
        user: null,
        success: false,
        error: 'Email already exists',
      };
    }

    // Create entity
    const user = new User(
      crypto.randomUUID(),
      request.email,
      request.name,
      new Date(),
      true,
    );

    // Persist
    const savedUser = await this.userRepository.save(user);

    return {
      user: savedUser,
      success: true,
    };
  }
}

// adapters/repositories/postgres-user.repository.ts
import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class PostgresUserRepository implements IUserRepository {
  /** Adapter: PostgreSQL implementation. */
  constructor(private readonly db: DatabaseService) {}

  async findById(userId: string): Promise<User | null> {
    const row = await this.db.query(
      'SELECT * FROM users WHERE id = $1',
      [userId],
    );
    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    return row ? this.toEntity(row) : null;
  }

  async save(user: User): Promise<User> {
    await this.db.query(
      `
      INSERT INTO users (id, email, name, created_at, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE
      SET email = $2, name = $3, is_active = $5
      `,
      [user.id, user.email, user.name, user.createdAt, user.isActive],
    );
    return user;
  }

  async delete(userId: string): Promise<boolean> {
    const result = await this.db.query(
      'DELETE FROM users WHERE id = $1',
      [userId],
    );
    return result.rowCount === 1;
  }

  private toEntity(row: any): User {
    /** Map database row to entity. */
    return new User(
      row.id,
      row.email,
      row.name,
      row.created_at,
      row.is_active,
    );
  }
}

// adapters/controllers/user.controller.ts
@Controller('users')
export class UserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Post()
  async createUser(@Body() dto: { email: string; name: string }) {
    const response = await this.createUserUseCase.execute(dto);
    if (!response.success) {
      throw new BadRequestException(response.error);
    }
    return { user: response.user };
  }
}
```

## Hexagonal Architecture Pattern

```typescript
// Core domain (hexagon center)
import { Injectable, Inject } from '@nestjs/common';
import { OrderRepositoryPort, ORDER_REPOSITORY } from './ports/order-repository.port';
import { PaymentGatewayPort, PAYMENT_GATEWAY } from './ports/payment-gateway.port';
import { NotificationPort, NOTIFICATION_SERVICE } from './ports/notification.port';

@Injectable()
export class OrderService {
  /** Domain service - no infrastructure dependencies. */
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepositoryPort,
    @Inject(PAYMENT_GATEWAY) private readonly payments: PaymentGatewayPort,
    @Inject(NOTIFICATION_SERVICE) private readonly notifications: NotificationPort,
  ) {}

  async placeOrder(order: Order): Promise<OrderResult> {
    // Business logic
    if (!order.isValid()) {
      return { success: false, error: 'Invalid order' };
    }

    // Use ports (interfaces)
    const payment = await this.payments.charge({
      amount: order.total,
      customer: order.customerId,
    });

    if (!payment.success) {
      return { success: false, error: 'Payment failed' };
    }

    order.markAsPaid();
    const savedOrder = await this.orders.save(order);

    await this.notifications.send({
      to: order.customerEmail,
      subject: 'Order confirmed',
      body: `Order ${order.id} confirmed`,
    });

    return { success: true, order: savedOrder };
  }
}

// Ports (interfaces)
export interface OrderRepositoryPort {
  save(order: Order): Promise<Order>;
}

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface PaymentGatewayPort {
  charge(params: { amount: Money; customer: string }): Promise<PaymentResult>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface NotificationPort {
  send(params: { to: string; subject: string; body: string }): Promise<void>;
}

export const NOTIFICATION_SERVICE = Symbol('NOTIFICATION_SERVICE');

// Adapters (implementations)
import { Injectable } from '@nestjs/common';

@Injectable()
export class StripePaymentAdapter implements PaymentGatewayPort {
  /** Primary adapter: connects to Stripe API. */
  constructor(private readonly stripe: StripeService) {}

  async charge(params: { amount: Money; customer: string }): Promise<PaymentResult> {
    try {
      const charge = await this.stripe.charges.create({
        amount: params.amount.cents,
        currency: params.amount.currency,
        customer: params.customer,
      });
      return { success: true, transactionId: charge.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

@Injectable()
export class MockPaymentAdapter implements PaymentGatewayPort {
  /** Test adapter: no external dependencies. */
  async charge(params: { amount: Money; customer: string }): Promise<PaymentResult> {
    return { success: true, transactionId: 'mock-123' };
  }
}
```

## Domain-Driven Design Pattern

```typescript
// Value Objects (immutable)
export class Email {
  /** Value object: validated email. */
  constructor(public readonly value: string) {
    if (!value.includes('@')) {
      throw new Error('Invalid email');
    }
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}

export class Money {
  /** Value object: amount with currency. */
  constructor(
    public readonly amount: number, // cents
    public readonly currency: string,
  ) {}

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Currency mismatch');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}

// Entities (with identity)
export class Order {
  /** Entity: has identity, mutable state. */
  private _items: OrderItem[] = [];
  private _status: OrderStatus = OrderStatus.PENDING;
  private _events: DomainEvent[] = [];

  constructor(
    public readonly id: string,
    public readonly customer: Customer,
  ) {}

  addItem(product: Product, quantity: number): void {
    /** Business logic in entity. */
    const item = new OrderItem(product, quantity);
    this._items.push(item);
    this._events.push(new ItemAddedEvent(this.id, item));
  }

  get total(): Money {
    /** Calculated property. */
    return this._items.reduce((sum, item) => sum.add(item.subtotal), Money.zero());
  }

  submit(): void {
    /** State transition with business rules. */
    if (this._items.length === 0) {
      throw new Error('Cannot submit empty order');
    }
    if (this._status !== OrderStatus.PENDING) {
      throw new Error('Order already submitted');
    }

    this._status = OrderStatus.SUBMITTED;
    this._events.push(new OrderSubmittedEvent(this.id));
  }

  get status(): OrderStatus {
    return this._status;
  }

  get items(): readonly OrderItem[] {
    return this._items;
  }

  get events(): readonly DomainEvent[] {
    return this._events;
  }

  clearEvents(): void {
    this._events = [];
  }
}

// Aggregates (consistency boundary)
export class Customer {
  /** Aggregate root: controls access to entities. */
  private _addresses: Address[] = [];
  private _orders: string[] = []; // Order IDs, not full objects

  constructor(
    public readonly id: string,
    public readonly email: Email,
  ) {}

  addAddress(address: Address): void {
    /** Aggregate enforces invariants. */
    if (this._addresses.length >= 5) {
      throw new Error('Maximum 5 addresses allowed');
    }
    this._addresses.push(address);
  }

  get primaryAddress(): Address | undefined {
    return this._addresses.find((a) => a.isPrimary);
  }

  get addresses(): readonly Address[] {
    return this._addresses;
  }
}

// Domain Events
export class OrderSubmittedEvent implements DomainEvent {
  readonly occurredAt: Date;

  constructor(public readonly orderId: string) {
    this.occurredAt = new Date();
  }
}

// Repository interface (implementation in adapters layer)
export interface IOrderRepository {
  /** Repository: persist/retrieve aggregates. */
  findById(orderId: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}
```

## Extended Reference

See [references/arch-patterns-extended.md](references/arch-patterns-extended.md) for:
- Additional resources (clean-architecture-guide, hexagonal-architecture-guide, ddd-tactical-patterns)
- Best practices (dependency rule, interface segregation, thin controllers)
- Common pitfalls (anemic domain, framework coupling, over-engineering)
