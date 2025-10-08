import SwiftUI

// MARK: - Journal Home View
struct JournalHomeView: View {
    @EnvironmentObject var journalManager: JournalManager
    @State private var isAnimating = false
    @State private var showingNewEntry = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // Liquid Glass Background
                journalManager.settings.theme.gradient
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 30) {
                        // Welcome Header with Liquid Glass Effect
                        VStack(spacing: 16) {
                            Text("My Journal")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            
                            Text("Capture your thoughts and experiences")
                                .font(.title3)
                                .foregroundColor(.white.opacity(0.8))
                                .multilineTextAlignment(.center)
                            
                            // Streak Counter
                            HStack {
                                Image(systemName: "flame.fill")
                                    .foregroundColor(.orange)
                                Text("\(journalManager.stats.streakDays) day streak")
                                    .font(.headline)
                                    .foregroundColor(.white)
                            }
                        }
                        .padding()
                        .background(in: RoundedRectangle(cornerRadius: 20))
                        .scaleEffect(isAnimating ? 1.02 : 1.0)
                        .animation(.easeInOut(duration: 2).repeatForever(autoreverses: true), value: isAnimating)
                        
                        // Quick Stats Cards
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 20) {
                            StatCard(
                                icon: "book.fill",
                                title: "Entries",
                                value: "\(journalManager.stats.totalEntries)",
                                color: .blue
                            )
                            
                            StatCard(
                                icon: "heart.fill",
                                title: "Favorites",
                                value: "\(journalManager.stats.favoriteEntries)",
                                color: .pink
                            )
                            
                            StatCard(
                                icon: "textformat",
                                title: "Words",
                                value: "\(journalManager.stats.totalWords)",
                                color: .green
                            )
                            
                            StatCard(
                                icon: journalManager.stats.mostUsedMood.emoji,
                                title: "Mood",
                                value: journalManager.stats.mostUsedMood.rawValue.capitalized,
                                color: journalManager.stats.mostUsedMood.color
                            )
                        }
                        
                        // New Entry Button
                        Button(action: {
                            showingNewEntry = true
                        }) {
                            HStack {
                                Image(systemName: "plus.circle.fill")
                                    .font(.title2)
                                Text("Write New Entry")
                                    .font(.headline)
                                    .fontWeight(.medium)
                            }
                            .foregroundColor(.white)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background( in: RoundedRectangle(cornerRadius: 16))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(.white.opacity(0.3), lineWidth: 1)
                            )
                        }
                        
                        // Recent Entries Preview
                        if !journalManager.entries.isEmpty {
                            VStack(alignment: .leading, spacing: 16) {
                                Text("Recent Entries")
                                    .font(.title2)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                                
                                ForEach(journalManager.entries.prefix(3)) { entry in
                                    EntryPreviewCard(entry: entry)
                                }
                            }
                            .padding()
                            .background(in: RoundedRectangle(cornerRadius: 20))
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Journal")
            .navigationBarTitleDisplayMode(.inline)
        }
        .onAppear {
            isAnimating = true
        }
        .sheet(isPresented: $showingNewEntry) {
            NewEntryView()
                .environmentObject(journalManager)
        }
    }
}

