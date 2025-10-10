import SwiftUI
import Foundation

// MARK: - Journal Entry Model
struct JournalEntry: Identifiable, Codable {
    var id: UUID = UUID()
    var title: String
    var content: String
    var date: Date
    var mood: Mood
    var tags: [String]
    var location: String?
    var weather: String?
    var aiInsights: AIInsights?
    var isFavorite: Bool
    var wordCount: Int {
        content.split(separator: " ").count
    }
    
    init(title: String = "", content: String = "", mood: Mood = .neutral) {
        self.title = title
        self.content = content
        self.date = Date()
        self.mood = mood
        self.tags = []
        self.isFavorite = false
    }
}

// MARK: - Mood Enum
enum Mood: String, CaseIterable, Codable {
    case happy = "happy"
    case sad = "sad"
    case excited = "excited"
    case calm = "calm"
    case anxious = "anxious"
    case grateful = "grateful"
    case neutral = "neutral"
    case angry = "angry"
    case inspired = "inspired"
    
    var emoji: String {
        switch self {
        case .happy: return "😊"
        case .sad: return "😢"
        case .excited: return "🤩"
        case .calm: return "😌"
        case .anxious: return "😰"
        case .grateful: return "🙏"
        case .neutral: return "😐"
        case .angry: return "😠"
        case .inspired: return "✨"
        }
    }
    
    var color: Color {
        switch self {
        case .happy: return .yellow
        case .sad: return .blue
        case .excited: return .orange
        case .calm: return .green
        case .anxious: return .red
        case .grateful: return .purple
        case .neutral: return .gray
        case .angry: return .red
        case .inspired: return .pink
        }
    }
}

// MARK: - AI Insights Model
struct AIInsights: Codable {
    var sentiment: Sentiment
    var keyTopics: [String]
    var writingStyle: String
    var suggestions: [String]
    var wordCount: Int
    var readingTime: Int // in minutes
    
    enum Sentiment: String, Codable {
        case positive = "positive"
        case negative = "negative"
        case neutral = "neutral"
        case mixed = "mixed"
    }
}

// MARK: - Journal Statistics
struct JournalStats {
    var totalEntries: Int
    var totalWords: Int
    var averageWordsPerEntry: Int
    var mostUsedMood: Mood
    var streakDays: Int
    var favoriteEntries: Int
    var monthlyEntries: [Int] // entries per month
    
    static let empty = JournalStats(
        totalEntries: 0,
        totalWords: 0,
        averageWordsPerEntry: 0,
        mostUsedMood: .neutral,
        streakDays: 0,
        favoriteEntries: 0,
        monthlyEntries: Array(repeating: 0, count: 12)
    )
}

// MARK: - Journal Theme
enum JournalTheme: String, CaseIterable, Codable {
    case liquidGlass = "Liquid Glass"
    case midnight = "Midnight"
    case sunrise = "Sunrise"
    case ocean = "Ocean"
    case forest = "Forest"
    case cosmic = "Cosmic"
    
    var primaryColor: Color {
        switch self {
        case .liquidGlass: return .white
        case .midnight: return .black
        case .sunrise: return .orange
        case .ocean: return .blue
        case .forest: return .green
        case .cosmic: return .purple
        }
    }
    
