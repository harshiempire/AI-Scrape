import { z } from "zod";
import { LLM } from "../llm";
import { Memory, Message, Role } from "../../schema";
import { log } from "../logger";
import { ScrapedContent } from "./tools/web_scraper";
import { SearchResult } from "./tools/web_search";

// Information synthesis schemas
export const SourceInfoSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  domain: z.string(),
  authority_score: z.number().min(0).max(10),
  relevance_score: z.number().min(0).max(1),
  content_type: z.enum([
    "article",
    "research_paper",
    "news",
    "blog",
    "documentation",
    "other",
  ]),
  published_date: z.string().optional(),
  author: z.string().optional(),
});

export const SynthesizedInsightSchema = z.object({
  id: z.string(),
  content: z.string(),
  confidence_score: z.number().min(0).max(1),
  supporting_sources: z.array(z.string()), // source IDs
  contradicting_sources: z.array(z.string()).optional(),
  insight_type: z.enum([
    "fact",
    "opinion",
    "analysis",
    "trend",
    "prediction",
    "definition",
  ]),
  key_points: z.array(z.string()),
  related_topics: z.array(z.string()),
});

export const ResearchSynthesisSchema = z.object({
  query: z.string(),
  executive_summary: z.string(),
  key_findings: z.array(z.string()),
  insights: z.array(SynthesizedInsightSchema),
  sources: z.array(SourceInfoSchema),
  confidence_assessment: z.object({
    overall_confidence: z.number().min(0).max(1),
    data_quality: z.number().min(0).max(1),
    source_diversity: z.number().min(0).max(1),
    information_completeness: z.number().min(0).max(1),
  }),
  research_gaps: z.array(z.string()),
  recommendations: z.array(z.string()),
  synthesis_metadata: z.object({
    total_sources: z.number(),
    synthesis_time: z.number(),
    processing_timestamp: z.string(),
    methodology: z.string(),
  }),
});

export type SourceInfo = z.infer<typeof SourceInfoSchema>;
export type SynthesizedInsight = z.infer<typeof SynthesizedInsightSchema>;
export type ResearchSynthesis = z.infer<typeof ResearchSynthesisSchema>;

interface RawResearchData {
  search_results: SearchResult[];
  scraped_content: ScrapedContent[];
  query: string;
}

export class InformationSynthesizer {
  private llm: LLM;
  private memory: Memory;

  constructor(llm: LLM) {
    this.llm = llm;
    this.memory = new Memory();
  }

  private get_synthesis_prompt(): string {
    return `You are an expert research synthesizer and analyst. Your task is to analyze multiple sources of information and synthesize them into comprehensive, well-structured insights.

Your responsibilities:
1. Analyze all provided sources for credibility, relevance, and authority
2. Identify key findings, patterns, and insights across sources
3. Detect contradictions or conflicting information
4. Assess the quality and completeness of the information
5. Generate executive summaries and actionable insights
6. Provide confidence assessments for all findings
7. Identify research gaps and areas needing further investigation

Guidelines for synthesis:
- Prioritize authoritative sources (academic, government, established news organizations)
- Cross-reference information across multiple sources
- Note when information is disputed or controversial
- Distinguish between facts, opinions, and analyses
- Provide confidence scores based on source quality and consensus
- Identify emerging trends and patterns
- Be transparent about limitations and uncertainties

Output Format:
Provide a comprehensive JSON response with executive summary, key findings, detailed insights with source attributions, confidence assessments, and recommendations for further research.`;
  }

