import { ReActAgent } from "../agent/react";
import { LLM } from "../llm";
import { Role } from "../../schema";
import { AgentState } from "../../types";
import { log } from "../logger";

// Research components
import { ResearchPlanner, ResearchPlan, ResearchSubquery } from "./planner";
import { InformationSynthesizer, ResearchSynthesis } from "./synthesizer";
import { CitationManager, CitationReport } from "./citation";
import { ReportGenerator, ReportConfig, GeneratedReport } from "./report_generator";
import { ResearchMemory } from "./memory";

// Tools
import { WebSearchTool, SearchResult } from "./tools/web_search";
import { WebScraperTool, ScrapedContent } from "./tools/web_scraper";
import { ToolCollection } from "../tool/tool_collection";

export interface DeepResearchAgentConfig {
  name?: string;
  llm?: LLM;
  max_sources_per_subquery?: number;
  max_scraping_depth?: number;
  confidence_threshold?: number;
  parallel_processing?: boolean;
  search_engines?: string[];
  citation_style?: "apa" | "mla" | "chicago" | "ieee";
}

export class DeepResearchAgent extends ReActAgent {
  private planner: ResearchPlanner;
  private synthesizer: InformationSynthesizer;
  private citation_manager: CitationManager;
  private report_generator: ReportGenerator;
  private research_memory: ResearchMemory;
  private tools: ToolCollection;

  // Configuration
  private config: Required<DeepResearchAgentConfig>;
  
  // Research state
  private current_plan: ResearchPlan | null = null;
  private current_subquery: ResearchSubquery | null = null;
  private search_results: SearchResult[] = [];
  private scraped_content: ScrapedContent[] = [];
  private synthesis: ResearchSynthesis | null = null;

  constructor(config: DeepResearchAgentConfig = {}) {
    const llm = config.llm || new LLM("deep_research");
    
    super({
      name: config.name || "DeepResearchAgent",
      description: "Advanced AI agent for comprehensive research with multi-step planning, web exploration, and synthesis",
      system_prompt: DeepResearchAgent.get_system_prompt(),
      llm,
      max_steps: 50, // Research can be complex and require many steps
    });

    this.config = {
      name: config.name || "DeepResearchAgent",
      llm,
      max_sources_per_subquery: config.max_sources_per_subquery || 10,
      max_scraping_depth: config.max_scraping_depth || 5,
      confidence_threshold: config.confidence_threshold || 0.7,
      parallel_processing: config.parallel_processing ?? true,
      search_engines: config.search_engines || ["duckduckgo", "bing"],
      citation_style: config.citation_style || "apa",
    };

    // Initialize research components
    this.planner = new ResearchPlanner(this.llm);
    this.synthesizer = new InformationSynthesizer(this.llm);
    this.citation_manager = new CitationManager();
    this.report_generator = new ReportGenerator();
    this.research_memory = new ResearchMemory();

    // Initialize tools
    this.tools = new ToolCollection([
      new WebSearchTool({ search_engines: this.config.search_engines }),
      new WebScraperTool(),
    ]);

    // Override memory with research memory
    this.memory = this.research_memory;

    log.info(`DeepResearchAgent initialized: ${this.name}`);
  }

