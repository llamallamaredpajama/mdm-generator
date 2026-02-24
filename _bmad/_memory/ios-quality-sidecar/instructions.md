# iOS Quality Engineer — Standing Instructions

## Shared Baseline Knowledge

### Platform Constants
- **Swift**: 6.2
- **iOS / iPadOS**: 26.0+
- **Xcode**: 26
- **Architecture**: MVVM + @Observable + async/await
- **Design System**: Liquid Glass (WWDC 2025)
- **On-Device AI**: Foundation Models Framework (SystemLanguageModel)
- **Observation**: `@Observable` macro — never `ObservableObject`
- **State ownership**: `@State` for view-owned, `@Environment` for shared
- **Concurrency**: async/await + structured concurrency (no Combine for new code)
- **Default actor isolation**: `nonisolated(nonsending)` (Swift 6.2 default)
- **Data persistence**: SwiftData (not Core Data for new projects)
- **Navigation**: `NavigationStack` + `NavigationPath` (never `NavigationView`)
- **Testing framework**: Swift Testing (`@Test`, `@Suite`, `#expect`) — not XCTest for new unit tests
- **UI testing**: XCUITest (still required for UI automation)

### Project Structure (Testing Paths)
```
{AppName}/
├── Tests/
│   ├── UnitTests/
│   │   ├── Features/
│   │   │   └── {FeatureName}/
│   │   │       ├── {FeatureName}ViewModelTests.swift
│   │   │       └── {FeatureName}ServiceTests.swift
│   │   ├── Core/
│   │   │   ├── NetworkingTests/
│   │   │   ├── StorageTests/
│   │   │   └── ServicesTests/
│   │   └── Intelligence/
│   │       └── AIManagerTests.swift
│   ├── UITests/
│   │   ├── Acceptance/
│   │   │   └── {FeatureName}AcceptanceTests.swift
│   │   ├── Flows/
│   │   │   └── {FlowName}FlowTests.swift
│   │   └── Accessibility/
│   │       └── {FeatureName}AccessibilityTests.swift
│   └── Mocks/
│       ├── Mock{ServiceName}.swift
│       ├── Mock{RepositoryName}.swift
│       └── MockAIManager.swift
├── TestPlans/
│   ├── Full.xctestplan
│   ├── Acceptance.xctestplan
│   ├── Unit.xctestplan
│   ├── Security.xctestplan
│   └── Performance.xctestplan
└── .swiftlint.yml
```

---

## Two-Stream Testing Model

### Stream 1: Acceptance Tests (ATDD)
- Written BEFORE production code
- Use XCUITest for UI automation
- Use domain language exclusively — no implementation terms
- One `@Suite` per feature/story
- One `@Test` per Given/When/Then criterion
- All interactions via accessibility identifiers
- Tagged with `.acceptance`
- Run via `Acceptance.xctestplan`

### Stream 2: Unit Tests
- Written alongside or after production code
- Use Swift Testing framework (`@Test`, `@Suite`, `#expect`)
- Test ViewModels, Services, Models, and utility functions
- Protocol-based mocks from Tests/Mocks/
- Tagged with `.unit`
- Run via `Unit.xctestplan`

### Stream Relationship
```
Story spec (Given/When/Then)
    ↓
Acceptance tests (RED — all fail)
    ↓
Development begins (ios-builder writes production code)
    ↓
Unit tests (written during development)
    ↓
GREEN — acceptance tests pass
    ↓
Quality gates (full 5-stage run)
    ↓
DONE — story complete
```

---

## ATDD Pipeline Rules

### Six-Stage Cycle
1. **Spec Review**: Read the story/spec and extract all acceptance criteria in Given/When/Then format
2. **Identifier Mapping**: Map each user-visible element to an accessibility identifier using domain language (e.g., `encounter-list`, `medication-input`, not `tableView`, `textField`)
3. **Test Generation**: Generate XCUITest methods for each criterion, one `@Test` per criterion
4. **Red Confirmation**: Run all tests — every test MUST fail (Red Phase gate)
5. **Development**: Hand off to ios-builder (Sentinel does NOT participate in this phase)
6. **Green Confirmation**: After development, run all tests — every test MUST pass

### Identifier Naming Convention
```
{domain-concept}-{element-role}

Examples:
  encounter-list              (not: tableView, scrollView)
  medication-name-input       (not: textField1, nameField)
  submit-encounter-button     (not: button1, submitBtn)
  differential-diagnosis-card (not: cell0, diagnosisCard)
  mdm-output-text            (not: textView, outputLabel)
```

### Test Method Naming Convention
```swift
@Test("Given {context}, when {action}, then {expected}")
func {feature}_{scenario}_{expectation}() async throws {
    // Arrange: set up preconditions (Given)
    // Act: perform user action (When)
    // Assert: verify outcome (Then) via #expect
}
```

