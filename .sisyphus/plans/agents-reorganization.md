# Agents Reorganization — Logship-MVP

## TL;DR

> **Objective**: Reorganize agent configuration for optimal OpenCode compatibility
>
> **Scope**:
> - Move `AGENTS.md` from `.opencode/` to repository root
> - Rewrite `AGENTS.md` following agents.md specification
> - Relocate 54 skills from `.agents/skills/` to `.opencode/skills/`
>
> **Estimated Effort**: Medium (2-3 hours)
> **Parallel Execution**: YES — Task 3 can run parallel with Tasks 1-2

---

## Context

### Current State
- **AGENTS.md**: Located at `.opencode/AGENTS.md` (106 lines)
  - Missing TL;DR section
  - No explicit external file loading instructions
  - Format not optimized for LLM parsing
  
- **Skills**: Located at `.agents/skills/` (54 active + 6 archived)
  - All skills verified: correct frontmatter, ≤500 lines, Bun commands
  - Lower priority location (`.opencode/skills/` has higher precedence)

- **Archive**: `.agents/skills/.archive/` (6 skills)
  - next-best-practices, next-cache-components, next-upgrade
  - frontend-testing, jwt-auth, jwt-security

### Target State
- **AGENTS.md**: At repository root (`./AGENTS.md`)
  - Universal compatibility (OpenCode, Cursor, Codex, Claude Code)
  - agents.md spec compliant
  - Explicit instructions for agent behavior

- **Skills**: At `.opencode/skills/` (54 active)
  - Highest priority for OpenCode
  - Maintained format compliance
  - Archive stays at `.agents/skills/.archive/`

### Project Context
**Logship-MVP**: On-demand delivery platform for Vietnam market
- **Status**: Phase 1 Foundation, 25% complete
- **Current Task**: 1.2.1 Initialize Prisma
- **Tech Stack**: NestJS 11 + Bun + Prisma 7.4 + Neon PostgreSQL + Expo SDK 54

---

## Work Objectives

### Core Objective
Reorganize agent configuration files to maximize OpenCode effectiveness while maintaining universal compatibility.

### Concrete Deliverables
1. `./AGENTS.md` — Rewritten following agents.md specification
2. `.opencode/skills/*` — 54 skills relocated with maintained format
3. `.agents/skills/.archive/*` — Preserved (6 archived skills)
4. `.opencode/AGENTS.md` — Optionally removed or symlinked

### Definition of Done
- [ ] `./AGENTS.md` exists and is readable by all agent tools
- [ ] `AGENTS.md` contains: TL;DR, Project Structure, Commands, External Loading Instructions
- [ ] All 54 skills present in `.opencode/skills/`
- [ ] All skills maintain format compliance (frontmatter, ≤500 lines)
- [ ] No broken references after move
- [ ] Skills load correctly via `skill()` tool

### Must Have
- AGENTS.md filename must be `AGENTS.md` (plural, not `AGENT.md`)
- AGENTS.md must be at repository root
- Skills must maintain name + description frontmatter only
- All Bun commands preserved (no npm/npx)

### Must NOT Have
- No `AGENT.md` (singular) — deprecated
- No nested AGENTS.md files (unless for monorepo packages)
- No duplicate content between old and new locations
- No modification to skill content (only location change)

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Sequential — foundation):
├── Task 1: Move AGENTS.md to root [quick]
└── Task 2: Rewrite AGENTS.md content [unspecified-high]

Wave 2 (Parallel — can run with Wave 1):
└── Task 3: Move skills to .opencode/skills/ [unspecified-high]
    ├── 3a: Create .opencode/skills/ structure
    ├── 3b: Copy 54 skills (maintain format)
    ├── 3c: Verify skill integrity
    └── 3d: Update any internal references

Wave 3 (Final verification):
├── Task 4: Verify AGENTS.md loads correctly [quick]
├── Task 5: Verify skills load via skill() tool [quick]
└── Task 6: Git commit and cleanup [quick]
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|------------|--------|------|
| 1 (Move AGENTS.md) | — | 2, 4 | 1 |
| 2 (Rewrite AGENTS.md) | 1 | 4 | 1 |
| 3 (Move skills) | — | 5 | 2 |
| 4 (Verify AGENTS.md) | 1, 2 | 6 | 3 |
| 5 (Verify skills) | 3 | 6 | 3 |
| 6 (Commit) | 4, 5 | — | 3 |

