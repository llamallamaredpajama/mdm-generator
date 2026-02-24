# iOS SwiftUI Development Spec Suite — Master Wireframe

## Purpose

This document is a **wireframe blueprint** for generating a complete, cross-referenced iOS development specification suite. It is designed to be consumed by **Claude Code using agent teams in tmux**, where separate agents handle separate documents while maintaining consistency through shared constants defined here.

**Target Platform:** iOS 26+ / iPadOS 26+ / Xcode 26 / Swift 6.2
**Architecture:** Modern MVVM + @Observable + async/await
**Design System:** Liquid Glass (WWDC 2025)
**On-Device AI:** Foundation Models Framework
**Target Apps:** Lootr (fintech/retirement planning), MDM Generator (medical), future projects

---

## Agent Team Structure

### Recommended tmux Layout

```
┌─────────────────────────────────────────────────────┐
│ AGENT 0: Orchestrator                               │
│ Reads this wireframe, spawns agents, validates       │
│ cross-references and consistency on completion        │
├──────────────────────┬──────────────────────────────┤
│ AGENT 1:             │ AGENT 2:                     │
│ CLAUDE.md            │ ARCHITECTURE.md              │
│ (Master dev guide)   │ (Technical patterns)         │
├──────────────────────┼──────────────────────────────┤
│ AGENT 3:             │ AGENT 4:                     │
│ DESIGN_SYSTEM.md     │ AI_INTEGRATION.md            │
│ (Liquid Glass +      │ (Foundation Models +         │
│  UI patterns)        │  HealthKit + on-device)      │
├──────────────────────┼──────────────────────────────┤
│ AGENT 5:             │ AGENT 6:                     │
│ PRD_TEMPLATE.md      │ AGENT_SKILLS/                │
│ (Product req         │ (Claude Code skill files     │
│  template)           │  for code generation)        │
└──────────────────────┴──────────────────────────────┘
```

### Execution Order

1. **AGENT 0** reads this wireframe in full, then spawns AGENT 1 first
2. **AGENT 1** (CLAUDE.md) completes first — it is the source of truth
3. **AGENTS 2-4** can run in parallel — they reference CLAUDE.md conventions
4. **AGENT 5** (PRD template) runs after AGENTS 2-4 complete, as it references all technical docs
5. **AGENT 6** (Agent Skills) runs last — it distills all docs into actionable code-gen instructions
6. **AGENT 0** performs final cross-reference validation pass

---

## Shared Constants (All Agents Must Use These)

### Naming Conventions

```
Project Structure:
  {AppName}/
  ├── {AppName}App.swift              # @main entry point
  ├── Sources/
  │   ├── Features/                   # Feature modules (one per screen/flow)
  │   │   └── {FeatureName}/
  │   │       ├── {FeatureName}View.swift
  │   │       ├── {FeatureName}ViewModel.swift
  │   │       └── {FeatureName}Models.swift
  │   ├── Core/
  │   │   ├── Networking/             # API client, request/response types
  │   │   ├── Storage/                # SwiftData models, persistence
  │   │   ├── Services/               # Business logic services
  │   │   └── Extensions/             # Swift/SwiftUI extensions
  │   ├── SharedUI/                   # Reusable UI components
  │   │   ├── Components/             # Buttons, cards, inputs
  │   │   ├── Modifiers/              # Custom ViewModifiers
  │   │   └── Styles/                 # Custom styles and themes
  │   ├── Intelligence/               # Foundation Models integration
  │   │   ├── AIManager.swift
  │   │   ├── Tools/                  # Custom Tool definitions
  │   │   └── Generable/              # @Generable model definitions
  │   └── Resources/                  # Assets, localization
  ├── Tests/
  │   ├── UnitTests/
  │   └── UITests/
  └── CLAUDE.md
```

### Swift Style Constants

```
Minimum deployment target: iOS 26.0
Swift version: 6.2
Default actor isolation: nonisolated(nonsending) (Swift 6.2 default)
Observation: @Observable macro (never ObservableObject)
State ownership: @State for view-owned, @Environment for shared
Dependency injection: Protocol-based with Environment
Concurrency: async/await + structured concurrency (no Combine for new code)
Data persistence: SwiftData (not Core Data for new projects)
Navigation: NavigationStack + NavigationPath (programmatic)
Error handling: Swift typed throws where appropriate
```

### Liquid Glass Design Constants

