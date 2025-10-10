import SwiftUI
import Foundation

// MARK: - Smart Prompts Section
@available(iOS 18.0, *)
struct SmartPromptsSection: View {
    let content: String
    let mood: Mood
    let previousEntries: [JournalEntry]
    
    @State private var prompts: [String] = []
    @State private var isLoading = false
    @State private var selectedPrompt: String?
    
    private let cloudAIService = CloudAIService()
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "lightbulb.fill")
                    .font(.caption)
                    .foregroundColor(.yellow)
                
                Text("Smart Prompts")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.white.opacity(0.8))
                
                Spacer()
                
                if isLoading {
                    ProgressView()
                        .scaleEffect(0.7)
                }
            }
            
            if prompts.isEmpty && !isLoading {
                Button(action: generatePrompts) {
                    HStack {
                        Image(systemName: "sparkles")
                            .font(.caption)
                        
                        Text("Generate Prompts")
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                    .foregroundColor(.blue)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        Capsule()
                            .fill(.blue.opacity(0.2))
                    )
                }
            }
            
            if !prompts.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(prompts, id: \.self) { prompt in
                            PromptCard(
                                prompt: prompt,
                                isSelected: selectedPrompt == prompt
                            ) {
                                selectedPrompt = prompt
                                // Insert prompt into content
                            }
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.blue.opacity(0.1))
        )
    }
    
    private func generatePrompts() {
        isLoading = true
        
        Task {
            do {
                let currentEntry = JournalEntry(content: content, mood: mood)
                prompts = try await cloudAIService.generateContextualPrompts(
                    for: currentEntry,
                    previousEntries: Array(previousEntries.prefix(5))
                )
            } catch {
                // Fallback to local prompts
                prompts = generateLocalPrompts()
            }
            
            isLoading = false
        }
    }
    
    private func generateLocalPrompts() -> [String] {
        var localPrompts: [String] = []
        
        // Mood-based prompts
        switch mood {
        case .happy:
            localPrompts.append("What made this moment special?")
            localPrompts.append("How can you recreate this feeling?")
        case .sad:
            localPrompts.append("What support do you need right now?")
            localPrompts.append("What would help you feel better?")
        case .anxious:
            localPrompts.append("What are you worried about?")
            localPrompts.append("What can you control in this situation?")
        case .grateful:
            localPrompts.append("Who or what are you grateful for?")
            localPrompts.append("How has this impacted your life?")
        default:
            localPrompts.append("What else happened today?")
            localPrompts.append("How are you feeling about this?")
        }
        
        // Content-based prompts
        if content.count < 100 {
            localPrompts.append("Can you add more details?")
        }
        
        if !content.contains("I") {
            localPrompts.append("How did this make you feel personally?")
        }
        
        return Array(localPrompts.prefix(4))
    }
}

// MARK: - Prompt Card
struct PromptCard: View {
    let prompt: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(prompt)
                .font(.caption)
                .foregroundColor(isSelected ? .white : .primary)
                .multilineTextAlignment(.leading)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(isSelected ? .blue : .white.opacity(0.2))
                )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - New Entry View
struct NewEntryView: View {
    @EnvironmentObject var journalManager: JournalManager
    @Environment(\.dismiss) private var dismiss
    
    @State private var title = ""
    @State private var content = ""
    @State private var selectedMood: Mood = .neutral
    @State private var tags: [String] = []
    @State private var newTag = ""
    @State private var isGeneratingInsights = false
    @State private var showingMoodPicker = false
    
    // New dynamic AI states
    @State private var aiService = RealAIService()
    @State private var detectedSentiment: AIInsights.Sentiment = .neutral
    @State private var suggestedMood: Mood?
    @State private var suggestedTags: [String] = []
    @State private var isAnalyzing = false
    @State private var showMoodSuggestion = false
    @State private var analysisTask: Task<Void, Never>?
    