    var gradient: LinearGradient {
        switch self {
        case .liquidGlass:
            return LinearGradient(
                colors: [.clear, .white.opacity(0.1), .clear],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .midnight:
            return LinearGradient(
                colors: [.black, .gray.opacity(0.3)],
                startPoint: .top,
                endPoint: .bottom
            )
        case .sunrise:
            return LinearGradient(
                colors: [.orange, .pink, .yellow],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .ocean:
            return LinearGradient(
                colors: [.blue, .cyan, .teal],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .forest:
            return LinearGradient(
                colors: [.green, .mint, .teal],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .cosmic:
            return LinearGradient(
                colors: [.purple, .pink, .blue],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

// MARK: - Pattern Analysis Models
struct MoodPattern: Codable {
    let mood: Mood
    let frequency: Double
    let trends: [String: Double] // time period -> frequency
    let triggers: [String] // topics that trigger this mood
    let lastOccurrence: Date
}

struct ThemePattern: Codable {
    let topic: String
    let frequency: Int
    let firstMention: Date
    let lastMention: Date
    let associatedMoods: [Mood]
    let evolution: [ThemeEvolution] // how perspective changed over time
}

struct ThemeEvolution: Codable {
    let date: Date
    let sentiment: AIInsights.Sentiment
    let keyPhrases: [String]
    let mood: Mood
}

enum RelationshipType: String, Codable, CaseIterable {
    case family = "family"
    case work = "work"
    case friends = "friends"
    case romantic = "romantic"
    case other = "other"
}

struct RelationshipPattern: Codable {
    let personName: String
    let relationshipType: RelationshipType
    let frequency: Int
    let associatedMoods: [Mood]
    let emotionalContext: String
    let lastMention: Date
    let sentimentTrend: Double // positive/negative trend over time
}

struct GrowthMetric: Codable {
    let metricType: GrowthMetricType
    let value: Double
    let trend: GrowthTrend
    let period: TimePeriod
    let insights: [String]
}

enum GrowthMetricType: String, Codable, CaseIterable {
    case emotionalStability = "emotional_stability"
    case gratitude = "gratitude"
    case selfReflection = "self_reflection"
    case resilience = "resilience"
    case goalOrientation = "goal_orientation"
    case socialConnection = "social_connection"
}

enum GrowthTrend: String, Codable {
    case improving = "improving"
    case stable = "stable"
    case declining = "declining"
    case fluctuating = "fluctuating"
}

enum TimePeriod: String, Codable, CaseIterable {
    case weekly = "weekly"
    case monthly = "monthly"
    case quarterly = "quarterly"
    case yearly = "yearly"
}

// MARK: - Pattern Insights
struct PatternInsights: Codable {
    let moodPatterns: [MoodPattern]
    let themePatterns: [ThemePattern]
    let writingStyleEvolution: WritingStyleEvolution
    let emotionalCycles: [EmotionalCycle]
}

struct WritingStyleEvolution: Codable {
    let vocabularyRichness: Double
    let sentenceComplexity: Double
    let emotionalExpression: Double
    let authenticityScore: Double
    let trend: GrowthTrend
}

struct EmotionalCycle: Codable {
    let cycleType: CycleType
    let duration: Int // in days
    let pattern: [Mood]
    let triggers: [String]
    let recommendations: [String]
}

enum CycleType: String, Codable {
    case weekly = "weekly"
    case monthly = "monthly"
    case seasonal = "seasonal"
    case stress = "stress"
    case growth = "growth"
}

struct GrowthInsights: Codable {
    let overallGrowth: Double
    let metrics: [GrowthMetric]
    let achievements: [Achievement]
    let areasForImprovement: [String]
    let growthTrajectory: GrowthTrend
}

struct Achievement: Codable {
    let title: String
    let description: String
    let achievedAt: Date
    let category: AchievementCategory
    let impact: Double
}

enum AchievementCategory: String, Codable, CaseIterable {
    case emotional = "emotional"
    case personal = "personal"
    case social = "social"
    case professional = "professional"
    case health = "health"
    case creative = "creative"
}

struct Recommendation: Codable {
    let type: RecommendationType
    let title: String
    let description: String
    let priority: Priority
    let actionableSteps: [String]
    let expectedOutcome: String
}

enum RecommendationType: String, Codable, CaseIterable {
    case reflection = "reflection"
    case action = "action"
    case mindfulness = "mindfulness"
    case social = "social"
    case goal = "goal"
    case wellness = "wellness"
}

enum Priority: String, Codable, CaseIterable {
    case low = "low"
    case medium = "medium"
    case high = "high"
    case urgent = "urgent"
}

struct RelationshipInsights: Codable {
    let importantPeople: [ImportantPerson]
    let insights: [String]
}

struct ImportantPerson: Codable {
    let name: String
    let frequency: Int
    let associatedMoods: [Mood]
    let relationshipType: RelationshipType
}

// MARK: - Advanced AI Insights
struct AdvancedAIInsights: Codable {
    let patterns: PatternInsights
    let growth: GrowthInsights
    let relationships: RelationshipInsights
    let recommendations: [Recommendation]
    let generatedAt: Date
}

struct WritingStyleEvolution: Codable {
    let vocabularyRichness: Double
    let sentenceComplexity: Double
    let emotionalExpression: Double
    let authenticityScore: Double
    let trend: GrowthTrend
}

struct EmotionalCycle: Codable {
    let cycleType: CycleType
    let duration: Int // in days
    let pattern: [Mood]
    let triggers: [String]
    let recommendations: [String]
}

enum CycleType: String, Codable {
    case weekly = "weekly"
    case monthly = "monthly"
    case seasonal = "seasonal"
    case stress = "stress"
    case growth = "growth"
}

struct GrowthInsights: Codable {
    let overallGrowth: Double
    let metrics: [GrowthMetric]
    let achievements: [Achievement]
    let areasForImprovement: [String]
    let growthTrajectory: GrowthTrend
}

struct Achievement: Codable {
    let title: String
    let description: String
    let achievedAt: Date
    let category: AchievementCategory
    let impact: Double
}

enum AchievementCategory: String, Codable, CaseIterable {
    case emotional = "emotional"
    case personal = "personal"
    case social = "social"
    case professional = "professional"
    case health = "health"
    case creative = "creative"
}

struct Recommendation: Codable {
    let type: RecommendationType
    let title: String
    let description: String
    let priority: Priority
    let actionableSteps: [String]
    let expectedOutcome: String
}

enum RecommendationType: String, Codable, CaseIterable {
    case reflection = "reflection"
    case action = "action"
    case mindfulness = "mindfulness"
    case social = "social"
    case goal = "goal"
    case wellness = "wellness"
}

enum Priority: String, Codable, CaseIterable {
    case low = "low"
    case medium = "medium"
    case high = "high"
    case urgent = "urgent"
}

// MARK: - Smart Memory Models
struct SmartMemory: Codable {
    let id: UUID
    let title: String
    let description: String
    let relatedEntries: [UUID]
    let memoryType: MemoryType
    let emotionalWeight: Double
    let createdAt: Date
    let lastAccessed: Date
}

enum MemoryType: String, Codable, CaseIterable {
    case milestone = "milestone"
    case relationship = "relationship"
    case achievement = "achievement"
    case challenge = "challenge"
    case insight = "insight"
    case recurring = "recurring"
}

// MARK: - Voice Journaling Models
struct VoiceEntry: Codable {
    let id: UUID
    let audioData: Data
    let transcription: String
    let detectedEmotion: AIInsights.Sentiment
    let confidence: Double
    let duration: TimeInterval
    let createdAt: Date
    let convertedToEntry: Bool
    let relatedEntryId: UUID?
}

// MARK: - Search Models
struct SearchQuery: Codable {
    let query: String
    let queryType: SearchQueryType
    let filters: SearchFilters
    let createdAt: Date
}

enum SearchQueryType: String, Codable, CaseIterable {
    case semantic = "semantic"
    case keyword = "keyword"
    case mood = "mood"
    case date = "date"
    case theme = "theme"
    case relationship = "relationship"
}

struct SearchFilters: Codable {
    let dateRange: DateRange?
    let moods: [Mood]?
    let themes: [String]?
    let relationships: [String]?
    let sentiment: AIInsights.Sentiment?
}

struct DateRange: Codable {
    let startDate: Date
    let endDate: Date
}

// MARK: - Privacy Mode
enum PrivacyMode: String, CaseIterable, Codable {
    case `private` = "private"
    case enhanced = "enhanced"
    
    var title: String {
        switch self {
        case .private:
            return "Private Mode"
        case .enhanced:
            return "Enhanced Mode"
        }
    }
    
    var description: String {
        switch self {
        case .private:
            return "All AI processing happens on your device"
        case .enhanced:
            return "Advanced AI features with cloud processing"
        }
    }
}

// MARK: - Journal Settings
struct JournalSettings: Codable {
    var theme: JournalTheme
    var enableAIInsights: Bool
    var enableVoiceNotes: Bool
    var enableLocationTracking: Bool
    var enableWeatherTracking: Bool
    var reminderTime: Date
    var enableReminders: Bool
    var fontSize: Double
    var enableDarkMode: Bool
    var privacyMode: PrivacyMode
    var enableCloudAI: Bool
    var enableAnalytics: Bool
    var enableSmartPrompts: Bool
    var enableWeeklySummaries: Bool
    var enableRelationshipTracking: Bool
    
    static let `default` = JournalSettings(
        theme: .liquidGlass,
        enableAIInsights: true,
        enableVoiceNotes: true,
        enableLocationTracking: false,
        enableWeatherTracking: true,
        reminderTime: Calendar.current.date(bySettingHour: 20, minute: 0, second: 0, of: Date()) ?? Date(),
        enableReminders: true,
        fontSize: 16.0,
        enableDarkMode: true,
        privacyMode: .enhanced,
        enableCloudAI: true,
        enableAnalytics: true,
        enableSmartPrompts: true,
        enableWeeklySummaries: true,
        enableRelationshipTracking: true
    )
}


