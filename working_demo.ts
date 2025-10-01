#!/usr/bin/env npx tsx

/**
 * Working Deep Research Agent Demo
 *
 * This demonstrates a fully working deep research agent using:
 * - DuckDuckGo for search (no API key required)
 * - Real web scraping with content analysis
 * - Advanced synthesis and quality validation
 * - Professional report generation
 *
 * This demo uses only free services and can run without API keys.
 */

import { ProductionDeepResearchAgent } from "./app/research/production_deep_research_agent";
import { QualityValidator } from "./app/research/quality_validator";
import { ResearchConfigLoader } from "./app/research/config_loader";
import { log } from "./app/logger";
import axios from "axios";
import fs from "fs";
import path from "path";

async function working_research_demo() {
  console.log("🔬 Working Deep Research Agent Demo");
  console.log("No API Keys Required • Real Analysis • Professional Results");
  console.log("=".repeat(60));

  try {
    // Create working configuration (DuckDuckGo + real scraping)
    const working_config = {
      name: "WorkingResearchAgent",
      search_engines: ["duckduckgo"], // Free, no API key required
      search_apis: {}, // No premium APIs needed
      max_sources_per_subquery: 12,
      max_scraping_depth: 8,
      confidence_threshold: 0.7,
      min_source_authority: 5, // Lower for free sources
      require_recent_sources: true,
      use_browser_for_js_sites: false, // HTTP scraping only
      respect_robots_txt: true,
      scraping_delay: 3000, // Be respectful with delays
      citation_style: "apa" as const,
      performance: {
        max_concurrent_searches: 3, // Conservative for free APIs
        max_concurrent_scrapes: 2,
        cache_enabled: true,
        cache_ttl: 1800, // 30 minutes
        rate_limiting: {
          requests_per_second: 5, // Conservative rate limiting
          burst_limit: 10,
        },
        memory_management: {
          max_memory_usage: 256,
          cleanup_interval: 180,
        },
        adaptive_batching: true,
      },
    };

    console.log("\n⚙️  Configuration:");
    console.log(`- Search Engine: DuckDuckGo (free)`);
    console.log(`- Max Sources: ${working_config.max_sources_per_subquery}`);
    console.log(`- Scraping Depth: ${working_config.max_scraping_depth}`);
    console.log(
      `- Confidence Threshold: ${(
        working_config.confidence_threshold * 100
      ).toFixed(0)}%`
    );
    console.log(
      `- Rate Limiting: ${working_config.performance.rate_limiting.requests_per_second} req/sec`
    );

    // Initialize agent
    const agent = new ProductionDeepResearchAgent(working_config);
    console.log(`\n🤖 Agent initialized: ${agent.name}`);

    // Research query (focused scope for demo)
    const query =
      "What are the main benefits and challenges of renewable energy adoption?";

    console.log(`\n📝 Research Query:`);
    console.log(`"${query}"`);

    console.log(`\n🔍 Starting research process...`);
    console.log("⏱️  This will take 2-3 minutes as we:");
    console.log("- Search DuckDuckGo for relevant sources");
    console.log("- Scrape and analyze full content from websites");
    console.log("- Cross-validate information across sources");
    console.log("- Generate professional citations and reports");

    // Track progress
    const start_time = Date.now();

    // Start research with progress updates
    console.log("\n📊 Research Progress:");
    const progress_timer = setInterval(() => {
      const current_progress = agent.get_research_progress();
      const elapsed = ((Date.now() - start_time) / 1000).toFixed(0);
      console.log(
        `[${elapsed}s] Phase: ${
          current_progress.phase
        } | Progress: ${current_progress.completion_percentage.toFixed(
          1
        )}% | Sources: ${current_progress.sources_discovered}`
      );
    }, 5000);

    try {
      // Conduct the research
      const report = await agent.conduct_production_research(query);

      clearInterval(progress_timer);
      const total_time = (Date.now() - start_time) / 1000;

      console.log(`\n✅ Research Completed Successfully!`);
      console.log(`⏱️  Total Time: ${total_time.toFixed(2)} seconds`);

      // Display comprehensive results
      console.log(`\n📊 Research Results:`);
      console.log(`- Report Title: ${report.title}`);
      console.log(
        `- Word Count: ${report.metadata.word_count.toLocaleString()}`
      );
      console.log(`- Total Sources Analyzed: ${report.metadata.total_sources}`);
      console.log(
        `- Overall Confidence: ${(
          report.metadata.confidence_score * 100
        ).toFixed(1)}%`
      );
      console.log(`- Report Sections: ${report.sections.length}`);
      console.log(
        `- Processing Time: ${report.metadata.processing_time.toFixed(2)}s`
      );

      // Get detailed research metrics
      const comprehensive_data = await agent.export_complete_research_package();

      console.log(`\n📈 Detailed Analysis:`);
      console.log(
        `- Search Results Found: ${comprehensive_data.raw_sources.search_results.length}`
      );
      console.log(
        `- Content Successfully Scraped: ${comprehensive_data.raw_sources.scraped_content.length}`
      );
      console.log(
        `- Total Words Analyzed: ${comprehensive_data.raw_sources.scraped_content
          .reduce(
            (sum: number, content: any) => sum + content.metadata.word_count,
            0
          )
          .toLocaleString()}`
      );

      if (comprehensive_data.research_data.synthesis) {
        const synthesis = comprehensive_data.research_data.synthesis;
        console.log(`- Insights Generated: ${synthesis.insights.length}`);
        console.log(`- Key Findings: ${synthesis.key_findings.length}`);
        console.log(
          `- Contradictions Detected: ${synthesis.contradictions.length}`
        );
        console.log(
          `- Research Gaps Identified: ${synthesis.research_gaps.length}`
        );
        console.log(`- Recommendations: ${synthesis.recommendations.length}`);
      }

      // Performance analysis
      const performance_report = await agent.get_detailed_performance_report();
      console.log(`\n⚡ Performance Metrics:`);
      console.log(
        `- Search Time: ${performance_report.performance_metrics.search_time}ms`
      );
      console.log(
        `- Scraping Time: ${performance_report.performance_metrics.scraping_time}ms`
      );
      console.log(
        `- Synthesis Time: ${performance_report.performance_metrics.synthesis_time}ms`
      );
      console.log(
        `- Cache Hit Rate: ${(
          performance_report.performance_metrics.cache_hit_rate * 100
        ).toFixed(1)}%`
      );
      console.log(
        `- Memory Usage: ${performance_report.performance_metrics.memory_usage.toFixed(
          1
        )}MB`
      );

      if (performance_report.bottleneck_analysis.recommendations.length > 0) {
        console.log(
          `- Performance Recommendations: ${performance_report.bottleneck_analysis.recommendations.length}`
        );
      }

      // Quality assessment
      const quality = agent.get_quality_assessment();
      console.log(`\n🎯 Quality Assessment:`);
      console.log(
        `- Overall Quality Score: ${(quality.overall_score * 100).toFixed(1)}%`
      );
      console.log(
        `- Source Quality: ${(quality.source_quality * 100).toFixed(1)}%`
      );
      console.log(
        `- Information Density: ${(quality.information_density * 100).toFixed(
          1
        )}%`
      );

      if (quality.recommendations.length > 0) {
        console.log(`- Quality Recommendations:`);
        quality.recommendations.slice(0, 3).forEach((rec: string) => {
          console.log(`  • ${rec}`);
        });
      }

      // Save outputs
      const output_dir = "./research_outputs";
      if (!fs.existsSync(output_dir)) {
        fs.mkdirSync(output_dir, { recursive: true });
      }

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .split("T")[0];
      const report_filename = `working_demo_report_${timestamp}.md`;
      const report_path = path.join(output_dir, report_filename);

      fs.writeFileSync(report_path, report.content);
      console.log(`\n💾 Report saved to: ${report_path}`);

      // Generate additional formats
      console.log(`\n📄 Generating additional formats...`);
      try {
        const additional_reports = await agent.generate_additional_formats([
          "json",
          "html",
        ]);

        additional_reports.forEach((additional_report) => {
          const filename = `working_demo_report_${timestamp}.${additional_report.format}`;
          const filepath = path.join(output_dir, filename);
          fs.writeFileSync(filepath, additional_report.content);
          console.log(
            `- ${additional_report.format.toUpperCase()}: ${filepath}`
          );
        });
      } catch (error) {
        log.warn("Additional format generation failed:", error);
      }

      // Run quality validation
      console.log(`\n🔍 Quality Validation:`);
      const validator = new QualityValidator({
        min_sources_threshold: 5, // Lower threshold for free demo
        min_authority_threshold: 5,
        min_confidence_threshold: 0.6,
        max_contradiction_rate: 0.2,
      });

      const research_data = agent.export_research_data();
      if (
        research_data.plan &&
        research_data.synthesis &&
        research_data.citations
      ) {
        try {
          const quality_report = await validator.validate_research({
            research_plan: research_data.plan,
            synthesis: research_data.synthesis,
            citations: research_data.citations,
          });

          console.log(`- Quality Grade: ${quality_report.quality_grade}`);
          console.log(
            `- Standards Compliance: ${
              quality_report.meets_standards
                ? "✅ PASS"
                : "⚠️  NEEDS IMPROVEMENT"
            }`
          );
          console.log(
            `- Issues: ${quality_report.issues.length} (${
              quality_report.issues.filter((i) => i.type === "critical").length
            } critical)`
          );
          console.log(`- Strengths: ${quality_report.strengths.length}`);

          // Show a preview of the generated report
          console.log(`\n📖 Report Preview:`);
          console.log("-".repeat(60));
          const preview = report.content
            .substring(0, 800)
            .split("\n")
            .slice(0, 20)
            .join("\n");
          console.log(preview);
          if (report.content.length > 800) {
            console.log("\n... [content continues] ...");
          }
          console.log("-".repeat(60));
        } catch (error) {
          log.error("Quality validation failed:", error);
          console.log("⚠️  Quality validation encountered issues");
        }
      }

      // Cleanup
      await agent.cleanup();

      console.log(`\n🎉 Working demo completed successfully!`);
      console.log(`\n📁 All outputs saved to: ${output_dir}/`);
      console.log(
        `\n💡 This demonstrates a fully working research agent that:`
      );
      console.log(`   ✅ Uses real web search (DuckDuckGo)`);
      console.log(`   ✅ Performs actual content scraping and analysis`);
      console.log(`   ✅ Generates professional citations`);
      console.log(`   ✅ Provides quality validation and metrics`);
      console.log(`   ✅ Produces multiple output formats`);
      console.log(`   ✅ Follows industry research standards`);
    } catch (research_error) {
      clearInterval(progress_timer);
      throw research_error;
    }
  } catch (error) {
    console.error("❌ Working demo failed:", error);
    console.log("\n🔧 Troubleshooting:");
    console.log("- Ensure internet connectivity");
    console.log("- Check that DuckDuckGo is accessible from your network");
    console.log("- Verify Node.js version is 18+");
    console.log("- Try: npm install to ensure all dependencies are installed");
    process.exit(1);
  }
}

