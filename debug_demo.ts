#!/usr/bin/env npx tsx

/**
 * Debug Deep Research Agent Demo
 *
 * This demo tests each component step-by-step to ensure everything works
 * before running the full research process. This prevents token waste.
 */

import { ProductionDeepResearchAgent } from "./app/research/production_deep_research_agent";
import { ResearchConfigLoader } from "./app/research/config_loader";
import { RealWebSearchTool } from "./app/research/tools/real_web_search";
import { RealWebScraperTool } from "./app/research/tools/real_web_scraper";
import { ResearchPlanner } from "./app/research/planner";
import { LLM } from "./app/llm";
import { log } from "./app/logger";
import fs from "fs";
import path from "path";

async function debug_step_by_step() {
  console.log("🔬 Debug Deep Research Agent - Step by Step Testing");
  console.log("Testing each component individually to prevent token waste");
  console.log("=".repeat(70));

  // Set environment variables for testing
  process.env.SERPAPI_KEY =
    "9706113c5d889818f94dead43ffb0a4ac0b387a07543f91c124ccbfa11278330";

  try {
    // Step 1: Test LLM Connection
    console.log("\n📋 Step 1: Testing LLM Connection");
    console.log("-".repeat(40));

    const llm = LLM.getInstance("debug_test");
    console.log(`✅ LLM instance created: ${llm.config_name}`);

    try {
      const simple_response = await llm.ask(
        [
          {
            role: "user",
            content: "Say 'Hello, I am working correctly!' and nothing else.",
          },
        ],
        undefined,
        false,
        0.1
      );

      console.log(`✅ LLM Response: "${simple_response}"`);

      if (!simple_response || simple_response.length < 5) {
        throw new Error("LLM response too short or empty");
      }
    } catch (error) {
      console.error("❌ LLM Test Failed:", error);
      console.log("\n🔧 LLM Troubleshooting:");
      console.log("- Check your API key in config/config.toml");
      console.log("- Verify internet connectivity");
      console.log("- Ensure API key has sufficient credits");
      return false;
    }

    // Step 2: Test Web Search
    console.log("\n📋 Step 2: Testing Web Search");
    console.log("-".repeat(40));

    const search_tool = new RealWebSearchTool({
      serpapi: {
        api_key:
          "9706113c5d889818f94dead43ffb0a4ac0b387a07543f91c124ccbfa11278330",
      },
      //   duckduckgo: true, // Keep as fallback
    });

    console.log("✅ Search tool initialized");

    try {
      const search_result = await search_tool.execute({
        query: "renewable energy benefits",
        max_results: 3,
        engines: ["serpapi"],
      });

      if (search_result.error) {
        throw new Error(search_result.error);
      }

      const search_data = JSON.parse(search_result.output);
      console.log(
        `✅ Search completed: ${search_data.results.length} results found`
      );

      if (search_data.results.length === 0) {
        throw new Error("No search results returned");
      }

      // Show first result
      const first_result = search_data.results[0];
      console.log(`   📄 Sample Result: "${first_result.title}"`);
      console.log(`   🔗 URL: ${first_result.url}`);
      console.log(`   📊 Authority: ${first_result.source_authority}/10`);
    } catch (error) {
      console.error("❌ Search Test Failed:", error);
      console.log("\n🔧 Search Troubleshooting:");
      console.log("- Check internet connectivity");
      console.log("- Verify DuckDuckGo is accessible");
      console.log("- Try a different search query");
      return false;
    }

    // Step 3: Test Web Scraping
    console.log("\n📋 Step 3: Testing Web Scraping");
    console.log("-".repeat(40));

    const scraper_tool = new RealWebScraperTool();
    console.log("✅ Scraper tool initialized");

    try {
      // Test with a reliable, fast-loading site
      const test_url = "https://en.wikipedia.org/wiki/Renewable_energy";
      console.log(`🌐 Testing scraping: ${test_url}`);

      const scrape_result = await scraper_tool.execute({
        url: test_url,
        extract_type: "readable",
        max_content_length: 2000,
        timeout: 15,
        use_browser: false,
      });

      if (scrape_result.error) {
        throw new Error(scrape_result.error);
      }

      const scraped_data = JSON.parse(scrape_result.output);
      console.log(`✅ Scraping completed`);
      console.log(`   📄 Title: "${scraped_data.title}"`);
      console.log(`   📊 Content Length: ${scraped_data.content.length} chars`);
      console.log(
        `   🎯 Quality Score: ${(scraped_data.quality_score * 100).toFixed(1)}%`
      );

      if (scraped_data.content.length < 100) {
        throw new Error("Scraped content too short");
      }
    } catch (error) {
      console.error("❌ Scraping Test Failed:", error);
      console.log("\n🔧 Scraping Troubleshooting:");
      console.log("- Check internet connectivity");
      console.log("- Try a different URL");
      console.log("- Verify the target site is accessible");
      return false;
    }

    // Step 4: Test Research Planning
    console.log("\n📋 Step 4: Testing Research Planning");
    console.log("-".repeat(40));

    try {
      const planner = new ResearchPlanner(llm);
      console.log("✅ Research planner initialized");

      const test_query = "What are the benefits of renewable energy?";
      console.log(`🎯 Creating plan for: "${test_query}"`);

      const research_plan = await planner.create_research_plan(test_query);
      console.log(`✅ Research plan created`);
      console.log(`   📋 Subqueries: ${research_plan.subqueries.length}`);
      console.log(
        `   ⏱️  Estimated time: ${research_plan.time_estimate} minutes`
      );
      console.log(`   📊 Expected sources: ${research_plan.expected_sources}`);

      // Show subqueries
      research_plan.subqueries.forEach((sq, index) => {
        console.log(`   ${index + 1}. [Priority ${sq.priority}] ${sq.query}`);
      });

      if (research_plan.subqueries.length === 0) {
        throw new Error("No subqueries generated in research plan");
      }
    } catch (error) {
      console.error("❌ Planning Test Failed:", error);
      console.log("\n🔧 Planning Troubleshooting:");
      console.log("- Check LLM is working (Step 1)");
      console.log("- Verify the query is clear and specific");
      console.log("- Try a simpler query");
      return false;
    }

    // Step 5: Test Agent Initialization
    console.log("\n📋 Step 5: Testing Agent Initialization");
    console.log("-".repeat(40));

    try {
      const config = ResearchConfigLoader.create_production_config({
        openai_api_key: process.env.OPENAI_API_KEY,
        serpapi_key: process.env.SERPAPI_KEY, // Add SerpAPI key
        max_sources_per_subquery: 5, // Small number for testing
        max_scraping_depth: 3,
        confidence_threshold: 0.6,
      });

      const agent = new ProductionDeepResearchAgent({
        ...config,
        name: "DebugTestAgent",
      });

      console.log(`✅ Agent initialized: ${agent.name}`);
      console.log(`   🔍 Search engines: ${config.search_engines?.join(", ")}`);
      console.log(`   📊 Max sources: ${config.max_sources_per_subquery}`);
      console.log(
        `   🎯 Confidence threshold: ${(
          config.confidence_threshold! * 100
        ).toFixed(0)}%`
      );

      // Test progress tracking
      const initial_progress = agent.get_research_progress();
      console.log(`   📈 Initial phase: ${initial_progress.phase}`);
    } catch (error) {
      console.error("❌ Agent Initialization Failed:", error);
      console.log("\n🔧 Agent Troubleshooting:");
      console.log("- Check all previous steps passed");
      console.log("- Verify configuration is valid");
      return false;
    }

    console.log("\n🎉 All Component Tests Passed!");
    console.log("✅ LLM Connection: Working");
    console.log("✅ Web Search: Working");
    console.log("✅ Web Scraping: Working");
    console.log("✅ Research Planning: Working");
    console.log("✅ Agent Initialization: Working");

    return true;
  } catch (error) {
    console.error("❌ Debug testing failed:", error);
    return false;
  }
}

