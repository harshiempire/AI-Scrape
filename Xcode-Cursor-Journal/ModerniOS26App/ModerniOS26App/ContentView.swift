import SwiftUI

struct ContentView: View {
    @State private var isAnimating = false
    @State private var selectedTab = 0
    @State private var showingAIFeatures = false
    
    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Home")
                }
                .tag(0)
            
            AIDashboardView()
                .tabItem {
                    Image(systemName: "brain.head.profile")
                    Text("AI")
                }
                .tag(1)
            
            SettingsView()
                .tabItem {
                    Image(systemName: "gearshape.fill")
                    Text("Settings")
                }
                .tag(2)
        }
        .accentColor(.white)
    }
}

struct HomeView: View {
    @State private var isAnimating = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // Liquid Glass Background
                LinearGradient(
                    colors: [
                        Color.black,
                        Color.blue.opacity(0.3),
                        Color.purple.opacity(0.2)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 30) {
                        // Welcome Header with Liquid Glass Effect
                        VStack(spacing: 16) {
                            Text("Welcome to iOS 26")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            
                            Text("Experience the future of mobile computing")
                                .font(.title3)
                                .foregroundColor(.white.opacity(0.8))
                                .multilineTextAlignment(.center)
                        }
                        .padding()
                        .background( in: RoundedRectangle(cornerRadius: 20))
                        .scaleEffect(isAnimating ? 1.05 : 1.0)
                        .animation(.easeInOut(duration: 2).repeatForever(autoreverses: true), value: isAnimating)
                        
                        // Feature Cards with Liquid Glass
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 20) {
                            FeatureCard(
                                icon: "brain.head.profile",
                                title: "AI Integration",
                                description: "Powered by advanced AI",
                                color: .blue
                            )
                            
                            FeatureCard(
                                icon: "eye.fill",
                                title: "Visual Intelligence",
                                description: "See the world differently",
                                color: .purple
                            )
                            
                            FeatureCard(
                                icon: "waveform",
                                title: "Voice Control",
                                description: "Control with your voice",
                                color: .green
                            )
                            
                            FeatureCard(
                                icon: "sparkles",
                                title: "Liquid Glass UI",
                                description: "Beautiful new design",
                                color: .pink
                            )
                        }
                        
                        // Interactive Demo Section
                        VStack(spacing: 20) {
                            Text("Interactive Demo")
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            
                            InteractiveGlassButton()
                        }
                        .padding()
                        .background( in: RoundedRectangle(cornerRadius: 20))
                    }
                    .padding()
                }
            }
            .navigationTitle("iOS 26")
            .navigationBarTitleDisplayMode(.inline)
        }
        .onAppear {
            isAnimating = true
        }
    }
}

struct FeatureCard: View {
    let icon: String
    let title: String
    let description: String
    let color: Color
    
    @State private var isPressed = false
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 30))
                .foregroundColor(color)
            
            Text(title)
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundColor(.white)
            
            Text(description)
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity, minHeight: 120)
        .background( in: RoundedRectangle(cornerRadius: 16))
        .scaleEffect(isPressed ? 0.95 : 1.0)
        .animation(.easeInOut(duration: 0.1), value: isPressed)
        .onTapGesture {
            isPressed = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                isPressed = false
            }
        }
    }
}

struct InteractiveGlassButton: View {
    @State private var isAnimating = false
    @State private var rotationAngle: Double = 0
    
    var body: some View {
        Button(action: {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                rotationAngle += 360
            }
        }) {
            HStack {
                Image(systemName: "sparkles")
                    .font(.title2)
                    .rotationEffect(.degrees(rotationAngle))
                
                Text("Tap to Experience Magic")
                    .font(.headline)
                    .fontWeight(.medium)
            }
            .foregroundColor(.white)
            .padding()
            .frame(maxWidth: .infinity)
            .background( in: RoundedRectangle(cornerRadius: 12))
        }
        .scaleEffect(isAnimating ? 1.05 : 1.0)
        .animation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true), value: isAnimating)
        .onAppear {
            isAnimating = true
        }
    }
}

