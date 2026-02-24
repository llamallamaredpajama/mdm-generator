# Swift Patterns Reference — iOS 26 / Swift 6.2

Deep reference for Forge (iOS Builder) agent. Consult when executing menu items [NL], [LG], [FM], [SD], [AI].

---

## Liquid Glass Design System

### Overview

Liquid Glass is Apple's design language introduced at WWDC 2025. Glass effects elevate controls and navigation above content. Recompiling with Xcode 26 gives automatic adoption for standard controls (TabView, NavigationBar, ToolbarItems). Custom UI requires explicit `glassEffect()` adoption.

### Glass Variants

```swift
// Regular glass — default translucent appearance
.glassEffect(.regular)

// Clear glass — lighter, more transparent
.glassEffect(.clear)

// Identity glass — for avatar/profile elements, circular by default
.glassEffect(.identity)
```

### Tinting (Semantic Meaning Only)

Tint communicates meaning, not decoration. Use sparingly.

```swift
// Primary action (e.g., submit, confirm)
Button("Submit") { }
    .glassEffect(.regular.tint(.accentColor))

// Destructive action
Button("Delete") { }
    .glassEffect(.regular.tint(.red))

// Success state
.glassEffect(.regular.tint(.green))
```

### Interactive Glass

Adds scaling, bouncing, and shimmering on tap. Use for all tappable glass elements.

```swift
Button("Generate MDM") {
    await viewModel.generate()
}
.glassEffect(.regular.interactive())
.accessibilityIdentifier("compose.generate.button")
```

### Shape Control

```swift
// Capsule (default) — best for buttons
.glassEffect(.regular, in: .capsule)

// Rounded rectangle — best for cards
.glassEffect(.regular, in: .rect(cornerRadius: 16))

// Circle — best for icon buttons
.glassEffect(.regular, in: .circle)

// Custom shape
.glassEffect(.regular, in: .rect(cornerRadii: .init(topLeading: 20, bottomTrailing: 20)))
```

### GlassEffectContainer (Grouping)

Groups glass elements so they share rendering context and morph together during animations.

```swift
GlassEffectContainer {
    HStack(spacing: 12) {
        Button("Copy") { }
            .glassEffect(.regular.interactive())
            .accessibilityIdentifier("output.copy.button")

        Button("Share") { }
            .glassEffect(.regular.interactive())
            .accessibilityIdentifier("output.share.button")

        Button("New") { }
            .glassEffect(.regular.tint(.accentColor).interactive())
            .accessibilityIdentifier("output.new.button")
    }
}
```

### Glass Morphing Transitions

Use `glassEffectID` + `@Namespace` for smooth morphing between states.

```swift
struct ExpandableToolbar: View {
    @Namespace private var toolbarNamespace
    @State private var isExpanded = false

    var body: some View {
        if isExpanded {
            HStack {
                ForEach(actions) { action in
                    Button(action.title) { action.perform() }
                        .glassEffect(.regular.interactive())
                        .glassEffectID(action.id, in: toolbarNamespace)
                }
            }
        } else {
            Button("Actions") { isExpanded.toggle() }
                .glassEffect(.regular.interactive())
                .glassEffectID("collapsed", in: toolbarNamespace)
        }
    }
}
```

### Layout Rules (Mandatory)

| Rule | Detail |
|------|--------|
| Glass above content | Use `ZStack` with content below, glass controls on top |
| Full-bleed backgrounds | Place imagery/content behind glass for best visual effect |
| Never glass-on-glass | Glass cannot sample other glass; use `GlassEffectContainer` for grouping |
| No `.blur` behind glass | System handles blur; adding your own creates double-blur artifacts |
| No `.opacity` on glass | Breaks translucency calculations |
| No solid `.background` | Defeats the purpose of glass transparency |
| Controls and nav only | Glass is for interactive elements, never for main content areas |

### Backward Compatibility

```swift
extension View {
    @ViewBuilder
    func adaptiveGlass(_ variant: some ShapeStyle = .ultraThinMaterial) -> some View {
        if #available(iOS 26, *) {
            self.glassEffect(.regular)
        } else {
            self.background(variant, in: RoundedRectangle(cornerRadius: 16))
        }
    }
}
```

---

## Foundation Models Framework

### Availability Check (Always Required)

```swift
import FoundationModels

func checkAIAvailability() -> Bool {
    let model = SystemLanguageModel.default
    switch model.availability {
    case .available:
        return true
    case .unavailable(let reason):
        switch reason {
        case .deviceNotEligible:
            // iPhone 14 or earlier, non-M1 iPad/Mac
            return false
        case .appleIntelligenceNotEnabled:
            // User has not enabled Apple Intelligence in Settings
            return false
        case .modelNotReady:
            // Model is downloading or updating
            return false
        @unknown default:
            return false
        }
    }
}
```