    var body: some View {
        NavigationView {
            ZStack {
                journalManager.settings.theme.gradient
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Title Input
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Title")
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            TextField("Give your entry a title...", text: $title)
                                .textFieldStyle(PlainTextFieldStyle())
                                .foregroundColor(.white)
                                .padding()
                                .background( in: RoundedRectangle(cornerRadius: 12))
                        }
                        
                        // Mood Selector
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("How are you feeling?")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                
                                if isAnalyzing {
                                    ProgressView()
                                        .scaleEffect(0.7)
                                        .padding(.leading, 8)
                                }
                            }
                            
                            // AI Mood Suggestion Banner
                            if showMoodSuggestion, let suggested = suggestedMood {
                                HStack {
                                    Image(systemName: "sparkles")
                                        .foregroundColor(.yellow)
                                    
                                    Text("AI suggests: \(suggested.emoji) \(suggested.rawValue.capitalized)")
                                        .font(.caption)
                                        .foregroundColor(.white)
                                    
                                    Spacer()
                                    
                                    Button("Apply") {
                                        selectedMood = suggested
                                        showMoodSuggestion = false
                                    }
                                    .font(.caption)
                                    .foregroundColor(.blue)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 4)
                                    .background(
                                        Capsule()
                                            .fill(.white.opacity(0.2))
                                    )
                                    
                                    Button(action: {
                                        showMoodSuggestion = false
                                    }) {
                                        Image(systemName: "xmark")
                                            .font(.caption2)
                                            .foregroundColor(.white.opacity(0.6))
                                    }
                                }
                                .padding()
                                .background(
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(.blue.opacity(0.2))
                                )
                                .transition(.move(edge: .top).combined(with: .opacity))
                            }
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
                                    ForEach(Mood.allCases, id: \.self) { mood in
                                        Button(action: {
                                            selectedMood = mood
                                        }) {
                                            VStack(spacing: 4) {
                                                Text(mood.emoji)
                                                    .font(.title)
                                                
                                                Text(mood.rawValue.capitalized)
                                                    .font(.caption)
                                                    .foregroundColor(.white.opacity(0.8))
                                            }
                                            .padding()
                                            .background(
                                                selectedMood == mood ? .white.opacity(0.3) : .red.opacity(0.1),
                                                in: RoundedRectangle(cornerRadius: 12)
                                            )
                                        }
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                        
                        // Content Input
                        VStack(alignment: .leading, spacing: 8) {
                            Text("What's on your mind?")
                                .font(.headline)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            
                            // Main content area - light gray like in the image
                            ZStack(alignment: .topLeading) {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(.gray.opacity(0.3))
                                    .frame(minHeight: 200)
                                
                                VStack(alignment: .leading, spacing: 0) {
                                    // Sentiment indicator bar
                                    if !content.isEmpty && content.count > 20 {
                                        HStack {
                                            Image(systemName: sentimentIcon(detectedSentiment))
                                                .font(.caption2)
                                                .foregroundColor(sentimentColor(detectedSentiment))
                                            
                                            Text(detectedSentiment.rawValue.capitalized)
                                                .font(.caption2)
                                                .foregroundColor(.black)
                                            
                                            Spacer()
                                        }
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(.white.opacity(0.7))
                                    }
                                    
                                    TextEditor(text: $content)
                                        .scrollContentBackground(.hidden)
                                        .background(.clear)
                                        .foregroundColor(.black)
                                        .font(.body)
                                        .padding()
                                        .onChange(of: content) { oldValue, newValue in
                                            analyzeContentDebounced()
                                        }
                                        .overlay(
                                            Group {
                                                if content.isEmpty {
                                                    Text("Write your thoughts here...")
                                                        .foregroundColor(.gray.opacity(0.6))
                                                        .font(.body)
                                                        .padding()
                                                }
                                            }
                                        )
                                }
                            }
                            
                            // Separate tag input - also light gray
                            HStack {
                                TextField("Add a tag...", text: $newTag)
                                    .textFieldStyle(PlainTextFieldStyle())
                                    .foregroundColor(.black)
                                    .padding()
                                    .background(
                                        RoundedRectangle(cornerRadius: 12)
                                            .fill(.gray.opacity(0.3))
                                    )
                                    .onSubmit {
                                        addTag()
                                    }
                                
                                Button(action: addTag) {
                                    Image(systemName: "plus.circle.fill")
                                        .font(.title2)
                                        .foregroundColor(.blue)
                                }
                                .disabled(newTag.trimmingCharacters(in: .whitespaces).isEmpty)
                            }
                            
                            // Tags display
                            if !tags.isEmpty {
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 8) {
                                        ForEach(tags, id: \.self) { tag in
                                            HStack(spacing: 6) {
                                                Image(systemName: "folder.fill")
                                                    .font(.caption)
                                                    .foregroundColor(.blue)
                                                
                                                Text(tag)
                                                    .font(.caption)
                                                    .foregroundColor(.black)
                                                
                                                Button(action: {
                                                    tags.removeAll { $0 == tag }
                                                }) {
                                                    Image(systemName: "xmark")
                                                        .font(.caption2)
                                                        .foregroundColor(.gray)
                                                }
                                            }
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(
                                                Capsule()
                                                    .fill(.white.opacity(0.8))
                                            )
                                        }
                                    }
                                    .padding(.horizontal)
                                }
                            }
                            
