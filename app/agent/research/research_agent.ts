import { ToolCallAgent } from "../toolcall";
import { ToolCollection } from "../../tool/tool_collection";
import { WebSearch } from "../../tool/research/web_search";
import { WebScraper } from "../../tool/research/web_scraper";
import { FactVerifier } from "../../tool/research/fact_verifier";
import { Terminate } from "../../tool/terminate";
import { 
  ResearchStage, 
  ResearchQuery, 
  ResearchFinding, 
  ResearchReport,
  SearchResult,
  Fact,
  ResearchAgentState
} from "./types";
import { ReportGenerator } from "./report_generator";
import {
  RESEARCH_SYSTEM_PROMPT,
  QUERY_PLANNING_PROMPT,
  INFORMATION_SYNTHESIS_PROMPT,
  REPORT_GENERATION_PROMPT
} from "../../prompt/research/prompts";
import { log } from "../../logger";
import { Message } from "../../../schema";
import { AgentState } from "../../../types";

export class ResearchAgent extends ToolCallAgent {
  name = "research_agent";
  description = "An advanced AI agent for conducting deep, comprehensive research";
  system_prompt = RESEARCH_SYSTEM_PROMPT;
  
  // Research-specific state
  private research_state: ResearchAgentState = {
    current_stage: ResearchStage.QUERY_PLANNING,
    query: null,
    search_results: [],
    verified_facts: [],
    findings: [],
    report: null
  };

  // Configure available tools
  available_tools = new ToolCollection([
    new WebSearch(),
    new WebScraper(),
    new FactVerifier(),
    new Terminate()
  ]);

  max_steps = 50; // Increased for thorough research
  
  private reportGenerator: ReportGenerator;
  
  constructor(props: any) {
    super(props);
    this.initializeResearchPipeline();
  }

  private initializeResearchPipeline() {
    log.info("🔬 Initializing research pipeline...");
    this.reportGenerator = new ReportGenerator();
  }

  async step(): Promise<string> {
    const stage = this.research_state.current_stage;
    log.info(`📊 Current research stage: ${stage}`);

    try {
      switch (stage) {
        case ResearchStage.QUERY_PLANNING:
          return await this.planResearchQuery();
        
        case ResearchStage.INFORMATION_GATHERING:
          return await this.gatherInformation();
        
        case ResearchStage.FACT_VERIFICATION:
          return await this.verifyFacts();
        
        case ResearchStage.SYNTHESIS:
          return await this.synthesizeFindings();
        
        case ResearchStage.REPORT_GENERATION:
          return await this.generateReport();
        
        default:
          throw new Error(`Unknown research stage: ${stage}`);
      }
    } catch (error) {
      log.error(`❌ Error in research stage ${stage}: ${error}`);
      throw error;
    }
  }

  private async planResearchQuery(): Promise<string> {
    log.info("🎯 Planning research strategy...");
    
    // Add query planning prompt to conversation
    this.update_memory("system", QUERY_PLANNING_PROMPT);
    
    // Let the base agent think and act
    const thought = await this.think();
    if (!thought) return "Failed to plan research query";
    
    const response = await this.act();
    
    // Parse the response to extract research query
    // In a real implementation, this would parse structured output
    this.research_state.query = {
      main_query: this.extractMainQuery(response),
      sub_queries: this.extractSubQueries(response),
      context: "",
      max_results: 10,
      depth: "deep"
    };
    
    // Move to next stage
    this.research_state.current_stage = ResearchStage.INFORMATION_GATHERING;
    
    return `Research query planned: ${this.research_state.query.main_query}`;
  }

  private async gatherInformation(): Promise<string> {
    log.info("🔍 Gathering information from multiple sources...");
    
    if (!this.research_state.query) {
      throw new Error("No research query defined");
    }

    const allResults: SearchResult[] = [];
    
    // Search for main query
    const mainResults = await this.searchWeb(this.research_state.query.main_query);
    allResults.push(...mainResults);
    
    // Search for sub-queries
    for (const subQuery of this.research_state.query.sub_queries) {
      const subResults = await this.searchWeb(subQuery);
      allResults.push(...subResults);
    }
    
    // Store unique results
    this.research_state.search_results = this.deduplicateResults(allResults);
    
    // Extract content from top results
    const topUrls = this.research_state.search_results.slice(0, 5).map(r => r.url);
    for (const url of topUrls) {
      await this.scrapeWebpage(url);
    }
    
    // Move to fact verification stage
    this.research_state.current_stage = ResearchStage.FACT_VERIFICATION;
    
    return `Gathered ${this.research_state.search_results.length} sources for analysis`;
  }

  private async verifyFacts(): Promise<string> {
    log.info("✅ Verifying facts and assessing source credibility...");
    
    // Extract key claims from gathered information
    const claims = this.extractKeyClaims();
    
    // Verify each claim
    for (const claim of claims) {
      const verificationResult = await this.verifyFact(claim);
      if (verificationResult) {
        this.research_state.verified_facts.push(verificationResult);
      }
    }
    
    // Move to synthesis stage
    this.research_state.current_stage = ResearchStage.SYNTHESIS;
    
    return `Verified ${this.research_state.verified_facts.length} facts from sources`;
  }