### @Generable for Structured Output

```swift
import FoundationModels

@Generable
struct ClinicalSummary {
    @Guide(description: "Primary chief complaint in clinical terminology")
    var chiefComplaint: String

    @Guide(description: "List of differential diagnoses ordered worst-first")
    var differentials: [String]

    @Guide(description: "Recommended workup items")
    var workup: [String]

    @Guide(description: "Risk level assessment: low, moderate, high, critical")
    var riskLevel: RiskLevel
}

@Generable
enum RiskLevel: String, CaseIterable {
    case low, moderate, high, critical
}
```

### Session Management

```swift
@Observable
@MainActor
final class AIManager {
    var isAvailable = false
    var isProcessing = false
    var streamedText = ""
    var error: String?

    private var session: LanguageModelSession?

    func checkAvailability() {
        let model = SystemLanguageModel.default
        isAvailable = model.availability == .available
    }

    func createSession(instructions: String) {
        session = LanguageModelSession {
            instructions
        }
    }

    // Simple response
    func respond(to prompt: String) async {
        guard let session else { return }
        isProcessing = true
        defer { isProcessing = false }

        do {
            let response = try await session.respond(to: prompt)
            streamedText = response.content
        } catch {
            self.error = error.localizedDescription
        }
    }

    // Streaming response
    func streamRespond(to prompt: String) async {
        guard let session else { return }
        isProcessing = true
        streamedText = ""

        do {
            for try await partial in session.streamResponse(to: prompt) {
                streamedText = partial.content
            }
        } catch {
            self.error = error.localizedDescription
        }

        isProcessing = false
    }

    // Structured output
    func generateStructured<T: Generable>(
        prompt: String,
        type: T.Type
    ) async -> T? {
        guard let session else { return nil }
        isProcessing = true
        defer { isProcessing = false }

        do {
            return try await session.respond(to: prompt, generating: type)
        } catch {
            self.error = error.localizedDescription
            return nil
        }
    }
}
```

### Tool Protocol

```swift
import FoundationModels

struct LookupMedication: Tool {
    let name = "lookup_medication"
    let description = "Look up medication information from the local formulary"

    struct Input: Codable {
        let medicationName: String
    }

    struct Output: Codable {
        let genericName: String
        let drugClass: String
        let commonInteractions: [String]
    }

    func call(input: Input) async throws -> Output {
        // Call local database or API
        let result = try await formularyService.lookup(input.medicationName)
        return Output(
            genericName: result.genericName,
            drugClass: result.drugClass,
            commonInteractions: result.interactions
        )
    }
}

// Register with session
let session = LanguageModelSession(
    instructions: "You assist with medication lookups.",
    tools: [LookupMedication()]
)
```

### Streaming UI Pattern

```swift
struct AIResponseView: View {
    @State private var aiManager = AIManager()

    var body: some View {
        VStack(alignment: .leading) {
            if aiManager.isProcessing {
                HStack {
                    ProgressView()
                    Text("Analyzing...")
                        .foregroundStyle(.secondary)
                }
            }

            if !aiManager.streamedText.isEmpty {
                Text(aiManager.streamedText)
                    .textSelection(.enabled)
                    .animation(.easeInOut, value: aiManager.streamedText)
            }

            if let error = aiManager.error {
                Label(error, systemImage: "exclamationmark.triangle")
                    .foregroundStyle(.red)
            }
        }
        .task {
            aiManager.checkAvailability()
        }
    }
}
```

### What Foundation Models Is Good/Bad At

| Good At | Bad At |
|---------|--------|
| Text classification | World knowledge / factual recall |
| Summarization | Advanced reasoning / math |
| Data extraction | Code generation |
| Content generation (short) | Long-form writing |
| Search suggestions | Real-time information |
| Sentiment analysis | Multi-step logic chains |

---

## SwiftData Patterns

### @Model Definition

```swift
import SwiftData

@Model
final class Encounter {
    var id: UUID
    var narrative: String
    var chiefComplaint: String?
    var mdmText: String?
    var complexity: String?
    var createdAt: Date
    var updatedAt: Date
    var status: EncounterStatus

    // Relationship
    @Relationship(deleteRule: .cascade)
    var sections: [EncounterSection]

    init(
        narrative: String,
        chiefComplaint: String? = nil,
        status: EncounterStatus = .draft
    ) {
        self.id = UUID()
        self.narrative = narrative
        self.chiefComplaint = chiefComplaint
        self.createdAt = Date()
        self.updatedAt = Date()
        self.status = status
        self.sections = []
    }
}

enum EncounterStatus: String, Codable {
    case draft, section1Complete, section2Complete, finalized
}

@Model
final class EncounterSection {
    var id: UUID
    var sectionNumber: Int
    var inputData: String
    var outputData: String?
    var submissionCount: Int
    var createdAt: Date

    @Relationship(inverse: \Encounter.sections)
    var encounter: Encounter?

    init(sectionNumber: Int, inputData: String) {
        self.id = UUID()
        self.sectionNumber = sectionNumber
        self.inputData = inputData
        self.submissionCount = 0
        self.createdAt = Date()
    }
}
```

