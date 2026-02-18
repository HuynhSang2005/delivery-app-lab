# Draft: Skills Audit — Logship-MVP

## Requirements (confirmed)
- Audit tất cả 51 skills trong `.agents/skills/`
- Folder location `.agents/skills/` đã confirm là ĐÚNG cho oh-my-opencode project-scope
- Fix format violations, content errors, irrelevant skills
- Create missing skills cho project

## Format Rules (từ skill-creator)
- Frontmatter: CHỈ `name` + `description` — không field nào khác
- Body: ≤500 lines
- Nội dung nặng → `references/` folder
- Không README.md, CHANGELOG.md, INSTALLATION_GUIDE.md
- "When to Use" → description frontmatter, KHÔNG trong body
- Progressive disclosure: metadata → SKILL.md → references/

## Prisma v7 Clarification
- bg_7358179d NGHI NGỜ Prisma v7 là "fictional" — KHÔNG ĐÚNG
- Dự án dùng Prisma ^7.4.0 — đây là Prisma 7.x THẬT, đã phát hành
- Prisma 7.x có breaking changes: driver adapter bắt buộc, ESM, output path `generated/`, `prisma.config.ts`
- Các skills dùng Prisma 5.x/6.x pattern → cần update

---

## AUDIT FINDINGS — 51 Skills

### CATEGORY A: REMOVE (Không liên quan đến project)

| Skill | Lines | Lý do |
|-------|-------|-------|
| `next-best-practices` | 153 | Next.js app router — project dùng NestJS, KHÔNG Next.js |
| `next-cache-components` | 411 | Next.js 16 PPR — hoàn toàn không liên quan |
| `next-upgrade` | 50 | Next.js migration — không liên quan |
| `frontend-testing` | 325 | **HARDCODED cho Dify project** — `web/docs/test.md`, Dify-specific paths; hoàn toàn sai project |

**Tổng: 4 skills cần xóa**

### CATEGORY B: REMOVE hoặc REASSESS (Có thể giữ nếu dùng React Native)

| Skill | Lines | Assessment |
|-------|-------|------------|
| `vercel-react-best-practices` | 136 | React/Next.js optimization từ Vercel — 40% relevant (React patterns), 60% Next.js specific |
| `vercel-composition-patterns` | 89 | React 19 composition patterns — RELEVANT cho React Native, keep |
| `vercel-react-native-skills` | 121 | React Native + Expo — **KEEP, đổi tên** thành `react-native-best-practices` |

**Recommendation**: Giữ `vercel-composition-patterns` và `vercel-react-native-skills` (rename), xóa `vercel-react-best-practices` (Next.js focused)

### CATEGORY C: MERGE — Duplicate Skills

| Group | Skills | Action |
|-------|--------|--------|
| JWT | `jwt-auth` (577L) + `jwt-security` (425L) | **XÓA CẢ HAI** — Project dùng Firebase Phone OTP, không JWT |
| Database Design | `database-design` (53L) + `database-schema-designer` (688L) | Merge → giữ `database-design`, bổ sung content từ `database-schema-designer`, xóa cái kia |
| TypeScript Testing | `typescript-e2e-testing` (447L) + `e2e-testing-patterns` (544L) | Keep cả hai — khác nhau: `typescript-e2e-testing` NestJS/Jest/Docker; `e2e-testing-patterns` Playwright/Cypress |
| Frontend UI | `frontend-design` (42L) + `web-design-guidelines` (39L) + `ui-ux-pro-max` (292L) | Keep tất cả — khác nhau về scope (creation vs review vs database) |
| TypeScript | `typescript` (94L) + `typescript-advanced-types` (724L) | Keep cả hai — khác nhau: `typescript` = perf/config; `typescript-advanced-types` = type system |
| Prisma | `prisma-database-setup` (187L) + `prisma-expert` (356L) | Keep cả hai — complementary |
| Architecture | `architecture-designer` (82L) + `architecture-patterns` (495L) | Keep cả hai — khác nhau: decisions vs implementation |

### CATEGORY D: FIX — Format Violations

#### D1. Extra Frontmatter Fields (phổ biến nhất)
Chỉ được có `name` và `description`. Tất cả fields khác phải xóa:

| Skill | Extra Fields |
|-------|-------------|
| `jwt-auth` | `license`, `compatibility`, `metadata` |
| `prisma-database-setup` | `license`, `metadata` |
| `architecture-designer` | `license`, `metadata` (author, version, domain, triggers, role, scope, output-format, related-skills) |
| `database-schema-designer` | `license` |
| `building-native-ui` | `version`, `license` |
| `expo-api-routes` | `version`, `license` |
| `expo-cicd-workflows` | `allowed-tools`, `version`, `license` |
| `expo-deployment` | `version`, `license` |
| `expo-dev-client` | `version`, `license` |
| `expo-tailwind-setup` | `version`, `license` |
| `native-data-fetching` | `version`, `license` |
| `nestjs-best-practices` | `license`, `metadata` (author, version) |
| `next-best-practices` | `user-invocable` (sẽ xóa skill này anyway) |
| `next-upgrade` | `argument-hint` (sẽ xóa skill này anyway) |
| `react-native-animations` | `sasmp_version`, `bonded_agent`, `bond_type`, `version`, `updated` |
| `tailwindcss` | `metadata` (author, version, source) |
| `tanstack-query` | `license`, `metadata` |
| `tanstack-table` | `license`, `allowed-tools`, `metadata` |
| `upgrading-expo` | `version`, `license` |
| `use-dom` | `version`, `license` |
| `vercel-react-best-practices` | `license`, `metadata` |
| `vercel-react-native-skills` | `license` |
| `web-design-guidelines` | `metadata` (author, version, argument-hint) |
| `websocket-engineer` | `license`, `metadata` |
| `frontend-design` | `license` |
| `qa-test-planner` | `trigger` |
| `typescript-e2e-testing` | Description với pipe `|` multiline — OK nhưng có `---` issues |

