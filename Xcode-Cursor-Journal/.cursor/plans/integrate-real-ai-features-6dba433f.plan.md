<!-- 6dba433f-c368-4deb-a715-32fecabdc17b e2bc3b9e-02cd-4879-b9ad-eac14bcbf085 -->
# Dynamic Real-Time AI Features for Journal App

## Overview

Transform static AI features into dynamic, real-time capabilities that respond as users write. Implement live sentiment analysis, automatic mood detection, AI-suggested tags, and a refresh button for on-demand updates.

## Implementation Steps

### 1. Add Real-Time AI State Management to NewEntryView

**File: `ModerniOS26App/ModerniOS26App/EntryViews.swift`**

Add state variables for dynamic AI features (around line 8-14):

```swift
@State private var content = ""
@State private var selectedMood: Mood = .neutral
@State private var tags: [String] = []
@State private var newTag = ""

// New dynamic AI states
@State private var aiService = RealAIService()
@State private var detectedSentiment: AIInsights.Sentiment = .neutral
@State private var suggestedMood: Mood?
@State private var suggestedTags: [String] = []
@State private var isAnalyzing = false
@State private var showMoodSuggestion = false
```

### 2. Implement Debounced Content Analysis

Add a debounced analysis function that triggers when user pauses typing:

```swift
private func analyzeContentDebounced() {
    // Cancel previous work item
    NSObject.cancelPreviousPerformRequests(withTarget: self)
    
    // Schedule new analysis after 1 second delay
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
        Task {
            await analyzeContent()
        }
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
```

### 3. Update TextEditor with onChange Modifier

Modify the content TextEditor to trigger analysis on text changes (around line 82):

```swift
TextEditor(text: $content)
    .scrollContentBackground(.hidden)
    .background(.clear)
    .foregroundColor(.black)
    .font(.body)
    .padding()
    .onChange(of: content) { oldValue, newValue in
        analyzeContentDebounced()
    }
```

### 4. Add Mood Suggestion Banner

Add a suggestion banner above the mood picker when AI detects different mood (around line 38):

```swift
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
        // existing mood picker code
    }
}
```

### 5. Add AI-Suggested Tags Section

Add suggested tags display below the tag input (around line 120):

```swift
// Tags display
if !tags.isEmpty {
    ScrollView(.horizontal, showsIndicators: false) {
        HStack(spacing: 8) {
            ForEach(tags, id: \.self) { tag in
                // existing tag display code
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
                .foregroundColor(.white.opacity(0.8))
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
                                .foregroundColor(.white)
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(
                            Capsule()
                                .fill(.blue.opacity(0.2))
                                .overlay(
                                    Capsule()
                                        .stroke(.blue.opacity(0.4), lineWidth: 1)
                                )
                        )
                    }
                }
            }
            .padding(.horizontal)
        }
    }
}
```

### 6. Add Refresh Insights Button

Add a refresh button to manually trigger AI analysis (around line 157):

```swift
// AI Insights Button
if journalManager.settings.enableAIInsights {
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
}
```

### 7. Add Sentiment Indicator in Content Area

Add a subtle sentiment indicator in the content input area (around line 76):

```swift
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
                    .foregroundColor(.gray)
                
                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(.white.opacity(0.5))
        }
        
        TextEditor(text: $content)
            // existing TextEditor code
    }
}

// Helper functions
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
```

### 8. Optimize Performance with Task Cancellation

Add proper task cancellation to prevent memory leaks:

```swift
@State private var analysisTask: Task<Void, Never>?

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
```

## Key Features

1. **Real-time sentiment analysis** - Updates as user types (with 1-second debounce)
2. **Automatic mood suggestions** - AI suggests mood based on detected sentiment with apply/dismiss options
3. **Dynamic tag suggestions** - AI extracts topics and suggests relevant tags users can add with one tap
4. **Refresh button** - Manual trigger for on-demand AI analysis
5. **Visual feedback** - Sentiment indicator, loading states, and smooth animations
6. **Performance optimized** - Debouncing and task cancellation prevent excessive processing

## Benefits

- More engaging and interactive writing experience
- Reduces manual effort in mood selection and tagging
- Provides real-time feedback on emotional tone
- Maintains user control with suggestions rather than forced changes
- Optimized for performance with debouncing and cancellation

### To-dos

- [ ] Create RealAIService class with Natural Language framework for sentiment analysis and topic extraction
- [ ] Update JournalManager.generateAIInsights to use real AI instead of simulated features
- [ ] Add text summarization feature using FoundationModels framework with fallback
- [ ] Implement availability checks and fallback mechanisms for when AI features are unavailable
- [ ] Add AI capabilities status indicator in settings view
- [ ] Test all AI features with real journal entries and verify accuracy