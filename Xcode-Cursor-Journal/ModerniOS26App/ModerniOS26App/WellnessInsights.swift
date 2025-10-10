import SwiftUI
import Foundation

// MARK: - Wellness Insights Service
@available(iOS 18.0, *)
@MainActor
class WellnessInsightsService: ObservableObject {
    @Published var weeklySummaries: [WeeklySummary] = []
    @Published var isGeneratingSummary = false
    @Published var lastSummaryDate: Date?
    
    private let cloudAIService = CloudAIService()
    private let privacyManager = AIPrivacyManager()
    private let patternEngine = PatternAnalysisEngine()
    
    // MARK: - Weekly Summary Generation
    func generateWeeklySummary(entries: [JournalEntry]) async -> WeeklySummary? {
        guard !entries.isEmpty else { return nil }
        
        isGeneratingSummary = true
        defer { isGeneratingSummary = false }
        
        // Get entries from the past week
        let calendar = Calendar.current
        let oneWeekAgo = calendar.date(byAdding: .weekOfYear, value: -1, to: Date()) ?? Date()
        let weekEntries = entries.filter { $0.date >= oneWeekAgo }
        
        guard !weekEntries.isEmpty else { return nil }
        
        if privacyManager.canUseCloudAI() {
            // Use cloud AI for advanced summary
            do {
                let summary = try await cloudAIService.generateWeeklySummary(entries: weekEntries)
                weeklySummaries.append(summary)
                lastSummaryDate = Date()
                saveWeeklySummaries()
                return summary
            } catch {
                // Fallback to local summary
                return generateLocalWeeklySummary(entries: weekEntries)
            }
        } else {
            // Use local summary only
            return generateLocalWeeklySummary(entries: weekEntries)
        }
    }
    
    // MARK: - Local Summary Generation
    private func generateLocalWeeklySummary(entries: [JournalEntry]) -> WeeklySummary {
        // Extract key themes
        var allTopics: [String] = []
        for entry in entries {
            let topics = RealAIService().extractTopics(from: entry.content)
            allTopics.append(contentsOf: topics)
        }
        
        let topicCounts = Dictionary(grouping: allTopics, by: { $0 })
            .mapValues { $0.count }
            .sorted { $0.value > $1.value }
        
        let keyThemes = Array(topicCounts.prefix(3).map { $0.key })
        
        // Calculate overall emotional tone
        let sentiments = entries.map { RealAIService().analyzeSentiment(text: $0.content) }
        let positiveCount = sentiments.filter { $0 == .positive }.count
        let negativeCount = sentiments.filter { $0 == .negative }.count
        
        let emotionalTone: AIInsights.Sentiment
        if positiveCount > negativeCount {
            emotionalTone = .positive
        } else if negativeCount > positiveCount {
            emotionalTone = .negative
        } else {
            emotionalTone = .neutral
        }
        
        // Generate highlights
        var highlights: [String] = []
        
        // Mood highlights
        let moodCounts = Dictionary(grouping: entries, by: { $0.mood })
            .mapValues { $0.count }
            .sorted { $0.value > $1.value }
        
        if let topMood = moodCounts.first {
            highlights.append("You felt \(topMood.key.rawValue) most often this week")
        }
        
        // Entry count highlight
        highlights.append("You wrote \(entries.count) entries this week")
        
        // Word count highlight
        let totalWords = entries.reduce(0) { $0 + $1.wordCount }
        highlights.append("You wrote \(totalWords) words total")
        
        // Generate growth moments
        var growthMoments: [String] = []
        
        // Check for gratitude
        let gratitudeEntries = entries.filter { entry in
            ["grateful", "thankful", "appreciate"].contains { keyword in
                entry.content.lowercased().contains(keyword)
            }
        }
        
        if !gratitudeEntries.isEmpty {
            growthMoments.append("You expressed gratitude \(gratitudeEntries.count) times")
        }
        
        // Check for reflection
        let reflectionEntries = entries.filter { entry in
            ["think", "realize", "understand", "learn"].contains { keyword in
                entry.content.lowercased().contains(keyword)
            }
        }
        
        if !reflectionEntries.isEmpty {
            growthMoments.append("You engaged in self-reflection \(reflectionEntries.count) times")
        }
        
        let summary = WeeklySummary(
            keyThemes: keyThemes,
            emotionalTone: emotionalTone,
            highlights: highlights,
            growthMoments: growthMoments
        )
        
        weeklySummaries.append(summary)
        lastSummaryDate = Date()
        saveWeeklySummaries()
        
        return summary
    }
    