// MARK: - Stat Card
struct StatCard: View {
    let icon: String
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))
        }
        .padding()
        .frame(maxWidth: .infinity, minHeight: 100)
        .background( in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Entry Preview Card
struct EntryPreviewCard: View {
    let entry: JournalEntry
    @EnvironmentObject var journalManager: JournalManager
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(entry.title.isEmpty ? "Untitled" : entry.title)
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Text(entry.mood.emoji)
                        .font(.title2)
                }
                
                Text(entry.content.prefix(100) + (entry.content.count > 100 ? "..." : ""))
                    .font(.body)
                    .foregroundColor(.white.opacity(0.8))
                    .lineLimit(2)
                
                HStack {
                    Text(entry.date, style: .date)
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                    
                    Spacer()
                    
                    if entry.isFavorite {
                        Image(systemName: "heart.fill")
                            .foregroundColor(.pink)
                            .font(.caption)
                    }
                }
            }
            
            Button(action: {
                journalManager.toggleFavorite(entry)
            }) {
                Image(systemName: entry.isFavorite ? "heart.fill" : "heart")
                    .foregroundColor(entry.isFavorite ? .pink : .white.opacity(0.6))
            }
        }
        .padding()
        .background(in: RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Entries List View
struct EntriesListView: View {
    @EnvironmentObject var journalManager: JournalManager
    @State private var showingNewEntry = false
    @State private var selectedEntry: JournalEntry?
    
    var body: some View {
        NavigationView {
            ZStack {
                journalManager.settings.theme.gradient
                    .ignoresSafeArea()
                
                VStack {
                    // Search and Filter Bar
                    VStack(spacing: 16) {
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(.white.opacity(0.6))
                            
                            TextField("Search entries...", text: $journalManager.searchText)
                                .textFieldStyle(PlainTextFieldStyle())
                                .foregroundColor(.white)
                        }
                        .padding()
                        .background(in: RoundedRectangle(cornerRadius: 12))
                        
                        // Filter Options
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                FilterButton(
                                    title: "All",
                                    isSelected: journalManager.selectedMood == nil
                                ) {
                                    journalManager.selectedMood = nil
                                }
                                
                                ForEach(Mood.allCases, id: \.self) { mood in
                                    FilterButton(
                                        title: mood.emoji + " " + mood.rawValue.capitalized,
                                        isSelected: journalManager.selectedMood == mood
                                    ) {
                                        journalManager.selectedMood = journalManager.selectedMood == mood ? nil : mood
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding()
                    
                    // Entries List
                    if journalManager.filteredEntries.isEmpty {
                        VStack(spacing: 16) {
                            Image(systemName: "book.closed")
                                .font(.system(size: 50))
                                .foregroundColor(.white.opacity(0.6))
                            
                            Text("No entries found")
                                .font(.title2)
                                .foregroundColor(.white.opacity(0.8))
                            
                            Text("Start writing your first journal entry!")
                                .font(.body)
                                .foregroundColor(.white.opacity(0.6))
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 16) {
                                ForEach(journalManager.filteredEntries) { entry in
                                    EntryCard(entry: entry) {
                                        selectedEntry = entry
                                    }
                                }
                            }
                            .padding()
                        }
                    }
                }
            }
            .navigationTitle("Entries")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        showingNewEntry = true
                    }) {
                        Image(systemName: "plus")
                            .foregroundColor(.white)
                    }
                }
            }
        }
        .sheet(isPresented: $showingNewEntry) {
            NewEntryView()
                .environmentObject(journalManager)
        }
        .sheet(item: $selectedEntry) { entry in
            EntryDetailView(entry: entry)
                .environmentObject(journalManager)
        }
    }
}

// MARK: - Filter Button
struct FilterButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? .black : .white)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    isSelected ? .white : .black,
                    in: RoundedRectangle(cornerRadius: 16)
                )
        }
    }
}

// MARK: - Entry Card
struct EntryCard: View {
    let entry: JournalEntry
    let onTap: () -> Void
    @EnvironmentObject var journalManager: JournalManager
    
