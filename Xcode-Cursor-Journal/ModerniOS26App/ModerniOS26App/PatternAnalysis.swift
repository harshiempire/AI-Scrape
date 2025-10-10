import SwiftUI
import Foundation
import NaturalLanguage

// MARK: - Pattern Analysis Engine
@available(iOS 18.0, *)
@MainActor
class PatternAnalysisEngine: ObservableObject {
    @Published var isAnalyzing = false
    @Published var analysisProgress: Double = 0.0
    @Published var lastAnalysis: Date?
    
    private let aiService = RealAIService()
    private let cloudAIService = CloudAIService()
    private let privacyManager = AIPrivacyManager()
    
    // MARK: - Mood Pattern Analysis
    func analyzeMoodPatterns(entries: [JournalEntry]) async -> [MoodPattern] {
        isAnalyzing = true
        analysisProgress = 0.0
        
        defer {
            isAnalyzing = false
            analysisProgress = 1.0
            lastAnalysis = Date()
        }
        
        // Group entries by mood and time periods
        let moodGroups = Dictionary(grouping: entries) { $0.mood }
        var patterns: [MoodPattern] = []
        
        for (mood, moodEntries) in moodGroups {
            analysisProgress += 0.1
            
            // Calculate frequency
            let frequency = Double(moodEntries.count) / Double(entries.count)
            
            // Analyze trends over time
            let trends = analyzeMoodTrends(entries: moodEntries)
            
            // Identify triggers using NLP
            let triggers = await identifyMoodTriggers(mood: mood, entries: moodEntries)
            
            // Get last occurrence
            let lastOccurrence = moodEntries.map { $0.date }.max() ?? Date()
            
            let pattern = MoodPattern(
                mood: mood,
                frequency: frequency,
                trends: trends,
                triggers: triggers,
                lastOccurrence: lastOccurrence
            )
            
            patterns.append(pattern)
        }
        
        return patterns.sorted { $0.frequency > $1.frequency }
    }
    
    // MARK: - Theme Pattern Analysis
    func analyzeThemePatterns(entries: [JournalEntry]) async -> [ThemePattern] {
        isAnalyzing = true
        analysisProgress = 0.0
        
        defer {
            isAnalyzing = false
            analysisProgress = 1.0
            lastAnalysis = Date()
        }
        
        // Extract topics from all entries
        var topicFrequency: [String: Int] = [:]
        var topicMoods: [String: [Mood]] = [:]
        var topicDates: [String: [Date]] = [:]
        
        for entry in entries {
            analysisProgress += 0.05
            
            // Use on-device NLP for topic extraction
            let topics = aiService.extractTopics(from: entry.content)
            
            for topic in topics {
                topicFrequency[topic, default: 0] += 1
                topicMoods[topic, default: []].append(entry.mood)
                topicDates[topic, default: []].append(entry.date)
            }
        }
        
        // Convert to ThemePattern objects
        var themePatterns: [ThemePattern] = []
        
        for (topic, frequency) in topicFrequency {
            guard frequency >= 3 else { continue } // Only include topics mentioned 3+ times
            
            let moods = topicMoods[topic] ?? []
            let dates = topicDates[topic] ?? []
            
            // Analyze evolution over time
            let evolution = analyzeThemeEvolution(topic: topic, entries: entries)
            
            let pattern = ThemePattern(
                topic: topic,
                frequency: frequency,
                firstMention: dates.min() ?? Date(),
                lastMention: dates.max() ?? Date(),
                associatedMoods: Array(Set(moods)),
                evolution: evolution
            )
            
            themePatterns.append(pattern)
        }
        
        return themePatterns.sorted { $0.frequency > $1.frequency }
    }
    
    // MARK: - Recurring Themes Detector
    func detectRecurringThemes(entries: [JournalEntry]) async -> [String] {
        isAnalyzing = true
        analysisProgress = 0.0
        
        defer {
            isAnalyzing = false
            analysisProgress = 1.0
            lastAnalysis = Date()
        }
        
        // Extract all topics from entries
        var allTopics: [String] = []
        
        for entry in entries {
            analysisProgress += 0.05
            let topics = aiService.extractTopics(from: entry.content)
            allTopics.append(contentsOf: topics)
        }
        
        // Count topic frequency
        let topicCounts = Dictionary(grouping: allTopics, by: { $0 })
            .mapValues { $0.count }
            .sorted { $0.value > $1.value }
        
        // Return recurring themes (mentioned 3+ times)
        return topicCounts.filter { $0.value >= 3 }.map { $0.key }
    }
    