### ModelContainer Setup

```swift
@main
struct MDMApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [Encounter.self, EncounterSection.self])
    }
}
```

### @Query in Views

```swift
struct EncounterListView: View {
    @Query(sort: \Encounter.updatedAt, order: .reverse)
    private var encounters: [Encounter]

    @Environment(\.modelContext) private var modelContext

    var body: some View {
        List(encounters) { encounter in
            EncounterRow(encounter: encounter)
                .accessibilityIdentifier("encounter.row-\(encounter.id)")
        }
    }

    func deleteEncounter(_ encounter: Encounter) {
        modelContext.delete(encounter)
    }
}
```

### VersionedSchema Migrations

```swift
enum EncounterSchemaV1: VersionedSchema {
    static var versionIdentifier = Schema.Version(1, 0, 0)
    static var models: [any PersistentModel.Type] {
        [Encounter.self]
    }

    @Model
    final class Encounter {
        var id: UUID
        var narrative: String
        var createdAt: Date
    }
}

enum EncounterSchemaV2: VersionedSchema {
    static var versionIdentifier = Schema.Version(2, 0, 0)
    static var models: [any PersistentModel.Type] {
        [Encounter.self, EncounterSection.self]
    }

    // Updated model definitions...
}

enum EncounterMigrationPlan: SchemaMigrationPlan {
    static var schemas: [any VersionedSchema.Type] {
        [EncounterSchemaV1.self, EncounterSchemaV2.self]
    }

    static var stages: [MigrationStage] {
        [migrateV1toV2]
    }

    static let migrateV1toV2 = MigrationStage.lightweight(
        fromVersion: EncounterSchemaV1.self,
        toVersion: EncounterSchemaV2.self
    )
}
```

---

## App Intents

### AppIntent Definition

```swift
import AppIntents

struct GenerateMDMIntent: AppIntent {
    static var title: LocalizedStringResource = "Generate MDM"
    static var description: IntentDescription = "Generate Medical Decision Making documentation from a narrative"
    static var openAppWhenRun = true

    @Parameter(title: "Clinical Narrative")
    var narrative: String

    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Validate input
        guard !narrative.isEmpty else {
            throw $narrative.needsValueError("Please provide a clinical narrative")
        }

        // Navigate to compose screen with the narrative
        await NavigationManager.shared.navigateToCompose(narrative: narrative)

        return .result(dialog: "Opening MDM Generator with your narrative...")
    }
}
```

### AppEntity Definition

```swift
import AppIntents

struct EncounterEntity: AppEntity {
    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Encounter")
    static var defaultQuery = EncounterQuery()

    var id: UUID
    var chiefComplaint: String
    var status: String
    var createdAt: Date

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(
            title: "\(chiefComplaint)",
            subtitle: "\(status) - \(createdAt.formatted(.dateTime.month().day()))"
        )
    }
}

struct EncounterQuery: EntityQuery {
    func entities(for identifiers: [UUID]) async throws -> [EncounterEntity] {
        // Fetch from SwiftData
        try await fetchEncounters(ids: identifiers)
    }

    func suggestedEntities() async throws -> [EncounterEntity] {
        // Return recent encounters
        try await fetchRecentEncounters(limit: 5)
    }
}
```

### AppShortcutsProvider

```swift
struct MDMShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: GenerateMDMIntent(),
            phrases: [
                "Generate MDM with \(\.$narrative)",
                "Create medical decision making",
                "Start MDM documentation"
            ],
            shortTitle: "Generate MDM",
            systemImageName: "doc.text"
        )
    }
}
```

### Interactive Snippets (Siri/Spotlight Results)

```swift
struct EncounterSnippetView: View {
    let encounter: EncounterEntity

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(encounter.chiefComplaint)
                .font(.headline)
            Text(encounter.status)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            HStack {
                Button("View") {
                    // Open encounter
                }
                .glassEffect(.regular.interactive())

                Button("Copy MDM") {
                    // Copy to clipboard
                }
                .glassEffect(.regular.tint(.accentColor).interactive())
            }
        }
        .padding()
    }
}
```