---

## Automated Quality Gates Configuration

### Stage 1: BUILD
```bash
xcodebuild build \
  -scheme {AppName} \
  -destination 'platform=iOS Simulator,name=iPhone 16 Plus,OS=26.0' \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  2>&1 | xcpretty
```
- Exit code 0 = PASS
- Any error = FAIL, stop pipeline
- Warnings treated as errors when `-Werror` flag is set in build settings

### Stage 2: TEST
```bash
xcodebuild test \
  -scheme {AppName} \
  -testPlan Full \
  -destination 'platform=iOS Simulator,name=iPhone 16 Plus,OS=26.0' \
  -resultBundlePath TestResults.xcresult \
  2>&1 | xcpretty
```
- All tests pass = PASS
- Any test failure = FAIL, stop pipeline
- Parse `.xcresult` for detailed failure info

### Stage 3: LINT
```bash
swiftlint lint --strict --config .swiftlint.yml --reporter json
```
- Zero violations = PASS
- Any violation = FAIL, stop pipeline
- Parse JSON output for file:line detail

### Stage 4: PROHIBITED PATTERNS
```bash
# Run each pattern as a separate grep scan
# See "Prohibited Patterns Complete List" section below
# Exit code 0 from grep = pattern FOUND = FAIL
# Exit code 1 from grep = pattern NOT FOUND = PASS
```
- All patterns clean = PASS
- Any pattern found = FAIL, stop pipeline

### Stage 5: SECURITY
```bash
# Check for hardcoded secrets
grep -rn --include='*.swift' \
  -e 'sk_live_' -e 'sk_test_' -e 'api_key.*=' -e 'secret.*=' -e 'password.*=' \
  Sources/

# Check ATS configuration
plutil -p Info.plist | grep -i 'NSAppTransportSecurity'

# Check for non-Keychain credential storage
grep -rn --include='*.swift' \
  -e 'UserDefaults.*password' -e 'UserDefaults.*token' -e 'UserDefaults.*secret' \
  Sources/
```
- No findings = PASS
- Advisory findings = WARNING (non-blocking)
- Critical findings (hardcoded secrets) = FAIL, stop pipeline

---

## Kickback Report Format Template

```
╔══════════════════════════════════════════════╗
║           KICKBACK REPORT                    ║
╚══════════════════════════════════════════════╝

Generated:    {YYYY-MM-DD HH:MM}
Gate stage:   {BUILD | TEST | LINT | PATTERNS | SECURITY}
Severity:     {🔴 CRITICAL | 🟡 WARNING}
Target agent: {ios-architect | ios-builder}
Blocking:     {YES | NO}

────────────────────────────────────────────────
FAILURES ({count})
────────────────────────────────────────────────

[1] What:     {description of failure}
    Where:    {file}:{line}
    Expected: {what should be}
    Actual:   {what was found}
    Category: {ARCHITECTURE | IMPLEMENTATION | CONVENTION | SECURITY}
    Fix hint: {brief guidance for the target agent}

[2] What:     ...
    ...

────────────────────────────────────────────────
SUMMARY
────────────────────────────────────────────────
Total failures:    {count}
By category:
  ARCHITECTURE:    {count}
  IMPLEMENTATION:  {count}
  CONVENTION:      {count}
  SECURITY:        {count}
Blocking:          {YES — must fix before proceeding | NO — advisory}
Recommended action: {description}
```

### Fix Categories Defined
| Category | Meaning | Target Agent |
|----------|---------|-------------|
| ARCHITECTURE | Structural issue, wrong pattern, missing abstraction | ios-architect |
| IMPLEMENTATION | Bug, logic error, incorrect API usage | ios-builder |
| CONVENTION | Style violation, naming, formatting | ios-builder |
| SECURITY | Credential exposure, insecure storage, ATS violation | ios-architect |

---

## Spec Leakage Detection Rules

### Implementation Terms (NEVER allowed in acceptance tests)
- Class names from Sources/ (e.g., `DashboardViewModel`, `EncounterService`)
- Property names from ViewModels (e.g., `.isLoading`, `.errorMessage`, `.items`)
- Internal method names (e.g., `fetchItems()`, `parseNarrative()`)
- Framework-specific types (e.g., `NavigationStack`, `@Observable`, `ModelContainer`)
- Architectural terms (e.g., `ViewModel`, `Repository`, `UseCase`, `Interactor`)
- File/module paths (e.g., `Sources/Features/`, `Core/Networking/`)

