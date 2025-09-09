# AI Agents Chat Integration

This project integrates your AI Agents framework with a React Native frontend to create a ChatGPT-like interface with dynamic tools.

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Install dependencies
npm install

# Set up environment variables (optional - works in demo mode without API key)
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env

# Start the server
npm run server
```

The server will start on `http://localhost:3000` with:
- ✅ REST API endpoints
- ✅ WebSocket support for real-time updates
- ✅ Demo mode (works without API key)
- ✅ Dynamic tool management

### 2. Frontend Setup

```bash
# Navigate to mobile app directory
cd mobile-app

# Install dependencies
npm install

# Start the Expo development server
npm start
```

### 3. Test the Integration

1. **Backend Health Check**: `curl http://localhost:3000/api/health`
2. **Available Tools**: `curl http://localhost:3000/api/tools`
3. **Chat Test**: `curl -X POST http://localhost:3000/api/chat/default -H "Content-Type: application/json" -d '{"message": "Hello!"}'`

## 📱 Frontend Features

### ChatGPT-like Interface
- **Real-time Chat**: Send messages and receive AI responses
- **Tool Integration**: AI automatically uses appropriate tools
- **Tool Selection**: Enable/disable specific tools per conversation
- **WebSocket Updates**: Real-time tool execution status
- **Conversation History**: Persistent chat history with AsyncStorage

### Available Tools
- **Calculator**: Evaluate math expressions safely
- **Weather**: Get current weather for locations
- **Search**: Search for information on topics
- **Math Tools**: Sum, Product, Average calculations

## 🔧 Backend API

### Endpoints

#### `GET /api/health`
Health check endpoint
```json
{
  "status": "healthy",
  "timestamp": "2025-09-06T13:50:35.433Z",
  "activeAgents": 1,
  "availableTools": 6
}
```

#### `GET /api/tools`
Get all available tools
```json
[
  {
    "id": "calculator",
    "name": "calculator",
    "description": "Evaluate math expressions safely",
    "category": "Math",
    "status": "active",
    "usageCount": 15,
    "lastUsed": "2025-09-06T11:41:21.903Z"
  }
]
```

#### `GET /api/agents`
Get available agents
```json
[
  {
    "id": "default",
    "name": "AI Assistant",
    "description": "A versatile assistant with access to multiple tools",
    "tools": ["calculator", "weather", "search", "calculateSum", "calculateProduct", "calculateAverage"],
    "lastMessage": "Ready to help!",
    "timestamp": "2025-09-06T13:50:35.433Z"
  }
]
```

#### `POST /api/chat/:agentId`
Chat with an agent
```json
// Request
{
  "message": "Calculate 2+2",
  "enabledTools": ["calculator", "calculateSum"]
}

// Response
{
  "text": "The sum of 2 + 2 is 4.",
  "toolCalls": [],
  "timestamp": "2025-09-06T13:50:52.571Z"
}
```

#### `POST /api/tools/:toolName/test`
Test a specific tool
```json
// Request
{
  "input": { "expression": "2+2" }
}

// Response
{
  "result": 4,
  "timestamp": "2025-09-06T13:50:52.571Z"
}
```

### WebSocket Connection

Connect to real-time updates:
```javascript
const ws = new WebSocket('ws://localhost:3000/ws/agent/default');

ws.onmessage = (event) => {
  const step = JSON.parse(event.data);
  console.log('Agent step:', step);
};
```

## 🛠️ Development

### Adding New Tools

1. **Create Tool in Backend** (`server.ts`):
```typescript
const newTool = new Tool({
  name: 'myTool',
  description: 'Description of what the tool does',
  schema: z.object({
    input: z.string().describe('Input description')
  }),
  func: async ({ input }) => {
    // Tool implementation
    return result;
  }
});

registry.register(newTool);
```

2. **Tool Automatically Available**: The tool will appear in the frontend automatically

### Customizing Agents

Create specialized agents with specific tools:
```typescript
const mathAgent = new Agent({
  llm: new OpenAILLM({ model: 'gpt-4o-mini' }),
  memory: new InMemoryMemory(),
  tools: mathOnlyRegistry,
  system: 'You are a math specialist. Focus on mathematical calculations.',
  debug: false
});
```

## 🔒 Environment Variables

```bash
# Required for full OpenAI functionality
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Google Gemini support
GOOGLE_API_KEY=your_google_api_key_here

# Server configuration
PORT=3000
```

## 📊 Demo Mode

The system works in **demo mode** without API keys:
- ✅ All API endpoints functional
- ✅ Tool execution with mock responses
- ✅ WebSocket connections
- ✅ Frontend integration
- ⚠️ Limited AI responses (basic pattern matching)

## 🚀 Production Deployment

### Backend
1. Set up environment variables
2. Deploy to your preferred platform (Railway, Heroku, AWS, etc.)
3. Update frontend API URL in `mobile-app/services/api.ts`

### Frontend
1. Build for production: `expo build`
2. Deploy to app stores or web

## 🔍 Troubleshooting

### Common Issues

1. **Server won't start**: Check if port 3000 is available
2. **API calls fail**: Ensure server is running and accessible
3. **WebSocket connection fails**: Check firewall settings
4. **Tools not working**: Verify tool registration in server.ts

### Debug Mode

Enable debug logging in the agent:
```typescript
const agent = new Agent({
  // ... other options
  debug: true  // Enables step-by-step logging
});
```

## 📈 Next Steps

1. **Add More Tools**: Weather API, search engines, databases
2. **Multi-Agent Systems**: Specialized agents for different tasks
3. **Persistent Memory**: Database storage for conversation history
4. **User Authentication**: User-specific agents and conversations
5. **Tool Marketplace**: Dynamic tool discovery and installation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your tools or improvements
4. Submit a pull request

---

**🎉 You now have a fully functional ChatGPT-like interface with dynamic AI agents and tools!**
