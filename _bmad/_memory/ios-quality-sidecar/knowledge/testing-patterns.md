# Swift Testing & XCUITest — Deep Reference

## Part 1: Swift Testing Framework

### Overview
Swift Testing is Apple's modern testing framework introduced alongside Xcode 16 and enhanced in Xcode 26. It replaces XCTest for unit and integration tests with a more expressive, macro-based API. XCUITest remains the standard for UI automation.

### Core Macros

#### @Test
Marks a function as a test case. Replaces XCTest's `func test*()` naming convention.

```swift
import Testing

// Basic test
@Test func additionWorks() {
    #expect(2 + 2 == 4)
}

// Test with display name
@Test("Addition produces correct result")
func addition() {
    #expect(2 + 2 == 4)
}

// Async test
@Test("Fetches data from network")
func fetchData() async throws {
    let service = MockDataService()
    let result = try await service.fetch()
    #expect(result.isEmpty == false)
}
```

#### @Suite
Groups related tests into a named collection. Replaces XCTest's class-based test grouping.

```swift
@Suite("Encounter ViewModel")
struct EncounterViewModelTests {
    // Shared setup — Swift Testing uses init, not setUp()
    let mockService: MockEncounterService
    let viewModel: EncounterViewModel

    init() {
        mockService = MockEncounterService()
        viewModel = EncounterViewModel(service: mockService)
    }

    @Test("loads encounters on initialization")
    func loadEncounters() async throws {
        mockService.fetchEncountersResult = .success([.sample])
        await viewModel.load()
        #expect(viewModel.encounters.count == 1)
    }

    @Test("shows error on network failure")
    func loadError() async throws {
        mockService.fetchEncountersResult = .failure(NetworkError.timeout)
        await viewModel.load()
        #expect(viewModel.errorMessage != nil)
        #expect(viewModel.encounters.isEmpty)
    }
}
```

#### Nested Suites
```swift
@Suite("Authentication")
struct AuthenticationTests {

    @Suite("Login")
    struct LoginTests {
        @Test("valid credentials succeed")
        func validLogin() async throws { ... }

        @Test("invalid password fails")
        func invalidPassword() async throws { ... }
    }

    @Suite("Token Refresh")
    struct TokenRefreshTests {
        @Test("refreshes expired token")
        func refreshExpired() async throws { ... }

        @Test("handles refresh failure")
        func refreshFailure() async throws { ... }
    }
}
```

### Assertions

#### #expect — Soft Assertion
Test continues after failure. Use for non-critical checks where you want to see all failures.

```swift
@Test func userProperties() {
    let user = User(name: "Jeremy", role: .admin)

    #expect(user.name == "Jeremy")
    #expect(user.role == .admin)
    #expect(user.isActive)                    // boolean check
    #expect(user.permissions.contains(.read)) // collection check
    #expect(user.email?.hasSuffix("@example.com") == true) // optional chain
}
```

#### #require — Hard Assertion
Test stops at failure. Use when subsequent assertions depend on this value.

```swift
@Test func parseJSON() throws {
    let json = """
    {"name": "Jeremy", "encounters": 42}
    """

    // #require unwraps optionals — test stops if nil
    let data = try #require(json.data(using: .utf8))
    let user = try #require(JSONDecoder().decode(User.self, from: data) as User?)

    // These only run if #require succeeded
    #expect(user.name == "Jeremy")
    #expect(user.encounters == 42)
}
```

#### Expecting Errors
```swift
@Test("throws on invalid input")
func invalidInput() throws {
    #expect(throws: ValidationError.emptyField) {
        try validator.validate(name: "")
    }
}

@Test("throws some error")
func someError() throws {
    #expect(throws: (any Error).self) {
        try riskyOperation()
    }
}

@Test("does not throw")
func noError() throws {
    #expect(throws: Never.self) {
        try safeOperation()
    }
}
```

### Parameterized Tests

#### Basic Parameterization
```swift
@Test("validates email formats", arguments: [
    "valid@example.com",
    "user.name@domain.co.uk",
    "test+tag@example.org"
])
func validEmails(email: String) {
    #expect(EmailValidator.isValid(email))
}

@Test("rejects invalid emails", arguments: [
    "",
    "not-an-email",
    "@no-local.com",
    "no-domain@",
    "spaces in@email.com"
])
func invalidEmails(email: String) {
    #expect(!EmailValidator.isValid(email))
}
```

