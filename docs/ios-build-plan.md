# iOS Build Plan — MDM Generator (SwiftUI)

> **Decision:** Option B "Direct Path" — Bootstrap → API Contract → Write Stories → Spawn Team
> **Date:** 2026-02-23
> **Branch:** `SwiftUI` (worktree: `.claude/worktrees/SwiftUI/`)

---

## 1. Current State

### Assets That Exist

| Asset | Path | Status |
|-------|------|--------|
| Spec wireframe | `docs/ios-swiftui-spec-wireframe.md` | Complete — project structure, platform constants, 6 doc specs |
| API contract | `_bmad/_memory/ios-architect-sidecar/knowledge/api-contract.md` | Complete — all 11 endpoints with Swift Codable models |
| Agent team prompts | `_bmad/_memory/ios-architect-sidecar/knowledge/agent-team-prompts.md` | Complete — ios-builder, ios-quality, ios-release spawn prompts |
| Architect instructions | `_bmad/_memory/ios-architect-sidecar/instructions.md` | Complete — prohibited patterns, ATDD pipeline, file ownership |
| Sidecar memory | `_bmad/_memory/ios-architect-sidecar/memories.md` | Initialized — decision/kickback/story registries ready |
| Web app (reference) | `frontend/`, `backend/` | Production — full feature set to port |

### What's Missing

| Gap | Required Before |
|-----|----------------|
| Xcode project | Any Swift code can be written |
| CLAUDE.md (iOS) | Builder agent can follow conventions |
| User stories | Builder agent knows what to implement |
| Swift Codable models (generated) | Networking layer can compile |
| SwiftData models | Local persistence layer |
| CI/CD pipeline | Automated builds and tests |

---

## 2. The 4-Step Build Plan

### Step 1: Bootstrap Xcode Project

**Agent:** ios-architect (Kira) — manual or scripted
**Prerequisites:** None
**Produces:**
- Xcode 26 project with iOS 26.0 deployment target
- Feature-based directory structure (from spec wireframe `Naming Conventions`):
  ```
  MDMGenerator/
  ├── MDMGeneratorApp.swift
  ├── Sources/
  │   ├── Features/
  │   ├── Core/ (Networking/, Storage/, Services/, Extensions/)
  │   ├── SharedUI/ (Components/, Modifiers/, Styles/)
  │   ├── Intelligence/
  │   └── Resources/
  ├── Tests/ (UnitTests/, UITests/)
  └── CLAUDE.md
  ```
- `CLAUDE.md` at project root — condensed from spec wireframe sections 1-13
- Firebase Auth SDK dependency (SPM)
- Clean build targeting iPhone 16 Plus simulator

**Validation gate:** `xcodebuild build -scheme MDMGenerator -destination 'platform=iOS Simulator,name=iPhone 16 Plus'` succeeds with zero warnings.

---

### Step 2: API Client & Codable Models

**Agent:** ios-architect writes story → ios-builder implements
**Prerequisites:** Step 1 complete (project builds)
**Produces:**
- `APIClient` in `Sources/Core/Networking/` — generic `request<T: Decodable>()` with:
  - Firebase ID token injection (`userIdToken` in body)
  - Exponential backoff retry
  - Structured error handling (`APIError` model)
  - `FlexibleStringArray` utility type (LLM output variance)
- All 11 endpoint request/response Codable models (from API contract)
- `AuthService` protocol + implementation for Firebase Auth token management
- Protocol-based DI so ios-quality can mock everything

**Key types from contract:**
- `WhoAmIResponse`, `Section1Response`, `Section2Response`, `FinalizeResponse`
- `QuickModeResponse`, `PatientIdentifier`
- `SurveillanceAnalyzeResponse`, `TrendAnalysisResult`
- `FlexibleStringArray`, `APIError`, `Urgency`, `ComplexityLevel`

**Validation gate:** Unit tests pass for Codable round-trip on all models; mock API client returns expected types.

---

### Step 3: Write Feature Stories (MVP Scope)

**Agent:** ios-architect (Kira)
**Prerequisites:** Step 2 complete (networking compiles)
**Produces:** BMAD stories in Given/When/Then format covering MVP features:

#### MVP Feature Scope

