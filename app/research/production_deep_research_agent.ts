import { ReActAgent } from "../agent/react";
import { LLM } from "../llm";
import { Role } from "../../schema";
import { AgentState } from "../../types";
import { log } from "../logger";

// Real research components
import { ResearchPlanner, ResearchPlan, ResearchSubquery } from "./planner";
import {
  RealInformationSynthesizer,
  RealResearchSynthesis,
} from "./real_synthesizer";
import { CitationManager } from "./citation";
import {
  ReportGenerator,
  ReportConfig,
  GeneratedReport,
} from "./report_generator";
import { ResearchMemory } from "./memory";
import {
  PerformanceOptimizer,
  PerformanceConfig,
} from "./performance_optimizer";

// Real tools
import { RealWebSearchTool, RealSearchResult } from "./tools/real_web_search";
import {
  RealWebScraperTool,
  RealScrapedContent,
} from "./tools/real_web_scraper";
import { ToolCollection } from "../tool/tool_collection";

export interface ProductionResearchConfig {
  name?: string;
  llm?: LLM;

  // Search configuration
  search_engines?: string[];
  max_sources_per_subquery?: number;
  search_apis?: {
    serpapi_key?: string;
    bing_key?: string;
    google_key?: string;
    google_search_engine_id?: string;
  };

  // Scraping configuration
  max_scraping_depth?: number;
  use_browser_for_js_sites?: boolean;
  respect_robots_txt?: boolean;
  scraping_delay?: number;

  // Synthesis configuration
  confidence_threshold?: number;
  min_cross_validation?: number;
  citation_style?: "apa" | "mla" | "chicago" | "ieee";

  // Performance configuration
  performance?: Partial<PerformanceConfig>;

  // Quality requirements
  min_source_authority?: number;
  require_recent_sources?: boolean;
  max_bias_tolerance?: number;
}

export class ProductionDeepResearchAgent extends ReActAgent {
  private planner: ResearchPlanner;
  private synthesizer: RealInformationSynthesizer;
  private citation_manager: CitationManager;
  private report_generator: ReportGenerator;
  private research_memory: ResearchMemory;
  private performance_optimizer: PerformanceOptimizer;
  private tools: ToolCollection;

  // Configuration
  private config: Required<ProductionResearchConfig>;

  // Research state
  private current_plan: ResearchPlan | null = null;
  private current_subquery: ResearchSubquery | null = null;
  private all_search_results: RealSearchResult[] = [];
  private all_scraped_content: RealScrapedContent[] = [];
  private synthesis: RealResearchSynthesis | null = null;

  constructor(config: ProductionResearchConfig = {}) {
    const llm = config.llm || LLM.getInstance("production_research");

    super({
      name: config.name || "ProductionDeepResearchAgent",
      description:
        "Production-grade AI research agent with real APIs, advanced synthesis, and quality validation",
      system_prompt: ProductionDeepResearchAgent.get_system_prompt(),
      llm,
      max_steps: 50, // Production research can be complex
    });

    this.config = {
      name: config.name || "ProductionDeepResearchAgent",
      llm,
      search_engines: config.search_engines || ["serpapi"],
      max_sources_per_subquery: config.max_sources_per_subquery || 15,
      search_apis: config.search_apis || {},
      max_scraping_depth: config.max_scraping_depth || 10,
      use_browser_for_js_sites: config.use_browser_for_js_sites ?? false,
      respect_robots_txt: config.respect_robots_txt ?? true,
      scraping_delay: config.scraping_delay || 2000,
      confidence_threshold: config.confidence_threshold || 0.75,
      min_cross_validation: config.min_cross_validation || 2,
      citation_style: config.citation_style || "apa",
      performance: config.performance || {},
      min_source_authority: config.min_source_authority || 6,
      require_recent_sources: config.require_recent_sources ?? true,
      max_bias_tolerance: config.max_bias_tolerance || 0.3,
    };

    // Initialize components
    this.planner = new ResearchPlanner(this.llm);
    this.research_memory = new ResearchMemory();
    this.synthesizer = new RealInformationSynthesizer(
      this.llm,
      this.research_memory
    );
    this.citation_manager = new CitationManager();
    this.report_generator = new ReportGenerator();
    this.performance_optimizer = new PerformanceOptimizer(
      this.config.performance
    );

    // Initialize real tools - prioritize working APIs only
    const search_config: any = {};

    // Only add SerpAPI if we have the key (it's working)
    if (this.config.search_apis.serpapi_key) {
      search_config.serpapi = { api_key: this.config.search_apis.serpapi_key };
      log.info(
        `SerpAPI configured with key: ${this.config.search_apis.serpapi_key.substring(
          0,
          10
        )}...`
      );
    }

    // Only add other APIs if they have keys
    if (this.config.search_apis.bing_key) {
      search_config.bing = { api_key: this.config.search_apis.bing_key };
    }

    if (
      this.config.search_apis.google_key &&
      this.config.search_apis.google_search_engine_id
    ) {
      search_config.google = {
        api_key: this.config.search_apis.google_key,
        search_engine_id: this.config.search_apis.google_search_engine_id,
      };
    }

    // Don't add DuckDuckGo - only use premium APIs
    if (Object.keys(search_config).length === 0) {
      throw new Error(
        "No premium search APIs configured. Please add SerpAPI, Bing, or Google API keys."
      );
    }

    const search_tool = new RealWebSearchTool(search_config);

    const scraper_tool = new RealWebScraperTool({
      user_agent:
        "ProductionDeepResearchAgent/1.0 (+https://example.com/research-bot)",
    });

    this.tools = new ToolCollection([search_tool, scraper_tool]);

    // Override memory with research memory
    this.memory = this.research_memory;

    log.info(`Production Deep Research Agent initialized: ${this.name}`);
    log.info(
      `Configured search engines: ${this.config.search_engines.join(", ")}`
    );
    log.info(
      `API keys configured: ${Object.keys(this.config.search_apis).length}`
    );
  }

