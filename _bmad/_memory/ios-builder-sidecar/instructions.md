# Forge (iOS Builder) Instructions

## Shared Baseline Knowledge

### Platform Targets

- **iOS 26.0+** / iPadOS 26.0+
- **Swift 6.2** with `nonisolated(nonsending)` default actor isolation
- **Xcode 26**
- **Architecture**: MVVM with `@Observable` macro
- **Design System**: Liquid Glass (WWDC 2025)
- **On-Device AI**: Foundation Models Framework (3B parameter, on-device)
- **Data Persistence**: SwiftData (`@Model`, `@Query`, `ModelContainer`)
- **Navigation**: `NavigationStack` + `NavigationPath` (programmatic)
- **Concurrency**: `async/await` + structured concurrency
- **Testing**: Swift Testing framework (`@Test`, `@Suite`)
- **DI Strategy**: Protocol-based with `@Environment`

### Swift 6.2 Concurrency Model

- Default actor isolation is `nonisolated(nonsending)` -- functions do not inherit any actor context
- ViewModels that touch UI state use `@MainActor`
- Use `async/await` exclusively for asynchronous work
- Use `TaskGroup` for parallel operations
- Use `Task { }` with cancellation support in ViewModels
- No Combine for new code -- `AsyncSequence` replaces `Publisher`

### @Observable MVVM Pattern

```swift
// ViewModel: @Observable + @MainActor
@Observable
@MainActor
final class FeatureViewModel {
    // MARK: - State
    var items: [Item] = []
    var isLoading = false
    var errorMessage: String?

    // MARK: - Dependencies (protocol-based)
    private let service: FeatureServiceProtocol

    // MARK: - Init
    init(service: FeatureServiceProtocol = FeatureService()) {
        self.service = service
    }

    // MARK: - Actions
    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            items = try await service.fetchItems()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// View: @State owns ViewModel, .task triggers loading
struct FeatureView: View {
    @State private var viewModel = FeatureViewModel()

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Feature")
                .task { await viewModel.load() }
        }
    }

    @ViewBuilder
    private var content: some View {
        if viewModel.isLoading {
            ProgressView()
        } else if let error = viewModel.errorMessage {
            ContentUnavailableView("Error", systemImage: "exclamationmark.triangle", description: Text(error))
        } else if viewModel.items.isEmpty {
            ContentUnavailableView("No Items", systemImage: "tray")
        } else {
            List(viewModel.items) { item in
                ItemRow(item: item)
                    .accessibilityIdentifier("item-row-\(item.id)")
            }
        }
    }
}
```

---

## Prohibited Patterns

| Pattern | Reason | Replacement |
|---------|--------|-------------|
| `ObservableObject` | Legacy Combine-based observation | `@Observable` macro |
| `@Published` | Requires `ObservableObject` | Direct properties on `@Observable` class |
| `NavigationView` | Deprecated in iOS 16 | `NavigationStack` or `NavigationSplitView` |
| `Combine` (new code) | Replaced by structured concurrency | `async/await`, `AsyncSequence` |
| `force unwrap (!)` | Runtime crash risk | `guard let`, `if let`, `??`, optional chaining |
| `AnyView` | Type erasure destroys identity, hurts performance | `@ViewBuilder`, conditional views, `Group` |
| Singletons | Untestable, hidden dependencies | Protocol + `@Environment` DI |
| Third-party HTTP | Unnecessary dependency | `URLSession` (native) |
| `UIKit` wrappers | SwiftUI-native preferred | SwiftUI equivalents; UIKit only if no SwiftUI API exists |
| `implicitly unwrapped optionals` | Same crash risk as force unwrap | Proper optionals or non-optional initialization |

### Detection During Refactor Phase

After each Green phase, scan implemented files for these patterns:
- `class.*:.*ObservableObject`
- `@Published`
- `NavigationView`
- `import Combine` (in new files)
- Lines containing `!` that are not `!=` or string interpolation
- `AnyView(`
- `static let shared` or `static var shared`
- `Alamofire`, `Moya`, or other HTTP libraries
- `UIViewRepresentable`, `UIViewControllerRepresentable` (flag for review)

---

## TDD Micro-Cycle Protocol

### Overview

Every implementation follows Red -> Green -> Refactor. No exceptions.

### Phase 1: Red (Write Failing Tests)

1. Read the story file completely -- identify every acceptance criterion (AC)
2. For each AC, write one or more `@Test` functions that encode the criterion
3. Write supporting unit `@Test` functions for service/ViewModel layers
4. Run test suite -- verify ALL new tests FAIL
5. If any test passes without implementation code, the test is wrong -- fix it

```swift
import Testing
@testable import AppName

@Suite("Feature: [Story Title]")
struct FeatureTests {
    @Test("AC-1: [Acceptance Criterion Description]")
    func verifyAcceptanceCriterion1() async throws {
        // Arrange
        let mockService = MockFeatureService()
        let viewModel = FeatureViewModel(service: mockService)

        // Act
        await viewModel.load()

        // Assert
        #expect(viewModel.items.count == 3)
        #expect(viewModel.errorMessage == nil)
    }
}
```

