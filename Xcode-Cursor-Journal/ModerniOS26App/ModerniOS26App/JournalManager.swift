import SwiftUI
import Foundation

// MARK: - Journal Manager
@MainActor
class JournalManager: ObservableObject {
    @Published var entries: [JournalEntry] = []
    @Published var settings: JournalSettings = .default
    @Published var stats: JournalStats = .empty
    @Published var searchText: String = ""
    @Published var selectedMood: Mood?
    @Published var selectedDate: Date?
    
    private let userDefaults = UserDefaults.standard
    private let entriesKey = "JournalEntries"
    private let settingsKey = "JournalSettings"
    
    init() {
        loadEntries()
        loadSettings()
        updateStats()
    }
    
    // MARK: - Entry Management
    func addEntry(_ entry: JournalEntry) {
        entries.append(entry)
        saveEntries()
        updateStats()
    }
    
    func updateEntry(_ entry: JournalEntry) {
        if let index = entries.firstIndex(where: { $0.id == entry.id }) {
            entries[index] = entry
            saveEntries()
            updateStats()
        }
    }
    
    func deleteEntry(_ entry: JournalEntry) {
        entries.removeAll { $0.id == entry.id }
        saveEntries()
        updateStats()
    }
    
    func toggleFavorite(_ entry: JournalEntry) {
        if let index = entries.firstIndex(where: { $0.id == entry.id }) {
            entries[index].isFavorite.toggle()
            saveEntries()
            updateStats()
        }
    }
    
    // MARK: - Search and Filter
    var filteredEntries: [JournalEntry] {
        var filtered = entries
        
        // Search by title and content
        if !searchText.isEmpty {
            filtered = filtered.filter { entry in
                entry.title.localizedCaseInsensitiveContains(searchText) ||
                entry.content.localizedCaseInsensitiveContains(searchText) ||
                entry.tags.contains { $0.localizedCaseInsensitiveContains(searchText) }
            }
        }
        
        // Filter by mood
        if let selectedMood = selectedMood {
            filtered = filtered.filter { $0.mood == selectedMood }
        }
        
        // Filter by date
        if let selectedDate = selectedDate {
            let calendar = Calendar.current
            filtered = filtered.filter { entry in
                calendar.isDate(entry.date, inSameDayAs: selectedDate)
            }
        }
        
        // Sort by date (newest first)
        return filtered.sorted { $0.date > $1.date }
    }
    
    // MARK: - AI Features
    func generateAIInsights(for entry: JournalEntry) async -> AIInsights {
        let aiService = RealAIService()
        
        let words = entry.content.split(separator: " ").count
        let readingTime = max(1, words / 200)
        
        // Real sentiment analysis using Natural Language framework
        let sentiment = aiService.analyzeSentiment(text: entry.content)
        
        // Real topic extraction
        let keyTopics = aiService.extractTopics(from: entry.content)
        
        // Writing style analysis (keep existing logic)
        let writingStyle = analyzeWritingStyle(entry.content)
        
        // Generate suggestions based on real sentiment
        let suggestions = generateSuggestions(for: entry, sentiment: sentiment)
        
        return AIInsights(
            sentiment: sentiment,
            keyTopics: keyTopics,
            writingStyle: writingStyle,
            suggestions: suggestions,
            wordCount: words,
            readingTime: readingTime
        )
    }
    
    // MARK: - Growth Tracking
    func analyzePersonalGrowth() async -> [GrowthMetric] {
        let patternEngine = PatternAnalysisEngine()
        return await patternEngine.analyzeGrowthMetrics(entries: entries)
    }
    
    func getGrowthInsights() -> GrowthInsights {
        let growthMetrics = calculateGrowthMetrics()
        let achievements = detectAchievements()
        let areasForImprovement = identifyAreasForImprovement()
        let overallGrowth = calculateOverallGrowthScore()
        
        return GrowthInsights(
            overallGrowth: overallGrowth,
            metrics: growthMetrics,
            achievements: achievements,
            areasForImprovement: areasForImprovement,
            growthTrajectory: determineGrowthTrajectory()
        )
    }
    