**Tổng: ~25 skills có extra frontmatter fields**

#### D2. Line Count Violations (>500 lines)
| Skill | Lines | Action |
|-------|-------|--------|
| `database-schema-designer` | 688 | Extract content → `references/`, trim body ≤500 |
| `firebase` | 744 | Extract heavy sections → `references/security.md`, `references/base.md` |
| `javascript-testing-patterns` | 1021 | Extract → references/, body ≤500 |
| `openapi-spec-generation` | 1024 | Extract → references/, body ≤500 |
| `qa-test-planner` | 757 | Extract → references/, body ≤500 |
| `react-native-architecture` | 673 | Extract → references/, body ≤500 |
| `tanstack-table` | 796 | Extract → references/, body ≤500 |
| `typescript-advanced-types` | 724 | Extract → references/, body ≤500 |
| `backend-patterns` | 597 | Extract → references/, body ≤500 |
| `jwt-auth` | 577 | (sẽ xóa) |
| `e2e-testing-patterns` | 544 | Borderline — extract nếu cần |
| `jwt-security` | 425 | (sẽ xóa) |

**Tổng: 10 skills vượt 500 lines (trừ 2 skills sẽ xóa)**

#### D3. Wrong Package Manager (npm/npx thay bun)
Tất cả commands phải dùng `bun add` / `bunx` / `bunx --bun`:

| Skill | Occurrences | Fix |
|-------|-------------|-----|
| `building-native-ui` | `npx expo start/run` | `bunx expo start/run` |
| `expo-api-routes` | `npx expo serve`, `npm install -g eas-cli` | `bunx expo serve`, `bun add -g eas-cli` |
| `expo-cicd-workflows` | `npm install --prefix` | `bun install --cwd` |
| `expo-deployment` | `npm install -g eas-cli`, nhiều `npx eas-cli` | `bun add -g eas-cli`, `bunx eas-cli@latest` |
| `expo-dev-client` | `npx expo start` | `bunx expo start` |
| `expo-tailwind-setup` | `npx expo install` | `bunx expo install` |
| `firebase` | `npm install -g firebase-tools` | `bun add -g firebase-tools` |
| `prisma-database-setup` | `npm install prisma`, `npm install @prisma/client` | `bun add prisma`, `bun add @prisma/client` |
| `prisma-expert` | `npx prisma generate` | `bunx --bun prisma generate` |
| `react-native-animations` | `npm install react-native-reanimated` | `bun add react-native-reanimated` |
| `e2e-testing-patterns` | `npx playwright test`, comment `npm install` | `bunx playwright test` |
| `openapi-spec-generation` | `npm install -g` nhiều tools | `bun add -g` |
| `find-skills` | `npx skills` (skill CLI tool) | Đặc biệt — `npx skills` là official CLI, có thể giữ |

**Tổng: ~12 skills cần fix package manager**

#### D4. Wrong Framework / Tech Stack
| Skill | Vấn đề | Action |
|-------|---------|--------|
| `backend-patterns` | Description: "Node.js, Express, and Next.js API routes" — không phải NestJS | Update description + content |
| `architecture-patterns` | Tất cả examples dùng Python (FastAPI) | Rewrite examples dùng TypeScript/NestJS |
| `jwt-auth` | Dùng Express, Redis, Python code | Xóa skill (không cần JWT) |
| `jwt-security` | Dùng Express + `express-jwt` | Xóa skill (không cần JWT) |
| `prisma-expert` | Prisma v5/v6 pattern — không driver adapter | Update cho Prisma v7 |
| `typescript-e2e-testing` | Dùng Docker cho infrastructure | OK cho dự án nhưng cần verify |

#### D5. Content Accuracy Issues
| Skill | Vấn đề | Action |
|-------|---------|--------|
| `firebase` | Không có Phone OTP coverage (chỉ có Firestore/Auth email) | Add Phone OTP section hoặc tạo skill mới |
| `nestjs-best-practices` | Extra frontmatter fields; không đề cập Prisma/Zod | Fix frontmatter; content OK |
| `neon-postgres` | 129 lines, content OK — nhưng không đề cập PostGIS | Add PostGIS section |
| `zod` | 127 lines, Zod v4 — cần verify Zod 4.3.6 compatibility | Verify |
| `typescript-e2e-testing` | Dùng Jest + Docker — project dùng Bun test, không Docker | Content mismatch |
| `architecture-designer` | References broken (no references/ folder) | Fix hoặc remove broken links |

