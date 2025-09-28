#!/usr/bin/env npx tsx

/**
 * Simple Demo of Deep Research Agent
 * 
 * This demonstrates the basic functionality of the Deep Research Agent
 * with mock data to show the complete research workflow.
 */

import { DeepResearchAgent, ResearchUtils } from "./app/research";
import { log } from "./app/logger";

async function main() {
  console.log("🔬 Deep Research Agent Demo");
  console.log("=" .repeat(50));

  try {
    // Validate a research query
    const query = "What are the environmental impacts of electric vehicles compared to traditional cars?";
    console.log(`\n📝 Research Query: ${query}`);

    const validation = ResearchUtils.validateQuery(query);
    console.log(`✅ Query Validation: ${validation.valid ? 'VALID' : 'INVALID'}`);
    if (validation.issues.length > 0) {
      console.log(`⚠️  Issues: ${validation.issues.join(', ')}`);
    }
    if (validation.suggestions.length > 0) {
      console.log(`💡 Suggestions: ${validation.suggestions.join(', ')}`);
    }

    // Estimate complexity
    const complexity = ResearchUtils.estimateComplexity(query);
    console.log(`\n📊 Complexity Analysis:`);
    console.log(`- Complexity Level: ${complexity.complexity.toUpperCase()}`);
    console.log(`- Estimated Time: ${complexity.estimated_time} minutes`);
    console.log(`- Recommended Sources: ${complexity.recommended_sources}`);

    // Initialize agent with appropriate configuration
    const agent = new DeepResearchAgent({
      name: "DemoResearcher",
      max_sources_per_subquery: complexity.recommended_sources,
      confidence_threshold: 0.7,
      citation_style: "apa",
      parallel_processing: true,
    });

    console.log(`\n🤖 Agent Initialized: ${agent.name}`);

    // Show initial progress
    let progress = agent.get_research_progress();
    console.log(`\n📈 Initial Progress:`);
    console.log(`- Phase: ${progress.phase}`);
    console.log(`- Completion: ${progress.completion_percentage.toFixed(1)}%`);

    // Get quality assessment
    const quality = agent.get_quality_assessment();
    console.log(`\n🎯 Quality Assessment:`);
    console.log(`- Overall Score: ${(quality.overall_score * 100).toFixed(1)}%`);
    console.log(`- Source Quality: ${(quality.source_quality * 100).toFixed(1)}%`);
    console.log(`- Recommendations: ${quality.recommendations.length}`);

    // Show research summary
    const summary = agent.get_research_summary();
    console.log(`\n📋 Research Summary:`);
    console.log(summary);

    // Export research data structure (will be empty initially)
    const researchData = agent.export_research_data();
    console.log(`\n📤 Research Data Export:`);
    console.log(`- Plan: ${researchData.plan ? 'Available' : 'Not yet created'}`);
    console.log(`- Synthesis: ${researchData.synthesis ? 'Available' : 'Not yet created'}`);
    console.log(`- Citations: ${researchData.citations ? 'Available' : 'Not yet created'}`);
    console.log(`- Memory State: ${researchData.memory_state ? 'Available' : 'Not available'}`);

    console.log(`\n✨ Demo completed successfully!`);
    console.log(`\n📚 Next Steps:`);
    console.log(`- Run 'npm run research:example' for full examples`);
    console.log(`- Run 'npm test' to execute test suite`);
    console.log(`- Check README.md for detailed documentation`);

  } catch (error) {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  }
}

// Configuration examples
function showConfigurationExamples() {
  console.log("\n⚙️ Available Configurations:");
  console.log("-".repeat(30));

  const configs = {
    "Fast Research": ResearchUtils.createFastConfig(),
    "Thorough Research": ResearchUtils.createThoroughConfig(),
    "Academic Research": ResearchUtils.createAcademicConfig(),
    "Business Intelligence": ResearchUtils.createBusinessConfig(),
  };

  Object.entries(configs).forEach(([name, config]) => {
    console.log(`\n${name}:`);
    console.log(`  - Max Sources: ${config.max_sources_per_subquery}`);
    console.log(`  - Confidence Threshold: ${(config.confidence_threshold * 100).toFixed(0)}%`);
    console.log(`  - Citation Style: ${config.citation_style.toUpperCase()}`);
    console.log(`  - Parallel Processing: ${config.parallel_processing ? 'Enabled' : 'Disabled'}`);
  });
}

// Check if this is the main module (ES module equivalent)
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      showConfigurationExamples();
      console.log("\n🎉 Deep Research Agent is ready for use!");
    })
    .catch((error) => {
      console.error("💥 Demo execution failed:", error);
      process.exit(1);
    });
}