    // MARK: - Personalized Recommendations
    func generateWellnessRecommendations(entries: [JournalEntry]) async -> [Recommendation] {
        var recommendations: [Recommendation] = []
        
        // Analyze patterns
        let moodPatterns = await patternEngine.analyzeMoodPatterns(entries: entries)
        let growthMetrics = await patternEngine.analyzeGrowthMetrics(entries: entries)
        
        // Mood-based recommendations
        if let anxiousPattern = moodPatterns.first(where: { $0.mood == .anxious }) {
            if anxiousPattern.frequency > 0.3 {
                recommendations.append(Recommendation(
                    type: .mindfulness,
                    title: "Mindfulness Practice",
                    description: "You've been feeling anxious frequently. Consider trying mindfulness exercises.",
                    priority: .high,
                    actionableSteps: [
                        "Try 5-minute breathing exercises",
                        "Practice gratitude journaling",
                        "Consider meditation apps"
                    ],
                    expectedOutcome: "Reduced anxiety and improved emotional well-being"
                ))
            }
        }
        
        // Growth-based recommendations
        for metric in growthMetrics {
            switch metric.metricType {
            case .gratitude:
                if metric.value < 0.1 {
                    recommendations.append(Recommendation(
                        type: .reflection,
                        title: "Gratitude Practice",
                        description: "Consider writing about what you're grateful for more often.",
                        priority: .medium,
                        actionableSteps: [
                            "Write 3 things you're grateful for each day",
                            "Reflect on positive experiences",
                            "Thank someone who helped you"
                        ],
                        expectedOutcome: "Increased positivity and life satisfaction"
                    ))
                }
            case .socialConnection:
                if metric.value < 0.2 {
                    recommendations.append(Recommendation(
                        type: .social,
                        title: "Social Connection",
                        description: "Consider writing more about your relationships and social connections.",
                        priority: .medium,
                        actionableSteps: [
                            "Write about meaningful conversations",
                            "Reflect on your relationships",
                            "Plan social activities"
                        ],
                        expectedOutcome: "Stronger relationships and social well-being"
                    ))
                }
            case .resilience:
                if metric.value < 0.1 {
                    recommendations.append(Recommendation(
                        type: .wellness,
                        title: "Build Resilience",
                        description: "Focus on developing your ability to bounce back from challenges.",
                        priority: .high,
                        actionableSteps: [
                            "Write about challenges you've overcome",
                            "Identify your strengths",
                            "Practice positive self-talk"
                        ],
                        expectedOutcome: "Better ability to handle life's challenges"
                    ))
                }
            default:
                break
            }
        }
        
        // Activity-based recommendations
        let activityRecommendations = generateActivityRecommendations(entries: entries)
        recommendations.append(contentsOf: activityRecommendations)
        
        return recommendations.sorted { $0.priority.rawValue > $1.priority.rawValue }
    }
    
    private func generateActivityRecommendations(entries: [JournalEntry]) -> [Recommendation] {
        var recommendations: [Recommendation] = []
        
        // Analyze activity mentions
        let activityKeywords = [
            "exercise": ["exercise", "workout", "gym", "run", "walk", "sport"],
            "nature": ["nature", "outdoor", "park", "hiking", "beach", "garden"],
            "creative": ["creative", "art", "music", "write", "draw", "paint"],
            "social": ["friend", "family", "party", "dinner", "meeting"]
        ]
        
        var activityCounts: [String: Int] = [:]
        
        for entry in entries {
            for (activity, keywords) in activityKeywords {
                let count = keywords.filter { keyword in
                    entry.content.lowercased().contains(keyword)
                }.count
                
                if count > 0 {
                    activityCounts[activity, default: 0] += 1
                }
            }
        }
        
        // Recommend activities that are rarely mentioned
        for (activity, count) in activityCounts {
            if count < 2 { // Less than 2 mentions
                switch activity {
                case "exercise":
                    recommendations.append(Recommendation(
                        type: .wellness,
                        title: "Physical Activity",
                        description: "Consider incorporating more physical activity into your routine.",
                        priority: .medium,
                        actionableSteps: [
                            "Take a 10-minute walk",
                            "Try a new exercise",
                            "Join a fitness class"
                        ],
                        expectedOutcome: "Improved physical health and energy"
                    ))
                case "nature":
                    recommendations.append(Recommendation(
                        type: .wellness,
                        title: "Nature Connection",
                        description: "Spending time in nature can boost your mood and well-being.",
                        priority: .low,
                        actionableSteps: [
                            "Visit a local park",
                            "Take a nature walk",
                            "Spend time in your garden"
                        ],
                        expectedOutcome: "Reduced stress and improved mood"
                    ))
                case "creative":
                    recommendations.append(Recommendation(
                        type: .creative,
                        title: "Creative Expression",
                        description: "Engaging in creative activities can enhance your well-being.",
                        priority: .low,
                        actionableSteps: [
                            "Try a new creative hobby",
                            "Write creatively",
                            "Explore art or music"
                        ],
                        expectedOutcome: "Increased creativity and self-expression"
                    ))
                default:
                    break
                }
            }
        }
        
        return recommendations
    }
    