#### Multi-Argument Parameterization
```swift
@Test("calculates correct dosage", arguments: zip(
    [10.0, 20.0, 50.0, 100.0],    // weight in kg
    [5.0, 10.0, 25.0, 50.0]        // expected dosage in mg
))
func dosageCalculation(weight: Double, expectedDosage: Double) {
    let dosage = DosageCalculator.calculate(weight: weight, medication: .acetaminophen)
    #expect(dosage == expectedDosage)
}
```

#### Enum-Based Parameterization
```swift
enum Severity: CaseIterable {
    case low, medium, high, critical
}

@Test("all severity levels have display color", arguments: Severity.allCases)
func severityColors(severity: Severity) {
    let color = severity.displayColor
    #expect(color != nil)
}
```

### Tags for Targeted Test Runs

#### Defining Tags
```swift
// In a shared file: Tests/TestTags.swift
extension Tag {
    @Tag static var acceptance: Self
    @Tag static var unit: Self
    @Tag static var security: Self
    @Tag static var performance: Self
    @Tag static var integration: Self
    @Tag static var smoke: Self
    @Tag static var regression: Self
}
```

#### Applying Tags
```swift
@Test("critical user login flow", .tags(.acceptance, .smoke))
func loginFlow() async throws { ... }

@Test("ViewModel state management", .tags(.unit))
func viewModelState() async throws { ... }

@Test("no hardcoded credentials", .tags(.security))
func noHardcodedCredentials() throws { ... }

@Test("list scrolling performance", .tags(.performance))
func scrollPerformance() async throws { ... }
```

#### Running Tagged Tests
In Xcode Test Plans, configure tag-based filtering:
- **Acceptance.xctestplan**: Include only `.acceptance` tag
- **Unit.xctestplan**: Include only `.unit` tag
- **Security.xctestplan**: Include only `.security` tag
- **Performance.xctestplan**: Include only `.performance` tag
- **Full.xctestplan**: Include all tags

### Traits

#### Time Limits
```swift
@Test("completes within reasonable time", .timeLimit(.seconds(5)))
func networkCall() async throws {
    let result = try await service.fetchData()
    #expect(result.count > 0)
}

@Test("batch processing stays fast", .timeLimit(.minutes(1)))
func batchProcess() async throws {
    let results = try await processor.processAll(items)
    #expect(results.allSatisfy { $0.isValid })
}
```

#### Conditional Execution
```swift
@Test("uses Foundation Models", .enabled(if: SystemLanguageModel.isAvailable))
func aiFeature() async throws { ... }

@Test("iPad-only layout", .enabled(if: UIDevice.current.userInterfaceIdiom == .pad))
func iPadLayout() async throws { ... }

@Test("network-dependent", .disabled("Requires staging server"))
func stagingTest() async throws { ... }
```

#### Bug References
```swift
@Test("handles edge case", .bug("GH-42", "Crash when list is empty"))
func emptyListEdgeCase() async throws {
    let viewModel = ListViewModel(service: MockService(items: []))
    await viewModel.load()
    #expect(viewModel.items.isEmpty)
    #expect(viewModel.showsEmptyState)
}
```

#### Combining Traits
```swift
@Test(
    "critical authentication flow",
    .tags(.acceptance, .security, .smoke),
    .timeLimit(.seconds(30)),
    .bug("SEC-101", "Token refresh race condition")
)
func authenticationFlow() async throws { ... }
```

### Exit Tests (Swift 6.2)

Exit tests verify that code terminates the process as expected — useful for testing fatalError, preconditionFailure, and assertion failures.

```swift
@Test("crashes on nil required value")
func nilRequired() async {
    await #expect(exitsWith: .failure) {
        let config: Configuration? = nil
        guard let config else { fatalError("Configuration required") }
        _ = config
    }
}

@Test("asserts on negative count")
func negativeCount() async {
    await #expect(exitsWith: .failure) {
        let counter = Counter(initialValue: -1)
        counter.validate() // calls precondition(count >= 0)
    }
}

@Test("exits cleanly on shutdown")
func cleanShutdown() async {
    await #expect(exitsWith: .success) {
        let app = TestApp()
        app.shutdown()
    }
}
```

### Custom TestScoping Traits

TestScoping traits provide setup/teardown behavior that wraps test execution — similar to XCTest's setUp/tearDown but composable and reusable.