async function run_minimal_research_test() {
  console.log("\n🧪 Minimal Research Test");
  console.log("Running a very small research task to verify end-to-end flow");
  console.log("=".repeat(60));

  try {
    // Create minimal configuration
    const config = ResearchConfigLoader.create_production_config({
      openai_api_key: process.env.OPENAI_API_KEY,
      serpapi_key: process.env.SERPAPI_KEY, // Ensure SerpAPI key is passed
      max_sources_per_subquery: 3, // Very small
      max_scraping_depth: 2, // Very small
      confidence_threshold: 0.5, // Lower threshold
    });

    const agent = new ProductionDeepResearchAgent({
      ...config,
      name: "MinimalTestAgent",
      max_steps: 15, // Limit steps to prevent loops
    });

    console.log(`🤖 Agent: ${agent.name}`);

    // Simple, focused query
    const test_query = "What is solar energy?";
    console.log(`📝 Query: "${test_query}"`);

    console.log("\n📊 Starting minimal research...");
    console.log("⏱️  Max time: ~2 minutes");
    console.log("🔍 Max sources: 3");
    console.log("📄 Max scraping: 2 pages");

    const start_time = Date.now();

    try {
      const report = await agent.conduct_production_research(test_query);

      const duration = (Date.now() - start_time) / 1000;
      console.log(`\n✅ Research completed in ${duration.toFixed(1)}s`);

      console.log("\n📊 Results:");
      console.log(`- Title: ${report.title}`);
      console.log(`- Sections: ${report.sections?.length || 0}`);
      console.log(`- Word Count: ${report.metadata?.word_count || 0}`);
      console.log(`- Sources: ${report.metadata?.total_sources || 0}`);
      console.log(
        `- Confidence: ${(
          (report.metadata?.confidence_score || 0) * 100
        ).toFixed(1)}%`
      );

      // Save minimal report
      const output_dir = path.join(process.cwd(), "debug_outputs");
      if (!fs.existsSync(output_dir)) {
        fs.mkdirSync(output_dir, { recursive: true });
      }

      const report_path = path.join(output_dir, "minimal_test_report.md");
      fs.writeFileSync(report_path, report.content);
      console.log(`\n💾 Report saved: ${report_path}`);

      return true;
    } catch (research_error) {
      console.error("❌ Minimal research failed:", research_error);

      // Get debug info
      try {
        const progress = agent.get_research_progress();
        const quality = agent.get_quality_assessment();

        console.log("\n🔍 Debug Info:");
        console.log(`- Phase: ${progress.phase}`);
        console.log(
          `- Progress: ${progress.completion_percentage?.toFixed(1)}%`
        );
        console.log(`- Sources Found: ${progress.sources_discovered || 0}`);
        console.log(
          `- Quality Score: ${(quality.overall_score * 100).toFixed(1)}%`
        );
      } catch (debug_error) {
        console.log("Could not get debug info:", debug_error.message);
      }

      return false;
    }
  } catch (error) {
    console.error("❌ Minimal test setup failed:", error);
    return false;
  }
}