  private async synthesizeFindings(): Promise<string> {
    log.info("🧩 Synthesizing research findings...");
    
    // Add synthesis prompt
    this.update_memory("system", INFORMATION_SYNTHESIS_PROMPT);
    
    // Provide verified facts for synthesis
    const factsContext = this.research_state.verified_facts
      .map(f => `- ${f.statement} (confidence: ${f.confidence})`)
      .join("\n");
    
    this.update_memory("user", `Synthesize these verified facts:\n${factsContext}`);
    
    // Generate synthesis
    await this.think();
    const synthesis = await this.act();
    
    // Create research finding
    const finding: ResearchFinding = {
      topic: this.research_state.query?.main_query || "Research Topic",
      summary: synthesis,
      facts: this.research_state.verified_facts,
      sources: this.research_state.search_results,
      credibility_scores: [],
      timestamp: new Date().toISOString()
    };
    
    this.research_state.findings.push(finding);
    
    // Move to report generation
    this.research_state.current_stage = ResearchStage.REPORT_GENERATION;
    
    return "Research findings synthesized successfully";
  }

  private async generateReport(): Promise<string> {
    log.info("📝 Generating comprehensive research report...");
    
    // Add report generation prompt
    this.update_memory("system", REPORT_GENERATION_PROMPT);
    
    // Provide findings context
    const findingsContext = this.formatFindingsForReport();
    this.update_memory("user", `Generate a research report based on:\n${findingsContext}`);
    
    // Generate report
    await this.think();
    const reportContent = await this.act();
    
    // Create research report
    this.research_state.report = {
      title: `Research Report: ${this.research_state.query?.main_query}`,
      executive_summary: this.extractExecutiveSummary(reportContent),
      query: this.research_state.query!,
      findings: this.research_state.findings,
      methodology: "Systematic web search, source verification, and evidence synthesis",
      limitations: ["Limited to publicly available web sources", "Time constraints on verification depth"],
      recommendations: this.extractRecommendations(reportContent),
      citations: this.generateCitations(),
      generated_at: new Date().toISOString()
    };
    
    // Mark as completed
    this.state = AgentState.COMPLETED;
    
    return "Research report generated successfully";
  }

  // Helper methods
  private async searchWeb(query: string): Promise<SearchResult[]> {
    const tool_call = {
      id: `search_${Date.now()}`,
      type: "function",
      function: {
        name: "web_search",
        arguments: JSON.stringify({ query, max_results: 10 })
      }
    };
    
    const result = await this.execute_tool(tool_call);
    // Parse and return search results
    return [];
  }

  private async scrapeWebpage(url: string): Promise<void> {
    const tool_call = {
      id: `scrape_${Date.now()}`,
      type: "function",
      function: {
        name: "web_scraper",
        arguments: JSON.stringify({ url })
      }
    };
    
    await this.execute_tool(tool_call);
  }

  private async verifyFact(claim: string): Promise<Fact | null> {
    const sources = this.research_state.search_results.slice(0, 3).map(r => r.url);
    
    const tool_call = {
      id: `verify_${Date.now()}`,
      type: "function",
      function: {
        name: "fact_verifier",
        arguments: JSON.stringify({ statement: claim, sources })
      }
    };
    
    const result = await this.execute_tool(tool_call);
    // Parse and return fact
    return null;
  }

  private extractMainQuery(response: string): string {
    // Simple extraction - in production use structured parsing
    const lines = response.split('\n');
    return lines.find(line => line.includes('Main query:'))?.replace('Main query:', '').trim() || "Research query";
  }

  private extractSubQueries(response: string): string[] {
    // Simple extraction - in production use structured parsing
    const subQueries: string[] = [];
    const lines = response.split('\n');
    lines.forEach(line => {
      if (line.match(/^\d+\./)) {
        subQueries.push(line.replace(/^\d+\./, '').trim());
      }
    });
    return subQueries.slice(0, 5);
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.url)) return false;
      seen.add(result.url);
      return true;
    });
  }

  private extractKeyClaims(): string[] {
    // Extract factual claims from gathered content
    // In production, use NLP to identify factual statements
    return [
      "Sample claim 1 from the research",
      "Sample claim 2 that needs verification",
      "Sample claim 3 with specific data"
    ];
  }

  private formatFindingsForReport(): string {
    return this.research_state.findings
      .map(f => `Topic: ${f.topic}\nSummary: ${f.summary}\nFacts: ${f.facts.length} verified`)
      .join("\n\n");
  }

  private extractExecutiveSummary(report: string): string {
    // Extract executive summary section
    return "Executive summary of the research findings...";
  }

  private extractRecommendations(report: string): string[] {
    // Extract recommendations
    return ["Recommendation 1", "Recommendation 2"];
  }

  private generateCitations(): Array<{id: string, text: string, url: string, access_date: string}> {
    return this.research_state.search_results.map((result, index) => ({
      id: `cite_${index + 1}`,
      text: result.title,
      url: result.url,
      access_date: new Date().toISOString()
    }));
  }

  // Override run to return the final report
  async run(request?: string): Promise<string> {
    const result = await super.run(request);
    
    if (this.research_state.report) {
      // Generate formatted report
      const markdownReport = this.reportGenerator.generateMarkdownReport(this.research_state.report);
      return markdownReport;
    }
    
    return result;
  }
  
  // Additional methods to get different report formats
  getJSONReport(): string | null {
    if (!this.research_state.report) return null;
    return this.reportGenerator.generateJSONReport(this.research_state.report);
  }
  
  getHTMLReport(): string | null {
    if (!this.research_state.report) return null;
    return this.reportGenerator.generateHTMLReport(this.research_state.report);
  }
}