#### D6. "When to Use" trong Body (phải ở description)
| Skill | Vấn đề |
|-------|--------|
| `openapi-spec-generation` | "## When to Use This Skill" section trong body |
| `expo-api-routes` | "## When to Use API Routes" là đầu body |
| Nhiều skills khác | Pattern phổ biến |

---

### CATEGORY E: KEEP AS-IS (Tốt, chỉ cần fix frontmatter nếu có)

| Skill | Lines | Status | Notes |
|-------|-------|--------|-------|
| `skill-creator` | ? | ✅ REFERENCE | Format chuẩn |
| `zod` | 127 | ✅ GOOD | Frontmatter OK, Zod v4, relevant |
| `writing-plans` | 116 | ✅ GOOD | Frontmatter OK |
| `find-skills` | 133 | ✅ GOOD | Frontmatter OK; `npx skills` là CLI đặc biệt |
| `tanstack-query` | 123 | ⚠️ FIX FM | Extra license/metadata fields |
| `react-hook-form` | 116 | ✅ GOOD | Frontmatter OK |
| `zustand` | 114 | ✅ GOOD | Frontmatter OK |
| `typescript` | 94 | ✅ GOOD | Frontmatter OK |
| `vercel-composition-patterns` | 89 | ⚠️ FIX FM | Description OK, rename to remove Vercel branding? |
| `websocket-engineer` | 85 | ⚠️ FIX FM | Extra license/metadata |
| `ui-ux-pro-max` | 292 | ✅ GOOD | Frontmatter OK |
| `rest-api-design` | 478 | ✅ GOOD | Frontmatter OK, relevant |
| `neon-postgres` | 129 | ✅ GOOD | Frontmatter OK, relevant — add PostGIS |
| `upgrading-expo` | 125 | ⚠️ FIX FM | Extra version/license |
| `use-dom` | 417 | ⚠️ FIX FM | Extra version/license |
| `native-data-fetching` | 491 | ⚠️ FIX FM | Extra version/license |
| `expo-deployment` | 190 | ⚠️ FIX FM + npm | Extra version/license + npm commands |
| `expo-dev-client` | 164 | ⚠️ FIX FM + npm | Extra version/license + npx |
| `expo-cicd-workflows` | 92 | ⚠️ FIX FM + npm | Extra allowed-tools/version/license + npm |
| `building-native-ui` | 321 | ⚠️ FIX FM + npm | Extra version/license + npx |
| `expo-tailwind-setup` | 480 | ⚠️ FIX FM + npm | Extra version/license + npx |
| `expo-api-routes` | 368 | ⚠️ FIX FM + npm | Extra version/license + npm |
| `react-native-animations` | 198 | ⚠️ FIX FM | Nhiều extra fields (sasmp_version, bonded_agent...) |
| `react-native-architecture` | 673 | ⚠️ OVER LIMIT | > 500 lines |

---

### CATEGORY F: SKILLS CÒN THIẾU (Create New)

| Skill | Priority | Lý do |
|-------|----------|-------|
| `nestjs-firebase-auth` | 🔴 CRITICAL | Firebase Phone OTP Guard cho NestJS — core auth của dự án |
| `nestjs-modular-monolith` | 🔴 CRITICAL | Patterns đặc thù: Controller→Service→Repository, Zod DTOs, module structure |
| `goong-maps` | 🔴 CRITICAL | Goong Maps Vietnam — maps, geocoding, directions cho delivery app |
| `expo-location-patterns` | 🟠 HIGH | Foreground/background location tracking với expo-location cho delivery |
| `expo-notifications` | 🟠 HIGH | FCM push notifications với Expo SDK 54 |
| `postGIS-queries` | 🟠 HIGH | PostGIS spatial queries, KNN search, ST_DWithin cho order matching |
| `vietnam-phone-validation` | 🟡 MEDIUM | Vietnamese phone format, E.164, Firebase Phone OTP flow |
| `delivery-order-matching` | 🟡 MEDIUM | Driver matching algorithm, PostGIS KNN, ETA calculation |
| `delivery-pricing-engine` | 🟡 MEDIUM | Dynamic pricing: distance, surge, vehicle type |
| `hey-api-patterns` | 🟡 MEDIUM | Hey-API OpenAPI client generation với TanStack Query hooks |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| REMOVE | 5 (next-best-practices, next-cache-components, next-upgrade, frontend-testing, jwt-auth, jwt-security) — thực ra 6 |
| REASSESS/RENAME | 1-2 (vercel-react-best-practices questionable) |
| Extra frontmatter fields | ~25 skills |
| Over 500 lines | ~10 skills |
| Wrong npm/npx commands | ~12 skills |
| Wrong framework examples | ~3 skills |
| CREATE NEW | 10 skills |

**Tổng skills sau cleanup**: 51 - 6 removed + 10 new = ~55 skills curated
