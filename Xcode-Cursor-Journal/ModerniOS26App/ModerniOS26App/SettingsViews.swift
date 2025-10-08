import SwiftUI

// MARK: - Settings View
struct SettingsView: View {
    @EnvironmentObject var journalManager: JournalManager
    @State private var showingThemePicker = false
    @State private var showingExportSheet = false
    @State private var showingImportSheet = false
    
    var body: some View {
        NavigationView {
            ZStack {
                journalManager.settings.theme.gradient
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 20) {
                        // App Info Card
                        VStack(spacing: 16) {
                            Image(systemName: "book.fill")
                                .font(.system(size: 50))
                                .foregroundColor(.white)
                            
                            Text("Modern Journal")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            
                            Text("Version 1.0.0")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.7))
                            
                            Text("Built with iOS 26 & Swift 6")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.7))
                        }
                        .padding()
                        .background( in: RoundedRectangle(cornerRadius: 20))
                        
                        // Journal Settings
                        VStack(spacing: 16) {
                            Text("Journal Settings")
                                .font(.headline)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            
                            SettingsRow(
                                icon: "brain.head.profile",
                                title: "AI Insights",
                                isOn: Binding(
                                    get: { journalManager.settings.enableAIInsights },
                                    set: { newValue in
                                        var settings = journalManager.settings
                                        settings.enableAIInsights = newValue
                                        journalManager.updateSettings(settings)
                                    }
                                )
                            )
                            
                            SettingsRow(
                                icon: "waveform",
                                title: "Voice Notes",
                                isOn: Binding(
                                    get: { journalManager.settings.enableVoiceNotes },
                                    set: { newValue in
                                        var settings = journalManager.settings
                                        settings.enableVoiceNotes = newValue
                                        journalManager.updateSettings(settings)
                                    }
                                )
                            )
                            
                            SettingsRow(
                                icon: "location.fill",
                                title: "Location Tracking",
                                isOn: Binding(
                                    get: { journalManager.settings.enableLocationTracking },
                                    set: { newValue in
                                        var settings = journalManager.settings
                                        settings.enableLocationTracking = newValue
                                        journalManager.updateSettings(settings)
                                    }
                                )
                            )
                            
                            SettingsRow(
                                icon: "cloud.fill",
                                title: "Weather Tracking",
                                isOn: Binding(
                                    get: { journalManager.settings.enableWeatherTracking },
                                    set: { newValue in
                                        var settings = journalManager.settings
                                        settings.enableWeatherTracking = newValue
                                        journalManager.updateSettings(settings)
                                    }
                                )
                            )
                            
                            SettingsRow(
                                icon: "bell.fill",
                                title: "Daily Reminders",
                                isOn: Binding(
                                    get: { journalManager.settings.enableReminders },
                                    set: { newValue in
                                        var settings = journalManager.settings
                                        settings.enableReminders = newValue
                                        journalManager.updateSettings(settings)
                                    }
                                )
                            )
                        }
                        .padding()
                        .background(in: RoundedRectangle(cornerRadius: 20))
                        
                        // Theme Selection
                        VStack(spacing: 16) {
                            Text("Appearance")
                                .font(.headline)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            
                            Button(action: {
                                showingThemePicker = true
                            }) {
                                HStack {
                                    Image(systemName: "paintbrush.fill")
                                        .foregroundColor(.white)
                                    
                                    Text("Theme: \(journalManager.settings.theme.rawValue)")
                                        .foregroundColor(.white)
                                    
                                    Spacer()
                                    
                                    Image(systemName: "chevron.right")
                                        .foregroundColor(.white.opacity(0.6))
                                }
                                .padding()
                                .background( in: RoundedRectangle(cornerRadius: 12))
                            }
                        }
                        .padding()
                        .background( in: RoundedRectangle(cornerRadius: 20))
                        
                        // Data Management
                        VStack(spacing: 16) {
                            Text("Data Management")
                                .font(.headline)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            
                            Button(action: {
                                showingExportSheet = true
                            }) {
                                HStack {
                                    Image(systemName: "square.and.arrow.up")
                                        .foregroundColor(.white)
                                    
                                    Text("Export Journal")
                                        .foregroundColor(.white)
                                    
                                    Spacer()
                                }
                                .padding()
                                .background( in: RoundedRectangle(cornerRadius: 12))
                            }
                            
                            Button(action: {
                                showingImportSheet = true
                            }) {
                                HStack {
                                    Image(systemName: "square.and.arrow.down")
                                        .foregroundColor(.white)
                                    
                                    Text("Import Journal")
                                        .foregroundColor(.white)
                                    
                                    Spacer()
                                }
                                .padding()
                                .background( in: RoundedRectangle(cornerRadius: 12))
                            }
                        }
                        .padding()
                        .background( in: RoundedRectangle(cornerRadius: 20))
                        
                        // About Section
                        VStack(spacing: 12) {
                            Text("About Modern Journal")
                                .font(.headline)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            
                            Text("A beautiful, AI-powered journaling app built with iOS 26. Capture your thoughts, track your mood, and gain insights into your writing patterns with advanced AI analysis.")
                                .font(.body)
                                .foregroundColor(.white.opacity(0.8))
                                .multilineTextAlignment(.center)
                        }
                        .padding()
                        .background( in: RoundedRectangle(cornerRadius: 20))
                    }
                    .padding()
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
        }
        .sheet(isPresented: $showingThemePicker) {
            ThemePickerView()
                .environmentObject(journalManager)
        }
        .sheet(isPresented: $showingExportSheet) {
            ExportView()
                .environmentObject(journalManager)
        }
        .sheet(isPresented: $showingImportSheet) {
            ImportView()
                .environmentObject(journalManager)
        }
    }
}