                            // AI Suggested Tags
                            if !suggestedTags.isEmpty {
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Image(systemName: "sparkles")
                                            .font(.caption)
                                            .foregroundColor(.yellow)
                                        
                                        Text("Suggested Tags")
                                            .font(.caption)
                                            .fontWeight(.semibold)
                                            .foregroundColor(.white)
                                    }
                                    
                                    ScrollView(.horizontal, showsIndicators: false) {
                                        HStack(spacing: 8) {
                                            ForEach(suggestedTags, id: \.self) { tag in
                                                Button(action: {
                                                    tags.append(tag)
                                                    suggestedTags.removeAll { $0 == tag }
                                                }) {
                                                    HStack(spacing: 6) {
                                                        Image(systemName: "plus.circle.fill")
                                                            .font(.caption2)
                                                            .foregroundColor(.blue)
                                                        
                                                        Text(tag)
                                                            .font(.caption)
                                                            .foregroundColor(.black)
                                                    }
                                                    .padding(.horizontal, 8)
                                                    .padding(.vertical, 4)
                                                    .background(
                                                        Capsule()
                                                            .fill(.white.opacity(0.9))
                                                            .overlay(
                                                                Capsule()
                                                                    .stroke(.blue.opacity(0.3), lineWidth: 1)
                                                            )
                                                    )
                                                }
                                            }
                                        }
                                        .padding(.horizontal)
                                    }
                                }
                            }
                        }
                        
        // AI Insights and Smart Prompts
        if journalManager.settings.enableAIInsights {
            VStack(spacing: 12) {
                // Refresh Insights Button
                HStack(spacing: 12) {
                    Button(action: {
                        Task {
                            await analyzeContent()
                        }
                    }) {
                        HStack {
                            Image(systemName: "arrow.clockwise")
                                .font(.body)
                            
                            Text("Refresh Insights")
                                .font(.body)
                                .fontWeight(.medium)
                            
                            if isAnalyzing {
                                ProgressView()
                                    .scaleEffect(0.8)
                                    .padding(.leading, 4)
                            }
                        }
                        .foregroundColor(.white)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(.blue.opacity(0.3))
                        )
                    }
                    .disabled(content.isEmpty || isAnalyzing)
                }
                
                // Smart Prompts Section
                if journalManager.settings.enableSmartPrompts && !content.isEmpty {
                    SmartPromptsSection(
                        content: content,
                        mood: selectedMood,
                        previousEntries: journalManager.entries
                    )
                }
            }
        }
                    }
                    .padding()
                }
            }
            .navigationTitle("New Entry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveEntry()
                    }
                    .foregroundColor(.white)
                    .disabled(content.isEmpty)
                }
            }
        }
    }
    
    private func addTag() {
        let trimmedTag = newTag.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedTag.isEmpty && !tags.contains(trimmedTag) {
            tags.append(trimmedTag)
            newTag = ""
        }
    }
    
    // MARK: - Dynamic AI Analysis Functions
    private func analyzeContentDebounced() {
        // Cancel previous task
        analysisTask?.cancel()
        
        // Create new task with delay
        analysisTask = Task {
            try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
            
            guard !Task.isCancelled else { return }
            
            await analyzeContent()
        }
    }
    
    private func analyzeContent() async {
        guard !content.isEmpty, content.count > 20 else {
            detectedSentiment = .neutral
            suggestedMood = nil
            suggestedTags = []
            return
        }
        
        isAnalyzing = true
        
        // Real-time sentiment analysis
        detectedSentiment = aiService.analyzeSentiment(text: content)
        
        // Suggest mood based on sentiment
        suggestedMood = moodFromSentiment(detectedSentiment)
        showMoodSuggestion = (suggestedMood != selectedMood)
        
        // Extract suggested tags
        let topics = aiService.extractTopics(from: content)
        suggestedTags = topics.filter { !tags.contains($0) }
        
        isAnalyzing = false
    }
    
    private func moodFromSentiment(_ sentiment: AIInsights.Sentiment) -> Mood {
        switch sentiment {
        case .positive: return .happy
        case .negative: return .sad
        case .mixed: return .anxious
        case .neutral: return .neutral
        }
    }
    
    private func sentimentIcon(_ sentiment: AIInsights.Sentiment) -> String {
        switch sentiment {
        case .positive: return "face.smiling"
        case .negative: return "face.dashed"
        case .mixed: return "face.dashed.fill"
        case .neutral: return "minus.circle"
        }
    }
    
    private func sentimentColor(_ sentiment: AIInsights.Sentiment) -> Color {
        switch sentiment {
        case .positive: return .green
        case .negative: return .red
        case .mixed: return .orange
        case .neutral: return .gray
        }
    }
    
    private func generateInsights() {
        isGeneratingInsights = true
        
        Task {
            let entry = JournalEntry(title: title, content: content, mood: selectedMood)
            let insights = await journalManager.generateAIInsights(for: entry)
            
            await MainActor.run {
                isGeneratingInsights = false
                // You could show the insights in an alert or separate view
            }
        }
    }
    
    private func saveEntry() {
        var entry = JournalEntry(title: title, content: content, mood: selectedMood)
        entry.tags = tags
        
        if journalManager.settings.enableAIInsights {
            Task {
                let insights = await journalManager.generateAIInsights(for: entry)
                entry.aiInsights = insights
                
                await MainActor.run {
                    journalManager.addEntry(entry)
                    dismiss()
                }
            }
        } else {
            journalManager.addEntry(entry)
            dismiss()
        }
    }
}

