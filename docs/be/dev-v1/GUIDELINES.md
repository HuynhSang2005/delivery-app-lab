# Guidelines for AI Agents

## How to Use This Development Plan

### 1. Before Starting Work

1. **Read CURRENT_STATE.md** to understand:
   - Current phase and task
   - What's already done
   - Any blockers or issues

2. **Read IMPLEMENTATION_PLAN.md** for:
   - Current task details
   - Expected outcomes
   - Verification criteria

3. **Check dependencies** - Ensure previous tasks are complete

### 2. During Development

1. **Follow the plan sequentially** - Don't skip tasks
2. **Update CURRENT_STATE.md** after each task:
   - Mark task as complete
   - Add any decisions made
   - Document issues encountered
   - Update progress percentage

3. **Verify each task** using the criteria in IMPLEMENTATION_PLAN.md

4. **Ask for clarification** if:
   - Requirements are unclear
   - Task dependencies are blocking
   - Technical decisions need approval

### 3. Task Completion Checklist

Before marking a task complete:

- [ ] Code implemented according to spec
- [ ] Verification criteria met
- [ ] Tests pass (if applicable)
- [ ] No linting errors
- [ ] TypeScript compiles
- [ ] CURRENT_STATE.md updated
- [ ] Any issues documented

### 4. Code Patterns

#### Creating a New Module with Repository Pattern

**Folder Structure:**
```
modules/feature/
├── feature.module.ts
├── feature.controller.ts
├── feature.service.ts
├── dto/
│   ├── create-feature.dto.ts
│   └── update-feature.dto.ts
├── repositories/
│   ├── feature.repository.interface.ts  # Interface
│   └── feature.repository.ts            # Implementation
└── interfaces/
    └── feature.interface.ts
```

**Step 1: Create Repository Interface**
```typescript
// repositories/feature.repository.interface.ts
export interface IFeatureRepository {
  findById(id: string): Promise<Feature | null>;
  findAll(options: PaginationOptions): Promise<Feature[]>;
  create(data: CreateFeatureDto): Promise<Feature>;
  update(id: string, data: UpdateFeatureDto): Promise<Feature>;
  delete(id: string): Promise<void>;
}

export const FEATURE_REPOSITORY = Symbol('FEATURE_REPOSITORY');
```

**Step 2: Create Repository Implementation**
```typescript
// repositories/feature.repository.ts
@Injectable()
export class FeatureRepository implements IFeatureRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Feature | null> {
    return this.prisma.feature.findUnique({ where: { id } });
  }

  async findAll(options: PaginationOptions): Promise<Feature[]> {
    return this.prisma.feature.findMany({
      skip: options.skip,
      take: options.take,
    });
  }

  async create(data: CreateFeatureDto): Promise<Feature> {
    return this.prisma.feature.create({ data });
  }

  async update(id: string, data: UpdateFeatureDto): Promise<Feature> {
    return this.prisma.feature.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.feature.delete({ where: { id } });
  }
}
```

**Step 3: Create Module**
```typescript
// feature.module.ts
@Module({
  imports: [DatabaseModule],
  controllers: [FeatureController],
  providers: [
    FeatureService,
    {
      provide: FEATURE_REPOSITORY,
      useClass: FeatureRepository,
    },
  ],
  exports: [FeatureService],
})
export class FeatureModule {}
```

**Step 4: Create Service**
```typescript
// feature.service.ts
@Injectable()
export class FeatureService {
  constructor(
    @Inject(FEATURE_REPOSITORY)
    private featureRepository: IFeatureRepository,
  ) {}

  async create(dto: CreateFeatureDto): Promise<Feature> {
    // Business logic here
    return this.featureRepository.create(dto);
  }

  async findById(id: string): Promise<Feature> {
    const feature = await this.featureRepository.findById(id);
    if (!feature) {
      throw new FeatureNotFoundError(id);
    }
    return feature;
  }
}
```

**Step 5: Create Controller**
```typescript
// feature.controller.ts
@Controller('features')
export class FeatureController {
  constructor(private service: FeatureService) {}

  @Post()
  async create(@Body() dto: CreateFeatureDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
```

**Step 6: Add to AppModule**
```typescript
// app.module.ts
imports: [FeatureModule]
```

#### Creating DTOs

```typescript
// create-feature.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateFeatureSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export class CreateFeatureDto extends createZodDto(CreateFeatureSchema) {}
```

#### Error Handling

```typescript
// Custom error
export class FeatureNotFoundError extends NotFoundException {
  constructor(id: string) {
    super(`Feature with ID "${id}" not found`);
  }
}

// Usage in Service (NOT Repository)
const feature = await this.featureRepository.findById(id);
if (!feature) {
  throw new FeatureNotFoundError(id);
}
```

**Note:** Error handling and business logic should be in Service layer, not Repository. Repository only handles data access.

### 5. Testing Patterns

## AI-Agent Driven Testing Workflow

When developing with AI-Agent, follow this testing workflow:

### Phase 1: Explore & Understand
Before writing tests, AI-Agent should:
1. **Read the implementation** - Controller, Service, DTOs
2. **Understand dependencies** - What services/modules are injected
3. **Identify test scenarios** - Happy path, error cases, edge cases
4. **Check existing patterns** - Look at similar test files in the project

