# OpenCode Infrastructure Research Report

> **Project:** Logship-MVP Delivery Platform  
> **Date:** February 22, 2026  
> **Scope:** oh-my-opencode-slim customization, memory solutions, plan/task tracking

---

## 1. oh-my-opencode-slim Analysis

### 1.1 Customization Support: ✅ YES

Plugin **fully supports per-project customization** through:

| Config File | Purpose | Location |
|-------------|---------|----------|
| `oh-my-opencode-slim.json` | Plugin preset & agent config | `~/.config/opencode/` |
| `oh-my-opencode-slim.jsonc` | Alternative with comments | `~/.config/opencode/` |
| `.slim/` directory | Cartography skill data | Project root |
| `~/.config/opencode/skills/` | Custom skills storage | User config |

**Customizable per agent:**
- `model` — Any model from any provider (OpenAI, Anthropic, Google, Kimi, etc.)
- `variant` — Low/medium/high reasoning
- `skills` — `*` (all), explicit list, or `!` exclusions
- `mcps` — MCP server permissions per agent

**Example project-specific tuning** (add to `~/.config/opencode/oh-my-opencode-slim.json`):
```json
{
  "presets": {
    "logship-mvp": {
      "orchestrator": { 
        "model": "kimi-for-coding/k2p5",
        "skills": ["*"], 
        "mcps": ["websearch", "serena", "neon"] 
      },
      "oracle": { 
        "model": "google/gemini-3.1-pro-preview", 
        "variant": "high",
        "skills": [],
        "mcps": ["websearch", "context7"]
      },
      "librarian": {
        "model": "google/gemini-3.1-pro-preview",
        "variant": "low",
        "skills": [],
        "mcps": ["websearch", "context7", "grep_app"]
      }
    }
  },
  "preset": "logship-mvp"
}
```

### 1.2 Bundled MCPs

**Built-in (enabled by default, no install needed):**

| MCP | Purpose | Assigned To |
|-----|---------|-------------|
| `websearch` | Real-time web search via Exa AI | orchestrator, librarian |
| `context7` | Official library docs (npm, etc.) | librarian |
| `grep_app` | GitHub code search | librarian |

**Your current MCPs** (from Status panel):
- `serena` ✅ — Your repo exploration
- `tavily` ✅ — Web search
- `context7` ✅ — Library docs
- `neon` ✅ — Database
- `websearch` ✅ — General web search
- `grep_app` ✅ — GitHub code search

**Verdict:** You already have all essential MCPs. No additional installs needed.

### 1.3 Bundled Skills

**Recommended (via `npx skills add`):**
- `simplify` — YAGNI code simplification → assign to orchestrator
- `agent-browser` — Browser automation → assign to designer

**Custom (bundled in plugin):**
- `cartography` — Repository mapping, codemap generation → assign to orchestrator

**Install additional skills:**
```bash
npx skills add simplify agent-browser
```

### 1.4 Plan/Task Tracking: ⚠️ LIMITED

**What oh-my-opencode-slim provides:**

| Feature | Status | Notes |
|---------|--------|-------|
| Phase reminder hooks | ✅ | Built-in, reminds of session phase |
| Background task manager | ✅ | Tracks delegated subagent tasks |
| `TodoWrite` tool | ⚠️ Native OpenCode | Not from plugin |
| Persistent plan storage | ❌ | Plans are session-only |
| Resumable sessions | ❌ | No built-in session restoration |
| Task dependency graph | ❌ | Not supported |

**Current behavior:**
- Orchestrator can spawn subagents (oracle, fixer, etc.) via `@agent` calls
- Each subagent executes independently
- No built-in persistent plan/roadmap across sessions
- `todowrite` is native OpenCode, not plugin-provided

---

## 2. Memory Solutions Comparison

### 2.1 Overview

| Solution | Stars | Storage | Offline | Install Complexity | OpenCode Integration |
|----------|-------|---------|---------|-------------------|---------------------|
| **basic-memory** | 828 | SQLite (+optional cloud) | ✅ Yes | Medium (Python) | MCP server |
| **claude-mem** | ? | SQLite + AI compression | ✅ Yes | High (Node+Bun+uv) | Claude Code plugin |
| **opencode-mem** | ? | SQLite + HNSW vectors | ✅ Yes | High (C++ compiler needed) | OpenCode plugin |
| **Serena (existing)** | N/A | Markdown files | ✅ Yes | ✅ Zero (built-in) | MCP server |

### 2.2 Detailed Comparison

