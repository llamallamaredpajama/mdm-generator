# Fix Plan: PR #9 Order Card Update

**Date:** 2026-02-28
**Branch:** worktree-order-card-update

---

## Fix 1: Capture errors in bare catch blocks (C2)
**File:** `frontend/src/components/build-mode/shared/CreateOrdersetPopup.tsx`
**Lines:** 78-79, 99-100
**Problem:** Bare `catch {}` blocks discard error objects. No logging, no differentiated feedback.
**Fix:**
- Line 78: Change `} catch {` to `} catch (err) {` and add `console.error('CreateOrdersetPopup: save failed', err)` before `setError`
- Line 99: Change `} catch {` to `} catch (err) {` and add `console.error('CreateOrdersetPopup: update failed', err)` before `setError`
**Verify:** `cd frontend && pnpm check`

## Fix 2: Show error on missing target orderset (I6 + C1 partial)
**File:** `frontend/src/components/build-mode/shared/CreateOrdersetPopup.tsx`
**Line:** 91
**Problem:** Silent return when `existingOrderSets.find()` returns undefined. No user feedback.
**Fix:** Change `if (!target) return` to `if (!target) { setError('Selected orderset no longer exists'); return }`
**Verify:** `cd frontend && pnpm check`

## Fix 3: Remove unused props from OrdersLeftPanel (I1)
**File:** `frontend/src/components/build-mode/shared/OrdersLeftPanel.tsx`
**Lines:** 28, 41 (interface), 1-2 (imports)
**Problem:** `tests` and `cdrTracking` declared in props but never destructured or used.
**Fix:**
- Remove `tests: TestDefinition[]` from `OrdersLeftPanelProps` (line 28)
- Remove `cdrTracking: CdrTracking` from `OrdersLeftPanelProps` (line 41)
- Remove `CdrTracking` from the import on line 2 (keep `WorkupRecommendationSource`)
- Remove `TestDefinition` from import on line 1 if no longer used (check: it's used in `enrichedTests` type — keep it)

**File:** `frontend/src/components/build-mode/shared/OrdersCard.tsx`
**Lines:** 267, 276
**Problem:** Passing unused props to `OrdersLeftPanel`.
**Fix:**
- Remove `tests={tests}` prop (line 267)
- Remove `cdrTracking={cdrTracking}` prop (line 276)
**Verify:** `cd frontend && pnpm check`

## Fix 4: Wrap `isOrdersetFullySelected` in useCallback (I2)
**File:** `frontend/src/components/build-mode/shared/OrdersCard.tsx`
**Lines:** 246-247
**Problem:** Plain arrow function creates new reference every render. Inconsistent with all other handlers.
**Fix:** Replace:
```typescript
const isOrdersetFullySelected = (os: OrderSet) =>
  os.tests.length > 0 && os.tests.every((tid) => selectedTests.includes(tid))
```
With:
```typescript
const isOrdersetFullySelected = useCallback(
  (os: OrderSet) => os.tests.length > 0 && os.tests.every((tid) => selectedTests.includes(tid)),
  [selectedTests],
)
```
Move above the `if (loading)` early return (after other handlers, around line 225).
**Verify:** `cd frontend && pnpm check`

## Fix 5: Remove inline wrapper for onUpdateOrderSet (I3)
**File:** `frontend/src/components/build-mode/shared/DashboardOutput.tsx`
**Lines:** 324-326
**Problem:** Unnecessary `async (id, data) => { await updateOrderSet(id, data) }` creates new ref every render. `updateOrderSet` already has compatible signature.
**Fix:** Replace:
```typescript
onUpdateOrderSet={async (id, data) => {
  await updateOrderSet(id, data)
}}
```
With:
```typescript
onUpdateOrderSet={updateOrderSet}
```
**Verify:** `cd frontend && pnpm check`

## Fix 6: Extract CATEGORY_ORDER to shared location (I4)
**File:** `frontend/src/components/build-mode/shared/subcategoryUtils.ts`
**Problem:** `CATEGORY_ORDER` duplicated in `OrdersCard.tsx:17` and `OrdersLeftPanel.tsx:10`.
**Fix:**
- Export `CATEGORY_ORDER` and `CATEGORY_LABELS` from `subcategoryUtils.ts`
- Import in `OrdersCard.tsx` and `OrdersLeftPanel.tsx`
- Remove duplicate declarations
**Verify:** `cd frontend && pnpm check`

## Fix 7: Conditionally render Create Orderset button (I5)
**File:** `frontend/src/components/build-mode/shared/OrdersCard.tsx`
**Lines:** 282, 301
**Problem:** Button always visible, but popup requires both `onSaveOrderSet` and `onUpdateOrderSet`. Dead button when callbacks missing.
**Fix:** Pass `onCreateOrderset` as `undefined` when callbacks are absent:
```typescript
onCreateOrderset={onSaveOrderSet && onUpdateOrderSet ? handleCreateOrderset : undefined}
```
**File:** `frontend/src/components/build-mode/shared/OrdersLeftPanel.tsx`
**Line:** 251
**Fix:** Conditionally render button:
```typescript
{onCreateOrderset && (
  <button type="button" className="orders-card__create-orderset-btn" onClick={onCreateOrderset}>
    Create Orderset
  </button>
)}
```
Update prop type to `onCreateOrderset?: () => void` (optional).
**Verify:** `cd frontend && pnpm check`

---

## Execution Order
1. Fix 6 first (shared constants — touches 3 files, enables cleaner diffs for others)
2. Fixes 1-2 (CreateOrdersetPopup — localized changes)
3. Fix 3 (OrdersLeftPanel unused props — interface + callsite)
4. Fix 4 (useCallback — move + wrap in OrdersCard)
5. Fix 5 (DashboardOutput — one-line change)
6. Fix 7 (conditional button — touches OrdersCard + OrdersLeftPanel)
7. Run `cd frontend && pnpm check` as final gate