    // MARK: - Theme Evolution Analysis
    func analyzeThemeEvolution(topic: String, entries: [JournalEntry]) -> [ThemeEvolution] {
        let relevantEntries = entries.filter { entry in
            aiService.extractTopics(from: entry.content).contains(topic)
        }.sorted { $0.date < $1.date }
        
        var evolution: [ThemeEvolution] = []
        
        for entry in relevantEntries {
            let sentiment = aiService.analyzeSentiment(text: entry.content)
            let keyPhrases = extractKeyPhrases(from: entry.content, topic: topic)
            
            let evolutionPoint = ThemeEvolution(
                date: entry.date,
                sentiment: sentiment,
                keyPhrases: keyPhrases,
                mood: entry.mood
            )
            
            evolution.append(evolutionPoint)
        }
        
        return evolution
    }
    
    // MARK: - Theme Suggestions
    func generateThemeSuggestions(entries: [JournalEntry]) async -> [String] {
        let recurringThemes = await detectRecurringThemes(entries: entries)
        var suggestions: [String] = []
        
        // Suggest themes that haven't been written about recently
        let recentEntries = entries.filter { entry in
            Calendar.current.dateInterval(of: .month, for: entry.date) == Calendar.current.dateInterval(of: .month, for: Date())
        }
        
        let recentTopics = Set(recentEntries.flatMap { aiService.extractTopics(from: $0.content) })
        
        for theme in recurringThemes {
            if !recentTopics.contains(theme) {
                suggestions.append("You haven't written about \(theme) recently - it seems important to you")
            }
        }
        
        // Suggest new themes based on patterns
        if suggestions.isEmpty {
            suggestions.append("Consider writing about your goals and aspirations")
            suggestions.append("Reflect on your relationships and connections")
            suggestions.append("Write about what you're grateful for")
        }
        
        return suggestions
    }
    
    // MARK: - Relationship Pattern Analysis
    func analyzeRelationshipPatterns(entries: [JournalEntry]) async -> [RelationshipPattern] {
        isAnalyzing = true
        analysisProgress = 0.0
        
        defer {
            isAnalyzing = false
            analysisProgress = 1.0
            lastAnalysis = Date()
        }
        
        // Extract person names using Named Entity Recognition
        var personMentions: [String: [PersonMention]] = [:]
        
        for entry in entries {
            analysisProgress += 0.05
            
            let mentions = extractPersonMentions(from: entry.content)
            
            for mention in mentions {
                personMentions[mention.name, default: []].append(
                    PersonMention(
                        date: entry.date,
                        mood: entry.mood,
                        context: mention.context,
                        sentiment: aiService.analyzeSentiment(text: mention.context)
                    )
                )
            }
        }
        
        // Convert to RelationshipPattern objects
        var relationshipPatterns: [RelationshipPattern] = []
        
        for (personName, mentions) in personMentions {
            guard mentions.count >= 2 else { continue } // Only include people mentioned 2+ times
            
            let moods = mentions.map { $0.mood }
            let sentiments = mentions.map { $0.sentiment }
            
            // Calculate sentiment trend
            let sentimentTrend = calculateSentimentTrend(sentiments: sentiments)
            
            // Determine relationship type based on context
            let relationshipType = determineRelationshipType(mentions: mentions)
            
            // Get emotional context
            let emotionalContext = generateEmotionalContext(mentions: mentions)
            
            let pattern = RelationshipPattern(
                personName: personName,
                relationshipType: relationshipType,
                frequency: mentions.count,
                associatedMoods: Array(Set(moods)),
                emotionalContext: emotionalContext,
                lastMention: mentions.map { $0.date }.max() ?? Date(),
                sentimentTrend: sentimentTrend
            )
            
            relationshipPatterns.append(pattern)
        }
        
        return relationshipPatterns.sorted { $0.frequency > $1.frequency }
    }
    
    // MARK: - Advanced Relationship Analysis
    func analyzeRelationshipDynamics(entries: [JournalEntry]) async -> RelationshipInsights {
        let relationshipPatterns = await analyzeRelationshipPatterns(entries: entries)
        
        // Analyze relationship dynamics
        var importantPeople: [ImportantPerson] = []
        var insights: [String] = []
        
        for pattern in relationshipPatterns {
            let importantPerson = ImportantPerson(
                name: pattern.personName,
                frequency: pattern.frequency,
                associatedMoods: pattern.associatedMoods,
                relationshipType: pattern.relationshipType
            )
            importantPeople.append(importantPerson)
        }
        
        // Generate insights
        if let mostFrequentPerson = relationshipPatterns.first {
            insights.append("\(mostFrequentPerson.personName) is mentioned most frequently in your journal")
        }
        
        let familyRelationships = relationshipPatterns.filter { $0.relationshipType == .family }
        if !familyRelationships.isEmpty {
            insights.append("You write about family members \(familyRelationships.count) times")
        }
        
        let workRelationships = relationshipPatterns.filter { $0.relationshipType == .work }
        if !workRelationships.isEmpty {
            insights.append("Work relationships appear in \(workRelationships.count) entries")
        }
        
        let positiveRelationships = relationshipPatterns.filter { $0.sentimentTrend > 0 }
        if !positiveRelationships.isEmpty {
            insights.append("You have \(positiveRelationships.count) relationships with positive sentiment trends")
        }
        
        let negativeRelationships = relationshipPatterns.filter { $0.sentimentTrend < 0 }
        if !negativeRelationships.isEmpty {
            insights.append("\(negativeRelationships.count) relationships show declining sentiment")
        }
        
        return RelationshipInsights(
            importantPeople: importantPeople,
            insights: insights
        )
    }
    
