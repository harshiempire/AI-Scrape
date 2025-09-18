#!/usr/bin/env node
// deep-research-logger.js
import { FileLogger } from './dist/utils/fileLogger.js';
import { ResearchCoordinatorAgent } from './dist/agents/researchCoordinatorAgent.js';
import { OpenAILLM } from './dist/core/llm.js';
import { InMemoryMemory } from './dist/core/memory.js';
import { ComprehensiveToolRegistry } from './dist/utils/toolRegistry.js';

async function runDeepResearchWithLogging(queryText, options = {}) {
  // Initialize file logger
  const logger = new FileLogger();
  logger.startLogging();
  
  console.log('🧠 Starting Deep Research with Complete File Logging\n');
  console.log(`📝 Logging to: ${logger.getLogFilePath()}\n`);

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

    // Create research query
    const query = {
      query: queryText,
      depth: options.depth || "deep",
      strategy: options.strategy || "systematic",
      focusAreas: options.focusAreas || ["architecture", "performance", "scalability"],
      maxResults: options.maxResults || 15,
      context: options.context || {
        domain: "software_development",
        requiresFactChecking: true,
        isAcademicResearch: false,
        targetAudience: "developers"
      }
    };

    console.log(`📋 Research Query: ${query.query}`);
    console.log(`🔍 Depth: ${query.depth}`);
    console.log(`📊 Strategy: ${query.strategy}`);
    console.log(`🎯 Focus Areas: ${query.focusAreas?.join(', ')}\n`);

    // Set up progress tracking
    coordinator.onProgress((progress) => {
      console.log(`📊 Progress [${progress.step}]: ${progress.progress}% - ${progress.currentTask}`);
      if (progress.urlsProcessed.length > 0) {
        console.log(`   📄 URLs Processed: ${progress.urlsProcessed.length}/${progress.urlsTotal}`);
      }
      if (progress.insightsFound > 0) {
        console.log(`   💡 Insights Found: ${progress.insightsFound}`);
      }
      console.log('');
    });

    // Conduct deep research
    console.log('🚀 Starting Deep Research Process...\n');
    const session = await coordinator.conductDeepResearch(query);

    // Display results summary
    console.log('📊 Research Session Results:');
    console.log(`Session ID: ${session.id}`);
    console.log(`Total Research Time: ${session.metadata.totalSearchTime}ms`);
    console.log(`Total Results: ${session.metadata.totalResults}`);
    console.log(`Total Insights: ${session.insights.length}\n`);

    // Display top insights
    console.log('💡 Generated Insights:');
    session.insights.forEach((insight, index) => {
      console.log(`${index + 1}. [${insight.type.toUpperCase()}] ${insight.content}`);
      console.log(`   Confidence: ${insight.confidence}`);
      console.log(`   Sources: ${insight.sources.length} sources\n`);
    });

    // Write comprehensive research summary to file
    logger.writeResearchSummary(session, query);

    console.log('🎉 Deep Research completed successfully!');
    console.log(`📝 Complete research log saved to: ${logger.getLogFilePath()}`);

    return { session, logFilePath: logger.getLogFilePath() };

  } catch (error) {
    console.error('❌ Deep Research failed:', error);
    
    // Write error report to file
    logger.writeErrorReport(error, { query: queryText, options });
    
    throw error;
  } finally {
    // Stop file logging
    logger.stopLogging();
  }
}

// Command line interface
if (process.argv[1] && process.argv[1].endsWith('deep-research-logger.js')) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node deep-research-logger.js "your research query" [options]');
    console.log('\nExamples:');
    console.log('  node deep-research-logger.js "AI agents framework implementation best practices"');
    console.log('  node deep-research-logger.js "machine learning deployment strategies" --depth=medium');
    console.log('  node deep-research-logger.js "cloud computing trends 2024" --strategy=trend_analysis');
    process.exit(0);
  }

  const queryText = args[0];
  const options = {};
  
  // Parse command line options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--depth=')) {
      options.depth = arg.split('=')[1];
    } else if (arg.startsWith('--strategy=')) {
      options.strategy = arg.split('=')[1];
    } else if (arg.startsWith('--maxResults=')) {
      options.maxResults = parseInt(arg.split('=')[1]);
    }
  }

  runDeepResearchWithLogging(queryText, options)
    .then(({ session, logFilePath }) => {
      console.log(`\n✅ Research completed! Log file: ${logFilePath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Research failed:', error.message);
      process.exit(1);
    });
}

export { runDeepResearchWithLogging };
