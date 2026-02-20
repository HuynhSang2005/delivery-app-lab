# Work Plan Summary: Agents Reorganization

## Scope
1. Move AGENTS.md from `.opencode/AGENTS.md` to `./AGENTS.md`
2. Rewrite AGENTS.md following agents.md spec
3. Move 54 skills from `.agents/skills/` to `.opencode/skills/`

## Key Technical Details
- Maintain all skill formats (frontmatter, ≤500 lines, bun commands)
- Preserve `.agents/skills/.archive/` (6 archived skills)
- New AGENTS.md must include: TL;DR, External File Loading Instructions, Project Structure
- Filename must be `AGENTS.md` (plural), not `AGENT.md`

## Dependencies
- Task 1 (Move AGENTS.md) can be done independently
- Task 2 (Rewrite) should happen after Task 1
- Task 3 (Move skills) can be done in parallel with Tasks 1-2

## Verification
- AGENTS.md exists at root
- All 54 skills in `.opencode/skills/`
- No npm/npx references in skills
- All skills ≤500 lines
- Skills load correctly via `skill()` tool
