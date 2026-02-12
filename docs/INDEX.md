# Documentation Index

Complete guide to all documentation in the Logship-MVP project.

## Quick Navigation

| Document | Purpose | Audience |
|----------|---------|----------|
| [README.md](../README.md) | Project overview, quick start | Everyone |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | How to contribute | Developers |
| [CHANGELOG.md](../CHANGELOG.md) | Version history | Everyone |

## Core Technical Documentation

### 00. Tech Stack Specification
**File:** [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md)

Single source of truth for all technology decisions.

**Contents:**
- Package manager (Bun)
- Backend stack (NestJS, Prisma, etc.)
- Mobile stack (Expo SDK 54, React Native)
- Admin stack (Next.js 16, Tailwind)
- Infrastructure (Neon, Redis, Firebase)
- Version consistency rules
- Common mistakes to avoid

**When to read:** Before starting development, when adding new dependencies

---

### 01. System Design Document (SDD)
**File:** [01-SDD-System-Design-Document.md](./01-SDD-System-Design-Document.md)

High-level architecture overview.

**Contents:**
- Project description and goals
- Architecture diagrams
- User roles and permissions (RBAC)
- Core features and workflows
- Order lifecycle
- Driver matching algorithm
- Real-time tracking
- Chat system
- Security considerations
- Scalability notes

**When to read:** To understand overall system design

---

### 02. Database Design Document
**File:** [02-Database-Design-Document.md](./02-Database-Design-Document.md)

Complete database schema and design.

**Contents:**
- Neon PostgreSQL setup
- PostGIS geospatial data
- SQL table definitions
- Database functions
- Prisma schema
- Redis data structures
- Caching strategy
- Migration commands

**When to read:** When working with database, creating migrations

---

### 03. API Design Document
**File:** [03-API-Design-Document.md](./03-API-Design-Document.md)

All API endpoints and WebSocket events.

**Contents:**
- REST API endpoints
- Request/response formats
- Authentication flows
- Error codes
- WebSocket events
- Rate limiting
- Validation rules
- Hey-API client generation

**When to read:** When implementing or consuming APIs

---

### 04. Mobile App Technical Spec
**File:** [04-Mobile-App-Technical-Spec.md](./04-Mobile-App-Technical-Spec.md)

React Native + Expo implementation guide.

**Contents:**
- Project structure
- Dependencies and versions
- Hey-API integration
- State management (Zustand + TanStack Query)
- Location tracking
- Maps integration (Goong)
- Socket.io setup

**When to read:** When developing mobile features

---

### 05. Admin Dashboard Spec
**File:** [05-Admin-Dashboard-Spec.md](./05-Admin-Dashboard-Spec.md)

Next.js admin dashboard implementation.

**Contents:**
- Project structure
- Dependencies
- Hey-API integration
- Page specifications
- Layout components
- Environment setup

**When to read:** When developing admin features

---

### 06. Development Phases
**File:** [06-Development-Phases.md](./06-Development-Phases.md)

Project timeline and milestones.

**Contents:**
- 6 phases over 10-12 weeks
- Week-by-week tasks
- Deliverables per phase
- Exit criteria
- Risk mitigation
- Success metrics

**When to read:** For project planning and tracking progress

---

### 07. Backend Architecture
**File:** [07-Backend-Architecture.md](./07-Backend-Architecture.md)

NestJS backend patterns and structure.

**Contents:**
- Clean architecture folder structure
- Module organization
- Database layer (Prisma)
- BullMQ message queues
- Redis caching
- Swagger/OpenAPI setup
- Environment variables

**When to read:** When developing backend features

---

### 08. Monorepo Structure
**File:** [08-Monorepo-Structure.md](./08-Monorepo-Structure.md)

Bun workspaces monorepo setup.

**Contents:**
- Workspace configuration
- Application structures
- Shared packages
- Build workflows
- CI/CD setup
- Cross-app communication

**When to read:** When setting up development environment

---

## Operational Documentation

### Deployment Guide
**File:** [DEPLOYMENT.md](./DEPLOYMENT.md)

Production deployment instructions.

**Contents:**
- Infrastructure setup
- Backend deployment (Railway/Render)
- Admin deployment (Vercel)
- Mobile deployment (Expo EAS)
- Environment variables
- Post-deployment checklist
- Rollback procedures

**When to read:** When deploying to production

---

### Troubleshooting Guide
**File:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

Common issues and solutions.

**Contents:**
- Development issues
- Database issues
- Mobile app issues
- Backend issues
- Deployment issues
- Environment setup issues