### Domain Terms (REQUIRED in acceptance tests)
- User-facing concepts: patient, encounter, medication, diagnosis, treatment
- UI elements by role: button, input, list, card, label, toggle
- Actions in user terms: tap, enter, select, scroll, swipe, dismiss
- States in user terms: loading, empty, error, success, complete
- Accessibility identifiers using domain language only

### Detection Process
1. Build a term index from Sources/**/*.swift — extract all type names, method names, property names
2. Scan Tests/UITests/**/*.swift for any term from the index
3. Exclude terms that overlap with domain language (e.g., `Patient` as both a type and a domain concept is acceptable)
4. Report each leakage with the production file it originates from

---

## Prohibited Patterns Complete List

### 🔴 CRITICAL — Must Fix Immediately
| # | Pattern (grep) | What It Catches | Required Replacement |
|---|---------------|-----------------|---------------------|
| 1 | `ObservableObject` | Legacy observation protocol | `@Observable` macro |
| 2 | `@Published` | Legacy published property wrapper | Remove — `@Observable` tracks all stored properties |
| 3 | `NavigationView` | Deprecated navigation container | `NavigationStack` |
| 4 | `AnyView` | Type-erased view (performance, debugging) | `@ViewBuilder` or conditional `Group` |
| 5 | `\.shared` (singleton pattern) | Global mutable state | Environment-based dependency injection |
| 6 | `var.*:.*!` (implicitly unwrapped) | Crash risk from force unwrap | Regular optional `?` or non-optional |
| 7 | `try!` | Unhandled throwing expression | `try` with `do/catch` or `try?` |
| 8 | `as!` | Forced downcast | `as?` with optional binding |
| 9 | `import UIKit` (in SwiftUI files) | UIKit dependency in SwiftUI layer | SwiftUI native equivalent |
| 10 | Third-party HTTP imports | Unnecessary dependency | `URLSession` |
| 11 | Hardcoded API keys/secrets | Security vulnerability | Keychain or build configuration |

### 🟡 WARNING — Should Fix Before Release
| # | Pattern (grep) | What It Catches | Required Replacement |
|---|---------------|-----------------|---------------------|
| 12 | `import Combine` (new files) | Legacy reactive framework | `async/await` + structured concurrency |
| 13 | `import CoreData` (new files) | Legacy persistence framework | `SwiftData` |
| 14 | `print(` (in Sources/) | Debug output in production | `os.Logger` or remove |
| 15 | `#if DEBUG.*print` | Conditional debug prints | `os.Logger` with appropriate level |
| 16 | `DispatchQueue` | Legacy concurrency | `Task`, `TaskGroup`, `Actor` |
| 17 | `@objc` (unless required for selectors) | Objective-C interop overhead | Swift-native approach |
| 18 | `NSNotificationCenter` | Legacy notification system | `async` streams or `@Observable` |

### Grep Commands for Each Pattern
```bash
# Critical patterns
grep -rn --include='*.swift' 'ObservableObject' Sources/
grep -rn --include='*.swift' '@Published' Sources/
grep -rn --include='*.swift' 'NavigationView' Sources/
grep -rn --include='*.swift' 'AnyView' Sources/
grep -rn --include='*.swift' '\.shared' Sources/ | grep -v 'URLSession.shared'
grep -rn --include='*.swift' 'var.*:.*!' Sources/ | grep -v 'IBOutlet'
grep -rn --include='*.swift' 'try!' Sources/
grep -rn --include='*.swift' ' as!' Sources/
grep -rn --include='*.swift' 'import UIKit' Sources/ | grep -v 'UIKit.*extension'
grep -rn --include='*.swift' -e 'import Alamofire' -e 'import Moya' -e 'import AFNetworking' Sources/
grep -rn --include='*.swift' -e 'sk_live_' -e 'sk_test_' -e 'api_key\s*=' -e 'apiKey\s*=' Sources/

# Warning patterns
grep -rn --include='*.swift' 'import Combine' Sources/
grep -rn --include='*.swift' 'import CoreData' Sources/
grep -rn --include='*.swift' 'print(' Sources/
grep -rn --include='*.swift' 'DispatchQueue' Sources/
grep -rn --include='*.swift' '@objc' Sources/ | grep -v 'selector'
grep -rn --include='*.swift' 'NSNotificationCenter\|NotificationCenter.default' Sources/
```

---

## File Ownership Boundaries (All 4 iOS Agents)

| Agent | Exclusive Files | Shared Read |
|-------|----------------|-------------|
| **ios-architect** | `CLAUDE.md`, `docs/*.md`, `Sources/Core/` (interfaces only) | Everything |
| **ios-builder** | `Sources/**`, `{AppName}App.swift`, `Resources/` | Tests/ (read only) |
| **ios-quality** (this agent) | `Tests/**`, `TestPlans/**`, `.swiftlint.yml` | Sources/ (read only, never write) |
| **ios-lead** | None exclusively — orchestration role | Everything (read only) |

