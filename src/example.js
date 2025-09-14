import { Agent, ToolRegistry, InMemoryMemory, OpenAILLM, Tool, wrapAgentAsTool, } from "./core/index.js";
import { z } from "zod";
// Example 1: Basic calculator tool
const calculatorTool = new Tool({
    name: "calculator",
    description: "Evaluate math expressions safely",
    schema: z.object({
        expression: z.string().describe("Mathematical expression to evaluate"),
    }),
    func: async ({ expression }) => {
        // Simple safe evaluation (in production, use a proper math parser)
        try {
            // Only allow basic math operations for safety
            if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
                throw new Error("Invalid characters in expression");
            }
            return eval(expression);
        }
        catch (error) {
            return `Error: ${error instanceof Error ? error.message : "Invalid expression"}`;
        }
    },
});
// Example 2: Weather tool (mock implementation)
const weatherTool = new Tool({
    name: "weather",
    description: "Get current weather for a location",
    schema: z.object({
        location: z.string().describe("City or location name"),
    }),
    func: async ({ location }) => {
        // Mock weather data - in production, integrate with real weather API
        const mockWeather = {
            "New York": { temp: "22°C", condition: "Sunny" },
            London: { temp: "15°C", condition: "Cloudy" },
            Tokyo: { temp: "28°C", condition: "Rainy" },
        };
        const weather = mockWeather[location];
        if (!weather) {
            return `Weather data not available for ${location}`;
        }
        return `Current weather in ${location}: ${weather.temp}, ${weather.condition}`;
    },
});
// Example 3: Multi-agent system
async function createResearchAgent() {
    const registry = new ToolRegistry();
    // Add research-specific tools
    const searchTool = new Tool({
        name: "search",
        description: "Search for information on a topic",
        schema: z.object({
            query: z.string().describe("Search query"),
        }),
        func: async ({ query }) => {
            // Mock search results
            return `Search results for "${query}": Found 5 relevant articles about ${query}.`;
        },
    });
    registry.register(searchTool);
    const researchAgent = new Agent({
        llm: new OpenAILLM({ model: "gpt-4o-mini" }),
        memory: new InMemoryMemory(),
        tools: registry,
        system: "You are a research assistant. Use the search tool to find information and provide comprehensive summaries.",
        debug: true,
    });
    return researchAgent;
}
// Main example function
async function runExample() {
    console.log("🤖 AI Agents Framework Example\n");
    // Create tool registry
    const registry = new ToolRegistry();
    registry.register(calculatorTool);
    registry.register(weatherTool);
    // Create main agent
    const agent = new Agent({
        llm: new OpenAILLM({ model: "gpt-4o-mini" }),
        memory: new InMemoryMemory(),
        tools: registry,
        system: "You are a helpful assistant with access to calculator and weather tools.",
        debug: true,
    });
    // Example conversations
    console.log("📝 Example 1: Calculator Tool");
    const calcResponse = await agent.chat("Calculate (2+3)*7 using the calculator tool");
    console.log("Response:", calcResponse.text);
    console.log();
    console.log("🌤️ Example 2: Weather Tool");
    const weatherResponse = await agent.chat("What's the weather like in New York?");
    console.log("Response:", weatherResponse.text);
    console.log();
    console.log("🔍 Example 3: Multi-Agent System");
    const researchAgent = await createResearchAgent();
    // Wrap research agent as a tool
    const researchTool = wrapAgentAsTool(researchAgent, {
        name: "researcher",
        description: "Research assistant that can search and summarize information",
    });
    // Add research tool to main agent
    registry.register(researchTool);
    const researchResponse = await agent.chat("Research information about artificial intelligence");
    console.log("Response:", researchResponse.text);
    console.log();
    console.log("✅ Example completed successfully!");
}
// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runExample().catch(console.error);
}
export { runExample };