```
Glass variants: .regular, .clear, .identity
Tinting: .glassEffect(.regular.tint(.accentColor)) — semantic meaning only
Interactive: .glassEffect(.regular.interactive()) — for tappable elements
Grouping: GlassEffectContainer { } — for morphing animations
Identity: .glassEffectID("identifier", in: namespace) — for transitions
Shapes: Capsule (default), RoundedRectangle, Circle, custom Shape

Rules:
  - Glass is for controls and navigation ONLY, never main content
  - Never stack glass on glass (glass cannot sample other glass)
  - Never add .blur, .opacity, or solid .background behind glassEffect
  - Use full-bleed imagery/content behind glass for best effect
  - Use ZStack with content below, glass controls above
  - Recompile with Xcode 26 gets automatic adoption for standard controls
  - Custom UI requires explicit glassEffect() adoption
  - One-year grace period to opt out via Info.plist
```

### Foundation Models Constants

```
Framework: import FoundationModels
Model: SystemLanguageModel.default (3B parameter, on-device)
Session: LanguageModelSession(instructions:)
Response: session.respond(to:) or session.streamResponse(to:)
Structured output: @Generable macro on output structs
Guided generation: @Guide macro for constrained outputs
Tool calling: Conform to Tool protocol
Streaming: AsyncSequence of partial responses (snapshots)
Availability check: SystemLanguageModel.Availability

Constraints:
  - NOT designed for world knowledge or advanced reasoning
  - Best for: classification, summarization, extraction, generation, search suggestions
  - 3B parameters — smaller than cloud models, optimized for on-device
  - Requires Apple Intelligence enabled on device
  - Minimum: iPhone 15 Pro, iPad with M1+, Mac with M1+
  - Always check .availability before use
  - Default safety guardrails cannot be disabled
```

### API/Networking Constants

```
HTTP client: URLSession (native, no third-party)
JSON: Codable with JSONDecoder/JSONEncoder
Auth pattern: Token-based via Keychain storage
Request pattern: Generic async throwing functions
Error type: App-specific error enum conforming to LocalizedError
Retry: Exponential backoff for transient failures
Offline: Graceful degradation with cached data
```

---

## Document Specifications

---

### DOCUMENT 1: CLAUDE.md (Agent 1)

**Purpose:** Master development guidelines file that lives in the project root. This is the primary reference Claude Code reads before writing any code.

**Filename:** `CLAUDE.md`
**Location:** Project root
**Approximate length:** 400-600 lines

#### Sections to Include

```
1. PROJECT OVERVIEW
   - App name, purpose, target audience
   - Platform targets (iOS 26+, iPadOS 26+)
   - Placeholder: {{APP_NAME}}, {{APP_DESCRIPTION}}, {{TARGET_AUDIENCE}}
   - Link to PRD for full requirements

2. TECH STACK
   - Swift 6.2, SwiftUI, SwiftData
   - Xcode 26
   - Foundation Models Framework
   - HealthKit (if medical app) or relevant frameworks
   - Backend: existing API (describe endpoints pattern)
   - No third-party dependencies unless explicitly approved
   - Approved packages list (empty by default)

3. ARCHITECTURE
   - MVVM with @Observable
   - Feature-based module organization
   - Reference ARCHITECTURE.md for full patterns
   - Quick example of ViewModel pattern:
     @Observable final class ExampleViewModel {
         var items: [Item] = []
         var isLoading = false
         var error: String?
         private let service: ServiceProtocol
         init(service: ServiceProtocol = ServiceImpl()) { self.service = service }
         func load() async { ... }
     }
   - Quick example of View pattern:
     struct ExampleView: View {
         @State var viewModel = ExampleViewModel()
         var body: some View { ... }
         .task { await viewModel.load() }
     }

4. SWIFT CONVENTIONS
   - Swift 6.2 concurrency: nonisolated(nonsending) default
   - @MainActor for ViewModels and UI-bound code
   - async/await for all asynchronous work
   - No Combine in new code (existing Combine is OK during migration)
   - Typed throws where error types are bounded
   - Access control: explicit (internal default, public for module API)
   - Guard-early-return pattern over nested if/else
   - Protocol-oriented design for testability
   - Naming: verbs for methods, nouns for properties, -able/-ing for protocols

5. SWIFTUI CONVENTIONS
   - @Observable for all view models (never ObservableObject)
   - @State for view-owned model instances
   - @Environment for shared dependencies
   - @Bindable for creating bindings to @Observable properties
   - NavigationStack for all navigation (never NavigationView)
   - .task { } for async work on view appear
   - ViewModifier for reusable view modifications
   - Prefer composition over inheritance for views
   - Extract subviews at ~30 lines of body content
   - Preview with #Preview macro

6. LIQUID GLASS DESIGN RULES
   - Reference DESIGN_SYSTEM.md for full guide
   - Quick rules: glass above content, never on content
   - Use standard controls (automatic adoption)
   - Custom glass: .glassEffect() modifier
   - Never glass-on-glass
   - Full-bleed backgrounds for best effect
   - GlassEffectContainer for grouped morphing

7. ON-DEVICE AI RULES
   - Reference AI_INTEGRATION.md for full patterns
   - Always check SystemLanguageModel.availability
   - Graceful fallback when model unavailable
   - Use @Generable for structured outputs
   - Never rely on model for factual/world knowledge
   - Session management: create per-feature, not global

8. DATA LAYER
   - SwiftData for local persistence
   - @Model macro for data models
   - ModelContainer configured at App level
   - @Query in views for reactive data
   - Model inheritance (iOS 26+ only)
   - Migration: use VersionedSchema + SchemaMigrationPlan

9. NETWORKING
   - URLSession-based API client
   - Generic request/response with Codable
   - Keychain for sensitive tokens
   - Structured error handling
   - Retry with exponential backoff
   - Offline support with cached data

10. TESTING
    - Unit tests: ViewModels, Services, Models
    - Protocol mocks for dependency injection
    - @Testing macro (Swift Testing framework, not XCTest for new tests)
    - UI tests for critical user flows
    - Test naming: test_{methodName}_{scenario}_{expectedResult}
    - No testing of private methods directly

11. FILE ORGANIZATION
    - Feature-based modules (not layer-based)
    - One type per file (with small related types OK)
    - File naming matches primary type name
    - Group by feature, then by role
    - Full project structure reference (from Shared Constants above)

12. GIT CONVENTIONS
    - Conventional commits: feat:, fix:, refactor:, docs:, test:, chore:
    - Branch naming: feature/{description}, fix/{description}
    - PR descriptions reference requirements

13. PROHIBITED PATTERNS
    - No ObservableObject (use @Observable)
    - No @Published (use @Observable properties)
    - No NavigationView (use NavigationStack)
    - No Combine for new code
    - No force unwrapping (except IBOutlet legacy)
    - No implicitly unwrapped optionals (except IBOutlet legacy)
    - No AnyView (use @ViewBuilder or conditional views)
    - No singletons (use Environment-based DI)
    - No third-party HTTP clients (use URLSession)
    - No UIKit unless absolutely necessary (prefer SwiftUI native)
```