  private static get_system_prompt(): string {
    return `You are a sophisticated Deep Research Agent designed to conduct comprehensive, multi-step research following industry standards. Your capabilities include:

CORE COMPETENCIES:
- Advanced query decomposition and research planning
- Multi-source web search and intelligent scraping
- Cross-source information synthesis and validation
- Automatic citation generation and source attribution
- Structured report generation in multiple formats
- Quality assessment and confidence scoring

RESEARCH METHODOLOGY:
1. PLANNING: Break complex queries into focused subqueries with priority and dependency mapping
2. SEARCH: Execute targeted searches across multiple authoritative sources
3. SCRAPING: Extract and analyze content from high-quality sources
4. SYNTHESIS: Cross-reference information, identify patterns, and resolve contradictions
5. VALIDATION: Assess confidence levels and identify research gaps
6. REPORTING: Generate comprehensive, citation-rich reports

QUALITY STANDARDS:
- Prioritize authoritative sources (academic, government, established media)
- Cross-validate information across multiple sources
- Maintain transparency about confidence levels and limitations
- Provide proper attribution and citations
- Identify contradictions and research gaps
- Follow academic research best practices

DECISION MAKING:
- Use ReAct pattern: Think before acting
- Consider source authority and relevance when prioritizing
- Balance breadth vs depth based on query complexity
- Adapt strategy based on intermediate findings
- Terminate when confidence threshold is met or max steps reached

Your goal is to provide comprehensive, well-researched, and properly cited analysis that meets professional research standards.`;
  }

  async think(): Promise<boolean> {
    const context = this.research_memory.get_context_for_llm();
    const progress = this.research_memory.get_research_progress();

    this.update_memory(Role.SYSTEM, 
      `${context}\n\nCurrent step: ${this.current_step}/${this.max_steps}\n\nDecide next action based on research progress and current phase.`
    );

    try {
      const response = await this.llm.generate(
        this.memory.to_dict_list(),
        { temperature: 0.3, max_tokens: 500 }
      );

      if (!response.content) {
        log.warn("No response from LLM in think phase");
        return false;
      }

      this.update_memory(Role.ASSISTANT, response.content);

      // Determine if action is needed based on research phase and progress
      const should_act = this.determine_action_needed(progress);
      
      log.info(`Think phase completed. Should act: ${should_act}`);
      return should_act;

    } catch (error) {
      log.error("Think phase failed:", error);
      return false;
    }
  }

  private determine_action_needed(progress: any): boolean {
    // Continue if research is not complete and we haven't reached max steps
    if (progress.phase === "completed") {
      return false;
    }

    if (this.current_step >= this.max_steps) {
      return false;
    }

    // Always need action if we're in active research phases
    return ["planning", "searching", "scraping", "synthesis", "reporting"].includes(progress.phase);
  }