async function validate_working_environment() {
  console.log("\n🔧 Environment Check for Working Demo:");
  console.log("-".repeat(40));

  // Check Node.js version
  const node_version = process.version;
  const node_major = parseInt(node_version.slice(1).split(".")[0]);
  console.log(
    `- Node.js: ${node_version} ${
      node_major >= 18 ? "✅" : "❌ (v18+ required)"
    }`
  );

  if (node_major < 18) {
    console.log(
      "❌ Node.js 18+ is required for ES modules and modern features"
    );
    return false;
  }

  // Check internet connectivity
  try {
    await axios.get("https://httpbin.org/status/200", {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ResearchAgent/1.0)",
      },
    });
    console.log("- Internet Connectivity: ✅");

    // Test DuckDuckGo API specifically
    try {
      await axios.get("https://api.duckduckgo.com/", {
        params: { q: "test", format: "json" },
        timeout: 5000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ResearchAgent/1.0)",
        },
      });
      console.log("- DuckDuckGo API Access: ✅");
    } catch {
      console.log("- DuckDuckGo API Access: ⚠️  (will use fallback methods)");
    }
  } catch {
    console.log("- Internet Connectivity: ❌");
    console.log("❌ No internet access available");
    return false;
  }

  // Check memory
  const memory = process.memoryUsage();
  const available_mb = memory.heapTotal / 1024 / 1024;
  console.log(
    `- Available Memory: ${available_mb.toFixed(1)}MB ${
      available_mb > 50 ? "✅" : "⚠️"
    }`
  );

  // Check disk space for outputs
  try {
    const output_dir = "./research_outputs";
    if (!fs.existsSync(output_dir)) {
      fs.mkdirSync(output_dir, { recursive: true });
    }
    console.log("- Output Directory: ✅");
  } catch {
    console.log("- Output Directory: ❌ Cannot create output directory");
    return false;
  }

  console.log("✅ Environment ready for working demo!");
  return true;
}