#### basic-memory (basicmachines-co)
**Architecture:** Python + SQLite + optional cloud sync  
**Install:** `pip install basic-memory` or `uv`  
**Integration:** MCP server  
**Storage:** Local SQLite + optional cloud  
**Features:**
- Observations & notes auto-captured
- FTS5 full-text search
- Bidirectional sync with cloud (subscription)
- Git-like sync between devices

**Pros:**
- Mature (828 stars)
- Fast local search
- Works with Claude Desktop, ChatGPT, VS Code, Obsidian
- Open source

**Cons:**
- Requires Python/uv setup
- Cloud features require subscription
- Windows setup can be tricky
- Not Bun-native

**For your project:** ❌ **Not recommended** — adds Python dependency, conflicts with Bun-only stack.

---

#### claude-mem (thedotmack)
**Architecture:** Node.js + Bun + SQLite + AI compression  
**Install:** CLI handles deps auto (Bun + uv auto-installed if missing)  
**Integration:** Claude Code plugin ONLY (not OpenCode)  
**Storage:** SQLite + AI-compressed summaries  
**Features:**
- Session auto-capture
- Smart compression with AI
- Folder-level `CLAUDE.md` context files
- 28 language support
- Web viewer UI (real-time)

**Pros:**
- Automatic operation
- Context injection into future sessions
- Web UI for visualization

**Cons:**
- **Claude Code ONLY** — not OpenCode compatible
- High resource usage (worker service on port 37777)
- Beta features require opt-in
- Heavyweight for local use

**For your project:** ❌ **Not compatible** — requires Claude Code, not OpenCode.

---

#### opencode-mem (tickernelz)
**Architecture:** SQLite + HNSW (hnswlib-wasm) vector search  
**Install:** Add `"opencode-mem"` to `opencode.json` plugins  
**Integration:** OpenCode plugin ✅  
**Storage:** Local SQLite + HNSW vectors  
**Features:**
- Vector similarity search
- User profile learning
- Unified memory-prompt timeline
- Web UI on port 4747
- 12+ local embedding models
- Multi-provider AI (OpenAI, Anthropic)
- Smart deduplication

**Pros:**
- Native OpenCode plugin ✅
- Local-first, privacy protected
- Vector search (better than keyword)
- Customizable embedding models

**Cons:**
- **Requires C++ compiler** on install (hnswlib-node native bindings)
- Windows: needs Visual Studio Build Tools or `windows-build-tools`
- Additional config file `~/.config/opencode/opencode-mem.jsonc`
- Heavier than file-based memory

**For your project:** ⚠️ **Possible but complex** — C++ build requirement on Windows, adds friction.

---

#### Serena Memory (already installed)
**Architecture:** Markdown files in project  
**Install:** ✅ Already have it  
**Integration:** MCP server (`serena_write_memory`, `serena_read_memory`)  
**Storage:** `D:\delivery-app-lab\.opencode\memories\*.md`  
**Features:**
- Simple markdown files
- Version controlled (optional)
- Manual read/write via tools

**Pros:**
- ✅ Zero additional setup
- ✅ Works right now
- ✅ File-based, portable
- ✅ Integrates with project

**Cons:**
- No auto-capture (manual only)
- No vector search
- No AI compression
- Limited structure

**Current memories:** `AGENTS-rewrite-draft`, `AGENTS-rewrite-plan`, `opencode-agents-analysis`, `workplan-agents-reorganization-summary`

**For your project:** ✅ **Already available, keep using** — simplest option.

---

### 2.3 Memory Recommendation

| Priority | Solution | Reason |
|----------|----------|--------|
| **1st** | **Serena (existing)** + **manual docs** | Zero friction, already works, aligns with Bun stack |
| **2nd** | **opencode-mem** | If you need vector search and auto-capture, but requires C++ build setup |
| **3rd** | **basic-memory** | If you accept Python dependency |
| **❌** | **claude-mem** | Not OpenCode compatible |

**My recommendation:** Continue with **Serena memory** for manual structured notes + enhance with **project docs** (`docs/plans/`, `docs/adr/`) for architectural decisions. This is the cleanest approach for a Bun-only project.

---

## 3. Plan/Task Tracking Comparison

### 3.1 beads (steveyegge)

**Architecture:** Go CLI + SQLite + git-backed JSONL  
**Install:** 
```bash
# Windows
winget install beads
# Or
iwr -useb https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.ps1 | iex
```

