export class ToolRegistry {
    tools = new Map();
    /** Register a single tool instance */
    register(tool) {
        if (this.tools.has(tool.name)) {
            throw new Error(`Tool already registered: ${tool.name}`);
        }
        this.tools.set(tool.name, tool);
    }
    /** Get tool by name */
    get(name) {
        return this.tools.get(name);
    }
    /** List all tools */
    list() {
        return [...this.tools.values()];
    }
    /** Call a tool by name with validated input */
    async callTool(name, input) {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool "${name}" not found`);
        }
        return tool.run(input);
    }
    /** Convert all tools into function specs (for LLMs like OpenAI/Gemini) */
    toFunctionSpecs() {
        return this.list().map((tool) => tool.getMetadata());
    }
}
