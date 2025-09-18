// src/utils/toolRegistry.ts
// Utility for registering all available tools

import { ToolRegistry } from '../core/toolRegistry.js';
import { Tool } from '../core/tool.js';
import { EnhancedSearchTool } from '../tools/enhancedSearchTool.js';
import { MathTools } from '../tools/mathTools.js';
import { WeatherTool } from '../tools/weatherTool.js';
import { SearchTool } from '../tools/searchTool.js';

export class ComprehensiveToolRegistry {
  private toolRegistry: ToolRegistry;

  constructor() {
    this.toolRegistry = new ToolRegistry();
  }

  /**
   * Register all available tools
   */
  async registerAllTools(): Promise<ToolRegistry> {
    console.log('🔧 Registering all available tools...');

    // Register Enhanced Search Tool
    const enhancedSearchTool = new EnhancedSearchTool();
    const searchTool = new Tool({
      name: 'enhanced_search',
      description: 'Enhanced search tool with real-time and semantic search capabilities',
      func: async (input: any) => {
        return await enhancedSearchTool.search(input.query, input.depth || 'medium');
      }
    });
    this.toolRegistry.register(searchTool);
    console.log('✅ Enhanced Search Tool registered');

    // Register Math Tools
    const mathTools = MathTools.createTools();
    mathTools.forEach(tool => {
      this.toolRegistry.register(tool);
    });
    console.log(`✅ ${mathTools.length} Math Tools registered`);

    // Register Weather Tool
    const weatherTool = WeatherTool.createTool();
    this.toolRegistry.register(weatherTool);
    console.log('✅ Weather Tool registered');

    // Register Basic Search Tool
    const basicSearchTool = SearchTool.createTool();
    this.toolRegistry.register(basicSearchTool);
    console.log('✅ Basic Search Tool registered');

    console.log(`🎉 All tools registered successfully! Total: ${this.toolRegistry.list().length} tools`);
    return this.toolRegistry;
  }

  /**
   * Register only essential tools for research
   */
  async registerResearchTools(): Promise<ToolRegistry> {
    console.log('🔧 Registering research tools...');

    // Register Enhanced Search Tool
    const enhancedSearchTool = new EnhancedSearchTool();
    const searchTool = new Tool({
      name: 'enhanced_search',
      description: 'Enhanced search tool with real-time and semantic search capabilities',
      func: async (input: any) => {
        return await enhancedSearchTool.search(input.query, input.depth || 'medium');
      }
    });
    this.toolRegistry.register(searchTool);
    console.log('✅ Enhanced Search Tool registered');

    console.log(`🎉 Research tools registered successfully! Total: ${this.toolRegistry.list().length} tools`);
    return this.toolRegistry;
  }

  /**
   * Register only utility tools
   */
  async registerUtilityTools(): Promise<ToolRegistry> {
    console.log('🔧 Registering utility tools...');

    // Register Math Tools
    const mathTools = MathTools.createTools();
    mathTools.forEach(tool => {
      this.toolRegistry.register(tool);
    });
    console.log(`✅ ${mathTools.length} Math Tools registered`);

    // Register Weather Tool
    const weatherTool = WeatherTool.createTool();
    this.toolRegistry.register(weatherTool);
    console.log('✅ Weather Tool registered');

    console.log(`🎉 Utility tools registered successfully! Total: ${this.toolRegistry.list().length} tools`);
    return this.toolRegistry;
  }

  /**
   * Get the tool registry
   */
  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  /**
   * List all registered tools
   */
  listTools(): string[] {
    return this.toolRegistry.list().map(tool => tool.name);
  }
}

export default ComprehensiveToolRegistry;
