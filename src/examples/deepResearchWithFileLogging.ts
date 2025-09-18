// src/examples/deepResearchWithFileLogging.ts
import { ResearchCoordinatorAgent, DeepResearchQuery } from '../agents/researchCoordinatorAgent.js';
import { OpenAILLM } from '../core/llm.js';
import { InMemoryMemory } from '../core/memory.js';
import { ComprehensiveToolRegistry } from '../utils/toolRegistry.js';
import { FileLogger } from '../utils/fileLogger.js';

async function demonstrateDeepResearchWithFileLogging() {
  // Initialize file logger
  const logger = new FileLogger();
  logger.startLogging();
  
  console.log('🧠 Starting Deep Research Framework Demo with File Logging\n');
  console.log(`📝 Logging to: ${logger.getLogFilePath()}\n`);

  let query: DeepResearchQuery | undefined;

  try {
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
    query = {
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

    console.log(`📋 Deep Research Query: ${query.query}`);
    console.log(`🔍 Depth: ${query.depth}`);
    console.log(`📊 Strategy: ${query.strategy}`);
    console.log(`🎯 Focus Areas: ${query.focusAreas?.join(', ')}`);
    console.log(`🌐 Context: ${JSON.stringify(query.context)}\n`);

    // Set up progress tracking with file logging
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

    // Write comprehensive research summary to file
    logger.writeResearchSummary(session, query);

    console.log('\n🎉 Deep Research Framework Demo completed successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('✅ Multi-agent orchestration');
    console.log('✅ Real-time progress tracking');
    console.log('✅ Comprehensive data collection');
    console.log('✅ Advanced analysis and synthesis');
    console.log('✅ Session persistence');
    console.log('✅ Quality metrics and validation');
    console.log('✅ Complete file logging');

    console.log(`\n📝 Complete research log saved to: ${logger.getLogFilePath()}`);

  } catch (error) {
    console.error('❌ Deep Research failed:', error);
    console.error('Stack trace:', (error as Error).stack);
    
    // Write error report to file
    logger.writeErrorReport(error as Error, { query: query });
  } finally {
    // Stop file logging
    logger.stopLogging();
  }
}

// Enhanced demonstration with multiple queries and file logging
async function demonstrateMultipleResearchSessions() {
  const logger = new FileLogger();
  logger.startLogging();
  
  console.log('🧠 Starting Multiple Research Sessions Demo with File Logging\n');
  console.log(`📝 Logging to: ${logger.getLogFilePath()}\n`);

  try {
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

    const queries: DeepResearchQuery[] = [
      {
        query: "AI agents framework implementation best practices",
        depth: "deep",
        strategy: "systematic",
        focusAreas: ["architecture", "performance", "scalability"],
        maxResults: 15
      },
      {
        query: "machine learning model deployment strategies",
        depth: "medium",
        strategy: "comparative",
        focusAreas: ["deployment", "monitoring", "scaling"],
        maxResults: 10
      },
      {
        query: "cloud computing trends 2024",
        depth: "shallow",
        strategy: "trend_analysis",
        focusAreas: ["trends", "adoption", "future"],
        maxResults: 8
      }
    ];

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(`\n🔬 Research Session ${i + 1}/${queries.length}: ${query.query}`);
      console.log(`📊 Strategy: ${query.strategy}, Depth: ${query.depth}\n`);

      try {
        const session = await coordinator.conductDeepResearch(query);
        
        console.log(`✅ Session ${i + 1} completed:`);
        console.log(`   Insights: ${session.insights.length}`);
        console.log(`   Results: ${session.results.length}`);
        console.log(`   Time: ${session.metadata.totalSearchTime}ms\n`);

        // Write each session summary to file
        logger.writeResearchSummary(session, query);

      } catch (error) {
        console.error(`❌ Session ${i + 1} failed:`, (error as Error).message);
        logger.writeErrorReport(error as Error, { sessionNumber: i + 1, query });
      }
    }

    console.log(`\n📝 All research sessions logged to: ${logger.getLogFilePath()}`);

  } catch (error) {
    console.error('❌ Multiple sessions demo failed:', error);
    logger.writeErrorReport(error as Error);
  } finally {
    logger.stopLogging();
  }
}

// Run the demos
if (process.argv[1] && (process.argv[1].endsWith('deepResearchWithFileLogging.ts') || process.argv[1].endsWith('deepResearchWithFileLogging.js'))) {
  const args = process.argv.slice(2);
  
  if (args.includes('--multiple')) {
    demonstrateMultipleResearchSessions()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ Multiple sessions demo failed:', error);
        process.exit(1);
      });
  } else {
    demonstrateDeepResearchWithFileLogging()
      .then(() => {
        console.log('\n🚀 Additional demos available:');
        console.log('  --multiple  : Run multiple research sessions');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Demo failed:', error);
        process.exit(1);
      });
  }
}

export { 
  demonstrateDeepResearchWithFileLogging, 
  demonstrateMultipleResearchSessions 
};
