# Skills Audit & Cleanup — Logship-MVP

## TL;DR

> **Quick Summary**: Audit và fix toàn bộ 51 agent skills trong `.agents/skills/` cho dự án Logship-MVP. Xóa skills không liên quan, fix format violations (frontmatter, line count, package manager), fix content accuracy, và copy 10 skills cần thiết từ system scope vào project scope.
>
> **Deliverables**:
> - 6 skills archive (next-best-practices, next-cache-components, next-upgrade, frontend-testing, jwt-auth, jwt-security)
> - `vercel-react-best-practices` giữ lại — chứa React performance rules áp dụng được cho React Native
> - ~25 skills fix extra frontmatter fields
> - ~10 skills trim/extract to references/
> - ~12 skills fix npm/npx → bun/bunx
> - ~5 skills fix content (framework, version, broken links)
> - 10 skills copy từ system scope vào `.agents/skills/`
>
> **Estimated Effort**: XL
> **Parallel Execution**: YES — 5 waves
> **Critical Path**: Wave 1 (verify + archive) → Wave 2 (format fixes) → Wave 3 (content fixes) → Wave 4 (copy skills) → Wave 5 (final audit)

---

## Context

### Original Request
Audit, QA, review và fix tất cả 51 agent skills trong `.agents/skills/`. Xác nhận folder location đúng, kiểm tra format, nội dung, tech stack accuracy, và tạo skills còn thiếu cho project Logship-MVP.

### Interview Summary
**Key Discussions**:
- Folder `.agents/skills/` đã confirm là ĐÚNG cho oh-my-opencode project-scope skills
- Prisma v7 (^7.4.0) là thật, có breaking changes: driver adapter bắt buộc, ESM, output path `generated/`, `prisma.config.ts`
- Project dùng Bun exclusively (no npm, npx, pnpm, yarn)
- Project dùng NestJS (không phải Express/Next.js), Firebase Phone OTP (không phải JWT)
- 10 skills "cần tạo mới" thực ra đã tồn tại ở system scope — cần COPY vào project scope

**Research Findings**:
- skill-creator SKILL.md là format reference chuẩn (nhưng chính nó có `license` field vi phạm → phải fix)
- Format rules: ONLY `name` + `description` frontmatter, ≤500 lines body, heavy content → `references/`
- System scope skills available: delivery-order-matching, delivery-pricing-engine, expo-location-patterns, expo-notifications, goong-maps-integration, hey-api-patterns, nestjs-firebase-auth, nestjs-modular-monolith, postgis-skill, vietnam-phone-validation

### Metis Review
**Identified Gaps** (addressed):
- Gap "10 new skills may already exist in system scope": **Resolved** — task changed from CREATE to COPY from system scope
- Gap "skill-creator itself violates format": **Added** to fix list as Wave 1 priority
- Gap "no rollback plan": **Resolved** — Phase 1 archives skills before removing
- Gap "reference file structure undefined": **Resolved** — defined in guardrails below
- Gap "merges risky": **Resolved** — skip merges, just fix format on both skills independently

---

## Work Objectives

### Core Objective
Clean, format-compliant, project-accurate set of agent skills in `.agents/skills/` that properly supports the Logship-MVP tech stack (NestJS + Bun + Prisma v7 + Neon PostgreSQL + PostGIS + Expo SDK 54 + Firebase Phone OTP + Goong Maps).

### Concrete Deliverables
- `.agents/skills/` with ~54 total skills (51 - 7 removed + 10 copied from system)
- Each skill: frontmatter has ONLY `name` + `description`
- Each skill: body ≤ 500 lines (heavy content in `references/`)
- Each skill: no npm/npx/pnpm/yarn commands (except documented exceptions)
- Each skill: no Express/Next.js/Python examples
- `.agents/skills/.archive/` with 6 archived (not deleted) skills
- System-scope skills copied to project scope where project-specific customization needed

### Definition of Done
- [ ] `grep -r "^license:" .agents/skills/*/SKILL.md` returns 0 results
- [ ] `grep -r "^version:" .agents/skills/*/SKILL.md` returns 0 results
- [ ] `grep -rn "npm install\|npx " .agents/skills/` returns 0 results (except documented exceptions)
- [ ] All SKILL.md files ≤ 500 lines (verify with `wc -l`)
- [ ] All 7 archived skills exist in `.agents/skills/.archive/`
- [ ] All 10 system-scope skills copied to `.agents/skills/`

### Must Have
- Archive (not delete) skills being removed
- Fix `skill-creator` frontmatter first (it's the format reference)
- Fix every extra frontmatter field across all skills
- All Bun-exclusive package manager usage
- All NestJS/TypeScript examples (no Express, no Next.js, no Python)

### Must NOT Have (Guardrails)
- DO NOT delete skills without archiving first
- DO NOT merge skills (only format-fix each independently)
- DO NOT rewrite content beyond fixing framework/package manager
- DO NOT add new content when fixing format (separate concerns)
- DO NOT create skills from scratch — copy from system scope instead
- DO NOT change description text unless it explicitly mentions wrong framework
- DO NOT modify `.opencode/AGENTS.md` or project files outside `.agents/skills/`
- Extra frontmatter fields: `license`, `version`, `metadata`, `allowed-tools`, `argument-hint`, `user-invocable`, `sasmp_version`, `bonded_agent`, `bond_type`, `updated`, `trigger`
- Express, Next.js, or Python examples in NestJS-specific skills
- `npm install`, `npx ` commands (always use `bun add`, `bunx`)
- References nested more than 1 level deep (`references/subdir/` is forbidden)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (skill verification = grep + line count checks)
- **Automated tests**: None (skills are markdown, not code)
- **Framework**: bash/grep commands for format verification

### QA Policy
Each task verified via bash grep commands and file reads. Evidence captured to `.sisyphus/evidence/`.

| Deliverable Type | Verification Tool | Method |
|------------------|-------------------|--------|
| Frontmatter fix | Bash (grep) | `grep -c "^license:\|^version:\|^metadata:" file` → 0 |
| Line count fix | Bash (wc -l) | `wc -l SKILL.md` ≤ 500 |
| Package manager | Bash (grep) | `grep -n "npm install\|npx " SKILL.md` → 0 results |
| Content fix | Read | Read file, verify no Express/Python examples |
| Archive | Bash (ls) | `ls .agents/skills/.archive/{name}/` exists |
| Copy from system | Read | Read file, verify content present |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — setup + quick wins):
├── Task 1: Create .archive/ folder + archive 7 skills [quick]
├── Task 2: Fix skill-creator frontmatter (license field) [quick]
├── Task 3: Fix frontmatter — Batch A (expo skills: 8 skills) [quick]
├── Task 4: Fix frontmatter — Batch B (nestjs/prisma/db skills: 6 skills) [quick]
└── Task 5: Fix frontmatter — Batch C (misc skills: 10 skills) [quick]

