# AI Agents Mobile App

A React Native mobile application built with Expo that provides an interface to interact with your AI Agents framework. The app showcases real-time tool call execution and agent interactions.

## Features

- 🤖 **Agent Management**: View and interact with different AI agents
- 🔧 **Tool Monitoring**: Real-time visualization of tool calls and execution
- 💬 **Chat Interface**: Clean, modern chat UI for agent conversations
- 📊 **Tool Analytics**: Track tool usage and performance metrics
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations

## Screens

### Home Screen (`/`)
- Displays all available agents
- Shows agent statistics (total agents, tools)
- Quick access to tools overview
- Agent cards with tool information

### Chat Screen (`/chat/[id]`)
- Real-time chat with specific agents
- Live tool call visualization
- Message history
- Tool execution status indicators

### Tools Screen (`/tools`)
- Complete list of available tools
- Tool categorization and filtering
- Usage statistics and analytics
- Tool testing capabilities

## Architecture

The app uses Expo Router for file-based navigation and includes:

- **File-based Routing**: Using Expo Router for clean navigation structure
- **TypeScript**: Full type safety throughout the application
- **Mock API Service**: Ready-to-replace mock implementation for backend integration
- **Real-time Updates**: WebSocket support for live tool call monitoring

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android)

### Installation

1. Navigate to the mobile app directory:
   ```bash
   cd mobile-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Run on your preferred platform:
   - **iOS**: Press `i` in the terminal or scan QR code with Expo Go
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go
   - **Web**: Press `w` in the terminal

## Backend Integration

The app is designed to work with your AI Agents framework backend. To connect:

1. **Update API Service**: Modify `services/api.ts` to point to your backend URL
2. **WebSocket Connection**: Configure WebSocket endpoint for real-time updates
3. **Authentication**: Add authentication headers if required

### Example Backend Integration

```typescript
// In services/api.ts
constructor() {
  this.baseUrl = 'https://your-backend-url.com/api';
}

async chatWithAgent(agentId: string, message: string): Promise<AgentResponse> {
  return this.makeRequest(`/agents/${agentId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
```

## Project Structure

```
mobile-app/
├── app/
│   ├── _layout.tsx          # Root layout with navigation
│   ├── index.tsx            # Home screen
│   ├── tools.tsx            # Tools overview screen
│   └── chat/
│       └── [id].tsx         # Dynamic chat screen
├── services/
│   └── api.ts               # API service layer
├── assets/                  # Images and icons
└── App.tsx                  # App entry point
```

## Key Components

### Agent Interface
- Clean card-based layout for agent selection
- Real-time statistics display
- Tool availability indicators

### Chat Interface
- Message bubbles with role indicators
- Tool call visualization with status
- Real-time typing indicators
- Smooth scrolling and animations

### Tool Monitoring
- Live tool execution status
- Input/output visualization
- Error handling and display
- Usage analytics

## Customization

### Styling
The app uses a consistent design system with:
- Primary color: `#6366f1` (Indigo)
- Background: `#f8fafc` (Slate 50)
- Text colors: Various slate shades
- Card shadows and rounded corners

### Adding New Features
1. **New Screens**: Add files to the `app/` directory
2. **API Endpoints**: Extend the `ApiService` class
3. **Tool Types**: Update TypeScript interfaces
4. **Styling**: Modify the StyleSheet objects

## Development Notes

- The app currently uses mock data for demonstration
- WebSocket integration is prepared but not active
- All tool calls are simulated for testing purposes
- Real backend integration requires updating the API service

## Next Steps

1. **Backend Integration**: Connect to your AI Agents framework
2. **Authentication**: Add user authentication and session management
3. **Push Notifications**: Implement notifications for tool completions
4. **Offline Support**: Add offline message queuing
5. **Advanced Analytics**: Enhanced tool usage tracking and reporting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the AI Agents framework and follows the same licensing terms.