---

## NavigationStack + NavigationPath

### Router Pattern

```swift
@Observable
@MainActor
final class Router {
    var path = NavigationPath()

    enum Destination: Hashable {
        case compose
        case preflight(narrative: String)
        case output(mdmText: String)
        case settings
        case buildMode
        case encounterDetail(id: UUID)
    }

    func navigate(to destination: Destination) {
        path.append(destination)
    }

    func pop() {
        guard !path.isEmpty else { return }
        path.removeLast()
    }

    func popToRoot() {
        path = NavigationPath()
    }
}

// Usage in root view
struct RootView: View {
    @State private var router = Router()

    var body: some View {
        NavigationStack(path: $router.path) {
            HomeView()
                .navigationDestination(for: Router.Destination.self) { destination in
                    switch destination {
                    case .compose:
                        ComposeView()
                    case .preflight(let narrative):
                        PreflightView(narrative: narrative)
                    case .output(let mdmText):
                        OutputView(mdmText: mdmText)
                    case .settings:
                        SettingsView()
                    case .buildMode:
                        BuildModeView()
                    case .encounterDetail(let id):
                        EncounterDetailView(encounterId: id)
                    }
                }
        }
        .environment(router)
    }
}
```

---

## Custom ViewModifiers for Reusable Behavior

### Loading Overlay

```swift
struct LoadingOverlayModifier: ViewModifier {
    let isLoading: Bool
    let message: String

    func body(content: Content) -> some View {
        content
            .overlay {
                if isLoading {
                    ZStack {
                        Color.black.opacity(0.3)
                            .ignoresSafeArea()
                        VStack(spacing: 12) {
                            ProgressView()
                            Text(message)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        .padding(24)
                        .glassEffect(.regular, in: .rect(cornerRadius: 16))
                    }
                }
            }
            .animation(.easeInOut, value: isLoading)
    }
}

extension View {
    func loadingOverlay(_ isLoading: Bool, message: String = "Loading...") -> some View {
        modifier(LoadingOverlayModifier(isLoading: isLoading, message: message))
    }
}
```

### Error Banner

```swift
struct ErrorBannerModifier: ViewModifier {
    let errorMessage: String?
    let onDismiss: () -> Void

    func body(content: Content) -> some View {
        content
            .overlay(alignment: .top) {
                if let errorMessage {
                    HStack {
                        Label(errorMessage, systemImage: "exclamationmark.triangle")
                            .font(.subheadline)
                        Spacer()
                        Button("Dismiss", systemImage: "xmark.circle") {
                            onDismiss()
                        }
                        .labelStyle(.iconOnly)
                        .accessibilityIdentifier("error.dismiss.button")
                    }
                    .padding()
                    .glassEffect(.regular.tint(.red), in: .rect(cornerRadius: 12))
                    .padding()
                    .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
            .animation(.spring, value: errorMessage)
    }
}

extension View {
    func errorBanner(_ message: String?, onDismiss: @escaping () -> Void) -> some View {
        modifier(ErrorBannerModifier(errorMessage: message, onDismiss: onDismiss))
    }
}
```

---

## Dark Mode and Adaptive Layouts

### Automatic Adaptation

- Liquid Glass adapts automatically to light/dark mode
- Use semantic system colors (`Color.primary`, `.secondary`, `.accentColor`)
- Use `@Environment(\.colorScheme)` only when conditional behavior is required
- SF Symbols automatically adapt rendering mode to context

### Dynamic Type Support

```swift
struct AdaptiveView: View {
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        if typeSize.isAccessibilitySize {
            // Stack vertically for accessibility sizes
            VStack(alignment: .leading) {
                labelContent
                controlContent
            }
        } else {
            // Horizontal layout for standard sizes
            HStack {
                labelContent
                Spacer()
                controlContent
            }
        }
    }
}
```

### Size Class Adaptation

```swift
struct AdaptiveLayout: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    var body: some View {
        if horizontalSizeClass == .regular {
            // iPad: side-by-side layout
            NavigationSplitView {
                sidebar
            } detail: {
                detail
            }
        } else {
            // iPhone: stacked navigation
            NavigationStack {
                content
            }
        }
    }
}
```

### Preview Configurations

```swift
#Preview("Light Mode") {
    FeatureView()
        .environment(\.colorScheme, .light)
}

#Preview("Dark Mode") {
    FeatureView()
        .environment(\.colorScheme, .dark)
}

#Preview("Large Text") {
    FeatureView()
        .environment(\.dynamicTypeSize, .accessibility3)
}

#Preview("iPad") {
    FeatureView()
        .previewDevice("iPad Pro 13-inch (M4)")
}
```