#### Cross-References
- Links to: ARCHITECTURE.md, DESIGN_SYSTEM.md, AI_INTEGRATION.md, PRD

---

### DOCUMENT 2: ARCHITECTURE.md (Agent 2)

**Purpose:** Detailed technical architecture patterns with complete code examples. This is the deep-dive reference for how to build each layer.

**Filename:** `ARCHITECTURE.md`
**Location:** Project root `/docs/`
**Approximate length:** 600-900 lines

#### Sections to Include

```
1. ARCHITECTURE OVERVIEW
   - Diagram: View → ViewModel → Service → Repository → API/SwiftData
   - Unidirectional data flow explanation
   - Dependency injection strategy (protocol + Environment)
   - Why MVVM + @Observable (not TCA, not MV, not VIPER)
     - Brief rationale: pragmatic, testable, aligns with Apple's patterns
     - @Observable eliminates Combine boilerplate
     - Feature-based modules prevent god objects
     - Protocol DI enables clean testing without frameworks

2. VIEW LAYER PATTERNS
   - Complete View template with all conventions:
     - @State var viewModel initialization
     - .task for data loading
     - Error handling with alert/overlay
     - Loading states
     - Empty states
     - Pull to refresh
     - Search integration
   - Subview extraction rules (when and how)
   - ViewModifier patterns for reusable behavior
   - @ViewBuilder usage for conditional content
   - Accessibility: labels, traits, dynamic type support
   - Liquid Glass integration points (reference DESIGN_SYSTEM.md)

3. VIEWMODEL LAYER PATTERNS
   - Complete ViewModel template:
     @Observable final class {Feature}ViewModel {
         // MARK: - Published State
         var items: [Item] = []
         var isLoading = false
         var errorMessage: String?
         var searchText = ""
         
         // MARK: - Private
         private let service: {Feature}ServiceProtocol
         
         // MARK: - Init
         init(service: {Feature}ServiceProtocol = {Feature}Service()) {
             self.service = service
         }
         
         // MARK: - Public Methods
         func load() async { ... }
         func refresh() async { ... }
         func delete(_ item: Item) async { ... }
         
         // MARK: - Computed Properties
         var filteredItems: [Item] {
             searchText.isEmpty ? items : items.filter { ... }
         }
     }
   - @MainActor annotation strategy
   - Error handling patterns (map API errors to user-facing messages)
   - Cancellation handling for async work
   - Debouncing search input (using Task + sleep, not Combine)

4. SERVICE LAYER PATTERNS
   - Protocol definition pattern:
     protocol {Feature}ServiceProtocol: Sendable {
         func fetchItems() async throws -> [Item]
         func createItem(_ item: Item) async throws -> Item
         func deleteItem(id: String) async throws
     }
   - Implementation with API client injection
   - Caching strategy (in-memory + SwiftData)
   - Offline-first pattern

5. NETWORKING LAYER
   - APIClient implementation:
     - Generic request<T: Decodable>(endpoint:method:body:) async throws -> T
     - Endpoint enum pattern with URL construction
     - Request interceptor for auth tokens
     - Response validation and error mapping
     - Retry logic with exponential backoff
   - Complete code example of APIClient
   - Token refresh flow
   - Multipart upload pattern
   - WebSocket pattern (if needed)

6. DATA LAYER (SwiftData)
   - @Model definitions with relationships
   - ModelContainer setup at App level
   - @Query usage in views
   - Background context operations
   - Migration with VersionedSchema
   - Model inheritance (iOS 26 feature)
   - Sync with remote API pattern
   - Complete CRUD example

7. NAVIGATION
   - NavigationStack + NavigationPath
   - Router pattern:
     @Observable final class Router {
         var path = NavigationPath()
         func navigate(to destination: Destination) { path.append(destination) }
         func pop() { path.removeLast() }
         func popToRoot() { path = NavigationPath() }
     }
   - Destination enum with Hashable conformance
   - Deep linking support
   - Sheet/fullScreenCover presentation
   - Tab-based navigation with TabView (Liquid Glass tab bar)

8. DEPENDENCY INJECTION
   - Environment-based DI pattern:
     - Define EnvironmentKey
     - Extend EnvironmentValues
     - Inject at App level
     - Consume in Views and pass to ViewModels
   - Mock injection for previews and tests
   - Service locator alternative for non-view contexts

9. ERROR HANDLING
   - App-level error enum:
     enum AppError: LocalizedError {
         case network(NetworkError)
         case api(APIError) 
         case storage(StorageError)
         case ai(AIError)
         var errorDescription: String? { ... }
     }
   - Error presentation: toast, alert, inline, full-screen
   - Retry affordances
   - Crash reporting integration point

10. CONCURRENCY PATTERNS
    - Task management in ViewModels
    - Task cancellation on view disappear
    - TaskGroup for parallel operations
    - Actor-based shared state when needed
    - @MainActor boundary management
    - nonisolated(nonsending) implications in Swift 6.2

11. SECURITY
    - Keychain wrapper for tokens/credentials
    - Certificate pinning (if applicable)
    - Biometric auth (Face ID / Touch ID) pattern
    - Data encryption at rest
    - Secure coding practices checklist

12. PERFORMANCE
    - LazyVStack/LazyHStack for large lists
    - .task with pagination
    - Image caching strategy
    - Instruments profiling targets
    - SwiftUI view identity and lifetime management
    - @Observable property-level tracking (no unnecessary redraws)
```