    // MARK: - Data Persistence
    private func saveWeeklySummaries() {
        if let encoded = try? JSONEncoder().encode(weeklySummaries) {
            UserDefaults.standard.set(encoded, forKey: "WeeklySummaries")
        }
    }
    
    private func loadWeeklySummaries() {
        if let data = UserDefaults.standard.data(forKey: "WeeklySummaries"),
           let decoded = try? JSONDecoder().decode([WeeklySummary].self, from: data) {
            weeklySummaries = decoded
        }
    }
    
    func clearWeeklySummaries() {
        weeklySummaries.removeAll()
        lastSummaryDate = nil
        saveWeeklySummaries()
    }
}

// MARK: - Wellness Insights View
@available(iOS 18.0, *)
struct WellnessInsightsView: View {
    @StateObject private var wellnessService = WellnessInsightsService()
    @EnvironmentObject var journalManager: JournalManager
    
    @State private var selectedTab: WellnessTab = .summary
    @State private var recommendations: [Recommendation] = []
    @State private var isLoading = false
    
    enum WellnessTab: String, CaseIterable {
        case summary = "Summary"
        case recommendations = "Recommendations"
        case activities = "Activities"
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab selector
                tabSelector
                
                // Content
                ScrollView {
                    LazyVStack(spacing: 20) {
                        switch selectedTab {
                        case .summary:
                            weeklySummaryContent
                        case .recommendations:
                            recommendationsContent
                        case .activities:
                            activitiesContent
                        }
                    }
                    .padding()
                }
            }
            .background(
                LinearGradient(
                    colors: [.green.opacity(0.1), .blue.opacity(0.1)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .navigationTitle("Wellness Insights")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: refreshInsights) {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(.green)
                    }
                    .disabled(isLoading)
                }
            }
        }
        .onAppear {
            loadInsights()
        }
    }
    
    private var tabSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(WellnessTab.allCases, id: \.self) { tab in
                    Button(action: {
                        selectedTab = tab
                    }) {
                        Text(tab.rawValue)
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(selectedTab == tab ? .white : .primary)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(
                                Capsule()
                                    .fill(selectedTab == tab ? .green : .clear)
                            )
                    }
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
    }
    
    private var weeklySummaryContent: some View {
        VStack(spacing: 20) {
            // Generate summary button
            if wellnessService.weeklySummaries.isEmpty {
                generateSummaryButton
            } else {
                // Latest summary
                if let latestSummary = wellnessService.weeklySummaries.last {
                    WeeklySummaryCard(summary: latestSummary)
                }
                
                // Previous summaries
                if wellnessService.weeklySummaries.count > 1 {
                    previousSummariesSection
                }
            }
        }
    }
    
    private var generateSummaryButton: some View {
        VStack(spacing: 16) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 50))
                .foregroundColor(.green)
            
            Text("Generate Weekly Summary")
                .font(.headline)
                .foregroundColor(.primary)
            
            Text("Get insights about your week and track your emotional journey")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button(action: generateWeeklySummary) {
                HStack {
                    if wellnessService.isGeneratingSummary {
                        ProgressView()
                            .scaleEffect(0.8)
                    } else {
                        Image(systemName: "sparkles")
                    }
                    
                    Text("Generate Summary")
                        .fontWeight(.medium)
                }
                .foregroundColor(.white)
                .padding()
                .frame(maxWidth: .infinity)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(.green)
                )
            }
            .disabled(wellnessService.isGeneratingSummary)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    private var previousSummariesSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Previous Summaries")
                .font(.headline)
                .foregroundColor(.primary)
            
            ForEach(Array(wellnessService.weeklySummaries.dropLast().reversed()), id: \.keyThemes) { summary in
                WeeklySummaryCard(summary: summary, isCompact: true)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    private var recommendationsContent: some View {
        VStack(spacing: 20) {
            if recommendations.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "lightbulb")
                        .font(.system(size: 50))
                        .foregroundColor(.orange)
                    
                    Text("No Recommendations Yet")
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text("Generate a weekly summary to get personalized recommendations")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(.ultraThinMaterial)
                )
            } else {
                ForEach(recommendations, id: \.title) { recommendation in
                    RecommendationCard(recommendation: recommendation)
                }
            }
        }
    }
    
    private var activitiesContent: some View {
        VStack(spacing: 20) {
            Text("Activity Recommendations")
                .font(.headline)
                .foregroundColor(.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            // Placeholder for activity recommendations
            RoundedRectangle(cornerRadius: 12)
                .fill(.gray.opacity(0.1))
                .frame(height: 200)
                .overlay(
                    Text("Activity tracking coming soon")
                        .foregroundColor(.secondary)
                )
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    private func loadInsights() {
        wellnessService.loadWeeklySummaries()
        
        Task {
            recommendations = await wellnessService.generateWellnessRecommendations(entries: journalManager.entries)
        }
    }
    
    private func refreshInsights() {
        isLoading = true
        
        Task {
            recommendations = await wellnessService.generateWellnessRecommendations(entries: journalManager.entries)
            isLoading = false
        }
    }
    
    private func generateWeeklySummary() {
        Task {
            await wellnessService.generateWeeklySummary(entries: journalManager.entries)
        }
    }
}

// MARK: - Weekly Summary Card
struct WeeklySummaryCard: View {
    let summary: WeeklySummary
    let isCompact: Bool
    
    init(summary: WeeklySummary, isCompact: Bool = false) {
        self.summary = summary
        self.isCompact = isCompact
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "calendar.badge.clock")
                    .font(.title2)
                    .foregroundColor(.green)
                
                Text("Weekly Summary")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text(summary.emotionalTone.rawValue.capitalized)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        Capsule()
                            .fill(emotionColor(summary.emotionalTone).opacity(0.2))
                    )
            }
            
            if !summary.keyThemes.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Key Themes")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                    
                    ForEach(summary.keyThemes, id: \.self) { theme in
                        HStack {
                            Image(systemName: "circle.fill")
                                .font(.caption)
                                .foregroundColor(.green)
                            
                            Text(theme)
                                .font(.caption)
                                .foregroundColor(.primary)
                            
                            Spacer()
                        }
                    }
                }
            }
            
            if !summary.highlights.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Highlights")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                    
                    ForEach(summary.highlights, id: \.self) { highlight in
                        HStack(alignment: .top) {
                            Image(systemName: "star.fill")
                                .font(.caption)
                                .foregroundColor(.yellow)
                            
                            Text(highlight)
                                .font(.caption)
                                .foregroundColor(.primary)
                            
                            Spacer()
                        }
                    }
                }
            }
            
            if !summary.growthMoments.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Growth Moments")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                    
                    ForEach(summary.growthMoments, id: \.self) { moment in
                        HStack(alignment: .top) {
                            Image(systemName: "arrow.up.circle.fill")
                                .font(.caption)
                                .foregroundColor(.blue)
                            
                            Text(moment)
                                .font(.caption)
                                .foregroundColor(.primary)
                            
                            Spacer()
                        }
                    }
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    private func emotionColor(_ sentiment: AIInsights.Sentiment) -> Color {
        switch sentiment {
        case .positive: return .green
        case .negative: return .red
        case .mixed: return .orange
        case .neutral: return .gray
        }
    }
}