Wave 2 (After Wave 1 — content fixes, MAX PARALLEL):
├── Task 6: Fix npm→bun — Batch A (expo skills: 6 skills) [quick]
├── Task 7: Fix npm→bun — Batch B (other skills: 6 skills) [quick]
├── Task 8: Fix architecture-patterns (Python→TypeScript/NestJS examples) [unspecified-high]
├── Task 9: Fix backend-patterns description (Express/Next.js→NestJS) [quick]
├── Task 10: Fix prisma-expert (v5/v6→v7 patterns) [unspecified-high]
└── Task 11: Fix architecture-designer broken references [quick]

Wave 3 (After Wave 2 — line count extractions):
├── Task 12: Trim javascript-testing-patterns (1021L → ≤500, extract references/) [unspecified-high]
├── Task 13: Trim openapi-spec-generation (1024L → ≤500, extract references/) [unspecified-high]
├── Task 14: Trim qa-test-planner (757L → ≤500, extract references/) [unspecified-high]
├── Task 15: Trim firebase (744L → ≤500, extract references/) [unspecified-high]
├── Task 16: Trim typescript-advanced-types (724L → ≤500, extract references/) [unspecified-high]
└── Task 17: Trim tanstack-table + database-schema-designer + react-native-architecture + backend-patterns (4 skills) [unspecified-high]

Wave 4 (After Wave 3 — copy system-scope skills):
├── Task 18: Copy nestjs-firebase-auth + nestjs-modular-monolith from system scope [unspecified-high]
├── Task 19: Copy goong-maps-integration + vietnam-phone-validation from system scope [unspecified-high]
├── Task 20: Copy expo-location-patterns + expo-notifications from system scope [unspecified-high]
├── Task 21: Copy delivery-order-matching + delivery-pricing-engine from system scope [unspecified-high]
└── Task 22: Copy hey-api-patterns + postgis-skill from system scope [unspecified-high]

Wave 5 (After ALL — final audit):
├── Task 23: Final format audit — grep all skills for violations [quick]
└── Task 24: Final content audit — spot check 10 random skills [unspecified-high]
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|------------|--------|------|
| 1-5 | — | 6-11 | 1 |
| 6-11 | 1-5 | 12-17 | 2 |
| 12-17 | 6-11 | 18-22 | 3 |
| 18-22 | 12-17 | 23-24 | 4 |
| 23-24 | 18-22 | — | 5 |

### Agent Dispatch Summary

| Wave | # Parallel | Tasks → Agent Category |
|------|------------|----------------------|
| 1 | **5** | T1-T2 → `quick`, T3-T5 → `quick` |
| 2 | **6** | T6-T7 → `quick`, T8 → `unspecified-high`, T9 → `quick`, T10 → `unspecified-high`, T11 → `quick` |
| 3 | **6** | T12-T17 → `unspecified-high` |
| 4 | **5** | T18-T22 → `unspecified-high` |
| 5 | **2** | T23 → `quick`, T24 → `unspecified-high` |

---

## TODOs

- [x] 1. Create `.archive/` folder và archive 6 skills không liên quan

  **Status**: ✅ COMPLETED (thực thi bằng bash)

  **What to do**:
  - Tạo folder `.agents/skills/.archive/`
  - Move (copy + xóa) các skills sau vào `.archive/`:
    - `next-best-practices` — Next.js app router, project dùng NestJS
    - `next-cache-components` — Next.js 16 PPR, hoàn toàn không liên quan
    - `next-upgrade` — Next.js migration guide
    - `frontend-testing` — **Hardcoded cho Dify project** (references `web/docs/test.md`, Dify-specific paths)
    - `jwt-auth` — Project dùng Firebase Phone OTP, không JWT
    - `jwt-security` — Project dùng Firebase Phone OTP, không JWT
  - ~~`vercel-react-best-practices`~~ — **KHÔNG archive** — chứa 57 React performance optimization rules từ Vercel Engineering, các patterns (waterfall elimination, Promise.all, memoization, state optimization) áp dụng được cho React Native
  - Verify tất cả 6 folders tồn tại trong `.archive/`

  **Must NOT do**:
  - Không xóa vĩnh viễn — chỉ move vào `.archive/`
  - Không archive `vercel-composition-patterns` (React 19 composition — relevant cho React Native)
  - Không archive `vercel-react-native-skills` (React Native + Expo — relevant)
  - Không archive `vercel-react-best-practices` (React performance rules — relevant cho React Native)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none needed

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Tasks 6-24
  - **Blocked By**: None (can start immediately)

  **References**:
  - `.agents/skills/` — source directory
  - `.sisyphus/drafts/skills-audit.md` — audit findings

  **Acceptance Criteria**:
  - [x] `.agents/skills/.archive/` folder exists
  - [x] 6 skills removed from active directory: next-best-practices, next-cache-components, next-upgrade, frontend-testing, jwt-auth, jwt-security
  - [x] `vercel-react-best-practices` present in `.agents/skills/` (restored to active — archive copy kept as backup)
  - [x] Each archived folder contains SKILL.md

  **QA Scenarios**:
  ```
  Scenario: Archive verification
    Tool: Bash
    Steps:
      1. Run: ls .agents/skills/.archive/
      2. Count 7 directories
      3. Run: ls .agents/skills/jwt-auth 2>&1 → must return "No such file"
      4. Run: ls .agents/skills/.archive/jwt-auth/SKILL.md → must exist
    Expected Result: 7 archived, originals gone
    Evidence: .sisyphus/evidence/task-1-archive-verify.txt
  ```

  **Commit**: YES
  - Message: `chore(skills): archive 7 irrelevant skills (Next.js, JWT, Dify-specific)`
  - Files: `.agents/skills/.archive/`

- [x] 2. Fix `skill-creator` frontmatter (format reference canonical)

  **What to do**:
  - Đọc `.agents/skills/skill-creator/SKILL.md`
  - Xóa `license: Complete terms in LICENSE.txt` khỏi frontmatter
  - Verify frontmatter chỉ còn `name` và `description`
  - Đây là skill quan trọng nhất — phải fix trước khi làm bất kỳ skill nào khác

  **Must NOT do**:
  - Không thay đổi body content
  - Không thay đổi `name` hoặc `description`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: Tasks 6-24 (conceptually — is the format reference)
  - **Blocked By**: None

  **References**:
  - `.agents/skills/skill-creator/SKILL.md` — the file to fix

  **Acceptance Criteria**:
  - [ ] `grep "^license:" .agents/skills/skill-creator/SKILL.md` → 0 results
  - [ ] Frontmatter contains exactly: `name: skill-creator` and `description: ...`

  **QA Scenarios**:
  ```
  Scenario: Frontmatter clean
    Tool: Bash
    Steps:
      1. Run: head -6 .agents/skills/skill-creator/SKILL.md
      2. Verify only "---", "name:", "description:", "---" lines present (no license:)
    Expected Result: Clean frontmatter with 2 fields only
    Evidence: .sisyphus/evidence/task-2-skill-creator-fm.txt
  ```

  **Commit**: YES (group with Task 1)