#### Cross-References
- Referenced by: CLAUDE.md (section 3)
- Links to: DESIGN_SYSTEM.md (section 2), AI_INTEGRATION.md (section 7)

---

### DOCUMENT 3: DESIGN_SYSTEM.md (Agent 3)

**Purpose:** Complete Liquid Glass design system guide with SwiftUI implementation patterns. Covers visual design, component library, and interaction patterns.

**Filename:** `DESIGN_SYSTEM.md`
**Location:** Project root `/docs/`
**Approximate length:** 400-600 lines

#### Sections to Include

```
1. LIQUID GLASS OVERVIEW
   - What Liquid Glass is and its design philosophy
   - Automatic adoption: recompile with Xcode 26
   - Custom adoption: glassEffect() API
   - Opt-out mechanism (one-year grace period, Info.plist key)
   - Design principle: glass elevates controls above content
   - Full-bleed backgrounds are essential for the effect

2. GLASS API REFERENCE
   - .glassEffect(_:in:isEnabled:)
     - Glass variants: .regular, .clear, .identity
     - Shape parameter: Capsule (default), RoundedRectangle, Circle
     - isEnabled: for conditional application
   - .tint(_:) — semantic meaning only (primary actions, states)
   - .interactive() — enables scaling, bouncing, shimmering on tap
   - GlassEffectContainer — groups glass elements for shared rendering
   - .glassEffectID(_:in:) — morphing transitions between elements
   - @Namespace for identity coordination
   
   Code examples for each API:
   - Basic glass button
   - Tinted action button
   - Interactive toggle
   - Morphing menu (expand/collapse)
   - Grouped toolbar items
   - Custom floating controls (Maps-style)

3. LAYOUT PATTERNS
   - ZStack pattern: content below, glass controls above
   - DO: Full-bleed imagery behind glass
   - DON'T: Solid fills behind glass
   - DON'T: Blur or opacity on glass views
   - DON'T: Glass on glass (use GlassEffectContainer instead)
   - Tab bar: TabView automatic Liquid Glass adoption
   - Navigation: NavigationSplitView glass sidebar (iPad)
   - Toolbar: automatic glass adoption, ToolbarSpacer for layout
   - Sheet backgrounds: remove custom backgrounds for glass effect

4. COMPONENT LIBRARY
   Define reusable glass components for the app:
   
   a. GlassCard — content card with glass background
      - Use for: dashboard widgets, summary cards
      - Parameters: shape, tint, interactive
   
   b. GlassButton — floating action button
      - Use for: primary actions, FABs
      - Supports: icon-only, icon+label, label-only
   
   c. GlassToolbar — custom floating toolbar
      - Use for: context-specific actions
      - Supports: expand/collapse morphing
   
   d. GlassChip — filter/tag chip
      - Use for: category filters, selection chips
      - Supports: selected state with tint
   
   e. GlassBanner — notification/status banner
      - Use for: alerts, status messages
      - Supports: dismiss, action button

5. COLOR AND TYPOGRAPHY
   - Vibrant text: SwiftUI auto-applies for legibility on glass
   - Semantic colors: use system colors, not hardcoded
   - Dynamic Type: support all text sizes
   - SF Symbols 7: new symbols, use symbolEffect for animations
   - Dark mode: glass adapts automatically
   - Accessibility: Reduce Transparency support

6. ANIMATION AND TRANSITIONS
   - Symbol transitions: .contentTransition(.symbolEffect(.replace))
   - Glass morphing: glassEffectID coordination
   - Standard SwiftUI animations work with glass
   - Caution: rotationEffect can cause glass shape glitches
   - Window resize animations (iPad)

7. APP ICON
   - Icon Composer in Xcode 26 for layered icons
   - Support: Light, Dark, Clear, Tinted appearances
   - Multi-layer design for dynamic system effects
   - Export for all platforms

8. PLATFORM ADAPTATIONS
   - iPhone: Liquid Glass tab bar, toolbar
   - iPad: Glass sidebar, menu bar on swipe-down, flexible windowing
   - visionOS: widgets with glass/paper styles (future consideration)
   
9. BACKWARD COMPATIBILITY
   - #available(iOS 26, *) checks for glass APIs
   - Fallback: .ultraThinMaterial or custom material
   - Strategy: GlassKit abstraction layer pattern
     - Screens reference GlassKit, not raw APIs
     - GlassKit switches implementation behind #available
     - Swap to real glass on iOS 26, material fallback on iOS 17+
```