struct AIDashboardView: View {
    @State private var aiResponse = "AI Assistant is ready to help you with iOS 26 development!"
    @State private var isProcessing = false
    
    var body: some View {
        NavigationView {
            ZStack {
                LinearGradient(
                    colors: [
                        Color.black,
                        Color.blue.opacity(0.3),
                        Color.cyan.opacity(0.2)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                VStack(spacing: 30) {
                    // AI Status Card
                    VStack(spacing: 16) {
                        HStack {
                            Image(systemName: "brain.head.profile")
                                .font(.title)
                                .foregroundColor(.cyan)
                            
                            VStack(alignment: .leading) {
                                Text("AI Assistant")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                
                                Text("Powered by iOS 26")
                                    .font(.caption)
                                    .foregroundColor(.white.opacity(0.7))
                            }
                            
                            Spacer()
                            
                            Circle()
                                .fill(.green)
                                .frame(width: 12, height: 12)
                        }
                        
                        Text(aiResponse)
                            .font(.body)
                            .foregroundColor(.white.opacity(0.9))
                            .multilineTextAlignment(.leading)
                    }
                    .padding()
                    .background( in: RoundedRectangle(cornerRadius: 20))
                    
                    // AI Features Grid
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 20) {
                        AIFeatureCard(
                            icon: "text.bubble.fill",
                            title: "Code Generation",
                            description: "Generate Swift code with AI"
                        )
                        
                        AIFeatureCard(
                            icon: "magnifyingglass",
                            title: "Visual Search",
                            description: "Search with your camera"
                        )
                        
                        AIFeatureCard(
                            icon: "waveform.path",
                            title: "Voice Commands",
                            description: "Control with natural language"
                        )
                        
                        AIFeatureCard(
                            icon: "lightbulb.fill",
                            title: "Smart Suggestions",
                            description: "Get intelligent recommendations"
                        )
                    }
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("AI Dashboard")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct AIFeatureCard: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.cyan)
            
            Text(title)
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundColor(.white)
            
            Text(description)
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity, minHeight: 100)
        .background( in: RoundedRectangle(cornerRadius: 16))
    }
}

struct SettingsView: View {
    @State private var notificationsEnabled = true
    @State private var aiAssistanceEnabled = true
    @State private var liquidGlassEnabled = true
    
    var body: some View {
        NavigationView {
            ZStack {
                LinearGradient(
                    colors: [
                        Color.black,
                        Color.purple.opacity(0.3),
                        Color.pink.opacity(0.2)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 20) {
                        // App Info Card
                        VStack(spacing: 16) {
                            Image(systemName: "iphone")
                                .font(.system(size: 50))
                                .foregroundColor(.white)
                            
                            Text("Modern iOS 26 App")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            
                            Text("Version 1.0.0")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.7))
                            
                            Text("Built with Xcode 26 & Swift 6")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.7))
                        }
                        .padding()
                        .background( in: RoundedRectangle(cornerRadius: 20))
                        
                        // Settings Options
                        VStack(spacing: 16) {
                            SettingsRow(
                                icon: "bell.fill",
                                title: "Notifications",
                                isOn: $notificationsEnabled
                            )
                            
                            SettingsRow(
                                icon: "brain.head.profile",
                                title: "AI Assistance",
                                isOn: $aiAssistanceEnabled
                            )
                            
                            SettingsRow(
                                icon: "sparkles",
                                title: "Liquid Glass UI",
                                isOn: $liquidGlassEnabled
                            )
                        }
                        .padding()
                        .background( in: RoundedRectangle(cornerRadius: 20))
                        
                        // About Section
                        VStack(spacing: 12) {
                            Text("About iOS 26")
                                .font(.headline)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            
                            Text("Experience the future of mobile computing with iOS 26. Featuring advanced AI integration, Liquid Glass design language, and revolutionary new features that redefine what's possible on mobile devices.")
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
    }
}

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

#Preview {
    ContentView()
}

