# Orders Card UX Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the OrdersCard component into a two-panel layout (Orders left / Order Sets right) with subcategory grouping, select/deselect all, a "Create Orderset" flow, and frequently used order sets.

**Architecture:** Extract OrdersCard.tsx (525 lines) into a thin shell + two panel sub-components + one shared SubcategoryGroup component. The shell manages shared state (selection, openSections) and passes it down. CSS Grid handles the two-panel desktop layout; stacked flex on mobile. A new `frequentlyUsedOrderSetIds` field on the user profile tracks favorite ordersets (stored as a `__frequently_used_ordersets__` special document in the same `orderSets` collection).

**Tech Stack:** React 19, TypeScript, BEM CSS, Vitest + RTL

---

## Task 1: Subcategory Utility + SubcategoryGroup Component

**Files:**
- Create: `frontend/src/components/build-mode/shared/SubcategoryGroup.tsx`
- Create: `frontend/src/components/build-mode/shared/SubcategoryGroup.css`

**Purpose:** A small reusable component that renders a collapsible subcategory header with checkbox rows inside. Used by category dropdowns in the left panel.

**Step 1: Create SubcategoryGroup component**

```tsx
// SubcategoryGroup.tsx
import { useState } from 'react'
import type { TestDefinition } from '../../../types/libraries'
import './SubcategoryGroup.css'

const SUBCATEGORY_DISPLAY: Record<string, string> = {
  hematology: 'Hematology',
  chemistry: 'Chemistry',
  cardiac: 'Cardiac',
  genitourinary: 'Genitourinary',
  infectious: 'Infectious',
  inflammatory: 'Inflammatory',
  endocrine: 'Endocrine',
  hepatic: 'Hepatic',
  toxicology: 'Toxicology',
  neurologic: 'Neurologic',
  gastrointestinal: 'Gastrointestinal',
  rheumatologic: 'Rheumatologic',
  obstetric: 'Obstetric',
  pulmonary: 'Pulmonary',
  head_neck: 'Head & Neck',
  spine: 'Spine',
  chest: 'Chest',
  abdomen: 'Abdomen',
  soft_tissue: 'Soft Tissue',
  extremity: 'Extremity',
  vascular: 'Vascular',
  miscellaneous: 'Miscellaneous',
  abdominal: 'Abdominal',
  wound: 'Wound',
  point_of_care: 'Point of Care',
  orthopedic: 'Orthopedic',
  airway: 'Airway',
}

export function formatSubcategory(subcategory: string): string {
  return SUBCATEGORY_DISPLAY[subcategory] ?? subcategory.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function groupBySubcategory(tests: TestDefinition[]): Map<string, TestDefinition[]> {
  const map = new Map<string, TestDefinition[]>()
  for (const test of tests) {
    const key = test.subcategory
    const list = map.get(key)
    if (list) list.push(test)
    else map.set(key, [test])
  }
  return map
}

interface SubcategoryGroupProps {
  subcategory: string
  tests: TestDefinition[]
  selectedTests: string[]
  recommendedTestIds: string[]
  checkboxClass: string
  idPrefix: string
  onToggle: (testId: string) => void
}

export default function SubcategoryGroup({
  subcategory,
  tests,
  selectedTests,
  recommendedTestIds,
  checkboxClass,
  idPrefix,
  onToggle,
}: SubcategoryGroupProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="subcategory-group">
      <button
        type="button"
        className="subcategory-group__header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className={`subcategory-group__chevron${open ? ' subcategory-group__chevron--open' : ''}`} aria-hidden="true" />
        <span className="subcategory-group__name">{formatSubcategory(subcategory)}</span>
        <span className="subcategory-group__count">({tests.length})</span>
      </button>
      {open && (
        <div className="subcategory-group__list">
          {tests.map((test) => (
            <div key={test.id} className="orders-card__test-row">
              <input
                type="checkbox"
                id={`${idPrefix}-${test.id}`}
                className={checkboxClass}
                checked={selectedTests.includes(test.id)}
                onChange={() => onToggle(test.id)}
              />
              <label htmlFor={`${idPrefix}-${test.id}`} className="orders-card__test-label">
                <span className="orders-card__test-name">{test.name}</span>
                {recommendedTestIds.includes(test.id) && (
                  <span className="orders-card__ai-badge">AI</span>
                )}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Create SubcategoryGroup CSS**

```css
/* SubcategoryGroup.css */
.subcategory-group {
  margin-left: 0.25rem;
}

.subcategory-group__header {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted, #64748b);
  text-align: left;
}

