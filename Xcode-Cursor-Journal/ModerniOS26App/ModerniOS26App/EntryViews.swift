import SwiftUI

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
                            Text("How are you feeling?")
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
                            Text("What's on your mind?")
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            ZStack(alignment: .topLeading) {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill()
                                    .frame(minHeight: 200)
                                
                                if content.isEmpty {
                                    Text("Write your thoughts here...")
                                        .foregroundColor(.white.opacity(0.6))
                                        .padding()
                                }
                                
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
                                TextField("Add a tag...", text: $newTag)
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
                        
                        // AI Insights Button
                        if journalManager.settings.enableAIInsights {
                            Button(action: {
                                generateInsights()
                            }) {
                                HStack {
                                    if isGeneratingInsights {
                                        ProgressView()
                                            .scaleEffect(0.8)
                                            .tint(.white)
                                    } else {
                                        Image(systemName: "brain.head.profile")
                                    }
                                    
                                    Text(isGeneratingInsights ? "Generating Insights..." : "Generate AI Insights")
                                        .fontWeight(.medium)
                                }
                                .foregroundColor(.white)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background( in: RoundedRectangle(cornerRadius: 12))
                            }
                            .disabled(isGeneratingInsights || content.isEmpty)
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