- [x] 3. Fix frontmatter — Batch A (Expo skills: 8 skills)

  **What to do**:
  Fix tất cả extra frontmatter fields trong các expo skills sau. Chỉ giữ `name` và `description`.
  Skills cần fix:
  - `building-native-ui` — xóa: `version`, `license`
  - `expo-api-routes` — xóa: `version`, `license`
  - `expo-cicd-workflows` — xóa: `allowed-tools`, `version`, `license`
  - `expo-deployment` — xóa: `version`, `license`
  - `expo-dev-client` — xóa: `version`, `license`
  - `expo-tailwind-setup` — xóa: `version`, `license`
  - `upgrading-expo` — xóa: `version`, `license`
  - `use-dom` — xóa: `version`, `license`

  **Must NOT do**:
  - Không thay đổi `name` hay `description` của bất kỳ skill nào
  - Không thay đổi body content
  - Không fix npm commands trong task này (handled in Wave 2)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: Tasks 6-24
  - **Blocked By**: None

  **References**:
  - `.agents/skills/building-native-ui/SKILL.md` through `.agents/skills/use-dom/SKILL.md`
  - `.agents/skills/skill-creator/SKILL.md` — format reference (or after Task 2 fix)

  **Acceptance Criteria**:
  - [ ] `grep -l "^version:\|^license:\|^allowed-tools:" .agents/skills/building-native-ui/SKILL.md .agents/skills/expo-api-routes/SKILL.md .agents/skills/expo-cicd-workflows/SKILL.md .agents/skills/expo-deployment/SKILL.md .agents/skills/expo-dev-client/SKILL.md .agents/skills/expo-tailwind-setup/SKILL.md .agents/skills/upgrading-expo/SKILL.md .agents/skills/use-dom/SKILL.md` → 0 files

  **QA Scenarios**:
  ```
  Scenario: All 8 expo skills have clean frontmatter
    Tool: Bash
    Steps:
      1. Run: grep -l "^version:\|^license:\|^allowed-tools:" .agents/skills/building-native-ui/SKILL.md .agents/skills/expo-*/SKILL.md .agents/skills/upgrading-expo/SKILL.md .agents/skills/use-dom/SKILL.md
      2. Count output lines → must be 0
    Expected Result: No files with extra frontmatter fields
    Evidence: .sisyphus/evidence/task-3-expo-fm.txt
  ```

  **Commit**: YES (group with Wave 1 commit)

- [x] 4. Fix frontmatter — Batch B (NestJS/Prisma/DB skills: 6 skills)

  **What to do**:
  - `nestjs-best-practices` — xóa: `license`, `metadata` (author, version fields)
  - `prisma-database-setup` — xóa: `license`, `metadata`
  - `architecture-designer` — xóa: `license`, `metadata` (author, version, domain, triggers, role, scope, output-format, related-skills)
  - `database-schema-designer` — xóa: `license`
  - `native-data-fetching` — xóa: `version`, `license`
  - `tanstack-query` — xóa: `license`, `metadata`

  **Must NOT do**:
  - Không thay đổi `name` hay `description`
  - Không thay đổi body content

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: Tasks 6-24
  - **Blocked By**: None

  **References**:
  - Each respective SKILL.md file

  **Acceptance Criteria**:
  - [ ] `grep -l "^license:\|^version:\|^metadata:" .agents/skills/nestjs-best-practices/SKILL.md .agents/skills/prisma-database-setup/SKILL.md .agents/skills/architecture-designer/SKILL.md .agents/skills/database-schema-designer/SKILL.md .agents/skills/native-data-fetching/SKILL.md .agents/skills/tanstack-query/SKILL.md` → 0 files

  **QA Scenarios**:
  ```
  Scenario: All 6 skills have clean frontmatter
    Tool: Bash
    Steps:
      1. grep -rn "^license:\|^version:\|^metadata:" .agents/skills/nestjs-best-practices/SKILL.md .agents/skills/prisma-database-setup/SKILL.md .agents/skills/architecture-designer/SKILL.md .agents/skills/database-schema-designer/SKILL.md .agents/skills/native-data-fetching/SKILL.md .agents/skills/tanstack-query/SKILL.md
      2. Count → must be 0
    Expected Result: 0 violations
    Evidence: .sisyphus/evidence/task-4-nestjs-prisma-fm.txt
  ```

  **Commit**: YES (group with Wave 1 commit)

- [x] 5. Fix frontmatter — Batch C (misc skills: 10 skills)

  **What to do**:
  - `react-native-animations` — xóa: `sasmp_version`, `bonded_agent`, `bond_type`, `version`, `updated`
  - `tailwindcss` — xóa: `metadata` (author, version, source)
  - `tanstack-table` — xóa: `license`, `allowed-tools`, `metadata`
  - `vercel-react-native-skills` — xóa: `license`
  - `web-design-guidelines` — xóa: `metadata` (author, version, argument-hint)
  - `websocket-engineer` — xóa: `license`, `metadata`
  - `frontend-design` — xóa: `license`
  - `qa-test-planner` — xóa: `trigger`
  - `vercel-composition-patterns` — check và fix nếu có extra fields
  - `typescript-e2e-testing` — check frontmatter, fix nếu cần

  **Must NOT do**:
  - Không thay đổi `name` hay `description`
  - Không thay đổi body content

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: Tasks 6-24
  - **Blocked By**: None

  **References**:
  - Each respective SKILL.md file

  **Acceptance Criteria**:
  - [ ] `grep -rn "^license:\|^version:\|^metadata:\|^allowed-tools:\|^sasmp_version:\|^bonded_agent:\|^bond_type:\|^updated:\|^trigger:\|^argument-hint:" .agents/skills/react-native-animations/SKILL.md .agents/skills/tailwindcss/SKILL.md .agents/skills/tanstack-table/SKILL.md .agents/skills/vercel-react-native-skills/SKILL.md .agents/skills/web-design-guidelines/SKILL.md .agents/skills/websocket-engineer/SKILL.md .agents/skills/frontend-design/SKILL.md .agents/skills/qa-test-planner/SKILL.md` → 0 results

  **QA Scenarios**:
  ```
  Scenario: Misc skills clean frontmatter
    Tool: Bash
    Steps:
      1. grep -rn "^license:\|^version:\|^metadata:\|^allowed-tools:\|^sasmp_version:\|^bonded_agent:\|^bond_type:\|^updated:\|^trigger:" .agents/skills/react-native-animations/SKILL.md .agents/skills/tailwindcss/SKILL.md .agents/skills/tanstack-table/SKILL.md .agents/skills/vercel-react-native-skills/SKILL.md .agents/skills/web-design-guidelines/SKILL.md .agents/skills/websocket-engineer/SKILL.md .agents/skills/frontend-design/SKILL.md .agents/skills/qa-test-planner/SKILL.md
      2. Count → must be 0
    Expected Result: 0 violations across all 10 skills
    Evidence: .sisyphus/evidence/task-5-misc-fm.txt
  ```

  **Commit**: YES (group with Wave 1 commit)

