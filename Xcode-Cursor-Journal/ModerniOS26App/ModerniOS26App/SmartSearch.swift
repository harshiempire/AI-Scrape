import SwiftUI
import Foundation

// MARK: - Smart Search Service
@available(iOS 18.0, *)
@MainActor
class SmartSearchService: ObservableObject {
    @Published var searchResults: [SemanticSearchResult] = []
    @Published var isSearching = false
    @Published var searchHistory: [SearchQuery] = []
    @Published var recentSearches: [String] = []
    
    private let cloudAIService = CloudAIService()
    private let privacyManager = AIPrivacyManager()
    
    // MARK: - Semantic Search
    func performSemanticSearch(query: String, entries: [JournalEntry]) async {
        guard !query.isEmpty else { return }
        
        isSearching = true
        defer { isSearching = false }
        
        // Add to search history
        let searchQuery = SearchQuery(
            query: query,
            queryType: .semantic,
            filters: SearchFilters(dateRange: nil, moods: nil, themes: nil, relationships: nil, sentiment: nil),
            createdAt: Date()
        )
        searchHistory.append(searchQuery)
        saveSearchHistory()
        
        // Add to recent searches
        if !recentSearches.contains(query) {
            recentSearches.insert(query, at: 0)
            recentSearches = Array(recentSearches.prefix(10))
            saveRecentSearches()
        }
        
        if privacyManager.canUseCloudAI() {
            // Use cloud AI for semantic search
            do {
                searchResults = try await cloudAIService.semanticSearch(query: query, entries: entries)
            } catch {
                // Fallback to local search
                searchResults = performLocalSearch(query: query, entries: entries)
            }
        } else {
            // Use local search only
            searchResults = performLocalSearch(query: query, entries: entries)
        }
    }
    
    // MARK: - Local Search Fallback
    private func performLocalSearch(query: String, entries: [JournalEntry]) -> [SemanticSearchResult] {
        let queryLower = query.lowercased()
        var results: [SemanticSearchResult] = []
        
        for entry in entries {
            var relevanceScore = 0.0
            var matchedContent = ""
            var reason = ""
            
            // Title match
            if entry.title.lowercased().contains(queryLower) {
                relevanceScore += 0.8
                matchedContent = entry.title
                reason = "Title contains query"
            }
            
            // Content match
            if entry.content.lowercased().contains(queryLower) {
                relevanceScore += 0.6
                if matchedContent.isEmpty {
                    matchedContent = String(entry.content.prefix(100))
                }
                reason = "Content contains query"
            }
            
            // Tag match
            for tag in entry.tags {
                if tag.lowercased().contains(queryLower) {
                    relevanceScore += 0.4
                    if matchedContent.isEmpty {
                        matchedContent = "Tag: \(tag)"
                    }
                    reason = "Tag matches query"
                }
            }
            
            // Mood match
            if entry.mood.rawValue.lowercased().contains(queryLower) {
                relevanceScore += 0.3
                if matchedContent.isEmpty {
                    matchedContent = "Mood: \(entry.mood.rawValue)"
                }
                reason = "Mood matches query"
            }
            
            if relevanceScore > 0 {
                let result = SemanticSearchResult(
                    entryId: entry.id,
                    relevanceScore: relevanceScore,
                    matchedContent: matchedContent,
                    reason: reason
                )
                results.append(result)
            }
        }
        
        return results.sorted { $0.relevanceScore > $1.relevanceScore }
    }
    
