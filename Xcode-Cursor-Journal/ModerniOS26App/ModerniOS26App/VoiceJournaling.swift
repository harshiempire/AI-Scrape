import SwiftUI
import Foundation
import Speech
import AVFoundation

// MARK: - Voice Journaling Service
@available(iOS 18.0, *)
@MainActor
class VoiceJournalingService: ObservableObject {
    @Published var isRecording = false
    @Published var isTranscribing = false
    @Published var transcribedText = ""
    @Published var detectedEmotion: AIInsights.Sentiment = .neutral
    @Published var confidence: Double = 0.0
    @Published var recordingDuration: TimeInterval = 0
    @Published var errorMessage: String?
    @Published var voiceEntries: [VoiceEntry] = []
    
    private var audioEngine = AVAudioEngine()
    private var speechRecognizer = SFSpeechRecognizer()
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var audioRecorder: AVAudioRecorder?
    private var recordingTimer: Timer?
    private var audioData: Data?
    
    private let aiService = RealAIService()
    
    init() {
        requestSpeechPermission()
    }
    
    // MARK: - Recording Control
    func startRecording() {
        guard !isRecording else { return }
        
        // Request microphone permission
        AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
            DispatchQueue.main.async {
                if granted {
                    self?.beginRecording()
                } else {
                    self?.errorMessage = "Microphone permission denied"
                }
            }
        }
    }
    
    func stopRecording() {
        guard isRecording else { return }
        
        isRecording = false
        recordingTimer?.invalidate()
        recordingTimer = nil
        
        audioEngine.stop()
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        
        audioRecorder?.stop()
        
        // Analyze the recorded audio
        analyzeRecording()
    }
    
    // MARK: - Voice Entry Management
    func saveVoiceEntry() -> VoiceEntry? {
        guard !transcribedText.isEmpty, let audioData = audioData else { return nil }
        
        let voiceEntry = VoiceEntry(
            id: UUID(),
            audioData: audioData,
            transcription: transcribedText,
            detectedEmotion: detectedEmotion,
            confidence: confidence,
            duration: recordingDuration,
            createdAt: Date(),
            convertedToEntry: false,
            relatedEntryId: nil
        )
        
        voiceEntries.append(voiceEntry)
        saveVoiceEntries()
        
        return voiceEntry
    }
    
    func convertToJournalEntry(_ voiceEntry: VoiceEntry) -> JournalEntry {
        let entry = JournalEntry(
            title: generateTitle(from: voiceEntry.transcription),
            content: voiceEntry.transcription,
            mood: moodFromSentiment(voiceEntry.detectedEmotion)
        )
        
        // Update voice entry
        if let index = voiceEntries.firstIndex(where: { $0.id == voiceEntry.id }) {
            voiceEntries[index] = VoiceEntry(
                id: voiceEntry.id,
                audioData: voiceEntry.audioData,
                transcription: voiceEntry.transcription,
                detectedEmotion: voiceEntry.detectedEmotion,
                confidence: voiceEntry.confidence,
                duration: voiceEntry.duration,
                createdAt: voiceEntry.createdAt,
                convertedToEntry: true,
                relatedEntryId: entry.id
            )
        }
        
        saveVoiceEntries()
        return entry
    }
    
    func deleteVoiceEntry(_ voiceEntry: VoiceEntry) {
        voiceEntries.removeAll { $0.id == voiceEntry.id }
        saveVoiceEntries()
    }
    
    // MARK: - Private Methods
    private func requestSpeechPermission() {
        SFSpeechRecognizer.requestAuthorization { [weak self] authStatus in
            DispatchQueue.main.async {
                switch authStatus {
                case .authorized:
                    break
                case .denied, .restricted:
                    self?.errorMessage = "Speech recognition permission denied"
                case .notDetermined:
                    self?.errorMessage = "Speech recognition permission not determined"
                @unknown default:
                    self?.errorMessage = "Unknown speech recognition permission status"
                }
            }
        }
    }
    
    private func beginRecording() {
        do {
            // Configure audio session
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
            
            // Create recognition request
            recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
            guard let recognitionRequest = recognitionRequest else {
                errorMessage = "Unable to create recognition request"
                return
            }
            
            recognitionRequest.shouldReportPartialResults = true
            
            // Create recognition task
            recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
                DispatchQueue.main.async {
                    if let result = result {
                        self?.transcribedText = result.bestTranscription.formattedString
                        self?.confidence = Double(result.bestTranscription.averageConfidence)
                    }
                    
                    if let error = error {
                        self?.errorMessage = "Recognition error: \(error.localizedDescription)"
                    }
                }
            }
            
            // Configure audio engine
            let inputNode = audioEngine.inputNode
            let recordingFormat = inputNode.outputFormat(forBus: 0)
            
            inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
                recognitionRequest.append(buffer)
            }
            
            audioEngine.prepare()
            try audioEngine.start()
            
            // Start recording timer
            recordingDuration = 0
            recordingTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
                self?.recordingDuration += 0.1
            }
            
            isRecording = true
            errorMessage = nil
            
        } catch {
            errorMessage = "Recording failed: \(error.localizedDescription)"
        }
    }
    
    private func analyzeRecording() {
        guard !transcribedText.isEmpty else { return }
        
        isTranscribing = true
        
        Task {
            // Analyze sentiment
            detectedEmotion = aiService.analyzeSentiment(text: transcribedText)
            
            // Calculate confidence based on transcription confidence and text quality
            let textQuality = min(1.0, Double(transcribedText.count) / 100.0)
            confidence = (confidence + textQuality) / 2.0
            
            isTranscribing = false
        }
    }
    
    private func generateTitle(from text: String) -> String {
        let sentences = text.components(separatedBy: CharacterSet(charactersIn: ".!?"))
        let firstSentence = sentences.first?.trimmingCharacters(in: .whitespaces) ?? ""
        
        if firstSentence.count > 50 {
            return String(firstSentence.prefix(47)) + "..."
        } else {
            return firstSentence.isEmpty ? "Voice Entry" : firstSentence
        }
    }
    
    private func moodFromSentiment(_ sentiment: AIInsights.Sentiment) -> Mood {
        switch sentiment {
        case .positive: return .happy
        case .negative: return .sad
        case .mixed: return .anxious
        case .neutral: return .neutral
        }
    }
    
    private func saveVoiceEntries() {
        if let encoded = try? JSONEncoder().encode(voiceEntries) {
            UserDefaults.standard.set(encoded, forKey: "VoiceEntries")
        }
    }
    
    private func loadVoiceEntries() {
        if let data = UserDefaults.standard.data(forKey: "VoiceEntries"),
           let decoded = try? JSONDecoder().decode([VoiceEntry].self, from: data) {
            voiceEntries = decoded
        }
    }
}

