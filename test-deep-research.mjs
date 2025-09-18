// Test script for Deep Research Framework (ES Module)
import { ResearchCoordinatorAgent } from './dist/agents/researchCoordinatorAgent.js';
import { OpenAILLM } from './dist/core/llm.js';
import { InMemoryMemory } from './dist/core/memory.js';
import { ToolRegistry } from './dist/core/toolRegistry.js';
import { Tool } from './dist/core/tool.js';
import { EnhancedSearchTool } from './dist/tools/enhancedSearchTool.js';

async function testDeepResearch() {
  console.log('🧠 Testing Deep Research Framework\n');

  try {
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Please set OPENAI_API_KEY environment variable');
      process.exit(1);
    }

    // Initialize components
    const llm = new OpenAILLM({ 
      model: 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY 
    });
    
    const memory = new InMemoryMemory();
    const toolRegistry = new ToolRegistry();
    
    // Register enhanced search tool properly
    const enhancedSearchTool = new EnhancedSearchTool();
    const searchTool = new Tool({
      name: 'enhanced_search',
      description: 'Enhanced search tool with real-time and semantic search capabilities',
      func: async (input) => {
        console.log(`🔍 Searching for: ${input.query}`);
        return await enhancedSearchTool.search(input.query, input.depth || 'medium');
      }
    });
    toolRegistry.register(searchTool);
    
    // Create the Research Coordinator Agent
    const coordinator = new ResearchCoordinatorAgent({
      llm,
      memory,
      tools: toolRegistry
    });

    // Test query
    const query = {
      query: "artificial intelligence trends 2024",
      depth: "medium",
      strategy: "exploratory",
      focusAreas: ["technology", "business", "research"],
      maxResults: 5,
      context: {
        domain: "technology",
        requiresFactChecking: true,
        isAcademicResearch: false,
        targetAudience: "general"
      }
    };

    console.log(`📋 Testing with query: "${query.query}"`);
    console.log(`🔍 Depth: ${query.depth}`);
    console.log(`📊 Strategy: ${query.strategy}\n`);

    // Set up progress tracking
    coordinator.onProgress((progress) => {
      console.log(`📊 Progress: ${progress.progress}% - ${progress.currentTask}`);
    });

    // Conduct research
    console.log('🚀 Starting research...');
    const session = await coordinator.conductDeepResearch(query);

    // Display results
    console.log('\n✅ Research completed successfully!');
    console.log(`📊 Session ID: ${session.id}`);
    console.log(`📈 Total Results: ${session.metadata.totalResults}`);
    console.log(`🔍 Search Time: ${session.metadata.totalSearchTime}ms`);
    console.log(`💡 Insights Found: ${session.insights.length}\n`);

    // Display insights
    if (session.insights.length > 0) {
      console.log('💡 Key Insights:');
      session.insights.forEach((insight, index) => {
        console.log(`${index + 1}. [${insight.type.toUpperCase()}] ${insight.content}`);
        console.log(`   Confidence: ${insight.confidence}`);
        console.log(`   Sources: ${insight.sources.length} sources`);
        console.log('');
      });
    } else {
      console.log('ℹ️ No insights generated (this might be expected for a simple test)');
    }

    console.log('🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testDeepResearch();