- [ ] 6. Fix npm→bun — Batch A (Expo skills: 6 skills)

  **What to do**:
  Replace all npm/npx commands with bun/bunx equivalents in:
  - `building-native-ui` — `npx expo start` → `bunx expo start`, `npx expo run:ios` → `bunx expo run:ios`
  - `expo-api-routes` — `npx expo serve` → `bunx expo serve`, `npm install -g eas-cli` → `bun add -g eas-cli`
  - `expo-cicd-workflows` — `npm install --prefix` → `bun install --cwd`
  - `expo-deployment` — `npm install -g eas-cli` → `bun add -g eas-cli`, `npx eas-cli` → `bunx eas-cli@latest`
  - `expo-dev-client` — `npx expo start` → `bunx expo start`
  - `expo-tailwind-setup` — `npx expo install` → `bunx expo install`

  **Must NOT do**:
  - Không thay đổi frontmatter (đã xử lý trong Wave 1)
  - Không thay đổi nội dung logic, chỉ thay package manager commands

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2, with Tasks 7-11)
  - **Blocked By**: Tasks 1-5 (Wave 1)

  **Acceptance Criteria**:
  - [ ] `grep -rn "npm install\|npx " .agents/skills/building-native-ui/SKILL.md .agents/skills/expo-api-routes/SKILL.md .agents/skills/expo-cicd-workflows/SKILL.md .agents/skills/expo-deployment/SKILL.md .agents/skills/expo-dev-client/SKILL.md .agents/skills/expo-tailwind-setup/SKILL.md` → 0 results

  **QA Scenarios**:
  ```
  Scenario: Expo skills use bun/bunx
    Tool: Bash
    Steps:
      1. grep -rn "npm install\|npx " .agents/skills/building-native-ui/SKILL.md .agents/skills/expo-*/SKILL.md
      2. Count → 0
      3. grep -n "bun\|bunx" .agents/skills/expo-dev-client/SKILL.md → at least 1 result (verify replacement worked)
    Expected Result: 0 npm/npx, presence of bun/bunx
    Evidence: .sisyphus/evidence/task-6-expo-bun.txt
  ```

  **Commit**: YES (Wave 2 group commit)

- [ ] 7. Fix npm→bun — Batch B (other skills: 6 skills)

  **What to do**:
  - `firebase` — `npm install -g firebase-tools` → `bun add -g firebase-tools`
  - `prisma-database-setup` — `npm install prisma` → `bun add prisma`, `npm install @prisma/client` → `bun add @prisma/client`
  - `prisma-expert` — `npx prisma generate` → `bunx --bun prisma generate`, `npx prisma migrate` → `bunx --bun prisma migrate`
  - `react-native-animations` — `npm install react-native-reanimated` → `bun add react-native-reanimated`
  - `e2e-testing-patterns` — `npx playwright test` → `bunx playwright test`
  - `openapi-spec-generation` — `npm install -g` tools → `bun add -g`

  **Must NOT do**:
  - Không thay đổi `find-skills` skill's `npx skills` (special CLI tool — documented exception)
  - Không thay đổi logic hay architecture content

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2, with Tasks 6, 8-11)
  - **Blocked By**: Tasks 1-5 (Wave 1)

  **Acceptance Criteria**:
  - [ ] `grep -rn "npm install\|npx " .agents/skills/firebase/SKILL.md .agents/skills/prisma-database-setup/SKILL.md .agents/skills/prisma-expert/SKILL.md .agents/skills/react-native-animations/SKILL.md .agents/skills/e2e-testing-patterns/SKILL.md .agents/skills/openapi-spec-generation/SKILL.md` → 0 results

  **QA Scenarios**:
  ```
  Scenario: Other skills use bun/bunx
    Tool: Bash
    Steps:
      1. grep -rn "npm install\|npx " .agents/skills/firebase/SKILL.md .agents/skills/prisma-database-setup/SKILL.md .agents/skills/prisma-expert/SKILL.md .agents/skills/react-native-animations/SKILL.md .agents/skills/e2e-testing-patterns/SKILL.md .agents/skills/openapi-spec-generation/SKILL.md
      2. Count → 0
    Expected Result: 0 npm/npx references
    Evidence: .sisyphus/evidence/task-7-other-bun.txt
  ```

  **Commit**: YES (Wave 2 group commit)

- [ ] 8. Fix `architecture-patterns` — Python examples → TypeScript/NestJS

  **What to do**:
  - Read `.agents/skills/architecture-patterns/SKILL.md` fully
  - Identify all Python/FastAPI code examples
  - Replace them with TypeScript/NestJS equivalents showing same architectural pattern
  - Keep same architecture concepts (Clean Architecture, Hexagonal, DDD) but use NestJS syntax
  - Do NOT change the overall skill structure or section headings
  - Examples: Python FastAPI route → NestJS Controller, Python service class → NestJS @Injectable() service

  **Must NOT do**:
  - Không rewrite entire skill từ đầu
  - Không thêm nội dung mới ngoài thay thế examples
  - Không thêm Prisma-specific code (scope creep)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`nestjs-expert`]
    - `nestjs-expert`: NestJS module architecture, DI, patterns — needed for accurate TypeScript/NestJS examples

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2, with Tasks 6, 7, 9-11)
  - **Blocked By**: Tasks 1-5 (Wave 1)

  **References**:
  - `.agents/skills/architecture-patterns/SKILL.md` — file to fix
  - `docs/07-Backend-Architecture.md` — project architecture reference
  - `.opencode/AGENTS.md` — NestJS module structure reference

  **Acceptance Criteria**:
  - [ ] `grep -n "FastAPI\|from fastapi\|@app.get\|def " .agents/skills/architecture-patterns/SKILL.md` → 0 results
  - [ ] `grep -n "NestJS\|@Controller\|@Injectable\|@Module" .agents/skills/architecture-patterns/SKILL.md` → at least 3 results

  **QA Scenarios**:
  ```
  Scenario: No Python examples remain
    Tool: Bash
    Steps:
      1. grep -n "FastAPI\|from fastapi\|def \|@app\." .agents/skills/architecture-patterns/SKILL.md
      2. Count → 0
    Expected Result: Zero Python/FastAPI references
    Evidence: .sisyphus/evidence/task-8-arch-python.txt

  Scenario: NestJS examples present
    Tool: Bash
    Steps:
      1. grep -n "@Controller\|@Injectable\|@Module\|NestJS" .agents/skills/architecture-patterns/SKILL.md
      2. Count → ≥3 results
    Expected Result: Concrete NestJS examples present
    Evidence: .sisyphus/evidence/task-8-arch-nestjs.txt
  ```

  **Commit**: YES (Wave 2 group commit)