```swift
// Define a reusable database fixture
struct DatabaseFixture: TestScoping {
    func provideScope(
        for test: Test,
        action: @Sendable () async throws -> Void
    ) async throws {
        // Setup
        let db = try await InMemoryDatabase.create()
        try await db.migrate()
        TestContext.database = db

        // Run the test
        try await action()

        // Teardown
        try await db.destroy()
        TestContext.database = nil
    }
}

// Apply to individual tests
@Test("stores encounter in database", DatabaseFixture())
func storeEncounter() async throws {
    let db = try #require(TestContext.database)
    let encounter = Encounter.sample
    try await db.save(encounter)
    let fetched = try await db.fetch(Encounter.self, id: encounter.id)
    #expect(fetched?.id == encounter.id)
}

// Apply to entire suite
@Suite("Database Operations", DatabaseFixture())
struct DatabaseOperationTests {
    @Test("creates record")
    func create() async throws { ... }

    @Test("reads record")
    func read() async throws { ... }

    @Test("updates record")
    func update() async throws { ... }

    @Test("deletes record")
    func delete() async throws { ... }
}
```

### Attachments for Debugging

Attach supplementary data to test results for debugging failures.

```swift
@Test("generates correct MDM output")
func mdmGeneration() async throws {
    let input = NarrativeInput.sample
    let output = try await generator.generate(from: input)

    // Attach input and output for debugging
    Test.current?.attach(input.description, named: "Input Narrative")
    Test.current?.attach(output.mdmText, named: "Generated MDM")

    #expect(output.sections.contains(.differentialDiagnosis))
    #expect(output.riskLevel != nil)
}

@Test("UI screenshot comparison")
func visualRegression() async throws {
    let screenshot = try await captureScreenshot()
    Test.current?.attach(screenshot, named: "Current Screenshot")
    // Compare with reference...
}
```

---

## Part 2: XCUITest Patterns

### Application Setup

```swift
import XCTest

final class AppLaunchTests: XCTestCase {
    let app = XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launchArguments = ["--uitesting"]
        app.launchEnvironment = [
            "MOCK_API": "true",
            "ANIMATION_SPEED": "0"
        ]
        app.launch()
    }

    override func tearDownWithError() throws {
        app.terminate()
    }
}
```

### Accessibility Identifier Patterns

#### Setting Identifiers in Production Code (ios-builder's responsibility)
```swift
// In SwiftUI Views — use .accessibilityIdentifier()
struct EncounterListView: View {
    var body: some View {
        List(encounters) { encounter in
            EncounterRow(encounter: encounter)
                .accessibilityIdentifier("encounter-row-\(encounter.id)")
        }
        .accessibilityIdentifier("encounter-list")

        Button("New Encounter") { ... }
            .accessibilityIdentifier("new-encounter-button")

        TextField("Search encounters", text: $searchText)
            .accessibilityIdentifier("encounter-search-input")
    }
}
```

#### Using Identifiers in Tests (ios-quality's responsibility)
```swift
final class EncounterFlowTests: XCTestCase {
    let app = XCUIApplication()

    func test_encounterList_displaysEncounters() {
        let list = app.scrollViews["encounter-list"]
        XCTAssertTrue(list.waitForExistence(timeout: 5))

        let firstRow = app.staticTexts["encounter-row-1"]
        XCTAssertTrue(firstRow.exists)
    }

    func test_newEncounter_opensComposeScreen() {
        let newButton = app.buttons["new-encounter-button"]
        XCTAssertTrue(newButton.waitForExistence(timeout: 5))
        newButton.tap()

        let composeScreen = app.otherElements["compose-screen"]
        XCTAssertTrue(composeScreen.waitForExistence(timeout: 5))
    }

    func test_search_filtersEncounters() {
        let searchField = app.textFields["encounter-search-input"]
        searchField.tap()
        searchField.typeText("chest pain")

        let filteredList = app.scrollViews["encounter-list"]
        // Verify filtered results...
    }
}
```

### Common XCUITest Interactions