.subcategory-group__header:hover {
  color: var(--color-primary, #3b82f6);
}

.subcategory-group__chevron {
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 3px solid currentColor;
  border-top: 3px solid transparent;
  border-bottom: 3px solid transparent;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.subcategory-group__chevron--open {
  transform: rotate(90deg);
}

.subcategory-group__name {
  flex: 1;
}

.subcategory-group__count {
  color: var(--color-text-muted, #94a3b8);
  font-weight: 400;
}

.subcategory-group__list {
  padding-left: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding-bottom: 0.25rem;
}
```

**Step 3: Verify typecheck**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to SubcategoryGroup

**Step 4: Commit**

```bash
git add frontend/src/components/build-mode/shared/SubcategoryGroup.tsx frontend/src/components/build-mode/shared/SubcategoryGroup.css
git commit -m "feat(orders): add SubcategoryGroup component for grouped category dropdowns"
```

---

## Task 2: Create OrdersLeftPanel Component

**Files:**
- Create: `frontend/src/components/build-mode/shared/OrdersLeftPanel.tsx`

**Purpose:** Left panel containing: Recommended Orders (with select/deselect all), Frequently Used Orders, Labs/Imaging/Bedside grouped by subcategory, and "Create Orderset" button.

**Key changes from current OrdersCard:**
1. DELETE unmatched recommendations section entirely
2. ADD "Select / Deselect" checkbox to recommended section
3. RENAME "Frequently Used" → "Frequently Used Orders"
4. Move "Add Items" button INSIDE dropdown body (not header) when list is empty, at bottom when populated
5. RENAME `procedures_poc` label to "Bedside Tests & Procedures"
6. Group category tests by subcategory using SubcategoryGroup
7. ADD "Create Orderset" button at bottom

**Step 1: Create OrdersLeftPanel.tsx**

The component receives these props from the parent:
```typescript
interface OrdersLeftPanelProps {
  tests: TestDefinition[]
  enrichedTests: Array<{ test: TestDefinition; source?: WorkupRecommendationSource; reason?: string }>
  recommendedTestIds: string[]
  selectedTests: string[]
  frequentlyUsedTests: TestDefinition[]
  frequentlyUsedOrderSet?: OrderSet
  testsByCategory: Map<TestCategory, TestDefinition[]>
  openSections: Set<string>
  checkboxClass: string
  cdrTracking: CdrTracking
  testCdrMap: Map<string, Array<{ name: string; color: string }>>
  onToggle: (testId: string) => void
  onToggleSection: (key: string) => void
  onOpenOrdersetManager: (mode: 'browse' | 'edit', targetOrderSetId?: string) => void
  onCreateOrderset: () => void
}
```

Implementation details:
- Recommended Orders section: add a checkbox at the top that when checked selects all recommended, when unchecked deselects all recommended. Label: "Select / Deselect". Default: all selected (checking is driven by `selectedTests` containing all `recommendedTestIds`)
- Frequently Used Orders: when empty, dropdown body shows only "Add Items" button (no placeholder text). When populated, checkbox rows + "Add Items" at bottom. No "Add Items" in header row.
- Category dropdowns: use `groupBySubcategory()` + `SubcategoryGroup` for each category
- "Create Orderset" button at the bottom, below all sections

**Step 2: Verify typecheck**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add frontend/src/components/build-mode/shared/OrdersLeftPanel.tsx
git commit -m "feat(orders): create OrdersLeftPanel with subcategory grouping and select all"
```

---

## Task 3: Create OrdersRightPanel Component

**Files:**
- Create: `frontend/src/components/build-mode/shared/OrdersRightPanel.tsx`
- Create: `frontend/src/components/build-mode/shared/OrdersRightPanel.css`

**Purpose:** Right panel containing: header with "Order Sets" + "Manage" button, Frequently Used Order Sets dropdown, and scrollable alphabetical orderset list with expandable items.

**Key details:**
- Header: "Order Sets" title + "Manage" button (replaces old "Edit" button in main header)
- Frequently Used Order Sets: same UX pattern as Frequently Used Orders but for ordersets. For now, use a new `__frequently_used_ordersets__` special orderset (similar pattern to `__frequently_used__`). Its `tests` field stores orderset IDs (string[]) — lightweight reuse of existing infrastructure.
- Orderset list: alphabetically sorted user ordersets. Each row is expandable:
  - Top-level checkbox toggles entire orderset
  - Orderset name + test count badge
  - Chevron to expand → shows individual tests with checkboxes (partial selection)
- Scrollable container: `max-height: 400px; overflow-y: auto` for the orderset list

**Props:**
```typescript
interface OrdersRightPanelProps {
  tests: TestDefinition[]
  userOrderSets: OrderSet[]
  selectedTests: string[]
  checkboxClass: string
  openSections: Set<string>
  onToggle: (testId: string) => void
  onToggleSection: (key: string) => void
  onOrdersetToggle: (orderSet: OrderSet) => void
  isOrdersetFullySelected: (os: OrderSet) => boolean
  onOpenOrdersetManager: (mode: 'browse' | 'edit', targetOrderSetId?: string) => void
}
```

**Step 1: Create OrdersRightPanel.tsx and CSS**

**Step 2: Verify typecheck**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add frontend/src/components/build-mode/shared/OrdersRightPanel.tsx frontend/src/components/build-mode/shared/OrdersRightPanel.css
git commit -m "feat(orders): create OrdersRightPanel with expandable ordersets and manage button"
```

---

## Task 4: Create Inline CreateOrderset Popup

**Files:**
- Create: `frontend/src/components/build-mode/shared/CreateOrdersetPopup.tsx`
- Create: `frontend/src/components/build-mode/shared/CreateOrdersetPopup.css`

**Purpose:** Lightweight popup triggered by "Create Orderset" button. Shows a text input for name + option to add to existing orderset. NOT reusing the heavy OrdersetManager modal.

**Behavior:**
- If no orders selected: show toast/inline message "Select order items first"
- If orders selected: show popup with:
  - Text input: "New orderset name"
  - Or: dropdown to select existing orderset to add items to
  - "Save" + "Cancel" buttons
  - On save: calls `onSaveOrderSet` or `onUpdateOrderSet`, then dismisses

**Props:**
```typescript
interface CreateOrdersetPopupProps {
  selectedTests: string[]
  existingOrderSets: OrderSet[]
  onSave: (name: string, testIds: string[]) => Promise<OrderSet | null>
  onUpdate: (id: string, data: { tests: string[] }) => Promise<void>
  onClose: () => void
}
```

**Step 1: Create component + CSS**

**Step 2: Verify typecheck**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add frontend/src/components/build-mode/shared/CreateOrdersetPopup.tsx frontend/src/components/build-mode/shared/CreateOrdersetPopup.css
git commit -m "feat(orders): add CreateOrdersetPopup for inline orderset creation"
```

---

## Task 5: Rewrite OrdersCard.tsx as Two-Panel Shell

**Files:**
- Modify: `frontend/src/components/build-mode/shared/OrdersCard.tsx`
- Modify: `frontend/src/components/build-mode/shared/OrdersCard.css`

**Purpose:** Refactor OrdersCard to be a thin shell that renders OrdersLeftPanel + OrdersRightPanel in a CSS Grid layout. All existing state/memos stay here; sub-components receive them as props.

**Key changes:**
1. Import OrdersLeftPanel, OrdersRightPanel, CreateOrdersetPopup
2. Add `useIsMobile()` for responsive layout
3. DELETE: `unmatchedRecommendations` memo, `hasRecommendations` check for unmatched, unmatched rendering block
4. UPDATE: `CATEGORY_LABELS.procedures_poc` → `'Bedside Tests & Procedures'`
5. ADD state: `showCreatePopup` for the create orderset popup
6. ADD handler: `handleSelectAllRecommended` — toggles all recommended test IDs
7. ADD handler: `handleCreateOrderset` — opens popup if items selected, else shows toast
8. ADD: `testsBySubcategory` memo for category→subcategory grouping (or pass `groupBySubcategory` to SubcategoryGroup)
9. PRESERVE: all existing props interface unchanged
10. UPDATE `hasRecommendations` to only check `enrichedTests.length > 0` (remove unmatched check)
11. Footer buttons span full width below both panels

**New layout structure:**
```tsx
<div className="orders-card">
  <div className="orders-card__panels">
    <OrdersLeftPanel ... />
    <OrdersRightPanel ... />
  </div>
  {showCreatePopup && <CreateOrdersetPopup ... />}
  <div className="orders-card__footer">
    {/* Accept buttons — unchanged */}
  </div>
</div>
```

**CSS changes:**
```css
.orders-card__panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Panel containers */
.orders-card__panel {
  min-width: 0; /* prevent grid blowout */
}

.orders-card__panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.orders-card__panel-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text, #1e293b);
  margin: 0;
}

/* Mobile: stack vertically */
@media (max-width: 767px) {
  .orders-card__panels {
    grid-template-columns: 1fr;
  }
}
```

- DELETE: old `.orders-card__header` styles for "Edit" button (moved to right panel)
- DELETE: `.orders-card__unmatched*` styles
- KEEP: all checkbox, badge, tag, footer styles

**Step 1: Update OrdersCard.tsx**

**Step 2: Update OrdersCard.css**

**Step 3: Verify typecheck**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

**Step 4: Commit**

```bash
git add frontend/src/components/build-mode/shared/OrdersCard.tsx frontend/src/components/build-mode/shared/OrdersCard.css
git commit -m "feat(orders): rewrite OrdersCard as two-panel layout shell

Splits into OrdersLeftPanel (orders + subcategory grouping) and
OrdersRightPanel (ordersets + expandable items). Removes unmatched
recommendations section. Renames Procedures/POC to Bedside Tests
& Procedures."
```

---

## Task 6: Wire CreateOrderset into DashboardOutput

**Files:**
- Modify: `frontend/src/components/build-mode/shared/DashboardOutput.tsx`

**Purpose:** Pass the orderset CRUD callbacks through to OrdersCard so the CreateOrdersetPopup can save/update ordersets. The existing `saveOrderSet` and `updateOrderSet` from `useOrderSets()` are already available in DashboardOutput — just need to pass them as new props.

**New props on OrdersCard (additive):**
```typescript
onSaveOrderSet?: (name: string, testIds: string[]) => Promise<OrderSet | null>
onUpdateOrderSet?: (id: string, data: { tests: string[] }) => Promise<void>
```

**Step 1: Add props to OrdersCard and pass through from DashboardOutput**

**Step 2: Verify typecheck**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add frontend/src/components/build-mode/shared/DashboardOutput.tsx frontend/src/components/build-mode/shared/OrdersCard.tsx
git commit -m "feat(orders): wire orderset CRUD through DashboardOutput to CreateOrdersetPopup"
```

---

## Task 7: Update Tests

**Files:**
- Modify: `frontend/src/__tests__/OrdersCard.test.tsx`

**Purpose:** Update existing tests to match the new two-panel structure and add tests for new features.

**Changes:**
1. Update "renders orderset section" test — ordersets are now in right panel, no longer behind "Ordersets" dropdown toggle
2. Update "calls onOpenOrdersetManager" test — button text is now "Manage" not "Edit"
3. Update "renders frequently used section" test — text is now "Frequently Used Orders"
4. Add test: "groups category tests by subcategory"
5. Add test: "select/deselect all recommended checkbox"
6. Add test: "renders two-panel layout" (checks for `.orders-card__panels`)
7. Remove any test that references unmatched recommendations (if any)
8. Update category count text tests: "Labs (2)" still works, "Procedures / POC" → "Bedside Tests & Procedures"

**Step 1: Update test file**

**Step 2: Run tests**

Run: `cd frontend && pnpm vitest run src/__tests__/OrdersCard.test.tsx`
Expected: All tests pass

**Step 3: Commit**

```bash
git add frontend/src/__tests__/OrdersCard.test.tsx
git commit -m "test(orders): update OrdersCard tests for two-panel layout and new features"
```

---

## Task 8: Full Quality Gate

**Purpose:** Run all checks to ensure nothing is broken.

**Step 1: Run full check suite**

Run: `cd frontend && pnpm check`
Expected: typecheck + lint + tests all pass

**Step 2: Run backend build (if any backend changes)**

Run: `cd backend && pnpm build`
Expected: Clean compile

**Step 3: Visual review**

Start dev server: `cd frontend && pnpm dev`
Check:
- Desktop viewport: two-panel side-by-side
- Mobile viewport (375px): stacked vertically
- Recommended orders with select/deselect all
- Category dropdowns with subcategory grouping
- Right panel with expandable ordersets
- Footer buttons span full width
- All existing functionality preserved (CDR icons, AI badges, orderset toggle, accepted flash)

**Step 4: Final commit (if any fixes needed)**

---

## Dependency Graph

```
Task 1 (SubcategoryGroup) ─┐
                            ├─→ Task 2 (LeftPanel) ─┐
                            │                        ├─→ Task 5 (OrdersCard shell) ─→ Task 6 (DashboardOutput wiring) ─→ Task 7 (Tests) ─→ Task 8 (QA)
Task 3 (RightPanel) ────────┤                        │
                            │                        │
Task 4 (CreatePopup) ───────┘────────────────────────┘
```

Tasks 1, 3, and 4 are independent and can be parallelized.
Task 2 depends on Task 1.
Task 5 depends on Tasks 2, 3, 4.
Tasks 6, 7, 8 are sequential after Task 5.

## CSS/Layout Strategy Summary

- **Two-panel split:** CSS Grid `grid-template-columns: 1fr 1fr` inside `.orders-card__panels`
- **Mobile breakpoint:** `@media (max-width: 767px)` → `grid-template-columns: 1fr` (stacked)
- **Panel internals:** Reuse existing BEM classes (`.orders-card__section`, `.orders-card__test-row`, etc.)
- **Right panel scroll:** `.orders-right-panel__list` gets `max-height: 400px; overflow-y: auto`
- **Footer:** Stays outside `.orders-card__panels`, spans full width below both panels
- **No new dependencies** — all CSS is vanilla with BEM conventions
