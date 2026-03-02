# MDM Text Change Skill — Improvement Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refine the `mdm-text-change` skill based on post-creation verification findings.

**Architecture:** Targeted edits to 3 existing skill files — no new files needed. All changes are to markdown content (no code changes, no tests required).

**Tech Stack:** Markdown skill files in `.claude/skills/mdm-text-change/`

---

## Verification Summary

The skill was created by an agent team and committed as `7ab1934`. Post-commit verification confirmed:

- **32/32 referenced source file paths exist** in the codebase
- **Cross-references** between SKILL.md and reference files are all valid
- **YAML frontmatter** is valid and skill auto-discovers in Claude Code
- **Quality gates** all pass (0 errors, 27 test suites green)

## Issues Found (Ranked by Priority)

### P1: Line Number Drift in Reference File

**File:** `.claude/skills/mdm-text-change/references/pipeline-inventory.md`

**Problem:** Two line number references have drifted from the actual codebase:

| Reference in Skill | Claims | Actual |
|---------------------|--------|--------|
| `promptBuilderBuildMode.ts:477-489` | Conditional numbering (attestation + surveillance) | Line 477 is now `CRITICAL REQUIREMENTS` header; the attestation/surveillance numbering is elsewhere |
| `useEncounter.ts:90-130` | Defensive defaults pattern | Line 90 is `onSnapshot` call start; the actual `section2`/`section3` defaults with `?? defaultValue` are deeper in the callback |

**Fix:** Replace exact line numbers with `grep` search instructions or use `~line NNN` approximate notation consistently. The skill already uses `~line 621` and `~line 1250` notation for `index.ts` — apply the same pattern to these two references.

### P2: Missing "When NOT to Use" Guidance in SKILL.md

**File:** `.claude/skills/mdm-text-change/SKILL.md`

**Problem:** The description triggers are broad ("change text", "update a label", "rename a field"). When working in this project, Claude might invoke this skill for text changes unrelated to the MDM pipeline (e.g., changing a surveillance UI label, editing a settings page string, or updating a CSS comment). The skill lacks a brief note about what's out of scope.

**Fix:** Add a 3-4 line callout after the opening paragraph in SKILL.md:

```markdown
> **Scope:** This skill covers changes to the MDM output pipeline (differential, data reviewed, reasoning, risk, disposition, attestation, complexity). It does NOT cover: surveillance/trend analysis UI, settings/preferences UI, authentication flows, or payment/subscription text. For those, use standard find-and-replace without this workflow.
```

### P3: Thin Case Study Reference

**File:** `.claude/skills/mdm-text-change/references/case-study-attestation.md`

**Problem:** The condensed case study (621 words) loses some of the most useful concrete details from the original source (commit hashes, per-task file counts, exact `+/-` line stats, and the explicit commit log table). These details make the case study actionable as a template — without them, it reads more like a summary.

**Fix:** Add back the commit log table and per-task file modification tables from the original source document (`docs/tmp/full-stack-text-change-report.md`, Appendix A, sections A.3-A.5). Target ~900-1,000 words total (current: 621).

Specific additions:
- The 6-row commit log table (hash, message, files, +/-)
- Per-task file modification tables (which files changed in each task)
- The verification grep command from Task 5

### P4: Minor — Pattern Code Examples Could Reference Constants Import

**File:** `.claude/skills/mdm-text-change/references/pipeline-inventory.md`

**Problem:** Pattern 1 code example shows `PHYSICIAN_ATTESTATION` constant in the `.transform()` fallback but doesn't show the import statement. A developer following the pattern might miss that they need to import from `constants.ts`.

**Fix:** Add import line above the Pattern 1 code example:

```typescript
import { PHYSICIAN_ATTESTATION } from './constants'
```

---

## Tasks

### Task 1: Fix Line Number Drift (P1)

**Files:**
- Modify: `.claude/skills/mdm-text-change/references/pipeline-inventory.md`

**Step 1:** Find the current actual line numbers:

