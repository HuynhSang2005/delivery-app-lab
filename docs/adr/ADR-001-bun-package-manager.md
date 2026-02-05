# ADR-001: Use Bun as Package Manager

## Status

- **Accepted**

## Context

We needed to choose a package manager and runtime for the Logship-MVP project. The project is a monorepo with three applications (mobile, admin, api) and shared packages. Performance, developer experience, and modern tooling were key considerations.

Key requirements:
- Fast dependency installation
- Native monorepo workspace support
- TypeScript-first approach
- Modern JavaScript runtime features
- Good ecosystem compatibility

## Decision

We will use **Bun** (version 1.2+) as the package manager and runtime for the entire project.

## Consequences

### Positive

- **Speed**: Bun is significantly faster than npm, yarn, or pnpm for both installation and runtime
- **All-in-One**: Package manager, runtime, bundler, and test runner in a single tool
- **Native TypeScript**: First-class TypeScript support without additional configuration
- **Workspace Support**: Built-in workspace support without needing Turborepo or Nx
- **npm Compatibility**: Drop-in replacement for npm with compatible CLI commands
- **Modern Standards**: Supports latest JavaScript and Web standards

### Negative

- **Ecosystem Maturity**: Bun is newer than npm/yarn, some edge cases may exist
- **Team Learning**: Developers may need to learn Bun-specific features
- **CI/CD Integration**: Some CI/CD platforms may require specific setup for Bun
- **Documentation**: Less community documentation compared to npm

### Neutral

- **Lockfile Format**: Uses `bun.lockb` (binary format) instead of `package-lock.json`
- **Command Syntax**: Commands are similar but not identical to npm (`bun install` vs `npm install`)

## Alternatives Considered

### Alternative 1: npm

- **Pros**: Mature, widely supported, default for Node.js
- **Cons**: Slower, requires additional tools for workspaces (Lerna, Nx)
- **Why Rejected**: Performance concerns and lack of native workspace support

### Alternative 2: pnpm

- **Pros**: Fast, disk space efficient, good workspace support
- **Cons**: Still requires Node.js runtime separately, additional complexity
- **Why Rejected**: Bun offers similar benefits with additional runtime features

### Alternative 3: Yarn (Berry/Plug'n'Play)

- **Pros**: Mature, good workspace support (Yarn Workspaces)
- **Cons**: Complex configuration, PnP can cause compatibility issues
- **Why Rejected**: Too complex for our needs, Bun provides simpler solution

## Related Decisions

- [ADR-006: Use Bun Workspaces for Monorepo](./ADR-006-bun-workspaces.md)
- [00-Unified-Tech-Stack-Spec.md](../00-Unified-Tech-Stack-Spec.md)

## Migration Guide

For developers familiar with npm:

| npm Command | Bun Command |
|-------------|-------------|
| `npm install` | `bun install` |
| `npm install pkg` | `bun add pkg` |
| `npm install -D pkg` | `bun add -d pkg` |
| `npm run dev` | `bun run dev` |
| `npx cmd` | `bunx cmd` |

## Notes

- Bun maintains Node.js compatibility, so most packages work without modification
- The project uses Bun's workspace filtering with `--filter` flag
- All package.json files in the project use Bun commands exclusively

---

**Date**: 2025-02-03
**Author**: Solo Developer
**Stakeholders**: AI Development Assistant
