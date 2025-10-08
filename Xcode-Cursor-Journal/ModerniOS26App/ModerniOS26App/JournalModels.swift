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
    
    static let `default` = JournalSettings(
        theme: .liquidGlass,
        enableAIInsights: true,
        enableVoiceNotes: true,
        enableLocationTracking: false,
        enableWeatherTracking: true,
        reminderTime: Calendar.current.date(bySettingHour: 20, minute: 0, second: 0, of: Date()) ?? Date(),
        enableReminders: true,
        fontSize: 16.0,
        enableDarkMode: true
    )
}


