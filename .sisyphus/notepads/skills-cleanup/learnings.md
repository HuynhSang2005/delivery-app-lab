Edits performed:

- Removed top-level forbidden keys from 12 SKILL.md files so each frontmatter contains only `name` and `description`.
- Preserved multi-line `description: |` blocks exactly where present.
- Removed `metadata:` blocks and any indented child lines entirely.
- Fixed subtle YAML boundary issues by ensuring files begin with `---` and end the frontmatter with `---` before body content.

Common patterns found:

- Single-line keys to remove: license, version, allowed-tools, trigger, updated, sasmp_version, bond_type, bonded_agent
- Multi-line `metadata:` blocks with nested fields were present in some files and required removing whole block.
- Some files had multiple `---` markers; only the first frontmatter block was modified.

Recent edits performed in this session:

- Removed duplicate `---` closing marker from `.agents/skills/database-design/SKILL.md` (lines 4-5 previously duplicated). Ensured exactly one closing `---` after frontmatter.
- Removed duplicate `---` closing marker from `.agents/skills/react-native-animations/SKILL.md` (lines 4-5 previously duplicated). Ensured exactly one closing `---` after frontmatter.

Action notes:

- Verified changes did not alter body content or other frontmatter fields.
- Updated plan checkboxes T2-T5 to `[x]` in `.sisyphus/plans/skills-cleanup.md` to reflect completed Wave 1 tasks staged on disk.

Next steps:

- Stage all changes under `.agents/skills/` and `.sisyphus/` and create Wave 1 commit with message: `chore(skills): complete Wave 1 — archive 6 skills, fix format violations (T1-T5)`.

Gotchas:

- Be careful not to remove or alter the closing `---` that separates frontmatter from the body — several files had second `---` later in the doc.
- Preserve indents inside the description block exactly. YAML block scalars `|` must stay intact.

Verification:

- Ran grep for forbidden keys across the 12 SKILL.md files. No matches found after edits.
