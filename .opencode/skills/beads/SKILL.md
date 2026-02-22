# Beads — Git-Backed Task Tracker Skill

Beads is a lightweight issue tracker that stores tasks in git-tracked JSONL files (`.beads/issues.jsonl`). The SQLite DB (`.beads/beads.db`) is local-only and gitignored.

## Core Principle

**Always use `--json` for programmatic access.** Never parse human-readable output.

---

## Session Start Protocol

At the start of every session, run:

```bash
bd prime          # Load context + session close checklist
bd list --status open --json   # See all open issues
```

---

## Key Commands

### Create Issues
```bash
bd create "Task title" --json
bd create "Task title" --label backend --json
bd create "Task title" --priority high --json
bd q "Quick capture title"    # Fast create, outputs ID only
```

### Update Issues
```bash
bd update delivery-app-lab-eia --status in_progress --json
bd update delivery-app-lab-eia --status done --json
bd close delivery-app-lab-eia --json
bd reopen delivery-app-lab-eia --json
```

### Query Issues
```bash
bd list --json                              # All issues
bd list --status open --json               # Open only
bd list --label backend --json             # By label
bd ready --json                            # Issues ready to work (no blockers)
bd show delivery-app-lab-eia --json        # Issue details
bd search "prisma" --json                  # Full-text search
```

### Dependencies
```bash
bd update delivery-app-lab-rmk --blocked-by delivery-app-lab-eia --json
bd children delivery-app-lab-eia --json    # List child issues
```

### Sync (git commit of beads state)
```bash
bd sync           # Commit .beads/issues.jsonl to git
```

---

## Issue Prefix

This project uses prefix: **`delivery-app-lab`**  
Issue IDs look like: `delivery-app-lab-eia`, `delivery-app-lab-rmk`

---

## Session Close Protocol (MANDATORY)

**Work is NOT done until pushed.** Run in order:

```bash
git status                    # 1. Check what changed
git add <files>               # 2. Stage code changes
bd sync                       # 3. Commit beads JSONL changes
git commit -m "feat: ..."     # 4. Commit code
git push                      # 5. Push to remote
```

---

## Labels Used in This Project

| Label | Meaning |
|-------|---------|
| `backend` | NestJS API work |
| `mobile` | Expo/React Native |
| `database` | Prisma/PostgreSQL/PostGIS |
| `infra` | DevOps, config, tooling |
| `bug` | Bug fix |

---

## Priority Values

| Value | Meaning |
|-------|---------|
| `1` | Critical |
| `2` | High (default) |
| `3` | Medium |
| `4` | Low |

---

## Agent Workflow

1. **Check ready issues**: `bd ready --json`
2. **Start working**: `bd update <id> --status in_progress --json`
3. **Complete**: `bd close <id> --json`
4. **End session**: Run Session Close Protocol above

---

## File Locations

```
.beads/
├── beads.db          # SQLite (gitignored, local only)
├── config.yaml       # Beads config (git-tracked)
├── issues.jsonl      # All issues (git-tracked ✅)
├── interactions.jsonl # Audit trail (git-tracked ✅)
└── metadata.json     # Project metadata (git-tracked ✅)
```