```swift
// Tap
app.buttons["submit-encounter-button"].tap()

// Type text
app.textFields["narrative-input"].tap()
app.textFields["narrative-input"].typeText("45yo male presenting with chest pain")

// Clear and type
let field = app.textFields["medication-input"]
field.tap()
field.press(forDuration: 1.2) // long press to select all
app.menuItems["Select All"].tap()
field.typeText("new value")

// Swipe
app.scrollViews["encounter-list"].swipeUp()
app.scrollViews["encounter-list"].swipeDown()

// Pull to refresh
let firstCell = app.cells.firstMatch
let start = firstCell.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
let end = firstCell.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 5.0))
start.press(forDuration: 0, thenDragTo: end)

// Toggle
app.switches["trend-analysis-toggle"].tap()

// Picker / Segmented Control
app.segmentedControls["mode-selector"].buttons["Build Mode"].tap()

// Alert handling
let alert = app.alerts["confirm-delete"]
XCTAssertTrue(alert.waitForExistence(timeout: 5))
alert.buttons["Delete"].tap()

// Sheet / Modal
let sheet = app.sheets.firstMatch
XCTAssertTrue(sheet.waitForExistence(timeout: 5))
sheet.buttons["dismiss-button"].tap()

// Navigation back
app.navigationBars.buttons.element(boundBy: 0).tap()

// Wait for element
let element = app.staticTexts["mdm-output-text"]
let exists = element.waitForExistence(timeout: 10)
XCTAssertTrue(exists, "MDM output should appear within 10 seconds")
```

### Page Object Pattern for XCUITest

Encapsulate screen interactions in reusable page objects.

```swift
// Page objects live in Tests/UITests/Pages/
struct EncounterListPage {
    let app: XCUIApplication

    var encounterList: XCUIElement { app.scrollViews["encounter-list"] }
    var newEncounterButton: XCUIElement { app.buttons["new-encounter-button"] }
    var searchField: XCUIElement { app.textFields["encounter-search-input"] }

    func encounterRow(id: String) -> XCUIElement {
        app.staticTexts["encounter-row-\(id)"]
    }

    @discardableResult
    func tapNewEncounter() -> ComposePage {
        newEncounterButton.tap()
        return ComposePage(app: app)
    }

    func search(for text: String) {
        searchField.tap()
        searchField.typeText(text)
    }

    func waitForList(timeout: TimeInterval = 5) -> Bool {
        encounterList.waitForExistence(timeout: timeout)
    }
}

struct ComposePage {
    let app: XCUIApplication

    var narrativeInput: XCUIElement { app.textViews["narrative-input"] }
    var submitButton: XCUIElement { app.buttons["submit-encounter-button"] }
    var cancelButton: XCUIElement { app.buttons["cancel-compose-button"] }

    func enterNarrative(_ text: String) {
        narrativeInput.tap()
        narrativeInput.typeText(text)
    }

    @discardableResult
    func submit() -> OutputPage {
        submitButton.tap()
        return OutputPage(app: app)
    }

    func cancel() {
        cancelButton.tap()
    }
}

// Usage in tests
func test_createEncounter_fullFlow() {
    let listPage = EncounterListPage(app: app)
    XCTAssertTrue(listPage.waitForList())

    let composePage = listPage.tapNewEncounter()
    composePage.enterNarrative("45yo male with chest pain")

    let outputPage = composePage.submit()
    XCTAssertTrue(outputPage.waitForMDM())
}
```

### Xcode 26: Record/Replay/Review UI Automation

Xcode 26 introduces enhanced UI test recording capabilities:

1. **Record**: Click the record button in Xcode to capture user interactions as XCUITest code
2. **Replay**: Run recorded tests against different device configurations
3. **Review**: Visual diff of test execution with step-by-step screenshots

Best practices for recorded tests:
- Always replace generated identifiers with semantic accessibility identifiers
- Clean up recorded code to follow project naming conventions
- Add explicit waits (`waitForExistence`) — recordings may assume instant UI updates
- Extract repeated interactions into page objects
- Add meaningful assertions — recordings only capture actions, not verifications

---

## Part 3: Test Plan Configurations

### Full.xctestplan
```json
{
    "configurations": [
        {
            "name": "All Tests",
            "options": {
                "targetForVariableExpansion": "{AppName}"
            }
        }
    ],
    "defaultOptions": {
        "codeCoverage": true,
        "targetForVariableExpansion": "{AppName}",
        "testTimeoutsEnabled": true,
        "defaultTestExecutionTimeAllowance": 60,
        "maximumTestExecutionTimeAllowance": 300
    },
    "testTargets": [
        { "target": { "name": "{AppName}Tests" } },
        { "target": { "name": "{AppName}UITests" } }
    ]
}
```

### Acceptance.xctestplan
```json
{
    "configurations": [
        {
            "name": "iPhone 16 Plus",
            "options": {
                "targetForVariableExpansion": "{AppName}",
                "testExecutionOrdering": "random"
            }
        },
        {
            "name": "iPad Pro",
            "options": {
                "targetForVariableExpansion": "{AppName}",
                "testExecutionOrdering": "random"
            }
        }
    ],
    "defaultOptions": {
        "codeCoverage": false,
        "testTimeoutsEnabled": true,
        "defaultTestExecutionTimeAllowance": 120,
        "maximumTestExecutionTimeAllowance": 600,
        "environmentVariableEntries": [
            { "key": "MOCK_API", "value": "true" }
        ]
    },
    "testTargets": [
        {
            "target": { "name": "{AppName}UITests" },
            "options": {
                "testLanguage": "en",
                "testRegion": "US"
            }
        }
    ]
}
```

