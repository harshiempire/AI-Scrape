// src/core/toolRegistry.ts
import { Tool } from "./tool";

export class ToolRegistry {
  private tools = new Map<string, Tool>();

  /** Register a single tool instance */
  register(tool: Tool) {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }

  /** Get tool by name */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /** List all tools */
  list(): Tool[] {
    return [...this.tools.values()];
  }

  /** Call a tool by name with validated input */
  async callTool(name: string, input: unknown): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found`);
    }
    return tool.run(input as any);
  }

  /** Convert all tools into function specs (for LLMs like OpenAI/Gemini) */
  toFunctionSpecs() {
    return this.list().map((tool) => tool.getMetadata());
  }
}