#### Cross-References
- Referenced by: CLAUDE.md (section 6), ARCHITECTURE.md (section 2)
- Links to: Component examples in AGENT_SKILLS

---

### DOCUMENT 4: AI_INTEGRATION.md (Agent 4)

**Purpose:** Complete guide for integrating Apple's Foundation Models framework and related on-device intelligence features. Special attention to medical and fintech use cases.

**Filename:** `AI_INTEGRATION.md`
**Location:** Project root `/docs/`
**Approximate length:** 500-700 lines

#### Sections to Include

```
1. FOUNDATION MODELS OVERVIEW
   - Framework purpose and capabilities
   - 3B parameter on-device LLM
   - Privacy-first, offline, free
   - Supported platforms: iOS 26, iPadOS 26, macOS 26, visionOS 26
   - Device requirements (Apple Intelligence compatible)
   - What it's good at: classification, summarization, extraction, generation
   - What it's NOT for: world knowledge, advanced reasoning, math
   - Safety guardrails (always on, cannot disable)

2. BASIC USAGE
   - Import and model access:
     import FoundationModels
     let model = SystemLanguageModel.default
   - Availability checking (CRITICAL — always check):
     switch model.availability {
     case .available: // proceed
     case .unavailable(let reason): // handle reason
     }
   - Unavailable reasons:
     - .deviceNotEligible
     - .appleIntelligenceNotEnabled
     - .modelNotReady (downloading)
   - Creating a session:
     let session = LanguageModelSession {
         "You are a helpful assistant for {context}."
     }
   - Simple response:
     let response = try await session.respond(to: "Summarize this text: ...")
   - Streaming response:
     for try await partial in session.streamResponse(to: prompt) {
         // update UI with partial.content
     }

3. GUIDED GENERATION (@Generable)
   - Purpose: structured, type-safe output from the model
   - @Generable macro on output structs:
     @Generable
     struct MedicationSummary {
         @Guide(description: "Drug name as prescribed")
         var name: String
         @Guide(description: "Dosage amount and frequency")
         var dosage: String
         @Guide(description: "Primary therapeutic purpose")
         var purpose: String
         @Guide(description: "Key warnings or interactions")
         var warnings: [String]
     }
   - Using guided generation:
     let summary: MedicationSummary = try await session.respond(
         to: "Extract medication info from: \(text)",
         generating: MedicationSummary.self
     )
   - Supported types in @Generable: String, Int, Double, Bool, Array, Optional, enum
   - Nested @Generable structs
   - Enum constraints for classification tasks

4. TOOL CALLING
   - Purpose: let the model invoke app functions for additional context
   - Tool protocol conformance:
     struct LookupMedication: Tool {
         let name = "lookup_medication"
         let description = "Look up medication information by name"
         
         struct Input: Codable {
             let medicationName: String
         }
         
         struct Output: Codable {
             let info: MedicationInfo
         }
         
         func call(input: Input) async throws -> Output {
             // Call your API or local database
             let info = try await medicationService.lookup(input.medicationName)
             return Output(info: info)
         }
     }
   - Registering tools with session
   - Multi-tool orchestration
   - Error handling in tools

5. SESSION MANAGEMENT
   - Stateful sessions for multi-turn conversation
   - Transcript persistence and restoration
   - Session lifecycle: create per-feature, not global
   - Memory management: sessions hold context, release when done
   - Instructions builder DSL for complex system prompts

6. SWIFTUI INTEGRATION PATTERNS
   - AIManager as @Observable:
     @Observable final class AIManager {
         var isAvailable = false
         var isProcessing = false
         var result: String = ""
         var error: String?
         
         private var session: LanguageModelSession?
         
         func checkAvailability() { ... }
         func summarize(_ text: String) async { ... }
         func classify(_ content: String) async -> ContentCategory { ... }
         func streamResponse(for prompt: String) -> AsyncStream<String> { ... }
     }
   - Streaming UI pattern (text appears word by word)
   - Loading/processing states
   - Error handling and fallback UI
   - Cancellation support

7. USE CASE: MEDICAL (MDM Generator)
   - Clinical text summarization
   - Medication interaction flagging (with HealthKit Medications API)
   - Differential diagnosis suggestion support
   - Structured data extraction from clinical notes
   - Important disclaimers and limitations:
     - NOT a diagnostic tool
     - Always present as "suggestions" not "diagnoses"
     - Must have physician review
     - Document model limitations clearly in UI
   - @Generable models for clinical data:
     - DifferentialDiagnosis
     - MedicationReview
     - ClinicalSummary
     - RiskAssessment

8. USE CASE: FINTECH (Lootr)
   - Financial data summarization
   - Account categorization
   - Spending pattern analysis
   - Natural language query of financial data
   - Retirement scenario description generation
   - Risk tolerance assessment via conversation

9. HEALTHKIT MEDICATIONS API (iOS 26)
   - New API overview:
     - HKUserAnnotatedMedication — represents a medication
     - HKMedicationDoseEvent — represents logged doses
     - HKUserAnnotatedMedicationQueryDescriptor — fetch medications
   - Authorization flow for medication data
   - Querying medications:
     let descriptor = HKUserAnnotatedMedicationQueryDescriptor()
     let medications = try await descriptor.result(for: healthStore)
   - Anchored queries for updates
   - Integration with Foundation Models for medication analysis
   - Privacy considerations and data handling

10. PERFORMANCE AND OPTIMIZATION
    - Instruments integration for Foundation Models profiling
    - Latency expectations (on-device inference time)
    - Batch vs. streaming response tradeoffs
    - Cache generated results when appropriate
    - Background processing considerations
    - Memory pressure handling

11. TESTING AI FEATURES
    - Mock LanguageModelSession for unit tests
    - Test @Generable output parsing
    - Test tool calling independently
    - UI tests for AI-powered flows
    - Edge cases: unavailable model, slow response, partial response
```