  async act(): Promise<string> {
    const progress = this.research_memory.get_research_progress();
    
    try {
      switch (progress.phase) {
        case "planning":
          return await this.execute_planning();
        case "searching":
          return await this.execute_searching();
        case "scraping":
          return await this.execute_scraping();
        case "synthesis":
          return await this.execute_synthesis();
        case "reporting":
          return await this.execute_reporting();
        default:
          return "Research phase not recognized";
      }
    } catch (error) {
      log.error(`Action failed in ${progress.phase} phase:`, error);
      this.research_memory.update_research_phase("completed");
      return `Research failed in ${progress.phase} phase: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private async execute_planning(): Promise<string> {
    log.info("Executing research planning phase");

    if (!this.current_plan) {
      // Get the research query from memory
      const query = this.research_memory.export_research_state().context.query;
      if (!query) {
        throw new Error("No research query found in memory");
      }

      this.current_plan = await this.planner.create_research_plan(query);
      this.research_memory.initialize_research(query, this.current_plan);
      
      this.update_memory(Role.SYSTEM, 
        `Research plan created:\n${this.planner.get_plan_summary(this.current_plan)}`
      );
    }

    // Move to searching phase
    this.research_memory.update_research_phase("searching");
    
    return `Research planning completed. Created plan with ${this.current_plan.subqueries.length} subqueries. Moving to search phase.`;
  }

  private async execute_searching(): Promise<string> {
    log.info("Executing search phase");

    if (!this.current_plan) {
      throw new Error("No research plan available");
    }

    // Get next subquery to research
    const completed_ids = this.research_memory.export_research_state().context.completed_subqueries;
    this.current_subquery = this.planner.get_next_subquery(this.current_plan, completed_ids);

    if (!this.current_subquery) {
      // All subqueries completed, move to scraping
      this.research_memory.update_research_phase("scraping");
      return "All subqueries searched. Moving to content scraping phase.";
    }

    this.research_memory.set_current_subquery(this.current_subquery);

    // Execute web search for current subquery
    const search_tool = this.tools.get_tool("web_search");
    const search_result = await search_tool.execute({
      query: this.current_subquery.query,
      max_results: this.config.max_sources_per_subquery,
      result_type: "web",
    });

    if (search_result.error) {
      throw new Error(`Search failed: ${search_result.error}`);
    }

    const search_data = JSON.parse(search_result.output);
    this.search_results.push(...search_data.results);

    // Record discovered sources
    search_data.results.forEach((result: SearchResult) => {
      this.research_memory.add_discovered_source(result.url, {
        id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: result.url,
        title: result.title,
        domain: result.domain,
        authority_score: result.source_authority || 5,
        relevance_score: result.relevance_score || 0.5,
        content_type: "article",
        published_date: result.published_date,
      });
    });

    this.update_memory(Role.SYSTEM, 
      `Search completed for "${this.current_subquery.query}". Found ${search_data.results.length} sources.`
    );

    return `Search completed for subquery: "${this.current_subquery.query}". Found ${search_data.results.length} sources. Continuing with next subquery.`;
  }

  private async execute_scraping(): Promise<string> {
    log.info("Executing scraping phase");

    if (this.search_results.length === 0) {
      this.research_memory.update_research_phase("synthesis");
      return "No sources to scrape. Moving to synthesis phase.";
    }

    // Select high-quality sources for scraping
    const high_quality_sources = this.search_results
      .filter(result => (result.source_authority || 0) >= 6)
      .sort((a, b) => (b.source_authority || 0) - (a.source_authority || 0))
      .slice(0, this.config.max_scraping_depth);

    const scraper_tool = this.tools.get_tool("web_scraper");
    
    // Scrape sources (in parallel if enabled)
    if (this.config.parallel_processing) {
      const scraping_promises = high_quality_sources.map(async (source) => {
        try {
          const result = await scraper_tool.execute({
            url: source.url,
            extract_type: "full",
            max_content_length: 5000,
          });
          
          if (!result.error) {
            return JSON.parse(result.output);
          }
        } catch (error) {
          log.warn(`Failed to scrape ${source.url}:`, error);
        }
        return null;
      });

      const scraped_results = await Promise.all(scraping_promises);
      this.scraped_content.push(...scraped_results.filter(r => r !== null));
    } else {
      // Sequential scraping
      for (const source of high_quality_sources) {
        try {
          const result = await scraper_tool.execute({
            url: source.url,
            extract_type: "full",
            max_content_length: 5000,
          });
          
          if (!result.error) {
            this.scraped_content.push(JSON.parse(result.output));
          }
        } catch (error) {
          log.warn(`Failed to scrape ${source.url}:`, error);
        }
      }
    }

    // Move to synthesis phase
    this.research_memory.update_research_phase("synthesis");

    this.update_memory(Role.SYSTEM, 
      `Content scraping completed. Successfully scraped ${this.scraped_content.length} sources.`
    );

    return `Content scraping completed. Successfully scraped ${this.scraped_content.length} out of ${high_quality_sources.length} selected sources. Moving to synthesis phase.`;
  }

  private async execute_synthesis(): Promise<string> {
    log.info("Executing synthesis phase");

    if (this.search_results.length === 0 && this.scraped_content.length === 0) {
      throw new Error("No research data available for synthesis");
    }

    // Prepare data for synthesis
    const research_data = {
      query: this.research_memory.export_research_state().context.query,
      search_results: this.search_results,
      scraped_content: this.scraped_content,
    };

    // Perform synthesis
    this.synthesis = await this.synthesizer.synthesize_research(research_data);

    // Add sources to citation manager
    this.citation_manager.add_sources(this.synthesis.sources);

    // Create citations for insights
    this.citation_manager.create_citations_for_insights(this.synthesis.insights);

    // Store validated insights in memory
    this.synthesis.insights.forEach(insight => {
      this.research_memory.add_validated_insight(insight);
    });

    // Move to reporting phase
    this.research_memory.update_research_phase("reporting");

    this.update_memory(Role.SYSTEM, 
      `Research synthesis completed. Generated ${this.synthesis.insights.length} insights with overall confidence of ${(this.synthesis.confidence_assessment.overall_confidence * 100).toFixed(1)}%.`
    );

    return `Research synthesis completed. Generated ${this.synthesis.insights.length} insights from ${this.synthesis.sources.length} sources. Overall confidence: ${(this.synthesis.confidence_assessment.overall_confidence * 100).toFixed(1)}%. Moving to reporting phase.`;
  }

  private async execute_reporting(): Promise<string> {
    log.info("Executing reporting phase");

    if (!this.synthesis || !this.current_plan) {
      throw new Error("Missing synthesis or plan data for reporting");
    }

    // Generate citation report
    const citations = this.citation_manager.generate_citation_report();

    // Prepare report data
    const report_data = {
      research_plan: this.current_plan,
      synthesis: this.synthesis,
      citations,
    };

    // Generate reports in multiple formats
    const report_config: ReportConfig = {
      format: "markdown",
      include_citations: true,
      include_methodology: true,
      include_confidence_scores: true,
      include_source_analysis: true,
      citation_style: this.config.citation_style,
      executive_summary_length: "medium",
      detail_level: "detailed",
    };

    const markdown_report = await this.report_generator.generate_report(report_data, report_config);

    // Store reports in working memory
    this.research_memory.store_working_data("final_report_markdown", markdown_report);
    this.research_memory.store_working_data("citation_report", citations);
    this.research_memory.store_working_data("research_synthesis", this.synthesis);

    // Complete research
    this.research_memory.update_research_phase("completed");
    this.state = AgentState.COMPLETED;

    const summary = this.research_memory.get_research_summary();
    this.update_memory(Role.SYSTEM, `Research completed successfully.\n\n${summary}`);

    return `Research completed successfully! Generated comprehensive report with ${this.synthesis.insights.length} insights, ${citations.total_citations} citations, and ${citations.total_sources} sources. Final confidence score: ${(this.synthesis.confidence_assessment.overall_confidence * 100).toFixed(1)}%.`;
  }

  // Public methods for external access
  async conduct_research(query: string): Promise<GeneratedReport> {
    log.info(`Starting deep research for query: "${query}"`);

    // Initialize research
    this.research_memory.initialize_research(query, {} as ResearchPlan);
    
    // Run the agent
    const result = await this.run(query);
    
    // Return the final report
    const final_report = this.research_memory.retrieve_working_data("final_report_markdown");
    if (!final_report) {
      throw new Error("Research completed but no final report generated");
    }

    return final_report;
  }

  get_research_progress(): any {
    return this.research_memory.get_research_progress();
  }

  get_quality_assessment(): any {
    return this.research_memory.get_quality_assessment();
  }

  get_research_summary(): string {
    return this.research_memory.get_research_summary();
  }

  export_research_data(): {
    plan: ResearchPlan | null;
    synthesis: ResearchSynthesis | null;
    citations: CitationReport | null;
    memory_state: any;
  } {
    return {
      plan: this.current_plan,
      synthesis: this.synthesis,
      citations: this.research_memory.retrieve_working_data("citation_report"),
      memory_state: this.research_memory.export_research_state(),
    };
  }

  async generate_additional_formats(formats: ReportConfig["format"][]): Promise<GeneratedReport[]> {
    const synthesis = this.research_memory.retrieve_working_data("research_synthesis");
    const citations = this.research_memory.retrieve_working_data("citation_report");
    
    if (!synthesis || !citations || !this.current_plan) {
      throw new Error("Research data not available for additional format generation");
    }

    const report_data = {
      research_plan: this.current_plan,
      synthesis,
      citations,
    };

    return await this.report_generator.generate_multiple_formats(report_data, formats);
  }
}