    private func calculateGrowthMetrics() -> [GrowthMetric] {
        var metrics: [GrowthMetric] = []
        
        // Emotional Stability
        let emotionalStability = calculateEmotionalStability()
        metrics.append(emotionalStability)
        
        // Gratitude
        let gratitude = calculateGratitude()
        metrics.append(gratitude)
        
        // Self-Reflection
        let selfReflection = calculateSelfReflection()
        metrics.append(selfReflection)
        
        // Resilience
        let resilience = calculateResilience()
        metrics.append(resilience)
        
        // Goal Orientation
        let goalOrientation = calculateGoalOrientation()
        metrics.append(goalOrientation)
        
        // Social Connection
        let socialConnection = calculateSocialConnection()
        metrics.append(socialConnection)
        
        return metrics
    }
    
    private func calculateEmotionalStability() -> GrowthMetric {
        let moods = entries.map { $0.mood }
        let moodChanges = zip(moods, moods.dropFirst()).map { $0 != $1 ? 1 : 0 }.reduce(0, +)
        let stability = 1.0 - (Double(moodChanges) / Double(max(1, moods.count - 1)))
        
        let trend: GrowthTrend = stability > 0.7 ? .improving : stability > 0.4 ? .stable : .declining
        
        return GrowthMetric(
            metricType: .emotionalStability,
            value: stability,
            trend: trend,
            period: .monthly,
            insights: ["Your emotional stability is \(trend.rawValue)"]
        )
    }
    
    private func calculateGratitude() -> GrowthMetric {
        let gratitudeKeywords = ["grateful", "thankful", "appreciate", "blessed", "fortunate"]
        let gratitudeCount = entries.filter { entry in
            gratitudeKeywords.contains { keyword in
                entry.content.lowercased().contains(keyword)
            }
        }.count
        
        let gratitudeScore = Double(gratitudeCount) / Double(max(1, entries.count))
        let trend: GrowthTrend = gratitudeScore > 0.3 ? .improving : gratitudeScore > 0.1 ? .stable : .declining
        
        return GrowthMetric(
            metricType: .gratitude,
            value: gratitudeScore,
            trend: trend,
            period: .monthly,
            insights: ["You express gratitude in \(Int(gratitudeScore * 100))% of your entries"]
        )
    }
    
    private func calculateSelfReflection() -> GrowthMetric {
        let reflectionKeywords = ["think", "realize", "understand", "learn", "reflect", "consider"]
        let reflectionCount = entries.filter { entry in
            reflectionKeywords.contains { keyword in
                entry.content.lowercased().contains(keyword)
            }
        }.count
        
        let reflectionScore = Double(reflectionCount) / Double(max(1, entries.count))
        let trend: GrowthTrend = reflectionScore > 0.4 ? .improving : reflectionScore > 0.2 ? .stable : .declining
        
        return GrowthMetric(
            metricType: .selfReflection,
            value: reflectionScore,
            trend: trend,
            period: .monthly,
            insights: ["You engage in self-reflection in \(Int(reflectionScore * 100))% of your entries"]
        )
    }
    
    private func calculateResilience() -> GrowthMetric {
        let resilienceKeywords = ["overcome", "persevere", "bounce back", "recover", "strength", "challenge"]
        let resilienceCount = entries.filter { entry in
            resilienceKeywords.contains { keyword in
                entry.content.lowercased().contains(keyword)
            }
        }.count
        
        let resilienceScore = Double(resilienceCount) / Double(max(1, entries.count))
        let trend: GrowthTrend = resilienceScore > 0.2 ? .improving : resilienceScore > 0.1 ? .stable : .declining
        
        return GrowthMetric(
            metricType: .resilience,
            value: resilienceScore,
            trend: trend,
            period: .monthly,
            insights: ["You demonstrate resilience in \(Int(resilienceScore * 100))% of your entries"]
        )
    }
    
    private func calculateGoalOrientation() -> GrowthMetric {
        let goalKeywords = ["goal", "target", "plan", "achieve", "accomplish", "objective"]
        let goalCount = entries.filter { entry in
            goalKeywords.contains { keyword in
                entry.content.lowercased().contains(keyword)
            }
        }.count
        
        let goalScore = Double(goalCount) / Double(max(1, entries.count))
        let trend: GrowthTrend = goalScore > 0.3 ? .improving : goalScore > 0.1 ? .stable : .declining
        
        return GrowthMetric(
            metricType: .goalOrientation,
            value: goalScore,
            trend: trend,
            period: .monthly,
            insights: ["You discuss goals in \(Int(goalScore * 100))% of your entries"]
        )
    }
    
