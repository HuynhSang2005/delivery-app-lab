# OpenCode + oh-my-opencode-slim Research Summary

**Research Date:** February 24, 2026  
**Epic:** delivery-app-lab-iam

---

## 1. oh-my-opencode-slim Overview

**Repository:** https://github.com/alvinunreal/oh-my-opencode-slim  
**Purpose:** Slimmed, cleaned and fine-tuned oh-my-opencode fork that consumes much less tokens  
**License:** MIT

### Core Concept: Six Divine Agents (The Pantheon)

| Agent | Role | Recommended Models |
|-------|------|-------------------|
| **Orchestrator** | Master delegator and strategic coordinator | kimi-for-coding/k2p5, openai/gpt-5.2-codex |
| **Explorer** | Codebase reconnaissance | cerebras/zai-glm-4.7, google/gemini-3-flash, openai/gpt-5.1-codex-mini |
| **Oracle** | Strategic advisor and debugger of last resort | openai/gpt-5.2-codex, kimi-for-coding/k2p5 |
| **Librarian** | External knowledge retrieval | google/gemini-3-flash, openai/gpt-5.1-codex-mini |
| **Designer** | UI/UX implementation and visual excellence | google/gemini-3-flash |
| **Fixer** | Fast implementation specialist | cerebras/zai-glm-4.7, google/gemini-3-flash, openai/gpt-5.1-codex-mini |

---

## 2. Slim Plugin Configuration Schema

**Config File:** `~/.config/opencode/oh-my-opencode-slim.json` (or `.jsonc` for comments)

### Top-Level Fields

```json
{
  "preset": "logship-mvp",           // Active preset name
  "presets": { ... },                // Object containing all preset definitions
  "balanceProviderUsage": false,     // Balance usage between providers
  "fallback": {                      // Fallback configuration
    "enabled": true,
    "timeoutMs": 15000,
    "chains": { ... }
  }
}
```

### Per-Agent Fields (inside preset)

| Field | Type | Description |
|-------|------|-------------|
| `model` | string | Model ID in format `provider/model-id` |
| `variant` | string | Variant level: `low`, `medium`, `high` |
| `skills` | string[] | Array of skill names or `["*"]` for all |
| `mcps` | string[] | Array of MCP names or `["*"]` for all |

### Variant System

Variants control model thinking level/effort:

- **Anthropic**: `high` (default), `max` (maximum thinking budget)
- **OpenAI**: `none`, `minimal`, `low`, `medium`, `high`, `xhigh`
- **Google**: `low`, `high`

The variant is passed to the model's provider-specific options (e.g., `thinkingLevel` for Google models).

### Built-in MCPs Provided by Slim

1. **websearch** - Web search via OpenCode's built-in search
2. **context7** - Library documentation search (requires config)
3. **grep_app** - Code search via Grep by Vercel

---

## 3. OpenCode Configuration Schema

**Schema URL:** https://opencode.ai/config.json  
**Formats:** JSON or JSONC (JSON with Comments)

### Config Precedence (Lowest to Highest)

1. Remote config (`.well-known/opencode`)
2. Global config (`~/.config/opencode/opencode.json`)
3. Custom config (`OPENCODE_CONFIG` env var)
4. **Project config (`opencode.json` in project root)** ← Our focus
5. `.opencode/` directories
6. Inline config (`OPENCODE_CONFIG_CONTENT` env var)

**Key Point:** Later configs override earlier ones. Settings are merged, not replaced.

### Agent Configuration Fields

```json
{
  "agent": {
    "agent-name": {
      // Core fields
      "mode": "primary" | "subagent" | "all",
      "description": "string",           // REQUIRED
      "temperature": 0.0-1.0,            // Default: model-specific (usually 0)
      "steps": number,                   // Max iterations (alias: maxSteps)
      "disable": boolean,
      "hidden": boolean,                 // Hide from @ autocomplete
      
      // Model configuration
      "model": "provider/model-id",
      "top_p": 0.0-1.0,                  // Alternative to temperature
      
      // Prompt configuration
      "prompt": "path/to/prompt.md",     // Or inline text
      
      // Tool configuration
      "tools": {                         // Enable/disable specific tools
        "write": true/false,
        "bash": true/false,
        "edit": true/false,
        "mcp_serena": true/false         // Pattern matching for MCP tools
      },
      
      // Permissions
      "permission": {
        "edit": "ask" | "allow" | "deny",
        "bash": "ask" | "allow" | "deny",
        "webfetch": "ask" | "allow" | "deny"
      },
      
      // Subagent invocation control
      "permission.task": {               // Control which subagents can be invoked
        "oracle": "allow" | "deny",
        "fixer": "allow" | "deny",
        "*": "allow" | "deny"           // Wildcard pattern
      },
      
      // UI customization
      "color": "#FF5733" | "primary" | "secondary" | ... ,
      
      // Provider-specific options (passed through)
      "reasoningEffort": "high",
      "thinking": { "budgetTokens": 16000 },
      // ... any other provider options
    }
  }
}
```