async function main() {
  console.log("🚀 Deep Research Agent - Debug Mode");
  console.log("Step-by-step testing to prevent token waste");
  console.log("=".repeat(70));

  // Step 1: Component testing
  console.log("\n🔧 Phase 1: Component Testing");
  const components_ok = await debug_step_by_step();

  if (!components_ok) {
    console.log("\n❌ Component tests failed. Fix issues before proceeding.");
    process.exit(1);
  }

  // Step 2: Ask user if they want to proceed
  console.log("\n🚀 Phase 2: Minimal Research Test");
  console.log("All components are working. Ready to test minimal research.");
  console.log(
    "\n⚠️  This will use some tokens but very few (estimated: 200-500 tokens)"
  );

  const should_proceed =
    process.argv.includes("--test") || process.argv.includes("-t");

  if (should_proceed) {
    console.log("\n🧪 Running minimal research test...");
    const research_ok = await run_minimal_research_test();

    if (research_ok) {
      console.log("\n🎉 SUCCESS! Deep Research Agent is fully functional!");
      console.log("\n📚 Ready for full research. Usage:");
      console.log("   npm run production:demo:full  # Full production demo");
      console.log(
        "   npm run working:demo -- --run # Working demo with DuckDuckGo"
      );

      console.log("\n🎯 For Gemini, update config/config.toml:");
      console.log('   model = "gemini-1.5-flash"');
      console.log('   api_type = "gemini"');
      console.log('   api_key = "your-gemini-key-here"');
    } else {
      console.log("\n❌ Minimal research test failed. Check logs above.");
    }
  } else {
    console.log("\n💡 To run the minimal research test:");
    console.log("   npm run debug:test");
    console.log("   or: npx tsx debug_demo.ts --test");
  }
}

// Error handling
process.on("SIGINT", () => {
  console.log("\n🛑 Debug session interrupted");
  process.exit(0);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled error:", reason);
  process.exit(1);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("💥 Debug demo failed:", error);
    process.exit(1);
  });
}
