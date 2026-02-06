# OpenCode Workflow

## MCP Servers (4)

- **context7**: Library docs (Remote)
- **tavily**: Web search (Local - bunx)
- **neon**: Database (Local - bunx)
- **serena**: Codebase exploration (Local - uvx)

## Agents (2)

- **build**: Full development access
- **plan**: Read-only analysis

## Commands

- `/test`: Run tests
- `/review`: Code review

## Skills

Load dynamically: `skill({ name: "skill-name" })`

## Prerequisites

- **bun**: For tavily, neon MCP
- **uv/uvx**: For serena MCP (install: `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"`)