**When to read:** When encountering errors

---

### Setup Checklist
**File:** [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)

Step-by-step environment setup.

**Contents:**
- Prerequisites checklist
- Account setup (Neon, Firebase, etc.)
- Repository setup
- Environment variables
- Database initialization
- Development verification
- IDE configuration

**When to read:** When setting up new development environment

---

## Architecture Decisions

### ADR Index
**Folder:** [adr/](./adr/)

Architecture Decision Records explaining "why" choices were made.

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](./adr/ADR-001-bun-package-manager.md) | Use Bun as Package Manager | Accepted |
| [ADR-002](./adr/ADR-002-nestjs-backend.md) | Use NestJS for Backend Framework | Accepted |
| [ADR-003](./adr/ADR-003-neon-postgresql.md) | Use Neon Serverless PostgreSQL | Accepted |
| [ADR-004](./adr/ADR-004-expo-react-native.md) | Use Expo + React Native for Mobile | Accepted |
| [ADR-005](./adr/ADR-005-goong-maps.md) | Use Goong Maps for Vietnam Market | Accepted |
| [ADR-006](./adr/ADR-006-bun-workspaces.md) | Use Bun Workspaces for Monorepo | Accepted |
| [ADR-007](./adr/ADR-007-repository-pattern.md) | Use Repository Pattern for Data Access | Accepted |

**When to read:** When questioning architectural decisions

---

## Documentation by Role

### For Project Managers
1. [README.md](../README.md) - Project overview
2. [01-SDD-System-Design-Document.md](./01-SDD-System-Design-Document.md) - Architecture
3. [06-Development-Phases.md](./06-Development-Phases.md) - Timeline
4. [CHANGELOG.md](../CHANGELOG.md) - Progress tracking

### For Backend Developers
1. [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md) - Tech stack
2. [02-Database-Design-Document.md](./02-Database-Design-Document.md) - Database
3. [03-API-Design-Document.md](./03-API-Design-Document.md) - APIs
4. [07-Backend-Architecture.md](./07-Backend-Architecture.md) - Patterns
5. [adr/](./adr/) - Architecture decisions

### For Mobile Developers
1. [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md) - Tech stack
2. [03-API-Design-Document.md](./03-API-Design-Document.md) - APIs
3. [04-Mobile-App-Technical-Spec.md](./04-Mobile-App-Technical-Spec.md) - Implementation
4. [adr/ADR-004-expo-react-native.md](./adr/ADR-004-expo-react-native.md) - Mobile ADR

### For Frontend (Admin) Developers
1. [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md) - Tech stack
2. [03-API-Design-Document.md](./03-API-Design-Document.md) - APIs
3. [05-Admin-Dashboard-Spec.md](./05-Admin-Dashboard-Spec.md) - Implementation

### For DevOps
1. [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
2. [08-Monorepo-Structure.md](./08-Monorepo-Structure.md) - CI/CD
3. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Operations

### For New Team Members
1. [README.md](../README.md) - Start here
2. [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) - Environment setup
3. [CONTRIBUTING.md](../CONTRIBUTING.md) - How to contribute
4. [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md) - Tech stack

---

## Documentation Standards

### File Naming
- Use kebab-case: `file-name.md`
- Use numbers for ordered docs: `01-file-name.md`
- Use UPPERCASE for operational docs: `DEPLOYMENT.md`

### Document Structure
All technical docs should include:
1. Title and version
2. Table of contents (for long docs)
3. Overview/Introduction
4. Main content with clear sections
5. Code examples where applicable
6. Related documents section
7. Last updated date

### Version Control
- Update "Last Updated" date when modifying
- Use semantic versioning for major changes
- Document breaking changes in CHANGELOG.md

---

## Quick Reference

### Common Commands
```bash
# Start all services
bun run dev

# Start specific service
bun run dev:api
bun run dev:admin
bun run dev:mobile

# Database
bun run db:generate
bun run db:migrate
bun run db:studio

# Testing
bun run test
bun run lint
bun run typecheck
```

### Important URLs
- API Docs: http://localhost:3000/api/docs
- Admin Dashboard: http://localhost:3001
- Prisma Studio: Run `bun run db:studio`

### Key Decisions
- **Package Manager**: Bun (not npm/pnpm)
- **Expo SDK**: 54 (latest stable)
- **Database**: Neon PostgreSQL + PostGIS
- **Maps**: Goong Maps (Vietnam-optimized)
- **Monorepo**: Bun Workspaces (not Turborepo)

---

**Last Updated**: 2026-02-09
