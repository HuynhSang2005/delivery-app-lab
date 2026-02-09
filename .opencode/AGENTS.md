# Delivery App Lab

Delivery application with NestJS backend, React Native (Expo) mobile app, and PostgreSQL database.

## Stack

- **Backend**: NestJS + TypeScript + PostgreSQL (Neon) + Redis + PostGIS
- **Mobile**: React Native + Expo SDK 54 + Goong Maps
- **Package Manager**: Bun
- **Auth**: Firebase Phone Authentication

## Commands

```bash
bun install          # Install dependencies
bun dev              # Start development
bun test             # Run tests
bun typecheck        # TypeScript check
bun lint             # Lint code
bun build            # Production build
```

## Tool Priority

**ALWAYS use serena-mcp FIRST for codebase exploration.**

1. `serena_find_symbol` → Find definitions
2. `serena_find_referencing_symbols` → Check usage
3. `serena_search_for_pattern` → Find patterns
4. `read` → Read specific sections only

## Agents

| Agent | Use When | Tools |
|-------|----------|-------|
| `@plan` | Architecture planning, analysis, research | Read-only |
| `@review` | Code review + QA verification | Bash allowed |
| `@db` | Database optimization, SQL, migrations | Bash allowed |

## MCP Servers

- **serena**: Codebase exploration (symbols, references)
- **context7**: Library documentation
- **tavily**: Web search and research
- **neon**: Database operations
- **perplexity**: Deep research and reasoning

## Research Workflow

When researching technical topics:
1. **Library docs**: `context7_query-docs`
2. **Deep research**: `perplexity_perplexity_research`
3. **Current info**: `tavily_tavily_search`

## Skill Discovery

**DON'T hardcode skills. Use discovery:**
```typescript
// Find relevant skills
skill({ name: "find-skills" })

// Then load appropriate ones
skill({ name: "skill-name" })
```

## Skills Reference

### Core Skills (.opencode/skills/)

| Skill | Description | When to Use |
|-------|-------------|-------------|
| **brainstorming** | Explore user intent before implementation | Any new feature or component |
| **building-native-ui** | Expo Router, styling, components, navigation | Mobile UI development |
| **delivery-order-matching** | PostGIS KNN, driver assignment, ETA | Order matching algorithm |
| **delivery-pricing-engine** | Dynamic pricing, surge, discounts | Fare calculation |
| **expo-location-patterns** | Location tracking, permissions, background | GPS tracking |
| **expo-notifications** | Push notifications, FCM, deep linking | Notification system |
| **firebase-auth** | Firebase Auth (web + React Native) | Authentication flows |
| **goong-maps-integration** | Vietnam maps, geocoding, directions | Map integration |
| **hey-api-patterns** | TypeScript API clients from OpenAPI | API client generation |
| **nestjs-firebase-auth** | NestJS token verification, guards | Backend auth |
| **nestjs-modular-monolith** | Feature-based NestJS modules | Backend architecture |
| **nestjs-queue-architect** | BullMQ job processing | Background jobs |
| **project-planning** | Structured project phases | New projects/features |
| **react-hook-form-zod** | Type-safe forms validation | Form handling |
| **tanstack-query** | Server state management | Data fetching |
| **tanstack-table** | Data tables with pagination | Admin tables |
| **upgrading-expo** | SDK migration guides | Expo upgrades |
| **vercel-react-native-skills** | React Native performance | Mobile optimization |
| **vietnam-phone-validation** | VN phone numbers, carriers | Phone auth |
| **zod** | Schema validation | Type validation |
| **zustand-state-management** | Global state management | App state |

### Agent Skills (.agents/skills/)

| Skill | Description |
|-------|-------------|
| **api-design-principles** | REST/GraphQL best practices |
| **architecture-patterns** | Clean Architecture, DDD |
| **auth-implementation-patterns** | JWT, OAuth, RBAC |
| **backend-patterns** | Node.js, Express, Next.js API |
| **error-handling-patterns** | Error handling across languages |
| **firebase-auth** | Web Firebase Auth |
| **nestjs-best-practices** | Comprehensive NestJS guide |
| **nestjs-dependency-injection** | DI patterns |
| **nestjs-expert** | NestJS troubleshooting |
| **postgis-skill** | PostGIS geospatial queries |
| **redis-development** | Redis caching, pub/sub |
| **sql-optimization-patterns** | Query optimization |
| **upgrading-expo** | SDK 54+ migration |
| **websocket-engineer** | Socket.io real-time |

## Critical Rules

- **Serena FIRST**: Always explore codebase with serena-mcp before reading files
- **Skill Discovery**: Use `find-skills` to discover relevant skills dynamically
- **Research**: Use perplexity for deep technical research
- **Verification**: Run tests before claiming completion
- **Read Specific**: Use offset/limit, never read entire large files