#### Cross-References
- Referenced by: CLAUDE.md (section 7), ARCHITECTURE.md (section 7)
- Links to: HealthKit patterns in ARCHITECTURE.md

---

### DOCUMENT 5: PRD_TEMPLATE.md (Agent 5)

**Purpose:** A reusable Product Requirements Document template pre-configured for iOS 26 apps. Includes sections for all platform capabilities discovered in research. Can be duplicated and filled in for each app (Lootr, MDM Generator, etc.)

**Filename:** `PRD_TEMPLATE.md`
**Location:** Project root `/docs/`
**Approximate length:** 300-400 lines

#### Sections to Include

```
1. PRODUCT OVERVIEW
   - App name: {{APP_NAME}}
   - One-line description: {{DESCRIPTION}}
   - Target audience: {{AUDIENCE}}
   - Platform: iOS 26+ (iPhone, iPad)
   - Business model: {{BUSINESS_MODEL}}

2. PROBLEM STATEMENT
   - What problem does this solve?
   - Who has this problem?
   - What existing solutions exist?
   - Why is a native iOS app the right solution?

3. USER PERSONAS
   - Primary persona template
   - Secondary persona template
   - Include: demographics, goals, pain points, tech comfort

4. CORE FEATURES (MVP)
   - Feature 1: {{name}}, {{description}}, {{priority}}
   - Feature N: ...
   - Each feature should note:
     - iOS 26 capabilities it leverages
     - Foundation Models integration (if applicable)
     - HealthKit integration (if applicable)
     - App Intents / Siri integration (if applicable)
     - Offline capability requirement

5. iOS 26 FEATURE INTEGRATION CHECKLIST
   Evaluate each for inclusion:
   
   [ ] Liquid Glass design adoption
   [ ] Foundation Models (on-device AI)
       - Specific use case: {{describe}}
   [ ] HealthKit Medications API
       - Specific use case: {{describe}}
   [ ] App Intents & Interactive Snippets
       - Siri integration: {{describe}}
       - Spotlight integration: {{describe}}
       - Shortcuts integration: {{describe}}
   [ ] Widgets (with Liquid Glass)
       - Home screen widget: {{describe}}
       - Lock screen widget: {{describe}}
   [ ] Live Activities
       - Use case: {{describe}}
   [ ] SwiftData
       - Local data models: {{describe}}
   [ ] Chart3D
       - 3D visualization needs: {{describe}}
   [ ] Native WebView (SwiftUI)
       - Web content needs: {{describe}}
   [ ] Rich TextEditor
       - Text editing needs: {{describe}}
   [ ] PaperKit
       - Drawing/markup needs: {{describe}}
   [ ] HealthKit Workouts on iOS
       - Fitness tracking: {{describe}}
   [ ] MapKit / GeoToolbox
       - Location features: {{describe}}
   [ ] StoreKit / In-App Purchase
       - Monetization: {{describe}}

6. BACKEND INTEGRATION
   - Existing backend: {{YES/NO}}
   - Backend technology: {{describe}}
   - API endpoints needed: list
   - Authentication method: {{describe}}
   - Data sync strategy: {{describe}}
   - Offline-first: {{YES/NO}}

7. USER FLOWS
   - Onboarding flow
   - Core loop (primary user journey)
   - Settings/preferences
   - Error states
   - Empty states

8. NON-FUNCTIONAL REQUIREMENTS
   - Performance: launch time, response time targets
   - Security: data encryption, auth requirements
   - Accessibility: WCAG compliance level
   - Localization: supported languages
   - Privacy: data collection, tracking transparency
   - App size target

9. TECHNICAL CONSTRAINTS
   - Minimum iOS version: 26.0
   - Device support: iPhone, iPad (specify models if relevant)
   - Architecture: MVVM + @Observable (per ARCHITECTURE.md)
   - Design system: Liquid Glass (per DESIGN_SYSTEM.md)
   - AI integration: Foundation Models (per AI_INTEGRATION.md)

10. SUCCESS METRICS
    - KPIs for launch
    - Engagement metrics
    - Performance benchmarks
    - User satisfaction targets

11. TIMELINE & MILESTONES
    - Phase 1: MVP features
    - Phase 2: Enhanced features
    - Phase 3: AI-powered features
    - App Store submission target

12. RISKS & MITIGATIONS
    - Technical risks
    - Market risks
    - Dependency risks (e.g., Foundation Models availability)
```

