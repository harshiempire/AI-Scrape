import SwiftUI
import Foundation

// MARK: - Cloud AI Service for Advanced Features
@available(iOS 18.0, *)
@MainActor
class CloudAIService: ObservableObject {
    @Published var isProcessing = false
    @Published var lastError: String?
    @Published var isConnected = false
    
    private let apiKey: String
    private let baseURL = "https://api.openai.com/v1"
    
    init() {
        // In a real app, this would be loaded from secure storage
        // For demo purposes, we'll use a placeholder
        self.apiKey = "your-openai-api-key-here"
        self.isConnected = false
    }
    
    // MARK: - Pattern Analysis
    func analyzePatterns(entries: [JournalEntry]) async throws -> PatternAnalysis {
        isProcessing = true
        defer { isProcessing = false }
        
        let prompt = createPatternAnalysisPrompt(entries: entries)
        let response = try await makeAPICall(prompt: prompt, maxTokens: 1000)
        
        return try parsePatternAnalysis(response: response)
    }
    
    // MARK: - Weekly Summaries
    func generateWeeklySummary(entries: [JournalEntry]) async throws -> WeeklySummary {
        isProcessing = true
        defer { isProcessing = false }
        
        let prompt = createWeeklySummaryPrompt(entries: entries)
        let response = try await makeAPICall(prompt: prompt, maxTokens: 800)
        
        return try parseWeeklySummary(response: response)
    }
    
    // MARK: - Smart Prompts
    func generateContextualPrompts(for entry: JournalEntry, previousEntries: [JournalEntry]) async throws -> [String] {
        isProcessing = true
        defer { isProcessing = false }
        
        let prompt = createPromptGenerationPrompt(for: entry, previousEntries: previousEntries)
        let response = try await makeAPICall(prompt: prompt, maxTokens: 500)
        
        return try parsePrompts(response: response)
    }
    
    // MARK: - Semantic Search
    func semanticSearch(query: String, entries: [JournalEntry]) async throws -> [SemanticSearchResult] {
        isProcessing = true
        defer { isProcessing = false }
        
        let prompt = createSemanticSearchPrompt(query: query, entries: entries)
        let response = try await makeAPICall(prompt: prompt, maxTokens: 1000)
        
        return try parseSemanticSearch(response: response)
    }
    
    // MARK: - Relationship Analysis
    func analyzeRelationships(entries: [JournalEntry]) async throws -> RelationshipInsights {
        isProcessing = true
        defer { isProcessing = false }
        
        let prompt = createRelationshipAnalysisPrompt(entries: entries)
        let response = try await makeAPICall(prompt: prompt, maxTokens: 800)
        
        return try parseRelationshipInsights(response: response)
    }
    
    // MARK: - Private Methods
    private func makeAPICall(prompt: String, maxTokens: Int) async throws -> String {
        // Simulate API call for demo purposes
        // In a real implementation, this would make actual HTTP requests to OpenAI/Claude
        
        try await Task.sleep(nanoseconds: 2_000_000_000) // 2 second delay
        
        // Simulate different responses based on prompt content
        if prompt.contains("pattern analysis") {
            return """
            {
                "moodTrends": {
                    "weekly": {"happy": 0.6, "anxious": 0.3, "neutral": 0.1},
                    "monthly": {"happy": 0.5, "anxious": 0.4, "neutral": 0.1}
                },
                "triggers": {
                    "work": {"mood": "anxious", "frequency": 0.7},
                    "family": {"mood": "happy", "frequency": 0.8}
                },
                "insights": [
                    "You tend to feel anxious when writing about work-related topics",
                    "Family conversations consistently bring positive emotions",
                    "Your mood improves significantly on weekends"
                ]
            }
            """
        } else if prompt.contains("weekly summary") {
            return """
            {
                "keyThemes": ["work stress", "family time", "personal growth"],
                "emotionalTone": "mixed",
                "highlights": [
                    "You showed resilience during challenging work situations",
                    "Quality time with family provided emotional support",
                    "Personal reflection led to important insights about priorities"
                ],
                "growthMoments": [
                    "Recognized the importance of work-life balance",
                    "Expressed gratitude for supportive relationships"
                ]
            }
            """
        } else if prompt.contains("prompts") {
            return """
            [
                "What specific aspects of work are causing you stress?",
                "How did spending time with family make you feel?",
                "What would you like to change about your current situation?",
                "What are you most grateful for today?"
            ]
            """
        } else if prompt.contains("semantic search") {
            return """
            [
                {
                    "entryId": "entry1",
                    "relevanceScore": 0.9,
                    "matchedContent": "I felt so proud when I completed the project",
                    "reason": "Contains explicit mention of pride and accomplishment"
                },
                {
                    "entryId": "entry2", 
                    "relevanceScore": 0.8,
                    "matchedContent": "Finally achieved my goal after months of effort",
                    "reason": "Describes achievement and goal completion"
                }
            ]
            """
        } else if prompt.contains("relationships") {
            return """
            {
                "importantPeople": [
                    {
                        "name": "Sarah",
                        "frequency": 15,
                        "associatedMoods": ["happy", "grateful"],
                        "relationshipType": "family"
                    },
                    {
                        "name": "Mike",
                        "frequency": 8,
                        "associatedMoods": ["anxious", "frustrated"],
                        "relationshipType": "work"
                    }
                ],
                "insights": [
                    "Sarah is consistently associated with positive emotions",
                    "Work relationships seem to be a source of stress",
                    "You haven't mentioned close friends recently"
                ]
            }
            """
        }
        
        return "{}"
    }
    