### MCP Server Configuration

```json
{
  "mcp": {
    "mcp-name": {
      "type": "local" | "remote",
      
      // For local MCPs
      "command": ["bunx", "-y", "package-name"],
      "environment": { "API_KEY": "value" },
      
      // For remote MCPs
      "url": "https://mcp.example.com/mcp",
      "headers": { "Authorization": "Bearer token" },
      "oauth": { "clientId": "...", "scope": "..." } | false,
      
      // Common options
      "enabled": true | false,
      "timeout": 5000  // Default: 5000ms
    }
  }
}
```

### Other Top-Level Config Fields

```json
{
  "$schema": "https://opencode.ai/config.json",
  
  // Core settings
  "instructions": ["./AGENTS.md", "./docs/*.md"],  // Glob patterns supported
  "default_agent": "plan",  // Must be a primary agent
  
  // Model settings
  "model": "provider/model-id",
  "small_model": "provider/model-id",  // For lightweight tasks (titles, etc.)
  
  // Provider configuration
  "provider": { ... },
  "enabled_providers": ["anthropic", "openai"],
  "disabled_providers": ["gemini"],
  
  // TUI settings
  "tui": {
    "scroll_speed": 3,
    "scroll_acceleration": { "enabled": true },
    "diff_style": "auto" | "stacked"
  },
  
  // Server settings
  "server": {
    "port": 4096,
    "hostname": "0.0.0.0",
    "mdns": true,
    "mdnsDomain": "myproject.local",
    "cors": ["http://localhost:5173"]
  },
  
  // Global permissions
  "permission": {
    "edit": "ask" | "allow" | "deny",
    "bash": "ask" | "allow" | "deny",
    "webfetch": "ask" | "allow" | "deny"
  },
  
  // Compaction settings
  "compaction": {
    "auto": true,
    "prune": true,
    "reserved": 10000
  },
  
  // File watcher
  "watcher": {
    "ignore": ["node_modules/**", "dist/**", ".git/**"]
  },
  
  // Sharing
  "share": "manual" | "auto" | "disabled",
  
  // Custom commands
  "command": { ... },
  
  // Plugins
  "plugin": ["@scope/plugin-name"],
  
  // Auto-update
  "autoupdate": true | false | "notify",
  
  // Formatters
  "formatter": { ... },
  
  // Keybinds
  "keybinds": { ... },
  
  // Theme
  "theme": "opencode",
  
  // Experimental
  "experimental": { ... }
}
```

---

## 4. Current Project State Analysis

### Project opencode.json (D:\delivery-app-lab\opencode.json)

**Agents (8 total):**

| Agent | Mode | Temperature | Steps | Prompt File | Edit | Bash |
|-------|------|-------------|-------|-------------|------|------|
| plan | **primary** ⚠️ | 0.3 | 50 | plan-prompt.md | deny | deny |
| review | subagent | 0.2 | 30 | review-prompt.md | deny | allow |
| db | subagent | 0.3 | 40 | db-prompt.md | deny | allow |
| oracle | subagent | 0.1 | 50 | (none) | deny | deny |
| fixer | subagent | 0.1 | 30 | (none) | allow | allow |
| explorer | subagent | 0.1 | 15 | (none) | deny | deny |
| librarian | subagent | 0.2 | 20 | (none) | deny | deny |
| designer | subagent | 0.3 | 40 | (none) | allow | allow |

**MCPs (4 total):**
- serena (local, uvx, timeout: 30s)
- tavily (local, bunx, timeout: default 5s)
- context7 (remote, timeout: 30s)
- neon (remote, timeout: 15s)

**Other Settings:**
- default_agent: plan
- compaction: auto=true, prune=true
- watcher: ignore node_modules, dist, .git, etc.
- permissions: edit=ask, bash=ask (global)

### Global ~/.config/opencode/opencode.json

- Plugins: @nick-vi/opencode-type-inject, opencode-antigravity-auth@1.5.1, oh-my-opencode-slim
- Providers: Google (Antigravity models)
- Agents: explore (disabled), general (disabled)