#### Cross-References
- Links to: CLAUDE.md, ARCHITECTURE.md, DESIGN_SYSTEM.md, AI_INTEGRATION.md

---

### DOCUMENT 6: AGENT_SKILLS/ (Agent 6)

**Purpose:** Claude Code skill files that encode the patterns from all other documents into actionable code generation instructions. These are the files Claude Code reads when generating specific types of code.

**Location:** Project root `.claude/skills/` or as configured
**Files to generate:**

```
SKILL: swiftui-view.md
  Purpose: How to generate a SwiftUI view
  Contains:
  - View template with @State viewModel, .task, error handling
  - Liquid Glass integration points
  - Accessibility requirements
  - Subview extraction rules
  - Preview configuration
  - Common patterns: list, detail, form, dashboard

SKILL: viewmodel.md
  Purpose: How to generate a ViewModel
  Contains:
  - @Observable class template
  - @MainActor usage
  - State properties, computed properties
  - async method patterns
  - Error handling
  - Cancellation
  - Testing considerations

SKILL: networking.md
  Purpose: How to generate networking code
  Contains:
  - APIClient template
  - Endpoint enum pattern
  - Request/response handling
  - Error mapping
  - Auth token management
  - Retry logic

SKILL: swiftdata-model.md
  Purpose: How to generate SwiftData models
  Contains:
  - @Model class template
  - Relationship definitions
  - Migration patterns
  - @Query usage in views
  - ModelContainer setup

SKILL: foundation-models.md
  Purpose: How to generate Foundation Models integration
  Contains:
  - AIManager template
  - @Generable struct patterns
  - Tool definition pattern
  - Session management
  - Streaming UI pattern
  - Availability checking

SKILL: liquid-glass-component.md
  Purpose: How to generate Liquid Glass UI components
  Contains:
  - GlassCard, GlassButton, GlassToolbar templates
  - glassEffect usage patterns
  - GlassEffectContainer grouping
  - Morphing animation setup
  - Backward compatibility pattern

SKILL: app-intents.md
  Purpose: How to generate App Intents for system integration
  Contains:
  - AppIntent struct template
  - AppEntity definition
  - Interactive snippet pattern
  - Siri integration
  - Spotlight search integration

SKILL: testing.md
  Purpose: How to generate tests
  Contains:
  - Swift Testing (@Test, @Suite) patterns
  - ViewModel test template
  - Service mock template
  - UI test template
  - AI feature test template (mock session)
```