    // MARK: - Relationship Suggestions
    func generateRelationshipSuggestions(entries: [JournalEntry]) async -> [String] {
        let relationshipPatterns = await analyzeRelationshipPatterns(entries: entries)
        var suggestions: [String] = []
        
        // Check for people not mentioned recently
        let recentEntries = entries.filter { entry in
            Calendar.current.dateInterval(of: .month, for: entry.date) == Calendar.current.dateInterval(of: .month, for: Date())
        }
        
        let recentPeople = Set(recentEntries.flatMap { entry in
            extractPersonMentions(from: entry.content).map { $0.name }
        })
        
        for pattern in relationshipPatterns {
            if !recentPeople.contains(pattern.personName) {
                suggestions.append("You haven't written about \(pattern.personName) recently - consider reflecting on this relationship")
            }
        }
        
        // Suggest relationship exploration
        if suggestions.isEmpty {
            suggestions.append("Consider writing about your closest relationships")
            suggestions.append("Reflect on how your relationships have evolved")
            suggestions.append("Write about someone who has influenced you")
        }
        
        return suggestions
    }
    
    // MARK: - Growth Analysis
    func analyzeGrowthMetrics(entries: [JournalEntry]) async -> [GrowthMetric] {
        isAnalyzing = true
        analysisProgress = 0.0
        
        defer {
            isAnalyzing = false
            analysisProgress = 1.0
            lastAnalysis = Date()
        }
        
        var metrics: [GrowthMetric] = []
        
        // Analyze emotional stability
        analysisProgress += 0.1
        let emotionalStability = analyzeEmotionalStability(entries: entries)
        metrics.append(emotionalStability)
        
        // Analyze gratitude
        analysisProgress += 0.1
        let gratitude = analyzeGratitude(entries: entries)
        metrics.append(gratitude)
        
        // Analyze self-reflection
        analysisProgress += 0.1
        let selfReflection = analyzeSelfReflection(entries: entries)
        metrics.append(selfReflection)
        
        // Analyze resilience
        analysisProgress += 0.1
        let resilience = analyzeResilience(entries: entries)
        metrics.append(resilience)
        
        // Analyze goal orientation
        analysisProgress += 0.1
        let goalOrientation = analyzeGoalOrientation(entries: entries)
        metrics.append(goalOrientation)
        
        // Analyze social connection
        analysisProgress += 0.1
        let socialConnection = analyzeSocialConnection(entries: entries)
        metrics.append(socialConnection)
        
        return metrics
    }
    
    // MARK: - Private Analysis Methods
    private func analyzeMoodTrends(entries: [JournalEntry]) -> [String: Double] {
        let calendar = Calendar.current
        let now = Date()
        
        // Group by time periods
        let weeklyEntries = entries.filter { calendar.dateInterval(of: .weekOfYear, for: $0.date) == calendar.dateInterval(of: .weekOfYear, for: now) }
        let monthlyEntries = entries.filter { calendar.dateInterval(of: .month, for: $0.date) == calendar.dateInterval(of: .month, for: now) }
        
        return [
            "weekly": Double(weeklyEntries.count) / 7.0,
            "monthly": Double(monthlyEntries.count) / 30.0
        ]
    }
    
    private func identifyMoodTriggers(mood: Mood, entries: [JournalEntry]) async -> [String] {
        // Extract common topics from entries with this mood
        var topicCounts: [String: Int] = [:]
        
        for entry in entries {
            let topics = aiService.extractTopics(from: entry.content)
            for topic in topics {
                topicCounts[topic, default: 0] += 1
            }
        }
        
        // Return top 3 most frequent topics
        return topicCounts.sorted { $0.value > $1.value }.prefix(3).map { $0.key }
    }
    
    private func analyzeThemeEvolution(topic: String, entries: [JournalEntry]) -> [ThemeEvolution] {
        let relevantEntries = entries.filter { entry in
            aiService.extractTopics(from: entry.content).contains(topic)
        }.sorted { $0.date < $1.date }
        
        var evolution: [ThemeEvolution] = []
        
        for entry in relevantEntries {
            let sentiment = aiService.analyzeSentiment(text: entry.content)
            let keyPhrases = extractKeyPhrases(from: entry.content, topic: topic)
            
            let evolutionPoint = ThemeEvolution(
                date: entry.date,
                sentiment: sentiment,
                keyPhrases: keyPhrases,
                mood: entry.mood
            )
            
            evolution.append(evolutionPoint)
        }
        
        return evolution
    }
    