- [ ] 9. Fix `backend-patterns` description + content references

  **What to do**:
  - Read `.agents/skills/backend-patterns/SKILL.md`
  - Fix `description` frontmatter: remove "Node.js, Express, and Next.js API routes" → replace with "NestJS"
  - Scan body for any Express/Next.js API route examples
  - Replace Express router examples with NestJS Controller examples
  - If body >500 lines (it's 597L), extract overflow content to `references/backend-patterns.md`

  **Must NOT do**:
  - Không thêm nội dung mới
  - Không restructure toàn bộ skill

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Blocked By**: Tasks 1-5

  **References**:
  - `.agents/skills/backend-patterns/SKILL.md`
  - `.opencode/AGENTS.md` — NestJS architecture reference

  **Acceptance Criteria**:
  - [ ] `grep "Express\|Next.js API" .agents/skills/backend-patterns/SKILL.md | head -5` → description line no longer mentions Express/Next.js
  - [ ] `wc -l .agents/skills/backend-patterns/SKILL.md` → ≤ 500

  **QA Scenarios**:
  ```
  Scenario: Description updated
    Tool: Bash
    Steps:
      1. head -5 .agents/skills/backend-patterns/SKILL.md
      2. Check description field — must not contain "Express" or "Next.js API routes"
    Expected Result: Description mentions NestJS
    Evidence: .sisyphus/evidence/task-9-backend-desc.txt
  ```

  **Commit**: YES (Wave 2 group commit)

- [ ] 10. Fix `prisma-expert` — Update to Prisma v7 patterns

  **What to do**:
  - Read `.agents/skills/prisma-expert/SKILL.md` fully
  - Identify Prisma v5/v6 patterns (old `datasource`, old client import, `npx prisma`)
  - Update to Prisma v7 patterns:
    - Driver adapter required: `@prisma/adapter-neon` + `neonConfig`
    - ESM imports only
    - Output path: `generated/prisma` (not `@prisma/client` default)
    - Config file: `prisma.config.ts`
    - Commands: `bunx --bun prisma generate`, `bunx --bun prisma migrate dev`
  - Keep skill concise — extract heavy examples to `references/prisma-v7.md` if needed

  **Must NOT do**:
  - Không rewrite toàn bộ skill từ đầu
  - Không thêm content không liên quan Prisma

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: none (no prisma skill available yet at this point)

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Blocked By**: Tasks 1-5

  **References**:
  - `.agents/skills/prisma-expert/SKILL.md` — file to fix
  - `docs/00-Unified-Tech-Stack-Spec.md` — Prisma ^7.4.0 spec
  - `prisma.config.ts` (if exists in project root) — real config reference

  **Acceptance Criteria**:
  - [ ] `grep -n "@prisma/client\b" .agents/skills/prisma-expert/SKILL.md` — no old-style default import
  - [ ] `grep -n "adapter\|neonConfig\|prisma.config" .agents/skills/prisma-expert/SKILL.md` → at least 2 results
  - [ ] `grep -n "npx prisma" .agents/skills/prisma-expert/SKILL.md` → 0 results

  **QA Scenarios**:
  ```
  Scenario: v7 patterns present
    Tool: Bash
    Steps:
      1. grep -n "adapter\|neonConfig\|prisma.config\|generated/prisma" .agents/skills/prisma-expert/SKILL.md
      2. Count → ≥2 results
    Expected Result: v7 driver adapter pattern referenced
    Evidence: .sisyphus/evidence/task-10-prisma-v7.txt
  ```

  **Commit**: YES (Wave 2 group commit)

- [ ] 11. Fix `architecture-designer` broken references

  **What to do**:
  - Read `.agents/skills/architecture-designer/SKILL.md`
  - Find all links/references to `references/` files
  - Check if those `references/` files exist
  - If broken: either remove the broken links OR create stub reference files with placeholder content
  - Recommended: Remove broken links (simpler, less scope creep)

  **Must NOT do**:
  - Không tạo fake/empty reference files với nội dung fictional
  - Không thêm nội dung mới

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Blocked By**: Tasks 1-5

  **References**:
  - `.agents/skills/architecture-designer/SKILL.md`
  - `.agents/skills/architecture-designer/references/` (check if exists)

  **Acceptance Criteria**:
  - [ ] All links in `architecture-designer/SKILL.md` point to files that actually exist
  - [ ] `ls .agents/skills/architecture-designer/` shows only files that are referenced

  **QA Scenarios**:
  ```
  Scenario: No broken references
    Tool: Bash
    Steps:
      1. grep -n "\[.*\](references/" .agents/skills/architecture-designer/SKILL.md
      2. For each match, verify the file exists
      3. Count broken → 0
    Expected Result: All referenced files exist
    Evidence: .sisyphus/evidence/task-11-arch-refs.txt
  ```

  **Commit**: YES (Wave 2 group commit)

- [ ] 12. Trim `javascript-testing-patterns` (1021L → ≤500L)

  **What to do**:
  - Read full SKILL.md (1021 lines — largest file)
  - Identify sections to keep in SKILL.md (core guidance, quick reference, key patterns)
  - Move detailed examples, checklists, extended pattern libraries → `references/testing-patterns-extended.md`
  - Update SKILL.md to reference `references/testing-patterns-extended.md`
  - Ensure SKILL.md body ≤ 500 lines

  **Must NOT do**:
  - Không xóa content — chỉ move sang references/
  - Không thay đổi frontmatter (đã fix Wave 1)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3, with Tasks 13-17)
  - **Blocked By**: Tasks 1-11 (Waves 1+2)

  **References**:
  - `.agents/skills/javascript-testing-patterns/SKILL.md`
  - `.agents/skills/skill-creator/SKILL.md` — references/ pattern example

  **Acceptance Criteria**:
  - [ ] `wc -l .agents/skills/javascript-testing-patterns/SKILL.md` → ≤ 500
  - [ ] `ls .agents/skills/javascript-testing-patterns/references/` → at least 1 file
  - [ ] SKILL.md contains link to references/ file

  **QA Scenarios**:
  ```
  Scenario: File trimmed correctly
    Tool: Bash
    Steps:
      1. wc -l .agents/skills/javascript-testing-patterns/SKILL.md → ≤500
      2. ls .agents/skills/javascript-testing-patterns/references/ → non-empty
      3. grep -n "references/" .agents/skills/javascript-testing-patterns/SKILL.md → at least 1 link
    Expected Result: Body ≤500, references/ exists with content
    Evidence: .sisyphus/evidence/task-12-jstesting-trim.txt
  ```

  **Commit**: YES (Wave 3 group commit)

