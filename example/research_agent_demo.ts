import { ResearchAgent } from "../app/agent/research";
import { Memory } from "../schema";
import { LLM } from "../app/llm";
import { log } from "../app/logger";

async function demonstrateResearchAgent() {
  log.info("🚀 Starting Research Agent Demo");
  
  try {
    // Initialize the research agent
    const agent = new ResearchAgent({
      name: "deep_researcher",
      description: "Advanced research agent for comprehensive analysis",
      llm: LLM.getInstance("default"),
      memory: new Memory(),
      max_steps: 50
    });
    
    // Example research queries
    const queries = [
      "What are the latest advancements in quantum computing and their potential impact on cryptography?",
      "Analyze the environmental impact of electric vehicles compared to traditional combustion engines",
      "What are the current best practices for implementing zero-trust security architecture?",
      "Research the effectiveness of different COVID-19 vaccines against new variants"
    ];
    
    // Run research on the first query
    const query = queries[0];
    log.info(`📚 Researching: "${query}"`);
    
    const report = await agent.run(query);
    
    // Display the report
    console.log("\n" + "=".repeat(80));
    console.log("RESEARCH REPORT");
    console.log("=".repeat(80) + "\n");
    console.log(report);
    
    // Optionally save different formats
    const jsonReport = agent.getJSONReport();
    if (jsonReport) {
      // Save to file
      const fs = await import('fs/promises');
      await fs.writeFile('research_report.json', jsonReport);
      log.info("💾 JSON report saved to research_report.json");
    }
    
    const htmlReport = agent.getHTMLReport();
    if (htmlReport) {
      // Save to file
      const fs = await import('fs/promises');
      await fs.writeFile('research_report.html', htmlReport);
      log.info("💾 HTML report saved to research_report.html");
    }
    
  } catch (error) {
    log.error(`❌ Demo failed: ${error}`);
    console.error(error);
  }
}

// Example of using the research agent programmatically
async function programmaticUsage() {
  const agent = new ResearchAgent({
    name: "api_researcher",
    llm: LLM.getInstance("default"),
    memory: new Memory()
  });
  
  // Configure research parameters
  const researchConfig = {
    depth: "deep",
    max_sources: 20,
    verify_facts: true,
    include_recommendations: true
  };
  
  // Run research
  const result = await agent.run("Latest trends in AI safety research");
  
  // Process results
  const jsonReport = agent.getJSONReport();
  if (jsonReport) {
    const report = JSON.parse(jsonReport);
    
    // Access specific parts of the report
    console.log("Executive Summary:", report.executive_summary);
    console.log("Number of findings:", report.findings.length);
    console.log("Verified facts:", report.findings.flatMap(f => f.facts.filter(fact => fact.verification_status === 'verified')).length);
  }
}

// Run the demo
if (require.main === module) {
  demonstrateResearchAgent().catch(console.error);
}