### Phase 2: Green (Minimum Implementation)

1. Implement the minimum code to make each failing test pass
2. Follow file ownership boundaries strictly
3. Add `.accessibilityIdentifier()` to every interactive element
4. Use protocol-based DI via `@Environment` for all services
5. Run full test suite -- ALL tests (new + existing) must pass

### Phase 3: Refactor

1. Extract subviews when body exceeds ~30 lines
2. Apply `@ViewBuilder` patterns for conditional content
3. Create `ViewModifier` for reusable behavior
4. Eliminate duplication, improve naming
5. Run full test suite -- ALL tests must still pass
6. Scan for prohibited patterns -- zero violations allowed

### Between Cycles

- Update `memories.md` with test counts and status
- Commit on feature branch with conventional commit message
- If blocked, record in memories.md and notify user

---

## File Ownership Boundaries

### Owned Directories (can create/modify)

```
Sources/Features/**           Feature modules (views, viewmodels, models)
Sources/Core/Networking/**    URLSession API client, Codable models
Sources/Core/Storage/**       SwiftData @Model definitions, migrations
Sources/Core/Services/**      Business logic service protocols + implementations
Sources/Core/Extensions/**    Swift/SwiftUI extensions
Sources/SharedUI/**           Reusable UI components, modifiers, styles
Sources/Intelligence/**       Foundation Models integration (AIManager, Tools, Generable)
Sources/Resources/**          Assets, localization strings
```

### Read-Only (never modify)

- Spec files and generated acceptance tests
- Project configuration files (`.xcodeproj`, `Package.swift`) unless story explicitly requires it
- Files owned by other agents (ios-architect, ios-quality, ios-pm)
- `docs/` directory

### Test Files

- Create test files in `Tests/UnitTests/` mirroring the `Sources/` structure
- Create UI test files in `Tests/UITests/` for end-to-end flows
- Test file naming: `{ClassName}Tests.swift`

---

## Screenshot-Driven Development Loop

### Tiered Iteration

**Tier 1: Xcode Previews (fastest)**
1. Write `#Preview` macro for the view being built
2. Inject mock data for all states (loading, error, empty, populated)
3. Iterate on layout and styling using preview
4. Verify accessibility labels render in preview

**Tier 2: Simulator (medium)**
1. Build and run on iOS 26 Simulator (iPhone 16 Plus)
2. Use `xcrun simctl` commands for screenshots:
   ```bash
   export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
   xcrun simctl io booted screenshot /tmp/sim-screenshot.png
   ```
3. Verify Liquid Glass effects render correctly (previews may not show glass)
4. Test navigation flows and transitions
5. Check dark mode: `xcrun simctl ui booted appearance dark`

**Tier 3: Device (validation)**
1. Deploy to physical device for final validation
2. Verify haptic feedback, actual glass rendering
3. Test with Dynamic Type accessibility sizes
4. Performance validation with Instruments

### Screenshot Review Checklist

- [ ] Glass effects render against content (not solid backgrounds)
- [ ] Text is legible on all glass surfaces
- [ ] Interactive elements have visible tap targets (44pt minimum)
- [ ] Dark mode appearance is correct
- [ ] Dynamic Type scales without clipping
- [ ] Navigation transitions are smooth
- [ ] Empty states display correctly
- [ ] Error states display correctly

---

## Accessibility Identifier Conventions

Every interactive element MUST have `.accessibilityIdentifier()`. Use hierarchical dot-notation:

```swift
// Pattern: {feature}.{component}.{element}
.accessibilityIdentifier("compose.narrative.textEditor")
.accessibilityIdentifier("compose.submit.button")
.accessibilityIdentifier("output.mdm.copyButton")
.accessibilityIdentifier("settings.plan.selector")
.accessibilityIdentifier("build.section1.submitButton")
.accessibilityIdentifier("build.encounter.card-\(encounter.id)")
```

### Rules

- All `Button` views: `{feature}.{action}.button`
- All `TextField` / `TextEditor`: `{feature}.{field}.textField`
- All `Toggle`: `{feature}.{setting}.toggle`
- All `NavigationLink`: `{feature}.{destination}.navLink`
- List rows: `{feature}.{type}.row-{id}`
- Tab items: `tab.{name}`

---

## View Composition Rules

### 30-Line Extraction Rule

When a view's `body` exceeds ~30 lines, extract sections into computed properties or subviews:

```swift
struct FeatureView: View {
    @State private var viewModel = FeatureViewModel()

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Feature")
                .toolbar { toolbarContent }
                .task { await viewModel.load() }
        }
    }

    // Extracted: each section is a focused, named computed property
    @ViewBuilder
    private var content: some View {
        if viewModel.isLoading {
            loadingView
        } else {
            mainContent
        }
    }

    private var loadingView: some View {
        ProgressView("Loading...")
    }

    @ViewBuilder
    private var mainContent: some View {
        List(viewModel.items) { item in
            ItemRow(item: item)
        }
    }

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .primaryAction) {
            Button("Add", systemImage: "plus") {
                // action
            }
            .accessibilityIdentifier("feature.add.button")
        }
    }
}
```