#### Cross-References
- Each skill file references the corresponding section in ARCHITECTURE.md, DESIGN_SYSTEM.md, or AI_INTEGRATION.md

---

## Validation Checklist (Agent 0 — Final Pass)

After all documents are generated, the orchestrator agent must verify:

```
CONSISTENCY CHECKS:
[ ] All documents reference Swift 6.2 (not 5.x or 6.0/6.1)
[ ] All documents reference iOS 26 (not iOS 18 or earlier)
[ ] All documents use @Observable (never ObservableObject)
[ ] All documents use NavigationStack (never NavigationView)
[ ] All documents use async/await (never Combine for new code)
[ ] All documents use SwiftData (never Core Data for new projects)
[ ] All documents reference Liquid Glass consistently
[ ] All documents reference Foundation Models consistently
[ ] CLAUDE.md prohibited patterns list matches all other docs
[ ] Project structure is identical across all documents
[ ] Naming conventions are identical across all documents

CROSS-REFERENCE CHECKS:
[ ] CLAUDE.md links to ARCHITECTURE.md, DESIGN_SYSTEM.md, AI_INTEGRATION.md
[ ] ARCHITECTURE.md references DESIGN_SYSTEM.md for UI patterns
[ ] ARCHITECTURE.md references AI_INTEGRATION.md for AI patterns
[ ] PRD_TEMPLATE.md references all technical docs
[ ] All AGENT_SKILLS reference their parent documents
[ ] No broken internal links

COMPLETENESS CHECKS:
[ ] Every iOS 26 feature from research is addressed in at least one doc
[ ] Foundation Models: @Generable, @Guide, Tool, streaming all covered
[ ] Liquid Glass: glassEffect, GlassEffectContainer, glassEffectID all covered
[ ] HealthKit Medications API covered in AI_INTEGRATION.md
[ ] App Intents interactive snippets covered
[ ] SwiftData model inheritance covered
[ ] Swift 6.2 concurrency defaults covered
[ ] Chart3D mentioned as available capability
[ ] Native WebView in SwiftUI mentioned
[ ] Icon Composer mentioned for app icon creation

PRACTICAL CHECKS:
[ ] Code examples compile conceptually (no obvious syntax errors)
[ ] Patterns are internally consistent (DI approach same everywhere)
[ ] Templates have clear placeholder syntax: {{PLACEHOLDER}}
[ ] Each document can stand alone but benefits from the full suite
[ ] Agent skills are actionable (Claude Code can follow them to generate code)
```

---

## Notes for the Claude Code Session

1. **Start by reading this entire wireframe** before generating any documents
2. **Generate CLAUDE.md first** — it is the source of truth all others reference
3. **Use the Shared Constants section** as the canonical reference for all technical decisions
4. **Each document should be self-contained enough** to be useful on its own, but should cross-reference other docs where appropriate
5. **Code examples should be complete and compilable** — no pseudo-code or handwaving
6. **Prefer concrete examples over abstract descriptions** — show the pattern, then explain it
7. **The PRD is a template** with {{placeholders}} — do NOT fill in Lootr or MDM specifics, keep it generic
8. **Agent skills should be concise** — under 200 lines each, focused on actionable patterns
9. **All documents target a developer who is new to iOS but experienced in web/TypeScript** — explain Swift/iOS idioms but don't over-explain programming basics
10. **When in doubt, follow Apple's official recommendations** from WWDC 2025 sessions
