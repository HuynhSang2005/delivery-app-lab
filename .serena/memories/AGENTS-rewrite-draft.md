# DRAFT: AGENTS.md Rewrite Proposal

## File Location
Move from: `.opencode/AGENTS.md` → `./AGENTS.md` (repository root)

## Key Improvements

### 1. Added TL;DR Section
```markdown
## TL;DR

**Tech Stack**: NestJS 11 + Bun + Prisma 7 + Neon PostgreSQL + PostGIS + Expo SDK 54  
**Current Task**: Initialize Prisma (Task 1.2.1)  
**Key Constraint**: Bun exclusively (no npm/npx/yarn/pnpm)

**Agent Priorities**: Type safety > Correctness > Performance > Speed
```

### 2. Clearer Project Structure
- Visual tree format
- Highlight critical files with ⭐

### 3. Dedicated Commands Section
- Organized by context (Backend/Mobile/Prisma)
- Clear Bun commands

### 4. External File Loading Instructions
```markdown
## External File Loading Instructions

**CRITICAL**: When encountering file references, use lazy loading:

1. **ALWAYS read first**: `docs/be/dev-v1/CURRENT_STATE.md`
2. **Architecture decisions**: Check `docs/` before changing patterns
3. **Skills**: Use `skill({ name: "find-skills" })` to discover dynamically
4. **Tools**: Use `serena-mcp` for codebase exploration
5. **Library docs**: Use `context7` before implementation

**Do NOT preemptively load all files** — load on demand based on task.
```

### 5. Better Tables
- Tech Stack table with versions
- ALWAYS/ASK/NEVER more prominent

### 6. Metadata
- Added Last Updated
- Clear status indicators

---

## Full Draft Content

See full rewrite in analysis above. Key changes:
- ~150 lines (compact but complete)
- Standard markdown (no special syntax)
- Clear hierarchy (h1 → h2 → h3)
- Explicit instructions for agent behavior
