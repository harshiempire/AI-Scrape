#!/usr/bin/env npx tsx

/**
 * Deep Research Agent Example
 * 
 * This example demonstrates how to use the DeepResearchAgent for comprehensive
 * research following industry standards. It shows various research scenarios
 * and how to configure the agent for different use cases.
 */

import { DeepResearchAgent } from "../app/research/deep_research_agent";
import { QualityValidator } from "../app/research/quality_validator";
import { LLM } from "../app/llm";
import { log } from "../app/logger";

async function main() {
  console.log("🔬 Deep Research Agent Example");
  console.log("=" .repeat(50));

  // Example 1: Basic Research Query
  await example_basic_research();

  // Example 2: Complex Multi-faceted Research
  await example_complex_research();

  // Example 3: Research with Quality Validation
  await example_research_with_validation();

  // Example 4: Multiple Report Formats
  await example_multiple_formats();

  // Example 5: Research Progress Monitoring
  await example_progress_monitoring();
}

async function example_basic_research() {
  console.log("\n📚 Example 1: Basic Research Query");
  console.log("-".repeat(30));

  try {
    // Initialize the research agent
    const agent = new DeepResearchAgent({
      name: "BasicResearcher",
      max_sources_per_subquery: 5,
      confidence_threshold: 0.6,
      citation_style: "apa",
    });

    // Conduct research on a straightforward topic
    const query = "What are the benefits and risks of artificial intelligence in healthcare?";
    console.log(`Query: ${query}`);

    const report = await agent.conduct_research(query);

    console.log("\n✅ Research Results:");
    console.log(`- Title: ${report.title}`);
    console.log(`- Word Count: ${report.metadata.word_count}`);
    console.log(`- Sources: ${report.metadata.total_sources}`);
    console.log(`- Confidence: ${(report.metadata.confidence_score * 100).toFixed(1)}%`);
    console.log(`- Processing Time: ${report.metadata.processing_time.toFixed(2)}s`);

    // Show research summary
    const summary = agent.get_research_summary();
    console.log("\n📋 Research Summary:");
    console.log(summary);

  } catch (error) {
    console.error("❌ Basic research failed:", error);
  }
}

async function example_complex_research() {
  console.log("\n🧠 Example 2: Complex Multi-faceted Research");
  console.log("-".repeat(40));

  try {
    // Configure for complex research
    const agent = new DeepResearchAgent({
      name: "ComplexResearcher",
      max_sources_per_subquery: 15,
      max_scraping_depth: 10,
      confidence_threshold: 0.8,
      parallel_processing: true,
      citation_style: "ieee",
    });

    // Complex research query requiring multiple perspectives
    const query = "Analyze the economic, environmental, and social impacts of renewable energy transition in developing countries, including policy recommendations and implementation challenges";
    console.log(`Query: ${query}`);

    const report = await agent.conduct_research(query);

    console.log("\n✅ Complex Research Results:");
    console.log(`- Sections: ${report.sections.length}`);
    console.log(`- Total Sources: ${report.metadata.total_sources}`);
    console.log(`- Confidence Score: ${(report.metadata.confidence_score * 100).toFixed(1)}%`);

    // Show quality assessment
    const quality = agent.get_quality_assessment();
    console.log("\n🎯 Quality Assessment:");
    console.log(`- Overall Score: ${(quality.overall_score * 100).toFixed(1)}%`);
    console.log(`- Source Quality: ${(quality.source_quality * 100).toFixed(1)}%`);
    console.log(`- Information Density: ${(quality.information_density * 100).toFixed(1)}%`);
    console.log(`- Recommendations: ${quality.recommendations.length}`);

  } catch (error) {
    console.error("❌ Complex research failed:", error);
  }
}

async function example_research_with_validation() {
  console.log("\n🔍 Example 3: Research with Quality Validation");
  console.log("-".repeat(42));

  try {
    const agent = new DeepResearchAgent({
      name: "ValidatedResearcher",
      confidence_threshold: 0.75,
    });

    const validator = new QualityValidator({
      min_sources_threshold: 8,
      min_authority_threshold: 7,
      min_confidence_threshold: 0.75,
    });

    const query = "What are the latest developments in quantum computing and their potential applications?";
    console.log(`Query: ${query}`);

    // Conduct research
    const report = await agent.conduct_research(query);
    
    // Export research data for validation
    const research_data = agent.export_research_data();
    
    if (research_data.plan && research_data.synthesis && research_data.citations) {
      // Validate research quality
      const quality_report = await validator.validate_research({
        research_plan: research_data.plan,
        synthesis: research_data.synthesis,
        citations: research_data.citations,
      });

      console.log("\n🏆 Quality Validation Results:");
      console.log(`- Overall Grade: ${quality_report.quality_grade}`);
      console.log(`- Standards Compliance: ${quality_report.meets_standards ? "✅ PASS" : "❌ FAIL"}`);
      console.log(`- Issues Found: ${quality_report.issues.length}`);
      console.log(`- Strengths: ${quality_report.strengths.length}`);

      // Show detailed quality summary
      const quality_summary = validator.generate_quality_summary(quality_report);
      console.log("\n📊 Detailed Quality Summary:");
      console.log(quality_summary);

      // Auto-fix issues if possible
      if (quality_report.issues.length > 0) {
        const fix_result = await validator.auto_fix_issues(quality_report.issues, {
          research_plan: research_data.plan,
          synthesis: research_data.synthesis,
          citations: research_data.citations,
        });
        
        console.log(`\n🔧 Auto-fix Results:`);
        console.log(`- Fixed Issues: ${fix_result.fixed_issues.length}`);
        console.log(`- Remaining Issues: ${fix_result.remaining_issues.length}`);
      }
    }

  } catch (error) {
    console.error("❌ Validated research failed:", error);
  }
}