---

## TODOs

- [ ] 1. Move AGENTS.md to Repository Root

  **What to do**:
  - Move `.opencode/AGENTS.md` to `./AGENTS.md`
  - Optionally create symlink from `.opencode/AGENTS.md` → `../AGENTS.md` for backward compatibility
  - Update any internal relative paths in the file
  - Verify file is readable at new location

  **Must NOT do**:
  - Don't rename to `AGENT.md` (must stay `AGENTS.md`)
  - Don't modify content yet (handled in Task 2)
  - Don't delete original until verified

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1 start)
  - **Blocks**: Task 2 (rewrite)
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] `./AGENTS.md` exists
  - [ ] `.opencode/AGENTS.md` either removed or symlinked
  - [ ] File permissions maintained (readable)

  **QA Scenarios**:
  ```
  Scenario: File exists at root
    Tool: Bash
    Steps:
      1. ls -la ./AGENTS.md
      2. cat ./AGENTS.md | head -5
    Expected Result: File exists and readable
    Evidence: .sisyphus/evidence/task-1-agents-exists.txt
  ```

  **Commit**: YES
  - Message: `chore(config): move AGENTS.md to repository root`
  - Files: `AGENTS.md`, `.opencode/AGENTS.md`

---

- [ ] 2. Rewrite AGENTS.md Following agents.md Spec

  **What to do**:
  Rewrite `./AGENTS.md` with the following structure:

  ```markdown
  # Logship-MVP — AI Agent Guide

  > **Project**: On-demand delivery platform for Vietnam market  
  > **Status**: Phase 1 Foundation (25% complete)  
  > **Current Task**: 1.2.1 Initialize Prisma  
  > **Last Updated**: February 19, 2026

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
  │   └── admin/               # Next.js dashboard
  ├── docs/                    # ⭐ READ FIRST: CURRENT_STATE.md
  ├── .opencode/skills/        # Project-specific skills
  └── AGENTS.md               # This file
  ```

  **Critical Files** (ALWAYS read first):
  - `docs/be/dev-v1/CURRENT_STATE.md` — Progress & decisions
  - `docs/00-Unified-Tech-Stack-Spec.md` — Tech versions
  - `docs/07-Backend-Architecture.md` — Architecture patterns

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
  - Repository: **ONLY data access**, no business logic
  - Use **Zod v4** for validation (NEVER class-validator for app logic)
  - **Soft deletes** (`deletedAt`) — never hard delete
  - UUID primary keys

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
  | Auth | Firebase Admin | ^13.6.1 (Phone OTP) |
  | Mobile | Expo SDK | 54 |
  | Mobile Runtime | React Native | 0.84.0 |

  **Prisma v7 Notes**:
  - Driver adapter required: `@prisma/adapter-neon`
  - ESM imports only
  - Output path: `generated/prisma`
  - Config: `prisma.config.ts`

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

  ## References

  - [Tool Integration & MCP Help](.opencode/opencode.md)
  - [System Design](docs/01-SDD-System-Design-Document.md)
  - [Database Design](docs/02-Database-Design-Document.md)
  - [API Specification](docs/03-API-Design-Document.md)
  ```

  **Key Requirements**:
  - Must start with H1: `# Logship-MVP — AI Agent Guide`
  - Must have TL;DR section with tech stack and current task
  - Must have explicit "External File Loading Instructions"
  - Use standard markdown (no YAML frontmatter needed)
  - Keep under 200 lines for optimal token usage

  **Must NOT do**:
  - Don't use `AGENT.md` (singular) — must be `AGENTS.md`
  - Don't add YAML frontmatter (not required by spec)
  - Don't exceed 32 KiB (current limit for agent context)

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: none needed

  **Parallelization**:
  - **Can Run In Parallel**: NO (must wait for Task 1)
  - **Blocks**: Task 4 (verification)
  - **Blocked By**: Task 1

  **References**:
  - Original: `./AGENTS.md` (after Task 1)
  - Project context: `docs/be/dev-v1/CURRENT_STATE.md`
  - Tech spec: `docs/00-Unified-Tech-Stack-Spec.md`
  - agents.md spec: https://agents.md

  **Acceptance Criteria**:
  - [ ] File starts with H1: `# Logship-MVP — AI Agent Guide`
  - [ ] Contains `## TL;DR` section
  - [ ] Contains `## External File Loading Instructions`
  - [ ] All Bun commands use correct syntax (no npm/npx)
  - [ ] Tech stack versions match `docs/00-Unified-Tech-Stack-Spec.md`
  - [ ] File size < 32 KiB

  **QA Scenarios**:
  ```
  Scenario: Format compliance
    Tool: Bash
    Steps:
      1. head -1 ./AGENTS.md | grep "# Logship-MVP"
      2. grep "## TL;DR" ./AGENTS.md
      3. grep "## External File Loading Instructions" ./AGENTS.md
      4. wc -c ./AGENTS.md | awk '{print $1}' | compare with 32768
    Expected Result: All sections present, size < 32 KiB
    Evidence: .sisyphus/evidence/task-2-format-check.txt

  Scenario: No npm references
    Tool: Bash
    Steps:
      1. grep -i "npm install\|npx " ./AGENTS.md | wc -l
    Expected Result: 0
    Evidence: .sisyphus/evidence/task-2-no-npm.txt
  ```

  **Commit**: YES (group with Task 1)
  - Message: `docs(agents): rewrite AGENTS.md following agents.md spec`
  - Files: `AGENTS.md`

