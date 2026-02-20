# Logship-MVP — AI Agent Guide

> **Project**: On-demand delivery platform for Vietnam market  
> **Status**: Phase 1 Foundation (25% complete)  
> **Current Task**: 1.2.1 Initialize Prisma  
> **Last Updated**: February 20, 2026

---

## TL;DR

**Tech Stack**: NestJS 11 + Bun + Prisma 7.4 + Neon PostgreSQL + PostGIS + Expo SDK 54  
**Constraint**: Bun exclusively (no npm/npx/yarn/pnpm)  
**Auth**: Firebase Phone OTP (NOT JWT)  
**Maps**: Goong Maps (Vietnam-optimized, NOT Google Maps)

**Agent Priorities**: Type safety > Correctness > Performance > Speed

---

## Project Structure

```
logship-mvp/
├── apps/
│   ├── api/                 # NestJS backend
│   ├── mobile/              # Expo React Native
│   └── admin/               # Next.js dashboard (future)
├── docs/                    # ⭐ READ FIRST: CURRENT_STATE.md
├── .opencode/skills/        # Project-specific skills
└── AGENTS.md               # This file
```

**Critical Files** (ALWAYS read first):
- `docs/be/dev-v1/CURRENT_STATE.md` — Progress & decisions
- `docs/00-Unified-Tech-Stack-Spec.md` — Tech versions (single source of truth)
- `docs/07-Backend-Architecture.md` — Architecture patterns
- `docs/be/dev-v1/GUIDELINES.md` — Development workflow
- `docs/be/dev-v1/IMPLEMENTATION_PLAN.md` — Task sequencing

---

## Development Commands

**Backend** (apps/api/):
```bash
bun install              # Install dependencies
bun dev                  # Start dev server
bun build               # Production build
bun typecheck           # Strict TypeScript check
bun test                # Run tests
bun lint                # Run linter
```

**Mobile** (apps/mobile/):
```bash
bunx expo start         # Start Expo dev server
bunx expo run:ios       # Run on iOS simulator
bunx expo run:android   # Run on Android emulator
```

**Prisma**:
```bash
bunx --bun prisma generate
bunx --bun prisma migrate dev
bunx --bun prisma migrate deploy
```

---

## Architecture

**Pattern**: Modular Monolith + Repository Pattern  
**Flow**: Controller → Service → Repository → Prisma → Neon

### Key Rules
- Business logic in **Service layer ONLY**
- Repository: **ONLY data access**, no business logic, no error throwing
- Use **Zod v4** for validation (NEVER class-validator for app logic)
- class-validator exists ONLY as NestJS peer dependency
- **Soft deletes** (`deletedAt`) — never hard delete
- UUID primary keys
- DTOs: Use `createZodDto()` from `nestjs-zod`
- Naming: kebab-case filenames, PascalCase classes, I-prefixed interfaces

### Module Structure (Target)
```
modules/{feature}/
├── {feature}.controller.ts
├── {feature}.service.ts
├── {feature}.repository.ts
├── {feature}.module.ts
├── dto/
└── interfaces/
```

---

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | NestJS | ^11.1.13 |
| Runtime | Bun | ^1.3.9 |
| Database | Neon PostgreSQL | 17 |
| Geospatial | PostGIS | latest |
| ORM | Prisma | ^7.4.0 |
| Validation | Zod | ^4.3.6 |
| Validation Bridge | nestjs-zod | latest |
| Auth | Firebase Admin | ^13.6.1 (Phone OTP) |
| Mobile | Expo SDK | 54 |
| Mobile Runtime | React Native | 0.84.0 |
| Maps | Goong Maps | Vietnam-optimized |

**Prisma v7 Notes**:
- Driver adapter required: `@prisma/adapter-neon`
- ESM imports only
- Output path: `generated/prisma`
- Config: `prisma.config.ts`

See `docs/00-Unified-Tech-Stack-Spec.md` for complete version reference.

---

## External File Loading Instructions

**CRITICAL**: When encountering file references, use lazy loading:

1. **ALWAYS read first**: `docs/be/dev-v1/CURRENT_STATE.md`
2. **Tech stack**: Check `docs/00-Unified-Tech-Stack-Spec.md`
3. **Architecture**: Check `docs/07-Backend-Architecture.md`
4. **Skills**: Use `skill({ name: "find-skills" })` to discover dynamically
5. **Tools**: Use `serena-mcp` for codebase exploration
6. **Library docs**: Use `context7` before implementation

**Do NOT preemptively load all files** — load on demand based on task.

---

## Code Conventions

### ALWAYS ✅
- Use `serena-mcp` first for exploration
- Use `find-skills` to discover relevant skills dynamically
- Use `bun` / `bunx` exclusively
- Follow Controller → Service → Repository flow
- Use Zod v4 for all validation
- Read `CURRENT_STATE.md` before starting work
- Run `bun typecheck && bun test && bun lint` before claiming success
- Use soft deletes (`deletedAt`)
- 80%+ test coverage for services

### ASK FIRST ⚠️
- Adding new dependencies
- Changing database schema
- Modifying core architecture patterns
- Skipping implementation plan steps
- Integrating new external services

### NEVER ❌
- Use npm, pnpm, yarn, or npx
- Use class-validator for application validation
- Put business logic in Repository layer
- Throw business errors from Repository layer
- Hard delete records
- Commit secrets or `.env` files
- Ignore TypeScript or Lint errors

---

## Testing

- **Requirements**: 80%+ coverage for services
- **Strategy**: Mock repository interfaces, not Prisma directly
- **Verification**: Task is NOT complete without passing `bun typecheck && bun test && bun lint`

---

## When Stuck

1. Read `docs/be/dev-v1/CURRENT_STATE.md` for context
2. Search codebase using `serena_search_for_pattern`
3. Check `docs/` folder for architecture decisions
4. Ask clarifying questions instead of guessing
5. See `.opencode/opencode.md` for tool-specific help

---

## References

- [Tool Integration & MCP Help](.opencode/opencode.md)
- [System Design](docs/01-SDD-System-Design-Document.md)
- [Database Design](docs/02-Database-Design-Document.md)
- [API Specification](docs/03-API-Design-Document.md)
- [Implementation Plan](docs/be/dev-v1/IMPLEMENTATION_PLAN.md)