    // MARK: - Filtered Search
    func performFilteredSearch(
        query: String,
        entries: [JournalEntry],
        filters: SearchFilters
    ) async {
        var filteredEntries = entries
        
        // Apply date range filter
        if let dateRange = filters.dateRange {
            filteredEntries = filteredEntries.filter { entry in
                entry.date >= dateRange.startDate && entry.date <= dateRange.endDate
            }
        }
        
        // Apply mood filter
        if let moods = filters.moods, !moods.isEmpty {
            filteredEntries = filteredEntries.filter { entry in
                moods.contains(entry.mood)
            }
        }
        
        // Apply theme filter
        if let themes = filters.themes, !themes.isEmpty {
            filteredEntries = filteredEntries.filter { entry in
                themes.contains { theme in
                    entry.content.lowercased().contains(theme.lowercased()) ||
                    entry.tags.contains { tag in
                        tag.lowercased().contains(theme.lowercased())
                    }
                }
            }
        }
        
        // Apply relationship filter
        if let relationships = filters.relationships, !relationships.isEmpty {
            filteredEntries = filteredEntries.filter { entry in
                relationships.contains { relationship in
                    entry.content.lowercased().contains(relationship.lowercased())
                }
            }
        }
        
        // Apply sentiment filter
        if let sentiment = filters.sentiment {
            filteredEntries = filteredEntries.filter { entry in
                // This would require AI analysis of each entry
                // For now, we'll skip this filter in local mode
                true
            }
        }
        
        await performSemanticSearch(query: query, entries: filteredEntries)
    }
    
    // MARK: - Search Suggestions
    func getSearchSuggestions(for query: String, entries: [JournalEntry]) -> [String] {
        var suggestions: [String] = []
        
        // Recent searches
        suggestions.append(contentsOf: recentSearches.filter { $0.lowercased().contains(query.lowercased()) })
        
        // Common themes from entries
        let themes = extractCommonThemes(from: entries)
        suggestions.append(contentsOf: themes.filter { $0.lowercased().contains(query.lowercased()) })
        
        // Mood suggestions
        let moodSuggestions = Mood.allCases.map { "I felt \($0.rawValue)" }
        suggestions.append(contentsOf: moodSuggestions.filter { $0.lowercased().contains(query.lowercased()) })
        
        // Common search patterns
        let commonPatterns = [
            "When was I happiest?",
            "What made me anxious?",
            "Who did I mention?",
            "What did I learn?",
            "How did I grow?"
        ]
        suggestions.append(contentsOf: commonPatterns.filter { $0.lowercased().contains(query.lowercased()) })
        
        return Array(Set(suggestions)).prefix(8).map { $0 }
    }
    
    private func extractCommonThemes(from entries: [JournalEntry]) -> [String] {
        var themeCounts: [String: Int] = [:]
        
        for entry in entries {
            let words = entry.content.components(separatedBy: .whitespacesAndNewlines)
                .filter { $0.count > 3 }
                .map { $0.lowercased() }
            
            for word in words {
                themeCounts[word, default: 0] += 1
            }
        }
        
        return themeCounts.sorted { $0.value > $1.value }
            .prefix(20)
            .map { $0.key }
    }
    
    // MARK: - Data Persistence
    private func saveSearchHistory() {
        if let encoded = try? JSONEncoder().encode(searchHistory) {
            UserDefaults.standard.set(encoded, forKey: "SearchHistory")
        }
    }
    
    private func loadSearchHistory() {
        if let data = UserDefaults.standard.data(forKey: "SearchHistory"),
           let decoded = try? JSONDecoder().decode([SearchQuery].self, from: data) {
            searchHistory = decoded
        }
    }
    
    private func saveRecentSearches() {
        UserDefaults.standard.set(recentSearches, forKey: "RecentSearches")
    }
    
    private func loadRecentSearches() {
        if let searches = UserDefaults.standard.stringArray(forKey: "RecentSearches") {
            recentSearches = searches
        }
    }
    
    func clearSearchHistory() {
        searchHistory.removeAll()
        recentSearches.removeAll()
        saveSearchHistory()
        saveRecentSearches()
    }
}

// MARK: - Smart Search View
@available(iOS 18.0, *)
struct SmartSearchView: View {
    @StateObject private var searchService = SmartSearchService()
    @EnvironmentObject var journalManager: JournalManager
    