// MARK: - Settings Row
struct SettingsRow: View {
    let icon: String
    let title: String
    @Binding var isOn: Bool
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.white)
                .frame(width: 24)
            
            Text(title)
                .font(.body)
                .foregroundColor(.white)
            
            Spacer()
            
            Toggle("", isOn: $isOn)
                .toggleStyle(SwitchToggleStyle(tint: .cyan))
        }
    }
}

// MARK: - Theme Picker View
struct ThemePickerView: View {
    @EnvironmentObject var journalManager: JournalManager
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ZStack {
                journalManager.settings.theme.gradient
                    .ignoresSafeArea()
                
                ScrollView {
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 20) {
                        ForEach(JournalTheme.allCases, id: \.self) { theme in
                            ThemeCard(
                                theme: theme,
                                isSelected: journalManager.settings.theme == theme
                            ) {
                                var settings = journalManager.settings
                                settings.theme = theme
                                journalManager.updateSettings(settings)
                                dismiss()
                            }
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Choose Theme")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
        }
    }
}

// MARK: - Theme Card
struct ThemeCard: View {
    let theme: JournalTheme
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 12)
                    .fill(theme.gradient)
                    .frame(height: 80)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(isSelected ? .white : .clear, lineWidth: 3)
                    )
                
                Text(theme.rawValue)
                    .font(.headline)
                    .foregroundColor(.white)
                
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.white)
                        .font(.title2)
                }
            }
            .padding()
            .background( in: RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Export View
struct ExportView: View {
    @EnvironmentObject var journalManager: JournalManager
    @Environment(\.dismiss) private var dismiss
    @State private var exportData: Data?
    
    var body: some View {
        NavigationView {
            ZStack {
                journalManager.settings.theme.gradient
                    .ignoresSafeArea()
                
                VStack(spacing: 30) {
                    Image(systemName: "square.and.arrow.up")
                        .font(.system(size: 60))
                        .foregroundColor(.white)
                    
                    Text("Export Your Journal")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    Text("Export all your journal entries as a JSON file. This includes all your entries, moods, tags, and AI insights.")
                        .font(.body)
                        .foregroundColor(.white.opacity(0.8))
                        .multilineTextAlignment(.center)
                        .padding()
                    
                    VStack(spacing: 16) {
                        StatItem(title: "Entries", value: "\(journalManager.stats.totalEntries)")
                        StatItem(title: "Words", value: "\(journalManager.stats.totalWords)")
                        StatItem(title: "Favorites", value: "\(journalManager.stats.favoriteEntries)")
                    }
                    .padding()
                    .background( in: RoundedRectangle(cornerRadius: 16))
                    
                    Button(action: {
                        exportData = journalManager.exportEntries()
                    }) {
                        Text("Export Journal")
                            .font(.headline)
                            .fontWeight(.medium)
                            .foregroundColor(.white)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background( in: RoundedRectangle(cornerRadius: 12))
                    }
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Export")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
        }
        .sheet(item: .constant(exportData != nil ? ExportItem(data: exportData!) : nil)) { item in
            ShareSheet(activityItems: [item.data])
        }
    }
}

// MARK: - Import View
struct ImportView: View {
    @EnvironmentObject var journalManager: JournalManager
    @Environment(\.dismiss) private var dismiss
    @State private var showingDocumentPicker = false
    @State private var importResult: ImportResult?
    
    enum ImportResult {
        case success(Int)
        case failure(String)
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                journalManager.settings.theme.gradient
                    .ignoresSafeArea()
                
                VStack(spacing: 30) {
                    Image(systemName: "square.and.arrow.down")
                        .font(.system(size: 60))
                        .foregroundColor(.white)
                    
                    Text("Import Journal")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    Text("Import journal entries from a JSON file. This will add the imported entries to your existing journal.")
                        .font(.body)
                        .foregroundColor(.white.opacity(0.8))
                        .multilineTextAlignment(.center)
                        .padding()
                    
                    if let result = importResult {
                        switch result {
                        case .success(let count):
                            VStack(spacing: 8) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 40))
                                    .foregroundColor(.green)
                                
                                Text("Successfully imported \(count) entries")
                                    .font(.headline)
                                    .foregroundColor(.white)
                            }
                            .padding()
                            .background( in: RoundedRectangle(cornerRadius: 16))
                        case .failure(let message):
                            VStack(spacing: 8) {
                                Image(systemName: "xmark.circle.fill")
                                    .font(.system(size: 40))
                                    .foregroundColor(.red)
                                
                                Text("Import failed: \(message)")
                                    .font(.headline)
                                    .foregroundColor(.white)
                            }
                            .padding()
                            .background( in: RoundedRectangle(cornerRadius: 16))
                        }
                    }
                    
                    Button(action: {
                        showingDocumentPicker = true
                    }) {
                        Text("Choose File")
                            .font(.headline)
                            .fontWeight(.medium)
                            .foregroundColor(.white)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background( in: RoundedRectangle(cornerRadius: 12))
                    }
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Import")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
        }
        .sheet(isPresented: $showingDocumentPicker) {
            DocumentPicker { data in
                if journalManager.importEntries(from: data) {
                    importResult = .success(journalManager.entries.count)
                } else {
                    importResult = .failure("Invalid file format")
                }
            }
        }
    }
}

// MARK: - Export Item
struct ExportItem: Identifiable {
    let id = UUID()
    let data: Data
}

// MARK: - Share Sheet
struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

// MARK: - Document Picker
struct DocumentPicker: UIViewControllerRepresentable {
    let onDocumentPicked: (Data) -> Void
    
    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.json])
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIDocumentPickerDelegate {
        let parent: DocumentPicker
        
        init(_ parent: DocumentPicker) {
            self.parent = parent
        }
        
        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            guard let url = urls.first,
                  let data = try? Data(contentsOf: url) else { return }
            
            parent.onDocumentPicked(data)
        }
    }
}

