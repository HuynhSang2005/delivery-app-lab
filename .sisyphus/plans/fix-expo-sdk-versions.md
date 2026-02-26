# Work Plan: Fix Expo SDK 54 Version Mismatch

## TL;DR

> **Quick Summary**: Sửa toàn bộ documentation để phản ánh đúng Expo SDK 54 ecosystem: Expo SDK 54 + React Native 0.81 + React 19.1.0
> 
> **Deliverables**:
> - Cập nhật 4 documentation files với versions chính xác
> - Tất cả mobile docs đồng nhất với Expo SDK 54 ecosystem
> - Lưu ý: apps/mobile/package.json chưa tồn tại, sẽ tạo sau với versions đúng
>
> **Estimated Effort**: Medium (7 tasks)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Research → Update 4 docs → Verification
>
---

## Context

### Tình Huống
Sau khi research kỹ lưỡng từ các nguồn chính thức:
- ✅ Zod v4.3.6 tồn tại (Jan 2026)
- ✅ React Native 0.84.0 tồn tại (Feb 2026)  
- ✅ React v19.2.4 tồn tại (Jan 2026)
- ✅ nestjs-zod v5.1.1 hỗ trợ Zod v4

**Tuy nhiên**, Expo SDK 54 có version constraints riêng:
| Package | Expo SDK 54 Official | Project Docs (sai) |
|---------|---------------------|-------------------|
| Expo | 54.0.x | ✅ 54.0.x |
| React Native | **0.81.x** | ❌ 0.84.0 |
| React | **19.1.0** | ❌ 19.2.4 |

### Files Cần Update (Documentation Only)
1. `docs/00-Unified-Tech-Stack-Spec.md` - Tech stack chính
2. `docs/01-SDD-System-Design-Document.md` - Section 5.1 Mobile
3. `docs/04-Mobile-App-Technical-Spec.md` - Mobile technical spec
4. `docs/adr/ADR-004-expo-react-native.md` - Architecture decision record

**Note**: `apps/mobile/package.json` chưa tồn tại (mobile app chưa được initialize).
Sẽ được tạo sau này với versions đúng: RN 0.81 + React 19.1
### Versions Đúng Cho Expo SDK 54

```yaml
# Expo SDK 54 Ecosystem
expo: ~54.0.0
react-native: 0.81.0  # KHÔNG phải 0.84
react: 19.1.0        # KHÔNG phải 19.2.4

# Expo SDK packages cho SDK 54
expo-location: ~18.0.0
expo-task-manager: ~12.0.0
```

---

## ⚠️ Important Discovery (From Momus Review)

**File `apps/mobile/package.json` KHÔNG tồn tại!**

Sau khi Momus review, phát hiện critical issue:
- Thư mục `apps/mobile/` chỉ có `.env.example`
- Mobile app chưa được initialize (chưa có package.json)
- Đây là **blocker** cho tasks cập nhật package.json

### Files Hiện Có Trong Repo
✅ `docs/00-Unified-Tech-Stack-Spec.md`  
✅ `docs/01-SDD-System-Design-Document.md`  
✅ `docs/04-Mobile-App-Technical-Spec.md`  
✅ `docs/adr/ADR-004-expo-react-native.md`  
❌ `apps/mobile/package.json` - **KHÔNG TỒN TẠI**

### Điều Chỉnh Plan

**Plan này sẽ chỉ tập trung vào Documentation Fixes** (4 files)
- Cập nhật tất cả docs với versions đúng của Expo SDK 54
- Khi tạo mobile app sau này, sẽ dùng versions đúng từ đầu

**Mobile App Initialization** sẽ là task riêng, có plan riêng

---

## Work Objectives
### Core Objective
Cập nhật 4 documentation files để phản ánh chính xác Expo SDK 54 ecosystem với React Native 0.81 và React 19.1.0

### Concrete Deliverables
- [ ] `00-Unified-Tech-Stack-Spec.md` - Mobile section updated
- [ ] `01-SDD-System-Design-Document.md` - Section 5.1 fixed
- [ ] `04-Mobile-App-Technical-Spec.md` - All versions corrected
- [ ] `ADR-004-expo-react-native.md` - Decision record updated

### Definition of Done
- [ ] Tất cả references đến "React Native 0.84" được sửa thành "0.81"
- [ ] Tất cả references đến "React 19.2.4" được sửa thành "19.1.0"
- [ ] Không còn version mismatch trong documentation
- [ ] (Future) Khi tạo mobile app, sẽ dùng RN 0.81 + React 19.1

### Must Have
- Expo SDK 54: ~54.0.0
- React Native: 0.81.0 (trong docs)
- React: 19.1.0 (trong docs)
- expo-location: ~18.0.0 (trong docs)
- expo-task-manager: ~12.0.0 (trong docs)