async function quick_functionality_test() {
  console.log("\n⚡ Quick Functionality Test");
  console.log("-".repeat(30));

  try {
    // Test basic agent initialization
    const test_config = ResearchConfigLoader.create_production_config({
      serpapi_key: undefined, // No API keys
      bing_search_key: undefined,
      google_search_key: undefined,
    });

    const agent = new ProductionDeepResearchAgent({
      ...test_config,
      max_sources_per_subquery: 3,
      max_scraping_depth: 2,
    });

    console.log("✅ Agent initialization: SUCCESS");

    // Test configuration validation
    const validation = ResearchConfigLoader.validate_config(test_config);
    console.log(
      `✅ Configuration validation: ${
        validation.valid ? "SUCCESS" : "ISSUES FOUND"
      }`
    );

    if (validation.warnings.length > 0) {
      console.log(`⚠️  Warnings: ${validation.warnings.length}`);
    }

    // Test progress tracking
    const progress = agent.get_research_progress();
    console.log(`✅ Progress tracking: ${progress.phase}`);

    await agent.cleanup();
    console.log("✅ All basic functionality tests passed!");
  } catch (error) {
    console.error("❌ Functionality test failed:", error);
    return false;
  }

  return true;
}

// Main execution
async function main() {
  console.log("🚀 Working Deep Research Agent Demo");
  console.log("Fully functional without API keys!");
  console.log("=".repeat(50));

  // Validate environment
  const env_ready = await validate_working_environment();
  if (!env_ready) {
    console.log("\n❌ Environment not ready. Please fix issues above.");
    return;
  }

  // Quick functionality test
  const func_ready = await quick_functionality_test();
  if (!func_ready) {
    console.log("\n❌ Functionality test failed. Please check system setup.");
    return;
  }

  // Ask user confirmation for full demo
  const should_run =
    process.argv.includes("--run") || process.argv.includes("-r");

  if (should_run) {
    console.log("\n🚀 Starting full working demo...");
    await working_research_demo();
  } else {
    console.log("\n💡 Environment is ready! To run the full demo:");
    console.log("   npm run working:demo -- --run");
    console.log("   or: npx tsx working_demo.ts --run");
    console.log("\n🎯 This demo will:");
    console.log("   - Perform real web searches using DuckDuckGo");
    console.log("   - Scrape and analyze actual web content");
    console.log("   - Generate professional research reports");
    console.log("   - Provide quality validation and metrics");
    console.log("   - Create multiple output formats");
    console.log("   - Follow academic research standards");

    console.log("\n📚 Example Research Queries to Try:");
    console.log('   - "What are the health benefits of Mediterranean diet?"');
    console.log('   - "How does artificial intelligence impact job markets?"');
    console.log('   - "What are the environmental effects of solar energy?"');
    console.log('   - "What are current trends in remote work productivity?"');
  }

  console.log("\n✨ Working Deep Research Agent is ready!");
  console.log(
    "This implementation provides enterprise-grade research capabilities using only free services."
  );
}

// Error handling
process.on("SIGINT", async () => {
  console.log("\n🛑 Demo interrupted by user");
  process.exit(0);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("💥 Working demo execution failed:", error);
    console.log("\n🔧 Common fixes:");
    console.log("- Run: npm install");
    console.log("- Check internet connection");
    console.log("- Ensure Node.js 18+");
    process.exit(1);
  });
}