  private static get_system_prompt(): string {
    return `You are a production-grade Deep Research Agent designed for comprehensive, professional research with real data sources and APIs.

CORE CAPABILITIES:
- Real-time web search across multiple search engines
- Intelligent web scraping with content quality assessment
- Advanced information synthesis with cross-validation
- Professional citation generation and source attribution
- Quality assessment and confidence scoring
- Performance optimization and parallel processing

RESEARCH METHODOLOGY (5 PHASES):
1. PLANNING: Decompose query into focused, prioritized subqueries
2. SEARCH: Execute parallel searches across multiple engines and source types
3. SCRAPING: Extract high-quality content from authoritative sources
4. SYNTHESIS: Cross-validate information and generate insights with confidence scores
5. REPORTING: Generate professional reports with citations and quality metrics

QUALITY STANDARDS:
- Prioritize authoritative sources (academic, government, established media)
- Require cross-validation from multiple independent sources
- Maintain transparency about confidence levels and limitations
- Provide proper attribution with professional citations
- Identify and resolve contradictions in source material
- Flag potential biases and research gaps

DECISION MAKING:
- Use ReAct pattern: comprehensive thinking before each action
- Adapt strategy based on source quality and information gaps
- Balance breadth vs depth based on query complexity and available sources
- Continue research until confidence threshold is met or max steps reached
- Prioritize recent, authoritative sources while maintaining historical context

OUTPUT REQUIREMENTS:
- Professional-grade reports with executive summaries
- Comprehensive source attribution and bibliographies
- Quality metrics and confidence assessments
- Clear identification of limitations and research gaps
- Actionable recommendations for further research

Your goal is to produce research that meets academic and professional standards for accuracy, comprehensiveness, and reliability.`;
  }

  async think(): Promise<boolean> {
    const context = this.research_memory.get_context_for_llm();
    const progress = this.research_memory.get_research_progress();
    const performance_metrics =
      this.performance_optimizer.get_performance_metrics();

    this.update_memory(
      Role.SYSTEM,
      `RESEARCH CONTEXT:\n${context}\n\nPROGRESS: Step ${this.current_step}/${
        this.max_steps
      }\nPhase: ${
        progress.phase
      }\nCompletion: ${progress.completion_percentage.toFixed(
        1
      )}%\n\nPERFORMANCE:\nSearch Time: ${
        performance_metrics.search_time
      }ms\nScraping Time: ${
        performance_metrics.scraping_time
      }ms\nCache Hit Rate: ${(performance_metrics.cache_hit_rate * 100).toFixed(
        1
      )}%\n\nDetermine the next action based on current research state, quality requirements, and performance metrics.`
    );

    try {
      const messages = this.memory.to_dict_list();
      log.debug(
        `🧠 LLM INPUT (Think): ${messages.length} messages, last: "${messages[
          messages.length - 1
        ]?.content?.substring(0, 100)}..."`
      );

      const response = await this.llm.ask(messages, undefined, false, 0.2);

      if (!response) {
        log.warn("No response from LLM in think phase");
        return false;
      }

      log.debug(`🧠 LLM OUTPUT (Think): "${response.substring(0, 200)}..."`);
      this.update_memory(Role.ASSISTANT, response);

      // Determine if action is needed
      const should_act = this.determine_action_needed(
        progress,
        performance_metrics
      );

      log.info(`Think phase completed. Should act: ${should_act}`);

      return should_act;
    } catch (error) {
      log.error("Think phase failed:", error);
      return false;
    }
  }