    @State private var searchText = ""
    @State private var showingFilters = false
    @State private var searchFilters = SearchFilters(
        dateRange: nil,
        moods: nil,
        themes: nil,
        relationships: nil,
        sentiment: nil
    )
    @State private var suggestions: [String] = []
    @State private var showingSuggestions = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search bar
                searchBar
                
                // Suggestions
                if showingSuggestions && !suggestions.isEmpty {
                    suggestionsList
                }
                
                // Search results
                if !searchService.searchResults.isEmpty {
                    searchResultsList
                } else if searchService.isSearching {
                    loadingView
                } else if !searchText.isEmpty {
                    noResultsView
                } else {
                    recentSearchesView
                }
            }
            .navigationTitle("Search")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        showingFilters = true
                    }) {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                            .foregroundColor(.blue)
                    }
                }
            }
        }
        .sheet(isPresented: $showingFilters) {
            SearchFiltersView(filters: $searchFilters)
        }
        .onAppear {
            searchService.loadSearchHistory()
            searchService.loadRecentSearches()
        }
    }
    
    private var searchBar: some View {
        VStack(spacing: 12) {
            HStack {
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    
                    TextField("Search your journal...", text: $searchText)
                        .textFieldStyle(PlainTextFieldStyle())
                        .onSubmit {
                            performSearch()
                        }
                        .onChange(of: searchText) { oldValue, newValue in
                            if !newValue.isEmpty {
                                suggestions = searchService.getSearchSuggestions(for: newValue, entries: journalManager.entries)
                                showingSuggestions = true
                            } else {
                                showingSuggestions = false
                            }
                        }
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(.gray.opacity(0.1))
                )
                
                if !searchText.isEmpty {
                    Button("Search") {
                        performSearch()
                    }
                    .foregroundColor(.blue)
                }
            }
            
            // Quick search buttons
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(["Happy moments", "Work stress", "Family time", "Goals"], id: \.self) { quickSearch in
                        Button(action: {
                            searchText = quickSearch
                            performSearch()
                        }) {
                            Text(quickSearch)
                                .font(.caption)
                                .foregroundColor(.blue)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(
                                    Capsule()
                                        .fill(.blue.opacity(0.1))
                                )
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding()
        .background(.ultraThinMaterial)
    }
    
    private var suggestionsList: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(suggestions, id: \.self) { suggestion in
                Button(action: {
                    searchText = suggestion
                    performSearch()
                    showingSuggestions = false
                }) {
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .font(.caption)
                            .foregroundColor(.gray)
                        
                        Text(suggestion)
                            .font(.body)
                            .foregroundColor(.primary)
                        
                        Spacer()
                    }
                    .padding()
                }
                
                if suggestion != suggestions.last {
                    Divider()
                }
            }
        }
        .background(.ultraThinMaterial)
    }
    
    private var searchResultsList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(searchService.searchResults, id: \.entryId) { result in
                    if let entry = journalManager.entries.first(where: { $0.id == result.entryId }) {
                        SearchResultCard(result: result, entry: entry)
                    }
                }
            }
            .padding()
        }
    }
    
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
            
            Text("Searching...")
                .font(.headline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var noResultsView: some View {
        VStack(spacing: 16) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 50))
                .foregroundColor(.gray)
            
            Text("No results found")
                .font(.headline)
                .foregroundColor(.secondary)
            
            Text("Try different keywords or check your filters")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var recentSearchesView: some View {
        VStack(alignment: .leading, spacing: 16) {
            if !searchService.recentSearches.isEmpty {
                Text("Recent Searches")
                    .font(.headline)
                    .foregroundColor(.primary)
                    .padding(.horizontal)
                
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(searchService.recentSearches, id: \.self) { search in
                            Button(action: {
                                searchText = search
                                performSearch()
                            }) {
                                Text(search)
                                    .font(.caption)
                                    .foregroundColor(.blue)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(
                                        Capsule()
                                            .fill(.blue.opacity(0.1))
                                    )
                            }
                        }
                    }
                    .padding(.horizontal)
                }
            }
            
            Spacer()
        }
    }
    
    private func performSearch() {
        showingSuggestions = false
        
        Task {
            await searchService.performFilteredSearch(
                query: searchText,
                entries: journalManager.entries,
                filters: searchFilters
            )
        }
    }
}

