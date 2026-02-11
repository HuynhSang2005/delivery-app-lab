# ADR-007: Repository Pattern for Data Access

**Status:** Accepted  
**Date:** February 11, 2026  
**Deciders:** Technical Lead  

## Context

We need to decide on the data access pattern for our NestJS backend. The delivery app requires complex queries (especially geospatial queries with PostGIS), needs to be testable, and should be maintainable as the project grows.

## Decision

We will use the **Repository Pattern** for all data access in the NestJS backend.

## Consequences

### Positive
- **Testability**: Easy to mock repositories in unit tests
- **Flexibility**: Can swap database implementations without affecting business logic
- **Complex Queries**: Centralized location for PostGIS geospatial queries
- **Caching**: Easy to add caching layer at repository level
- **Transaction Management**: Centralized transaction handling
- **SOLID Compliance**: Follows Dependency Inversion Principle (DIP)

### Negative
- **Boilerplate**: More code compared to using Prisma directly in services
- **Learning Curve**: Team needs to understand the pattern
- **Maintenance**: Additional interfaces and implementations to maintain

## Implementation

### Folder Structure
```
modules/{feature}/
├── {feature}.module.ts
├── {feature}.controller.ts
├── {feature}.service.ts
├── dto/
├── repositories/
│   ├── {feature}.repository.ts
│   └── {feature}.repository.interface.ts
└── interfaces/
```

### Pattern Example
```typescript
// Interface
export interface IUsersRepository {
  findById(id: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
}

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

// Implementation
@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private prisma: PrismaService) {}
  
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
  // ...
}

// Module
@Module({
  providers: [
    {
      provide: USERS_REPOSITORY,
      useClass: UsersRepository,
    },
  ],
})
export class UsersModule {}

// Service
@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private usersRepository: IUsersRepository,
  ) {}
}
```

## Alternatives Considered

1. **Direct Prisma in Services**: Simpler but less testable and flexible
2. **Active Record**: Not suitable for complex queries and geospatial operations
3. **CQRS**: Overkill for MVP, can be added later if needed

## References

- [NestJS Documentation - Repository Pattern](https://docs.nestjs.com/techniques/database#repository-pattern)
- [Martin Fowler - Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
