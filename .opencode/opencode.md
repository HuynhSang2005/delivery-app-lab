# OpenCode Integration Guide

Detailed technical guide for AI agents integrating with the Logship-MVP environment tools, agents, and MCP servers.

> For project context and core rules, see [AGENTS.md](../AGENTS.md)

Last Updated: February 25, 2026

## 1. Tool Priority

**ALWAYS use serena-mcp FIRST for codebase exploration.**

### Exploration (in order of preference)
1. `serena_find_symbol` — Find class/function/variable definitions
2. `serena_find_referencing_symbols` — Find all usages of a symbol
3. `serena_search_for_pattern` — Regex pattern search across codebase
4. `serena_get_symbols_overview` — Get file structure overview
5. `read` with offset/limit — Read specific file sections (NEVER entire large files)
6. `grep` / `glob` — File content search / file pattern matching

### Research (for external knowledge)
1. `context7` — Library documentation lookup (FIRST for any library question)
2. `tavily_tavily_research` — Deep technical research
3. `tavily_tavily_search` — Current information, news, tutorials
4. `google_search` — Broad web search

### Code Modification
1. `serena_replace_symbol_body` — Replace function/class bodies
2. `serena_insert_after_symbol` / `serena_insert_before_symbol` — Insert code
3. `serena_rename_symbol` — Rename across codebase
4. `edit` — Direct file editing (when serena is not suitable)
5. `write` — Write new files

### Rules
- NEVER read entire large files — always use offset/limit
- ALWAYS check serena symbols before reading file content
- Use `serena_get_symbols_overview` first when exploring a new file

## 2. Oh-my-opencode-slim Integration

This project uses the **oh-my-opencode-slim** plugin which provides a 6-agent architecture optimized for development workflows.

### Agents
| Agent | Role | When to Use |
|-------|------|-------------|
| Orchestrator | Master delegator, strategic coordinator | Complex multi-step tasks, session orchestration |
| Explorer | Codebase reconnaissance, parallel search | Finding files, locating patterns, discovery |
| Oracle | Strategic advisor, complex debugging | Architecture decisions, hard debugging, high-stakes choices |
| Librarian | External documentation research | Library docs, API references, version-specific behavior |
| Designer | UI/UX implementation specialist | Mobile UI, responsive layouts, animations |
| Fixer | Fast implementation specialist | Well-defined tasks, parallel execution, repetitive changes |

### Preset: logship-mvp
The project uses the `logship-mvp` preset in `~/.config/opencode/oh-my-opencode-slim.json` which maps each agent to appropriate models with fallback chains.

### Delegation Pattern
When the current agent needs specialist help, use the `task()` tool:
```typescript
task(
  description="Short task description",
  subagent_type="fixer",  // or: oracle, explorer, librarian, designer
  prompt="Detailed spec with file paths and expected output"
)
```

## 3. Project Agents

### @plan — Architecture Planning
- **Purpose:** Analysis, research, architecture decisions
- **Tools:** Read-only (no code modification)
- **Use when:** Planning new features, analyzing requirements, researching solutions
- **Prompt:** `.opencode/agents/plan-prompt.md`

### @review — Code Review + QA
- **Purpose:** Code review, quality verification, testing
- **Tools:** Bash allowed (can run tests, builds)
- **Use when:** Reviewing PRs, verifying implementations, running QA
- **Prompt:** `.opencode/agents/review-prompt.md`

### @db — Database Operations
- **Purpose:** Database optimization, SQL, migrations, PostGIS
- **Tools:** Bash allowed (can run prisma commands)
- **Use when:** Schema changes, query optimization, migration creation
- **Prompt:** `.opencode/agents/db-prompt.md`

## 4. MCP Servers

### serena (ALWAYS FIRST)
Codebase exploration via Language Server Protocol.
- `serena_find_symbol` — Find definitions
- `serena_find_referencing_symbols` — Find usages
- `serena_search_for_pattern` — Pattern search
- `serena_get_symbols_overview` — File outline
- `serena_replace_symbol_body` — Replace code
- `serena_rename_symbol` — Rename across project

### context7
Library documentation lookup. Use FIRST when you need docs for any library.
- `context7_resolve-library-id` — Resolve library ID
- `context7_query-docs` — Query documentation

### tavily
Web search, extraction, and research.
- `tavily_tavily_search` — Web search
- `tavily_tavily_extract` — URL content extraction
- `tavily_tavily_research` — Deep research on topic
- `tavily_tavily_crawl` — Crawl websites

