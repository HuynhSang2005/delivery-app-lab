# OpenCode Integration Guide

Detailed technical guide for AI agents integrating with the Logship-MVP environment tools, agents, and MCP servers.

> For project context and core rules, see [AGENTS.md](./AGENTS.md)

Last Updated: February 18, 2026

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
2. `perplexity_perplexity_research` — Deep technical research
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

## 2. Oh-my-opencode Integration

This project uses the **oh-my-opencode** plugin which provides an 11-agent architecture.

### Primary Agents
| Agent | Role | Model |
|-------|------|-------|
| Sisyphus | Main orchestrator, task execution | Kimi K2.5 |
| Atlas | Master coordinator, QA gate | Claude Opus 4.6 |
| Prometheus | Strategic planner | Kimi K2.5 |
| Hephaestus | Code craftsman | Kimi K2.5 |

### Subagents
| Agent | Role | Model | Restrictions |
|-------|------|-------|--------------|
| Oracle | High-IQ consultation, debugging | GPT 5.2 Codex | Read-only. Cannot write/edit/delegate. |
| Metis | Pre-planning analysis | Claude Sonnet 4.5 | |
| Momus | Code review, QA verification | GPT 5.2 | |
| Librarian | Documentation research | GPT 5 Mini | Read-only. Cannot write/edit/delegate. |
| Explore | Codebase search | GPT 5 Mini | Read-only. Cannot write/edit/delegate. |
| Multimodal-looker | Image/PDF analysis | Gemini 3 Flash | |

### Task Categories
| Category | Best For |
|----------|----------|
| `visual-engineering` | Frontend, UI/UX, design |
| `ultrabrain` | Hard logic problems |
| `deep` | Complex problem-solving |
| `quick` | Trivial single-file changes |
| `artistry` | Creative solutions |
| `writing` | Documentation |
| `unspecified-low` | Low effort misc tasks |
| `unspecified-high` | High effort misc tasks |

### Commands & Patterns
- `/cancel-ralph`: Stop active self-referential development loops.
- **Delegation Pattern:**
```typescript
task(
  category="deep",
  load_skills=["nestjs-expert", "architecture-patterns"],
  run_in_background=false,
  prompt="..."
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
- Query: `context7_query-docs` with library name and topic

### tavily
Web search, extraction, and research.
- `tavily_tavily_search` — Web search
- `tavily_tavily_extract` — URL content extraction
- `tavily_tavily_research` — Deep research on topic

### neon
Database operations for Neon PostgreSQL.
- `neon_run_sql` — Execute SQL
- `neon_prepare_database_migration` — Safe migrations
- `neon_describe_table_schema` — Table structure
- `neon_get_database_tables` — List tables

### perplexity
Deep research and reasoning.
- `perplexity_perplexity_ask` — Quick answers with citations
- `perplexity_perplexity_reason` — Chain-of-thought analysis
- `perplexity_perplexity_research` — Comprehensive research

### Research Workflow
1. **Library docs:** context7 (FIRST)
2. **Deep research:** perplexity_perplexity_research
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
| brainstorming | Explore user intent before implementation |
| building-native-ui | Expo Router, styling, components, navigation |
| delivery-order-matching | PostGIS KNN, driver assignment, ETA |
| delivery-pricing-engine | Dynamic pricing, surge, discounts |
| expo-location-patterns | Location tracking, permissions, background |
| expo-notifications | Push notifications, FCM, deep linking |
| firebase-auth | Firebase Auth (web + React Native) |
| goong-maps-integration | Vietnam maps, geocoding, directions |
| hey-api-patterns | TypeScript API clients from OpenAPI |
| nestjs-firebase-auth | NestJS token verification, guards |
| nestjs-modular-monolith | Feature-based NestJS modules |
| nestjs-queue-architect | BullMQ job processing |
| project-planning | Structured project phases |
| react-hook-form-zod | Type-safe forms validation |
| tanstack-query | Server state management v5 |
| tanstack-table | Data tables with pagination |
| upgrading-expo | SDK migration guides |
| vercel-react-native-skills | React Native performance |
| vietnam-phone-validation | VN phone numbers, carriers |
| zod | Schema validation (v4) |
| zustand-state-management | Global state management |

### Agent Skills (.agents/skills/)
- `api-design-principles`, `architecture-patterns`, `auth-implementation-patterns`, `backend-patterns`, `error-handling-patterns`
- `nestjs-best-practices`, `nestjs-dependency-injection`, `nestjs-expert`
- `postgis-skill`, `redis-development`, `sql-optimization-patterns`, `websocket-engineer`

## 6. Testing Guidelines

### AI-Agent Testing Workflow
- **Phase 1: Explore:** Read implementation, understand dependencies, identify scenarios.
- **Phase 2: Generate:** 1. Service unit tests (80%+ coverage, mock Repository); 2. Controller unit tests (70%+ coverage); 3. E2E tests (stable features).
- **Phase 3: Validate:** `bun run typecheck`, `bun run test {module}`, `bun run test:cov`.
- **Phase 4: Iterate:** Fix implementation or tests based on failures, add missing scenarios.

### Testing Checklist
- [ ] Unit tests for all service methods
- [ ] Controller tests for all endpoints
- [ ] `bun run test` passes
- [ ] Coverage > 80% for services
- [ ] Error cases and edge cases tested
- [ ] TypeScript compiles with no errors

## 7. File Organization
```
apps/api/src/
├── main.ts                          # Entry point
├── app.module.ts                    # Root module
├── config/                          # Configuration (Partial exists)
├── common/                          # Shared infrastructure (@Global)
├── database/                        # Database layer
├── infrastructure/                  # External services
├── gateway/                         # WebSocket Gateway
└── modules/                         # Feature modules
```

### Configuration Files
- `.opencode/AGENTS.md`: Core rules and project context.
- `.opencode/opencode.md`: THIS FILE — Tool and agent integration details.
- `docs/`: Project documentation (Tech Stack, SDD, API, Architecture).
- `prisma/`: Prisma schema and config.

### Validation Note
Note: `class-validator` appears in `package.json` as peer dependency of `@nestjs/*` packages, but all application validation MUST use Zod v4.

## 8. Beads Task Tracking

This project uses **beads** (`bd`) for git-backed issue tracking.

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

Full reference: `.opencode/skills/beads/SKILL.md`