    var body: some View {
        Button { onTap() } label: {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(entry.title.isEmpty ? "Untitled" : entry.title)
                            .font(.headline)
                            .foregroundColor(.white)
                            .lineLimit(1)
                        
                        Text(entry.date, style: .date)
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.6))
                    }
                    
                    Spacer()
                    
                    VStack {
                        Text(entry.mood.emoji)
                            .font(.title2)
                        
                        if entry.isFavorite {
                            Image(systemName: "heart.fill")
                                .foregroundColor(.pink)
                                .font(.caption)
                        }
                    }
                }
                
                Text(entry.content)
                    .font(.body)
                    .foregroundColor(.white.opacity(0.8))
                    .lineLimit(3)
                
                if !entry.tags.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack {
                            ForEach(entry.tags, id: \.self) { tag in
                                Text("#\(tag)")
                                    .font(.caption)
                                    .foregroundColor(.white.opacity(0.7))
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background( in: RoundedRectangle(cornerRadius: 8))
                            }
                        }
                    }
                }
                
                HStack {
                    Text("\(entry.wordCount) words")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                    
                    Spacer()
                    
                    if let insights = entry.aiInsights {
                        HStack(spacing: 4) {
                            Image(systemName: "brain.head.profile")
                                .font(.caption)
                            Text(insights.sentiment.rawValue.capitalized)
                                .font(.caption)
                        }
                        .foregroundColor(.white.opacity(0.6))
                    }
                }
            }
            .padding()
            .background( in: RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Stats View
struct StatsView: View {
    @EnvironmentObject var journalManager: JournalManager
    
    var body: some View {
        NavigationView {
            ZStack {
                journalManager.settings.theme.gradient
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 30) {
                        // Overall Stats
                        VStack(spacing: 20) {
                            Text("Your Journal Stats")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            
                            LazyVGrid(columns: [
                                GridItem(.flexible()),
                                GridItem(.flexible())
                            ], spacing: 16) {
                                StatCard(
                                    icon: "book.fill",
                                    title: "Total Entries",
                                    value: "\(journalManager.stats.totalEntries)",
                                    color: .blue
                                )
                                
                                StatCard(
                                    icon: "textformat",
                                    title: "Total Words",
                                    value: "\(journalManager.stats.totalWords)",
                                    color: .green
                                )
                                
                                StatCard(
                                    icon: "flame.fill",
                                    title: "Day Streak",
                                    value: "\(journalManager.stats.streakDays)",
                                    color: .orange
                                )
                                
                                StatCard(
                                    icon: "heart.fill",
                                    title: "Favorites",
                                    value: "\(journalManager.stats.favoriteEntries)",
                                    color: .pink
                                )
                            }
                        }
                        .padding()
                        .background( in: RoundedRectangle(cornerRadius: 20))
                        
                        // Mood Distribution
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Mood Distribution")
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            
                            ForEach(Mood.allCases, id: \.self) { mood in
                                let count = journalManager.entries.filter { $0.mood == mood }.count
                                let percentage = journalManager.stats.totalEntries > 0 ? Double(count) / Double(journalManager.stats.totalEntries) : 0
                                
                                HStack {
                                    Text(mood.emoji)
                                        .font(.title2)
                                    
                                    Text(mood.rawValue.capitalized)
                                        .font(.body)
                                        .foregroundColor(.white)
                                    
                                    Spacer()
                                    
                                    Text("\(count)")
                                        .font(.body)
                                        .foregroundColor(.white.opacity(0.8))
                                }
                                .padding(.vertical, 4)
                            }
                        }
                        .padding()
                        .background(in: RoundedRectangle(cornerRadius: 20))
                        
                        // Monthly Activity
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Monthly Activity")
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            
                            HStack {
                                ForEach(0..<12, id: \.self) { month in
                                    VStack {
                                        Rectangle()
                                            .fill(.white.opacity(0.6))
                                            .frame(width: 20, height: CGFloat(journalManager.stats.monthlyEntries[month] * 10 + 20))
                                            .cornerRadius(4)
                                        
                                        Text(Calendar.current.shortMonthSymbols[month])
                                            .font(.caption2)
                                            .foregroundColor(.white.opacity(0.8))
                                    }
                                }
                            }
                        }
                        .padding()
                        .background( in: RoundedRectangle(cornerRadius: 20))
                    }
                    .padding()
                }
            }
            .navigationTitle("Statistics")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}