---

- [ ] 3. Move Skills to `.opencode/skills/`

  **What to do**:
  Move all 54 active skills from `.agents/skills/` to `.opencode/skills/`:

  **Skills to move** (54 total):
  - architecture-designer, architecture-patterns, backend-patterns
  - building-native-ui, crawl, database-design, database-schema-designer
  - delivery-order-matching, delivery-pricing-engine, e2e-testing-patterns
  - expo-api-routes, expo-cicd-workflows, expo-deployment, expo-dev-client
  - expo-location-patterns, expo-notifications, expo-tailwind-setup
  - extract, find-skills, firebase, frontend-design, goong-maps-integration
  - hey-api-patterns, javascript-testing-patterns, native-data-fetching
  - neon-postgres, nestjs-best-practices, nestjs-firebase-auth, nestjs-modular-monolith
  - openapi-spec-generation, postgis-skill, prisma-database-setup, prisma-expert
  - qa-test-planner, react-hook-form, react-native-animations, react-native-architecture
  - research, rest-api-design, search, skill-creator, tailwindcss
  - tanstack-query, tanstack-table, tavily-best-practices, typescript
  - typescript-advanced-types, typescript-e2e-testing, ui-ux-pro-max
  - upgrading-expo, use-dom, vercel-composition-patterns, vercel-react-best-practices
  - vercel-react-native-skills, vietnam-phone-validation, web-design-guidelines
  - websocket-engineer, writing-plans, zod, zustand

  **Preserve archive**:
  - Keep `.agents/skills/.archive/` with 6 archived skills
  - Do NOT move archive

  **Verify after move**:
  - Each skill: `SKILL.md` exists with correct frontmatter
  - Line count: All ≤ 500 lines
  - No npm/npx references (except documented exceptions)
  - References/ folders maintained

  **Must NOT do**:
  - Don't modify skill content (only move)
  - Don't move `.archive/` folder
  - Don't break skill format

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2, parallel with Tasks 1-2)
  - **Blocks**: Task 5 (skill verification)
  - **Blocked By**: None

  **References**:
  - Source: `.agents/skills/*/SKILL.md`
  - Target: `.opencode/skills/*/SKILL.md`
  - Format reference: `.agents/skills/skill-creator/SKILL.md`

  **Acceptance Criteria**:
  - [ ] All 54 skills present in `.opencode/skills/`
  - [ ] Each skill has `SKILL.md` file
  - [ ] All skills ≤ 500 lines
  - [ ] No npm/npx violations
  - [ ] `.agents/skills/.archive/` preserved

  **QA Scenarios**:
  ```
  Scenario: Skills moved correctly
    Tool: Bash
    Steps:
      1. ls .opencode/skills/ | wc -l
      2. ls .agents/skills/.archive/ | wc -l
      3. for skill in .opencode/skills/*/; do test -f "$skill/SKILL.md" && echo "OK: $skill"; done | wc -l
    Expected Result: 54 skills in .opencode/skills/, 6 in .archive/, all have SKILL.md
    Evidence: .sisyphus/evidence/task-3-skills-count.txt

  Scenario: Format maintained
    Tool: Bash
    Steps:
      1. for f in .opencode/skills/*/SKILL.md; do lines=$(wc -l < "$f"); [ "$lines" -gt 500 ] && echo "OVER: $f ($lines)"; done
      2. grep -rn "npm install\|npx " .opencode/skills/*/SKILL.md | grep -v "find-skills" | wc -l
    Expected Result: 0 oversized, 0 npm/npx violations
    Evidence: .sisyphus/evidence/task-3-format-verify.txt
  ```

  **Commit**: YES
  - Message: `chore(skills): move skills to .opencode/skills/ for higher priority`
  - Files: `.opencode/skills/`, `.agents/skills/` (deletions)

