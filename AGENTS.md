# Logship-MVP — AI Agent Guide

> **Project**: On-demand delivery platform for Vietnam market  
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

## Task Tracking (beads)

This project uses **beads** (`bd`) — a git-backed, dependency-aware issue tracker designed for AI coding agents. All issues are stored in `.beads/issues.jsonl` (git-tracked) with local SQLite cache (gitignored).

**Core Principle**: Check beads N times, implement once. Beads prevent context loss across sessions and enable dependency-aware work routing.

### Why Beads?

- **Git-native**: Issues version-controlled alongside code
- **Dependency-aware**: `bd ready` shows only unblocked work
- **AI-optimized**: Hash-based IDs prevent collision in multi-agent workflows
- **Self-documenting**: Rich descriptions with background, reasoning, acceptance criteria

---

### Session Start Protocol

**ALWAYS run at the beginning of every session:**

```bash
bd prime                        # Load context + inject session close checklist
bd ready --json                 # Find unblocked work (prioritize recent tasks)
bd list --status open --json    # See all open issues
```

**Check recent tasks first** — highest-numbered IDs represent current priorities:

```bash
# View recent tasks (highest 20 IDs = most recent work)
bd list --status open --json | jq 'sort_by(.id | sub(".*-"; "") | tonumber) | reverse | .[0:20]'
```

---

### Issue Types & Priorities

| Type | Use For |
|------|---------|
| `epic` | Large body of work (parent to multiple tasks) |
| `feature` | New functionality |
| `task` | Standard work item (default) |
| `bug` | Defects to fix |
| `chore` | Maintenance, refactoring |

| Priority | Level |
|----------|-------|
| `0` | Critical/blocking |
| `1` | High |
| `2` | Medium (default) |
| `3` | Low |
| `4` | Nice to have |

---

### Working on Tasks

#### 1. Find and Claim Work

```bash
bd ready --json                                    # Show unblocked issues
bd update delivery-app-lab-eia --status in_progress --json   # Claim task
```

#### 2. Create Issues (Always with Descriptions)

```bash
# Basic task
bd create "Implement JWT auth" \
  -t feature -p 1 \
  --description="Add JWT-based authentication with refresh tokens" \
  --json

# Bug with detailed context
bd create "Fix login with special chars" \
  -t bug -p 0 \
  --description="Login fails when password contains quotes. Root cause in sanitization layer." \
  --json

# With labels
bd create "Update CI config" -t task -l "ci,infra" --json

# Child of epic
bd create "Design auth UI" --parent delivery-app-lab-abc --json
```

**ALWAYS include `--description`** — future agents need context without consulting original plans.

#### 3. Complete Work

```bash
bd close delivery-app-lab-eia \
  --reason "Implemented in commit abc123, tests passing" \
  --json
```

---

### Dependency Management

Link related work to establish ordering and prevent premature execution:

```bash
# bd-5 depends on bd-3 (bd-5 blocked until bd-3 closes)
bd dep add delivery-app-lab-rmk delivery-app-lab-eia

# Parent-child hierarchy
bd dep add delivery-app-lab-sub delivery-app-lab-parent --type parent-child

# Discovered during work on another issue
bd create "Found edge case bug" -t bug -p 1 --json
bd dep add delivery-app-lab-new delivery-app-lab-current --type discovered-from
```

**Check for circular dependencies:**
```bash
bd dep cycles --json
```

---

### Discovery During Work

When finding new work during implementation:

```bash
# 1. Create the discovered issue
NEW_ID=$(bd create "Fix discovered race condition" -t bug -p 1 --json | jq -r '.id')

# 2. Link back to parent work
bd dep add $NEW_ID delivery-app-lab-current --type discovered-from --json

# 3. Decide: handle now or defer?
# If blocking current work → switch to new issue
# If not blocking → continue, new issue will appear in `bd ready`
```

---

### Querying and Inspection

```bash
# List with filters
bd list --status open --json
bd list --priority 0,1 --type bug --json
bd list --label backend,urgent --json

# Show full details
bd show delivery-app-lab-eia --json

# Check blocked issues
bd blocked --json

# Project statistics
bd stats --json

# Search by text
bd search "authentication" --json
```

---

### Labels for This Project

| Label | Use For |
|-------|---------|
| `backend` | NestJS API work |
| `mobile` | Expo/React Native |
| `database` | Prisma/PostgreSQL/PostGIS |
| `infra` | DevOps, CI/CD, config |
| `security` | Auth, encryption, vulnerabilities |
| `testing` | Unit/E2E test coverage |
| `urgent` | Time-critical items |

---

### Best Practices

**DO:**
- ✅ Always use `--json` for programmatic access
- ✅ Always include `--description` when creating issues
- ✅ Use dependencies to model task relationships
- ✅ Query `bd ready` at session start
- ✅ Link discovered work back to parent issues
- ✅ Close with descriptive reasons
- ✅ Run `bd sync` before session end

**DON'T:**
- ❌ Create circular dependencies
- ❌ Skip updating status (confuses ready work detection)
- ❌ Forget to link discovered issues
- ❌ Use short descriptions — be verbose and self-documenting

---

### Issue Prefix: `delivery-app-lab`

IDs look like: `delivery-app-lab-eia`, `delivery-app-lab-rmk`

**JSON Output Parsing Example:**
```bash
# Get first ready issue
ISSUE=$(bd ready --json | jq -r '.[0]')
ISSUE_ID=$(echo "$ISSUE" | jq -r '.id')
ISSUE_TITLE=$(echo "$ISSUE" | jq -r '.title')

# Check if any ready work exists
READY_COUNT=$(bd ready --json | jq 'length')
```

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

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - `bd create "..." --label backend --json`
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - `bd close <id> --json` for finished, update in-progress
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
