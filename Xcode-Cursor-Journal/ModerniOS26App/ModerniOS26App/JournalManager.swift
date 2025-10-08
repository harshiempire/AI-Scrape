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
        // Simulate AI processing
        try? await Task.sleep(nanoseconds: 1_500_000_000)
        
        let words = entry.content.split(separator: " ").count
        let readingTime = max(1, words / 200) // Average reading speed
        
        // Simulate sentiment analysis
        let sentiment: AIInsights.Sentiment = {
            let positiveWords = ["happy", "great", "amazing", "love", "wonderful", "excited", "grateful"]
            let negativeWords = ["sad", "angry", "terrible", "hate", "awful", "anxious", "worried"]
            
            let content = entry.content.lowercased()
            let positiveCount = positiveWords.filter { content.contains($0) }.count
            let negativeCount = negativeWords.filter { content.contains($0) }.count
            
            if positiveCount > negativeCount {
                return .positive
            } else if negativeCount > positiveCount {
                return .negative
            } else if positiveCount > 0 && negativeCount > 0 {
                return .mixed
            } else {
                return .neutral
            }
        }()
        
        // Simulate topic extraction
        let keyTopics = extractTopics(from: entry.content)
        
        // Simulate writing style analysis
        let writingStyle = analyzeWritingStyle(entry.content)
        
        // Generate suggestions
        let suggestions = generateSuggestions(for: entry)
        
        return AIInsights(
            sentiment: sentiment,
            keyTopics: keyTopics,
            writingStyle: writingStyle,
            suggestions: suggestions,
            wordCount: words,
            readingTime: readingTime
        )
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
    
    private func generateSuggestions(for entry: JournalEntry) -> [String] {
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
        
        if entry.mood == .sad || entry.mood == .anxious {
            suggestions.append("Consider writing about what you're grateful for today")
        }
        
        if entry.mood == .happy || entry.mood == .excited {
            suggestions.append("This seems like a great day! What made it special?")
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

