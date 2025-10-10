import SwiftUI
import Foundation

// MARK: - AI Privacy Manager
@available(iOS 18.0, *)
@MainActor
class AIPrivacyManager: ObservableObject {
    @Published var privacyMode: PrivacyMode = .enhanced
    @Published var cloudDataEnabled: Bool = true
    @Published var analyticsEnabled: Bool = true
    @Published var lastDataExport: Date?
    @Published var cloudDataCount: Int = 0
    
    private let userDefaults = UserDefaults.standard
    private let privacyModeKey = "AIPrivacyMode"
    private let cloudDataKey = "CloudDataEnabled"
    private let analyticsKey = "AnalyticsEnabled"
    private let lastExportKey = "LastDataExport"
    private let cloudDataCountKey = "CloudDataCount"
    
    init() {
        loadSettings()
    }
    
    // MARK: - Privacy Mode Management
    func setPrivacyMode(_ mode: PrivacyMode) {
        privacyMode = mode
        cloudDataEnabled = (mode == .enhanced)
        saveSettings()
    }
    
    func toggleCloudData() {
        cloudDataEnabled.toggle()
        if !cloudDataEnabled {
            privacyMode = .private
        }
        saveSettings()
    }
    
    func toggleAnalytics() {
        analyticsEnabled.toggle()
        saveSettings()
    }
    
    // MARK: - Data Management
    func exportAllData() -> Data? {
        let exportData = AIExportData(
            privacyMode: privacyMode,
            cloudDataEnabled: cloudDataEnabled,
            analyticsEnabled: analyticsEnabled,
            exportDate: Date(),
            cloudDataCount: cloudDataCount
        )
        
        lastDataExport = Date()
        saveSettings()
        
        return try? JSONEncoder().encode(exportData)
    }
    
    func deleteCloudData() async {
        // In a real implementation, this would make API calls to delete data
        cloudDataCount = 0
        saveSettings()
    }
    
    func incrementCloudDataCount() {
        cloudDataCount += 1
        saveSettings()
    }
    
    // MARK: - Privacy Checks
    func canUseCloudAI() -> Bool {
        return cloudDataEnabled && privacyMode == .enhanced
    }
    
    func canCollectAnalytics() -> Bool {
        return analyticsEnabled
    }
    
    func getPrivacyStatus() -> PrivacyStatus {
        switch privacyMode {
        case .private:
            return PrivacyStatus(
                mode: .private,
                description: "All AI processing happens on your device. No data is sent to external servers.",
                features: ["On-device sentiment analysis", "Local pattern detection", "Basic insights"],
                icon: "lock.shield",
                color: .green
            )
        case .enhanced:
            return PrivacyStatus(
                mode: .enhanced,
                description: "Advanced AI features use encrypted cloud processing. Your data is anonymized and secure.",
                features: ["Deep pattern analysis", "Personalized prompts", "Weekly summaries", "Semantic search"],
                icon: "cloud.bolt",
                color: .blue
            )
        }
    }
    
    func getDataUsageSummary() -> DataUsageSummary {
        return DataUsageSummary(
            totalEntries: cloudDataCount,
            lastProcessed: lastDataExport,
            privacyMode: privacyMode,
            dataRetention: "30 days",
            encryptionStatus: "End-to-end encrypted"
        )
    }
    
    // MARK: - Settings Persistence
    private func saveSettings() {
        userDefaults.set(privacyMode.rawValue, forKey: privacyModeKey)
        userDefaults.set(cloudDataEnabled, forKey: cloudDataKey)
        userDefaults.set(analyticsEnabled, forKey: analyticsKey)
        userDefaults.set(lastDataExport, forKey: lastExportKey)
        userDefaults.set(cloudDataCount, forKey: cloudDataCountKey)
    }
    
    private func loadSettings() {
        if let modeString = userDefaults.string(forKey: privacyModeKey),
           let mode = PrivacyMode(rawValue: modeString) {
            privacyMode = mode
        }
        
        cloudDataEnabled = userDefaults.object(forKey: cloudDataKey) as? Bool ?? true
        analyticsEnabled = userDefaults.object(forKey: analyticsKey) as? Bool ?? true
        lastDataExport = userDefaults.object(forKey: lastExportKey) as? Date
        cloudDataCount = userDefaults.integer(forKey: cloudDataCountKey)
    }
}

// MARK: - Privacy Models
enum PrivacyMode: String, CaseIterable, Codable {
    case `private` = "private"
    case enhanced = "enhanced"
    
    var title: String {
        switch self {
        case .private:
            return "Private Mode"
        case .enhanced:
            return "Enhanced Mode"
        }
    }
    
    var description: String {
        switch self {
        case .private:
            return "All AI processing happens on your device"
        case .enhanced:
            return "Advanced AI features with cloud processing"
        }
    }
}

struct PrivacyStatus {
    let mode: PrivacyMode
    let description: String
    let features: [String]
    let icon: String
    let color: Color
}

struct DataUsageSummary {
    let totalEntries: Int
    let lastProcessed: Date?
    let privacyMode: PrivacyMode
    let dataRetention: String
    let encryptionStatus: String
}

struct AIExportData: Codable {
    let privacyMode: PrivacyMode
    let cloudDataEnabled: Bool
    let analyticsEnabled: Bool
    let exportDate: Date
    let cloudDataCount: Int
}

// MARK: - Privacy UI Components
struct PrivacyModeCard: View {
    let status: PrivacyStatus
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: status.icon)
                        .font(.title2)
                        .foregroundColor(status.color)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(status.mode.title)
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text(status.description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    if isSelected {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.title2)
                            .foregroundColor(.blue)
                    }
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(status.features, id: \.self) { feature in
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.caption)
                                .foregroundColor(.green)
                            
                            Text(feature)
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Spacer()
                        }
                    }
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.blue.opacity(0.1) : Color.gray.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct DataUsageCard: View {
    let summary: DataUsageSummary
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "chart.bar.doc.horizontal")
                    .font(.title2)
                    .foregroundColor(.blue)
                
                Text("Data Usage")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
            }
            
            VStack(spacing: 12) {
                DataUsageRow(
                    title: "Entries Processed",
                    value: "\(summary.totalEntries)",
                    icon: "doc.text"
                )
                
                DataUsageRow(
                    title: "Privacy Mode",
                    value: summary.privacyMode.title,
                    icon: summary.privacyMode == .private ? "lock.shield" : "cloud.bolt"
                )
                
                DataUsageRow(
                    title: "Data Retention",
                    value: summary.dataRetention,
                    icon: "clock"
                )
                
                DataUsageRow(
                    title: "Encryption",
                    value: summary.encryptionStatus,
                    icon: "lock"
                )
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.gray.opacity(0.1))
        )
    }
}

struct DataUsageRow: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(.blue)
                .frame(width: 20)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.primary)
        }
    }
}