### Slim ~/.config/opencode/oh-my-opencode-slim.json

**Preset: logship-mvp**

| Agent | Model | Variant | Skills | MCPs |
|-------|-------|---------|--------|------|
| orchestrator | kimi-for-coding/k2p5 | - | ["*", "beads-workflow"] | ["websearch", "serena", "neon"] |
| oracle | google/gemini-3.1-pro-preview | high | ["nestjs-best-practices", "architecture-patterns", "database-design", "prisma-expert", "skill-creator"] | ["serena", "neon"] |
| fixer | github-copilot/gpt-5.1-codex-mini | low | ["nestjs-best-practices", "zod", "typescript", "beads-workflow"] | ["serena"] |
| designer | google/gemini-3.1-pro-preview | medium | ["building-native-ui", "vercel-react-native-skills", "tailwindcss"] | ["serena"] |
| librarian | google/gemini-3.1-pro-preview | low | ["find-skills", "skill-creator"] | ["websearch", "context7", "grep_app", "tavily"] |
| explorer | github-copilot/gpt-5.1-codex-mini | low | ["beads-workflow", "find-skills"] | ["serena"] |

**Fallback Configuration:**
- enabled: true
- timeoutMs: 15000
- Chains defined for all 6 agents

---

## 5. Identified Issues & Opportunities

### Issues Found

1. **Conflicting Agent Definitions**
   - Project defines `oracle`, `fixer`, `explorer`, `librarian`, `designer` as subagents
   - Slim also defines these same agents in its preset
   - **Risk:** Potential conflicts or unexpected behavior

2. **Mode Mismatch**
   - Project `plan` agent has `mode: primary`
   - But `orchestrator` from slim is meant to be the primary agent
   - **Question:** Should we change `plan` to `mode: all` or `subagent`?

3. **MCP Assignment Gaps**
   - `explorer` in slim only has `serena`, but could benefit from more search tools
   - `db` agent has no MCPs assigned (should have `neon`)
   - `review` agent has no MCPs (could use `serena` for code review)

4. **Temperature Inconsistency**
   - Project agents use various temps: 0.1, 0.2, 0.3
   - Slim agents don't specify temperature (use model defaults)
   - **Question:** Should we align these?

5. **Steps Values**
   - Project has custom steps (15-50)
   - Slim doesn't specify steps
   - Steps control cost by limiting iterations
   - **Question:** Are current steps optimal?

### Opportunities

1. **Optimize MCP Assignments**
   - Assign MCPs more strategically per agent purpose
   - Consider tool enablement via `tools` config

2. **Improve Fallback Chains**
   - Review timeout (15s may be too short for some models)
   - Consider enabling `balanceProviderUsage`

3. **Add Missing Configuration**
   - Consider adding `hidden` for internal agents
   - Add `color` for visual distinction
   - Configure `permission.task` to control subagent invocation

4. **Align with Best Practices**
   - Review permissions per agent purpose
   - Optimize temperature for each agent type
   - Consider `top_p` as alternative to temperature

---

## 6. Safe Optimization Boundaries

### ✅ Safe to Modify

- Slim preset agent configuration (model, variant, skills, mcps)
- Project agent permissions
- Project agent steps/temperature
- MCP assignments in slim
- Fallback chain ordering
- timeoutMs values

### ⚠️ Modify with Caution

- Agent modes (primary/subagent/all)
- MCP server configurations (verify connectivity after changes)
- Global provider settings

### ❌ Do NOT Modify

- MCP server type/command/URL (unless testing connectivity)
- Plugin list in global config
- Provider credentials

---

## 7. Recommendations Summary

### High Priority

1. **Resolve agent mode conflict** - Decide if `plan` should remain primary or switch to subagent
2. **Add MCPs to agents that need them:**
   - db: add neon
   - review: consider serena
   - explorer: consider grep_app for code search

### Medium Priority

3. **Review and optimize fallback chains**
4. **Consider enabling balanceProviderUsage**
5. **Review temperature settings for consistency**

### Low Priority

6. **Add visual customization (colors)**
7. **Configure task permissions for subagent control**
8. **Review hidden agents**

---

## 8. References

- OpenCode Docs: https://opencode.ai/docs
- OpenCode GitHub: https://github.com/anomalyco/opencode
- oh-my-opencode-slim GitHub: https://github.com/alvinunreal/oh-my-opencode-slim
- oh-my-opencode-slim Quick Ref: https://github.com/alvinunreal/oh-my-opencode-slim/blob/master/docs/quick-reference.md
- OpenCode Config Schema: https://opencode.ai/config.json