### Multi-Device Test Matrix
Configure test plans to run acceptance tests across device types:
- **iPhone 16 Plus** (6.7" display) — primary development target
- **iPhone SE** (4.7" display) — smallest supported screen
- **iPad Pro 13"** — tablet layout validation
- **iPad mini** — compact tablet layout

---

## Part 4: Mock Patterns for Protocol-Based DI

### Standard Mock Template

```swift
// File: Tests/Mocks/Mock{ServiceName}.swift

import Foundation
@testable import {AppName}

final class Mock{ServiceName}: {ServiceName}Protocol, @unchecked Sendable {
    // MARK: - Call Tracking
    var fetchCalled = false
    var fetchCallCount = 0
    var createCalled = false
    var createLastInput: CreateInput?
    var deleteCalled = false
    var deleteLastID: String?

    // MARK: - Result Stubs
    var fetchResult: Result<[Item], Error> = .success([])
    var createResult: Result<Item, Error> = .success(.sample)
    var deleteResult: Result<Void, Error> = .success(())

    // MARK: - Protocol Conformance
    func fetchItems() async throws -> [Item] {
        fetchCalled = true
        fetchCallCount += 1
        return try fetchResult.get()
    }

    func createItem(_ input: CreateInput) async throws -> Item {
        createCalled = true
        createLastInput = input
        return try createResult.get()
    }

    func deleteItem(id: String) async throws {
        deleteCalled = true
        deleteLastID = id
        try deleteResult.get()
    }

    // MARK: - Reset
    func reset() {
        fetchCalled = false
        fetchCallCount = 0
        createCalled = false
        createLastInput = nil
        deleteCalled = false
        deleteLastID = nil
        fetchResult = .success([])
        createResult = .success(.sample)
        deleteResult = .success(())
    }
}
```

### Mock for AI Manager

```swift
final class MockAIManager: AIManagerProtocol, @unchecked Sendable {
    var isAvailable = true
    var isProcessing = false

    var summarizeResult: Result<String, Error> = .success("Mock summary")
    var classifyResult: Result<ContentCategory, Error> = .success(.general)
    var generateResult: Result<String, Error> = .success("Mock generation")

    // Streaming mock
    var streamChunks: [String] = ["Hello", " world", "!"]

    func checkAvailability() -> Bool { isAvailable }

    func summarize(_ text: String) async throws -> String {
        isProcessing = true
        defer { isProcessing = false }
        return try summarizeResult.get()
    }

    func classify(_ content: String) async throws -> ContentCategory {
        return try classifyResult.get()
    }

    func streamResponse(for prompt: String) -> AsyncStream<String> {
        AsyncStream { continuation in
            Task {
                for chunk in streamChunks {
                    try? await Task.sleep(for: .milliseconds(50))
                    continuation.yield(chunk)
                }
                continuation.finish()
            }
        }
    }
}
```

### Mock for Networking

```swift
final class MockAPIClient: APIClientProtocol, @unchecked Sendable {
    var responses: [String: Any] = [:]
    var requestLog: [(endpoint: String, method: String)] = []

    func request<T: Decodable>(
        endpoint: String,
        method: HTTPMethod,
        body: (any Encodable)?
    ) async throws -> T {
        requestLog.append((endpoint: endpoint, method: method.rawValue))

        guard let response = responses[endpoint] as? T else {
            throw APIError.invalidResponse
        }
        return response
    }

    // Convenience for setting up responses
    func stub<T>(_ endpoint: String, with response: T) {
        responses[endpoint] = response
    }

    func reset() {
        responses.removeAll()
        requestLog.removeAll()
    }
}
```

### Sample Data Helpers

```swift
// File: Tests/Mocks/SampleData.swift

extension Encounter {
    static var sample: Encounter {
        Encounter(
            id: "test-encounter-1",
            chiefComplaint: "Chest pain",
            narrative: "45yo male presenting with acute onset chest pain",
            createdAt: Date()
        )
    }

    static var sampleList: [Encounter] {
        [
            Encounter(id: "1", chiefComplaint: "Chest pain", narrative: "...", createdAt: Date()),
            Encounter(id: "2", chiefComplaint: "Headache", narrative: "...", createdAt: Date()),
            Encounter(id: "3", chiefComplaint: "Abdominal pain", narrative: "...", createdAt: Date()),
        ]
    }
}
```

---

## Part 5: Integration Patterns

### Testing @Observable ViewModels

```swift
@Suite("EncounterViewModel")
struct EncounterViewModelTests {
    let mockService: MockEncounterService
    let viewModel: EncounterViewModel

    init() {
        mockService = MockEncounterService()
        viewModel = EncounterViewModel(service: mockService)
    }

    @Test("initial state is empty", .tags(.unit))
    func initialState() {
        #expect(viewModel.encounters.isEmpty)
        #expect(viewModel.isLoading == false)
        #expect(viewModel.errorMessage == nil)
    }

    @Test("load sets isLoading during fetch", .tags(.unit))
    func loadingState() async {
        mockService.fetchResult = .success(Encounter.sampleList)
        // Note: Testing intermediate states requires observation
        await viewModel.load()
        #expect(viewModel.isLoading == false) // After completion
        #expect(viewModel.encounters.count == 3)
    }

    @Test("load maps network error to user message", .tags(.unit))
    func errorMapping() async {
        mockService.fetchResult = .failure(NetworkError.timeout)
        await viewModel.load()
        #expect(viewModel.errorMessage == "Network timeout. Please try again.")
        #expect(viewModel.encounters.isEmpty)
    }

    @Test("delete removes encounter and calls service", .tags(.unit))
    func deleteEncounter() async throws {
        mockService.fetchResult = .success(Encounter.sampleList)
        await viewModel.load()
        let initialCount = viewModel.encounters.count

        try await viewModel.delete(viewModel.encounters[0])

        #expect(viewModel.encounters.count == initialCount - 1)
        #expect(mockService.deleteCalled)
    }

    @Test("search filters by chief complaint", .tags(.unit), arguments: [
        ("chest", 1),
        ("pain", 2),    // "Chest pain" and "Abdominal pain"
        ("xyz", 0),
        ("", 3)          // empty search returns all
    ])
    func searchFiltering(query: String, expectedCount: Int) async {
        mockService.fetchResult = .success(Encounter.sampleList)
        await viewModel.load()
        viewModel.searchText = query
        #expect(viewModel.filteredEncounters.count == expectedCount)
    }
}
```

### Testing SwiftData Models

```swift
@Suite("Encounter Model", DatabaseFixture())
struct EncounterModelTests {

    @Test("saves and retrieves encounter", .tags(.unit))
    func saveAndRetrieve() async throws {
        let context = try #require(TestContext.modelContext)
        let encounter = Encounter(chiefComplaint: "Test", narrative: "Test narrative")

        context.insert(encounter)
        try context.save()

        let descriptor = FetchDescriptor<Encounter>()
        let results = try context.fetch(descriptor)
        #expect(results.count == 1)
        #expect(results.first?.chiefComplaint == "Test")
    }

    @Test("cascades delete to related records", .tags(.unit))
    func cascadeDelete() async throws {
        let context = try #require(TestContext.modelContext)
        let encounter = Encounter(chiefComplaint: "Test", narrative: "Test")
        let diagnosis = Diagnosis(name: "MI", encounter: encounter)
        encounter.diagnoses.append(diagnosis)

        context.insert(encounter)
        try context.save()

        context.delete(encounter)
        try context.save()

        let diagResults = try context.fetch(FetchDescriptor<Diagnosis>())
        #expect(diagResults.isEmpty)
    }
}
```

### Testing Async Streams (AI Responses)

```swift
@Suite("AI Streaming")
struct AIStreamingTests {
    let mockAI = MockAIManager()

    @Test("streams response chunks in order", .tags(.unit))
    func streamOrder() async {
        mockAI.streamChunks = ["The ", "patient ", "presents ", "with..."]
        var collected: [String] = []

        for await chunk in mockAI.streamResponse(for: "test prompt") {
            collected.append(chunk)
        }

        #expect(collected == ["The ", "patient ", "presents ", "with..."])
        #expect(collected.joined() == "The patient presents with...")
    }

    @Test("handles empty stream gracefully", .tags(.unit))
    func emptyStream() async {
        mockAI.streamChunks = []
        var collected: [String] = []

        for await chunk in mockAI.streamResponse(for: "test") {
            collected.append(chunk)
        }

        #expect(collected.isEmpty)
    }
}
```
