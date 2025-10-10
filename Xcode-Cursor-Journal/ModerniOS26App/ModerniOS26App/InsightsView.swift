import SwiftUI
import Charts

// MARK: - Insights Dashboard View
@available(iOS 18.0, *)
struct InsightsView: View {
    @StateObject private var journalManager = JournalManager()
    @StateObject private var patternEngine = PatternAnalysisEngine()
    @StateObject private var privacyManager = AIPrivacyManager()
    
    @State private var selectedTimeframe: TimePeriod = .monthly
    @State private var selectedTab: InsightTab = .overview
    @State private var isLoading = false
    @State private var moodPatterns: [MoodPattern] = []
    @State private var themePatterns: [ThemePattern] = []
    @State private var relationshipPatterns: [RelationshipPattern] = []
    @State private var growthMetrics: [GrowthMetric] = []
    @State private var weeklySummary: WeeklySummary?
    
    enum InsightTab: String, CaseIterable {
        case overview = "Overview"
        case patterns = "Patterns"
        case growth = "Growth"
        case relationships = "Relationships"
        case themes = "Themes"
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header with timeframe selector
                headerView
                
                // Tab selector
                tabSelector
                
                // Content based on selected tab
                ScrollView {
                    LazyVStack(spacing: 20) {
                        switch selectedTab {
                        case .overview:
                            overviewContent
                        case .patterns:
                            patternsContent
                        case .growth:
                            growthContent
                        case .relationships:
                            relationshipsContent
                        case .themes:
                            themesContent
                        }
                    }
                    .padding()
                }
            }
            .background(
                LinearGradient(
                    colors: [.blue.opacity(0.1), .purple.opacity(0.1)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .navigationTitle("AI Insights")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: refreshInsights) {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(.blue)
                    }
                    .disabled(isLoading)
                }
            }
        }
        .onAppear {
            loadInsights()
        }
    }
    
    // MARK: - Header View
    private var headerView: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Your Emotional Journey")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    Text("Discover patterns and insights about yourself")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Privacy indicator
                privacyIndicator
            }
            
            // Timeframe selector
            Picker("Timeframe", selection: $selectedTimeframe) {
                ForEach(TimePeriod.allCases, id: \.self) { period in
                    Text(period.rawValue.capitalized).tag(period)
                }
            }
            .pickerStyle(SegmentedPickerStyle())
            .onChange(of: selectedTimeframe) { _ in
                loadInsights()
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
        .padding(.horizontal)
    }
    
    private var privacyIndicator: some View {
        HStack(spacing: 6) {
            Image(systemName: privacyManager.privacyMode == .private ? "lock.shield" : "cloud.bolt")
                .font(.caption)
                .foregroundColor(privacyManager.privacyMode == .private ? .green : .blue)
            
            Text(privacyManager.privacyMode.title)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            Capsule()
                .fill(privacyManager.privacyMode == .private ? .green.opacity(0.1) : .blue.opacity(0.1))
        )
    }
    
    // MARK: - Tab Selector
    private var tabSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(InsightTab.allCases, id: \.self) { tab in
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
                                    .fill(selectedTab == tab ? .blue : .clear)
                            )
                    }
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
    }
    
    // MARK: - Overview Content
    private var overviewContent: some View {
        VStack(spacing: 20) {
            // Mood overview chart
            moodOverviewChart
            
            // Key insights cards
            keyInsightsCards
            
            // Weekly summary
            if let summary = weeklySummary {
                weeklySummaryCard(summary)
            }
            
            // Growth highlights
            growthHighlights
        }
    }
    
    private var moodOverviewChart: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Mood Trends")
                .font(.headline)
                .foregroundColor(.primary)
            
            if !moodPatterns.isEmpty {
                Chart(moodPatterns.prefix(5), id: \.mood) { pattern in
                    BarMark(
                        x: .value("Mood", pattern.mood.emoji),
                        y: .value("Frequency", pattern.frequency)
                    )
                    .foregroundStyle(pattern.mood.color)
                }
                .frame(height: 200)
                .chartYAxis {
                    AxisMarks(position: .leading)
                }
            } else {
                RoundedRectangle(cornerRadius: 12)
                    .fill(.gray.opacity(0.1))
                    .frame(height: 200)
                    .overlay(
                        Text("No mood data available")
                            .foregroundColor(.secondary)
                    )
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    private var keyInsightsCards: some View {
        VStack(spacing: 12) {
            Text("Key Insights")
                .font(.headline)
                .foregroundColor(.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                InsightCard(
                    title: "Most Common Mood",
                    value: moodPatterns.first?.mood.emoji ?? "😐",
                    subtitle: moodPatterns.first?.mood.rawValue.capitalized ?? "Neutral",
                    color: moodPatterns.first?.mood.color ?? .gray
                )
                
                InsightCard(
                    title: "Top Theme",
                    value: "\(themePatterns.first?.frequency ?? 0)",
                    subtitle: themePatterns.first?.topic ?? "None",
                    color: .blue
                )
                
                InsightCard(
                    title: "Growth Score",
                    value: String(format: "%.0f", calculateOverallGrowth()),
                    subtitle: "Out of 100",
                    color: .green
                )
                
                InsightCard(
                    title: "Relationships",
                    value: "\(relationshipPatterns.count)",
                    subtitle: "People mentioned",
                    color: .purple
                )
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    private func weeklySummaryCard(_ summary: WeeklySummary) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "calendar.badge.clock")
                    .font(.title2)
                    .foregroundColor(.blue)
                
                Text("This Week's Summary")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Key Themes")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                ForEach(summary.keyThemes, id: \.self) { theme in
                    HStack {
                        Image(systemName: "circle.fill")
                            .font(.caption)
                            .foregroundColor(.blue)
                        
                        Text(theme)
                            .font(.caption)
                            .foregroundColor(.primary)
                        
                        Spacer()
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
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    private var growthHighlights: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Growth Highlights")
                .font(.headline)
                .foregroundColor(.primary)
            
            ForEach(growthMetrics.prefix(3), id: \.metricType) { metric in
                GrowthMetricRow(metric: metric)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    // MARK: - Patterns Content
    private var patternsContent: some View {
        VStack(spacing: 20) {
            // Mood patterns
            moodPatternsSection
            
            // Emotional cycles
            emotionalCyclesSection
        }
    }
    
    private var moodPatternsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Mood Patterns")
                .font(.headline)
                .foregroundColor(.primary)
            
            ForEach(moodPatterns, id: \.mood) { pattern in
                MoodPatternCard(pattern: pattern)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    private var emotionalCyclesSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Emotional Cycles")
                .font(.headline)
                .foregroundColor(.primary)
            
            Text("Your emotional patterns over time")
                .font(.caption)
                .foregroundColor(.secondary)
            
            // Placeholder for emotional cycle visualization
            RoundedRectangle(cornerRadius: 12)
                .fill(.gray.opacity(0.1))
                .frame(height: 150)
                .overlay(
                    Text("Emotional cycle analysis coming soon")
                        .foregroundColor(.secondary)
                )
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    // MARK: - Growth Content
    private var growthContent: some View {
        VStack(spacing: 20) {
            // Overall growth score
            overallGrowthScore
            
            // Growth metrics
            growthMetricsSection
            
            // Achievements
            achievementsSection
        }
    }
    
    private var overallGrowthScore: some View {
        VStack(spacing: 16) {
            Text("Overall Growth Score")
                .font(.headline)
                .foregroundColor(.primary)
            
            ZStack {
                Circle()
                    .stroke(.gray.opacity(0.3), lineWidth: 8)
                    .frame(width: 120, height: 120)
                
                Circle()
                    .trim(from: 0, to: calculateOverallGrowth() / 100)
                    .stroke(.green, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .frame(width: 120, height: 120)
                    .rotationEffect(.degrees(-90))
                
                VStack {
                    Text(String(format: "%.0f", calculateOverallGrowth()))
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    Text("Growth")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    private var growthMetricsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Growth Metrics")
                .font(.headline)
                .foregroundColor(.primary)
            
            ForEach(growthMetrics, id: \.metricType) { metric in
                GrowthMetricCard(metric: metric)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    private var achievementsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Recent Achievements")
                .font(.headline)
                .foregroundColor(.primary)
            
            // Placeholder for achievements
            RoundedRectangle(cornerRadius: 12)
                .fill(.gray.opacity(0.1))
                .frame(height: 100)
                .overlay(
                    Text("Achievement tracking coming soon")
                        .foregroundColor(.secondary)
                )
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    // MARK: - Relationships Content
    private var relationshipsContent: some View {
        VStack(spacing: 20) {
            ForEach(relationshipPatterns, id: \.personName) { pattern in
                RelationshipPatternCard(pattern: pattern)
            }
        }
    }
    
    // MARK: - Themes Content
    private var themesContent: some View {
        VStack(spacing: 20) {
            ForEach(themePatterns, id: \.topic) { pattern in
                ThemePatternCard(pattern: pattern)
            }
        }
    }
    
    // MARK: - Helper Methods
    private func loadInsights() {
        isLoading = true
        
        Task {
            moodPatterns = await patternEngine.analyzeMoodPatterns(entries: journalManager.entries)
            themePatterns = await patternEngine.analyzeThemePatterns(entries: journalManager.entries)
            relationshipPatterns = await patternEngine.analyzeRelationshipPatterns(entries: journalManager.entries)
            growthMetrics = await patternEngine.analyzeGrowthMetrics(entries: journalManager.entries)
            
            // Load weekly summary if cloud AI is enabled
            if privacyManager.canUseCloudAI() {
                do {
                    weeklySummary = try await CloudAIService().generateWeeklySummary(entries: journalManager.entries)
                } catch {
                    print("Failed to generate weekly summary: \(error)")
                }
            }
            
            isLoading = false
        }
    }
    
    private func refreshInsights() {
        loadInsights()
    }
    
    private func calculateOverallGrowth() -> Double {
        guard !growthMetrics.isEmpty else { return 0 }
        let averageScore = growthMetrics.map { $0.value }.reduce(0, +) / Double(growthMetrics.count)
        return averageScore * 100
    }
}

// MARK: - Supporting Views
struct InsightCard: View {
    let title: String
    let value: String
    let subtitle: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            
            Text(subtitle)
                .font(.caption2)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(color.opacity(0.1))
        )
    }
}

struct MoodPatternCard: View {
    let pattern: MoodPattern
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(pattern.mood.emoji)
                    .font(.title2)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(pattern.mood.rawValue.capitalized)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text("\(Int(pattern.frequency * 100))% of entries")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text("\(Int(pattern.frequency * 100))%")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(pattern.mood.color)
            }
            
            if !pattern.triggers.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Common triggers:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    ForEach(pattern.triggers, id: \.self) { trigger in
                        HStack {
                            Image(systemName: "circle.fill")
                                .font(.caption2)
                                .foregroundColor(.blue)
                            
                            Text(trigger)
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
            RoundedRectangle(cornerRadius: 12)
                .fill(pattern.mood.color.opacity(0.1))
        )
    }
}

struct GrowthMetricRow: View {
    let metric: GrowthMetric
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(metric.metricType.rawValue.capitalized)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                
                Text(metric.insights.first ?? "")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text(String(format: "%.0f", metric.value * 100))
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(trendColor(metric.trend))
                
                Text(metric.trend.rawValue.capitalized)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(trendColor(metric.trend).opacity(0.1))
        )
    }
    
    private func trendColor(_ trend: GrowthTrend) -> Color {
        switch trend {
        case .improving: return .green
        case .stable: return .blue
        case .declining: return .red
        case .fluctuating: return .orange
        }
    }
}

struct GrowthMetricCard: View {
    let metric: GrowthMetric
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(metric.metricType.rawValue.capitalized)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text(String(format: "%.0f", metric.value * 100))
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(trendColor(metric.trend))
            }
            
            HStack {
                Text(metric.trend.rawValue.capitalized)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(metric.period.rawValue.capitalized)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            if !metric.insights.isEmpty {
                Text(metric.insights.first ?? "")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(trendColor(metric.trend).opacity(0.1))
        )
    }
    
    private func trendColor(_ trend: GrowthTrend) -> Color {
        switch trend {
        case .improving: return .green
        case .stable: return .blue
        case .declining: return .red
        case .fluctuating: return .orange
        }
    }
}

struct RelationshipPatternCard: View {
    let pattern: RelationshipPattern
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(pattern.personName)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text(pattern.relationshipType.rawValue.capitalized)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        Capsule()
                            .fill(.blue.opacity(0.2))
                    )
            }
            
            Text("Mentioned \(pattern.frequency) times")
                .font(.caption)
                .foregroundColor(.secondary)
            
            Text(pattern.emotionalContext)
                .font(.caption)
                .foregroundColor(.secondary)
            
            if !pattern.associatedMoods.isEmpty {
                HStack {
                    Text("Associated moods:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    ForEach(pattern.associatedMoods, id: \.self) { mood in
                        Text(mood.emoji)
                            .font(.caption)
                    }
                    
                    Spacer()
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.purple.opacity(0.1))
        )
    }
}

struct ThemePatternCard: View {
    let pattern: ThemePattern
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(pattern.topic)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text("\(pattern.frequency) mentions")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Text("First mentioned: \(pattern.firstMention.formatted(date: .abbreviated, time: .omitted))")
                .font(.caption)
                .foregroundColor(.secondary)
            
            Text("Last mentioned: \(pattern.lastMention.formatted(date: .abbreviated, time: .omitted))")
                .font(.caption)
                .foregroundColor(.secondary)
            
            if !pattern.associatedMoods.isEmpty {
                HStack {
                    Text("Associated moods:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    ForEach(pattern.associatedMoods, id: \.self) { mood in
                        Text(mood.emoji)
                            .font(.caption)
                    }
                    
                    Spacer()
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.orange.opacity(0.1))
        )
    }
}

#Preview {
    InsightsView()
}