    // MARK: - Prompt Creation Methods
    private func createPatternAnalysisPrompt(entries: [JournalEntry]) -> String {
        let entrySummaries = entries.prefix(20).map { entry in
            "Date: \(entry.date.formatted(date: .abbreviated, time: .omitted)), Mood: \(entry.mood.rawValue), Content: \(String(entry.content.prefix(200)))"
        }.joined(separator: "\n")
        
        return """
        Analyze these journal entries for patterns and insights. Focus on:
        1. Mood trends over time
        2. Topics that trigger specific emotions
        3. Recurring themes
        4. Behavioral patterns
        
        Entries:
        \(entrySummaries)
        
        Return JSON with moodTrends, triggers, and insights.
        """
    }
    
    private func createWeeklySummaryPrompt(entries: [JournalEntry]) -> String {
        let weekEntries = entries.prefix(7).map { entry in
            "\(entry.date.formatted(date: .abbreviated, time: .omitted)): \(entry.mood.emoji) \(String(entry.content.prefix(150)))"
        }.joined(separator: "\n")
        
        return """
        Create a weekly summary of these journal entries. Include:
        1. Key themes and topics
        2. Overall emotional tone
        3. Important highlights
        4. Moments of personal growth
        
        Entries:
        \(weekEntries)
        
        Return JSON with keyThemes, emotionalTone, highlights, and growthMoments.
        """
    }
    
    private func createPromptGenerationPrompt(for entry: JournalEntry, previousEntries: [JournalEntry]) -> String {
        let recentContext = previousEntries.prefix(3).map { entry in
            "\(entry.mood.rawValue): \(String(entry.content.prefix(100)))"
        }.joined(separator: "\n")
        
        return """
        Based on this journal entry and recent context, generate 4 thoughtful follow-up questions that would help the writer explore deeper:
        
        Current entry: \(entry.mood.rawValue) - \(String(entry.content.prefix(200)))
        Recent context:
        \(recentContext)
        
        Return JSON array of 4 question strings.
        """
    }
    
    private func createSemanticSearchPrompt(query: String, entries: [JournalEntry]) -> String {
        let entryList = entries.map { entry in
            "ID: \(entry.id.uuidString), Date: \(entry.date.formatted(date: .abbreviated, time: .omitted)), Content: \(entry.content)"
        }.joined(separator: "\n")
        
        return """
        Find journal entries that semantically match this query: "\(query)"
        
        Entries to search:
        \(entryList)
        
        Return JSON array with entryId, relevanceScore, matchedContent, and reason.
        """
    }
    