    private func calculateSocialConnection() -> GrowthMetric {
        let socialKeywords = ["friend", "family", "together", "social", "connect", "relationship"]
        let socialCount = entries.filter { entry in
            socialKeywords.contains { keyword in
                entry.content.lowercased().contains(keyword)
            }
        }.count
        
        let socialScore = Double(socialCount) / Double(max(1, entries.count))
        let trend: GrowthTrend = socialScore > 0.4 ? .improving : socialScore > 0.2 ? .stable : .declining
        
        return GrowthMetric(
            metricType: .socialConnection,
            value: socialScore,
            trend: trend,
            period: .monthly,
            insights: ["You mention social connections in \(Int(socialScore * 100))% of your entries"]
        )
    }
    
    private func detectAchievements() -> [Achievement] {
        var achievements: [Achievement] = []
        
        // Streak achievement
        if stats.streakDays >= 7 {
            achievements.append(Achievement(
                title: "Week Streak",
                description: "You've journaled for \(stats.streakDays) days straight!",
                achievedAt: Date(),
                category: .personal,
                impact: 0.8
            ))
        }
        
        // Word count achievement
        if stats.totalWords >= 10000 {
            achievements.append(Achievement(
                title: "Word Master",
                description: "You've written over 10,000 words in your journal!",
                achievedAt: Date(),
                category: .creative,
                impact: 0.7
            ))
        }
        
        // Positive mood achievement
        let positiveEntries = entries.filter { $0.mood == .happy || $0.mood == .grateful || $0.mood == .excited }
        if positiveEntries.count >= 10 {
            achievements.append(Achievement(
                title: "Positive Thinker",
                description: "You've had \(positiveEntries.count) positive entries!",
                achievedAt: Date(),
                category: .emotional,
                impact: 0.9
            ))
        }
        
        return achievements
    }
    
    private func identifyAreasForImprovement() -> [String] {
        var areas: [String] = []
        
        // Check for low gratitude
        let gratitudeScore = calculateGratitude().value
        if gratitudeScore < 0.1 {
            areas.append("Consider expressing more gratitude in your entries")
        }
        
        // Check for low self-reflection
        let reflectionScore = calculateSelfReflection().value
        if reflectionScore < 0.2 {
            areas.append("Try to reflect more on your experiences and feelings")
        }
        
        // Check for low social connection
        let socialScore = calculateSocialConnection().value
        if socialScore < 0.2 {
            areas.append("Consider writing more about your relationships and social connections")
        }
        
        // Check for short entries
        let averageWords = stats.averageWordsPerEntry
        if averageWords < 50 {
            areas.append("Try writing longer, more detailed entries")
        }
        
        return areas
    }
    
    private func calculateOverallGrowthScore() -> Double {
        let metrics = calculateGrowthMetrics()
        let averageScore = metrics.map { $0.value }.reduce(0, +) / Double(metrics.count)
        return averageScore
    }
    
    private func determineGrowthTrajectory() -> GrowthTrend {
        let metrics = calculateGrowthMetrics()
        let improvingCount = metrics.filter { $0.trend == .improving }.count
        let decliningCount = metrics.filter { $0.trend == .declining }.count
        
        if improvingCount > decliningCount {
            return .improving
        } else if decliningCount > improvingCount {
            return .declining
        } else {
            return .stable
        }
    }
    
    private func extractTopics(from content: String) -> [String] {
        let commonWords = ["the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "a", "an", "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "must", "shall"]
        
        let words = content.lowercased()
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .filter { !$0.isEmpty && !commonWords.contains($0) && $0.count > 3 }
        
        let wordCount = Dictionary(grouping: words, by: { $0 })
            .mapValues { $0.count }
            .sorted { $0.value > $1.value }
        
        return Array(wordCount.prefix(5).map { $0.key })
    }
    