  private determine_action_needed(
    progress: any,
    _performance_metrics: any
  ): boolean {
    // Check if research is complete
    if (progress.phase === "completed") {
      return false;
    }

    // Check if we've reached max steps
    if (this.current_step >= this.max_steps) {
      log.warn("Reached maximum steps, completing research");
      this.research_memory.update_research_phase("completed");
      return false;
    }

    // Continue if in active research phases
    const active_phases = [
      "planning",
      "searching",
      "scraping",
      "synthesis",
      "reporting",
    ];
    if (!active_phases.includes(progress.phase)) {
      return false;
    }

    // Check quality thresholds
    if (progress.phase === "synthesis" && this.synthesis) {
      const overall_confidence =
        this.synthesis.confidence_assessment.overall_confidence;
      if (overall_confidence >= this.config.confidence_threshold) {
        log.info(
          `Confidence threshold met: ${(overall_confidence * 100).toFixed(1)}%`
        );
        this.research_memory.update_research_phase("reporting");
      }
    }

    return true;
  }

  async act(): Promise<string> {
    const progress = this.research_memory.get_research_progress();

    try {
      switch (progress.phase) {
        case "planning":
          return await this.execute_real_planning();
        case "searching":
          return await this.execute_real_searching();
        case "scraping":
          return await this.execute_real_scraping();
        case "synthesis":
          return await this.execute_real_synthesis();
        case "reporting":
          return await this.execute_real_reporting();
        default:
          log.warn(`Unknown research phase: ${progress.phase}`);
          return "Unknown research phase, completing research";
      }
    } catch (error) {
      log.error(`Action failed in ${progress.phase} phase:`, error);
      this.research_memory.update_research_phase("completed");
      this.state = AgentState.ERROR;
      return `Research failed in ${progress.phase} phase: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  private async execute_real_planning(): Promise<string> {
    log.info("Executing real research planning phase");

    const query = this.research_memory.export_research_state().context.query;
    if (!query) {
      throw new Error("No research query found in memory");
    }

    try {
      this.current_plan = await this.planner.create_research_plan(query);
      this.research_memory.initialize_research(query, this.current_plan);

      // Optimize execution plan
      const optimized_subqueries =
        this.performance_optimizer.optimize_execution_plan(this.current_plan);
      this.current_plan.subqueries = optimized_subqueries;

      this.update_memory(
        Role.SYSTEM,
        `RESEARCH PLAN CREATED:\n${this.planner.get_plan_summary(
          this.current_plan
        )}\n\nSubqueries optimized for execution efficiency.`
      );

      this.research_memory.update_research_phase("searching");

      return `Research planning completed. Created optimized plan with ${this.current_plan.subqueries.length} subqueries. Estimated time: ${this.current_plan.time_estimate} minutes. Moving to search phase.`;
    } catch (error) {
      log.error("Real planning failed:", error);
      throw error;
    }
  }

  private async execute_real_searching(): Promise<string> {
    log.info("Executing real search phase with production APIs");

    if (!this.current_plan) {
      throw new Error("No research plan available");
    }

    const completed_ids =
      this.research_memory.export_research_state().context.completed_subqueries;
    this.current_subquery = this.planner.get_next_subquery(
      this.current_plan,
      completed_ids
    );

    if (!this.current_subquery) {
      this.research_memory.update_research_phase("scraping");
      return `All subqueries searched (${completed_ids.length} total). Moving to content scraping phase.`;
    }

    this.research_memory.set_current_subquery(this.current_subquery);

    try {
      // Execute searches using real APIs
      const search_tool = this.tools.get_tool(
        "real_web_search"
      ) as RealWebSearchTool;

      // Perform general search with detailed logging
      log.info(
        `🔍 SEARCH INPUT: Query="${
          this.current_subquery.query
        }", Engines=[${this.config.search_engines.join(
          ", "
        )}], Max Results=${Math.ceil(
          this.config.max_sources_per_subquery * 0.6
        )}`
      );

      const general_search = await search_tool.execute({
        query: this.current_subquery.query,
        max_results: Math.ceil(this.config.max_sources_per_subquery * 0.6),
        engines: this.config.search_engines,
        time_range: this.config.require_recent_sources ? "year" : "all",
      });

      log.info(
        `🔍 SEARCH RESULT: Error=${!!general_search.error}, Output Length=${
          general_search.output?.length || 0
        }`
      );

      // Perform specialized searches based on query type
      let academic_results: RealSearchResult[] = [];
      let news_results: RealSearchResult[] = [];
      let government_results: RealSearchResult[] = [];

      if (
        this.current_subquery.type === "analytical" ||
        this.current_subquery.type === "factual"
      ) {
        try {
          academic_results = await search_tool.search_academic_sources(
            this.current_subquery.query,
            Math.ceil(this.config.max_sources_per_subquery * 0.3)
          );
        } catch (error) {
          log.warn("Academic search failed:", error);
        }
      }

      if (
        this.current_subquery.type === "trend" ||
        this.config.require_recent_sources
      ) {
        try {
          news_results = await search_tool.search_news_sources(
            this.current_subquery.query,
            Math.ceil(this.config.max_sources_per_subquery * 0.2)
          );
        } catch (error) {
          log.warn("News search failed:", error);
        }
      }

      try {
        government_results = await search_tool.search_government_sources(
          this.current_subquery.query,
          Math.ceil(this.config.max_sources_per_subquery * 0.2)
        );
      } catch (error) {
        log.warn("Government search failed:", error);
      }

      // Combine and process results
      let all_results: RealSearchResult[] = [];

      if (!general_search.error) {
        const general_data = JSON.parse(general_search.output);
        all_results.push(...general_data.results);
        log.info(
          `📊 GENERAL SEARCH: Found ${general_data.results.length} results`
        );
        general_data.results.slice(0, 3).forEach((result: any, i: number) => {
          log.debug(
            `   ${i + 1}. "${result.title}" (${result.domain}) - Authority: ${
              result.source_authority
            }/10`
          );
        });
      } else {
        log.warn(`❌ GENERAL SEARCH FAILED: ${general_search.error}`);
      }

      all_results.push(
        ...academic_results,
        ...news_results,
        ...government_results
      );

      log.info(
        `📊 TOTAL RESULTS: ${all_results.length} (General: ${
          !general_search.error
            ? JSON.parse(general_search.output).results.length
            : 0
        }, Academic: ${academic_results.length}, News: ${
          news_results.length
        }, Gov: ${government_results.length})`
      );

      // Filter by quality thresholds
      const quality_filtered = all_results.filter(
        (result) =>
          (result.source_authority || 0) >= this.config.min_source_authority
      );

      // Store results
      this.all_search_results.push(...quality_filtered);

      // Record discovered sources in memory
      quality_filtered.forEach((result) => {
        this.research_memory.add_discovered_source(result.url, {
          id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: result.url,
          title: result.title,
          domain: result.domain,
          authority_score: result.source_authority || 5,
          relevance_score: result.relevance_score || 0.5,
          content_type: this.classify_content_type(result.domain),
          published_date: result.published_date,
          // word_count: result.snippet.split(" ").length,
          // credibility_indicators: [],
          // extraction_quality: 0.7,
        });
      });

      // Complete this subquery
      this.research_memory.complete_subquery(this.current_subquery.id);

      this.update_memory(
        Role.SYSTEM,
        `SEARCH COMPLETED for "${this.current_subquery.query}"\nFound ${
          quality_filtered.length
        } high-quality sources (${
          all_results.length - quality_filtered.length
        } filtered out for low authority)\nTotal sources discovered: ${
          this.all_search_results.length
        }`
      );

      return `Search completed for subquery: "${this.current_subquery.query}". Found ${quality_filtered.length} quality sources. Total discovered: ${this.all_search_results.length}. Continuing with next subquery.`;
    } catch (error) {
      log.error("Real search failed:", error);
      throw error;
    }
  }

  private async execute_real_scraping(): Promise<string> {
    log.info(
      "Executing real scraping phase with intelligent content extraction"
    );

    if (this.all_search_results.length === 0) {
      this.research_memory.update_research_phase("synthesis");
      return "No sources to scrape. Moving to synthesis phase.";
    }

    try {
      // Select high-quality sources for scraping
      const scraping_candidates = this.all_search_results
        .filter(
          (result) =>
            (result.source_authority || 0) >= this.config.min_source_authority
        )
        .sort((a, b) => (b.source_authority || 0) - (a.source_authority || 0))
        .slice(0, this.config.max_scraping_depth);

      log.info(`Selected ${scraping_candidates.length} sources for scraping`);

      const scraper_tool = this.tools.get_tool(
        "real_web_scraper"
      ) as RealWebScraperTool;

      // Execute scraping with performance optimization
      const scraped_results =
        await this.performance_optimizer.execute_scraping_optimized(
          scraping_candidates.map((s) => s.url),
          async (url: string) => {
            const result = await scraper_tool.execute({
              url,
              extract_type: "readable",
              max_content_length: 25000,
              include_images: false,
              include_tables: true,
              timeout: 45,
              use_browser: this.config.use_browser_for_js_sites,
              wait_for_content: 3000,
            });

            if (result.error) {
              throw new Error(result.error);
            }

            return JSON.parse(result.output);
          }
        );

      // Filter scraped content by quality
      const quality_content = scraped_results.filter(
        (content) =>
          content.quality_score >= 0.5 && content.metadata.word_count >= 200
      );

      // Adapt scraped content to expected schema with all required properties
      const adapted_content = quality_content.map((content) => ({
        ...content,
        clean_text: content.content,
        markdown: content.content,
        quality_metrics: {
          credibility_score: content.quality_score,
          authority_indicators: [],
          readability_score: content.quality_score,
        },
        scrape_duration: 0,
        extracted_data: {
          ...content.extracted_data,
          paragraphs: [content.content],
          quotes: [],
          tables: [],
        },
        metadata: {
          ...content.metadata,
          description: content.metadata.content_type,
          modified_date: content.metadata.published_date,
          canonical_url: content.url,
          keywords: [],
        },
      }));

      this.all_scraped_content.push(...adapted_content);

      // Update memory with scraped sources - create compatible source info
      quality_content.forEach((content) => {
        const sourceInfo = {
          id: `scraped_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          url: content.url,
          title: content.title,
          domain: content.metadata.domain,
          authority_score: this.calculate_content_authority(content),
          relevance_score: content.quality_score,
          content_type: this.classify_content_type(content.metadata.domain),
          published_date: content.metadata.published_date,
          author: content.metadata.author,
        };
        this.research_memory.add_discovered_source(content.url, sourceInfo);
      });

      this.research_memory.update_research_phase("synthesis");

      this.update_memory(
        Role.SYSTEM,
        `SCRAPING COMPLETED\nSuccessfully scraped: ${quality_content.length}/${
          scraping_candidates.length
        }\nTotal content extracted: ${quality_content.reduce(
          (sum, c) => sum + c.metadata.word_count,
          0
        )} words\nAverage quality score: ${(
          (quality_content.reduce((sum, c) => sum + c.quality_score, 0) /
            quality_content.length) *
          100
        ).toFixed(1)}%`
      );

      return `Content scraping completed. Successfully extracted ${
        quality_content.length
      } high-quality sources with ${quality_content.reduce(
        (sum, c) => sum + c.metadata.word_count,
        0
      )} total words. Moving to synthesis phase.`;
    } catch (error) {
      log.error("Real scraping failed:", error);
      throw error;
    }
  }

  private async execute_real_synthesis(): Promise<string> {
    log.info("Executing real synthesis phase with advanced AI analysis");

    if (
      this.all_search_results.length === 0 &&
      this.all_scraped_content.length === 0
    ) {
      throw new Error("No research data available for synthesis");
    }

    try {
      // Prepare data for synthesis
      const research_data = {
        query: this.research_memory.export_research_state().context.query,
        search_results: this.all_search_results,
        scraped_content: this.all_scraped_content,
      };

      log.info(
        `Starting synthesis with ${research_data.search_results.length} search results and ${research_data.scraped_content.length} scraped sources`
      );

      // Perform real synthesis using advanced AI
      this.synthesis =
        await this.performance_optimizer.execute_synthesis_optimized(
          research_data,
          async (data) => await this.synthesizer.synthesize_research(data)
        );

      // Validate synthesis quality
      const quality_check = this.validate_synthesis_quality(this.synthesis);
      if (!quality_check.meets_standards) {
        log.warn("Synthesis quality below standards:", quality_check.issues);

        // Attempt to improve synthesis if quality is poor
        if (this.current_step < this.max_steps - 10) {
          return await this.improve_synthesis_quality(quality_check.issues);
        }
      }

      // Add sources to citation manager - normalize content types
      const normalized_sources = this.synthesis.sources.map((source) => ({
        ...source,
        content_type: this.normalize_content_type(
          source.content_type as string
        ),
      }));
      this.citation_manager.add_sources(normalized_sources);

      // Create citations for insights - adapt schema
      const adaptedInsights = this.synthesis.insights.map((insight) => ({
        ...insight,
        key_points: insight.evidence_summary ? [insight.evidence_summary] : [],
        insight_type: insight.insight_type as
          | "trend"
          | "definition"
          | "fact"
          | "opinion"
          | "analysis"
          | "prediction",
      }));
      this.citation_manager.create_citations_for_insights(adaptedInsights);

      // Store validated insights in memory - adapt to memory schema
      this.synthesis.insights.forEach((insight) => {
        const adaptedInsight = {
          ...insight,
          key_points: insight.evidence_summary
            ? [insight.evidence_summary]
            : [],
          insight_type: insight.insight_type as
            | "trend"
            | "definition"
            | "fact"
            | "opinion"
            | "analysis"
            | "prediction",
        };
        this.research_memory.add_validated_insight(adaptedInsight);
      });

      this.research_memory.update_research_phase("reporting");

      this.update_memory(
        Role.SYSTEM,
        `SYNTHESIS COMPLETED\nGenerated: ${
          this.synthesis.insights.length
        } insights\nOverall Confidence: ${(
          this.synthesis.confidence_assessment.overall_confidence * 100
        ).toFixed(1)}%\nContradictions Found: ${
          this.synthesis.contradictions.length
        }\nResearch Gaps: ${
          this.synthesis.research_gaps.length
        }\nQuality Assessment: ${
          quality_check.meets_standards ? "MEETS STANDARDS" : "BELOW STANDARDS"
        }`
      );

      return `Advanced synthesis completed. Generated ${
        this.synthesis.insights.length
      } insights from ${
        this.synthesis.sources.length
      } sources. Overall confidence: ${(
        this.synthesis.confidence_assessment.overall_confidence * 100
      ).toFixed(1)}%. Identified ${
        this.synthesis.contradictions.length
      } contradictions and ${
        this.synthesis.research_gaps.length
      } research gaps. Moving to reporting phase.`;
    } catch (error) {
      log.error("Real synthesis failed:", error);
      throw error;
    }
  }

  private validate_synthesis_quality(synthesis: RealResearchSynthesis): {
    meets_standards: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check minimum thresholds
    if (synthesis.insights.length < 3) {
      issues.push("Insufficient insights generated");
    }

    if (
      synthesis.confidence_assessment.overall_confidence <
      this.config.confidence_threshold
    ) {
      issues.push(
        `Overall confidence ${(
          synthesis.confidence_assessment.overall_confidence * 100
        ).toFixed(1)}% below threshold ${(
          this.config.confidence_threshold * 100
        ).toFixed(1)}%`
      );
    }

    if (synthesis.sources.length < 5) {
      issues.push("Insufficient source diversity");
    }

    const high_confidence_insights = synthesis.insights.filter(
      (i) => i.confidence_score >= 0.7
    ).length;
    if (high_confidence_insights < synthesis.insights.length * 0.5) {
      issues.push("Too many low-confidence insights");
    }

    // Check bias indicators
    const total_bias_indicators = synthesis.insights.reduce(
      (sum, i) => sum + (i.bias_indicators?.length || 0),
      0
    );
    const bias_ratio = total_bias_indicators / synthesis.insights.length;
    if (bias_ratio > this.config.max_bias_tolerance) {
      issues.push(`High bias indicator ratio: ${bias_ratio.toFixed(2)}`);
    }

    return {
      meets_standards: issues.length === 0,
      issues,
    };
  }

  private async improve_synthesis_quality(issues: string[]): Promise<string> {
    log.info("Attempting to improve synthesis quality");

    // If we need more sources, search for additional ones
    if (
      issues.some(
        (i) => i.includes("source diversity") || i.includes("confidence")
      )
    ) {
      // Search for additional high-authority sources
      const additional_search = await this.search_additional_sources();
      if (additional_search > 0) {
        return `Found ${additional_search} additional sources. Re-running synthesis to improve quality.`;
      }
    }

    // Continue with current synthesis despite quality issues
    log.warn(
      "Could not improve synthesis quality, proceeding with current results"
    );
    this.research_memory.update_research_phase("reporting");
    return "Synthesis quality improvement attempted. Proceeding to reporting phase.";
  }

  private async search_additional_sources(): Promise<number> {
    try {
      const query = this.research_memory.export_research_state().context.query;
      const search_tool = this.tools.get_tool(
        "real_web_search"
      ) as RealWebSearchTool;

      // Search with modified query for different perspectives
      const modified_queries = [
        `"${query}" academic research`,
        `"${query}" government report`,
        `"${query}" expert analysis`,
        `"${query}" case study`,
      ];

      let additional_count = 0;

      for (const mod_query of modified_queries) {
        try {
          const result = await search_tool.execute({
            query: mod_query,
            max_results: 5,
            engines: ["serpapi"],
          });

          if (!result.error) {
            const data = JSON.parse(result.output);
            const quality_results = data.results.filter(
              (r: RealSearchResult) =>
                (r.source_authority || 0) >= this.config.min_source_authority
            );

            this.all_search_results.push(...quality_results);
            additional_count += quality_results.length;
          }
        } catch (error) {
          log.warn(`Additional search failed for: ${mod_query}`, error);
        }
      }

      return additional_count;
    } catch (error) {
      log.error("Additional source search failed:", error);
      return 0;
    }
  }

  private async execute_real_reporting(): Promise<string> {
    log.info(
      "Executing real reporting phase with comprehensive output generation"
    );

    if (!this.synthesis || !this.current_plan) {
      throw new Error("Missing synthesis or plan data for reporting");
    }

    try {
      // Generate citation report
      const citations = this.citation_manager.generate_citation_report();

      // Validate citations
      const citation_validation = this.citation_manager.validate_citations();
      if (!citation_validation.valid) {
        log.warn("Citation validation issues:", citation_validation.issues);
      }

      // Prepare comprehensive report data - adapt schema completely
      const adapted_synthesis = {
        ...this.synthesis,
        key_findings: this.synthesis.key_findings.map((finding) =>
          typeof finding === "string" ? finding : finding.finding
        ),
        insights: this.synthesis.insights.map((insight) => ({
          ...insight,
          key_points: insight.evidence_summary
            ? [insight.evidence_summary]
            : [],
          insight_type: insight.insight_type as
            | "trend"
            | "definition"
            | "fact"
            | "opinion"
            | "analysis"
            | "prediction",
          related_topics: insight.related_concepts || [],
        })),
      };

      const report_data = {
        research_plan: this.current_plan,
        synthesis: adapted_synthesis,
        citations,
      };

      // Validate report data
      const data_validation =
        this.report_generator.validate_report_data(report_data);
      if (!data_validation.valid) {
        log.warn("Report data validation issues:", data_validation.issues);
      }

      // Generate primary report (Markdown)
      const report_config: ReportConfig = {
        format: "markdown",
        include_citations: true,
        include_methodology: true,
        include_confidence_scores: true,
        include_source_analysis: true,
        citation_style: this.config.citation_style,
        executive_summary_length: "long",
        detail_level: "comprehensive",
      };

      const primary_report = await this.report_generator.generate_report(
        report_data,
        report_config
      );

      // Store reports and data
      this.research_memory.store_working_data(
        "final_report_markdown",
        primary_report
      );
      this.research_memory.store_working_data("citation_report", citations);
      this.research_memory.store_working_data(
        "research_synthesis",
        this.synthesis
      );
      this.research_memory.store_working_data(
        "performance_metrics",
        this.performance_optimizer.get_performance_metrics()
      );

      // Complete research
      this.research_memory.update_research_phase("completed");
      this.state = AgentState.COMPLETED;

      const final_metrics = this.get_comprehensive_metrics();
      const summary = this.research_memory.get_research_summary();

      this.update_memory(
        Role.SYSTEM,
        `RESEARCH COMPLETED SUCCESSFULLY\n\n${summary}\n\nFINAL METRICS:\n${JSON.stringify(
          final_metrics,
          null,
          2
        )}`
      );

      return `Production research completed successfully! Generated comprehensive report with:\n- ${
        this.synthesis.insights.length
      } validated insights\n- ${citations.total_citations} citations from ${
        citations.total_sources
      } sources\n- ${(
        this.synthesis.confidence_assessment.overall_confidence * 100
      ).toFixed(1)}% overall confidence\n- ${
        final_metrics.total_words
      } words of content analyzed\n- ${final_metrics.processing_time.toFixed(
        2
      )}s total processing time\n\nQuality Grade: ${this.calculate_quality_grade()}`;
    } catch (error) {
      log.error("Real reporting failed:", error);
      throw error;
    }
  }

  // Public API methods
  async conduct_production_research(query: string): Promise<GeneratedReport> {
    log.info(`Starting production research for query: "${query}"`);

    // Validate query
    if (!query || query.trim().length < 10) {
      throw new Error("Query must be at least 10 characters long");
    }

    try {
      // Initialize research with query - start with empty plan, will be created in planning phase
      const initial_plan: ResearchPlan = {
        main_query: query,
        research_objectives: [],
        subqueries: [],
        search_strategy: "",
        expected_sources: 0,
        time_estimate: 0,
      };

      this.research_memory.initialize_research(query, initial_plan);

      // Start the research process
      const _result = await this.run(query);

      // Return the final report
      const final_report = this.research_memory.retrieve_working_data(
        "final_report_markdown"
      );
      if (!final_report) {
        throw new Error("Research completed but no final report generated");
      }

      return final_report;
    } catch (error) {
      log.error("Production research failed:", error);
      throw new Error(
        `Production research failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private classify_content_type(
    domain: string
  ):
    | "article"
    | "news"
    | "research_paper"
    | "blog"
    | "documentation"
    | "other" {
    if (
      domain.includes("arxiv.org") ||
      domain.includes("pubmed") ||
      domain.includes("nature.com")
    ) {
      return "research_paper";
    }
    if (
      domain.includes("news") ||
      domain.includes("reuters") ||
      domain.includes("bbc")
    ) {
      return "news";
    }
    if (domain.includes(".gov")) {
      return "other"; // Map government to other
    }
    if (domain.includes(".edu")) {
      return "other"; // Map academic to other
    }
    return "article";
  }

  private normalize_content_type(
    content_type: string
  ):
    | "article"
    | "news"
    | "research_paper"
    | "blog"
    | "documentation"
    | "other" {
    const normalized_types = [
      "article",
      "news",
      "research_paper",
      "blog",
      "documentation",
      "other",
    ];
    if (normalized_types.includes(content_type)) {
      return content_type as any;
    }
    // Map invalid types to valid ones
    if (content_type === "government" || content_type === "academic") {
      return "other";
    }
    return "article";
  }

  private calculate_content_authority(content: RealScrapedContent): number {
    let authority = 5; // Base score

    // Domain authority
    if (content.metadata.domain.includes(".edu")) authority += 2;
    if (content.metadata.domain.includes(".gov")) authority += 2;
    if (content.metadata.domain.includes("wikipedia.org")) authority += 1.5;

    // Content quality indicators
    authority += content.quality_metrics.authority_indicators.length * 0.5;
    authority += content.quality_metrics.credibility_score * 2;

    // Content depth
    if (content.metadata.word_count > 2000) authority += 1;
    if (content.extracted_data.headings.length > 5) authority += 0.5;

    return Math.min(10, Math.max(1, authority));
  }

  private get_comprehensive_metrics(): any {
    const performance_metrics =
      this.performance_optimizer.get_performance_metrics();
    const progress = this.research_memory.get_research_progress();
    const _quality = this.research_memory.get_quality_assessment();

    return {
      total_sources:
        this.all_search_results.length + this.all_scraped_content.length,
      search_results: this.all_search_results.length,
      scraped_content: this.all_scraped_content.length,
      total_words: this.all_scraped_content.reduce(
        (sum, c) => sum + c.metadata.word_count,
        0
      ),
      processing_time: performance_metrics.total_execution_time / 1000,
      cache_hit_rate: performance_metrics.cache_hit_rate,
      memory_usage: performance_metrics.memory_usage,
      insights_generated: progress.insights_validated,
      average_confidence:
        this.synthesis?.confidence_assessment.overall_confidence || 0,
      research_phase: progress.phase,
      completion_percentage: progress.completion_percentage,
    };
  }

  private calculate_quality_grade(): string {
    if (!this.synthesis) return "N/A";

    const confidence = this.synthesis.confidence_assessment.overall_confidence;

    if (confidence >= 0.9) return "A+ (Excellent)";
    if (confidence >= 0.8) return "A (Very Good)";
    if (confidence >= 0.7) return "B (Good)";
    if (confidence >= 0.6) return "C (Acceptable)";
    return "D (Needs Improvement)";
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    try {
      // Cleanup scraper browser instances
      const scraper_tool = this.tools.get_tool(
        "real_web_scraper"
      ) as RealWebScraperTool;
      await scraper_tool.cleanup();

      // Cleanup performance optimizer
      this.performance_optimizer.dispose();

      // Cleanup memory
      this.research_memory.cleanup_old_data();

      log.info("Production agent cleanup completed");
    } catch (error) {
      log.error("Cleanup failed:", error);
    }
  }

  // Advanced API methods
  async get_detailed_performance_report(): Promise<any> {
    const metrics = this.performance_optimizer.get_performance_metrics();
    const bottleneck_analysis =
      this.performance_optimizer.analyze_bottlenecks();
    const cache_stats = this.performance_optimizer.get_cache_stats();

    return {
      performance_metrics: metrics,
      bottleneck_analysis,
      cache_statistics: cache_stats,
      optimization_recommendations: bottleneck_analysis.recommendations,
    };
  }

  async export_complete_research_package(): Promise<any> {
    return {
      research_data: this.export_research_data(),
      performance_report: await this.get_detailed_performance_report(),
      quality_metrics: this.get_quality_assessment(),
      raw_sources: {
        search_results: this.all_search_results,
        scraped_content: this.all_scraped_content,
      },
      configuration: this.config,
      session_metadata: {
        agent_name: this.name,
        completion_time: new Date().toISOString(),
        total_steps: this.current_step,
        final_state: this.state,
      },
    };
  }

  // Missing methods that are referenced
  export_research_data(): any {
    return {
      plan: this.current_plan,
      search_results: this.all_search_results,
      scraped_content: this.all_scraped_content,
      synthesis: this.synthesis,
      metrics: this.get_comprehensive_metrics(),
    };
  }

  get_quality_assessment(): any {
    if (!this.synthesis) {
      return {
        overall_score: 0,
        confidence_score: 0,
        source_count: this.all_search_results.length,
        insights_count: 0,
      };
    }

    return {
      overall_score: this.synthesis.confidence_assessment.overall_confidence,
      confidence_score: this.synthesis.confidence_assessment.overall_confidence,
      source_count: this.synthesis.sources.length,
      insights_count: this.synthesis.insights.length,
      quality_grade: this.calculate_quality_grade(),
    };
  }

  get_research_progress(): any {
    return this.research_memory.get_research_progress();
  }

  async generate_additional_formats(formats: string[]): Promise<any[]> {
    if (!this.synthesis || !this.current_plan) {
      throw new Error("Research not completed yet");
    }

    const citations = this.citation_manager.generate_citation_report();
    const report_data = {
      research_plan: this.current_plan,
      synthesis: this.synthesis,
      citations,
    };

    const reports = [];
    for (const format of formats) {
      const config = { format: format as any, include_citations: true };
      const report = await this.report_generator.generate_report(
        report_data,
        config
      );
      reports.push({ format, content: report });
    }
    return reports;
  }
}