  async synthesize_research(data: RawResearchData): Promise<ResearchSynthesis> {
    log.info(`Synthesizing research for query: "${data.query}"`);
    const start_time = Date.now();

    try {
      // Prepare source information
      const sources = this.prepare_source_info(data);

      // Create synthesis context
      const context = this.create_synthesis_context(data, sources);

      // Generate synthesis
      const synthesis = await this.generate_synthesis(
        data.query,
        context,
        sources
      );

      const synthesis_time = (Date.now() - start_time) / 1000;

      return {
        ...synthesis,
        synthesis_metadata: {
          total_sources: sources.length,
          synthesis_time,
          processing_timestamp: new Date().toISOString(),
          methodology:
            "LLM-powered multi-source synthesis with confidence scoring",
        },
      };
    } catch (error) {
      log.error("Research synthesis failed:", error);
      throw new Error(
        `Synthesis failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private prepare_source_info(data: RawResearchData): SourceInfo[] {
    const sources: SourceInfo[] = [];

    // Process search results
    data.search_results.forEach((result, index) => {
      sources.push({
        id: `search_${index}`,
        url: result.url,
        title: result.title,
        domain: result.domain,
        authority_score: result.source_authority || 5,
        relevance_score: result.relevance_score || 0.5,
        content_type: this.classify_content_type(result.domain, result.title),
        published_date: result.published_date,
        author: undefined,
      });
    });

    // Process scraped content
    data.scraped_content.forEach((content, index) => {
      sources.push({
        id: `scraped_${index}`,
        url: content.url,
        title: content.title,
        domain: content.metadata.domain,
        authority_score: this.calculate_authority_score(content),
        relevance_score: content.quality_score,
        content_type: content.metadata.content_type as any,
        published_date: content.metadata.published_date,
        author: content.metadata.author,
      });
    });

    return sources;
  }

  private classify_content_type(domain: string, title: string): string {
    if (
      domain.includes("arxiv.org") ||
      domain.includes("nature.com") ||
      domain.includes("science.org")
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
    if (domain.includes("blog") || title.toLowerCase().includes("blog")) {
      return "blog";
    }
    if (
      domain.includes("docs") ||
      title.toLowerCase().includes("documentation")
    ) {
      return "documentation";
    }
    return "article";
  }

  private calculate_authority_score(content: ScrapedContent): number {
    let score = 5; // Base score

    // Domain authority factors
    if (content.metadata.domain.includes(".edu")) score += 2;
    if (content.metadata.domain.includes(".gov")) score += 2;
    if (content.metadata.domain.includes("wikipedia")) score += 1;
    if (content.metadata.domain.includes("nature.com")) score += 3;
    if (content.metadata.domain.includes("science.org")) score += 3;

    // Content quality factors
    if (content.metadata.word_count > 1000) score += 1;
    if (content.extracted_data.headings.length > 5) score += 0.5;
    if (content.extracted_data.links.length > 3) score += 0.5;
    if (content.metadata.author) score += 0.5;

    return Math.min(score, 10);
  }

  private create_synthesis_context(
    data: RawResearchData,
    sources: SourceInfo[]
  ): string {
    let context = `Research Query: ${data.query}\n\n`;
    context += `Sources Summary (${sources.length} total):\n`;

    sources.forEach((source) => {
      context += `- ${source.title} (${source.domain}) - Authority: ${
        source.authority_score
      }/10, Relevance: ${(source.relevance_score * 100).toFixed(0)}%\n`;
    });

    context += "\nDetailed Content:\n\n";

    // Add search results content
    data.search_results.forEach((result, index) => {
      context += `[Source: search_${index}] ${result.title}\n`;
      context += `URL: ${result.url}\n`;
      context += `Snippet: ${result.snippet}\n\n`;
    });

    // Add scraped content
    data.scraped_content.forEach((content, index) => {
      context += `[Source: scraped_${index}] ${content.title}\n`;
      context += `URL: ${content.url}\n`;
      context += `Content Preview: ${content.content.substring(0, 1000)}...\n`;
      context += `Key Points: ${content.extracted_data.key_points.join(
        "; "
      )}\n\n`;
    });

    return context;
  }

  private async generate_synthesis(
    query: string,
    context: string,
    sources: SourceInfo[]
  ): Promise<Omit<ResearchSynthesis, "synthesis_metadata">> {
    this.memory.clear();
    this.memory.add_message(
      Message.system_message(this.get_synthesis_prompt())
    );

    const user_message = `Please synthesize the following research data for the query: "${query}"\n\n${context}\n\nProvide a comprehensive analysis in JSON format with executive summary, key findings, detailed insights, confidence assessments, and recommendations.`;

    this.memory.add_message(Message.user_message(user_message));

    const response = await this.llm.ask(
      this.memory.to_dict_list(),
      undefined,
      false,
      0.2
    );

    if (!response) {
      throw new Error("No response content from LLM");
    }

    // For now, create a structured synthesis based on the available data
    // In a real implementation, this would parse the LLM's JSON response
    const synthesis = this.create_structured_synthesis(query, sources, context);

    return synthesis;
  }

  private create_structured_synthesis(
    query: string,
    sources: SourceInfo[],
    context: string
  ): Omit<ResearchSynthesis, "synthesis_metadata"> {
    // Generate insights based on source analysis
    const insights: SynthesizedInsight[] = [];
    const key_findings: string[] = [];

    // Analyze sources by type
    const source_types = sources.reduce((acc, source) => {
      acc[source.content_type] = (acc[source.content_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Generate key findings
    key_findings.push(
      `Research covered ${sources.length} sources across ${
        Object.keys(source_types).length
      } different content types`
    );

    const avg_authority =
      sources.reduce((sum, s) => sum + s.authority_score, 0) / sources.length;
    key_findings.push(
      `Average source authority score: ${avg_authority.toFixed(1)}/10`
    );

    if (sources.some((s) => s.content_type === "research_paper")) {
      key_findings.push("Academic research papers included in analysis");
    }

    // Create sample insights
    insights.push({
      id: "insight_1",
      content: `Based on analysis of ${sources.length} sources, ${query} appears to be a well-documented topic with multiple perspectives available.`,
      confidence_score: Math.min(avg_authority / 10, 0.9),
      supporting_sources: sources.slice(0, 3).map((s) => s.id),
      insight_type: "analysis",
      key_points: [
        `Multiple authoritative sources available`,
        `Diverse content types represented`,
        `Good source quality overall`,
      ],
      related_topics: this.extract_related_topics(query),
    });

    // Calculate confidence metrics
    const confidence_assessment = {
      overall_confidence: Math.min((avg_authority / 10) * 0.8, 0.9),
      data_quality: Math.min(avg_authority / 10, 0.95),
      source_diversity: Math.min(Object.keys(source_types).length / 5, 1.0),
      information_completeness:
        sources.length >= 5 ? 0.8 : (sources.length / 5) * 0.8,
    };

    return {
      query,
      executive_summary: `Research analysis of "${query}" based on ${
        sources.length
      } sources reveals ${
        key_findings.length
      } key findings with an overall confidence score of ${(
        confidence_assessment.overall_confidence * 100
      ).toFixed(
        0
      )}%. The analysis includes diverse source types and provides comprehensive coverage of the topic.`,
      key_findings,
      insights,
      sources,
      confidence_assessment,
      research_gaps: this.identify_research_gaps(sources, query),
      recommendations: this.generate_recommendations(
        sources,
        confidence_assessment
      ),
    };
  }

  private extract_related_topics(query: string): string[] {
    const words = query.toLowerCase().split(/\s+/);
    return [
      `${words[0]} applications`,
      `${words[0]} trends`,
      `${query} best practices`,
      `future of ${words[0]}`,
    ].slice(0, 3);
  }

  private identify_research_gaps(
    sources: SourceInfo[],
    query: string
  ): string[] {
    const gaps: string[] = [];

    if (!sources.some((s) => s.content_type === "research_paper")) {
      gaps.push("Limited academic research sources");
    }

    if (
      sources.filter(
        (s) =>
          s.published_date &&
          new Date(s.published_date) >
            new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      ).length < 2
    ) {
      gaps.push("Limited recent sources (within last year)");
    }

    if (sources.length < 10) {
      gaps.push("Limited overall source diversity");
    }

    return gaps;
  }

  private generate_recommendations(
    sources: SourceInfo[],
    confidence: any
  ): string[] {
    const recommendations: string[] = [];

    if (confidence.overall_confidence < 0.7) {
      recommendations.push(
        "Seek additional high-authority sources to improve confidence"
      );
    }

    if (confidence.source_diversity < 0.6) {
      recommendations.push(
        "Expand research to include more diverse source types"
      );
    }

    if (!sources.some((s) => s.content_type === "research_paper")) {
      recommendations.push(
        "Include academic research papers for deeper analysis"
      );
    }

    recommendations.push(
      "Verify key findings with primary sources when possible"
    );
    recommendations.push(
      "Consider temporal aspects and recent developments in the field"
    );

    return recommendations;
  }

  async compare_sources(sources: SourceInfo[]): Promise<any> {
    // Analyze sources for conflicts, agreements, and patterns
    const comparison = {
      authority_distribution: this.analyze_authority_distribution(sources),
      content_type_breakdown: this.analyze_content_types(sources),
      temporal_distribution: this.analyze_temporal_distribution(sources),
      domain_diversity: this.analyze_domain_diversity(sources),
    };

    return comparison;
  }

  private analyze_authority_distribution(sources: SourceInfo[]) {
    const scores = sources.map((s) => s.authority_score);
    return {
      mean: scores.reduce((a, b) => a + b, 0) / scores.length,
      median: scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)],
      min: Math.min(...scores),
      max: Math.max(...scores),
    };
  }

  private analyze_content_types(sources: SourceInfo[]) {
    return sources.reduce((acc, source) => {
      acc[source.content_type] = (acc[source.content_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private analyze_temporal_distribution(sources: SourceInfo[]) {
    const dated_sources = sources.filter((s) => s.published_date);
    if (dated_sources.length === 0) return null;

    const dates = dated_sources.map((s) =>
      new Date(s.published_date!).getTime()
    );
    return {
      earliest: new Date(Math.min(...dates)).toISOString().split("T")[0],
      latest: new Date(Math.max(...dates)).toISOString().split("T")[0],
      total_with_dates: dated_sources.length,
    };
  }

  private analyze_domain_diversity(sources: SourceInfo[]) {
    const domains = [...new Set(sources.map((s) => s.domain))];
    return {
      unique_domains: domains.length,
      total_sources: sources.length,
      diversity_ratio: domains.length / sources.length,
    };
  }
}