async function example_multiple_formats() {
  console.log("\n📄 Example 4: Multiple Report Formats");
  console.log("-".repeat(35));

  try {
    const agent = new DeepResearchAgent({
      name: "MultiFormatResearcher",
    });

    const query = "What are the key trends in sustainable technology for 2024?";
    console.log(`Query: ${query}`);

    // Conduct research
    await agent.conduct_research(query);

    // Generate reports in multiple formats
    const formats = ["json", "markdown", "html", "csv"] as const;
    const reports = await agent.generate_additional_formats(formats);

    console.log("\n📑 Generated Report Formats:");
    reports.forEach(report => {
      console.log(`- ${report.format.toUpperCase()}: ${report.metadata.word_count} words, ${report.sections.length} sections`);
    });

    // Show sample of markdown report
    const markdown_report = reports.find(r => r.format === "markdown");
    if (markdown_report) {
      console.log("\n📝 Markdown Report Sample (first 500 chars):");
      console.log(markdown_report.content.substring(0, 500) + "...");
    }

  } catch (error) {
    console.error("❌ Multiple formats generation failed:", error);
  }
}

async function example_progress_monitoring() {
  console.log("\n⏱️ Example 5: Research Progress Monitoring");
  console.log("-".repeat(38));

  try {
    const agent = new DeepResearchAgent({
      name: "MonitoredResearcher",
      max_sources_per_subquery: 8,
    });

    const query = "Analyze the impact of remote work on productivity and employee satisfaction";
    console.log(`Query: ${query}`);

    // Start research (this would normally be done with real-time monitoring)
    console.log("\n🚀 Starting research...");
    
    // Simulate progress monitoring
    const progress_intervals = [
      { phase: "planning", progress: 10, message: "Creating research plan..." },
      { phase: "searching", progress: 30, message: "Searching for sources..." },
      { phase: "scraping", progress: 60, message: "Extracting content..." },
      { phase: "synthesis", progress: 80, message: "Synthesizing information..." },
      { phase: "reporting", progress: 95, message: "Generating report..." },
      { phase: "completed", progress: 100, message: "Research completed!" },
    ];

    for (const interval of progress_intervals) {
      console.log(`📊 ${interval.phase.toUpperCase()}: ${interval.progress}% - ${interval.message}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
    }

    // Actually conduct the research
    const report = await agent.conduct_research(query);

    // Show final progress
    const final_progress = agent.get_research_progress();
    console.log("\n✅ Final Progress Report:");
    console.log(`- Phase: ${final_progress.phase}`);
    console.log(`- Completion: ${final_progress.completion_percentage.toFixed(1)}%`);
    console.log(`- Subqueries: ${final_progress.completed_subqueries}/${final_progress.total_subqueries}`);
    console.log(`- Sources: ${final_progress.sources_discovered}`);
    console.log(`- Insights: ${final_progress.insights_validated}`);

  } catch (error) {
    console.error("❌ Progress monitoring failed:", error);
  }
}

// Utility function to demonstrate different research configurations
function show_configuration_examples() {
  console.log("\n⚙️ Configuration Examples:");
  console.log("-".repeat(25));

  console.log("\n1. Fast Research (speed-optimized):");
  console.log(`new DeepResearchAgent({
  max_sources_per_subquery: 5,
  max_scraping_depth: 3,
  confidence_threshold: 0.6,
  parallel_processing: true,
})`);

  console.log("\n2. Thorough Research (quality-optimized):");
  console.log(`new DeepResearchAgent({
  max_sources_per_subquery: 20,
  max_scraping_depth: 15,
  confidence_threshold: 0.85,
  parallel_processing: true,
  citation_style: "apa",
})`);

  console.log("\n3. Academic Research:");
  console.log(`new DeepResearchAgent({
  max_sources_per_subquery: 15,
  confidence_threshold: 0.8,
  citation_style: "ieee",
  search_engines: ["google", "bing"],
})`);

  console.log("\n4. Business Intelligence:");
  console.log(`new DeepResearchAgent({
  max_sources_per_subquery: 12,
  confidence_threshold: 0.7,
  citation_style: "chicago",
  parallel_processing: true,
})`);
}

// Run examples if this file is executed directly
if (require.main === module) {
  main()
    .then(() => {
      show_configuration_examples();
      console.log("\n🎉 All examples completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Example execution failed:", error);
      process.exit(1);
    });
}

export {
  example_basic_research,
  example_complex_research,
  example_research_with_validation,
  example_multiple_formats,
  example_progress_monitoring,
};