# PR #9 Review: Orders Card UX Redesign

**Date:** 2026-02-28
**Branch:** worktree-order-card-update
**Scope:** 14 files, +1782/-345 lines — refactors monolithic OrdersCard into two-panel layout with subcategory grouping

---

## Critical Issues

### C1. Dead catch block — `onUpdateOrderSet` errors are silently swallowed upstream
**Severity:** CRITICAL | **Files:** `CreateOrdersetPopup.tsx:97-100`, `DashboardOutput.tsx:324-326`

The `updateOrderSet` from `useOrderSets` hook catches and swallows all errors (`catch { // Silently fail }`). The `DashboardOutput` passes this as `onUpdateOrderSet`. When `CreateOrdersetPopup` calls `onUpdate(target.id, { tests })`, its catch block is **dead code** — the upstream already swallowed the error. The popup always closes "successfully" even on API failure. **Data loss: physician adds tests to an orderset, popup closes, tests were never saved.**

However, `useOrderSets.ts` is NOT changed in this PR. The pre-existing silent catch is upstream. The actionable fix within this PR's scope:

1. Remove the unnecessary async wrapper in `DashboardOutput.tsx` (pass `updateOrderSet` directly)
2. Add a TODO comment documenting the dead catch block

### C2. Bare `catch` blocks discard all error context
**Severity:** CRITICAL | **File:** `CreateOrdersetPopup.tsx:78-79, 99-100`

Both `handleSaveNew` and `handleAddToExisting` use bare `catch {}` blocks that discard the error object entirely. No logging, no differentiated user feedback. All failures produce identical "Failed to save/update orderset" messages.

```typescript
} catch {
  setError('Failed to save orderset')
}
```

**Fix:** Capture the error and log it: `} catch (err) { console.error('Failed to save orderset', err); setError('Failed to save orderset') }`

---

## Important Issues

### I1. Unused props in OrdersLeftPanel — `tests` and `cdrTracking`
**Severity:** IMPORTANT | **File:** `OrdersLeftPanel.tsx:28,41`

`OrdersLeftPanelProps` declares `tests` and `cdrTracking`, and `OrdersCard.tsx` passes both (lines 267, 276), but neither is destructured or used. Dead code that misleads future developers.

**Fix:** Remove from interface, remove from `<OrdersLeftPanel>` call in `OrdersCard.tsx`.

### I2. `isOrdersetFullySelected` not wrapped in `useCallback`
**Severity:** IMPORTANT | **File:** `OrdersCard.tsx:246-247`

Plain arrow function in render body (not `useCallback`), passed as prop to `OrdersRightPanel`. Creates new function reference every render. Every other handler in the component uses `useCallback`. Inconsistent and defeats memo optimizations.

**Fix:** Wrap in `useCallback` with `[selectedTests]` dependency.

### I3. `onUpdateOrderSet` inline wrapper creates new reference on every render
**Severity:** IMPORTANT | **File:** `DashboardOutput.tsx:324-326`

Inline `async (id, data) => { await updateOrderSet(id, data) }` creates a new function every render. `updateOrderSet` from hook is already `useCallback`-wrapped and has a compatible signature.

**Fix:** Pass directly: `onUpdateOrderSet={updateOrderSet}` (same pattern as `onSaveOrderSet={saveOrderSet}` on line 323).

### I4. `CATEGORY_ORDER` constant duplicated
**Severity:** IMPORTANT | **Files:** `OrdersCard.tsx:17`, `OrdersLeftPanel.tsx:10`

Same `['labs', 'imaging', 'procedures_poc']` array defined in both files. Risk of divergence.

**Fix:** Export from `subcategoryUtils.ts` and import in both files.

### I5. Create Orderset button visible when feature is disabled
**Severity:** IMPORTANT | **File:** `OrdersCard.tsx:251, 301-310`

Button always renders in left panel, but the popup requires `onSaveOrderSet && onUpdateOrderSet` (optional props). If either is missing, clicking the button does nothing — no error, no disabled state.

**Fix:** Only render button when both callbacks exist. Pass `onCreateOrderset` as `undefined` when callbacks are absent.

### I6. Silent return on missing target orderset in "Add to Existing"
**Severity:** IMPORTANT | **File:** `CreateOrdersetPopup.tsx:90-91`

If the selected orderset was deleted between selection and save, `existingOrderSets.find()` returns undefined and the function silently returns. No error shown.

**Fix:** Add `setError('Selected orderset no longer exists.')` before returning.

---

## Minor Issues (not fixing in this PR)

- **M1.** Silent test ID drop in `OrdersRightPanel.tsx:149-150` — orderset references non-existent test IDs, tests silently hidden. Pre-existing data integrity concern.
- **M2.** `handleCreateOrderset` silently refuses when no tests selected (`OrdersCard.tsx:212-215`). UX issue, not a bug.
- **M3.** `formatSubcategory` fallback for unknown subcategories in `subcategoryUtils.ts:33-37`. Acceptable design.
- **M4.** Orderset count mismatch when tests are missing from library (`OrdersRightPanel.tsx:141` + `OrdersCard.tsx:246-247`). Related to M1, pre-existing data issue.
- **M5.** Test coverage gaps — `CreateOrdersetPopup` has 0 unit tests, several toggle branches untested. Important but not blocking merge.

---

## Positive Observations

- Clean decomposition of 525-line monolith into well-scoped sub-components
- CSS Grid layout is well-structured and responsive
- BEM naming conventions consistently followed
- Tests updated appropriately (21/21 pass)
- No PHI detected, no security concerns, no medical logic changes
- TypeScript compilation clean
- Optional props degrade gracefully for existing consumers
