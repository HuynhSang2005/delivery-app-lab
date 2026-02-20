# Work Plan: AGENTS.md & Skills Reorganization

## Project Context
- **Name**: Logship-MVP
- **Type**: On-demand delivery platform (Uber for deliveries)
- **Market**: Vietnam (Ho Chi Minh City)
- **Current Phase**: Phase 1 Foundation (25% complete)
- **Current Task**: 1.2.1 Initialize Prisma

## Tech Stack Summary
- **Backend**: NestJS 11.1.13 + Bun 1.3.9 + Prisma 7.4 + Neon PostgreSQL + PostGIS
- **Mobile**: Expo SDK 54 + React Native 0.84.0 + React 19.2.4
- **Admin**: Next.js 16 + React 19 + Shadcn/ui
- **Auth**: Firebase Auth (Phone OTP only)
- **Maps**: Goong Maps (Vietnam-optimized, NOT Google Maps)
- **Queue**: BullMQ + Upstash Redis
- **Validation**: Zod 4 (NEVER class-validator for app logic)
- **Architecture**: Modular Monolith + Repository Pattern

## Critical Constraints
- Bun EXCLUSIVELY (no npm, npx, pnpm, yarn)
- Prisma 7.4.0 breaking changes: ESM, driver adapter, prisma.config.ts
- Firebase Phone OTP (NOT JWT)
- Goong Maps for Vietnam (NOT Google Maps)
- Repository Pattern: Controller → Service → Repository

## Tasks Overview

### Task 1: Move AGENTS.md to Root
- **From**: `.opencode/AGENTS.md`
- **To**: `./AGENTS.md`
- **Why**: Universal compatibility with all AI tools (OpenCode, Cursor, Codex, Claude Code)

### Task 2: Rewrite AGENTS.md
- **Current**: 106 lines, lacks TL;DR, no explicit external file loading instructions
- **New Format**: agents.md spec with:
  - TL;DR section (tech stack, current task, constraints)
  - Project Structure (tree format)
  - Development Commands (organized by context)
  - External File Loading Instructions (explicit for agent)
  - ALWAYS/ASK/NEVER boundaries
  - References to critical docs

### Task 3: Move Skills to .opencode/skills/
- **From**: `.agents/skills/` (54 skills)
- **To**: `.opencode/skills/` (highest priority for OpenCode)
- **Preserve**: .agents/skills/.archive/ (6 archived skills)

## Final Verification
- AGENTS.md at root: `./AGENTS.md`
- Skills at: `.opencode/skills/*` (54 skills)
- Archived at: `.agents/skills/.archive/*` (6 skills)
- All skills maintain correct format (frontmatter, line count, bun commands)