### Boundary Rules
- Sentinel (ios-quality) NEVER creates or modifies files in Sources/
- Sentinel NEVER modifies {AppName}App.swift or any production entry point
- Sentinel MAY read Sources/ files for coverage analysis and spec leakage detection
- Sentinel OWNS all files under Tests/, TestPlans/, and .swiftlint.yml
- Sentinel OWNS Tests/Mocks/ — creates mock implementations for protocols defined in Sources/
- When a production code change is needed, Sentinel issues a kickback report to ios-architect or ios-builder

---

## Swift Testing Framework Quick Reference

### Imports
```swift
import Testing
@testable import {AppName}
```

### Basic Test
```swift
@Test("Description of what is being tested")
func featureName_scenario_expectation() async throws {
    // Arrange
    let sut = MyViewModel(service: MockMyService())

    // Act
    await sut.load()

    // Assert
    #expect(sut.items.count == 3)
    #expect(sut.isLoading == false)
    #expect(sut.error == nil)
}
```

### Suite Organization
```swift
@Suite("Feature Name Tests")
struct FeatureNameTests {
    let mockService = MockFeatureService()

    @Test("loads items successfully")
    func load_success() async throws { ... }

    @Test("handles network error gracefully")
    func load_networkError_showsMessage() async throws { ... }

    @Test("empty state displays correctly")
    func load_noItems_showsEmptyState() async throws { ... }
}
```

### Tags for Targeted Runs
```swift
extension Tag {
    @Tag static var acceptance: Self
    @Tag static var unit: Self
    @Tag static var security: Self
    @Tag static var performance: Self
    @Tag static var integration: Self
}

@Test("critical user flow", .tags(.acceptance))
func criticalFlow() async throws { ... }

@Test("ViewModel loads data", .tags(.unit))
func viewModelLoad() async throws { ... }
```

### Parameterized Tests
```swift
@Test("validates input formats", arguments: [
    ("valid@email.com", true),
    ("invalid-email", false),
    ("", false),
    ("a@b.c", true)
])
func validateEmail(input: String, expected: Bool) {
    #expect(validator.isValidEmail(input) == expected)
}
```

### Required Values (#require)
```swift
@Test("parses response correctly")
func parseResponse() throws {
    let data = try #require(jsonString.data(using: .utf8))
    let result = try JSONDecoder().decode(Response.self, from: data)
    #expect(result.items.count > 0)
}
```

### Traits
```swift
@Test("heavy computation", .timeLimit(.minutes(2)))
func heavyComputation() async throws { ... }

@Test("requires network", .enabled(if: NetworkMonitor.isConnected))
func networkTest() async throws { ... }

@Test("known issue", .bug("JIRA-123", "Crashes on empty input"))
func knownIssue() async throws { ... }

@Test("disabled until backend ready", .disabled("Waiting for API v2"))
func futureTest() async throws { ... }
```

### Exit Tests (Swift 6.2)
```swift
@Test("crashes on invalid configuration")
func invalidConfig_crashes() async {
    await #expect(exitsWith: .failure) {
        _ = Configuration(file: "/nonexistent/path")
    }
}
```

### Custom TestScoping Traits
```swift
struct DatabaseFixture: TestScoping {
    func provideScope(for test: Test, action: @Sendable () async throws -> Void) async throws {
        let db = try await TestDatabase.create()
        defer { db.destroy() }
        try await action()
    }
}

@Test("database operations", DatabaseFixture())
func databaseTest() async throws { ... }
```

### Mock Pattern (Protocol-Based DI)
```swift
// Production protocol (in Sources/)
protocol EncounterServiceProtocol: Sendable {
    func fetchEncounters() async throws -> [Encounter]
    func createEncounter(_ encounter: Encounter) async throws -> Encounter
    func deleteEncounter(id: String) async throws
}

// Mock (in Tests/Mocks/)
final class MockEncounterService: EncounterServiceProtocol, @unchecked Sendable {
    var fetchEncountersResult: Result<[Encounter], Error> = .success([])
    var createEncounterResult: Result<Encounter, Error> = .success(Encounter.sample)
    var deleteEncounterCalled = false
    var deleteEncounterID: String?

    func fetchEncounters() async throws -> [Encounter] {
        try fetchEncountersResult.get()
    }

    func createEncounter(_ encounter: Encounter) async throws -> Encounter {
        try createEncounterResult.get()
    }

    func deleteEncounter(id: String) async throws {
        deleteEncounterCalled = true
        deleteEncounterID = id
    }
}
```
