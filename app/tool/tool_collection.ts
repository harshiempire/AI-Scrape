import { ToolResultType } from "../../types";
import { BaseTool, ToolFailure } from "./base";

export class ToolCollection {
  tools: BaseTool[];
  tool_map: Record<string, BaseTool>;

  constructor(tools: BaseTool[]) {
    this.tools = tools;
    this.tool_map = tools.reduce((acc, tool) => {
      acc[tool.name] = tool;
      return acc;
    }, {} as Record<string, BaseTool>);
  }

  /**
   * 
   *   * Or simpler approach
   *   *
   *     [Symbol.iterator](): Generator<BaseTool> {
            for (const tool of this.tools) {
            yield tool;
            }
  }
   */

  // Make it iterable
  [Symbol.iterator](): Iterator<BaseTool> {
    return this.tools[Symbol.iterator]();
  }

  to_params(): Record<string, any>[] {
    return this.tools.map((tool) => tool.to_param());
  }

  async execute(name: string, tool_input: Record<string, any>) {
    const tool = this.tool_map[name];
    if (!tool) {
      return new ToolFailure({ error: `Tool ${name} not found` });
    }

    try {
      const result = await tool.execute(tool_input);
      return result;
    } catch (error) {
      return new ToolFailure({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async execute_all(): Promise<ToolResultType[]> {
    const results: ToolResultType[] = [];

    for (const tool of this.tools) {
      try {
        const result = await tool.execute({}); // Call execute method directly
        results.push(result);
      } catch (error) {
        results.push(
          new ToolFailure({
            error: error instanceof Error ? error.message : String(error),
          })
        );
      }
    }
    return results;
  }

  get_tool(name: string): BaseTool {
    return this.tool_map[name];
  }

  add_tool(tool: BaseTool): ToolCollection {
    if (tool.name in this.tool_map) {
      console.warn(`Tool ${tool.name} already exists in collection, skipping`);
      return this;
    }
    this.tool_map[tool.name] = tool;
    this.tools.push(tool);
    return this;
  }

  add_tools(tools: BaseTool[]): ToolCollection {
    for (const tool of tools) {
      this.add_tool(tool);
    }
    return this;
  }
}
