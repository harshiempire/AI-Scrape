# AI Agents Framework

A flexible, LLM-agnostic framework for building AI agents with dynamic tool support, pluggable memory, and multi-agent composition capabilities.

## Features

- **LLM Agnostic**: Support for OpenAI, Google Gemini, and easily extensible to other providers
- **Dynamic Tools**: Register and use tools at runtime with Zod validation
- **Pluggable Memory**: Choose from in-memory, vector, or database storage
- **Multi-Agent Systems**: Compose agents as tools for complex workflows
- **TypeScript First**: Full type safety with Zod schemas
- **Debugging Support**: Built-in logging and step tracking

## Installation

```bash
npm install openai @google/generative-ai zod zod-to-json-schema
```

## Quick Start

```typescript
import { 
  Agent, 
  ToolRegistry, 
  InMemoryMemory, 
  OpenAILLM, 
  Tool 
} from './core/index.js';
import { z } from 'zod';

// Create a calculator tool
const calculator = new Tool({
  name: 'calculator',
  description: 'Evaluate math expressions',
  schema: z.object({
    expression: z.string().describe('Mathematical expression to evaluate')
  }),
  func: async ({ expression }) => {
    return eval(expression); // In production, use a safe math parser
  }
});

// Set up the agent
const registry = new ToolRegistry();
registry.register(calculator);

const agent = new Agent({
  llm: new OpenAILLM({ model: 'gpt-4o-mini' }),
  memory: new InMemoryMemory(),
  tools: registry,
  system: 'You are a helpful assistant.',
  debug: true
});

// Use the agent
const response = await agent.chat('Calculate (2+3)*7 using the calculator tool');
console.log(response.text);
```

## Core Components

### LLM Adapters

```typescript
// OpenAI
const openaiLLM = new OpenAILLM({ 
  model: 'gpt-4o-mini',
  apiKey: 'your-api-key' // optional, uses env var by default
});

// Google Gemini
const geminiLLM = new GeminiLLM({ 
  model: 'gemini-pro',
  apiKey: 'your-api-key' // optional, uses env var by default
});
```

### Tools

Tools are functions that agents can call. They support Zod validation and provide metadata for LLM function calling.

```typescript
const weatherTool = new Tool({
  name: 'weather',
  description: 'Get current weather for a location',
  schema: z.object({
    location: z.string().describe('City or location name')
  }),
  func: async ({ location }) => {
    // Your weather API logic here
    return `Weather in ${location}: 22°C, Sunny`;
  }
});
```

### Memory Implementations

```typescript
// In-memory storage (default)
const memory = new InMemoryMemory();

// Vector memory (for semantic search)
const vectorMemory = new VectorMemory();

// Database memory (persistent storage)
const dbMemory = new DatabaseMemory();
```

### Multi-Agent Systems

Agents can be wrapped as tools to create specialized sub-agents:

```typescript
import { wrapAgentAsTool } from './core/index.js';

// Create a research agent
const researchAgent = new Agent({
  llm: new OpenAILLM({ model: 'gpt-4o-mini' }),
  memory: new InMemoryMemory(),
  tools: researchTools,
  system: 'You are a research assistant.'
});

// Wrap it as a tool
const researchTool = wrapAgentAsTool(researchAgent, {
  name: 'researcher',
  description: 'Research assistant that can search and summarize information'
});

// Use it in another agent
mainAgent.tools.register(researchTool);
```

## Examples

### Basic Math Agent

```typescript
import { MathTools } from './tools/mathTools.js';

const registry = new ToolRegistry();
const mathTools = MathTools.createTools();
for (const tool of mathTools) {
  registry.register(tool);
}

const agent = new Agent({
  llm: new OpenAILLM({ model: 'gpt-4o-mini' }),
  memory: new InMemoryMemory(),
  tools: registry,
  system: 'You are a helpful math assistant.',
  debug: true
});

const response = await agent.chat('Add 4, 5, and 6');
console.log(response.text);
```

### Weather Agent

```typescript
const weatherTool = new Tool({
  name: 'weather',
  description: 'Get current weather',
  schema: z.object({
    location: z.string()
  }),
  func: async ({ location }) => {
    // Mock weather data
    const weather = {
      'New York': { temp: '22°C', condition: 'Sunny' },
      'London': { temp: '15°C', condition: 'Cloudy' }
    };
    return weather[location] || 'Weather not available';
  }
});

const agent = new Agent({
  llm: new OpenAILLM({ model: 'gpt-4o-mini' }),
  memory: new InMemoryMemory(),
  tools: new ToolRegistry().register(weatherTool),
  system: 'You are a weather assistant.'
});

const response = await agent.chat('What\'s the weather in New York?');
```

## API Reference

### Agent

```typescript
interface AgentOptions {
  llm: LLM;
  memory: Memory;
  tools: ToolRegistry;
  system?: string;
  debug?: boolean;
}

class Agent {
  constructor(options: AgentOptions);
  chat(userMessage: string): Promise<{ text: string }>;
  onStep?: (step: AgentStep) => void;
}
```

### Tool

```typescript
interface ToolOptions {
  name: string;
  description: string;
  schema?: ZodTypeAny;
  func: (input: ToolInput) => Promise<ToolOutput> | ToolOutput;
}

class Tool {
  constructor(options: ToolOptions);
  run(input: ToolInput): Promise<ToolOutput>;
  getMetadata(): ToolMetadata;
}
```

### ToolRegistry

```typescript
class ToolRegistry {
  register(tool: Tool): void;
  get(name: string): Tool | undefined;
  list(): Tool[];
  callTool(name: string, input: unknown): Promise<any>;
  toFunctionSpecs(): any[];
}
```

### Memory

```typescript
interface Memory {
  load(): Promise<ChatMessage[]>;
  store(message: ChatMessage): Promise<void>;
  clear?(): Promise<void>;
}
```

## Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
```

## Development

```bash
# Install dependencies
npm install

# Run the demo
npm start

# Run the example
npx tsx src/example.ts

# Type check
npm run typecheck
```

## Architecture

The framework follows a modular design:

- **Core**: Base interfaces and implementations
- **Tools**: Reusable tool implementations
- **Examples**: Usage examples and demos

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC
