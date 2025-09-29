#!/usr/bin/env npx tsx

/**
 * Production Deep Research Agent Demo
 * 
 * This demonstrates the full production capabilities of the Deep Research Agent
 * using real APIs and comprehensive analysis.
 */

import { ProductionDeepResearchAgent } from "./app/research/production_deep_research_agent";
import { QualityValidator } from "./app/research/quality_validator";
import { ResearchConfigLoader } from "./app/research/config_loader";
import { log } from "./app/logger";
import fs from "fs";
import path from "path";
import axios from "axios";

// Load configuration from environment
function loadProductionConfig() {
  const env_config = ResearchConfigLoader.load_from_env();
  const production_config = ResearchConfigLoader.create_production_config(env_config);
  
  // Validate configuration
  const validation = ResearchConfigLoader.validate_config(production_config);
  
  if (validation.errors.length > 0) {
    console.error("❌ Configuration Errors:");
    validation.errors.forEach(error => console.error(`- ${error}`));
    throw new Error("Invalid configuration");
  }

  if (validation.warnings.length > 0) {
    console.warn("⚠️  Configuration Warnings:");
    validation.warnings.forEach(warning => console.warn(`- ${warning}`));
  }

  // Log configuration status
  ResearchConfigLoader.log_config_status(production_config);
  
  return production_config;
}