// MARK: - Recommendation Card
struct RecommendationCard: View {
    let recommendation: Recommendation
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: iconForType(recommendation.type))
                    .font(.title2)
                    .foregroundColor(colorForPriority(recommendation.priority))
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(recommendation.title)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(recommendation.type.rawValue.capitalized)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text(recommendation.priority.rawValue.capitalized)
                    .font(.caption)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        Capsule()
                            .fill(colorForPriority(recommendation.priority))
                    )
            }
            
            Text(recommendation.description)
                .font(.body)
                .foregroundColor(.primary)
            
            if !recommendation.actionableSteps.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Action Steps")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                    
                    ForEach(recommendation.actionableSteps, id: \.self) { step in
                        HStack {
                            Image(systemName: "checkmark.circle")
                                .font(.caption)
                                .foregroundColor(.green)
                            
                            Text(step)
                                .font(.caption)
                                .foregroundColor(.primary)
                            
                            Spacer()
                        }
                    }
                }
            }
            
            Text("Expected Outcome: \(recommendation.expectedOutcome)")
                .font(.caption)
                .foregroundColor(.secondary)
                .italic()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    private func iconForType(_ type: RecommendationType) -> String {
        switch type {
        case .reflection: return "brain.head.profile"
        case .action: return "bolt.fill"
        case .mindfulness: return "leaf.fill"
        case .social: return "person.2.fill"
        case .goal: return "target"
        case .wellness: return "heart.fill"
        }
    }
    
    private func colorForPriority(_ priority: Priority) -> Color {
        switch priority {
        case .urgent: return .red
        case .high: return .orange
        case .medium: return .blue
        case .low: return .green
        }
    }
}

#Preview {
    WellnessInsightsView()
        .environmentObject(JournalManager())
}
