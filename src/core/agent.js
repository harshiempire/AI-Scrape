import { Tool } from "./tool";
export class Agent {
    llm;
    memory;
    tools;
    system;
    debug;
    onStep;
    constructor(options) {
        this.llm = options.llm;
        this.memory = options.memory;
        this.tools = options.tools;
        this.system = options.system || "You are a helpful assistant.";
        this.debug = options.debug || false;
    }
    // Add event listener for agent steps
    on(event, callback) {
        if (event === "step") {
            this.onStep = callback;
        }
    }
    logStep(type, data) {
        const step = {
            type,
            data,
            timestamp: new Date(),
        };
        if (this.debug) {
            console.log(`[${step.type}]`, step.data);
        }
        if (this.onStep) {
            this.onStep(step);
        }
    }
    async buildPrompt(userMessage) {
        const messages = await this.memory.load();
        await this.memory.store({
            role: "user",
            content: userMessage,
        });
        let prompt = `${this.system}\n\n`;
        // Add conversation history (excluding the current user message since it's already in memory)
        for (const message of messages) {
            prompt += `${message.role}: ${message.content}\n`;
        }
        // Add available tools
        const toolSpecs = this.tools.toFunctionSpecs();
        console.log("toolSpecs", toolSpecs);
        if (toolSpecs.length > 0) {
            prompt += "\nAvailable tools:\n";
            for (const tool of toolSpecs) {
                prompt += `- ${tool.name}: ${tool.description}\n`;
                if (tool.schema) {
                    prompt += `- Parameters: ${JSON.stringify(tool.schema, null, 2)}\n`;
                }
            }
            prompt +=
                '\nYou can call tools by responding with: TOOL_CALL:{"tool": "tool_name", "input": {...}}\n';
        }
        prompt += "\nassistant:";
        return prompt;
    }
    parseToolCall(response) {
        const toolCallMatch = response.match(/TOOL_CALL:\s*({.*})/);
        if (!toolCallMatch)
            return null;
        try {
            const parsed = JSON.parse(toolCallMatch[1]);
            return parsed;
        }
        catch {
            return null;
        }
    }
    async chat(userMessage) {
        console.log("Agent.chat called with message:", userMessage);
        // Store user message
        console.log("Message stored in memory");
        // Build prompt with context and tools
        const prompt = await this.buildPrompt(userMessage);
        this.logStep("llm_request", { prompt });
        // Generate response
        const response = await this.llm.generate({ prompt });
        this.logStep("llm_response", response);
        let finalResponse = response.text;
        // Check for tool calls
        const toolCall = this.parseToolCall(response.text);
        if (toolCall) {
            this.logStep("tool_start", toolCall);
            try {
                const toolResult = await this.tools.callTool(toolCall.tool, toolCall.input);
                this.logStep("tool_end", { tool: toolCall.tool, result: toolResult });
                // Store tool result and generate final response
                await this.memory.store({
                    role: "assistant",
                    content: `Tool call: ${toolCall.tool}(${JSON.stringify(toolCall.input)}) = ${JSON.stringify(toolResult)}`,
                });
                // Generate final response with tool result
                const finalPrompt = await this.buildPrompt(`Tool ${toolCall.tool} returned: ${JSON.stringify(toolResult)}. Please provide a helpful response to the user.`);
                const finalLLMResponse = await this.llm.generate({
                    prompt: finalPrompt,
                });
                finalResponse = finalLLMResponse.text;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logStep("tool_end", { tool: toolCall.tool, error: errorMessage });
                finalResponse = `Error calling tool ${toolCall.tool}: ${errorMessage}`;
            }
        }
        // Store assistant response
        await this.memory.store({
            role: "assistant",
            content: finalResponse,
        });
        return { text: finalResponse };
    }
}
// Utility function to wrap an agent as a tool
export function wrapAgentAsTool(agent, options) {
    return new Tool({
        name: options.name,
        description: options.description,
        func: async (input) => {
            const message = input.message || input.text || String(input);
            const response = await agent.chat(message);
            return response.text;
        },
    });
}