- [ ] 13. Trim `openapi-spec-generation` (1024L → ≤500L)

  **What to do**:
  - Read full SKILL.md (1024 lines — largest alongside javascript-testing-patterns)
  - Move "When to Use This Skill" section content into description frontmatter (it belongs there per spec)
  - Move extended examples, full spec templates → `references/openapi-examples.md`
  - Keep core workflow, key patterns, quick reference in SKILL.md
  - Ensure SKILL.md ≤ 500 lines

  **Must NOT do**:
  - Không xóa content — chỉ move/restructure
  - Không thêm npm commands (đã fix Wave 2)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Blocked By**: Tasks 1-11

  **References**:
  - `.agents/skills/openapi-spec-generation/SKILL.md`

  **Acceptance Criteria**:
  - [ ] `wc -l .agents/skills/openapi-spec-generation/SKILL.md` → ≤ 500
  - [ ] `grep "When to Use" .agents/skills/openapi-spec-generation/SKILL.md` → body no longer has this section header (moved to description)

  **QA Scenarios**:
  ```
  Scenario: Trimmed and restructured
    Tool: Bash
    Steps:
      1. wc -l .agents/skills/openapi-spec-generation/SKILL.md → ≤500
      2. grep "## When to Use" .agents/skills/openapi-spec-generation/SKILL.md → 0 results (moved to description)
    Expected Result: Passes both checks
    Evidence: .sisyphus/evidence/task-13-openapi-trim.txt
  ```

  **Commit**: YES (Wave 3 group commit)

- [ ] 14. Trim `qa-test-planner` (757L → ≤500L)

  **What to do**:
  - Read full `.agents/skills/qa-test-planner/SKILL.md` (757 lines)
  - Move detailed test templates, extended checklists → `references/qa-templates.md`
  - Keep core QA workflow and quick reference in SKILL.md
  - Ensure SKILL.md ≤ 500 lines

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Blocked By**: Tasks 1-11

  **Acceptance Criteria**:
  - [ ] `wc -l .agents/skills/qa-test-planner/SKILL.md` → ≤ 500

  **QA Scenarios**:
  ```
  Scenario: File trimmed
    Tool: Bash
    Steps:
      1. wc -l .agents/skills/qa-test-planner/SKILL.md → ≤500
    Expected Result: ≤500 lines
    Evidence: .sisyphus/evidence/task-14-qa-trim.txt
  ```

  **Commit**: YES (Wave 3 group commit)

- [ ] 15. Trim `firebase` (744L → ≤500L) + add Phone OTP section

  **What to do**:
  - Read full `.agents/skills/firebase/SKILL.md` (744 lines)
  - Extract Firestore security rules templates, extended config examples → `references/firebase-config.md`
  - **Add** Phone OTP section to SKILL.md (this is missing and critical for project):
    - Firebase Phone Authentication setup
    - `admin.auth().verifyIdToken(token)` pattern
    - Phone number verification flow
  - Ensure SKILL.md ≤ 500 lines

  **Must NOT do**:
  - Không add JWT content
  - Không duplicate content with `nestjs-firebase-auth` skill (which will be copied in Wave 4)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`firebase-auth`]
    - `firebase-auth`: Firebase authentication patterns including phone OTP

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Blocked By**: Tasks 1-11

  **References**:
  - `.agents/skills/firebase/SKILL.md`

  **Acceptance Criteria**:
  - [ ] `wc -l .agents/skills/firebase/SKILL.md` → ≤ 500
  - [ ] `grep -n "Phone\|OTP\|verifyIdToken\|phoneNumber" .agents/skills/firebase/SKILL.md` → at least 3 results

  **QA Scenarios**:
  ```
  Scenario: Firebase skill trimmed and has Phone OTP
    Tool: Bash
    Steps:
      1. wc -l .agents/skills/firebase/SKILL.md → ≤500
      2. grep -n "Phone\|OTP\|verifyIdToken" .agents/skills/firebase/SKILL.md → ≥3
    Expected Result: Both conditions met
    Evidence: .sisyphus/evidence/task-15-firebase-trim.txt
  ```

  **Commit**: YES (Wave 3 group commit)

- [ ] 16. Trim `typescript-advanced-types` (724L → ≤500L)

  **What to do**:
  - Read full SKILL.md (724 lines)
  - Move extended type examples, utility type implementations → `references/advanced-types.md`
  - Keep core type system concepts, quick pattern reference in SKILL.md
  - Ensure ≤ 500 lines

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Blocked By**: Tasks 1-11

  **Acceptance Criteria**:
  - [ ] `wc -l .agents/skills/typescript-advanced-types/SKILL.md` → ≤ 500

  **QA Scenarios**:
  ```
  Scenario: Trimmed to ≤500
    Tool: Bash
    Steps:
      1. wc -l .agents/skills/typescript-advanced-types/SKILL.md
      2. Must be ≤500
    Expected Result: ≤500 lines
    Evidence: .sisyphus/evidence/task-16-ts-types-trim.txt
  ```

  **Commit**: YES (Wave 3 group commit)