---

## Final Verification Wave

- [ ] 4. Verify AGENTS.md Loads Correctly

  Read the new `./AGENTS.md` file and verify:
  - File is accessible at root
  - All sections present (TL;DR, Project Structure, Commands, etc.)
  - No broken internal links

  **QA**:
  ```bash
  head -20 ./AGENTS.md
  grep -c "## " ./AGENTS.md  # Count sections
  ```

- [ ] 5. Verify Skills Load via `skill()` Tool

  Test that skills can be loaded from new location:
  ```typescript
  skill({ name: "find-skills" })
  skill({ name: "prisma-expert" })
  ```

  **QA**:
  ```bash
  ls .opencode/skills/ | head -10
  ```

- [ ] 6. Git Commit and Cleanup

  Final commit with all changes:
  ```bash
  git add .
  git status
  git commit -m "chore: reorganize agent config for optimal OpenCode compatibility

  - Move AGENTS.md to repository root
  - Rewrite AGENTS.md following agents.md spec
  - Move 54 skills to .opencode/skills/ (highest priority)
  - Preserve .agents/skills/.archive/"
  ```

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| Task 1-2 | `docs(agents): move and rewrite AGENTS.md` | `AGENTS.md`, `.opencode/AGENTS.md` |
| Task 3 | `chore(skills): move skills to .opencode/skills/` | `.opencode/skills/`, `.agents/skills/` |
| Task 6 | `chore: final verification and cleanup` | Any remaining changes |

---

## Success Criteria

### Verification Commands

```bash
# AGENTS.md at root
ls ./AGENTS.md

# Skills in correct location
ls .opencode/skills/ | wc -l  # Should be 54

# Archive preserved
ls .agents/skills/.archive/ | wc -l  # Should be 6

# No format violations
for f in .opencode/skills/*/SKILL.md; do
  lines=$(wc -l < "$f")
  [ "$lines" -gt 500 ] && echo "OVER: $f"
done

# No npm references
grep -rn "npm install\|npx " .opencode/skills/*/SKILL.md | grep -v "find-skills"
```

### Final Checklist
- [ ] `./AGENTS.md` exists and readable
- [ ] `.opencode/skills/` contains 54 skills
- [ ] `.agents/skills/.archive/` contains 6 archived skills
- [ ] All skills ≤ 500 lines
- [ ] No npm/npx violations (except documented exceptions)
- [ ] All commits pushed

---

## Notes

### Why `.opencode/skills/` over `.agents/skills/`?

According to OpenCode documentation, skill loading priority is:
1. `.opencode/skills/` — **Highest priority** (OpenCode-native)
2. `.claude/skills/` — Claude-compatible
3. `.agents/skills/` — Generic agent-compatible (lowest priority)

By moving to `.opencode/skills/`, we ensure:
- Highest precedence for skill loading
- Full OpenCode feature support
- Clear separation of concerns (OpenCode config in `.opencode/`)

### Why `./AGENTS.md` over `.opencode/AGENTS.md`?

According to agents.md specification:
- **Root location** (`./AGENTS.md`): Universal compatibility with all tools
- **Nested location** (`.opencode/AGENTS.md`): Tool-specific, may not be seen by other tools

Root location ensures:
- OpenCode can find it
- Cursor can find it
- Codex can find it
- Claude Code can find it
- Any AI assistant can find it