    private func createRelationshipAnalysisPrompt(entries: [JournalEntry]) -> String {
        let entryContent = entries.map { entry in
            "\(entry.date.formatted(date: .abbreviated, time: .omitted)): \(entry.mood.rawValue) - \(entry.content)"
        }.joined(separator: "\n")
        
        return """
        Analyze these journal entries to identify important people and relationship patterns:
        1. Extract names of people mentioned
        2. Note the emotional context around each person
        3. Identify relationship types (family, work, friends, etc.)
        4. Look for patterns in how different people affect mood
        
        Entries:
        \(entryContent)
        
        Return JSON with importantPeople array and insights.
        """
    }
    
    // MARK: - Response Parsing Methods
    private func parsePatternAnalysis(response: String) throws -> PatternAnalysis {
        // In a real implementation, this would parse JSON properly
        // For demo purposes, return mock data
        return PatternAnalysis(
            moodTrends: MoodTrends(
                weekly: ["happy": 0.6, "anxious": 0.3, "neutral": 0.1],
                monthly: ["happy": 0.5, "anxious": 0.4, "neutral": 0.1]
            ),
            triggers: [
                "work": MoodTrigger(mood: .anxious, frequency: 0.7),
                "family": MoodTrigger(mood: .happy, frequency: 0.8)
            ],
            insights: [
                "You tend to feel anxious when writing about work-related topics",
                "Family conversations consistently bring positive emotions",
                "Your mood improves significantly on weekends"
            ]
        )
    }
    
    private func parseWeeklySummary(response: String) throws -> WeeklySummary {
        return WeeklySummary(
            keyThemes: ["work stress", "family time", "personal growth"],
            emotionalTone: .mixed,
            highlights: [
                "You showed resilience during challenging work situations",
                "Quality time with family provided emotional support",
                "Personal reflection led to important insights about priorities"
            ],
            growthMoments: [
                "Recognized the importance of work-life balance",
                "Expressed gratitude for supportive relationships"
            ]
        )
    }
    
    private func parsePrompts(response: String) throws -> [String] {
        return [
            "What specific aspects of work are causing you stress?",
            "How did spending time with family make you feel?",
            "What would you like to change about your current situation?",
            "What are you most grateful for today?"
        ]
    }
    
    private func parseSemanticSearch(response: String) throws -> [SemanticSearchResult] {
        return [
            SemanticSearchResult(
                entryId: UUID(),
                relevanceScore: 0.9,
                matchedContent: "I felt so proud when I completed the project",
                reason: "Contains explicit mention of pride and accomplishment"
            ),
            SemanticSearchResult(
                entryId: UUID(),
                relevanceScore: 0.8,
                matchedContent: "Finally achieved my goal after months of effort",
                reason: "Describes achievement and goal completion"
            )
        ]
    }
    
    private func parseRelationshipInsights(response: String) throws -> RelationshipInsights {
        return RelationshipInsights(
            importantPeople: [
                ImportantPerson(
                    name: "Sarah",
                    frequency: 15,
                    associatedMoods: [.happy, .grateful],
                    relationshipType: .family
                ),
                ImportantPerson(
                    name: "Mike",
                    frequency: 8,
                    associatedMoods: [.anxious, .frustrated],
                    relationshipType: .work
                )
            ],
            insights: [
                "Sarah is consistently associated with positive emotions",
                "Work relationships seem to be a source of stress",
                "You haven't mentioned close friends recently"
            ]
        )
    }
}

// MARK: - Supporting Data Models
struct PatternAnalysis: Codable {
    let moodTrends: MoodTrends
    let triggers: [String: MoodTrigger]
    let insights: [String]
}

struct MoodTrends: Codable {
    let weekly: [String: Double]
    let monthly: [String: Double]
}

struct MoodTrigger: Codable {
    let mood: Mood
    let frequency: Double
}

struct WeeklySummary: Codable {
    let keyThemes: [String]
    let emotionalTone: AIInsights.Sentiment
    let highlights: [String]
    let growthMoments: [String]
}

struct SemanticSearchResult: Codable {
    let entryId: UUID
    let relevanceScore: Double
    let matchedContent: String
    let reason: String
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

enum RelationshipType: String, Codable, CaseIterable {
    case family = "family"
    case work = "work"
    case friends = "friends"
    case romantic = "romantic"
    case other = "other"
}
