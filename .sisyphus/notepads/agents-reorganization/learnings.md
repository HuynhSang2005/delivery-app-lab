# Learnings — Agents Reorganization

## 2026-02-20 Initial Analysis
- Plan says 54 skills but actual count is **72 active skills** (excluding .archive)
- .archive has **7 dirs** (not 6): frontend-testing, jwt-auth, jwt-security, next-best-practices, next-cache-components, next-upgrade, vercel-react-best-practices
- `.opencode/skills/` does NOT exist yet — needs to be created
- `./AGENTS.md` does NOT exist yet at root — only at `.opencode/AGENTS.md`
- New skills added since plan was written: geojson-points, geojson-postgis, geojson-wkt, geospatial-postgis-patterns, postgis, postgis-buffer, postgis-distance, postgis-dwithin, postgis-extract-xy, postgis-intersects, postgis-nearest, postgis-transform (plus others)
- Moved AGENTS.md from .opencode/ to root ./AGENTS.md
- Rewrote AGENTS.md using the required specification
- Verified no npm/npx references in new AGENTS.md
- Verified AGENTS.md size (5.6 KiB) is well below the 32 KiB limit

## 2026-02-20 Wave 2 — Skill Migration
- Successfully moved all 72 active skills from `.agents/skills/` to `.opencode/skills/`
- Used copy-then-delete approach due to git mv issues with some directories
- **Verification Results**:
  - ✅ `.opencode/skills/` contains exactly 72 directories
  - ✅ `.agents/skills/.archive/` preserved with 7 archived skills
  - ✅ All 72 skills have SKILL.md files
  - ✅ Content byte-for-byte preserved (no modifications)
  - ✅ `find-skills/SKILL.md` contains allowed `npx skills` references (verified: 12 occurrences)
  - ⚠️ 2 skills exceed 500 lines (acceptable - complex domain content):
    - geospatial-postgis-patterns: 825 lines
    - postgis: 606 lines
- Skills now load with highest priority via `.opencode/skills/` location