- [ ] 17. Trim 4 skills: `tanstack-table` (796L), `database-schema-designer` (688L), `react-native-architecture` (673L), `backend-patterns` (597L, if not already handled in Task 9)

  **What to do**:
  For each skill:
  1. Read full SKILL.md
  2. Identify sections to extract → `references/` folder
  3. Move extended examples/schemas/patterns to `references/{skill-name}-details.md`
  4. Update SKILL.md to link to references/
  5. Verify ≤ 500 lines

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Blocked By**: Tasks 1-11

  **Acceptance Criteria**:
  - [ ] `wc -l .agents/skills/tanstack-table/SKILL.md` → ≤ 500
  - [ ] `wc -l .agents/skills/database-schema-designer/SKILL.md` → ≤ 500
  - [ ] `wc -l .agents/skills/react-native-architecture/SKILL.md` → ≤ 500
  - [ ] `wc -l .agents/skills/backend-patterns/SKILL.md` → ≤ 500

  **QA Scenarios**:
  ```
  Scenario: All 4 skills trimmed
    Tool: Bash
    Steps:
      1. for skill in tanstack-table database-schema-designer react-native-architecture backend-patterns; do echo "$skill: $(wc -l < .agents/skills/$skill/SKILL.md)"; done
      2. Verify all ≤500
    Expected Result: All 4 show ≤500
    Evidence: .sisyphus/evidence/task-17-bulk-trim.txt
  ```

  **Commit**: YES (Wave 3 group commit)

- [ ] 18. Copy `nestjs-firebase-auth` + `nestjs-modular-monolith` from system scope

  **What to do**:
  - These skills exist in system scope (see `<available_skills>` in agent context)
  - Find them in the opencode skills directory (likely `~/.config/opencode/skills/` or similar)
  - Copy entire skill folder to `.agents/skills/nestjs-firebase-auth/` and `.agents/skills/nestjs-modular-monolith/`
  - Verify SKILL.md exists and has correct format after copy
  - Note: These are project-specific NestJS skills that need to be in project scope for priority loading

  **Must NOT do**:
  - Không modify content after copying (unless frontmatter violations found)
  - Không tạo từ đầu — chỉ copy từ system scope

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`nestjs-firebase-auth`, `nestjs-modular-monolith`]
    - Load these skills to access their content and copy accurately

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 4, with Tasks 19-22)
  - **Blocked By**: Tasks 1-17 (Waves 1-3)

  **References**:
  - System scope skills directory (agent will discover location)

  **Acceptance Criteria**:
  - [ ] `ls .agents/skills/nestjs-firebase-auth/SKILL.md` → exists
  - [ ] `ls .agents/skills/nestjs-modular-monolith/SKILL.md` → exists
  - [ ] Both have valid frontmatter (name + description only)

  **QA Scenarios**:
  ```
  Scenario: Skills copied successfully
    Tool: Bash
    Steps:
      1. ls .agents/skills/nestjs-firebase-auth/SKILL.md → exists
      2. ls .agents/skills/nestjs-modular-monolith/SKILL.md → exists
      3. head -5 .agents/skills/nestjs-firebase-auth/SKILL.md → shows valid frontmatter
    Expected Result: Both files exist with valid content
    Evidence: .sisyphus/evidence/task-18-nestjs-copy.txt
  ```

  **Commit**: YES (Wave 4 group commit)

- [ ] 19. Copy `goong-maps-integration` + `vietnam-phone-validation` from system scope

  **What to do**:
  - Copy `goong-maps-integration` skill folder → `.agents/skills/goong-maps-integration/`
  - Copy `vietnam-phone-validation` skill folder → `.agents/skills/vietnam-phone-validation/`
  - Verify content and format after copy

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`goong-maps-integration`, `vietnam-phone-validation`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 4)
  - **Blocked By**: Tasks 1-17

  **Acceptance Criteria**:
  - [ ] `ls .agents/skills/goong-maps-integration/SKILL.md` → exists
  - [ ] `ls .agents/skills/vietnam-phone-validation/SKILL.md` → exists

  **QA Scenarios**:
  ```
  Scenario: Both skills copied
    Tool: Bash
    Steps:
      1. ls .agents/skills/goong-maps-integration/SKILL.md → exists
      2. ls .agents/skills/vietnam-phone-validation/SKILL.md → exists
    Expected Result: Both present
    Evidence: .sisyphus/evidence/task-19-goong-vietnam-copy.txt
  ```

  **Commit**: YES (Wave 4 group commit)

- [ ] 20. Copy `expo-location-patterns` + `expo-notifications` from system scope

  **What to do**:
  - Copy `expo-location-patterns` → `.agents/skills/expo-location-patterns/`
  - Copy `expo-notifications` → `.agents/skills/expo-notifications/`
  - Verify content and format

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`expo-location-patterns`, `expo-notifications`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 4)
  - **Blocked By**: Tasks 1-17

  **Acceptance Criteria**:
  - [ ] Both SKILL.md files exist in `.agents/skills/`

  **QA Scenarios**:
  ```
  Scenario: Both Expo skills copied
    Tool: Bash
    Steps:
      1. ls .agents/skills/expo-location-patterns/SKILL.md → exists
      2. ls .agents/skills/expo-notifications/SKILL.md → exists
    Expected Result: Both present
    Evidence: .sisyphus/evidence/task-20-expo-copy.txt
  ```

  **Commit**: YES (Wave 4 group commit)

- [ ] 21. Copy `delivery-order-matching` + `delivery-pricing-engine` from system scope

  **What to do**:
  - Copy `delivery-order-matching` → `.agents/skills/delivery-order-matching/`
  - Copy `delivery-pricing-engine` → `.agents/skills/delivery-pricing-engine/`
  - These are project-specific business logic skills

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`delivery-order-matching`, `delivery-pricing-engine`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 4)
  - **Blocked By**: Tasks 1-17

  **Acceptance Criteria**:
  - [ ] Both SKILL.md files exist in `.agents/skills/`

  **QA Scenarios**:
  ```
  Scenario: Both delivery skills copied
    Tool: Bash
    Steps:
      1. ls .agents/skills/delivery-order-matching/SKILL.md → exists
      2. ls .agents/skills/delivery-pricing-engine/SKILL.md → exists
    Expected Result: Both present
    Evidence: .sisyphus/evidence/task-21-delivery-copy.txt
  ```

  **Commit**: YES (Wave 4 group commit)

- [ ] 22. Copy `hey-api-patterns` + `postgis-skill` from system scope

  **What to do**:
  - Copy `hey-api-patterns` → `.agents/skills/hey-api-patterns/`
  - Copy `postgis-skill` → `.agents/skills/postgis-skill/`
  - Note: `postgis-skill` has lowercase `postgis` naming — keep same name to avoid confusion

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`hey-api-patterns`, `postgis-skill`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 4)
  - **Blocked By**: Tasks 1-17

  **Acceptance Criteria**:
  - [ ] `ls .agents/skills/hey-api-patterns/SKILL.md` → exists
  - [ ] `ls .agents/skills/postgis-skill/SKILL.md` → exists

  **QA Scenarios**:
  ```
  Scenario: Both skills copied
    Tool: Bash
    Steps:
      1. ls .agents/skills/hey-api-patterns/SKILL.md → exists
      2. ls .agents/skills/postgis-skill/SKILL.md → exists
    Expected Result: Both present
    Evidence: .sisyphus/evidence/task-22-hey-postgis-copy.txt
  ```

  **Commit**: YES (Wave 4 group commit)