### @ViewBuilder Patterns

- Use `@ViewBuilder` on computed properties that return conditional content
- Use `@ToolbarContentBuilder` for toolbar content extraction
- Prefer computed properties over separate `struct` subviews for view-internal extraction
- Create separate `struct` files only when the component is reused across features

### Custom ViewModifiers

```swift
struct GlassCardModifier: ViewModifier {
    var tint: Color?

    func body(content: Content) -> some View {
        content
            .padding()
            .glassEffect(.regular.tint(tint ?? .clear), in: .rect(cornerRadius: 16))
    }
}

extension View {
    func glassCard(tint: Color? = nil) -> some View {
        modifier(GlassCardModifier(tint: tint))
    }
}
```

---

## Backend Integration Patterns

### URLSession Async Client

```swift
protocol APIClientProtocol: Sendable {
    func request<T: Decodable>(
        endpoint: Endpoint,
        method: HTTPMethod,
        body: (any Encodable)?,
        authenticated: Bool
    ) async throws(APIError) -> T
}

final class APIClient: APIClientProtocol {
    private let session: URLSession
    private let baseURL: URL
    private let tokenProvider: TokenProviderProtocol

    init(
        baseURL: URL,
        session: URLSession = .shared,
        tokenProvider: TokenProviderProtocol
    ) {
        self.session = session
        self.baseURL = baseURL
        self.tokenProvider = tokenProvider
    }

    func request<T: Decodable>(
        endpoint: Endpoint,
        method: HTTPMethod = .get,
        body: (any Encodable)? = nil,
        authenticated: Bool = true
    ) async throws(APIError) -> T {
        var urlRequest = URLRequest(url: baseURL.appendingPathComponent(endpoint.path))
        urlRequest.httpMethod = method.rawValue
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if authenticated {
            let token = try await tokenProvider.getToken()
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            urlRequest.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await session.data(for: urlRequest)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(statusCode: httpResponse.statusCode, data: data)
        }

        return try JSONDecoder().decode(T.self, from: data)
    }
}
```

### Codable Response Models

```swift
// Match backend Express endpoint response shapes exactly
struct GenerateResponse: Codable {
    let mdmText: String
    let metadata: MDMMetadata
}

struct MDMMetadata: Codable {
    let complexity: String
    let sectionsGenerated: [String]
}
```

### Firebase Auth (iOS)

```swift
import FirebaseAuth

protocol TokenProviderProtocol: Sendable {
    func getToken() async throws -> String
}

final class FirebaseTokenProvider: TokenProviderProtocol {
    func getToken() async throws -> String {
        guard let user = Auth.auth().currentUser else {
            throw AuthError.notAuthenticated
        }
        return try await user.getIDToken()
    }
}
```

### Environment-Based DI for API Client

```swift
// Define Environment key
private struct APIClientKey: EnvironmentKey {
    static let defaultValue: any APIClientProtocol = APIClient(
        baseURL: URL(string: "https://mdm-backend-xxxxx.run.app")!,
        tokenProvider: FirebaseTokenProvider()
    )
}

extension EnvironmentValues {
    var apiClient: any APIClientProtocol {
        get { self[APIClientKey.self] }
        set { self[APIClientKey.self] = newValue }
    }
}

// Inject in App
@main
struct MDMApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.apiClient, APIClient(...))
        }
    }
}

// Consume in View, pass to ViewModel
struct FeatureView: View {
    @Environment(\.apiClient) private var apiClient
    @State private var viewModel: FeatureViewModel?

    var body: some View {
        Group {
            if let viewModel {
                FeatureContent(viewModel: viewModel)
            }
        }
        .task {
            viewModel = FeatureViewModel(apiClient: apiClient)
            await viewModel?.load()
        }
    }
}
```

---

## Endpoint Mapping (Backend Express -> Swift)

Map each backend Express endpoint to a Swift `Endpoint` enum case:

```swift
enum Endpoint {
    case health
    case whoami
    case parseNarrative
    case generate
    case buildModeSection1
    case buildModeSection2
    case buildModeFinalize
    case quickModeGenerate
    case surveillanceAnalyze
    case surveillanceReport

    var path: String {
        switch self {
        case .health: "/health"
        case .whoami: "/v1/whoami"
        case .parseNarrative: "/v1/parse-narrative"
        case .generate: "/v1/generate"
        case .buildModeSection1: "/v1/build-mode/process-section1"
        case .buildModeSection2: "/v1/build-mode/process-section2"
        case .buildModeFinalize: "/v1/build-mode/finalize"
        case .quickModeGenerate: "/v1/quick-mode/generate"
        case .surveillanceAnalyze: "/v1/surveillance/analyze"
        case .surveillanceReport: "/v1/surveillance/report"
        }
    }
}
```
