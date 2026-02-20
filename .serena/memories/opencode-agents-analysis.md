# Phân Tích Vị Trí Agent-Skill và AGENTS.md cho Logship-MVP

## 1. Vị Trí Agent-Skill: `.agents/skills/` có đúng không?

### ✅ KẾT LUẬN: ĐÚNG - `.agents/skills/` là vị trí HỢP LỆ

Theo tài liệu chính thức từ opencode.ai ([Agent Skills docs](https://opencode.ai/docs/skills/)):

**Project-specific skill locations (theo thứ tự ưu tiên):**
1. `.agents/skills/<name>/SKILL.md` ✅ **HIỆN TẠI ĐANG DÙNG**
2. `.claude/skills/<name>/SKILL.md`
3. `.opencode/skills/<name>/SKILL.md`

**Global skill locations:**
- `~/.agents/skills/<name>/SKILL.md`
- `~/.claude/skills/<name>/SKILL.md`
- `~/.config/opencode/skills/<name>/SKILL.md`

**Cách OpenCode load skills:**
- Walk up từ current working directory cho đến git worktree root
- Load tất cả skills từ các paths trên
- Skills ở cả `.opencode/skills/` và `.agents/skills/` đều được load

### Ưu/Nhược điểm của `.agents/skills/`

**Ưu điểm:**
- ✅ Là vị trí chuẩn được opencode.ai khuyến nghị
- ✅ Tương thích với Claude Code (`~/.claude/skills/`)
- ✅ Dễ dàng version control (trong repo)
- ✅ Rõ ràng phân biệt với config của opencode (`.opencode/`)

**Nhược điểm:**
- ⚠️ Không có nhược điểm đáng kể - đây là vị trí recommended
- ⚠️ Nếu muốn skills chỉ dùng cho opencode (không phải Claude), có thể dùng `.opencode/skills/`, nhưng không bắt buộc

---

## 2. Vị Trí AGENTS.md: `.opencode/AGENTS.md` có đúng không?

### ✅ KẾT LUẬN: ĐÚNG nhưng CÓ THỂ CẢI THIỆN

Theo tài liệu opencode.ai ([Rules docs](https://opencode.ai/docs/rules/)):

**Vị trí hợp lệ cho AGENTS.md:**
1. **Project root** (`./AGENTS.md`) - Ưu tiên cao nhất
2. **`.opencode/AGENTS.md`** ✅ **HIỆN TẠI ĐANG DÙNG** - Hợp lệ
3. Global: `~/.config/opencode/AGENTS.md`

**Thứ tự ưu tiên khi load:**
1. Local files (từ current directory walk up): `AGENTS.md` → `CLAUDE.md`
2. Global: `~/.config/opencode/AGENTS.md`
3. Claude Code compatibility: `~/.claude/CLAUDE.md`

### So sánh: `./AGENTS.md` vs `.opencode/AGENTS.md`

| Tiêu chí | `./AGENTS.md` | `.opencode/AGENTS.md` |
|----------|---------------|----------------------|
| Visibility | ⭐⭐⭐ Rất cao - nằm ngay root | ⭐⭐ Cao - trong folder config |
| Chuẩn của OpenCode | ⭐⭐⭐ Native support | ⭐⭐⭐ Native support |
| Compatibility với các tool khác | ⭐⭐ Tốt | ⭐⭐ Tốt |
| Khả năng bị thay đổi nhầm | ⚠️ Có thể bị edit | ✅ Protected trong folder config |

**Khuyến nghị:** Giữ nguyên `.opencode/AGENTS.md` vì:
- Đã hoạt động tốt
- Nằm trong folder config chuẩn
- Có thể thêm `AGENTS.md` ở root nếu muốn tăng visibility

---

## 3. Phân Tích AGENTS.md Hiện Tại

### File hiện tại: `.opencode/AGENTS.md` (106 lines)

**Cấu trúc hiện tại:**
```
1. Header (title, last updated)
2. Agent Role
3. Project Context (status, current task, runtime)
4. Critical Files (table)
5. Quick Start (commands)
6. Architecture (description + rules)
7. Tech Stack (table)
8. Code Conventions (bullet list)
9. Testing
10. Boundaries (ALWAYS/ASK/NEVER)
11. When Stuck
12. References
```

### ✅ Điểm TỐT:
- Có đầy đủ thông tin cơ bản
- Format rõ ràng, dễ đọc
- Có phân chia ALWAYS/ASK/NEVER
- Có references đến docs khác

### ❌ Vấn đề cần cải thiện:

**1. Thiếu sections theo chuẩn agents.md:**
- Không có `## Abstract` hoặc `## Overview`
- Không có `## Mission` hoặc `## Purpose`
- Không có version hay metadata

**2. Structure chưa chuẩn:**
- Không dùng heading levels đúng chuẩn (h1 → h2 → h3)
- Một số sections dùng bold thay vì heading

**3. Thiếu instruction rõ ràng cho agent:**
- Chưa có section "Custom Instructions" cụ thể
- Chưa hướng dẫn cách agent nên load external files

**4. Chưa tối ưu cho LLM:**
- Thiếu "TL;DR" hoặc executive summary
- Chưa có examples cụ thể về workflow

---

## 4. So sánh với AGENTS.md chuẩn

### Ví dụ AGENTS.md chuẩn từ OpenCode docs:

```markdown
# SST v3 Monorepo Project

This is an SST v3 monorepo with TypeScript. The project uses bun workspaces for package management.

## Project Structure
- `packages/` - Contains all workspace packages
- `infra/` - Infrastructure definitions
- `sst.config.ts` - Main SST configuration

## Code Standards
- Use TypeScript with strict mode enabled
- Shared code goes in `packages/core/`
- Functions go in `packages/functions/`

## Monorepo Conventions
- Import shared modules using workspace names
```

### Nhận xét:
- AGENTS.md hiện tại của bạn **chi tiết hơn** ví dụ chuẩn
- Nhưng **thiếu clarity** về cách agent nên parse thông tin
- Nên thêm explicit instructions về external file loading

---

## 5. Khuyến nghị cải thiện AGENTS.md

### Option A: Giữ nguyên vị trí, cải thiện nội dung (Khuyến nghị)

Giữ `.opencode/AGENTS.md` nhưng refactor:
1. Thêm TL;DR/Overview ở đầu
2. Thêm section "External File Loading Instructions"
3. Thêm version và last-updated metadata
4. Refactor headings cho chuẩn
5. Thêm concrete workflow examples

### Option B: Tách thành 2 files
- `./AGENTS.md` - High-level overview + critical rules
- `.opencode/AGENTS.md` - Chi tiết technical + tool integrations

### Option C: Dùng `opencode.json` kết hợp
- `opencode.json` chứa `instructions` reference đến nhiều files
- Tách AGENTS.md thành các module nhỏ trong `docs/agents/`

---

## 6. Kết luận tổng hợp

| Câu hỏi | Trả lợi |
|---------|---------|
| `.agents/skills/` có đúng? | ✅ **ĐÚNG** - Đây là vị trí chuẩn cho project-specific skills |
| `.opencode/AGENTS.md` có đúng? | ✅ **ĐÚNG** - Hợp lệ, nhưng có thể cải thiện nội dung |
| Cần rewrite AGENTS.md? | ⚠️ **NÊN** - Format hiện tại chưa tối ưu cho LLM processing |

**Hành động đề xuất:**
1. Giữ nguyên `.agents/skills/` - Không cần thay đổi
2. Giữ nguyên `.opencode/AGENTS.md` - Vị trí hợp lệ
3. Rewrite AGENTS.md theo format chuẩn hơn để tối ưu cho LLM

---

*Phân tích bởi: Atlas Agent*
*Ngày: 2026-02-19*
*Dựa trên: opencode.ai/docs/rules, opencode.ai/docs/skills, agents.md spec*