// MARK: - Entry Detail View
struct EntryDetailView: View {
    let entry: JournalEntry
    @EnvironmentObject var journalManager: JournalManager
    @Environment(\.dismiss) private var dismiss
    
    @State private var isEditing = false
    @State private var editedTitle: String
    @State private var editedContent: String
    @State private var editedMood: Mood
    @State private var editedTags: [String]
    @State private var newTag = ""
    @State private var entrySummary: String?
    @State private var isGeneratingSummary = false
    
    init(entry: JournalEntry) {
        self.entry = entry
        self._editedTitle = State(initialValue: entry.title)
        self._editedContent = State(initialValue: entry.content)
        self._editedMood = State(initialValue: entry.mood)
        self._editedTags = State(initialValue: entry.tags)
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                journalManager.settings.theme.gradient
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        // Header
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(entry.date, style: .date)
                                        .font(.caption)
                                        .foregroundColor(.white.opacity(0.6))
                                    
                                    Text(entry.date, style: .time)
                                        .font(.caption)
                                        .foregroundColor(.white.opacity(0.6))
                                }
                                
                                Spacer()
                                
                                VStack {
                                    Text(entry.mood.emoji)
                                        .font(.title)
                                    
                                    Text(entry.mood.rawValue.capitalized)
                                        .font(.caption)
                                        .foregroundColor(.white.opacity(0.8))
                                }
                            }
                            
                            if !entry.title.isEmpty {
                                Text(entry.title)
                                    .font(.title)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                            }
                        }
                        .padding()
                        .background( in: RoundedRectangle(cornerRadius: 16))
                        
                        // Content
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Entry")
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            Text(entry.content)
                                .font(.body)
                                .foregroundColor(.white.opacity(0.9))
                                .lineSpacing(4)
                        }
                        .padding()
                        .background( in: RoundedRectangle(cornerRadius: 16))
                        
                        // Tags
                        if !entry.tags.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Tags")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack {
                                        ForEach(entry.tags, id: \.self) { tag in
                                            Text("#\(tag)")
                                                .font(.body)
                                                .foregroundColor(.white)
                                                .padding(.horizontal, 12)
                                                .padding(.vertical, 6)
                                                .background( in: RoundedRectangle(cornerRadius: 8))
                                        }
                                    }
                                }
                            }
                            .padding()
                            .background( in: RoundedRectangle(cornerRadius: 16))
                        }
                        
                        // AI Insights
                        if let insights = entry.aiInsights {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("AI Insights")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Text("Sentiment:")
                                            .fontWeight(.medium)
                                        Text(insights.sentiment.rawValue.capitalized)
                                            .foregroundColor(insights.sentiment == .positive ? .green : 
                                                           insights.sentiment == .negative ? .red : .gray)
                                    }
                                    
                                    HStack {
                                        Text("Reading Time:")
                                            .fontWeight(.medium)
                                        Text("\(insights.readingTime) min")
                                    }
                                    
                                    HStack {
                                        Text("Word Count:")
                                            .fontWeight(.medium)
                                        Text("\(insights.wordCount)")
                                    }
                                    
                                    if !insights.keyTopics.isEmpty {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("Key Topics:")
                                                .fontWeight(.medium)
                                            ForEach(insights.keyTopics, id: \.self) { topic in
                                                Text("• \(topic)")
                                                    .foregroundColor(.white.opacity(0.8))
                                            }
                                        }
                                    }
                                    
                                    if !insights.suggestions.isEmpty {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("Suggestions:")
                                                .fontWeight(.medium)
                                            ForEach(insights.suggestions, id: \.self) { suggestion in
                                                Text("• \(suggestion)")
                                                    .foregroundColor(.white.opacity(0.8))
                                            }
                                        }
                                    }
                                }
                                .foregroundColor(.white.opacity(0.9))
                            }
                            .padding()
                            .background( in: RoundedRectangle(cornerRadius: 16))
                        }
                        
                        // Text Summary
                        if entry.content.count > 500 {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Summary")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                
                                if let summary = entrySummary {
                                    Text(summary)
                                        .font(.body)
                                        .foregroundColor(.white.opacity(0.9))
                                        .padding()
                                        .background(in: RoundedRectangle(cornerRadius: 12))
                                } else {
                                    Button(action: {
                                        Task {
                                            await generateSummary()
                                        }
                                    }) {
                                        HStack {
                                            if isGeneratingSummary {
                                                ProgressView()
                                                    .scaleEffect(0.8)
                                            }
                                            Text(isGeneratingSummary ? "Generating..." : "Generate Summary")
                                        }
                                        .foregroundColor(.white)
                                        .padding()
                                        .frame(maxWidth: .infinity)
                                        .background(in: RoundedRectangle(cornerRadius: 12))
                                    }
                                }
                            }
                            .padding()
                            .background(in: RoundedRectangle(cornerRadius: 16))
                        }
                        
                        // Stats
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Statistics")
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            HStack {
                                StatItem(title: "Words", value: "\(entry.wordCount)")
                                StatItem(title: "Characters", value: "\(entry.content.count)")
                                StatItem(title: "Reading Time", value: "\(max(1, entry.wordCount / 200)) min")
                            }
                        }
                        .padding()
                        .background(in: RoundedRectangle(cornerRadius: 16))
                    }
                    .padding()
                }
            }
            .navigationTitle("Entry Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack {
                        Button(action: {
                            journalManager.toggleFavorite(entry)
                        }) {
                            Image(systemName: entry.isFavorite ? "heart.fill" : "heart")
                                .foregroundColor(entry.isFavorite ? .pink : .white)
                        }
                        
                        Menu {
                            Button("Edit Entry") {
                                isEditing = true
                            }
                            
                            Button("Delete Entry", role: .destructive) {
                                journalManager.deleteEntry(entry)
                                dismiss()
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle")
                                .foregroundColor(.white)
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $isEditing) {
            EditEntryView(entry: entry)
                .environmentObject(journalManager)
        }
    }
    
    private func generateSummary() async {
        isGeneratingSummary = true
        let aiService = RealAIService()
        
        do {
            entrySummary = try await aiService.summarizeText(entry.content)
        } catch {
            entrySummary = "Unable to generate summary"
        }
        
        isGeneratingSummary = false
    }
}

