# iOS Architect Sidecar — Standing Instructions

## Shared Baseline Knowledge

### Platform Targets

- **iOS 26.0+** / iPadOS 26.0+
- **Xcode 26** (Swift 6.2 compiler)
- **Swift 6.2** with `nonisolated(nonsending)` as the default actor isolation
- **Design System:** Liquid Glass (WWDC 2025)
- **On-Device AI:** Foundation Models Framework (3B parameter, on-device LLM)
- **Architecture:** MVVM + @Observable + async/await
- **Data Persistence:** SwiftData (not Core Data)
- **Navigation:** NavigationStack + NavigationPath (programmatic)
- **Testing:** Swift Testing framework (@Test, @Suite) for new tests
- **HTTP Client:** URLSession (native, no third-party)

### Observation and State Management

- `@Observable` macro on all ViewModels (`import Observation`)
- `@State` for view-owned ViewModel instances
- `@Environment` for shared dependencies (DI)
- `@Bindable` for creating bindings to @Observable properties
- `@MainActor` on ViewModels and UI-bound code
- Never use `@Published` or `ObservableObject` — these are Combine-era patterns

### Concurrency Model (Swift 6.2)

- Default actor isolation: `nonisolated(nonsending)` — functions are nonisolated but cannot send values across isolation boundaries without explicit annotation
- Use `async/await` for all asynchronous work
- Use `TaskGroup` for parallel operations
- Use `Actor` for shared mutable state when needed
- Cancel tasks on view disappear via `.task { }` lifetime
- No Combine for new code — `AsyncSequence` replaces publishers

---

## Prohibited Patterns

These patterns MUST NOT appear in any story, spec, or generated code. Kickback immediately if found in ios-builder output.

| Pattern | Replacement | Reason |
|---------|-------------|--------|
| `ObservableObject` | `@Observable` macro | Combine-era, unnecessary boilerplate |
| `@Published` | Direct `var` on `@Observable` class | Combine-era, automatic with @Observable |
| `NavigationView` | `NavigationStack` | Deprecated since iOS 16 |
| `Combine` (new code) | `async/await` + `AsyncSequence` | Apple direction; Combine is maintenance-mode |
| Singletons (`shared`, `static let instance`) | `@Environment`-based DI | Untestable, hidden dependencies |
| `AnyView` | `@ViewBuilder` or conditional views | Type erasure kills SwiftUI diffing performance |
| Force unwrap `!` (except `IBOutlet`) | Optional binding, `guard let`, nil coalescing | Runtime crash risk |
| Implicitly unwrapped optionals (except `IBOutlet`) | Proper optionals | Runtime crash risk |
| Third-party HTTP clients (Alamofire, etc.) | `URLSession` | Unnecessary dependency for this project scope |
| `UIKit` (unless absolutely necessary) | SwiftUI native equivalent | Maintain pure SwiftUI architecture |
| `Core Data` | `SwiftData` | Modern Apple data persistence |
| `XCTest` (new tests) | Swift Testing (`@Test`, `@Suite`) | Modern testing framework |

---

## ATDD Pipeline Rules

### Acceptance Test Driven Development Flow

```
Architect writes spec (Given/When/Then)
  → Builder implements code to pass specs
    → Quality writes/runs automated acceptance tests
      → Quality reports PASS or FAIL with evidence
        → PASS: Architect marks story complete
        → FAIL: Architect reviews, issues kickback or amends spec
```

### Spec Contract Rules

1. **Only ios-architect writes or modifies acceptance criteria.** ios-builder and ios-quality may propose amendments, but ios-architect must approve and commit the change.
2. **Acceptance criteria use Given/When/Then format exclusively.** No free-form descriptions for testable behavior.
3. **Each scenario has exactly one "Then" assertion focus.** Multiple "And" clauses are acceptable, but the primary assertion must be singular and clear.
4. **Implementation details do not leak into specs.** Specs describe observable behavior, not internal structure. Naming a ViewModel class or specific method in a Given/When/Then is a spec violation.
5. **Specs reference the API contract, not backend internals.** Swift types from the API contract are valid references; Express route handlers or Zod schemas are not.

### Story Format

```markdown
## [STORY-ID] Title

**As a** [role],
**I want** [feature],
**So that** [benefit].

### Acceptance Criteria

**Scenario 1: [Name]**
- Given [precondition]
- When [action]
- Then [expected outcome]

**Scenario 2: [Name]**
- Given [precondition]
- When [action]
- Then [expected outcome]

**Scenario 3: [Name]**
- Given [precondition]
- When [action]
- Then [expected outcome]

### Technical Notes
- Architecture pattern: [MVVM, protocol DI, etc.]
- Prohibited patterns: [relevant subset]
- DI strategy: [Environment injection, protocol mock, etc.]

### File Ownership
- ios-builder MAY create/modify: [explicit file list]
- ios-builder MUST NOT modify: [boundary files]

### Complexity: [S/M/L]
```

---

## Kickback Protocol

### Rules

1. A **kickback** is issued when ios-builder or ios-quality delivers output that violates the spec contract, prohibited patterns, or file ownership boundaries.
2. Each kickback MUST be recorded in `memories.md` with: date, task ID, target agent, specific reason.
3. **Maximum 3 kickbacks per task.** On the third kickback, ios-architect issues a **full-stop escalation**:
   - All agents halt work on the task
   - ios-architect generates a diagnostic report
   - Diagnostic includes: all 3 kickback reasons, root cause hypothesis, recommended resolution
   - Diagnostic is formatted as a GitHub Issue template for human review