// MARK: - Voice Recording View
@available(iOS 18.0, *)
struct VoiceRecordingView: View {
    @StateObject private var voiceService = VoiceJournalingService()
    @Environment(\.dismiss) private var dismiss
    
    @State private var showingConvertOption = false
    @State private var selectedVoiceEntry: VoiceEntry?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Recording status
                recordingStatusView
                
                // Transcribed text
                if !voiceService.transcribedText.isEmpty {
                    transcribedTextView
                }
                
                // Voice entries list
                if !voiceService.voiceEntries.isEmpty {
                    voiceEntriesListView
                }
                
                Spacer()
                
                // Recording controls
                recordingControlsView
            }
            .padding()
            .background(
                LinearGradient(
                    colors: [.blue.opacity(0.1), .purple.opacity(0.1)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .navigationTitle("Voice Journal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    if !voiceService.transcribedText.isEmpty {
                        Button("Save") {
                            if let voiceEntry = voiceService.saveVoiceEntry() {
                                selectedVoiceEntry = voiceEntry
                                showingConvertOption = true
                            }
                        }
                    }
                }
            }
            .alert("Convert to Journal Entry?", isPresented: $showingConvertOption) {
                Button("Convert") {
                    if let voiceEntry = selectedVoiceEntry {
                        // Convert to journal entry
                        let entry = voiceService.convertToJournalEntry(voiceEntry)
                        // Here you would add the entry to JournalManager
                        dismiss()
                    }
                }
                Button("Save as Voice Note") {
                    dismiss()
                }
                Button("Cancel", role: .cancel) { }
            } message: {
                Text("Would you like to convert this voice note to a journal entry or save it as a voice note?")
            }
        }
        .onAppear {
            voiceService.loadVoiceEntries()
        }
    }
    
    private var recordingStatusView: some View {
        VStack(spacing: 16) {
            // Recording indicator
            ZStack {
                Circle()
                    .fill(voiceService.isRecording ? .red : .gray)
                    .frame(width: 80, height: 80)
                    .scaleEffect(voiceService.isRecording ? 1.2 : 1.0)
                    .animation(.easeInOut(duration: 0.5).repeatForever(autoreverses: true), value: voiceService.isRecording)
                
                Image(systemName: voiceService.isRecording ? "mic.fill" : "mic")
                    .font(.title)
                    .foregroundColor(.white)
            }
            
            // Status text
            VStack(spacing: 4) {
                Text(voiceService.isRecording ? "Recording..." : "Tap to start recording")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                if voiceService.isRecording {
                    Text(formatDuration(voiceService.recordingDuration))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Emotion indicator
            if voiceService.isTranscribing {
                HStack {
                    ProgressView()
                        .scaleEffect(0.8)
                    
                    Text("Analyzing...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            } else if !voiceService.transcribedText.isEmpty {
                HStack {
                    Image(systemName: emotionIcon(voiceService.detectedEmotion))
                        .foregroundColor(emotionColor(voiceService.detectedEmotion))
                    
                    Text(voiceService.detectedEmotion.rawValue.capitalized)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("(\(Int(voiceService.confidence * 100))%)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    private var transcribedTextView: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Transcription")
                .font(.headline)
                .foregroundColor(.primary)
            
            ScrollView {
                Text(voiceService.transcribedText)
                    .font(.body)
                    .foregroundColor(.primary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(maxHeight: 200)
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(.gray.opacity(0.1))
            )
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    private var voiceEntriesListView: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Voice Notes")
                .font(.headline)
                .foregroundColor(.primary)
            
            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(voiceService.voiceEntries, id: \.id) { entry in
                        VoiceEntryRow(entry: entry, voiceService: voiceService)
                    }
                }
            }
            .frame(maxHeight: 200)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    private var recordingControlsView: some View {
        HStack(spacing: 24) {
            Button(action: {
                if voiceService.isRecording {
                    voiceService.stopRecording()
                } else {
                    voiceService.startRecording()
                }
            }) {
                Image(systemName: voiceService.isRecording ? "stop.fill" : "mic.fill")
                    .font(.title2)
                    .foregroundColor(.white)
                    .frame(width: 60, height: 60)
                    .background(
                        Circle()
                            .fill(voiceService.isRecording ? .red : .blue)
                    )
            }
            .disabled(voiceService.isTranscribing)
        }
        .padding()
    }
    
    private func formatDuration(_ duration: TimeInterval) -> String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
    
    private func emotionIcon(_ sentiment: AIInsights.Sentiment) -> String {
        switch sentiment {
        case .positive: return "face.smiling"
        case .negative: return "face.dashed"
        case .mixed: return "face.dashed.fill"
        case .neutral: return "minus.circle"
        }
    }
    
    private func emotionColor(_ sentiment: AIInsights.Sentiment) -> Color {
        switch sentiment {
        case .positive: return .green
        case .negative: return .red
        case .mixed: return .orange
        case .neutral: return .gray
        }
    }
}

// MARK: - Voice Entry Row
struct VoiceEntryRow: View {
    let entry: VoiceEntry
    let voiceService: VoiceJournalingService
    
    var body: some View {
        HStack(spacing: 12) {
            // Play button
            Button(action: {
                // Play audio
            }) {
                Image(systemName: "play.circle.fill")
                    .font(.title2)
                    .foregroundColor(.blue)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.transcription)
                    .font(.caption)
                    .foregroundColor(.primary)
                    .lineLimit(2)
                
                HStack {
                    Text(formatDuration(entry.duration))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text(entry.detectedEmotion.rawValue.capitalized)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    if entry.convertedToEntry {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.caption2)
                            .foregroundColor(.green)
                    }
                }
            }
            
            Spacer()
            
            // Convert button
            if !entry.convertedToEntry {
                Button(action: {
                    let journalEntry = voiceService.convertToJournalEntry(entry)
                    // Add to journal manager
                }) {
                    Image(systemName: "arrow.right.circle")
                        .font(.title2)
                        .foregroundColor(.blue)
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.gray.opacity(0.1))
        )
    }
    
    private func formatDuration(_ duration: TimeInterval) -> String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
}

#Preview {
    VoiceRecordingView()
}
