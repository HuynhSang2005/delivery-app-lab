# ADR-006: Use Bun Workspaces for Monorepo

## Status

- **Accepted**

## Context

We needed to choose a monorepo management strategy for Logship-MVP. The project consists of:
- 3 applications: mobile (Expo), admin (Next.js), api (NestJS)
- Potential for shared packages in the future (shared-types, shared-config, shared-utils)

Requirements:
- Easy dependency management across packages
- Ability to run commands across multiple packages
- Shared code between applications
- Simple setup for solo developer
- Cost-effective (prefer free solutions)

## Decision

We will use **Bun Workspaces** (native workspace support) for monorepo management.

## Consequences

### Positive

- **Native Support**: Built into Bun, no additional tools needed
- **Zero Configuration**: Simple `workspaces` field in root package.json
- **Fast**: Bun's speed applies to workspace operations
- **Simple**: Less complex than Turborepo or Nx
- **Cost**: Free, no paid features needed
- **Filtering**: `--filter` flag to target specific packages
- **Hoisting**: Automatic dependency hoisting
- **Cross-References**: Easy workspace package references with `workspace:*`

### Negative

- **Limited Features**: No advanced caching like Turborepo
- **No Pipeline**: No built-in task pipeline/orchestration
- **Newer**: Less community knowledge compared to pnpm workspaces
- **Tooling**: Some tools may not recognize Bun workspaces

### Neutral

- **Lockfile**: Uses Bun's binary lockfile format
- **Node Modules**: Standard node_modules structure

## Alternatives Considered

### Alternative 1: Turborepo

- **Pros**: Advanced caching, pipeline configuration, great for CI/CD
- **Cons**: Additional complexity, more configuration needed
- **Why Rejected**: Overkill for solo developer, Bun workspaces sufficient

### Alternative 2: pnpm Workspaces

- **Pros**: Mature, disk space efficient, good workspace support
- **Cons**: Requires pnpm (separate from runtime), additional tool to learn
- **Why Rejected**: Bun provides similar features with less tooling

### Alternative 3: Nx

- **Pros**: Enterprise-grade, powerful features, great for large teams
- **Cons**: Heavy, complex configuration, overkill for small projects
- **Why Rejected**: Too complex for solo developer with 3 apps

### Alternative 4: npm Workspaces

- **Pros**: Built into npm, no additional tools
- **Cons**: Slower than Bun/pnpm, less efficient disk usage
- **Why Rejected**: Bun offers better performance and features

### Alternative 5: Yarn Workspaces (Berry)

- **Pros**: Mature, good Plug'n'Play support
- **Cons**: Complex configuration, PnP can cause issues
- **Why Rejected**: Bun provides simpler solution

## Workspace Structure

```
logship-mvp/
├── apps/
│   ├── mobile/          # @logship/mobile
│   ├── admin/           # @logship/admin
│   └── api/             # @logship/api
└── package.json         # Root with workspaces config
```

> **Future:** When shared code is needed, add `packages/` directory
> (e.g. `packages/shared-types`, `packages/shared-config`, `packages/shared-utils`)
> and include `"packages/*"` in the workspaces array.

## Root package.json Configuration

```json
{
  "name": "logship-mvp",
  "private": true,
  "workspaces": [
    "apps/*"
  ]
}
```

## Common Commands

```bash
# Install all dependencies
bun install

# Run dev in all packages
bun run --filter '*' dev

# Run specific package
bun run --filter @logship/mobile dev

# Add dependency to specific package
bun add --filter @logship/mobile zod

# Build all packages
bun run --filter '*' build
```

## Workspace Package References

```json
{
  "dependencies": {
    "@logship/shared-types": "workspace:*"
  }
}
```

## Related Decisions

- [ADR-001: Use Bun as Package Manager](./ADR-001-bun-package-manager.md)
- [08-Monorepo-Structure.md](../08-Monorepo-Structure.md)

## Best Practices

1. **No Cross-App Imports**: Apps never import from other `apps/*` directly
2. **Shared Code via Packages**: When needed, extract to `packages/*` and add to workspaces
3. **Version Pinning**: Use exact versions for critical dependencies
4. **Build Before Commit**: Run `bun run build` before pushing

## Notes

- Bun workspaces don't have advanced caching like Turborepo
- For CI/CD, consider using `--filter` to only build changed packages
- Workspace packages should be marked as `"private": true`

---

**Date**: 2026-02-09
**Author**: Solo Developer
**Stakeholders**: AI Development Assistant