4. After escalation, work on the task does not resume until the human operator approves the resolution.

### Kickback Categories

| Category | Description | Example |
|----------|-------------|---------|
| `PROHIBITED_PATTERN` | Code uses a banned pattern | ObservableObject in a ViewModel |
| `SPEC_VIOLATION` | Implementation doesn't match acceptance criteria | Missing error state handling |
| `FILE_BOUNDARY` | Agent modified files outside ownership | ios-builder edited a test file |
| `CONTRACT_MISMATCH` | API types don't match contract | Wrong Codable field name |
| `ARCHITECTURE_DRIFT` | Structural deviation from architecture | Singleton instead of DI |

---

## File Ownership Boundaries

### ios-architect (this agent)

**Owns:**
- `{project-root}/_bmad/_memory/ios-architect-sidecar/**` — all sidecar files
- Acceptance specs and stories (wherever stored)
- CLAUDE.md, ARCHITECTURE.md, DESIGN_SYSTEM.md, AI_INTEGRATION.md (generated docs)

**May read (not write):**
- All backend source files for API contract analysis
- `docs/ios-swiftui-spec-wireframe.md`
- All teammate sidecar files (for coordination)

### ios-builder

**Owns:**
- `{AppName}/Sources/Features/**` — all feature modules
- `{AppName}/Sources/Core/**` — networking, storage, services, extensions
- `{AppName}/Sources/SharedUI/**` — reusable UI components
- `{AppName}/Sources/Intelligence/**` — Foundation Models integration
- `{AppName}/Sources/Resources/**` — assets, localization
- `{AppName}/{AppName}App.swift` — app entry point

**May NOT modify:**
- Test files (owned by ios-quality)
- Acceptance specs (owned by ios-architect)
- CI/CD configuration (owned by ios-release)

### ios-quality

**Owns:**
- `{AppName}/Tests/UnitTests/**` — all unit tests
- `{AppName}/Tests/UITests/**` — all UI tests
- Test fixtures and mock definitions
- Test coverage configuration

**May NOT modify:**
- Source code in `Sources/` (owned by ios-builder)
- Acceptance specs (owned by ios-architect)
- CI/CD configuration (owned by ios-release)

### ios-release

**Owns:**
- `.github/workflows/**` — CI/CD pipelines
- Fastlane configuration (if used)
- Signing and provisioning profiles configuration
- App Store metadata and screenshots configuration
- Release notes and changelog

**May NOT modify:**
- Source code in `Sources/` (owned by ios-builder)
- Test files (owned by ios-quality)
- Acceptance specs (owned by ios-architect)

---

## Backend API Surface Summary

The MDM Generator backend exposes 11 endpoints. Full contract details are in `knowledge/api-contract.md`.

| Endpoint | Method | Rate Limit | Purpose |
|----------|--------|------------|---------|
| `/health` | GET | global (60/min) | Health check |
| `/v1/whoami` | POST | global | Auth validation + user info + usage stats |
| `/v1/admin/set-plan` | POST | global | Admin: set user plan (requires admin claim) |
| `/v1/parse-narrative` | POST | 5/min | Parse narrative into structured fields (no quota) |
| `/v1/generate` | POST | 10/min | Legacy one-shot MDM generation |
| `/v1/build-mode/process-section1` | POST | 10/min | Initial eval: worst-first differential |
| `/v1/build-mode/process-section2` | POST | 10/min | Workup & results: MDM preview |
| `/v1/build-mode/finalize` | POST | 10/min | Treatment & disposition: final MDM |
| `/v1/quick-mode/generate` | POST | 10/min | One-shot MDM + patient identifier extraction |
| `/v1/surveillance/analyze` | POST | global | Regional trend analysis (Pro+ only) |
| `/v1/surveillance/report` | POST | global | PDF trend report download (Pro+ only) |

### Auth Pattern

- Firebase ID token sent as `userIdToken` in request body
- Some endpoints also accept Bearer token in Authorization header
- Token verified server-side via `admin.auth().verifyIdToken()`

### Subscription Tiers

| Tier | Monthly Quota | Max Tokens/Request | Surveillance | PDF Export |
|------|--------------|-------------------|--------------|-----------|
| Free | 10 | 2,000 | No | No |
| Pro | 250 | 8,000 | Yes | Yes |
| Enterprise | 1,000 | 16,000 | Yes | Yes |

### Build Mode Constraints

- **Section locking:** Max 2 submissions per section, then locked
- **Section progression:** S1 must complete before S2; S2 must complete before S3 (server-enforced)
- **Quota counting:** Counted once per encounter (on first S1 submission), not per section
- **Encounter ownership:** Each encounter is scoped to `customers/{uid}/encounters/{encounterId}`

---

## MDM-Specific Architectural Notes

### Worst-First Differential

The MDM Generator follows Emergency Medicine standards: life-threatening conditions surface first in the differential diagnosis. This is non-negotiable in all display logic, sorting, and UI presentation.

### PHI Constraints

- **NO Protected Health Information** may appear in code, logs, comments, or persistent storage on the client beyond the active session
- All medical content is transient — display only, never cached to disk
- Educational use only — always display physician review disclaimer
- No real patient data in test fixtures or previews

### Copy-Paste Output

The final MDM text must be copy-pastable directly into an EHR system. This means:
- No HTML formatting, no markdown rendering in the copy buffer
- Plain text with consistent line breaks
- All required MDM sections present
- Explicit defaults for missing information
