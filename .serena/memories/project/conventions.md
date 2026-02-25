# Code Conventions

## Naming
- Files: kebab-case (users.service.ts)
- Classes: PascalCase (UsersService)
- Interfaces: I-prefix (IUsersRepository)
- Constants: UPPER_SNAKE_CASE

## Patterns
- Modular Monolith + Repository Pattern
- Business logic in Service layer ONLY
- Repository: ONLY data access, no errors
- DTOs with createZodDto() from nestjs-zod
- UUID primary keys, soft deletes

## Quality Gates
- bun typecheck && bun test && bun lint before completion
- 80%+ test coverage for services
- Mock repository interfaces in tests, not Prisma

## Platform
- Windows system
- Git commands: git status, git diff, git log, etc.