async function production_research_demo() {
  console.log("🏭 Production Deep Research Agent Demo");
  console.log("=" .repeat(50));

  try {
    // Load production configuration
    const production_config = loadProductionConfig();
    
    // Initialize production agent with real configuration
    const agent = new ProductionDeepResearchAgent(production_config);

    console.log(`\n🤖 Agent: ${agent.name} initialized`);

    // Complex research query
    const query = "What are the current environmental and economic impacts of electric vehicle adoption, and what are the projected trends for the next decade?";
    
    console.log(`\n📝 Research Query:`);
    console.log(`"${query}"`);

    console.log(`\n🔍 Starting comprehensive research...`);
    console.log("This may take several minutes as we:");
    console.log("- Search multiple engines and source types");
    console.log("- Scrape and analyze full content");
    console.log("- Cross-validate information");
    console.log("- Generate professional citations");

    // Start research with progress monitoring
    const start_time = Date.now();
    
    // Conduct the research
    const report = await agent.conduct_production_research(query);
    
    const total_time = (Date.now() - start_time) / 1000;

    console.log(`\n✅ Research Completed in ${total_time.toFixed(2)} seconds!`);

    // Display results
    console.log(`\n📊 Research Results:`);
    console.log(`- Title: ${report.title}`);
    console.log(`- Format: ${report.format.toUpperCase()}`);
    console.log(`- Word Count: ${report.metadata.word_count.toLocaleString()}`);
    console.log(`- Total Sources: ${report.metadata.total_sources}`);
    console.log(`- Confidence Score: ${(report.metadata.confidence_score * 100).toFixed(1)}%`);
    console.log(`- Processing Time: ${report.metadata.processing_time.toFixed(2)}s`);
    console.log(`- Sections: ${report.sections.length}`);

    // Get comprehensive metrics
    const comprehensive_metrics = await agent.export_complete_research_package();
    
    console.log(`\n📈 Detailed Metrics:`);
    console.log(`- Search Results: ${comprehensive_metrics.raw_sources.search_results.length}`);
    console.log(`- Scraped Content: ${comprehensive_metrics.raw_sources.scraped_content.length}`);
    console.log(`- Total Words Analyzed: ${comprehensive_metrics.research_data.synthesis?.synthesis_metadata.total_sources || 0}`);
    console.log(`- Insights Generated: ${comprehensive_metrics.research_data.synthesis?.insights.length || 0}`);
    console.log(`- Contradictions Found: ${comprehensive_metrics.research_data.synthesis?.contradictions.length || 0}`);
    console.log(`- Research Gaps Identified: ${comprehensive_metrics.research_data.synthesis?.research_gaps.length || 0}`);

    // Performance analysis
    const performance_report = comprehensive_metrics.performance_report;
    console.log(`\n⚡ Performance Analysis:`);
    console.log(`- Cache Hit Rate: ${(performance_report.performance_metrics.cache_hit_rate * 100).toFixed(1)}%`);
    console.log(`- Memory Usage: ${performance_report.performance_metrics.memory_usage.toFixed(1)}MB`);
    console.log(`- Primary Bottleneck: ${performance_report.bottleneck_analysis.bottleneck}`);
    console.log(`- Optimization Opportunities: ${performance_report.bottleneck_analysis.recommendations.length}`);

    // Quality assessment
    const quality = agent.get_quality_assessment();
    console.log(`\n🎯 Quality Assessment:`);
    console.log(`- Overall Score: ${(quality.overall_score * 100).toFixed(1)}%`);
    console.log(`- Source Quality: ${(quality.source_quality * 100).toFixed(1)}%`);
    console.log(`- Information Density: ${(quality.information_density * 100).toFixed(1)}%`);
    console.log(`- Quality Recommendations: ${quality.recommendations.length}`);

    // Save the report to file
    const output_dir = "./research_outputs";
    if (!fs.existsSync(output_dir)) {
      fs.mkdirSync(output_dir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const report_filename = `research_report_${timestamp}.md`;
    const report_path = path.join(output_dir, report_filename);
    
    fs.writeFileSync(report_path, report.content);
    console.log(`\n💾 Report saved to: ${report_path}`);

    // Generate additional formats
    console.log(`\n📄 Generating additional report formats...`);
    try {
      const additional_reports = await agent.generate_additional_formats(["json", "html", "csv"]);
      
      additional_reports.forEach(additional_report => {
        const filename = `research_report_${timestamp}.${additional_report.format}`;
        const filepath = path.join(output_dir, filename);
        fs.writeFileSync(filepath, additional_report.content);
        console.log(`- ${additional_report.format.toUpperCase()}: ${filepath}`);
      });
    } catch (error) {
      log.warn("Additional format generation failed:", error);
    }

    // Export complete research package
    const package_filename = `research_package_${timestamp}.json`;
    const package_path = path.join(output_dir, package_filename);
    fs.writeFileSync(package_path, JSON.stringify(comprehensive_metrics, null, 2));
    console.log(`- Research Package: ${package_path}`);

    // Quality validation
    console.log(`\n🔍 Running Quality Validation...`);
    const validator = new QualityValidator({
      min_sources_threshold: 10,
      min_authority_threshold: 7,
      min_confidence_threshold: 0.75,
      max_contradiction_rate: 0.15,
    });

    const research_data = agent.export_research_data();
    if (research_data.plan && research_data.synthesis && research_data.citations) {
      try {
        const quality_report = await validator.validate_research({
          research_plan: research_data.plan,
          synthesis: research_data.synthesis,
          citations: research_data.citations,
        });

        console.log(`\n🏆 Quality Validation Results:`);
        console.log(`- Overall Grade: ${quality_report.quality_grade}`);
        console.log(`- Standards Compliance: ${quality_report.meets_standards ? "✅ PASS" : "❌ FAIL"}`);
        console.log(`- Issues Found: ${quality_report.issues.length} (${quality_report.issues.filter(i => i.type === "critical").length} critical)`);
        console.log(`- Strengths Identified: ${quality_report.strengths.length}`);
        console.log(`- Recommendations: ${quality_report.recommendations.length}`);

        // Show sample of the report content
        console.log(`\n📖 Report Preview (first 500 characters):`);
        console.log("-".repeat(50));
        console.log(report.content.substring(0, 500));
        console.log("...");
        console.log("-".repeat(50));

        // Save quality report
        const quality_filename = `quality_report_${timestamp}.json`;
        const quality_path = path.join(output_dir, quality_filename);
        fs.writeFileSync(quality_path, JSON.stringify(quality_report, null, 2));
        console.log(`\n📋 Quality report saved to: ${quality_path}`);

      } catch (error) {
        log.error("Quality validation failed:", error);
        console.log("⚠️  Quality validation could not be completed");
      }
    }

    // Cleanup
    await agent.cleanup();

    console.log(`\n🎉 Production research demo completed successfully!`);
    console.log(`\nAll outputs saved to: ${output_dir}/`);

  } catch (error) {
    console.error("❌ Production demo failed:", error);
    process.exit(1);
  }
}

async function validate_environment() {
  console.log("\n🔧 Environment Validation:");
  console.log("-".repeat(25));

  // Check Node.js version
  const node_version = process.version;
  console.log(`- Node.js: ${node_version} ${node_version >= 'v18.0.0' ? '✅' : '⚠️  (v18+ recommended)'}`);

  // Check available memory
  const memory = process.memoryUsage();
  const available_mb = memory.heapTotal / 1024 / 1024;
  console.log(`- Available Memory: ${available_mb.toFixed(1)}MB ${available_mb > 100 ? '✅' : '⚠️  (100MB+ recommended)'}`);

  // Check for API keys
  const api_keys = {
    'SERPAPI_KEY': !!process.env.SERPAPI_KEY,
    'BING_SEARCH_KEY': !!process.env.BING_SEARCH_KEY,
    'GOOGLE_SEARCH_KEY': !!process.env.GOOGLE_SEARCH_KEY,
    'OPENAI_API_KEY': !!process.env.OPENAI_API_KEY,
  };

  console.log("- API Keys:");
  Object.entries(api_keys).forEach(([key, available]) => {
    console.log(`  ${key}: ${available ? '✅' : '❌'}`);
  });

  // Check internet connectivity
  try {
    await axios.get('https://httpbin.org/status/200', { timeout: 5000 });
    console.log("- Internet Connectivity: ✅");
  } catch {
    console.log("- Internet Connectivity: ❌");
  }

  const all_critical_available = api_keys.OPENAI_API_KEY;
  
  if (!all_critical_available) {
    console.log("\n⚠️  Warning: Some API keys are missing. The demo will use available services only.");
    console.log("For full functionality, set these environment variables:");
    console.log("- OPENAI_API_KEY (required for LLM synthesis)");
    console.log("- SERPAPI_KEY (optional, for enhanced search)");
    console.log("- BING_SEARCH_KEY (optional, for Bing search)");
    console.log("- GOOGLE_SEARCH_KEY + GOOGLE_SEARCH_ENGINE_ID (optional, for Google search)");
  }

  return all_critical_available;
}

async function quick_research_test() {
  console.log("\n⚡ Quick Research Test");
  console.log("-".repeat(25));

  try {
    // Use fast preset configuration
    const env_config = ResearchConfigLoader.load_from_env();
    const fast_config = {
      ...ResearchConfigLoader.create_production_config(env_config),
      ...ResearchConfigLoader.get_preset_config('fast'),
    };
    
    const agent = new ProductionDeepResearchAgent(fast_config);

    const simple_query = "What is machine learning?";
    console.log(`Query: "${simple_query}"`);

    const start = Date.now();
    
    // Get initial progress
    let progress = agent.get_research_progress();
    console.log(`Initial Phase: ${progress.phase}`);

    // This would trigger the full research process
    // For demo purposes, we'll just show the setup
    console.log("✅ Agent initialized and ready for production research");
    console.log(`⏱️  Setup time: ${Date.now() - start}ms`);

    await agent.cleanup();

  } catch (error) {
    console.error("Quick test failed:", error);
  }
}

function show_api_setup_guide() {
  console.log("\n📋 API Setup Guide");
  console.log("=" .repeat(20));

  console.log(`
🔍 SEARCH APIS (Choose one or more):

1. SerpAPI (Recommended for production):
   - Sign up at: https://serpapi.com/
   - Set: export SERPAPI_KEY="your_key_here"
   - Provides: Google, Bing, Yahoo, Baidu results
   - Cost: $50/month for 5,000 searches

2. Bing Search API:
   - Sign up at: https://azure.microsoft.com/en-us/services/cognitive-services/bing-web-search-api/
   - Set: export BING_SEARCH_KEY="your_key_here"
   - Cost: Free tier available (1,000 calls/month)

3. Google Custom Search:
   - Set up at: https://developers.google.com/custom-search/v1/introduction
   - Set: export GOOGLE_SEARCH_KEY="your_key_here"
   - Set: export GOOGLE_SEARCH_ENGINE_ID="your_engine_id"
   - Cost: Free tier available (100 calls/day)

🤖 LLM API (Required):

1. OpenAI (Recommended):
   - Set: export OPENAI_API_KEY="your_key_here"
   - Models: GPT-4, GPT-3.5-turbo
   - Cost: Pay per token

2. Alternative LLM providers can be configured in app/llm.ts

🚀 QUICK START:
1. Set OPENAI_API_KEY for basic functionality
2. Optionally add SERPAPI_KEY for enhanced search
3. Run: npm run production:demo
`);
}

// Main execution
async function main() {
  console.log("🔬 Production Deep Research Agent");
  console.log("Real APIs • Real Analysis • Real Results");
  console.log("=" .repeat(50));

  // Validate environment
  const env_valid = await validate_environment();

  if (!env_valid) {
    show_api_setup_guide();
    console.log("\n⚠️  Demo requires API keys. Please set up APIs and try again.");
    return;
  }

  // Run quick test
  await quick_research_test();

  // Ask user if they want to proceed with full demo
  console.log("\n🎯 Ready for full production demo!");
  console.log("This will perform real web searches and content analysis.");
  console.log("Estimated time: 2-5 minutes depending on query complexity.");
  
  const should_run_full = process.argv.includes('--full') || process.argv.includes('-f');
  
  if (should_run_full) {
    await production_research_demo();
  } else {
    console.log("\n💡 To run full demo: npm run production:demo -- --full");
    console.log("💡 Or: npx tsx production_demo.ts --full");
  }

  console.log("\n📚 Next Steps:");
  console.log("- Check ./research_outputs/ for generated reports");
  console.log("- Review the code in app/research/ for implementation details");
  console.log("- Customize configuration for your specific needs");
  console.log("- Integrate with your applications via the API");
}

// Error handling and cleanup
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Check if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("💥 Production demo failed:", error);
    process.exit(1);
  });
}