| Feature | Priority | Web Equivalent | iOS 26 Enhancement |
|---------|----------|---------------|-------------------|
| **Auth (Google Sign-In)** | P0 | Firebase Auth | Native Sign in with Apple option |
| **Quick Mode** | P0 | `/compose` → `/output` | Single-screen dictation + MDM output |
| **Build Mode** | P0 | `/build` (3-section kanban) | Card-based progressive sections |
| **MDM Output Display** | P0 | `/output` with copy | Copy to pasteboard, Share Sheet |
| **Quota & Plan Display** | P1 | `/settings` whoami | Account screen with usage ring |
| **Dictation Input** | P1 | Text input only | Native iOS speech-to-text |
| **Surveillance (trends)** | P2 | Trend toggle + results panel | Liquid Glass trend cards |
| **On-Device AI Assist** | P2 | N/A (cloud only) | Foundation Models for field extraction |
| **Offline Draft** | P3 | N/A | SwiftData local encounter cache |

Stories will follow the format defined in `instructions.md` (Story Format section) with:
- Acceptance criteria in Given/When/Then
- File ownership boundaries
- Prohibited pattern reminders
- Complexity sizing (S/M/L)

**Validation gate:** Each story passes ios-architect's spec audit (no implementation leakage, no prohibited patterns in specs, GWT format correct).

---

### Step 4: Spawn Agent Team

**Agent:** ios-architect as lead, spawns ios-builder + ios-quality + ios-release
**Prerequisites:** Steps 1-3 complete, stories written
**Produces:** Working iOS app through ATDD cycles

**Spawn sequence:**
1. **ios-builder** — implements story code in `Sources/`
2. **ios-quality** — writes acceptance tests + mocks in `Tests/`
3. **ios-release** — sets up CI/CD in `.github/workflows/` (one-time, then on-demand)

**ATDD cycle per story:**
```
ios-architect writes spec
  → ios-builder implements
    → ios-architect runs build validation
      → ios-quality runs acceptance tests
        → PASS: story accepted
        → FAIL: kickback to ios-builder (max 3, then escalate)
```

**Validation gate:** All stories pass acceptance tests; app runs on simulator without crashes.

---

## 3. Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Path | Option B (Direct) | Spec wireframe + API contract already provide enough context; generating 6 spec docs first would delay implementation without adding value |
| Architecture | MVVM + @Observable | Apple-recommended for iOS 26; aligns with spec wireframe constants |
| Navigation | NavigationStack + NavigationPath | Programmatic, supports deep linking |
| Networking | URLSession (no third-party) | Project scope doesn't warrant Alamofire; API contract has 11 simple REST endpoints |
| Auth | Firebase Auth (SPM) | Must match web app's Firebase Auth backend |
| Persistence | SwiftData | iOS 26-only target means full SwiftData support including model inheritance |
| Testing | Swift Testing (@Test, @Suite) | Modern framework, no XCTest for new tests |
| Design | Liquid Glass | iOS 26 default; auto-adopted for standard controls |
| On-device AI | Foundation Models | Offline field extraction, classification (not for MDM generation — that stays cloud) |

---

## 4. Key References

| Resource | Path |
|----------|------|
| Spec wireframe (structure, constants, doc specs) | `docs/ios-swiftui-spec-wireframe.md` |
| API contract (11 endpoints, Swift models) | `_bmad/_memory/ios-architect-sidecar/knowledge/api-contract.md` |
| Agent spawn prompts (builder, quality, release) | `_bmad/_memory/ios-architect-sidecar/knowledge/agent-team-prompts.md` |
| Architect instructions (prohibited patterns, ATDD, ownership) | `_bmad/_memory/ios-architect-sidecar/instructions.md` |
| Session memory (decisions, kickbacks, stories) | `_bmad/_memory/ios-architect-sidecar/memories.md` |
| Web app PRD (feature reference) | `docs/prd.md` |
| MDM generation guide (medical logic) | `docs/mdm-gen-guide.md` |

---

## 5. Constraints & Guardrails

- **NO PHI** in code, logs, comments, test fixtures, or previews
- **Educational use only** — always display physician review disclaimer
- **Worst-first differential** — life-threatening conditions sort first in all display logic
- **Prohibited patterns** enforced via kickback protocol (see `instructions.md`):
  ObservableObject, @Published, NavigationView, Combine (new), singletons, AnyView, force unwrap, UIKit (unless necessary), Core Data, third-party HTTP, XCTest (new)
- **Max 3 kickbacks per task** — then full-stop escalation to human operator