```bash
grep -n "CRITICAL REQUIREMENTS\|attestation.*end of the MDM\|surveillance" backend/src/promptBuilderBuildMode.ts | head -10
grep -n "section2:\|selectedTests\|testResults\|allUnremarkable" frontend/src/hooks/useEncounter.ts | head -10
```

**Step 2:** Update Pattern 5 reference (line ~206-209 of pipeline-inventory.md):

Change:
```
**Where:** `backend/src/promptBuilderBuildMode.ts:477-489`
```
To:
```
**Where:** `backend/src/promptBuilderBuildMode.ts` (search for numbered attestation/surveillance instructions in the finalize prompt)
```

**Step 3:** Update Pattern 3 reference (line ~159-162 of pipeline-inventory.md):

Change:
```
**Where:** `frontend/src/hooks/useEncounter.ts:90-130`
```
To:
```
**Where:** `frontend/src/hooks/useEncounter.ts` (search for `section2:` and `section3:` defensive defaults inside the `onSnapshot` callback)
```

**Step 4:** Also update the corresponding summary in SKILL.md line ~127-128 if it mentions these line numbers.

**Step 5:** Commit:
```bash
git add .claude/skills/mdm-text-change/
git commit -m "fix: update drifted line number references in mdm-text-change skill"
```

### Task 2: Add Scope Exclusion Note (P2)

**Files:**
- Modify: `.claude/skills/mdm-text-change/SKILL.md`

**Step 1:** After the opening paragraph (line 16), add:

```markdown
> **Scope:** This skill covers changes to the MDM output pipeline (differential, data reviewed, reasoning, risk, disposition, attestation, complexity). It does NOT cover: surveillance/trend analysis UI, settings/preferences UI, authentication flows, or payment/subscription text. For those, use standard find-and-replace without this workflow.
```

**Step 2:** Commit:
```bash
git add .claude/skills/mdm-text-change/SKILL.md
git commit -m "docs: add scope exclusion note to mdm-text-change skill"
```

### Task 3: Enrich Case Study (P3)

**Files:**
- Modify: `.claude/skills/mdm-text-change/references/case-study-attestation.md`
- Reference: `docs/tmp/full-stack-text-change-report.md` (sections A.3-A.5)

**Step 1:** Read the original case study sections:
```bash
sed -n '786,975p' docs/tmp/full-stack-text-change-report.md
```

**Step 2:** Add the commit log table after the "Task Breakdown" section:

```markdown
## Commit Log

| # | Hash | Message | Files | +/- |
|---|------|---------|-------|-----|
| 1 | `f97bc62` | `feat: add shared PHYSICIAN_ATTESTATION constant` | 1 | +2/+0 |
| 2 | `3cb4379` | `feat: replace disclaimer with physician attestation in backend` | 6 | +32/-18 |
| 3 | `78872ac` | `feat: replace disclaimer with attestation in frontend UI` | 6 | +169/-100 |
| 4 | `5c61856` | `test: update tests for attestation field rename` | 4 | +45/-26 |
| 5 | `f903d86` | `docs: update documentation for attestation language` | 5 | +19/-18 |
| M | `454bbb5` | `feat: replace disclaimer with physician attestation` | 22 | +267/-162 |
```

**Step 3:** Add per-task file lists from the original (Tasks 2-4 detail tables).

**Step 4:** Commit:
```bash
git add .claude/skills/mdm-text-change/references/case-study-attestation.md
git commit -m "docs: enrich case study with commit log and file details"
```

### Task 4: Add Constants Import to Pattern 1 (P4)

**Files:**
- Modify: `.claude/skills/mdm-text-change/references/pipeline-inventory.md`

**Step 1:** Before the Pattern 1 code block (line ~111), add:

```typescript
import { PHYSICIAN_ATTESTATION } from './constants'
```

**Step 2:** Commit:
```bash
git add .claude/skills/mdm-text-change/references/pipeline-inventory.md
git commit -m "docs: add import statement to Pattern 1 code example"
```

---

## Execution Notes

- All 4 tasks are independent and can be executed in any order (or in parallel)
- No code changes, no tests to run — markdown-only edits
- Each task is a single commit for clean reviewability
- Total estimated effort: ~15 minutes