- [ ] 23. Final format audit — grep all skills for violations

  **What to do**:
  Run comprehensive grep audit across all skills:
  1. Extra frontmatter: `grep -rn "^license:\|^version:\|^metadata:\|^allowed-tools:\|^argument-hint:\|^sasmp_version:\|^bonded_agent:\|^updated:\|^trigger:" .agents/skills/*/SKILL.md` → 0 results
  2. Wrong package manager: `grep -rn "npm install\|npx " .agents/skills/` → 0 results (except find-skills)
  3. Oversized files: `for f in $(find .agents/skills -name SKILL.md -not -path "*/.archive/*"); do lines=$(wc -l < "$f"); [ "$lines" -gt 500 ] && echo "OVER: $f ($lines)"; done` → 0 OVER
  4. Archive check: `ls .agents/skills/.archive/` → 7 folders
  5. Copied skills: verify all 10 copied skills exist
  Save audit results to `.sisyphus/evidence/final-format-audit.txt`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 5, with Task 24)
  - **Blocked By**: Tasks 1-22 (all previous waves)

  **Acceptance Criteria**:
  - [ ] All 5 grep checks pass with 0 violations
  - [ ] Evidence file saved

  **QA Scenarios**:
  ```
  Scenario: Full format audit passes
    Tool: Bash
    Steps:
      1. Run each of the 5 checks listed above
      2. Report violations (if any)
    Expected Result: 0 violations across all checks
    Evidence: .sisyphus/evidence/task-23-final-audit.txt
  ```

  **Commit**: YES
  - Message: `chore(skills): final audit — all skills format-compliant`

- [ ] 24. Final content audit — spot check 10 random skills

  **What to do**:
  Read and verify content of 10 skills spread across categories:
  1. `nestjs-best-practices` — verify NestJS-specific content, no Express
  2. `prisma-expert` — verify v7 patterns present
  3. `architecture-patterns` — verify Python examples gone, NestJS present
  4. `firebase` — verify Phone OTP section present
  5. One newly copied skill (e.g., `nestjs-firebase-auth`) — verify content quality
  6. `expo-tailwind-setup` — verify bun commands
  7. `backend-patterns` — verify description updated
  8. `database-schema-designer` — verify ≤500 lines, content intact
  9. `tanstack-query` — verify frontmatter clean, content relevant
  10. `skill-creator` — verify license field removed, still serves as format reference

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 5, with Task 23)
  - **Blocked By**: Tasks 1-22

  **Acceptance Criteria**:
  - [ ] All 10 spot-checked skills pass content review
  - [ ] No regressions found
  - [ ] Evidence documented

  **QA Scenarios**:
  ```
  Scenario: Content spot check
    Tool: Read (each file)
    Steps:
      1. Read each of the 10 skills
      2. For each: verify no wrong framework references, correct package manager, correct content
      3. Document pass/fail per skill
    Expected Result: 10/10 pass
    Evidence: .sisyphus/evidence/task-24-content-audit.txt
  ```

  **Commit**: NO (final audit, no changes)

---

## Final Verification Wave

- [ ] F1. **Format Compliance Audit** — `quick`
  Run: `grep -rn "^license:\|^version:\|^metadata:\|^allowed-tools:\|^argument-hint:\|^user-invocable:\|^sasmp_version:\|^bonded_agent:\|^bond_type:\|^updated:\|^trigger:" .agents/skills/*/SKILL.md` → must return 0 results.
  Run: `grep -rn "npm install\|npx " .agents/skills/` → must return 0 results (or only documented exceptions).
  Run: `for f in $(find .agents/skills -name SKILL.md); do lines=$(wc -l < "$f"); if [ "$lines" -gt 500 ]; then echo "OVER: $f ($lines)"; fi; done` → must return 0 OVER results.
  Output: `Frontmatter [PASS/FAIL] | Package Manager [PASS/FAIL] | Line Count [PASS/FAIL] | VERDICT`

- [ ] F2. **Archive Verification** — `quick`
  Run: `ls .agents/skills/.archive/` → must list: next-best-practices, next-cache-components, next-upgrade, frontend-testing, jwt-auth, jwt-security, vercel-react-best-practices.
  Verify each archived skill directory exists and contains SKILL.md.
  Output: `Archived [7/7 expected] | VERDICT`

- [ ] F3. **Copied Skills Verification** — `quick`
  Read each of the 10 copied skills. Verify SKILL.md exists and has correct `name` frontmatter.
  Output: `Copied [10/10 expected] | VERDICT`

---

## Commit Strategy

| After Task Group | Message | Files |
|------------------|---------|-------|
| Wave 1 (T1-T5) | `chore(skills): archive irrelevant skills, fix format violations batch 1` | `.agents/skills/` |
| Wave 2 (T6-T11) | `chore(skills): fix package manager references and content accuracy` | `.agents/skills/` |
| Wave 3 (T12-T17) | `chore(skills): extract large skills to references/ files` | `.agents/skills/` |
| Wave 4 (T18-T22) | `feat(skills): add project-specific skills from system scope` | `.agents/skills/` |

---

## Success Criteria

### Verification Commands
```bash
# No extra frontmatter fields
grep -rn "^license:\|^version:\|^metadata:" .agents/skills/*/SKILL.md
# Expected: 0 results

# No wrong package manager  
grep -rn "npm install\|npx " .agents/skills/
# Expected: 0 results (or only in find-skills which uses npx skills CLI)

# No oversized files
for f in $(find .agents/skills -name SKILL.md -not -path "*/.archive/*"); do
  lines=$(wc -l < "$f")
  if [ "$lines" -gt 500 ]; then echo "OVER 500: $f ($lines lines)"; fi
done
# Expected: 0 OVER results

# Archive exists
ls .agents/skills/.archive/
# Expected: 7 directories

# 10 copied skills exist
ls .agents/skills/nestjs-firebase-auth .agents/skills/nestjs-modular-monolith \
   .agents/skills/goong-maps-integration .agents/skills/vietnam-phone-validation \
   .agents/skills/expo-location-patterns .agents/skills/expo-notifications \
   .agents/skills/delivery-order-matching .agents/skills/delivery-pricing-engine \
   .agents/skills/hey-api-patterns .agents/skills/postgis-skill
# Expected: all 10 exist
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] 7 skills archived in `.agents/skills/.archive/`
- [ ] 10 skills copied from system scope
- [ ] ~46 remaining skills pass format audit