### Phase 2: Generate Tests
AI-Agent generates tests following this priority:
1. **Unit tests for Services** (highest priority)
   - Mock Repository interfaces, NOT PrismaService
   - Test business logic, not database queries
   - Coverage target: 80%+
   - Example: Mock `IFeatureRepository` instead of `PrismaService`

2. **Unit tests for Controllers** (medium priority)
   - Mock services
   - Test HTTP status codes and responses
   - Coverage target: 70%+

3. **E2E tests** (after feature is stable)
   - Test full request/response cycle
   - Use real database (test container or separate schema)
   - Focus on critical user flows

### Phase 3: Run & Validate
```bash
# 1. Type check first
bun run typecheck

# 2. Run unit tests for specific module
bun run test orders.service

# 3. Run all tests
bun run test

# 4. Check coverage
bun run test:cov

# 5. Fix any failing tests
# AI-Agent analyzes errors and fixes issues
```

### Phase 4: Iterate
If tests fail:
1. **Analyze error messages** - AI-Agent reads Jest output
2. **Fix implementation or tests** - Update code to match expected behavior
3. **Re-run tests** - Verify fixes work
4. **Update test cases** - Add missing scenarios

---

#### Unit Test Template (with Repository Pattern)

```typescript
// feature.service.spec.ts
import { Test } from '@nestjs/testing';
import { FeatureService } from './feature.service';
import { IFeatureRepository, FEATURE_REPOSITORY } from './repositories/feature.repository.interface';

describe('FeatureService', () => {
  let service: FeatureService;
  let repository: jest.Mocked<IFeatureRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FeatureService,
        {
          provide: FEATURE_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(FeatureService);
    repository = module.get(FEATURE_REPOSITORY);
  });

  describe('create', () => {
    it('should create a new feature', async () => {
      // Arrange
      const dto = { name: 'Test' };
      const expected = { id: '1', ...dto, createdAt: new Date() };
      repository.create.mockResolvedValue(expected);

      // Act
      const result = await service.create(dto);

      // Assert
      expect(result).toEqual(expected);
      expect(repository.create).toHaveBeenCalledWith(dto);
    });

    it('should throw error if name is empty', async () => {
      // Arrange
      const dto = { name: '' };

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return feature by id', async () => {
      // Arrange
      const feature = { id: '1', name: 'Test' };
      repository.findById.mockResolvedValue(feature);

      // Act
      const result = await service.findById('1');

      // Assert
      expect(result).toEqual(feature);
      expect(repository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw error if feature not found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('1')).rejects.toThrow(FeatureNotFoundError);
    });
  });
});
```

#### E2E Test Template

```typescript
// feature.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('FeatureController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/features (POST) - should create feature', () => {
    return request(app.getHttpServer())
      .post('/features')
      .send({ name: 'Test Feature' })
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
      });
  });
});
```

### AI-Agent Testing Commands

When asking AI-Agent to test:

```
"Generate unit tests for UsersService"
"Run tests for orders module"
"Fix failing tests in auth.controller.spec.ts"
"Check test coverage for drivers module"
"Create E2E tests for order creation flow"
```

### Testing Checklist for AI-Agent

Before marking feature complete:
- [ ] Unit tests created for all service methods
- [ ] Controller tests for all endpoints
- [ ] Tests pass: `bun run test`
- [ ] Coverage > 80% for services
- [ ] Error cases tested
- [ ] Edge cases considered
- [ ] TypeScript compiles with no errors

### 6. Common Commands

```bash
# Development
bun run start:dev          # Start with hot reload
bun run build              # Production build
bun run typecheck          # TypeScript check

# Testing
bun run test               # Unit tests
bun run test:watch         # Watch mode
bun run test:cov           # With coverage
bun run test:e2e           # E2E tests

# Code Quality
bun run lint               # Run ESLint
bun run lint:check         # Check only (no fix)

# Database
bun run db:generate        # Generate Prisma Client
bun run db:migrate         # Run migrations
bun run db:studio          # Open Prisma Studio
```

### 7. When to Ask for Help

Ask the user when:
- Requirements are unclear or ambiguous
- Technical decisions have trade-offs
- Blockers prevent progress
- Scope changes are needed
- Errors can't be resolved

### 8. Boundaries

**✅ DO:**
- Follow the implementation plan
- Write tests for new features
- Update documentation
- Handle errors gracefully
- Follow code style guidelines

**⚠️ ASK FIRST:**
- Add new dependencies
- Change database schema
- Modify architecture decisions
- Skip or reorder tasks

**🚫 DON'T:**
- Commit secrets or credentials
- Skip verification steps
- Ignore TypeScript errors
- Break existing functionality
- Make assumptions about unclear requirements

### 9. File Organization

```
docs/be/dev-v1/
├── IMPLEMENTATION_PLAN.md    # Main development plan
├── CURRENT_STATE.md          # Current progress (update frequently)
├── GUIDELINES.md            # This file
└── decisions/               # Architecture decisions
    └── ADR-001-example.md
```

### 10. Communication Template

When completing a task, use this format:

```
## Task Completed: [Task Number] - [Task Name]

### What was done:
- [Brief description]

### Files created/modified:
- [File path]

### Verification:
- [How you verified it works]

### Issues encountered:
- [Any issues and how resolved]

### Next task:
- [Next task number and name]
```

---

**Remember:** Update CURRENT_STATE.md after EVERY task!
