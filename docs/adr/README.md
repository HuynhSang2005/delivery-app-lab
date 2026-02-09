# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the Logship-MVP project.

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences. ADRs help teams understand:

- **Why** certain decisions were made
- **What alternatives** were considered
- **What trade-offs** were accepted

## ADR Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](./ADR-001-bun-package-manager.md) | Use Bun as Package Manager | Accepted | 2026-02-09 |
| [ADR-002](./ADR-002-nestjs-backend.md) | Use NestJS for Backend Framework | Accepted | 2026-02-09 |
| [ADR-003](./ADR-003-neon-postgresql.md) | Use Neon Serverless PostgreSQL | Accepted | 2026-02-09 |
| [ADR-004](./ADR-004-expo-react-native.md) | Use Expo + React Native for Mobile | Accepted | 2026-02-09 |
| [ADR-005](./ADR-005-goong-maps.md) | Use Goong Maps for Vietnam Market | Accepted | 2026-02-09 |
| [ADR-006](./ADR-006-bun-workspaces.md) | Use Bun Workspaces for Monorepo | Accepted | 2026-02-09 |

## ADR Status Definitions

- **Proposed**: Under discussion, not yet decided
- **Accepted**: Decision has been made and is in effect
- **Deprecated**: Decision is no longer relevant or has been superseded
- **Superseded**: Replaced by a newer ADR (link to new ADR)

## Contributing

When creating a new ADR:

1. Use the template in [ADR-TEMPLATE.md](./ADR-TEMPLATE.md)
2. Number sequentially (ADR-XXX)
3. Update this index
4. Submit via PR for team review

---

**Note**: ADRs are immutable once accepted. If a decision changes, create a new ADR that supersedes the old one.