// MARK: - Stat Item
struct StatItem: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Edit Entry View
struct EditEntryView: View {
    let entry: JournalEntry
    @EnvironmentObject var journalManager: JournalManager
    @Environment(\.dismiss) private var dismiss
    
    @State private var title: String
    @State private var content: String
    @State private var selectedMood: Mood
    @State private var tags: [String]
    @State private var newTag = ""
    
    init(entry: JournalEntry) {
        self.entry = entry
        self._title = State(initialValue: entry.title)
        self._content = State(initialValue: entry.content)
        self._selectedMood = State(initialValue: entry.mood)
        self._tags = State(initialValue: entry.tags)
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                journalManager.settings.theme.gradient
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Title Input
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Title")
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            TextField("Title", text: $title)
                                .textFieldStyle(PlainTextFieldStyle())
                                .foregroundColor(.white)
                                .padding()
                                .background( in: RoundedRectangle(cornerRadius: 12))
                        }
                        
                        // Mood Selector
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Mood")
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
                                    ForEach(Mood.allCases, id: \.self) { mood in
                                        Button(action: {
                                            selectedMood = mood
                                        }) {
                                            VStack(spacing: 4) {
                                                Text(mood.emoji)
                                                    .font(.title)
                                                
                                                Text(mood.rawValue.capitalized)
                                                    .font(.caption)
                                                    .foregroundColor(.white.opacity(0.8))
                                            }
                                            .padding()
                                            .background(
                                                selectedMood == mood ? .white.opacity(0.3) : .red.opacity(0.1),
                                                in: RoundedRectangle(cornerRadius: 12)
                                            )
                                        }
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                        
                        // Content Input
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Content")
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            ZStack(alignment: .topLeading) {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill()
                                    .frame(minHeight: 200)
                                
                                TextEditor(text: $content)
                                    .scrollContentBackground(.hidden)
                                    .background(.clear)
                                    .foregroundColor(.white)
                                    .padding()
                            }
                        }
                        
