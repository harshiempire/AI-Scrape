AI Agents Framework Documentation

This document provides an overview of the AI Agents framework, detailing its design principles, core abstractions, and usage patterns.

⸻

1. Design Principles

Our AI Agents are designed to be:
	•	LLM & Platform Agnostic: Easily switch between OpenAI, Gemini, or local models.
	•	Dynamic Tools: Tools can be registered at runtime, with validation.
	•	Pluggable Memory: Memory implementations are interchangeable (in-memory, vector database, or persistent DB).
	•	Composable/Nestable: Agents can be wrapped as tools to create multi-agent systems.

⸻

2. Core Abstractions

2.1 LLM

An LLM adapter implements the following interface:

interface LLM {
  generate(params: GenerateParams): Promise<LLMOutput>;
}

Available adapters:
	•	OpenAILLM - Wraps OpenAI Chat Completions.
	•	GeminiLLM - Wraps Google Gemini / Generative AI.

2.2 Tool

Represents a callable function the agent can invoke.

class Tool {
  name: string;
  description: string;
  schema?: ZodTypeAny;
  run(input: Record<string, any>): Promise<any>;
}

	•	Supports Zod validation.
	•	Provides metadata for LLM function calling.

2.3 Memory

Interface for storing and recalling conversation history:

interface Memory {
  load(): Promise<ChatMessage[]>;
  store(message: ChatMessage): Promise<void>;
  clear?(): Promise<void>;
}

Implementations:
	•	InMemoryMemory
	•	VectorMemory
	•	DatabaseMemory

2.4 ToolRegistry

Centralized registry to manage tools.

class ToolRegistry {
  register(tool: Tool): void;
  get(name: string): Tool | undefined;
  list(): Tool[];
  callTool(name: string, input: unknown): Promise<any>;
  toFunctionSpecs(): any[];
}

	•	Provides metadata to LLMs.
	•	Dynamic registration and invocation.

2.5 Agent

Coordinates conversation flow:
	•	Loads memory.
	•	Calls LLM with context and available tools.
	•	Executes tool calls.
	•	Stores results back to memory.
	•	Supports nested/multi-agent systems via wrapAgentAsTool().

class Agent {
  chat(userMessage: string): Promise<{ text: string }>;
}


⸻

3. Example Usage

import { Agent, ToolRegistry, InMemoryMemory, OpenAILLM, Tool } from './agent-kit';

const registry = new ToolRegistry();

const calculator = new Tool({
  name: 'calculator',
  description: 'Evaluate math expressions',
  run: async ({ expression }) => eval(expression),
});

registry.register(calculator);

const agent = new Agent({
  llm: new OpenAILLM({ model: 'gpt-4o-mini' }),
  memory: new InMemoryMemory(),
  tools: registry,
  system: 'You are a helpful assistant.',
});

const response = await agent.chat('Calculate (2+3)*7 using calculator tool');
console.log(response.text);


⸻

4. Multi-Agent Composition

Agents can be wrapped as tools to create specialized sub-agents.

const researchAgentTool = wrapAgentAsTool(researchAgent, {
  name: 'researcher',
  description: 'Finds and summarizes information',
});
registry.register(researchAgentTool);

This allows the main agent to call other agents dynamically.

⸻

5. Debugging & Logging
	•	Agents emit steps: LLM request/response, tool start/end.
	•	Enable debug: true or pass a custom Logger for visibility.

agent.onStep = (step) => console.log(step);


⸻

6. Implementation Roadmap
	1.	Define LLM, Tool, and Memory interfaces.
	2.	Implement adapters for OpenAI and Gemini.
	3.	Implement ToolRegistry.
	4.	Implement Agent loop with tool execution and memory storage.
	5.	Add pluggable memory options.
	6.	Wrap agents as tools for multi-agent support.
	7.	Add logging/debug hooks.

⸻

7. Notes
	•	All tools should implement proper input validation.
	•	LLM adapters standardize output via LLMOutput.
	•	Memory implementations can be swapped without changing agent logic.
	•	Registry allows dynamic addition of new capabilities at runtime.