    private func analyzeWritingStyle(_ content: String) -> String {
        let sentences = content.components(separatedBy: CharacterSet(charactersIn: ".!?"))
            .filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
        
        let avgSentenceLength = sentences.isEmpty ? 0 : content.count / sentences.count
        
        if avgSentenceLength < 50 {
            return "Concise and direct"
        } else if avgSentenceLength < 100 {
            return "Balanced and clear"
        } else {
            return "Detailed and expressive"
        }
    }
    
    private func generateSuggestions(for entry: JournalEntry, sentiment: AIInsights.Sentiment) -> [String] {
        var suggestions: [String] = []
        
        if entry.content.count < 100 {
            suggestions.append("Consider adding more details to capture the full experience")
        }
        
        if entry.tags.isEmpty {
            suggestions.append("Add tags to make this entry easier to find later")
        }
        
        if entry.title.isEmpty {
            suggestions.append("A descriptive title can help you remember this entry")
        }
        
        // Sentiment-based suggestions
        switch sentiment {
        case .negative:
            suggestions.append("Consider writing about what you're grateful for today")
            suggestions.append("Reflect on what you learned from this experience")
        case .positive:
            suggestions.append("This seems like a great day! What made it special?")
            suggestions.append("Consider noting what contributed to these positive feelings")
        case .mixed:
            suggestions.append("You seem to have mixed feelings. Try exploring both sides")
        case .neutral:
            suggestions.append("Try adding more emotional context to your entry")
        }
        
        return suggestions
    }
    
    // MARK: - Statistics
    private func updateStats() {
        let totalEntries = entries.count
        let totalWords = entries.reduce(0) { $0 + $1.wordCount }
        let averageWords = totalEntries > 0 ? totalWords / totalEntries : 0
        
        // Find most used mood
        let moodCounts = Dictionary(grouping: entries, by: { $0.mood })
            .mapValues { $0.count }
        let mostUsedMood = moodCounts.max(by: { $0.value < $1.value })?.key ?? .neutral
        
        // Calculate streak
        let streakDays = calculateStreak()
        
        let favoriteEntries = entries.filter { $0.isFavorite }.count
        
        // Monthly entries
        let calendar = Calendar.current
        var monthlyEntries = Array(repeating: 0, count: 12)
        for entry in entries {
            let month = calendar.component(.month, from: entry.date) - 1
            monthlyEntries[month] += 1
        }
        
        stats = JournalStats(
            totalEntries: totalEntries,
            totalWords: totalWords,
            averageWordsPerEntry: averageWords,
            mostUsedMood: mostUsedMood,
            streakDays: streakDays,
            favoriteEntries: favoriteEntries,
            monthlyEntries: monthlyEntries
        )
    }
    
    private func calculateStreak() -> Int {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        var streak = 0
        var currentDate = today
        
        while true {
            let hasEntry = entries.contains { entry in
                calendar.isDate(entry.date, inSameDayAs: currentDate)
            }
            
            if hasEntry {
                streak += 1
                currentDate = calendar.date(byAdding: .day, value: -1, to: currentDate) ?? currentDate
            } else {
                break
            }
        }
        
        return streak
    }
    
    // MARK: - Settings
    func updateSettings(_ newSettings: JournalSettings) {
        settings = newSettings
        saveSettings()
    }
    
    // MARK: - Data Persistence
    private func saveEntries() {
        if let encoded = try? JSONEncoder().encode(entries) {
            userDefaults.set(encoded, forKey: entriesKey)
        }
    }
    
    private func loadEntries() {
        if let data = userDefaults.data(forKey: entriesKey),
           let decoded = try? JSONDecoder().decode([JournalEntry].self, from: data) {
            entries = decoded
        }
    }
    
    private func saveSettings() {
        if let encoded = try? JSONEncoder().encode(settings) {
            userDefaults.set(encoded, forKey: settingsKey)
        }
    }
    
    private func loadSettings() {
        if let data = userDefaults.data(forKey: settingsKey),
           let decoded = try? JSONDecoder().decode(JournalSettings.self, from: data) {
            settings = decoded
        }
    }
    
    // MARK: - Export/Import
    func exportEntries() -> Data? {
        return try? JSONEncoder().encode(entries)
    }
    
    func importEntries(from data: Data) -> Bool {
        guard let importedEntries = try? JSONDecoder().decode([JournalEntry].self, from: data) else {
            return false
        }
        entries = importedEntries
        saveEntries()
        updateStats()
        return true
    }
}

