/**
 * Deep Research Agent - Industry Standard Research System
 * 
 * This module provides a comprehensive deep research agent that follows
 * industry standards for AI-powered research and analysis.
 * 
 * Key Features:
 * - Advanced query decomposition and research planning
 * - Multi-source web search and intelligent scraping
 * - Cross-source information synthesis and validation
 * - Automatic citation generation and source attribution
 * - Structured report generation in multiple formats
 * - Quality assessment and confidence scoring
 * - Performance optimization and parallel processing
 * 
 * @example
 * ```typescript
 * import { DeepResearchAgent } from './app/research';
 * 
 * const agent = new DeepResearchAgent({
 *   confidence_threshold: 0.8,
 *   citation_style: 'apa',
 *   parallel_processing: true,
 * });
 * 
 * const report = await agent.conduct_research(
 *   "What are the impacts of climate change on global agriculture?"
 * );
 * 
 * console.log(report.content);
 * ```
 */

// Main agent class
export { DeepResearchAgent } from './deep_research_agent';
export type { DeepResearchAgentConfig } from './deep_research_agent';

// Research planning
export { ResearchPlanner } from './planner';
export type { ResearchPlan, ResearchSubquery } from './planner';

// Information synthesis
export { InformationSynthesizer } from './synthesizer';
export type { 
  ResearchSynthesis, 
  SynthesizedInsight, 
  SourceInfo 
} from './synthesizer';

// Citation management
export { CitationManager } from './citation';
export type { 
  Citation, 
  BibliographyEntry, 
  CitationReport 
} from './citation';

// Report generation
export { ReportGenerator } from './report_generator';
export type { 
  ReportConfig, 
  GeneratedReport 
} from './report_generator';

// Quality validation
export { QualityValidator } from './quality_validator';
export type { 
  QualityReport, 
  QualityMetrics, 
  ValidationIssue 
} from './quality_validator';

// Research memory
export { ResearchMemory } from './memory';
export type { 
  ResearchContext, 
  ResearchState 
} from './memory';

// Performance optimization
export { PerformanceOptimizer } from './performance_optimizer';
export type { PerformanceConfig, PerformanceMetrics } from './performance_optimizer';

// Research tools
export { WebSearchTool } from './tools/web_search';
export { WebScraperTool } from './tools/web_scraper';
export type { 
  SearchResult, 
  WebSearchResult 
} from './tools/web_search';
export type { ScrapedContent } from './tools/web_scraper';

// Utility functions for common research tasks
export const ResearchUtils = {
  /**
   * Create a basic research configuration for fast research
   */
  createFastConfig: () => ({
    max_sources_per_subquery: 5,
    max_scraping_depth: 3,
    confidence_threshold: 0.6,
    parallel_processing: true,
    citation_style: 'apa' as const,
  }),

  /**
   * Create a thorough research configuration for high-quality research
   */
  createThoroughConfig: () => ({
    max_sources_per_subquery: 20,
    max_scraping_depth: 15,
    confidence_threshold: 0.85,
    parallel_processing: true,
    citation_style: 'ieee' as const,
  }),

  /**
   * Create an academic research configuration
   */
  createAcademicConfig: () => ({
    max_sources_per_subquery: 15,
    max_scraping_depth: 10,
    confidence_threshold: 0.8,
    parallel_processing: true,
    citation_style: 'apa' as const,
    search_engines: ['google', 'bing'],
  }),

  /**
   * Create a business intelligence configuration
   */
  createBusinessConfig: () => ({
    max_sources_per_subquery: 12,
    max_scraping_depth: 8,
    confidence_threshold: 0.7,
    parallel_processing: true,
    citation_style: 'chicago' as const,
  }),

  /**
   * Validate a research query for complexity and feasibility
   */
  validateQuery: (query: string): { valid: boolean; issues: string[]; suggestions: string[] } => {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (query.length < 10) {
      issues.push("Query is too short for comprehensive research");
      suggestions.push("Add more specific details or context to your query");
    }

    if (query.length > 500) {
      issues.push("Query is very long and may be too complex");
      suggestions.push("Consider breaking down into multiple focused queries");
    }

    const words = query.split(/\s+/);
    if (words.length < 3) {
      issues.push("Query lacks sufficient detail");
      suggestions.push("Include more specific terms and context");
    }

    const question_words = ['what', 'how', 'why', 'when', 'where', 'who', 'which'];
    const has_question_word = question_words.some(word => 
      query.toLowerCase().includes(word)
    );

    if (!has_question_word && !query.includes('?')) {
      suggestions.push("Consider framing as a specific question for better results");
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestions,
    };
  },

  /**
   * Estimate research complexity and time requirements
   */
  estimateComplexity: (query: string): { 
    complexity: 'low' | 'medium' | 'high' | 'very_high';
    estimated_time: number; // minutes
    recommended_sources: number;
  } => {
    const words = query.split(/\s+/).length;
    const complex_terms = [
      'analyze', 'compare', 'evaluate', 'assess', 'impact', 'implications',
      'trends', 'future', 'prediction', 'comprehensive', 'detailed'
    ];
    
    const complexity_indicators = complex_terms.filter(term => 
      query.toLowerCase().includes(term)
    ).length;

    let complexity: 'low' | 'medium' | 'high' | 'very_high';
    let estimated_time: number;
    let recommended_sources: number;

    if (words <= 5 && complexity_indicators === 0) {
      complexity = 'low';
      estimated_time = 5;
      recommended_sources = 5;
    } else if (words <= 10 && complexity_indicators <= 1) {
      complexity = 'medium';
      estimated_time = 15;
      recommended_sources = 10;
    } else if (words <= 20 && complexity_indicators <= 3) {
      complexity = 'high';
      estimated_time = 30;
      recommended_sources = 15;
    } else {
      complexity = 'very_high';
      estimated_time = 60;
      recommended_sources = 25;
    }

    return { complexity, estimated_time, recommended_sources };
  },
};

// Version information
export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();

// Default export for convenience
export { DeepResearchAgent as default };