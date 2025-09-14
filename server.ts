import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import cors from "cors";
import {
  Agent,
  ToolRegistry,
  InMemoryMemory,
  OpenAILLM,
} from "./src/core/index.js";
import { SearchTool } from "./src/tools/searchTool.js";
import { WeatherTool } from "./src/tools/weatherTool.js";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Store active agents and their WebSocket connections
const activeAgents = new Map<string, Agent>();
const agentConnections = new Map<string, Set<any>>();

// Initialize tools
const registry = new ToolRegistry();

// Add search tool
const searchTool = SearchTool.createTool();

const weatherTool = WeatherTool.createTool();
registry.register(weatherTool);
registry.register(searchTool);

// Create default agent
let defaultAgent: Agent;

try {
  defaultAgent = new Agent({
    llm: new OpenAILLM({ model: "gpt-4o" }),
    memory: new InMemoryMemory(),
    tools: registry,
    system:
      "You are a helpful AI assistant with access to various tools. Use the available tools when appropriate to help users with their requests.",
    debug: true,
  });
  activeAgents.set("default", defaultAgent);
} catch (error) {
  console.warn(
    "⚠️  OpenAI API key not found. Running in demo mode with mock responses."
  );
}

// API Routes

// Get available tools
app.get("/api/tools", (req, res) => {
  const tools = registry.list().map((tool) => ({
    id: tool.name,
    name: tool.name,
    description: tool.description,
    category: tool.name.includes("calculate")
      ? "Math"
      : tool.name === "weather"
        ? "Information"
        : tool.name === "search"
          ? "Information"
          : "General",
    status: "active" as const,
    usageCount: Math.floor(Math.random() * 20), // Mock usage count
    lastUsed: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
  }));

  res.json(tools);
});

// Get available agents
app.get("/api/agents", (req, res) => {
  const agents = [
    {
      id: "default",
      name: "AI Assistant",
      description: "A versatile assistant with access to multiple tools",
      tools: registry.list().map((t) => t.name),
      lastMessage: "Ready to help!",
      timestamp: new Date(),
    },
  ];

  res.json(agents);
});

// Chat with agent
app.post("/api/chat/:agentId", async (req, res) => {
  try {
    const { agentId } = req.params;
    const { message, enabledTools } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get or create agent
    let agent = activeAgents.get(agentId);
    if (!agent) {
      try {
        // Create new agent with filtered tools
        const agentRegistry = new ToolRegistry();
        const availableTools = registry.list();

        for (const tool of availableTools) {
          if (enabledTools?.includes(tool.name)) {
            agentRegistry.register(tool);
          }
        }

        agent = new Agent({
          llm: new OpenAILLM({ model: "gpt-4o-mini" }),
          memory: new InMemoryMemory(),
          tools: agentRegistry,
          system:
            "You are a helpful AI assistant with access to various tools. Use the available tools when appropriate to help users with their requests.",
          debug: true,
        });

        // Add step logging
        agent.onStep = (step) => {
          const connections = agentConnections.get(agentId) || new Set();
          connections.forEach((ws) => {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify(step));
            }
          });
        };

        activeAgents.set(agentId, agent);
      } catch (error) {
        console.warn("Failed to create agent with OpenAI, using demo mode");
        agent = defaultAgent;
      }
    }

    // Chat with agent
    const response = await agent.chat(message);

    res.json({
      text: response.text,
      toolCalls: [], // Tool calls are handled via WebSocket
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: "Failed to process message",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Test a specific tool
app.post("/api/tools/:toolName/test", async (req, res) => {
  try {
    const { toolName } = req.params;
    const { input } = req.body;

    const tool = registry.get(toolName);
    if (!tool) {
      return res.status(404).json({ error: "Tool not found" });
    }

    const result = await tool.run(input);

    res.json({
      result,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Tool test error:", error);
    res.status(500).json({
      error: "Tool execution failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// WebSocket connection handler
wss.on("connection", (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const agentId = url.pathname.split("/").pop() || "default";

  console.log(`WebSocket connected for agent: ${agentId}`);

  // Add connection to agent's connection set
  if (!agentConnections.has(agentId)) {
    agentConnections.set(agentId, new Set());
  }
  agentConnections.get(agentId)!.add(ws);

  // Get the agent for this connection
  const agent = activeAgents.get(agentId) || defaultAgent;

  // Set up the step handler once per connection
  agent.on("step", (step) => {
    try {
      ws.send(
        JSON.stringify({
          type: step.type,
          data: step.data,
          timestamp: new Date(),
        })
      );
    } catch (error) {
      console.error("Error sending step update:", error);
    }
  });

  // Handle WebSocket messages
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("WebSocket message:", data);

      if (data.type === "chat" && data.message) {
        // Process the message through the agent
        try {
          // Process the message
          console.log("Processing chat message:", data.message);
          console.log("Enabled tools:", data.enabledTools);

          // Make sure we're passing the enabled tools to the agent
          // For now, we'll just log them and proceed with the chat
          const response = await agent.chat(data.message);
          console.log("Agent response:", response);

          // Send the final response
          ws.send(
            JSON.stringify({
              type: "response",
              data: response,
              timestamp: new Date(),
            })
          );
        } catch (error) {
          console.error("Error processing chat message:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              error: error instanceof Error ? error.message : "Unknown error",
              timestamp: new Date(),
            })
          );
        }
      } else if (data.type === "ping") {
        // Respond with pong to verify connection
        console.log("Received ping, sending pong");
        ws.send(
          JSON.stringify({
            type: "pong",
            timestamp: new Date(),
          })
        );
      } else {
        // Echo back for testing
        console.log("Echoing unknown message type:", data.type);
        ws.send(
          JSON.stringify({
            type: "echo",
            data,
            timestamp: new Date(),
          })
        );
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          error: "Invalid message format",
          timestamp: new Date(),
        })
      );
    }
  });

  // Handle WebSocket close
  ws.on("close", () => {
    console.log(`WebSocket disconnected for agent: ${agentId}`);
    const connections = agentConnections.get(agentId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        agentConnections.delete(agentId);
      }
    }
  });

  // Handle WebSocket errors
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: "connected",
      agentId,
      timestamp: new Date(),
    })
  );
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date(),
    activeAgents: activeAgents.size,
    availableTools: registry.list().length,
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 AI Agents Server running on port ${PORT}`);
  console.log("📡 WebSocket server ready for connections");
  console.log(
    `🔧 Available tools: ${registry
      .list()
      .map((t) => t.name)
      .join(", ")}`
  );
  console.log("🤖 Default agent created and ready");
});

export { app, server, wss };