    private func extractPersonMentions(from text: String) -> [PersonMention] {
        // Simple name extraction - in a real implementation, this would use NER
        let words = text.components(separatedBy: .whitespacesAndNewlines)
        var mentions: [PersonMention] = []
        
        for (index, word) in words.enumerated() {
            // Simple heuristic: capitalized words that aren't common words
            if word.count > 2 && word.first?.isUppercase == true && !isCommonWord(word) {
                let context = extractContext(around: index, in: words)
                
                mentions.append(
                    PersonMention(
                        name: word,
                        context: context,
                        date: Date(),
                        mood: .neutral,
                        sentiment: .neutral
                    )
                )
            }
        }
        
        return mentions
    }
    
    private func isCommonWord(_ word: String) -> Bool {
        let commonWords = ["The", "This", "That", "There", "They", "Then", "Today", "Tomorrow", "Yesterday"]
        return commonWords.contains(word)
    }
    
    private func extractContext(around index: Int, in words: [String]) -> String {
        let start = max(0, index - 3)
        let end = min(words.count, index + 4)
        return Array(words[start..<end]).joined(separator: " ")
    }
    
    private func calculateSentimentTrend(sentiments: [AIInsights.Sentiment]) -> Double {
        let sentimentValues = sentiments.map { sentiment in
            switch sentiment {
            case .positive: return 1.0
            case .negative: return -1.0
            case .neutral: return 0.0
            case .mixed: return 0.0
            }
        }
        
        // Simple linear trend calculation
        let average = sentimentValues.reduce(0, +) / Double(sentimentValues.count)
        return average
    }
    
    private func determineRelationshipType(mentions: [PersonMention]) -> RelationshipType {
        // Simple heuristic based on context keywords
        let context = mentions.map { $0.context }.joined(separator: " ").lowercased()
        
        if context.contains("family") || context.contains("mom") || context.contains("dad") || context.contains("sister") || context.contains("brother") {
            return .family
        } else if context.contains("work") || context.contains("colleague") || context.contains("boss") || context.contains("meeting") {
            return .work
        } else if context.contains("friend") || context.contains("buddy") || context.contains("pal") {
            return .friends
        } else if context.contains("love") || context.contains("boyfriend") || context.contains("girlfriend") || context.contains("partner") {
            return .romantic
        } else {
            return .other
        }
    }
    
    private func generateEmotionalContext(mentions: [PersonMention]) -> String {
        let positiveCount = mentions.filter { $0.sentiment == .positive }.count
        let negativeCount = mentions.filter { $0.sentiment == .negative }.count
        
        if positiveCount > negativeCount {
            return "Generally positive interactions"
        } else if negativeCount > positiveCount {
            return "Often associated with challenges"
        } else {
            return "Mixed emotional context"
        }
    }
    
    private func extractKeyPhrases(from text: String, topic: String) -> [String] {
        // Simple key phrase extraction around the topic
        let sentences = text.components(separatedBy: CharacterSet(charactersIn: ".!?"))
        var phrases: [String] = []
        
        for sentence in sentences {
            if sentence.lowercased().contains(topic.lowercased()) {
                let words = sentence.components(separatedBy: .whitespaces)
                if let topicIndex = words.firstIndex(where: { $0.lowercased().contains(topic.lowercased()) }) {
                    let start = max(0, topicIndex - 2)
                    let end = min(words.count, topicIndex + 3)
                    let phrase = Array(words[start..<end]).joined(separator: " ")
                    phrases.append(phrase)
                }
            }
        }
        
        return Array(phrases.prefix(3))
    }
    
    // MARK: - Growth Metric Analysis Methods
    private func analyzeEmotionalStability(entries: [JournalEntry]) -> GrowthMetric {
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
    
    private func analyzeGratitude(entries: [JournalEntry]) -> GrowthMetric {
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
    
    private func analyzeSelfReflection(entries: [JournalEntry]) -> GrowthMetric {
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
    
    private func analyzeResilience(entries: [JournalEntry]) -> GrowthMetric {
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
    
    private func analyzeGoalOrientation(entries: [JournalEntry]) -> GrowthMetric {
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
    
    private func analyzeSocialConnection(entries: [JournalEntry]) -> GrowthMetric {
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
}

// MARK: - Supporting Models
struct PersonMention {
    let name: String
    let context: String
    let date: Date
    let mood: Mood
    let sentiment: AIInsights.Sentiment
}