### Must NOT Have
- React Native 0.84.x trong docs với Expo SDK 54
- React 19.2.x trong docs với Expo SDK 54
- Inconsistency giữa các doc files

---

### Parallel Execution Waves
```
Wave 1 (Start Immediately - Read & Plan):
├── Task 1: Read current 00-Unified-Tech-Stack-Spec.md [quick]
├── Task 2: Read current 04-Mobile-App-Technical-Spec.md [quick]
├── Task 3: Read current 01-SDD-System-Design-Document.md [quick]
└── Task 4: Read current ADR-004-expo-react-native.md [quick]

Wave 2 (After Wave 1 - Updates, MAX PARALLEL):
├── Task 5: Update 00-Unified-Tech-Stack-Spec.md [quick]
├── Task 6: Update 04-Mobile-App-Technical-Spec.md [quick]
├── Task 7: Update 01-SDD-System-Design-Document.md [quick]
└── Task 8: Update ADR-004-expo-react-native.md [quick]
Wave 3 (After Wave 2 - Verification):
├── Task 9: Grep search for remaining "0.84" references [quick]
└── Task 10: Final verification and summary [quick]
Critical Path: Wave 1 → Wave 2 → Wave 3
Parallel Speedup: ~50% faster than sequential

### Dependency Matrix

- **1-4**: — — 5-8, 1
- **5-8**: 1-4 — 9-10, 2
- **9-10**: 5-8 — 3
---

## TODOs



- [ ] 1. Read and Analyze Current Documentation

  **What to do**:
  - Read `docs/00-Unified-Tech-Stack-Spec.md` - Section 2.2 và 3.1 (Mobile stack)
  - Read `docs/04-Mobile-App-Technical-Spec.md` - Sections 1.2, 1.3, 2.3
  - Read `docs/01-SDD-System-Design-Document.md` - Section 5.1
  - Read `docs/adr/ADR-004-expo-react-native.md`
  - Document tất cả vị trí cần sửa trong 4 files
  - Ghi nhận: apps/mobile/package.json chưa tồn tại, sẽ tạo sau với versions đúng

  **Must NOT do**:
  - Không edit files trong task này, chỉ read và analyze
  - Không bỏ sót bất kỳ reference nào đến RN 0.84 hoặc React 19.2.4

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple read operations, no complex logic
  - **Skills**: []
    - Không cần special skills cho read operations

  **Parallelization**:
  - **Can Run In Parallel**: YES - All 5 files can be read in parallel
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 5-9
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] List đầy đủ các line numbers cần sửa trong mỗi file
  - [ ] Tổng số references đến "0.84" và "19.2.4" được đếm
  - [ ] Báo cáo ngắn gọn về scope của changes

  **QA Scenarios**:
  ```
  Scenario: Verify all target files exist
    Tool: Bash (ls)
    Steps:
      1. ls docs/00-Unified-Tech-Stack-Spec.md
      2. ls docs/04-Mobile-App-Technical-Spec.md
      3. ls docs/01-SDD-System-Design-Document.md
      4. ls docs/adr/ADR-004-expo-react-native.md
      5. ls apps/mobile/  # Verify only .env.example exists
    Expected Result: 4 docs files tồn tại; apps/mobile/ chỉ có .env.example (chưa có package.json)
    Evidence: .sisyphus/evidence/task-1-files-exist.txt
  ```

  **Commit**: NO

- [ ] 2. Update 00-Unified-Tech-Stack-Spec.md

  **What to do**:
  - Section 2.2 Mobile Stack: Sửa "React Native 0.84.0" → "0.81.0"
  - Section 2.2: Sửa "React 19.2.4" → "19.1.0"
  - Section 3.1 Mobile Tech Stack table: Update versions
  - Section 9.1: Update nếu có mobile references
  - Thêm note về Expo SDK 54 supporting RN 0.81 only

  **Must NOT do**:
  - Không thay đổi các tech stack khác (backend, admin)
  - Không thay đổi Zod version (v4.3.6 đã đúng)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple find-and-replace edits
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES - With tasks 6-9
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 10-12
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] Không còn "0.84" trong file
  - [ ] Không còn "19.2.4" trong file
  - [ ] Các sections mobile đều có versions đúng

  **QA Scenarios**:
  ```
  Scenario: Verify no old versions remain
    Tool: Bash (grep)
    Steps:
      1. grep -n "0.84" docs/00-Unified-Tech-Stack-Spec.md
      2. grep -n "19.2.4" docs/00-Unified-Tech-Stack-Spec.md
    Expected Result: No matches found (exit code 1)
    Evidence: .sisyphus/evidence/task-2-grep-results.txt
  ```

  **Commit**: YES
  - Message: `docs: fix Expo SDK 54 versions - RN 0.81, React 19.1`
  - Files: `docs/00-Unified-Tech-Stack-Spec.md`

- [ ] 3. Update 04-Mobile-App-Technical-Spec.md

  **What to do**:
  - Section 1.2: Sửa "React Native 0.84.0" → "0.81.0"
  - Section 1.3: Sửa "React 19.2.4" → "19.1.0"
  - Section 2.3 Navigation: Update nếu có version refs
  - Section 4.3 Core Dependencies: Update expo-location, expo-task-manager versions
  - Section 6.1 Performance: Update nếu có version-specific metrics

  **Must NOT do**:
  - Không thay đổi Goong Maps configuration
  - Không thay đổi Firebase versions

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES - With tasks 5, 7-9
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 10-12
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] Section 1.2: RN 0.81.0
  - [ ] Section 1.3: React 19.1.0
  - [ ] expo-location: ~18.0.0
  - [ ] expo-task-manager: ~12.0.0

  **QA Scenarios**:
  ```
  Scenario: Verify mobile spec versions
    Tool: Bash (grep)
    Steps:
      1. grep -n "0.81" docs/04-Mobile-App-Technical-Spec.md
      2. grep -n "19.1.0" docs/04-Mobile-App-Technical-Spec.md
      3. grep -n "expo-location" docs/04-Mobile-App-Technical-Spec.md
    Expected Result: Versions chính xác xuất hiện
    Evidence: .sisyphus/evidence/task-3-versions.txt
  ```

  **Commit**: YES - groups with task 2

- [ ] 4. Update 01-SDD-System-Design-Document.md

  **What to do**:
  - Section 5.1 Mobile Tech Stack: Update RN và React versions
  - Sửa tất cả references đến RN 0.84 → 0.81
  - Sửa tất cả references đến React 19.2.4 → 19.1.0

  **Must NOT do**:
  - Không thay đổi Backend Tech Stack section

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES - With tasks 5-6, 8-9
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 10-12
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] Section 5.1 có versions đúng

  **QA Scenarios**:
  ```
  Scenario: Verify SDD mobile section
    Tool: Bash (grep -A5 -B5 "5.1")
    Steps:
      1. grep -n "React Native" docs/01-SDD-System-Design-Document.md | head -5
    Expected Result: Shows 0.81.0
    Evidence: .sisyphus/evidence/task-4-sdd.txt
  ```

  **Commit**: YES - groups with task 2

- [ ] 5. Update ADR-004-expo-react-native.md

  **What to do**:
  - Update "Decision" section với versions đúng
  - Update "Consequences" nếu có version-specific notes
  - Thêm note về Expo SDK 54 locking RN 0.81

  **Must NOT do**:
  - Không thay đổi decision rationale (why Expo)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES - With tasks 5-7, 9
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 10-12
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] ADR reflect đúng versions

  **Commit**: YES - groups with task 2

(SKIPPED - apps/mobile/package.json không tồn tại)

- [ ] 6. Grep Search for Remaining References

  **What to do**:
  - Search toàn bộ codebase cho "0.84.0" hoặc "0.84"
  - Search cho "19.2.4"
  - Search cho "React Native 0.84"
  - Liệt kê tất cả files còn có old versions

  **Must NOT do**:
  - Không bỏ sót bất kỳ file nào

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES - With task 7
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 2-5

  **Acceptance Criteria**:
  - [ ] No results for "0.84" (except trong changelog hoặc git history)
  - [ ] No results for "19.2.4" trong code/docs

  **QA Scenarios**:
  ```
  Scenario: Comprehensive grep search
    Tool: Bash (grep -r)
    Steps:
      1. grep -r "0.84.0" docs/ apps/ --include="*.md" --include="*.json" --include="*.ts" --include="*.tsx"
      2. grep -r "19.2.4" docs/ apps/ --include="*.md" --include="*.json" --include="*.ts" --include="*.tsx"
    Expected Result: No matches hoặc chỉ trong CHANGELOG/commented code
    Evidence: .sisyphus/evidence/task-6-grep-full.txt
  ```

  **Commit**: NO

- [ ] 7. Grep Search for Remaining References

  **What to do**:
  - Search toàn bộ codebase cho "0.84.0" hoặc "0.84"
  - Search cho "19.2.4"
  - Search cho "React Native 0.84"
  - Liệt kê tất cả files còn có old versions

  **Must NOT do**:
  - Không bỏ sót bất kỳ file nào

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES - With task 8
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 9
  - **Blocked By**: Tasks 2-6

  **Acceptance Criteria**:
  - [ ] No results for "0.84" (except trong changelog hoặc git history)
  - [ ] No results for "19.2.4" trong code/docs

  **QA Scenarios**:
  ```
  Scenario: Comprehensive grep search
    Tool: Bash (grep -r)
    Steps:
      1. grep -r "0.84.0" docs/ apps/ --include="*.md" --include="*.json" --include="*.ts" --include="*.tsx"
      2. grep -r "19.2.4" docs/ apps/ --include="*.md" --include="*.json" --include="*.ts" --include="*.tsx"
    Expected Result: No matches hoặc chỉ trong CHANGELOG/commented code
    Evidence: .sisyphus/evidence/task-7-grep-full.txt
  ```

  **Commit**: NO

(SKIPPED - apps/mobile/package.json không tồn tại)

- [ ] 7. Final Verification and Summary

  **What to do**:
  - Read tất cả updated files để verify changes
  - Tạo summary report
  - List các files đã thay đổi

  **Must NOT do**:
  - Không bỏ sót verification

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (final)
  - **Blocks**: None
  - **Blocked By**: Task 6

  **Acceptance Criteria**:
  - [ ] All 4 docs files verified
  - [ ] Summary report created
  - [ ] No remaining version mismatches

  **QA Scenarios**:
  ```
  Scenario: Final comprehensive check
    Tool: Bash (find + grep)
    Steps:
      1. List all modified files
      2. Verify each has correct versions
      3. Check git status
    Expected Result: All changes complete, working tree clean
    Evidence: .sisyphus/evidence/task-7-final.txt
  ```

  **Commit**: NO (already committed in tasks 2-5)

---

## Final Verification Wave (MANDATORY)

- [ ] F1. **Plan Compliance Audit** — `quick`
  Read từng file đã update và verify:
  - 00-Unified-Tech-Stack-Spec.md: RN 0.81, React 19.1.0
  - 04-Mobile-App-Technical-Spec.md: RN 0.81, React 19.1.0, expo-location ~18.0.0
  - 01-SDD-System-Design-Document.md: Section 5.1 correct
  - ADR-004-expo-react-native.md: Versions correct
  
  Output: `[4/4 files verified] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Consistency Check** — `quick`
  Cross-reference tất cả mobile version mentions trong docs:
  - Tìm tất cả "0.84" - must be zero
  - Tìm tất cả "19.2.4" - must be zero
  - Tìm tất cả "0.81" - must match số lần xuất hiện
  - Tìm tất cả "19.1.0" - must match số lần xuất hiện
  
  Output: `Consistency [PASS/FAIL] | Issues: [list]`

