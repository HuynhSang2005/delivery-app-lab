---
name: beads-workflow
description: Git-backed task tracking with beads (bd) for AI coding agents. Use when managing project tasks, tracking dependencies, finding ready work, creating issues, or coordinating multi-session development. Triggers on task management, issue tracking, session start/end workflows, or any mention of beads/bd commands.
---

# Beads Workflow for AI Agents

Beads (`bd`) is a git-backed, dependency-aware issue tracker designed specifically for AI coding agents. It solves the "amnesia problem" where agents lose context between sessions.

## When to Use This Skill

Use beads when:
- Starting a new development session
- Creating or updating project tasks
- Finding work that is ready to implement (no blockers)
- Tracking dependencies between tasks
- Discovering new work during implementation
- Closing or handing off completed work

## Core Workflow

### 1. Session Start (Always Run First)

```bash
bd prime                        # Load context + session close checklist
bd ready --json                 # Find unblocked work
bd list --status open --json    # View all open issues
```

**Check recent tasks first:** Highest-numbered IDs represent current priorities.

```bash
# View recent tasks (highest 20 IDs = most recent work)
bd list --status open --json | jq 'sort_by(.id | sub(".*-"; "") | tonumber) | reverse | .[0:20]'
```

### 2. Claim and Execute Work

```bash
# Find ready work
ISSUE=$(bd ready --json | jq -r '.[0].id')

# Claim the task
bd update $ISSUE --status in_progress --json

# Do the work...

# Complete the task
bd close $ISSUE --reason "Implemented in commit abc123, tests passing" --json
```

### 3. Create New Issues

**Always include descriptions** for context:

```bash
bd create "Implement user authentication" \
  -t feature -p 1 \
  --description="Add JWT-based auth with refresh tokens. Background: Required for mobile app login flow." \
  --json
```

### 4. Link Discovered Work

When finding new work during implementation:

```bash
# Create and link to parent issue
NEW_ID=$(bd create "Fix discovered race condition" -t bug -p 1 --json | jq -r '.id')
bd dep add $NEW_ID $CURRENT_ISSUE --type discovered-from --json
```

### 5. Session Close (Mandatory)

```bash
bd sync                         # Export beads to JSONL
git add .beads/issues.jsonl     # Stage changes
git commit -m "..."             # Commit with code
git push                        # Push to remote
```

## Essential Commands

| Command | Purpose |
|---------|---------|
| `bd prime` | Load session context |
| `bd ready --json` | Unblocked work (use this!) |
| `bd list --status open --json` | All open issues |
| `bd create "Title" -t task -p 2 --json` | Create issue |
| `bd update <id> --status in_progress --json` | Start work |
| `bd close <id> --reason "..." --json` | Complete work |
| `bd dep add <dep> <blocker> --json` | Add dependency |
| `bd sync` | Export to git |

## Issue Types & Priorities

**Types:** `bug`, `feature`, `task` (default), `epic`, `chore`

**Priorities:** `0`=Critical, `1`=High, `2`=Medium (default), `3`=Low, `4`=Backlog

## Best Practices

1. **Always use `--json`** for programmatic access
2. **Always include `--description`** when creating issues
3. **Check `bd ready` first** before starting work
4. **Link discovered issues** back to parent work
5. **Run `bd sync` before session end**
6. **Never create circular dependencies** (check with `bd dep cycles`)

## Project Labels

Common labels for this project:
- `backend` — NestJS API work
- `mobile` — Expo/React Native
- `database` — Prisma/PostgreSQL
- `infra` — DevOps, config
- `security` — Auth, encryption
- `testing` — Test coverage
- `urgent` — Time-critical

## JSON Parsing Examples

```bash
# Get first ready issue ID
ISSUE_ID=$(bd ready --json | jq -r '.[0].id')

# Check if ready work exists
READY_COUNT=$(bd ready --json | jq 'length')
[ "$READY_COUNT" -eq 0 ] && echo "No ready work"

# Get recent tasks sorted by ID
bd list --json | jq 'sort_by(.id | sub(".*-"; "") | tonumber) | reverse | .[0:10]'
```

## Recovery

If beads state seems out of sync:

```bash
bd sync --import-only             # Re-import from JSONL
bd doctor                         # Check system health
```

For full documentation: https://steveyegge.github.io/beads/