// MARK: - Search Result Card
struct SearchResultCard: View {
    let result: SemanticSearchResult
    let entry: JournalEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(entry.title.isEmpty ? "Untitled Entry" : entry.title)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text(entry.date.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Text(result.matchedContent)
                .font(.body)
                .foregroundColor(.primary)
                .lineLimit(3)
            
            HStack {
                Text(entry.mood.emoji)
                    .font(.caption)
                
                Text(entry.mood.rawValue.capitalized)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text("\(Int(result.relevanceScore * 100))% match")
                    .font(.caption)
                    .foregroundColor(.blue)
            }
            
            if !entry.tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 4) {
                        ForEach(entry.tags, id: \.self) { tag in
                            Text(tag)
                                .font(.caption2)
                                .foregroundColor(.blue)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(
                                    Capsule()
                                        .fill(.blue.opacity(0.1))
                                )
                        }
                    }
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.gray.opacity(0.1))
        )
    }
}

// MARK: - Search Filters View
struct SearchFiltersView: View {
    @Binding var filters: SearchFilters
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedMoods: Set<Mood> = []
    @State private var selectedThemes: Set<String> = []
    @State private var selectedRelationships: Set<String> = []
    @State private var selectedSentiment: AIInsights.Sentiment?
    @State private var dateRange: DateRange?
    
    var body: some View {
        NavigationView {
            Form {
                Section("Date Range") {
                    DatePicker("Start Date", selection: Binding(
                        get: { dateRange?.startDate ?? Date() },
                        set: { newValue in
                            if dateRange == nil {
                                dateRange = DateRange(startDate: newValue, endDate: newValue)
                            } else {
                                dateRange?.startDate = newValue
                            }
                        }
                    ), displayedComponents: .date)
                    
                    DatePicker("End Date", selection: Binding(
                        get: { dateRange?.endDate ?? Date() },
                        set: { newValue in
                            if dateRange == nil {
                                dateRange = DateRange(startDate: newValue, endDate: newValue)
                            } else {
                                dateRange?.endDate = newValue
                            }
                        }
                    ), displayedComponents: .date)
                }
                
                Section("Moods") {
                    ForEach(Mood.allCases, id: \.self) { mood in
                        HStack {
                            Text(mood.emoji)
                            Text(mood.rawValue.capitalized)
                            Spacer()
                            if selectedMoods.contains(mood) {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.blue)
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            if selectedMoods.contains(mood) {
                                selectedMoods.remove(mood)
                            } else {
                                selectedMoods.insert(mood)
                            }
                        }
                    }
                }
                
                Section("Sentiment") {
                    ForEach([AIInsights.Sentiment.positive, .negative, .neutral, .mixed], id: \.self) { sentiment in
                        HStack {
                            Text(sentiment.rawValue.capitalized)
                            Spacer()
                            if selectedSentiment == sentiment {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.blue)
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            selectedSentiment = selectedSentiment == sentiment ? nil : sentiment
                        }
                    }
                }
            }
            .navigationTitle("Search Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Clear") {
                        selectedMoods.removeAll()
                        selectedThemes.removeAll()
                        selectedRelationships.removeAll()
                        selectedSentiment = nil
                        dateRange = nil
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Apply") {
                        filters = SearchFilters(
                            dateRange: dateRange,
                            moods: selectedMoods.isEmpty ? nil : Array(selectedMoods),
                            themes: selectedThemes.isEmpty ? nil : Array(selectedThemes),
                            relationships: selectedRelationships.isEmpty ? nil : Array(selectedRelationships),
                            sentiment: selectedSentiment
                        )
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    SmartSearchView()
        .environmentObject(JournalManager())
}
