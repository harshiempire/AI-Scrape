// src/examples/deepResearchExample.ts
import { ResearchCoordinatorAgent, DeepResearchQuery } from '../agents/researchCoordinatorAgent.js';
import { OpenAILLM } from '../core/llm.js';
import { InMemoryMemory } from '../core/memory.js';
import { ComprehensiveToolRegistry } from '../utils/toolRegistry.js';

async function demonstrateDeepResearch() {
  console.log('🧠 Starting Deep Research Framework Demo\n');

  // Initialize the AI Agents framework
  const llm = new OpenAILLM({ 
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY 
  });
  
  const memory = new InMemoryMemory();
  const toolRegistryManager = new ComprehensiveToolRegistry();
  const toolRegistry = await toolRegistryManager.registerResearchTools();
  
  // Create the Research Coordinator Agent
  const coordinator = new ResearchCoordinatorAgent({
    llm,
    memory,
    tools: toolRegistry
  });

  // Example deep research query
  const query: DeepResearchQuery = {
    query: "AI agents framework implementation best practices",
    depth: "deep",
    strategy: "systematic",
    focusAreas: ["architecture", "performance", "scalability", "testing"],
    maxResults: 20,
    context: {
      domain: "software_development",
      requiresFactChecking: true,
      isAcademicResearch: false,
      targetAudience: "developers"
    }
  };

  try {
    console.log(`📋 Deep Research Query: ${query.query}`);
    console.log(`🔍 Depth: ${query.depth}`);
    console.log(`📊 Strategy: ${query.strategy}`);
    console.log(`🎯 Focus Areas: ${query.focusAreas?.join(', ')}`);
    console.log(`🌐 Context: ${JSON.stringify(query.context)}\n`);

    // Set up progress tracking
    coordinator.onProgress((progress) => {
      console.log(`📊 Progress [${progress.step}]: ${progress.progress}% - ${progress.currentTask}`);
      if (progress.urlsProcessed.length > 0) {
        console.log(`   📄 URLs Processed: ${progress.urlsProcessed.length}/${progress.urlsTotal}`);
      }
      if (progress.insightsFound > 0) {
        console.log(`   💡 Insights Found: ${progress.insightsFound}`);
      }
      if (progress.estimatedTimeRemaining) {
        console.log(`   ⏱️  Estimated Time Remaining: ${Math.ceil(progress.estimatedTimeRemaining / 60)} minutes`);
      }
      console.log('');
    });

    // Conduct deep research
    console.log('🚀 Starting Deep Research Process...\n');
    const session = await coordinator.conductDeepResearch(query);

    // Display comprehensive results
    console.log('📊 Deep Research Session Results:');
    console.log(`Session ID: ${session.id}`);
    console.log(`Total Research Time: ${session.metadata.totalSearchTime}ms`);
    console.log(`Total Results: ${session.metadata.totalResults}`);
    console.log(`Vector DB Documents: ${session.metadata.vectorDBCount}\n`);

    // Display search results
    console.log('🔗 Search Results Summary:');
    session.results.forEach((result, index) => {
      console.log(`Search ${index + 1}:`);
      console.log(`  Real-time Results: ${result.metadata.totalRealTimeResults}`);
      console.log(`  Semantic Results: ${result.metadata.totalSemanticResults}`);
      console.log(`  Search Time: ${result.metadata.searchTime}ms`);
      console.log(`  Fused Results: ${result.fusedResults.length}`);
      console.log('');
    });

    // Display top fused results
    console.log('🔗 Top Fused Results (Top 5):');
    const allFusedResults = session.results.flatMap(r => r.fusedResults);
    allFusedResults
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 5)
      .forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   Source: ${result.source}`);
        console.log(`   Quality Score: ${result.qualityScore?.toFixed(2) || 'N/A'}`);
        console.log(`   Relevance Score: ${result.relevanceScore?.toFixed(2) || 'N/A'}`);
        console.log(`   Content Preview: ${result.content.substring(0, 50)}...\n`);
      });

    // Display insights
    console.log('💡 Generated Insights:');
    session.insights.forEach((insight, index) => {
      console.log(`${index + 1}. [${insight.type.toUpperCase()}] ${insight.content}`);
      console.log(`   Confidence: ${insight.confidence}`);
      console.log(`   Tags: ${insight.tags.join(', ')}`);
      console.log(`   Sources: ${insight.sources.length} sources`);
      if ((insight as any).evidence && (insight as any).evidence.length > 0) {
        console.log(`   Evidence: ${(insight as any).evidence.length} pieces of evidence`);
      }
      console.log('');
    });

    // Display research quality metrics
    console.log('📈 Research Quality Metrics:');
    const avgConfidence = session.insights.reduce((sum, insight) => sum + insight.confidence, 0) / session.insights.length;
    console.log(`Average Insight Confidence: ${avgConfidence.toFixed(2)}`);
    console.log(`Total Insights Generated: ${session.insights.length}`);
    console.log(`Source Diversity: ${new Set(allFusedResults.map(r => r.metadata?.domain)).size} unique domains`);
    console.log(`Content Types: ${new Set(allFusedResults.map(r => r.metadata?.contentType)).size} different types\n`);

    // Display session metadata
    console.log('📋 Session Metadata:');
    console.log(`Created: ${session.metadata.createdAt.toISOString()}`);
    console.log(`Total Queries: ${session.queries.length}`);
    console.log(`Research Depth: ${query.depth}`);
    console.log(`Strategy Used: ${query.strategy}\n`);

    // Demonstrate session persistence
    console.log('💾 Testing Session Persistence...');
    const activeSessions = await coordinator.getActiveSessions();
    console.log(`Active Sessions: ${activeSessions.length}`);
    
    if (activeSessions.length > 0) {
      console.log('✅ Session successfully stored in memory');
      console.log(`Session ID: ${activeSessions[0].id}`);
    }

    console.log('\n🎉 Deep Research Framework Demo completed successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('✅ Multi-agent orchestration');
    console.log('✅ Real-time progress tracking');
    console.log('✅ Comprehensive data collection');
    console.log('✅ Advanced analysis and synthesis');
    console.log('✅ Session persistence');
    console.log('✅ Quality metrics and validation');

  } catch (error) {
    console.error('❌ Deep Research failed:', error);
    console.error('Stack trace:', (error as Error).stack);
  }
}

// Additional demonstration functions
async function demonstrateResearchStrategies() {
  console.log('\n🔬 Demonstrating Different Research Strategies\n');

  const llm = new OpenAILLM({ 
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY 
  });
  
  const memory = new InMemoryMemory();
  const toolRegistryManager = new ComprehensiveToolRegistry();
  const toolRegistry = await toolRegistryManager.registerResearchTools();
  
  const coordinator = new ResearchCoordinatorAgent({
    llm,
    memory,
    tools: toolRegistry
  });

  const strategies = ['exploratory', 'systematic', 'comparative', 'trend_analysis'];
  
  for (const strategy of strategies) {
    console.log(`📊 Testing ${strategy} strategy...`);
    
    const query: DeepResearchQuery = {
      query: "machine learning frameworks comparison",
      depth: "medium",
      strategy: strategy as any,
      maxResults: 10
    };

    try {
      const session = await coordinator.conductDeepResearch(query);
      console.log(`✅ ${strategy} strategy completed: ${session.insights.length} insights generated\n`);
    } catch (error) {
      console.error(`❌ ${strategy} strategy failed:`, (error as Error).message);
    }
  }
}

async function demonstrateProgressTracking() {
  console.log('\n📊 Demonstrating Real-Time Progress Tracking\n');

  const llm = new OpenAILLM({ 
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY 
  });
  
  const memory = new InMemoryMemory();
  const toolRegistryManager = new ComprehensiveToolRegistry();
  const toolRegistry = await toolRegistryManager.registerResearchTools();
  
  const coordinator = new ResearchCoordinatorAgent({
    llm,
    memory,
    tools: toolRegistry
  });

  // Set up detailed progress tracking
  coordinator.onProgress((progress) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${progress.step.toUpperCase()}: ${progress.progress}%`);
    console.log(`  Task: ${progress.currentTask}`);
    console.log(`  URLs: ${progress.urlsProcessed.length}/${progress.urlsTotal}`);
    console.log(`  Insights: ${progress.insightsFound}`);
    if (progress.estimatedTimeRemaining) {
      console.log(`  ETA: ${Math.ceil(progress.estimatedTimeRemaining / 60)} min`);
    }
    console.log('');
  });

  const query: DeepResearchQuery = {
    query: "artificial intelligence trends 2024",
    depth: "deep",
    strategy: "trend_analysis",
    maxResults: 15
  };

  try {
    const session = await coordinator.conductDeepResearch(query);
    console.log(`✅ Progress tracking demo completed: ${session.insights.length} insights\n`);
  } catch (error) {
    console.error('❌ Progress tracking demo failed:', (error as Error).message);
  }
}

// Run the demos
if (process.argv[1] && (process.argv[1].endsWith('deepResearchExample.ts') || process.argv[1].endsWith('deepResearchExample.js'))) {
  const args = process.argv.slice(2);
  
  if (args.includes('--strategies')) {
    demonstrateResearchStrategies()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ Strategies demo failed:', error);
        process.exit(1);
      });
  } else if (args.includes('--progress')) {
    demonstrateProgressTracking()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ Progress demo failed:', error);
        process.exit(1);
      });
  } else {
    demonstrateDeepResearch()
      .then(() => {
        console.log('\n🚀 Additional demos available:');
        console.log('  --strategies  : Test different research strategies');
        console.log('  --progress    : Demonstrate progress tracking');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Demo failed:', error);
        process.exit(1);
      });
  }
}

export { 
  demonstrateDeepResearch, 
  demonstrateResearchStrategies, 
  demonstrateProgressTracking 
};