**Integration:** CLI tool (language-agnostic), `.claude-plugin/` for Claude Code  
**Storage:** `.beads/beads.db` (SQLite) + `.beads/issues.jsonl` (git-tracked)  
**Features:**
- **Dependency-aware graph** (blocks, parent-child, discovered-from, related)
- **Formulas** — declarative workflow templates (TOML/JSON)
- **Molecules** — work graphs with relationships
- **Gates** — async coordination (human, timer, GitHub)
- **Daemon** — auto-sync background process
- **JSON API** — `bd list --json`, `bd show bd-42 --json`

**Pros:**
- ✅ Designed specifically for AI agents
- ✅ Git-backed — survives across sessions/machines
- ✅ Dependency tracking — "what blocks what"
- ✅ Language-agnostic (Go binary)
- ✅ Works with any agent (not just OpenCode)
- ✅ 6,420 commits, actively maintained

**Cons:**
- Another CLI tool to install
- Separate from OpenCode plugin ecosystem
- Requires manual `bd init` per project

**For your project:** ✅ **Highly recommended** — fills the exact gap in oh-my-opencode-slim's task tracking.

---

### 3.2 oh-my-opencode-slim Built-in

| Feature | Status | Notes |
|---------|--------|-------|
| `phaseReminderHook` | ✅ | Reminds of session phase |
| `backgroundTaskManager` | ✅ | Tracks subagent delegations |
| `autoUpdateChecker` | ✅ | Checks for plugin updates |
| Persistent roadmap | ❌ | Not available |
| Task dependencies | ❌ | Not available |
| Resumable sessions | ❌ | Not available |

**Verdict:** Great for **orchestration** (spawning agents), weak for **plan persistence**.

---

### 3.3 Combined Approach Recommendation

**Best setup for Logship-MVP:**

```
Task Tracking:    beads (CLI)          → Persistent, dependency-aware, git-backed
Memory:           Serena MCP           → Manual project notes, architectural decisions
                 + docs/plans/*.md     → Implementation plans
                 + docs/adr/*.md       → Architecture decision records
Orchestration:    oh-my-opencode-slim  → Multi-agent delegation
```

**Workflow:**
1. **Planning phase:** Create `docs/plans/2026-02-22-feature-name.md` with detailed steps
2. **Execution:** Orchestrator spawns subagents (@fixer, @oracle, etc.) as needed
3. **Tracking:** Use `bd` CLI to track task state:
   ```bash
   bd init
   bd create "Implement Prisma schema" -p 1 -t task
   bd ready  # See what's ready to work on
   ```
4. **Memory:** Use `serena_write_memory` for cross-session context
5. **Documentation:** Update `docs/be/dev-v1/CURRENT_STATE.md` at end of session

---

## 4. Final Recommendations

### Immediate Actions (This Session)

1. **Keep oh-my-opencode-slim** — It's working correctly, all agents are functional.

2. **No additional memory plugin needed** — Serena + project docs are sufficient.

3. **Install beads for task tracking** (optional but recommended):
   ```powershell
   winget install beads
   cd D:\delivery-app-lab
   bd init --quiet
   ```

4. **Update oh-my-opencode-slim.json** with project-specific preset (optional tuning):
   ```json
   {
     "presets": {
       "logship-mvp": {
         "orchestrator": { 
           "model": "kimi-for-coding/k2p5",
           "skills": ["*"], 
           "mcps": ["websearch", "serena", "neon"] 
         },
         "librarian": {
           "model": "google/gemini-3.1-pro-preview",
           "variant": "low",
           "mcps": ["websearch", "context7"]
         }
       }
     },
     "preset": "logship-mvp"
   }
   ```

### Summary Table

| Category | Current State | Recommended |
|----------|--------------|-------------|
| **Plugin** | oh-my-opencode-slim ✅ | Keep as-is |
| **MCPs** | 6 connected ✅ | No changes needed |
| **Memory** | Serena ✅ | Keep + use more |
| **Task Tracking** | Native `todowrite` ⚠️ | Add **beads** CLI |
| **Plans** | Markdown files ✅ | Keep `docs/plans/` |
| **Additional Tools** | None | Consider **beads** |

### Next Steps

Want me to:
1. **Install and configure beads** for this project?
2. **Create a project-specific preset** for oh-my-opencode-slim?
3. **Proceed with Task 1.2.1** (Initialize Prisma)?

---

*Report compiled from web extraction of: oh-my-opencode-slim repo/docs, basic-memory repo/docs, claude-mem repo/docs, opencode-mem repo, beads repo/docs.*