                        // Tags Input
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Tags")
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            HStack {
                                TextField("Add tag", text: $newTag)
                                    .textFieldStyle(PlainTextFieldStyle())
                                    .foregroundColor(.white)
                                    .onSubmit {
                                        addTag()
                                    }
                                
                                Button("Add") {
                                    addTag()
                                }
                                .foregroundColor(.white)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background( in: RoundedRectangle(cornerRadius: 8))
                            }
                            .padding()
                            .background( in: RoundedRectangle(cornerRadius: 12))
                            
                            if !tags.isEmpty {
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack {
                                        ForEach(tags, id: \.self) { tag in
                                            HStack {
                                                Text("#\(tag)")
                                                    .font(.caption)
                                                    .foregroundColor(.white)
                                                
                                                Button(action: {
                                                    tags.removeAll { $0 == tag }
                                                }) {
                                                    Image(systemName: "xmark")
                                                        .font(.caption2)
                                                        .foregroundColor(.white.opacity(0.6))
                                                }
                                            }
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background( in: RoundedRectangle(cornerRadius: 8))
                                        }
                                    }
                                    .padding(.horizontal)
                                }
                            }
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Edit Entry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveChanges()
                    }
                    .foregroundColor(.white)
                }
            }
        }
    }
    
    private func addTag() {
        let trimmedTag = newTag.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedTag.isEmpty && !tags.contains(trimmedTag) {
            tags.append(trimmedTag)
            newTag = ""
        }
    }
    
    private func saveChanges() {
        var updatedEntry = entry
        updatedEntry.title = title
        updatedEntry.content = content
        updatedEntry.mood = selectedMood
        updatedEntry.tags = tags
        
        journalManager.updateEntry(updatedEntry)
        dismiss()
    }
}