### neon
Database operations for Neon PostgreSQL.
- `neon_run_sql` — Execute SQL
- `neon_prepare_database_migration` — Safe migrations
- `neon_describe_table_schema` — Table structure
- `neon_get_database_tables` — List tables

### Research Workflow
1. **Library docs:** context7 (FIRST)
2. **Deep research:** tavily_tavily_research
3. **Current info:** tavily_tavily_search
4. **Broad search:** google_search

## 5. Skill System

### Discovery First
```typescript
// DON'T hardcode skills. Use discovery:
skill({ name: "find-skills" })

// Then load appropriate ones:
skill({ name: "skill-name" })
```

### Core Skills (.opencode/skills/)
| Skill | Description |
|-------|-------------|
| beads-workflow | Git-backed task tracking with beads (bd) |
| building-native-ui | Expo Router, styling, components, navigation |
| database-design | Schema design, indexing, ORM selection |
| delivery-order-matching | PostGIS KNN, driver assignment, ETA |
| delivery-pricing-engine | Dynamic pricing, surge, discounts |
| expo-location-patterns | Location tracking, permissions, background |
| expo-notifications | Push notifications, FCM, deep linking |
| firebase | Firebase Firestore, Auth, Storage |
| goong-maps-integration | Vietnam maps, geocoding, directions |
| hey-api-patterns | TypeScript API clients from OpenAPI |
| nestjs-best-practices | NestJS patterns, DI, security |
| nestjs-firebase-auth | NestJS token verification, guards |
| nestjs-modular-monolith | Feature-based NestJS modules |
| prisma-expert | Prisma ORM, schema, migrations |
| react-hook-form | Client-side forms with RHF |
| tanstack-query | Server state management v5 |
| typescript | TypeScript performance & type system |
| vietnam-phone-validation | VN phone numbers, E.164, carriers |
| websocket-engineer | WebSocket, Socket.IO, real-time |
| zod | Schema validation (v4) |
| zustand | Global state management |

## 6. Testing Guidelines

### AI-Agent Testing Workflow
- **Phase 1: Explore:** Read implementation, understand dependencies, identify scenarios.
- **Phase 2: Generate:** 1. Service unit tests (80%+ coverage, mock Repository); 2. Controller unit tests (70%+ coverage); 3. E2E tests (stable features).
- **Phase 3: Validate:** `bun typecheck`, `bun test {module}`, `bun test --coverage`.
- **Phase 4: Iterate:** Fix implementation or tests based on failures, add missing scenarios.

### Testing Checklist
- [ ] Unit tests for all service methods
- [ ] Controller tests for all endpoints
- [ ] `bun test` passes
- [ ] Coverage > 80% for services
- [ ] Error cases and edge cases tested
- [ ] TypeScript compiles with no errors

## 7. File Organization
```
apps/api/src/
├── main.ts                          # Entry point
├── app.module.ts                    # Root module
├── config/                          # Configuration
├── common/                          # Shared infrastructure (@Global)
├── database/                        # Database layer
├── infrastructure/                  # External services
├── gateway/                         # WebSocket Gateway
└── modules/                         # Feature modules
```

### Configuration Files
- `AGENTS.md`: Core rules and project context (root level).
- `.opencode/opencode.md`: THIS FILE — Tool and agent integration details.
- `docs/`: Project documentation (Tech Stack, SDD, API, Architecture).
- `prisma/`: Prisma schema and config.

### Validation Note
Note: `class-validator` appears in `package.json` as peer dependency of `@nestjs/*` packages, but all application validation MUST use Zod v4.

## 8. Beads Task Tracking

This project uses **beads** (`bd`) for git-backed issue tracking. Load the `beads-workflow` skill for comprehensive workflow guidance.

### Quick Reference
```bash
bd prime                                     # Session start: load context
bd list --status open --json                 # List open tasks
bd ready --json                              # Tasks ready (no blockers)
bd create "Task" --label backend --json      # Create issue
bd update delivery-app-lab-eia --status in_progress --json
bd close delivery-app-lab-eia --json
bd sync                                      # Commit JSONL to git (session end)
```

Issue prefix: **`delivery-app-lab`** (e.g. `delivery-app-lab-eia`)

**Full workflow guide:** Load skill `{ name: "beads-workflow" }` or see `.opencode/skills/beads-workflow/SKILL.md`

**AGENTS.md reference:** See root `AGENTS.md` → "Task Tracking (beads)" section for complete protocol
