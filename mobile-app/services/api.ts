// services/api.ts
export interface AgentResponse {
  text: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  tool: string;
  input: any;
  output?: any;
  status: 'running' | 'completed' | 'error';
  timestamp: Date;
}

export interface AgentStep {
  type: 'llm_request' | 'llm_response' | 'tool_start' | 'tool_end';
  data: any;
  timestamp: Date;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  tools: string[];
  lastMessage?: string;
  timestamp?: Date;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'error';
  lastUsed?: Date;
  usageCount: number;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    // Use the AI Agents backend server
    this.baseUrl = 'http://localhost:3000/api';
  }

  // Real API implementation
  async chatWithAgent(agentId: string, message: string, enabledTools?: string[]): Promise<AgentResponse> {
    try {
      const response = await this.makeRequest<AgentResponse>(`/chat/${agentId}`, {
        method: 'POST',
        body: JSON.stringify({ 
          message, 
          enabledTools 
        }),
      });
      
      return response;
    } catch (error) {
      console.error('Chat API error:', error);
      // Fallback to mock response
      return this.getMockResponse(message);
    }
  }

  private getMockResponse(message: string): AgentResponse {
    const hasToolCall = message.toLowerCase().includes('calculate') || 
                       message.toLowerCase().includes('weather') ||
                       message.toLowerCase().includes('search');

    if (hasToolCall) {
      const toolName = message.toLowerCase().includes('calculate') ? 'calculator' :
                      message.toLowerCase().includes('weather') ? 'weather' : 'search';
      
      const mockResult = toolName === 'calculator' ? '42' :
                        toolName === 'weather' ? 'Sunny, 25°C' :
                        'Found 5 relevant results about your query';

      return {
        text: `I used the ${toolName} tool and got: ${mockResult}. Here's my response to your question: ${message}`,
        toolCalls: [{
          id: Date.now().toString(),
          tool: toolName,
          input: { query: message },
          output: mockResult,
          status: 'completed',
          timestamp: new Date(),
        }]
      };
    }

    return {
      text: `I understand you're asking about: "${message}". I can help you with calculations, weather information, or research. Would you like me to use any specific tool?`
    };
  }

  async getAgents(): Promise<Agent[]> {
    try {
      return await this.makeRequest<Agent[]>('/agents');
    } catch (error) {
      console.error('Get agents API error:', error);
      // Fallback to mock data
      return [
        {
          id: 'default',
          name: 'AI Assistant',
          description: 'A versatile assistant with access to multiple tools',
          tools: ['calculator', 'weather', 'search', 'calculateSum', 'calculateProduct', 'calculateAverage'],
          lastMessage: 'Ready to help!',
          timestamp: new Date(),
        }
      ];
    }
  }

  async getTools(): Promise<Tool[]> {
    try {
      return await this.makeRequest<Tool[]>('/tools');
    } catch (error) {
      console.error('Get tools API error:', error);
      // Fallback to mock data
      return [
        {
          id: '1',
          name: 'calculator',
          description: 'Evaluate math expressions safely',
          category: 'Math',
          status: 'active',
          lastUsed: new Date(),
          usageCount: 15,
        },
        {
          id: '2',
          name: 'calculateSum',
          description: 'Adds up numbers',
          category: 'Math',
          status: 'active',
          lastUsed: new Date(Date.now() - 3600000),
          usageCount: 8,
        },
        {
          id: '3',
          name: 'calculateProduct',
          description: 'Multiplies numbers',
          category: 'Math',
          status: 'active',
          lastUsed: new Date(Date.now() - 7200000),
          usageCount: 5,
        },
        {
          id: '4',
          name: 'calculateAverage',
          description: 'Calculates the average of numbers',
          category: 'Math',
          status: 'active',
          lastUsed: new Date(Date.now() - 10800000),
          usageCount: 3,
        },
        {
          id: '5',
          name: 'weather',
          description: 'Get current weather for a location',
          category: 'Information',
          status: 'active',
          lastUsed: new Date(Date.now() - 1800000),
          usageCount: 12,
        },
        {
          id: '6',
          name: 'search',
          description: 'Search for information on a topic',
          category: 'Information',
          status: 'active',
          lastUsed: new Date(Date.now() - 900000),
          usageCount: 20,
        },
      ];
    }
  }

  async testTool(toolId: string, input: any): Promise<any> {
    try {
      return await this.makeRequest<any>(`/tools/${toolId}/test`, {
        method: 'POST',
        body: JSON.stringify({ input }),
      });
    } catch (error) {
      console.error('Test tool API error:', error);
      // Fallback to mock response
      return {
        result: `Mock result for tool ${toolId} with input: ${JSON.stringify(input)}`,
        timestamp: new Date(),
      };
    }
  }

  // Real API implementation methods (to be implemented when backend is ready)
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // WebSocket connection for real-time tool call updates
  connectToAgent(agentId: string, onStep: (step: AgentStep) => void): WebSocket | null {
    try {
      const ws = new WebSocket(`ws://localhost:3000/ws/agent/${agentId}`);
      
      ws.onmessage = (event) => {
        const step: AgentStep = JSON.parse(event.data);
        onStep(step);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return ws;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      return null;
    }
  }
}

export const apiService = new ApiService();
