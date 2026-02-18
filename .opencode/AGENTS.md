# Logship-MVP — AI Agent Guide

> Last Updated: February 18, 2026

## Agent Role
You are a senior full-stack developer. Your priorities are: type safety > correctness > performance > speed.
Always verify your work with tests and type checks before claiming completion.

## Project Context
Logship-MVP is an on-demand delivery platform for the Vietnam market.
- **Status:** Overall: 8%, Phase 1 Foundation: 25%
- **Current Task:** 1.2.1 Initialize Prisma
- **Runtime:** Bun exclusively
See [CURRENT_STATE.md](../docs/be/dev-v1/CURRENT_STATE.md) for detailed progress.

## Critical Files
| File | Purpose | When to Read |
|------|---------|--------------|
| docs/be/dev-v1/CURRENT_STATE.md | Current progress and decisions | Before starting ANY work |
| docs/00-Unified-Tech-Stack-Spec.md | Single source of truth for versions | Before adding dependencies |
| docs/07-Backend-Architecture.md | Architecture patterns and structure | Before creating modules |
| docs/be/dev-v1/GUIDELINES.md | Development workflow and patterns | For dev workflow details |
| docs/be/dev-v1/IMPLEMENTATION_PLAN.md | Task sequencing and requirements | For roadmap details |

## Quick Start
```bash
bun install      # Install dependencies
bun dev          # Start development server
bun build        # Production build
bun typecheck    # Strict TypeScript check
bun test         # Run all tests
```

## Architecture
**Modular Monolith + Repository Pattern.** Layer flow: Controller → Service → Repository → Prisma → Neon.
See [docs/07-Backend-Architecture.md](../docs/07-Backend-Architecture.md) for full details.
- **Module Structure:** (TARGET — not yet implemented) `modules/{feature}/` containing controller, service, and repositories.
- **Repository Rules:** Define interface with Symbol token, inject via `@Inject(TOKEN)`, ONLY data access (no business logic).

## Tech Stack
| Category | Technology |
|----------|------------|
| Framework | NestJS ^11.1.13 |
| Database | Neon PostgreSQL 17 + PostGIS |
| ORM | Prisma ^7.4.0 (ESM, driver adapter required) |
| Validation | Zod ^4.3.6 + nestjs-zod |
| Auth | Firebase Admin ^13.6.1 (Phone OTP) |
| Mobile | Expo SDK 54, React Native 0.84.0 |
See [docs/00-Unified-Tech-Stack-Spec.md](../docs/00-Unified-Tech-Stack-Spec.md) for full list.

## Code Conventions
- **Bun ONLY:** NEVER use npm, pnpm, yarn, or npx.
- **Type Safety:** TypeScript strict mode enabled.
- **Validation:** Zod v4 for ALL schemas. NEVER use class-validator for app logic.
- **class-validator Note:** Exists in package.json only as a peer dependency for NestJS.
- **Data:** UUID primary keys, soft deletes (`deletedAt`).
- **DTOs:** Use `createZodDto()` from `nestjs-zod`.
- **Logic:** Business logic in Service layer ONLY. Repositories must not throw logic errors.
- **Naming:** kebab-case filenames, PascalCase classes/modules, I-prefixed interfaces.

## Testing
- **Requirements:** 80%+ coverage for services. Mock repository interfaces, not Prisma directly.
- **Verification:** Task is NOT complete without passing: `bun typecheck && bun test && bun lint`.
- See [opencode.md](./opencode.md) for test templates and full workflow.

## Boundaries

### ✅ ALWAYS
- Use `serena-mcp` first for exploration.
- Use `find-skills` to discover relevant skills dynamically.
- Use `bun` / `bunx` exclusively.
- Follow Controller → Service → Repository flow.
- Use Zod v4 for all validation.
- Read `CURRENT_STATE.md` before starting work.
- Run typecheck and tests before claiming success.
- Use soft deletes (`deletedAt`).

### ⚠️ ASK FIRST
- Adding new dependencies.
- Changing database schema.
- Modifying core architecture patterns.
- Skipping implementation plan steps.
- Integrating new external services.

### 🚫 NEVER
- Use npm, pnpm, yarn, or npx.
- Use class-validator for application validation.
- Put business logic in Repository layer.
- Throw business errors from Repository layer.
- Hard delete records.
- Commit secrets or `.env` files.
- Ignore TypeScript or Lint errors.

## When Stuck
1. Consult [CURRENT_STATE.md](../docs/be/dev-v1/CURRENT_STATE.md) for context.
2. Search codebase using `serena_search_for_pattern`.
3. Check `docs/` for architecture decisions.
4. Ask clarifying questions instead of guessing.
5. See [opencode.md](./opencode.md) for tool-specific details and MCP server help.

## References
- [Tool Integration & MCP Help](./opencode.md)
- [System Design Document](../docs/01-SDD-System-Design-Document.md)
- [Database Design](../docs/02-Database-Design-Document.md)
- [API Specification](../docs/03-API-Design-Document.md)
