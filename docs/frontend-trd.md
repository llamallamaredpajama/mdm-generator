# Frontend Technical Reference Document

> **Status**: Current as of commit `5d661ee` (2026-03-14)
> **Architecture**: React 19 + Vite 7 + TypeScript 5.8 + Firebase 10
> **Runtime**: Vite dev server (localhost:5173) → Firebase Hosting (aimdm.app)
> **Companion**: [→ Backend TRD](./backend-trd.md) | [→ PRD](./prd.md)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Routing & Navigation](#2-routing--navigation)
3. [State Management Architecture](#3-state-management-architecture)
4. [Component Architecture](#4-component-architecture)
5. [API Integration Layer](#5-api-integration-layer)
6. [Firebase Integration](#6-firebase-integration)
7. [Type System & Backend Alignment](#7-type-system--backend-alignment)
8. [Design System & Styling](#8-design-system--styling)
9. [Testing Architecture](#9-testing-architecture)
10. [Backend Alignment](#10-backend-alignment)
11. [Frontend-Specific Considerations](#11-frontend-specific-considerations)

---

## 1. Architecture Overview

### 1.1 File Tree

```
frontend/src/
├── main.tsx                                  # Entry point: createBrowserRouter → provider stack → render
├── App.tsx                                   # Legacy app shell (superseded by main.tsx router)
├── App.css                                   # App-level layout styles
├── index.css                                 # Global reset, typography, scrollbar, focus styles
├── setupTests.ts                             # Vitest per-test setup (matchers, matchMedia mock)
├── vitestGlobalSetup.ts                      # Force-exit vitest after tests complete
├── vite-env.d.ts                             # Vite client type reference
│
├── components/
│   ├── AccordionSection.tsx                  # Reusable accordion wrapper (99 lines)
│   ├── AuthModal.tsx                         # Google sign-in modal (164 lines)
│   ├── BuildModeAccordion.tsx                # Tab-based accordion for Build Mode (547 lines)
│   ├── BuildModeToggle.tsx                   # Quick/Build mode toggle (64 lines)
│   ├── Checklist.tsx                         # PHI confirmation checkboxes (22 lines)
│   ├── DictationGuide.tsx                    # Physician narrative guidance (80 lines)
│   ├── ErrorBoundary.tsx                     # React error boundary (34 lines)
│   ├── GuideSlideOver.tsx                    # Slide-over panel for section guides (194 lines)
│   ├── ListInput.tsx                         # Multi-entry list input (145 lines)
│   ├── OnboardingGuard.tsx                   # Route protection guard (34 lines)
│   ├── PricingPlans.tsx                      # Subscription tier cards (298 lines)
│   ├── SubscriptionStatus.tsx                # Plan + usage display (123 lines)
│   ├── Toast.tsx                             # Toast notification renderer (104 lines)
│   ├── TrendAnalysisToggle.tsx               # Surveillance enable/disable + location (110 lines)
│   ├── TrendReportModal.tsx                  # PDF report download modal (88 lines)
│   ├── TrendResultsPanel.tsx                 # Trend findings with alert banners (218 lines)
│   ├── UserAccountDropdown.tsx               # User profile menu (156 lines)
│   │
│   ├── board/                                # Encounter management (kanban)
│   │   ├── EncounterBoard.tsx                # Main kanban dashboard (186 lines)
│   │   ├── StatusColumn.tsx                  # Animated column with cards (82 lines)
│   │   ├── BoardCard.tsx                     # Encounter card (56 lines)
│   │   ├── DetailPanel.tsx                   # Dual-mode detail view (412 lines)
│   │   ├── NarrativeToolbar.tsx              # Dictation + submit buttons (50 lines)
│   │   ├── ArchiveView.tsx                   # Archived encounters display (127 lines)
│   │   ├── RulesPanel.tsx                    # CDR tracking display (149 lines)
│   │   ├── GuidesPanel.tsx                   # Clinical decision guides (76 lines)
│   │   ├── SurveillancePanel.tsx             # Regional trend integration (218 lines)
│   │   ├── IntelPanel.tsx                    # Intelligence panel wrapper (44 lines)
│   │   └── SettingsModal.tsx                 # In-encounter settings (135 lines)
│   │
│   ├── build-mode/                           # Build Mode editors
│   │   ├── EncounterEditor.tsx               # PRIMARY 3-section editor (1406 lines)
│   │   ├── SectionPanel.tsx                  # Section wrapper with guide + char count (328 lines)
│   │   ├── ShiftTimer.tsx                    # ED shift countdown timer (213 lines)
│   │   ├── DifferentialPreview.tsx           # Inline differential display (217 lines)
│   │   ├── MdmPreviewPanel.tsx               # MDM reasoning preview (207 lines)
│   │   ├── FinalizeModal.tsx                 # S3 final review + disposition (171 lines)
│   │   ├── Section1Guide.tsx                 # History/physical exam guide (133 lines)
│   │   ├── Section2Guide.tsx                 # Workup/results guide (138 lines)
│   │   ├── Section3Guide.tsx                 # Treatment/disposition guide (145 lines)
│   │   ├── QuickEncounterEditor.tsx          # Quick mode single-field editor (368 lines)
│   │   ├── NewEncounterCard.tsx              # Create encounter form (126 lines)
│   │   │
│   │   └── shared/                           # Shared Build Mode components
│   │       ├── DashboardOutput.tsx           # 4-area dashboard (300 lines)
│   │       ├── DifferentialList.tsx           # Differential diagnosis table (165 lines)
│   │       ├── CdrCard.tsx                   # Interactive CDR selection + scoring (509 lines)
│   │       ├── CdrDetailView.tsx             # Full CDR detail accordion (405 lines)
│   │       ├── CdrComponentInput.tsx         # Yes/No/Select for CDR items (179 lines)
│   │       ├── CdrResultsOutput.tsx          # Scored CDR results summary (179 lines)
│   │       ├── OrdersCard.tsx                # Test/order management card (342 lines)
│   │       ├── OrdersLeftPanel.tsx           # Recommended/all tests + filter (366 lines)
│   │       ├── OrdersRightPanel.tsx          # Selected tests list (181 lines)
│   │       ├── OrdersetManager.tsx           # Order set CRUD modal (507 lines)
│   │       ├── OrderSetSuggestion.tsx        # Suggested order set callout (65 lines)
│   │       ├── CreateOrdersetPopup.tsx       # Save selection as order set (195 lines)
│   │       ├── RegionalTrendsCard.tsx        # Surveillance findings + PDF (288 lines)
│   │       ├── ResultEntry.tsx               # Test result row (219 lines)
│   │       ├── ResultDetailExpanded.tsx       # Result details accordion (211 lines)
│   │       ├── PasteLabModal.tsx             # Bulk paste lab results (270 lines)
│   │       ├── DispositionSelector.tsx       # Disposition + placement (286 lines)
│   │       ├── TreatmentInput.tsx            # Treatment narrative + procedures (225 lines)
│   │       ├── WorkingDiagnosisInput.tsx     # Working diagnosis input (144 lines)
│   │       ├── CardContent.tsx               # Generic card wrapper (275 lines)
│   │       ├── ProgressIndicator.tsx         # Section completion circle (57 lines)
│   │       ├── SubcategoryGroup.tsx          # Test category collapsible (67 lines)
│   │       ├── cdrColorPalette.ts            # CDR color constants (32 lines)
│   │       ├── getIdentifiedCdrs.ts          # CDR matching utility (69 lines)
│   │       ├── getRecommendedTestIds.ts      # Test recommendation extractor (98 lines)
│   │       └── subcategoryUtils.ts           # Test categorization helpers (115 lines)
│   │
│   ├── analytics/                            # Gap analytics dashboard
│   │   ├── SummaryCards.tsx                  # 4-card KPI display (65 lines)
│   │   ├── GapTrendChart.tsx                 # Line chart over time (143 lines)
│   │   ├── CategoryBreakdownChart.tsx        # Bar chart by category (117 lines)
│   │   ├── MethodBreakdownChart.tsx          # Pie chart by method (105 lines)
│   │   ├── TopGapsList.tsx                   # Top 10 gaps table (133 lines)
│   │   └── ProTipsSection.tsx                # AI improvement tips (151 lines)
│   │
│   ├── onboarding/                           # Onboarding flow
│   │   ├── StepProgress.tsx                  # Step indicator (21 lines)
│   │   ├── StepOrientation.tsx               # Welcome slide (36 lines)
│   │   ├── StepLimitations.tsx               # Disclaimers (63 lines)
│   │   ├── StepPlanSelection.tsx             # Tier picker (63 lines)
│   │   ├── StepCredentials.tsx               # User info capture (53 lines)
│   │   ├── StepSurveillanceLocation.tsx      # ZIP + surveillance opt-in (196 lines)
│   │   ├── QuickComposeDemo.tsx              # Quick mode walkthrough (37 lines)
│   │   └── BrushStroke.tsx                   # SVG brush animation (199 lines)
│   │
│   └── ui/
│       └── EnhancedTextarea.tsx              # Auto-expand textarea (157 lines)
│
├── contexts/
│   ├── ToastContext.tsx                       # Toast notification context (60 lines)
│   ├── PhotoLibraryContext.tsx                # Photo URL mapping context (15 lines)
│   └── TrendAnalysisContext.tsx               # Surveillance state context (101 lines)
│
├── hooks/
│   ├── useEncounter.ts                       # Build Mode encounter state + submission (421 lines)
│   ├── useEncounterList.ts                   # Encounter collection + CRUD (334 lines)
│   ├── useSubscription.ts                    # Subscription tier + quota (264 lines)
│   ├── useQuickEncounter.ts                  # Quick Mode state + submission (287 lines)
│   ├── useCdrLibrary.ts                      # CDR catalog fetch (48 lines)
│   ├── useCdrTracking.ts                     # CDR component answers + scoring
│   ├── useTestLibrary.ts                     # Test catalog fetch
│   ├── usePhotoLibrary.ts                    # Photo URL mapping from Firestore (47 lines)
│   ├── useMediaQuery.ts                      # Responsive breakpoints (96 lines)
│   ├── useGapAnalytics.ts                    # Gap analysis insights
│   ├── useTrendAnalysis.ts                   # Surveillance trend data fetch
│   ├── useOrderSets.ts                       # Order set CRUD
│   ├── useDispoFlows.ts                      # Disposition flow CRUD
│   ├── useReportTemplates.ts                 # Report template CRUD
│   ├── useSavedComments.ts                   # Saved comment snippets
│   ├── useShiftWindow.ts                     # Time window state
│   ├── useBrushAnimation.ts                  # Brush effect animation state
│   └── useCardExpansion.ts                   # Card expand/collapse state
│
├── lib/
│   ├── firebase.tsx                          # Firebase init + AuthProvider + signIn/signOut (164 lines)
│   ├── api.ts                                # API client — apiFetch, ApiError, all endpoints (947 lines)
│   ├── cdrScoringEngine.ts                   # CDR scoring: sum/threshold/algorithm methods
│   ├── statusMapper.ts                       # Encounter status → display column mapping
│   ├── photoMapper.ts                        # Photo resolution: Storage URL → local fallback
│   └── formatTrendReport.ts                  # Trend report formatting utilities
│
├── types/
│   ├── encounter.ts                          # Core encounter types + utility functions
│   ├── buildMode.ts                          # Build Mode form structures
│   ├── libraries.ts                          # Test + CDR catalog types
│   └── surveillance.ts                       # Surveillance location + result types
│
├── styles/
│   ├── tokens.css                            # Design tokens (colors, spacing, typography, z-index)
│   └── components.css                        # Shared component utility classes
│
└── __tests__/                                # 33 test files (see §9)
```

### 1.2 Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1 | UI framework (new JSX transform, no `import React` needed) |
| Vite | 7.1 | Build tool + dev server + HMR |
| TypeScript | ~5.8.3 | Type system (strict mode, bundler resolution) |
| React Router | 6.26 | Client-side routing (`createBrowserRouter`) |
| Firebase | 10.13 | Auth (Google), Firestore (real-time), Storage (photos) |
| Framer Motion | 12.35 | Animation (panels, columns, page transitions) |
| Chart.js | 4.5 + react-chartjs-2 5.3 | Analytics charts (gap trends, breakdowns) |
| Phosphor Icons | 2.1 | Icon library |
| Vitest | 2.0.5 | Test framework (jsdom environment) |
| ESLint | 9.32 | Linting (TS + React Hooks + React Refresh + Prettier) |
| Prettier | 3.3 | Code formatting (no semicolons, single quotes, trailing commas) |

### 1.3 Entry Point Chain

```
index.html
  └── <script type="module" src="/src/main.tsx">
        └── createRoot(#root).render(
              <StrictMode>
                <AuthProvider>
                  <ToastProvider>
                    <TrendAnalysisProvider>
                      <RouterProvider router={router} />
                    </TrendAnalysisProvider>
                  </ToastProvider>
                </AuthProvider>
              </StrictMode>
            )
```

**Key details:**
- `index.html` preconnects to Google Fonts: Bebas Neue, Playfair Display, Inter
- `main.tsx` (58 lines) is the active entry point — `App.tsx` (41 lines) is legacy, superseded
- `Onboarding` route is lazy-loaded with `React.lazy()` + `Suspense`
- StrictMode enables double-render checks in development

### 1.4 Build Pipeline

| Stage | Command | Tool | Output |
|-------|---------|------|--------|
| Dev server | `pnpm dev` | `vite` | HMR on `127.0.0.1:5173` |
| Type check | `pnpm typecheck` | `tsc -b --pretty` | Errors only (noEmit) |
| Lint | `pnpm lint` | `eslint .` | Violations report |
| Test | `pnpm test` | `node scripts/run-tests.mjs` → `vitest run` | Pass/fail |
| Build | `pnpm build` | `tsc -b && vite build` | `dist/` bundle |
| Quality gate | `pnpm check` | typecheck → lint → test | **Required before commits** |

### 1.5 Dev Proxy

```typescript
// vite.config.ts (17 lines)
server: {
  host: '127.0.0.1',  // explicit IPv4
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

Frontend `GET /api/v1/whoami` → proxied to `GET http://localhost:8080/v1/whoami`.

### 1.6 Key Statistics

| Metric | Count |
|--------|-------|
| Components | 76 |
| Routes | 7 |
| Custom hooks | 18 |
| Contexts | 4 (Auth, Toast, PhotoLibrary, TrendAnalysis) |
| Test files | 33 |
| Component LOC | ~14,755 |
| Route LOC | ~1,852 |
| API client LOC | 947 |
| Largest component | `EncounterEditor.tsx` (1,406 lines) |

---

## 2. Routing & Navigation

### 2.1 Route Table

| Path | Component | Guard | Layout | Purpose |
|------|-----------|-------|--------|---------|
| `/` | `LandingPage` | None (public) | None | Marketing page + sign-in modal |
| `/onboarding` | `Onboarding` (lazy) | None | None | Post-auth 6-step onboarding wizard |
| `/compose` | `EncounterBoard` | `OnboardingGuard` | `SidebarLayout` | Main encounter kanban (Build Mode) |
| `/preflight` | `Preflight` | `OnboardingGuard` | `SidebarLayout` | PHI verification checklist |
| `/output` | `Output` | `OnboardingGuard` | `SidebarLayout` | MDM display + copy |
| `/settings` | `Settings` | `OnboardingGuard` | `SidebarLayout` | Account + subscription + order sets |
| `/analytics` | `Analytics` | `OnboardingGuard` | `SidebarLayout` | Gap analytics dashboard |
| `/build` | `<Navigate to="/compose">` | `OnboardingGuard` | `SidebarLayout` | Legacy redirect |
| `*` | `<Navigate to="/">` | None | None | Catch-all → landing |

### 2.2 Router Configuration

```typescript
// main.tsx — createBrowserRouter (React Router v6.4+ data router)
const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: 'onboarding', element: <Suspense fallback={null}><Onboarding /></Suspense> },
  {
    element: <OnboardingGuard />,  // wraps all authenticated routes
    children: [{
      element: <SidebarLayout />,  // wraps all sidebar routes
      children: [
        { path: 'compose', element: <EncounterBoard /> },
        { path: 'preflight', element: <Preflight /> },
        { path: 'output', element: <Output /> },
        { path: 'settings', element: <Settings /> },
        { path: 'analytics', element: <Analytics /> },
        { path: 'build', element: <Navigate to="/compose" replace /> },
      ],
    }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
```

### 2.3 OnboardingGuard Decision Tree

```
OnboardingGuard.tsx (34 lines)
  │
  ├── authLoading || onboardingCompleted === null → return null (blank)
  ├── !user → <Navigate to="/" />
  ├── onboardingCompleted === false → <Navigate to="/onboarding" />
  └── else → <Outlet /> (render child routes)
```

### 2.4 SidebarLayout Structure

`SidebarLayout.tsx` (261 lines) renders differently based on viewport:

**Desktop (≥768px):**
```
┌─────────┬──────────────────────────┐
│ Sidebar  │                          │
│ (nav)    │      <Outlet />          │
│          │                          │
│ [items]  │                          │
│          │                          │
│ [user]   │                          │
└─────────┴──────────────────────────┘
```

**Mobile (<768px):**
```
┌──────────────────────────────┐
│                              │
│          <Outlet />          │
│                              │
├──────────────────────────────┤
│  🏠  📝  ⚙️  📊  (bottom bar)  │
└──────────────────────────────┘
```

**Navigation items:** Compose, Preflight, Output, Settings, Analytics
**State:** Sidebar collapse persists to localStorage
**Mobile bottom bar:** Fixed 72px height

### 2.5 Navigation Patterns

- **Programmatic:** `useNavigate()` for post-action redirects (e.g., after finalize → `/output`)
- **State passing:** Archive view passes encounter data via `navigate('/output', { state: { encounter } })`
- **Mode switching:** `EncounterBoard` switches between Build and Quick mode via local state, not routes

---

## 3. State Management Architecture

### 3.1 Provider Hierarchy

```
StrictMode
└── AuthProvider                    ← Firebase Auth session + onboarding status
    └── ToastProvider               ← Toast notification queue + auto-dismiss
        └── TrendAnalysisProvider   ← Surveillance preferences (localStorage)
            └── RouterProvider      ← React Router v6 data router
```

**Note:** `PhotoLibraryProvider` is defined in `contexts/PhotoLibraryContext.tsx` but is currently **not mounted in `main.tsx`**. The `usePhotoLibrary` hook is consumed directly in components that need photo URLs.

### 3.2 AuthProvider

**File:** `lib/firebase.tsx` (164 lines)

```typescript
interface AuthContextValue {
  user: User | null              // Firebase User or DEV_MOCK_USER
  authLoading: boolean           // true until first onAuthStateChanged fires
  onboardingCompleted: boolean | null  // null = loading, fetched via whoAmI()
  refreshOnboardingStatus: () => void  // re-fetches from backend
}
```

**Behavior:**
1. If `DEV_MOCK_USER` active → skip Firebase listener, set `onboardingCompleted: false`
2. On user sign-in → call `whoAmI()` API → extract `onboardingCompleted`
3. If `whoAmI()` fails → default to `true` (backward compat: assume complete)
4. `refreshOnboardingStatus()` available for post-onboarding re-check

**Exports:** `useAuth()`, `signInWithGoogle()`, `signOutUser()`, `useAuthToken()`

### 3.3 ToastContext

**File:** `contexts/ToastContext.tsx` (60 lines)

```typescript
interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

type ToastType = 'success' | 'error' | 'warning' | 'info'
```

**State:** `toasts: ToastData[]` with `id: "toast-${++counter}"`, auto-incrementing module-level counter.

### 3.4 TrendAnalysisContext

**File:** `contexts/TrendAnalysisContext.tsx` (101 lines)

```typescript
interface TrendAnalysisContextValue {
  isEnabled: boolean
  setEnabled: (enabled: boolean) => void
  location: SurveillanceLocation | null
  setLocation: (location: SurveillanceLocation | null) => void
  isLocationValid: boolean        // zip: 5 digits, or state: 2 uppercase letters
  lastAnalysis: TrendAnalysisResult | null
  setLastAnalysis: (result: TrendAnalysisResult | null) => void
}
```

**Persistence:** `localStorage` key `'mdm-trend-prefs'` stores `{ isEnabled, location }`. Try-catch around reads/writes for quota safety.

### 3.5 Hook Inventory

| Hook | File (lines) | Signature | Firestore Listener | Key Return Fields |
|------|-------------|-----------|-------------------|-------------------|
| `useEncounter` | `useEncounter.ts` (421) | `(encounterId: string \| null)` | `onSnapshot` on encounter doc | `encounter`, `loading`, `error`, `updateSectionContent`, `submitSection`, `isSubmitting`, `quotaRemaining` |
| `useEncounterList` | `useEncounterList.ts` (334) | `(mode?: EncounterMode)` | `onSnapshot` on collection | `encounters`, `loading`, `createEncounter`, `deleteEncounter`, `clearAllEncounters` |
| `useSubscription` | `useSubscription.ts` (264) | `()` | `onSnapshot` on subscriptions | `subscription`, `isActive`, `tier`, `canGenerate`, `remainingGenerations` |
| `useQuickEncounter` | `useQuickEncounter.ts` (287) | `(encounterId: string \| null)` | `onSnapshot` on encounter doc | `encounter`, `narrative`, `setNarrative`, `submitNarrative`, `mdmOutput` |
| `useCdrLibrary` | `useCdrLibrary.ts` (48) | `()` | None (one-shot fetch) | `cdrs`, `loading`, `error` |
| `usePhotoLibrary` | `usePhotoLibrary.ts` (47) | `()` | None (one-shot fetch) | `photoUrls: Map<string,string>`, `loading` |
| `useMediaQuery` | `useMediaQuery.ts` (96) | `(query: string)` | None (matchMedia listener) | `boolean` |
| `useAuthToken` | `firebase.tsx` (lines 76-87) | `()` | `onAuthStateChanged` | `string \| null` |

**Convenience hooks derived from `useMediaQuery`:**

| Hook | Query | Returns |
|------|-------|---------|
| `useIsMobile()` | `(max-width: 767px)` | `boolean` |
| `useIsTablet()` | `(min-width: 768px) and (max-width: 1023px)` | `boolean` |
| `useIsDesktop()` | `(min-width: 1024px)` | `boolean` |
| `usePrefersReducedMotion()` | `(prefers-reduced-motion: reduce)` | `boolean` |

**Subscription helper hooks:**

| Hook | Signature | Returns |
|------|-----------|---------|
| `useSubscriptionFeature` | `(feature: FeatureKey)` | `boolean` — is feature available for current tier |
| `useSubscriptionLimits` | `()` | `{ monthlyGenerations, priorityProcessing, exportFormats, apiAccess, teamMembers }` |

### 3.6 Core Hook Patterns

**Real-time listeners** — All Firestore-backed hooks use `onSnapshot` with cleanup:
```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    setData(snapshot.data())
  }, (error) => {
    setError(error)
  })
  return () => unsubscribe()
}, [dependencies])
```

**Optimistic local state** — `useEncounter` splits editing from persistence:
```typescript
const [localContent, setLocalContent] = useState({ 1: '', 2: '', 3: '' })
// updateSectionContent() → localContent updates immediately
// submitSection() → persists to Firestore + calls backend API
```

**Fetch-once guard** — `useCdrLibrary` and `usePhotoLibrary` prevent duplicate API calls:
```typescript
const fetchedRef = useRef(false)
if (fetchedRef.current) return
fetchedRef.current = true
```

**Cancellation flags** — Prevent state updates after unmount:
```typescript
let cancelled = false
// ... async work ...
if (!cancelled) setState(value)
return () => { cancelled = true }
```

**Debounced persistence** — `useQuickEncounter.setNarrative()` auto-saves after 500ms:
```typescript
if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
saveTimerRef.current = setTimeout(() => updateDoc(...), 500)
```

**Defensive defaults** — Bridge Firestore nulls to TypeScript:
```typescript
section2: {
  selectedTests: data.section2?.selectedTests ?? [],
  workingDiagnosis: data.section2?.workingDiagnosis ?? undefined,
  allUnremarkable: data.section2?.allUnremarkable ?? false,
}
```

### 3.7 useEncounter Deep Dive

The most complex hook (421 lines). Key behaviors:

**Section submission logic varies by section:**

| Section | API Call | Firestore Write | Quota Count |
|---------|----------|-----------------|-------------|
| S1 | `processSection1()` | Backend writes `llmResponse` | Yes (first encounter submission) |
| S2 | None | **Client writes** structured data (tests, results, diagnosis) | No |
| S3 | `finalizeEncounter()` | Backend writes `finalMdm` | No (counted at S1) |

**Section dependencies:**
- S1: always submittable (if content non-empty, not locked, count < 2)
- S2: requires S1 completed
- S3: requires S2 completed

**Trend analysis integration:** If surveillance enabled + valid location → passes location to `processSection1()`.

### 3.8 useSubscription Deep Dive

```typescript
export const GENERATION_LIMITS: Record<SubscriptionTier, number> = {
  free: 10,
  pro: 250,
  enterprise: 1000,
}
```

**Tier determination priority:** price ID → product ID → metadata.tier → default `'free'`

**Feature map:**
```typescript
const FEATURE_MAP = {
  priority_processing: ['pro', 'enterprise'],
  export_formats: ['pro', 'enterprise'],
  api_access: ['enterprise'],
  team_features: ['enterprise'],
  analytics: ['pro', 'enterprise'],
  custom_templates: ['pro', 'enterprise'],
  surveillance: ['pro', 'enterprise'],
}
```

On tier change, calls `whoAmI()` to get real quota from backend (falls back to static limits).

---

## 4. Component Architecture

### 4.1 Component Hierarchy

```
SidebarLayout (261 lines)
├── EncounterBoard (186 lines)
│   ├── NewEncounterCard (126 lines)
│   ├── StatusColumn × 3 (82 lines)
│   │   └── BoardCard × N (56 lines)
│   └── DetailPanel (412 lines)
│       ├── BuildDetailContent
│       │   ├── EncounterEditor (1406 lines)
│       │   │   ├── SectionPanel × 3 (328 lines)
│       │   │   ├── DashboardOutput (300 lines)
│       │   │   │   ├── DifferentialList (165 lines)
│       │   │   │   ├── CdrCard × N (509 lines)
│       │   │   │   │   └── CdrComponentInput × N (179 lines)
│       │   │   │   ├── OrdersCard (342 lines)
│       │   │   │   │   ├── OrdersLeftPanel (366 lines)
│       │   │   │   │   └── OrdersRightPanel (181 lines)
│       │   │   │   └── RegionalTrendsCard (288 lines)
│       │   │   ├── FinalizeModal (171 lines)
│       │   │   │   └── DispositionSelector (286 lines)
│       │   │   └── ShiftTimer (213 lines)
│       │   └── NarrativeToolbar (50 lines)
│       └── QuickDetailContent
│           └── QuickEncounterEditor (368 lines)
│
├── Output (119 lines)
├── Settings (465 lines)
├── Analytics (158 lines)
│   ├── SummaryCards (65 lines)
│   ├── GapTrendChart (143 lines)
│   ├── CategoryBreakdownChart (117 lines)
│   ├── MethodBreakdownChart (105 lines)
│   ├── TopGapsList (133 lines)
│   └── ProTipsSection (151 lines)
└── Preflight (153 lines)
```

### 4.2 Board Components

#### EncounterBoard (`board/EncounterBoard.tsx`, 186 lines)

Main kanban dashboard. Organizes encounters into 3 status columns.

**Column grouping:** `getDisplayColumn()` from `statusMapper.ts`:

| Encounter Status | Quick Mode → Column | Build Mode → Column |
|-----------------|--------------------|--------------------|
| `draft` | COMPOSING | COMPOSING |
| `processing` | BUILDING | — |
| `section1_done` | — | BUILDING |
| `section2_done` | — | BUILDING |
| `error` / `section3_error` | — | BUILDING |
| `completed` | COMPLETE | — |
| `finalized` | — | COMPLETE |

**Layout:** Grid with 3 `StatusColumn` components + `DetailPanel` overlay.

#### StatusColumn (`board/StatusColumn.tsx`, 82 lines)

Animated column with count badge. Uses `AnimatePresence` with `mode="popLayout"` for spring-based stagger animations when cards enter/exit.

#### BoardCard (`board/BoardCard.tsx`, 56 lines)

Encounter card showing: encounter photo, room number, chief complaint (truncated), status badge, timestamp. Click → opens `DetailPanel`.

#### DetailPanel (`board/DetailPanel.tsx`, 412 lines)

Framer Motion slide-in panel (600px desktop, 100% mobile). Branches at top level:
- **Build Mode** → `EncounterEditor` + `NarrativeToolbar`
- **Quick Mode** → `QuickEncounterEditor`

Includes intelligence sub-panels: `RulesPanel`, `GuidesPanel`, `SurveillancePanel`.

### 4.3 Build Mode Components

#### EncounterEditor (`build-mode/EncounterEditor.tsx`, 1,406 lines)

The largest and most complex component. Manages the full Build Mode 3-section workflow.

**Responsibilities:**
- Tab-based section navigation (S1/S2/S3)
- Section content editing via `SectionPanel` wrappers
- Differential output display after S1
- CDR interactive cards with scoring
- Test/order management with order set suggestions
- Working diagnosis input
- Treatment + disposition for S3
- Shift timer countdown
- Trend analysis toggle + regional trends card
- Finalize modal for S3 completion

**State coordination:** Reads from `useEncounter`, `useCdrLibrary`, `useTestLibrary`, `useOrderSets`, `useCdrTracking`, `useTrendAnalysis`. Heavy prop drilling to shared subcomponents.

#### SectionPanel (`build-mode/SectionPanel.tsx`, 328 lines)

Wraps each Build Mode section with:
- Section guide slide-over
- Character count indicator (max 2,000 per section)
- Submission count display (`1/2`, `2/2 LOCKED`)
- Submit button with loading state
- Section status badge

#### DashboardOutput (`build-mode/shared/DashboardOutput.tsx`, 300 lines)

4-area dashboard displayed after S1 completion:

```
┌────────────────┬────────────────┐
│  Differential   │  CDR Cards     │
│  List           │  (interactive) │
├────────────────┼────────────────┤
│  Orders Card   │  Regional      │
│  (tests)       │  Trends Card   │
└────────────────┴────────────────┘
```

**Auto-population:** Merges LLM `workupRecommendations` + client-side CDR matching → populates recommended tests. Suggests matching order sets.

#### CdrCard (`build-mode/shared/CdrCard.tsx`, 509 lines)

Interactive CDR selection and scoring:
- Accordion per CDR with Application/Data Points/Results sections
- Yes/No toggle + expandable select for each component
- Real-time scoring via `cdrScoringEngine.ts`
- Exclude toggle to dismiss irrelevant CDRs
- Color-coded by CDR category via `cdrColorPalette.ts`

### 4.4 Route Components

| Route Component | Lines | Key Features |
|----------------|-------|-------------|
| `LandingPage` | 427 | 5-slide cinematic intro, film grain canvas, preloader, keyboard nav, mobile hamburger |
| `Onboarding` | 269 | 6-step wizard: orientation → limitations → plan → credentials → surveillance → demo |
| `Settings` | 465 | Account info, subscription management, order set CRUD, disposition flow CRUD, system info |
| `Analytics` | 158 | Summary cards, gap trend chart, category/method breakdowns, top gaps list, AI tips |
| `Output` | 119 | MDM text display, copy-to-clipboard, JSON toggle mode |
| `Preflight` | 153 | PHI verification checklist, dictation guide, proceed/cancel actions |

### 4.5 Surveillance UI Components

| Component | Lines | Purpose |
|-----------|-------|---------|
| `TrendAnalysisToggle` | 110 | Enable/disable toggle + ZIP code/state input with validation |
| `TrendResultsPanel` | 218 | Alert banners (high/medium/low risk) + detailed findings |
| `TrendReportModal` | 88 | PDF report download confirmation |
| `RegionalTrendsCard` | 288 | Dashboard card showing surveillance findings + PDF download trigger |
| `SurveillancePanel` | 218 | Board-level surveillance context integration |

---

## 5. API Integration Layer

### 5.1 apiFetch() Architecture

**File:** `lib/api.ts` (947 lines)

```typescript
async function apiFetch<T>(
  url: string,
  options: RequestInit,
  context?: string,      // human-readable operation name for errors
  timeoutMs: number = 30_000,
): Promise<T>
```

**Pipeline:**
1. Create `AbortController` with timeout
2. Execute `fetch(url, { ...options, signal })`
3. On non-ok response → parse JSON → throw `ApiError.fromResponse()`
4. On timeout (DOMException AbortError) → throw "Request timed out"
5. On TypeError → throw `ApiError.networkError()`
6. Return parsed JSON response

### 5.2 ApiError Class

```typescript
class ApiError extends Error {
  statusCode: number           // HTTP status or 0 for network errors
  errorType: ErrorType         // classification
  isRetryable: boolean
  code?: string                // server error code
  details?: unknown[]          // additional detail array
  quotaInfo?: QuotaInfo        // remaining/plan/limit/used
  retryAfterMs?: number        // suggested retry delay
}
```

**Error classification from HTTP status:**

| Status | Type | Retryable | User Message |
|--------|------|-----------|-------------|
| 401 | `auth` | No | "Your session has expired. Please sign in again." |
| 403 | `auth` | No | "You don't have permission..." |
| 400 | `validation` | No | "Invalid request. Please check your input..." |
| 402 | `quota` | No | "You've reached your usage limit..." |
| 429 | `rate_limit` | **Yes** | "Too many requests..." |
| 500/502/503 | `server` | **Yes** | "Server temporarily unavailable..." |
| 504 | `server` | **Yes** | "Request timed out..." |
| Other 5xx | `server` | **Yes** | Generic server error |
| Network failure | `network` | **Yes** | Network error |

### 5.3 Endpoint Inventory

#### Core MDM Endpoints

| Function | Method | Path | Auth Pattern | Timeout | Caller |
|----------|--------|------|-------------|---------|--------|
| `whoAmI()` | POST | `/v1/whoami` | Bearer header | 30s | `AuthProvider`, `useSubscription` |
| `completeOnboarding()` | POST | `/v1/user/complete-onboarding` | Bearer header | 30s | `Onboarding` route |
| `generateMDM()` | POST | `/v1/generate` | Bearer header | 60s | Legacy (unused) |
| `parseNarrative()` | POST | `/v1/parse-narrative` | Bearer header | 60s | `EncounterEditor` |
| `processSection1()` | POST | `/v1/build-mode/process-section1` | **Body token** | 60s | `useEncounter` |
| `processSection2()` | POST | `/v1/build-mode/process-section2` | **Body token** | 60s | `useEncounter` |
| `finalizeEncounter()` | POST | `/v1/build-mode/finalize` | **Body token** | 120s | `useEncounter` |
| `generateQuickMode()` | POST | `/v1/quick-mode/generate` | **Body token** | 60s | `useQuickEncounter` |
| `suggestDiagnosis()` | POST | `/v1/build-mode/suggest-diagnosis` | **Body token** | 15s | `EncounterEditor` |
| `parseResults()` | POST | `/v1/build-mode/parse-results` | **Body token** | 20s | `PasteLabModal` |
| `matchCdrs()` | POST | `/v1/build-mode/match-cdrs` | **Body token** | 60s | `EncounterEditor` |

#### Library Endpoints

| Function | Method | Path | Auth Pattern | Timeout | Caller |
|----------|--------|------|-------------|---------|--------|
| `fetchTestLibrary()` | GET | `/v1/libraries/tests` | Bearer header | 30s | `useTestLibrary` |
| `fetchCdrLibrary()` | GET | `/v1/libraries/cdrs` | Bearer header | 30s | `useCdrLibrary` |

#### User Profile CRUD (all Bearer header auth, 30s timeout)

| Function | Method | Path |
|----------|--------|------|
| `getOrderSets()` | GET | `/v1/user/order-sets` |
| `createOrderSet()` | POST | `/v1/user/order-sets` |
| `updateOrderSet()` | PUT | `/v1/user/order-sets/{id}` |
| `deleteOrderSet()` | DELETE | `/v1/user/order-sets/{id}` |
| `useOrderSet()` | POST | `/v1/user/order-sets/{id}/use` |
| `getDispoFlows()` | GET | `/v1/user/dispo-flows` |
| `createDispoFlow()` | POST | `/v1/user/dispo-flows` |
| `updateDispoFlow()` | PUT | `/v1/user/dispo-flows/{id}` |
| `deleteDispoFlow()` | DELETE | `/v1/user/dispo-flows/{id}` |
| `useDispoFlow()` | POST | `/v1/user/dispo-flows/{id}/use` |
| `getReportTemplates()` | GET | `/v1/user/report-templates` |
| `createReportTemplate()` | POST | `/v1/user/report-templates` |
| `updateReportTemplate()` | PUT | `/v1/user/report-templates/{id}` |
| `deleteReportTemplate()` | DELETE | `/v1/user/report-templates/{id}` |
| `useReportTemplate()` | POST | `/v1/user/report-templates/{id}/use` |
| `getCustomizableOptions()` | GET | `/v1/user/options` |
| `updateCustomizableOptions()` | PUT | `/v1/user/options` |

#### Surveillance & Analytics

| Function | Method | Path | Auth | Timeout | Returns |
|----------|--------|------|------|---------|---------|
| `analyzeSurveillance()` | POST | `/v1/surveillance/analyze` | Bearer | 30s | `{ analysis, warnings? }` |
| `downloadSurveillanceReport()` | POST | `/v1/surveillance/report` | Bearer | 30s | `Blob` (PDF) |
| `fetchAnalyticsInsights()` | POST | `/v1/analytics/insights` | Bearer | 30s | `{ insights, retryAfterMs? }` |

### 5.4 Auth Token Patterns

**Two distinct patterns exist** — a key architectural quirk [→ Backend TRD §6.2]:

| Pattern | Mechanism | Used By |
|---------|-----------|---------|
| **Body token** | `{ userIdToken: token }` in request body | Build Mode endpoints, Quick Mode, suggest-diagnosis, parse-results, match-cdrs |
| **Bearer header** | `Authorization: Bearer ${token}` | whoAmI, onboarding, libraries, user CRUD, surveillance, analytics |

```typescript
// Body token pattern (Build Mode)
processSection1(encounterId, content, token) →
  body: { encounterId, content, userIdToken: token }

// Bearer header pattern (User CRUD)
getOrderSets(token) →
  headers: { Authorization: `Bearer ${token}` }
```

---

## 6. Firebase Integration

### 6.1 Initialization

**File:** `lib/firebase.tsx` — lazy singleton pattern:

```typescript
let _app: FirebaseApp | undefined
let _auth: Auth | undefined
let _db: Firestore | undefined
let _provider: GoogleAuthProvider | undefined

function getApp(): FirebaseApp { /* init once */ }
function getAppAuth(): Auth { /* init once */ }
export function getAppDb(): Firestore { /* init once */ }
function getProvider(): GoogleAuthProvider { /* init once */ }
```

Prevents module-level side effects. Each getter initializes its singleton on first call.

### 6.2 Auth Patterns

**Sign-in:** `signInWithPopup()` only — no redirect fallback (cross-origin cookie issues). Catches user cancellation errors gracefully.

**Sign-out:** `signOutUser()` calls `signOut(getAppAuth())`.

**Auth state:** `onAuthStateChanged` listener in `AuthProvider` → updates `user`, `authLoading`, then fetches `onboardingCompleted` via `whoAmI()`.

**Token retrieval:** `useAuthToken()` hook returns current ID token (refreshes on auth state change).

### 6.3 Dev-Mode Auth Bypass

```typescript
const DEV_MOCK_USER =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('dev-auth')
    ? ({
        uid: 'dev-mock-uid',
        email: 'dev@localhost',
        displayName: 'Dev User',
        photoURL: null,
        getIdToken: () => Promise.resolve('dev-mock-token'),
      } as unknown as User)
    : null
```

- Activated with `?dev-auth=1` query parameter
- `import.meta.env.DEV` guard → **tree-shaken from production builds**
- Backend calls will fail (mock token can't verify) — UI development only
- Required for cmux embedded browser (popups blocked)

### 6.4 Firestore Integration

| Operation | Pattern | Hooks Using It |
|-----------|---------|---------------|
| Real-time listener | `onSnapshot(docRef)` | `useEncounter`, `useQuickEncounter`, `useSubscription` |
| Real-time collection | `onSnapshot(collectionRef)` | `useEncounterList` |
| One-time collection read | `getDocs(collectionRef)` | `usePhotoLibrary` |
| Client-side write | `updateDoc()` / `setDoc()` | `useEncounterList.createEncounter`, `useEncounter` (S2 data), `useQuickEncounter` (narrative) |
| Batch write | `writeBatch()` | `useEncounterList.clearAllEncounters` |

**Firestore paths used by frontend:**

| Path | Purpose | Access |
|------|---------|--------|
| `customers/{uid}/encounters` | Encounter collection | Read + create + delete |
| `customers/{uid}/encounters/{id}` | Single encounter | Read + update (S2 only) |
| `customers/{uid}/subscriptions` | Stripe subscriptions | Read-only (onSnapshot) |
| `photoLibrary` | Photo catalog | Read-only (one-time getDocs) |

### 6.5 Client-Writable vs Backend-Only Fields

| Field | Who Writes | Notes |
|-------|-----------|-------|
| `roomNumber`, `chiefComplaint`, `mode` | Client (creation) | Set at `createEncounter()` |
| `section1.content`, `section2.content`, `section3.content` | Client | Local editing, persisted on submit |
| `section2.selectedTests`, `testResults`, `workingDiagnosis` | Client | S2 structured data |
| `section2.allUnremarkable`, `pastedRawText`, `appliedOrderSet` | Client | S2 metadata |
| `quickModeData.narrative` | Client | Auto-saved with debounce |
| `section1.llmResponse` | **Backend** | S1 differential + CDR analysis |
| `section3.llmResponse`, `finalMdm` | **Backend** | S3 final MDM |
| `status` (after finalize) | **Backend** | Security rules block client after `'finalized'` |
| `quotaCounted`, `quotaCountedAt` | **Backend** | Quota tracking |
| `encounterPhoto` | **Backend** | Assigned during enrichment pipeline |

---

## 7. Type System & Backend Alignment

### 7.1 Core Type Files

#### encounter.ts — Main Types

**Constants:**
```typescript
SECTION1_MAX_CHARS = 2000
SECTION2_MAX_CHARS = 2000
SECTION3_MAX_CHARS = 2000
TOTAL_MAX_CHARS = 6000
MAX_SUBMISSIONS_PER_SECTION = 2
```

**Union types:**

| Type | Values |
|------|--------|
| `EncounterMode` | `'quick' \| 'build'` |
| `EncounterStatus` | `'draft' \| 'section1_done' \| 'section2_done' \| 'finalized' \| 'archived' \| 'section3_error' \| 'error'` |
| `SectionStatus` | `'pending' \| 'in_progress' \| 'completed'` |
| `QuickModeStatus` | `'draft' \| 'processing' \| 'completed' \| 'error'` |
| `UrgencyLevel` | `'emergent' \| 'urgent' \| 'routine'` |
| `TestResultStatus` | `'unremarkable' \| 'abnormal' \| 'pending'` |
| `DispositionOption` | `'discharge' \| 'observation' \| 'admit' \| 'icu' \| 'transfer' \| 'ama' \| 'lwbs' \| 'deceased'` |
| `CdrStatus` | `'pending' \| 'partial' \| 'completed' \| 'dismissed'` |
| `CdrComponentSource` | `'section1' \| 'section2' \| 'user_input'` |
| `WorkupRecommendationSource` | `'baseline' \| 'differential' \| 'cdr' \| 'surveillance'` |

**Key interfaces:**

| Interface | Fields | Purpose |
|-----------|--------|---------|
| `EncounterDocument` | id, userId, roomNumber, chiefComplaint, status, mode, section1-3, quickModeData?, cdrTracking, quotaCounted, createdAt, updatedAt, ... | Full Firestore document shape |
| `DifferentialItem` | diagnosis, urgency, reasoning, regionalContext?, cdrContext? | Single diagnosis in differential |
| `CdrAnalysisItem` | name, cdrId?, applicable, score?, interpretation?, missingData?, availableData? | CDR analysis from S1 |
| `WorkupRecommendation` | testName, testId?, reason, source, priority? | Lab/imaging order recommendation |
| `TestResult` | status, quickFindings?, notes?, value?, unit? | Test result entry |
| `WorkingDiagnosis` | selected, custom?, suggestedOptions? | Structured diagnosis object |
| `CdrTrackingEntry` | name, status, components (Record), score?, interpretation?, dismissed, excluded? | CDR progress tracking |
| `FinalMdm` | text (paste-ready), json (structured) | S3 output |
| `PatientIdentifier` | age?, sex?, chiefComplaint? | AI-extracted demographics |

**Utility functions:**
- `isStructuredDiagnosis(wd)` — type guard for `WorkingDiagnosis` vs legacy string
- `createDefaultSectionData()` — factory for empty section
- `canSubmitSection(data)` — `!isLocked && submissionCount < 2`
- `getRemainingSubmissions(data)` — `max(0, 2 - submissionCount)`
- `formatPatientIdentifier(id?)` — `"45M Chest Pain"` format
- `getEncounterMode(encounter)` — backward-compatible mode getter
- `formatRoomDisplay(room)` — `"12"` → `"Room 12"`, `"Bed 2A"` → `"Bed 2A"`

#### buildMode.ts — Form Structures

Section-specific form interfaces for the Build Mode accordion:

| Interface | Fields |
|-----------|--------|
| `ChiefComplaintSection` | complaint, context, age, sex |
| `ProblemsConsideredSection` | emergent[], nonEmergent[] |
| `DataReviewedSection` | labs, imaging, ekg, externalRecords, independentHistorian |
| `RiskAssessmentSection` | patientFactors, diagnosticRisks, treatmentRisks, dispositionRisks, highestRiskElement |
| `ClinicalReasoningSection` | evaluationApproach, keyDecisionPoints, workingDiagnosis |
| `TreatmentProceduresSection` | medications, procedures, rationale |
| `DispositionSection` | decision, levelOfCare, rationale, dischargeInstructions, followUp, returnPrecautions |
| `BuildModeFormState` | Combines all above sections |

**Section metadata array** defines tab order and icons for the Build Mode accordion.

#### libraries.ts — Catalog Types

**Test library:**
- `TestCategory`: `'labs' | 'imaging' | 'procedures_poc'`
- `TestDefinition`: id (lowercase snake_case), name, category, subcategory, commonIndications[], unit?, normalRange?, quickFindings?, feedsCdrs[]

**CDR library:**
- `CdrComponentType`: `'select' | 'boolean' | 'number_range' | 'algorithm'`
- `CdrComponent`: id, label, type, options?, min?, max?, value?, source, autoPopulateFrom?
- `CdrScoring`: method (`'sum' | 'threshold' | 'algorithm'`), ranges: `CdrScoringRange[]`
- `CdrDefinition`: id, name, fullName, applicableChiefComplaints[], components[], scoring, suggestedTreatments?, application?

### 7.2 Type/Schema Mirror Table

| Frontend Type | Backend Zod Schema | File |
|---------------|-------------------|------|
| `EncounterDocument` | `EncounterDocSchema` | `backend/src/buildModeSchemas.ts` |
| `Section1Response` | `Section1ResponseSchema` | `backend/src/buildModeSchemas.ts` |
| `Section2Response` | `Section2ResponseSchema` | `backend/src/buildModeSchemas.ts` |
| `FinalizeResponse` | `FinalizeResponseSchema` | `backend/src/buildModeSchemas.ts` |
| `DifferentialItem` | `DifferentialItemSchema` | `backend/src/buildModeSchemas.ts` |
| `TestDefinition` | `TestDefinitionSchema` | `backend/src/types/libraries.ts` |
| `CdrDefinition` | `CdrDefinitionSchema` | `backend/src/types/libraries.ts` |
| `ParseNarrativeResponse` | `ParseNarrativeResponseSchema` | `backend/src/modules/narrative/schemas.ts` |
| `QuickModeResponse` | `QuickModeGenerateBodySchema` (request) | `backend/src/modules/quick-mode/schemas.ts` |

### 7.3 Backward Compatibility Patterns

#### Dual llmResponse Shape

S1 `llmResponse` has two shapes from different backend versions:

```typescript
// Old shape (flat array):
section1.llmResponse = DifferentialItem[]

// New shape (wrapped object):
section1.llmResponse = {
  differential: DifferentialItem[],
  cdrAnalysis?: CdrAnalysisItem[],
  workupRecommendations?: WorkupRecommendation[],
  processedAt: Timestamp,
}
```

**Extraction:** Always use `getDifferential()` helper which handles both shapes. Never access `llmResponse` directly as an array.

#### workingDiagnosis Union

```typescript
// Legacy: plain string
section2.workingDiagnosis = "Acute MI"

// Current: structured object
section2.workingDiagnosis = {
  selected: "Acute MI",
  custom: undefined,
  suggestedOptions: ["Acute MI", "Unstable Angina", "NSTEMI"],
}
```

**Type guard:** `isStructuredDiagnosis(wd)` checks for object with `selected` property.

#### Optional New Fields

All new fields added to encounter documents must be optional with defaults:
```typescript
// In types:
enhancementDismissed?: boolean
enhancementReprocessed?: boolean

// In useEncounter onSnapshot handler:
enhancementDismissed: data.enhancementDismissed ?? false
```

### 7.4 CDR Scoring Engine

**File:** `lib/cdrScoringEngine.ts`

```typescript
function calculateScore(
  cdr: CdrDefinition,
  components: Record<string, CdrComponentState>,
): ScoreResult
```

Returns: `{ score: number | null, interpretation: string | null, missingComponents: string[] }`

**Scoring methods:**

| Method | Logic |
|--------|-------|
| `sum` | Sum all component values → find matching range |
| `threshold` | Count components with value > 0 → map to ranges |
| `algorithm` | Registered custom calculator per CDR ID |

**Registered algorithms:**
- `pecarn`: GCS ≤14 or altered mental or skull fracture → High (2); else count risk factors → Intermediate (1) or Low (0)

### 7.5 Status Mapping

**File:** `lib/statusMapper.ts`

```typescript
type DisplayColumn = 'COMPOSING' | 'BUILDING' | 'COMPLETE'
function getDisplayColumn(encounter: EncounterDocument): DisplayColumn
```

### 7.6 Photo Mapping

**File:** `lib/photoMapper.ts`

**Resolution priority:**
1. LLM-assigned photo: `encounterPhoto.category/subcategory`
2. Chief complaint keyword fallback (52 keywords → 16 categories)
3. Default: `/encounter-photos/general/unspecified.png`

**URL resolution:** Firebase Storage URL (if `photoUrlMap` has key) → local fallback `/encounter-photos/{category}/{subcategory}.png`.

**Keyword samples:** "chest" → cardiac/chest-pain, "shortness" → respiratory/shortness-of-breath, "headache" → neuro/headache, "laceration" → trauma/laceration.

---

## 8. Design System & Styling

### 8.1 Design Tokens

**File:** `styles/tokens.css`

#### Color Palette

**Backgrounds:**
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-primary` | `#000` | Main background |
| `--color-bg-secondary` | `#0a0a0a` | Card backgrounds |
| `--color-bg-tertiary` | `#1a1a1a` | Form inputs, code blocks |
| `--color-bg-elevated` | `rgba(255,255,255,0.02)` | Subtle elevation |
| `--color-bg-hover` | `rgba(255,255,255,0.05)` | Hover states |

**Brand accent (red):**
| Token | Value |
|-------|-------|
| `--color-accent` | `#dc3545` |
| `--color-accent-dark` | `#c82333` |
| `--color-accent-glow` | `rgba(220,53,69,0.4)` |
| `--color-accent-subtle` | `rgba(220,53,69,0.1)` |
| `--color-accent-medium` | `rgba(220,53,69,0.2)` |

**Build Mode theme (blue):**
| Token | Value |
|-------|-------|
| `--color-build-accent` | `#3b82f6` |
| `--color-build-bg` | `rgba(59,130,246,0.03)` |
| `--color-build-border` | `rgba(59,130,246,0.15)` |
| `--color-build-accent-glow` | `rgba(59,130,246,0.3)` |

**Surveillance theme (teal):**
| Token | Value |
|-------|-------|
| `--color-surveillance-accent` | `#17a2b8` |
| `--color-surveillance-bg` | `rgba(23,162,184,0.05)` |
| `--color-surveillance-border` | `rgba(23,162,184,0.2)` |

**Status colors:**
| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#28a745` | Success states |
| `--color-warning` | `#ffc107` | Warning states |
| `--color-error` | `#dc3545` | Error states |
| `--color-info` | `#17a2b8` | Info states |

**Clinical urgency (hardcoded — NOT tokens):**
| Color | Hex | Meaning |
|-------|-----|---------|
| Emergent | `#dc2626` | Life-threatening |
| Urgent | `#d97706` | Time-sensitive |
| Routine | `#16a34a` | Standard priority |

> These are hardcoded because they carry clinical meaning and must never change with theme switches.

#### Spacing Scale (8px base)

| Token | Value |
|-------|-------|
| `--space-xs` | `0.25rem` (4px) |
| `--space-sm` | `0.5rem` (8px) |
| `--space-md` | `1rem` (16px) |
| `--space-lg` | `1.5rem` (24px) |
| `--space-xl` | `2rem` (32px) |
| `--space-2xl` | `3rem` (48px) |
| `--space-3xl` | `4rem` (64px) |

#### Typography

| Token | Value |
|-------|-------|
| `--font-family` | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` |
| `--font-mono` | `'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace` |

**Font sizes:** `--font-size-xs` (12px) through `--font-size-4xl` (40px), 8 stops.

**Font weights:** light (300), normal (400), medium (500), semibold (600), bold (700), black (900).

**Line heights:** tight (1.25), normal (1.5), relaxed (1.75).

#### Border Radius

| Token | Value |
|-------|-------|
| `--radius-xs` | `2px` |
| `--radius-sm` | `4px` |
| `--radius-md` | `8px` |
| `--radius-lg` | `12px` |
| `--radius-xl` | `16px` |
| `--radius-full` | `50%` |

#### Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | `1` | Default stacking |
| `--z-dropdown` | `100` | Dropdown menus |
| `--z-sticky` | `200` | Sticky headers |
| `--z-modal-backdrop` | `900` | Modal overlays |
| `--z-modal` | `1000` | Modal content |
| `--z-toast` | `9999` | Toast notifications |
| `--z-landing-preloader` | `99999` | Landing page preloader |
| `--z-landing-overlay` | `100001` | Landing page overlay |

#### Transitions & Shadows

| Token | Value |
|-------|-------|
| `--transition-fast` | `0.15s ease` |
| `--transition-normal` | `0.3s ease` |
| `--transition-slow` | `0.5s ease` |
| `--shadow-glow` | `0 10px 30px var(--color-accent-glow)` |
| `--shadow-elevated` | `0 20px 60px rgba(0,0,0,0.8)` |
| `--shadow-card` | `0 10px 40px rgba(0,0,0,0.5)` |
| `--shadow-subtle` | `0 4px 12px rgba(0,0,0,0.3)` |

#### Layout

| Token | Value |
|-------|-------|
| `--max-width-content` | `1200px` |
| `--max-width-narrow` | `800px` |
| `--max-width-wide` | `1600px` |
| `--header-height` | `70px` |

### 8.2 BEM Methodology

All component CSS follows BEM naming:

```css
.encounter-board { }                   /* Block */
.encounter-board__column { }           /* Element */
.encounter-board__column--active { }   /* Modifier */
```

One CSS file per component. Component-scoped by convention, not CSS modules.

### 8.3 Theme System

**Default:** Dark theme (black backgrounds, white text, red accent).

**Brutalist theme** (`.brutalist` class on root):
- Darker backgrounds: `#0c0c0c` → `#000` → `#111`
- Sharper borders, zero border-radius (`--radius-*: 0`)
- Redder accent: `#e53e3e`
- Different fonts: Inter, JetBrains Mono
- Sidebar widths: 180px expanded, 72px collapsed

**CSS variables always have fallbacks:** `var(--color-surface, #f8fafc)` — theme may not be loaded.

### 8.4 Responsive Design

| Breakpoint | Hook | Usage |
|-----------|------|-------|
| < 768px | `useIsMobile()` | Mobile layout (bottom bar, full-width panels) |
| 768px–1023px | `useIsTablet()` | Tablet adjustments |
| ≥ 1024px | `useIsDesktop()` | Desktop layout (sidebar, 600px detail panel) |

**Rules:**
- Conditional CSS classes, **never inline styles** for responsive behavior
- `SidebarLayout`: sidebar (desktop) vs bottom bar (mobile)
- `DetailPanel`: 600px width (desktop) vs 100% (mobile)
- Mobile bottom bar: fixed 72px height

### 8.5 Shared Component Classes

**File:** `styles/components.css`

Key utility classes:

| Class | Purpose |
|-------|---------|
| `.dark-card` | Elevated card with hover lift (+3px) |
| `.btn-primary` | Gradient accent button with glow |
| `.btn-secondary` | Outlined transparent button |
| `.btn-ghost` | Borderless text button |
| `.form-textarea` / `.form-input` | Dark-themed form inputs |
| `.tabs` / `.tab` / `.tab--active` | Tab navigation |
| `.alert-{warning\|error\|success\|info}` | Themed alert boxes |
| `.badge-{accent\|success\|warning\|muted}` | Inline badges |
| `.skeleton` / `.skeleton-text` | Shimmer loading placeholders |
| `.spinner` / `.pulse-spinner` | Loading indicators |
| `.collapsible` | Expandable details sections |

### 8.6 Animation Patterns

Framer Motion is used throughout:

| Component | Animation | Duration |
|-----------|-----------|----------|
| `DetailPanel` | Slide-in from right + backdrop fade | Spring (default) |
| `StatusColumn` cards | Staggered spring entry/exit | `AnimatePresence popLayout` |
| `LandingPage` slides | Cross-fade between slides | `0.5s` |
| `BrushStroke` | SVG path animation | Custom timing |
| Modal overlays | Fade backdrop + slide content | `0.3s` |

**Motion respect:** `usePrefersReducedMotion()` hook checks `(prefers-reduced-motion: reduce)` media query. LandingPage disables film grain canvas when reduced motion is preferred.

---

## 9. Testing Architecture

### 9.1 Configuration

**Vitest config** (`vitest.config.ts`, 16 lines):

| Option | Value | Purpose |
|--------|-------|---------|
| `environment` | `jsdom` | Browser-like DOM |
| `setupFiles` | `./src/setupTests.ts` | Per-test: extend matchers, mock matchMedia |
| `globalSetup` | `./src/vitestGlobalSetup.ts` | Force-exit after tests (Firebase listener cleanup) |
| `globals` | `true` | `describe`, `it`, `expect` without imports |
| `css` | `false` | Skip CSS processing in tests |
| `testTimeout` | `10000` | 10s per test |
| `hookTimeout` | `10000` | 10s per hook |
| `teardownTimeout` | `1000` | 1s for cleanup |

**Setup files:**
- `setupTests.ts` (33 lines): Extends with `@testing-library/jest-dom`, mocks `window.matchMedia`, suppresses React Router v7 migration warnings
- `vitestGlobalSetup.ts` (6 lines): Force-exits vitest after 3s (prevents hanging on Firebase listeners in jsdom)

**Test runner:** `scripts/run-tests.mjs` wraps `vitest run` with stall detection (5s timeout after last output) and 120s hard timeout.

### 9.2 Test Inventory (33 files)

| Test File | Category | Tests |
|-----------|----------|-------|
| `app.test.tsx` | Integration | App renders landing page |
| `AccessibilityPass.test.tsx` | Accessibility | Focus, ARIA, semantic HTML |
| `BrushStroke.test.tsx` | Component | SVG brush animation |
| `CdrCard.test.tsx` | Component | CDR selection, scoring, toggles |
| `CdrDetailView.test.tsx` | Component | CDR detail accordion |
| `CdrResultsOutput.test.tsx` | Component | Scored results display |
| `DashboardOutput.test.tsx` | Component | 4-area dashboard (**Known OOM issue**) |
| `DesktopLayout.test.tsx` | Layout | Desktop sidebar behavior |
| `DictationMode.test.tsx` | Component | Dictation guide |
| `DifferentialList.test.tsx` | Component | Differential table |
| `DispositionSelector.test.tsx` | Component | Disposition selection |
| `OrdersCard.test.tsx` | Component | Test/order management |
| `OrdersetManager.test.tsx` | Component | Order set CRUD modal |
| `OrderSets.test.tsx` | Component | Order set integration |
| `Onboarding.test.tsx` | Route | Onboarding flow |
| `PasteLabModal.test.tsx` | Component | Bulk lab paste |
| `ProgressIndicator.test.tsx` | Component | Section completion |
| `QuickActions.test.tsx` | Component | Quick mode actions |
| `RegionalTrendsCard.test.tsx` | Component | Surveillance card |
| `ReportTemplates.test.tsx` | Component | Report template CRUD |
| `ResultEntry.test.tsx` | Component | Test result row |
| `S2SubmissionRefactor.test.tsx` | Integration | S2 submission flow |
| `TreatmentInput.test.tsx` | Component | Treatment input |
| `WorkingDiagnosisInput.test.tsx` | Component | Diagnosis input |
| `formatTrendReport.test.ts` | Utility | Trend report formatting |
| `getIdentifiedCdrs.test.ts` | Utility | CDR matching |
| `getRecommendedTestIds.test.ts` | Utility | Test recommendation |
| `useBrushAnimation.test.ts` | Hook | Brush animation state |
| `useCdrLibrary.test.tsx` | Hook | CDR fetch |
| `useDispoFlows.test.tsx` | Hook | Dispo flow CRUD |
| `useOrderSets.test.tsx` | Hook | Order set CRUD |
| `useReportTemplates.test.tsx` | Hook | Report template CRUD |
| `useTestLibrary.test.tsx` | Hook | Test fetch |

### 9.3 Testing Patterns

**Component testing:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react'

it('renders encounter card', () => {
  render(<BoardCard encounter={mockEncounter} onClick={vi.fn()} />)
  expect(screen.getByText('Chest Pain')).toBeInTheDocument()
})
```

**Hook testing:**
```typescript
import { renderHook, act, waitFor } from '@testing-library/react'

it('fetches CDR library', async () => {
  const { result } = renderHook(() => useCdrLibrary())
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.cdrs).toHaveLength(5)
})
```

**API mocking:**
```typescript
vi.fn(global.fetch).mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve({ ok: true, cdrs: mockCdrs }),
})
```

**Firebase mocking:**
```typescript
vi.mock('../lib/firebase', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: mockUser, authLoading: false }),
  getAppDb: () => mockDb,
}))
```

**Browser API mocking** (in `setupTests.ts`):
```typescript
// matchMedia mock for useMediaQuery/useIsMobile
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
})

// IntersectionObserver mock (LandingPage)
globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn(),
}))
```

### 9.4 Known Issue

`DashboardOutput.test.tsx` crashes the vitest worker with an OOM error. This is a pre-existing issue unrelated to CDR changes. All other 32 test files pass cleanly.

### 9.5 Quality Gate

**Pre-commit:** `pnpm check` = `pnpm typecheck && pnpm lint && pnpm test`

This runs sequentially: TypeScript strict check → ESLint → full test suite. All three must pass.

---

## 10. Backend Alignment

### 10.1 Cross-Reference Table

| Frontend Concern | Backend TRD Section | Notes |
|-----------------|--------------------|----- |
| Auth token patterns (body vs Bearer) | §6.2 Auth Middleware | Body `userIdToken` fallback documented in auth.ts |
| Firestore document shapes | §4.2 Repository Layer | Frontend types mirror Firestore schemas |
| Error codes → user messages | §8.3 Error Response Contract | `ApiError.fromResponse()` maps status codes |
| Subscription tiers + quotas | §10.6 (if present) | `GENERATION_LIMITS` map mirrors backend config |
| Surveillance integration | §10.7 (if present) | Non-blocking — failures never prevent MDM generation |
| Quota counting rules | §10.8 (if present) | Counted once per encounter at S1, not per section |
| Build Mode section pipeline | §3 Domain Module Design | S1→S2→S3 progression enforced by both frontend and backend |
| CDR library + scoring | §4.2 Library Repository | Frontend scoring engine mirrors backend CDR format |
| Rate limiting | §2 Infrastructure Patterns | Frontend `ApiError` handles 429 as retryable |

### 10.2 Auth Token Pattern Agreement

**Build Mode endpoints** (`/v1/build-mode/*`, `/v1/quick-mode/*`):
- Frontend sends `userIdToken` in request **body**
- Backend auth middleware checks body fallback: `req.body.userIdToken` [→ Backend TRD §6.2]
- This is a legacy pattern — newer endpoints use Bearer header

**User CRUD endpoints** (`/v1/user/*`, `/v1/libraries/*`, `/v1/analytics/*`, `/v1/surveillance/*`):
- Frontend sends `Authorization: Bearer ${token}` header
- Backend auth middleware checks header first [→ Backend TRD §6.2]

### 10.3 Firestore Document Shape Agreement

The `EncounterDocument` type in `types/encounter.ts` must match the shape written by:
- Frontend `createEncounter()` (initial doc)
- Backend S1 handler (differential, CDR analysis, workup recommendations)
- Frontend S2 writes (tests, results, diagnosis)
- Backend finalize handler (final MDM, status change)

Any field added on either side must be `?` optional with a `?? default` fallback on the other.

### 10.4 Error Contract

Backend error codes flow to frontend via:

```
Backend AppError subclass → JSON response { error, message, details }
  → Frontend fetch → ApiError.fromResponse()
    → ApiError { errorType, statusCode, isRetryable, quotaInfo? }
      → Component-level error display
```

| Backend Error | HTTP Status | Frontend ApiError Type |
|--------------|------------|----------------------|
| `AuthenticationError` | 401 | `auth` |
| `ValidationError` | 400 | `validation` |
| `QuotaExceededError` | 402 | `quota` |
| `RateLimitError` | 429 | `rate_limit` |
| `LlmError` | 500 | `server` |
| `SectionLockedError` | 400 | `validation` |

### 10.5 Surveillance Flow

1. Frontend: `TrendAnalysisToggle` → enables surveillance + sets location
2. Frontend: `useEncounter.submitSection(1)` → includes location in `processSection1()` call
3. Backend: Enrichment pipeline runs surveillance adapters (non-blocking) [→ Backend TRD §3]
4. Backend: Stores surveillance context on encounter doc during S1
5. Frontend: `RegionalTrendsCard` reads surveillance data from encounter doc
6. Frontend: `downloadSurveillanceReport()` → backend generates PDF [→ Backend TRD surveillance module]

### 10.6 Quota Flow

1. Frontend: `useSubscription` → reads subscription tier → sets `GENERATION_LIMITS[tier]`
2. Frontend: `useEncounter.submitSection(1)` → backend counts quota if `!quotaCounted`
3. Backend: Increments usage, returns `quotaRemaining` in response
4. Frontend: Updates `quotaRemaining` in hook state
5. Frontend: `useSubscription.canGenerate` → `remainingGenerations > 0`

---

## 11. Frontend-Specific Considerations

### 11.1 Dev-Mode Auth Bypass

For cmux embedded browser testing (Google OAuth popups blocked):
```
http://localhost:5173/onboarding?dev-auth=1
```

Injects `DEV_MOCK_USER` → route guards pass, UI renders. Backend calls fail (mock token). Tree-shaken from production.

### 11.2 Deployment

```bash
cd frontend && pnpm build            # TypeScript check + Vite build → dist/
firebase deploy --only hosting --project mdm-generator
```

**Hosting targets:**
- Primary: `https://aimdm.app` (custom domain)
- Default: `https://mdm-generator.web.app`

### 11.3 Environment Variables

| Variable | File | Purpose |
|----------|------|---------|
| `VITE_FIREBASE_API_KEY` | `.env` / `.env.production` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `.env` / `.env.production` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | `.env` / `.env.production` | Firebase project ID |
| `VITE_API_BASE_URL` | `.env` | Backend URL (`http://localhost:8080` for dev) |

All must have `VITE_` prefix to be exposed to client code. `.env.production` overrides for prod builds.

### 11.4 Performance Patterns

| Pattern | Where | Purpose |
|---------|-------|---------|
| Lazy loading | `Onboarding` route via `React.lazy()` | Reduce initial bundle |
| Fetch-once guards | `useCdrLibrary`, `usePhotoLibrary` | Prevent duplicate API calls |
| Debounced writes | `useQuickEncounter.setNarrative()` (500ms) | Reduce Firestore writes |
| Real-time listeners | `onSnapshot` (encounters, subscriptions) | Avoid polling |
| Local state splitting | `useEncounter.localContent` | Instant edits without Firestore round-trip |
| `AnimatePresence` | `StatusColumn`, `DetailPanel` | Layout animation without re-render |

### 11.5 Accessibility

| Feature | Implementation |
|---------|---------------|
| Focus styles | Global `:focus-visible` → 2px solid accent, 2px offset |
| Semantic HTML | `<main>`, `<nav>`, `<section>`, `<button>` over `<div>` |
| Keyboard nav | LandingPage: arrows, space, escape for slide navigation |
| Color contrast | White text on dark backgrounds, accent colors tested |
| Reduced motion | `usePrefersReducedMotion()` disables film grain, animations |
| Test coverage | `AccessibilityPass.test.tsx` validates focus, ARIA, semantics |

### 11.6 Anti-Patterns (from CLAUDE.md)

| Rule | Rationale |
|------|-----------|
| No inline styles for responsive | Use conditional CSS classes via `useIsMobile()` |
| No `z.any()` in new schemas | Legacy `MdmPreviewSchema` uses it; new schemas require explicit types |
| Always handle both `llmResponse` shapes | Old flat array + new wrapped object — use `getDifferential()` |
| No client writes for S3 finalize | Backend owns finalize write; Firestore rules block client after `status: 'finalized'` |
| No PHI in logs or console | `{ userId, action }` OK; `{ narrative }` NEVER |
| No deleting deprecated components | Mark `@deprecated`, keep file — delete in cleanup pass only |
| CSS variables always have fallbacks | `var(--color-surface, #f8fafc)` — theme may not be loaded |
| Urgency colors are hardcoded | `#dc2626` emergent, `#d97706` urgent, `#16a34a` routine — clinical meaning |

### 11.7 Google Fonts

Loaded via `index.html` preconnect:
- **Bebas Neue** — Display/hero headings (LandingPage)
- **Playfair Display** — Editorial headings (weights: 400, 500, 700, italic)
- **Inter** — Body text (weights: 300, 400, 500, 600)

Note: System font stack (`--font-family`) is the default. Google Fonts are used selectively in specific components.

### 11.8 ESLint & Prettier Configuration

**ESLint** (`eslint.config.js`, 25 lines):
- Extends: `@eslint/js` recommended → `typescript-eslint` recommended → React Hooks → React Refresh → Prettier
- Files: `**/*.{ts,tsx}`
- Global ignores: `dist/`

**Prettier** (`prettier.config.js`, 8 lines):
- No semicolons (`semi: false`)
- Single quotes (`singleQuote: true`)
- Trailing commas everywhere (`trailingComma: 'all'`)
- Line width: 100 characters (`printWidth: 100`)