---

## Commit Strategy

**Single Commit**: `docs: fix Expo SDK 54 versions - RN 0.84→0.81, React 19.2→19.1`
- Files: `docs/00-Unified-Tech-Stack-Spec.md`, `docs/04-Mobile-App-Technical-Spec.md`, `docs/01-SDD-System-Design-Document.md`, `docs/adr/ADR-004-expo-react-native.md`
- Note: `apps/mobile/package.json` will be created with correct versions when mobile app is initialized

---

## Success Criteria

### Verification Commands
```bash
# Check no old versions remain
grep -r "0.84.0" docs/ --include="*.md" && echo "FAIL" || echo "PASS"
grep -r "19.2.4" docs/ --include="*.md" && echo "FAIL" || echo "PASS"

# Check new versions present
grep -r "0.81.0" docs/ --include="*.md" | wc -l  # Should be >0
grep -r "19.1.0" docs/ --include="*.md" | wc -l  # Should be >0
```

### Final Checklist
- [ ] All "0.84" references removed from docs
- [ ] All "19.2.4" references removed from docs
- [ ] "0.81.0" present in all mobile docs
- [ ] "19.1.0" present in all mobile docs
- [ ] No remaining inconsistencies
- [ ] (Future) When creating mobile app, use RN 0.81 + React 19.1

---

## Notes

### Expo SDK Version Policy Reference
Từ research, Expo tuân theo policy:
- Expo SDK releases 3 lần/năm
- Mỗi SDK target MỘT React Native version cụ thể
- SDK 54 → RN 0.81 (đã release, stable)
- SDK 55 → RN 0.83 (upcoming)
- SDK 56 → RN 0.84 (future, chưa có timeline)

Vì vậy, không thể dùng RN 0.84 với Expo SDK 54.

### Zod v4 Compatibility
✅ nestjs-zod v5.1.1 hỗ trợ Zod v4.x (peerDependency: `"^3.25.0 || ^4.0.0"`)
✅ Không cần sửa gì về Zod

### Next Steps After This Plan
1. Execute this plan to fix documentation
2. Create separate plan/bead for "Initialize Mobile App" task
3. When initializing mobile app, use correct versions: RN 0.81 + React 19.1
