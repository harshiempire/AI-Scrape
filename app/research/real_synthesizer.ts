import { z } from "zod";
import { LLM } from "../llm";
import { Memory, Message, Role } from "../../schema";
import { ResearchMemory } from "./memory";
import { log } from "../logger";
import { RealScrapedContent } from "./tools/real_web_scraper";
import { RealSearchResult } from "./tools/real_web_search";

// Real synthesis schemas with enhanced validation
export const RealSourceInfoSchema = z.object({
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
    "government",
    "academic",
    "other",
  ]),
  published_date: z.string().optional(),
  author: z.string().optional(),
  word_count: z.number().optional(),
  credibility_indicators: z.array(z.string()),
  extraction_quality: z.number().min(0).max(1),
});

export const RealSynthesizedInsightSchema = z.object({
  id: z.string(),
  content: z.string(),
  evidence_summary: z.string(),
  confidence_score: z.number().min(0).max(1),
  supporting_sources: z.array(z.string()), // source IDs
  contradicting_sources: z.array(z.string()).optional(),
  neutral_sources: z.array(z.string()).optional(),
  insight_type: z.enum([
    "fact",
    "trend",
    "analysis",
    "opinion",
    "prediction",
    "definition",
    "comparison",
    "causal_relationship",
  ]),
  key_evidence: z.array(z.string()),
  limitations: z.array(z.string()),
  related_topics: z.array(z.string()),
  certainty_level: z.enum(["very_high", "high", "medium", "low", "very_low"]),
  bias_indicators: z.array(z.string()).optional(),
});

export const RealResearchSynthesisSchema = z.object({
  query: z.string(),
  executive_summary: z.string(),
  key_findings: z.array(
    z.object({
      finding: z.string(),
      confidence: z.number().min(0).max(1),
      supporting_evidence: z.array(z.string()),
      source_count: z.number(),
    })
  ),
  insights: z.array(RealSynthesizedInsightSchema),
  sources: z.array(RealSourceInfoSchema),
  evidence_map: z.record(z.array(z.string())), // Maps claims to source IDs
  contradictions: z.array(
    z.object({
      topic: z.string(),
      claim_a: z.string(),
      claim_b: z.string(),
      sources_a: z.array(z.string()),
      sources_b: z.array(z.string()),
      resolution_attempt: z.string().optional(),
    })
  ),
  confidence_assessment: z.object({
    overall_confidence: z.number().min(0).max(1),
    data_quality: z.number().min(0).max(1),
    source_diversity: z.number().min(0).max(1),
    information_completeness: z.number().min(0).max(1),
    bias_risk: z.number().min(0).max(1),
    temporal_relevance: z.number().min(0).max(1),
  }),
  research_gaps: z.array(
    z.object({
      gap: z.string(),
      priority: z.enum(["critical", "high", "medium", "low"]),
      suggested_sources: z.array(z.string()),
    })
  ),
  recommendations: z.array(
    z.object({
      recommendation: z.string(),
      rationale: z.string(),
      priority: z.enum(["immediate", "high", "medium", "low"]),
      actionable: z.boolean(),
    })
  ),
  synthesis_metadata: z.object({
    total_sources: z.number(),
    synthesis_time: z.number(),
    processing_timestamp: z.string(),
    methodology: z.string(),
    llm_model: z.string(),
    synthesis_iterations: z.number(),
  }),
});

export type RealSourceInfo = z.infer<typeof RealSourceInfoSchema>;
export type RealSynthesizedInsight = z.infer<
  typeof RealSynthesizedInsightSchema
>;
export type RealResearchSynthesis = z.infer<typeof RealResearchSynthesisSchema>;

interface RealResearchData {
  search_results: RealSearchResult[];
  scraped_content: RealScrapedContent[];
  query: string;
}

export class RealInformationSynthesizer {
  private llm: LLM;
  private memory: ResearchMemory;
  private synthesis_iterations: number = 0;

  constructor(llm: LLM, memory?: ResearchMemory) {
    this.llm = llm;
    this.memory = memory || new ResearchMemory();
    log.info("Real information synthesizer initialized");
  }

  async synthesize_research(
    data: RealResearchData
  ): Promise<RealResearchSynthesis> {
    log.info(`Starting real synthesis for query: "${data.query}"`);
    const start_time = Date.now();
    this.synthesis_iterations = 0;

    try {
      // Step 1: Prepare and validate sources
      const sources = await this.prepare_real_sources(data);
      log.info(`Prepared ${sources.length} sources for synthesis`);

      // Step 2: Extract and validate claims
      const claims = await this.extract_claims_from_sources(data, sources);
      log.info(`Extracted ${claims.length} claims from sources`);

      // Step 3: Cross-validate information
      const validated_insights = await this.cross_validate_information(
        claims,
        sources,
        data.query
      );
      log.info(`Generated ${validated_insights.length} validated insights`);

      // Step 4: Detect contradictions
      const contradictions = await this.detect_contradictions(
        validated_insights,
        sources
      );
      log.info(`Detected ${contradictions.length} contradictions`);

      // Step 5: Generate executive summary and findings
      const { executive_summary, key_findings } =
        await this.generate_executive_summary(
          data.query,
          validated_insights,
          sources
        );

      // Step 6: Assess research quality and gaps
      const confidence_assessment = this.calculate_confidence_assessment(
        sources,
        validated_insights
      );
      const research_gaps = await this.identify_research_gaps(
        data.query,
        sources,
        validated_insights
      );
      const recommendations = await this.generate_recommendations(
        data.query,
        validated_insights,
        research_gaps
      );

      const synthesis_time = (Date.now() - start_time) / 1000;

      const synthesis: RealResearchSynthesis = {
        query: data.query,
        executive_summary,
        key_findings,
        insights: validated_insights,
        sources,
        evidence_map: this.create_evidence_map(validated_insights),
        contradictions,
        confidence_assessment,
        research_gaps,
        recommendations,
        synthesis_metadata: {
          total_sources: sources.length,
          synthesis_time,
          processing_timestamp: new Date().toISOString(),
          methodology:
            "Multi-step LLM synthesis with cross-validation and contradiction detection",
          llm_model: this.llm.config_name,
          synthesis_iterations: this.synthesis_iterations,
        },
      };

      log.info(`Real synthesis completed in ${synthesis_time.toFixed(2)}s`);
      return synthesis;
    } catch (error) {
      log.error("Real synthesis failed:", error);
      throw new Error(
        `Real synthesis failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async prepare_real_sources(
    data: RealResearchData
  ): Promise<RealSourceInfo[]> {
    const sources: RealSourceInfo[] = [];
    let source_id = 0;

    // Process search results
    data.search_results.forEach((result) => {
      sources.push({
        id: `search_${source_id++}`,
        url: result.url,
        title: result.title,
        domain: result.domain,
        authority_score: result.source_authority || 5,
        relevance_score: result.relevance_score || 0.5,
        content_type: this.classify_source_type(result.domain, result.title),
        published_date: result.published_date,
        author: undefined,
        word_count: result.snippet.split(" ").length,
        credibility_indicators: this.analyze_credibility_indicators(
          result.domain,
          result.title
        ),
        extraction_quality: 0.7, // Search results have limited content
      });
    });

    // Process scraped content
    data.scraped_content.forEach((content) => {
      sources.push({
        id: `scraped_${source_id++}`,
        url: content.url,
        title: content.title,
        domain: content.metadata.domain,
        authority_score: this.calculate_authority_from_content(content),
        relevance_score: content.quality_metrics.credibility_score,
        content_type: content.metadata.content_type as any,
        published_date: content.metadata.published_date,
        author: content.metadata.author,
        word_count: content.metadata.word_count,
        credibility_indicators: content.quality_metrics.authority_indicators,
        extraction_quality: content.quality_metrics.readability_score,
      });
    });

    return sources;
  }

  private async extract_claims_from_sources(
    data: RealResearchData,
    sources: RealSourceInfo[]
  ): Promise<any[]> {
    this.synthesis_iterations++;

    this.memory.clear();
    this.memory.add_message(
      Message.system_message(this.get_claim_extraction_prompt())
    );

    // Create context with all source content
    const context = this.create_extraction_context(data, sources);

    this.memory.add_message(
      Message.user_message(
        `Extract factual claims and key insights from the following research data for the query: "${data.query}"\n\n${context}`
      )
    );

    try {
      const response = await this.llm.ask(
        this.memory.to_dict_list(),
        undefined,
        true,
        0.1
      );

      if (!response) {
        throw new Error("No response from LLM for claim extraction");
      }

      // Parse the structured response
      const claims = this.parse_claims_response(response);
      log.info(`Extracted ${claims.length} claims from LLM analysis`);

      return claims;
    } catch (error) {
      log.error("Claim extraction failed:", error);
      throw error;
    }
  }

  private get_claim_extraction_prompt(): string {
    return `You are an expert research analyst. Your task is to extract factual claims, insights, and key information from multiple sources.

For each piece of information, you must:
1. Identify the specific claim or insight
2. Determine the type of information (fact, trend, analysis, etc.)
3. Assess the strength of evidence
4. Note which sources support the claim
5. Identify any limitations or caveats

Guidelines:
- Focus on objective, verifiable information
- Distinguish between facts and opinions
- Note the quality and authority of supporting sources
- Identify patterns and trends across sources
- Flag potential biases or conflicts of interest
- Extract quantitative data when available

Return your analysis as a structured list of claims with:
- Claim text
- Evidence type (direct quote, data point, expert opinion, etc.)
- Supporting source IDs
- Confidence level
- Any limitations or caveats`;
  }

  private create_extraction_context(
    data: RealResearchData,
    sources: RealSourceInfo[]
  ): string {
    let context = `RESEARCH QUERY: ${data.query}\n\n`;
    context += `TOTAL SOURCES: ${sources.length}\n\n`;

    // Add search results
    if (data.search_results.length > 0) {
      context += "=== SEARCH RESULTS ===\n";
      data.search_results.forEach((result, index) => {
        const source = sources.find((s) => s.url === result.url);
        context += `[${source?.id || `search_${index}`}] ${result.title}\n`;
        context += `Domain: ${result.domain} (Authority: ${result.source_authority}/10)\n`;
        context += `Content: ${result.snippet}\n\n`;
      });
    }

    // Add scraped content
    if (data.scraped_content.length > 0) {
      context += "=== DETAILED CONTENT ===\n";
      data.scraped_content.forEach((content, index) => {
        const source = sources.find((s) => s.url === content.url);
        context += `[${source?.id || `scraped_${index}`}] ${content.title}\n`;
        context += `Domain: ${content.metadata.domain} (Words: ${content.metadata.word_count})\n`;
        context += `Author: ${content.metadata.author || "Unknown"}\n`;
        context += `Published: ${
          content.metadata.published_date || "Unknown"
        }\n`;

        // Add key content sections
        if (content.extracted_data.headings.length > 0) {
          context += `Headings: ${content.extracted_data.headings
            .map((h) => h.text)
            .join(", ")}\n`;
        }

        if (content.extracted_data.key_points.length > 0) {
          context += `Key Points: ${content.extracted_data.key_points.join(
            "; "
          )}\n`;
        }

        // Add content (truncated)
        const content_preview =
          content.clean_text.length > 2000
            ? content.clean_text.substring(0, 2000) + "..."
            : content.clean_text;
        context += `Content: ${content_preview}\n\n`;
      });
    }

    return context;
  }

  private parse_claims_response(response: string): any[] {
    // Parse the LLM response to extract structured claims
    const claims: any[] = [];

    // Look for structured patterns in the response
    const sections = response.split(/\n(?=\d+\.|[•\-\*])/);

    sections.forEach((section, index) => {
      const lines = section.trim().split("\n");
      if (lines.length === 0) return;

      const claim_text = lines[0].replace(/^\d+\.\s*|^[•\-\*]\s*/, "").trim();

      if (claim_text.length < 10) return; // Skip very short claims

      // Extract metadata from the section
      const evidence_line = lines.find(
        (l) =>
          l.toLowerCase().includes("evidence:") ||
          l.toLowerCase().includes("source:")
      );
      const confidence_line = lines.find((l) =>
        l.toLowerCase().includes("confidence:")
      );
      const type_line = lines.find((l) => l.toLowerCase().includes("type:"));

      claims.push({
        id: `claim_${index}`,
        text: claim_text,
        evidence_type: this.extract_evidence_type(evidence_line || ""),
        confidence: this.extract_confidence(confidence_line || ""),
        type: this.extract_claim_type(type_line || claim_text),
        raw_section: section,
      });
    });

    return claims;
  }

  private extract_evidence_type(line: string): string {
    const types = [
      "direct quote",
      "data point",
      "expert opinion",
      "study result",
      "statistical data",
    ];
    for (const type of types) {
      if (line.toLowerCase().includes(type)) return type;
    }
    return "general evidence";
  }

  private extract_confidence(line: string): number {
    const confidence_match = line.match(/(\d+)%|high|medium|low/i);
    if (!confidence_match) return 0.5;

    const match = confidence_match[0].toLowerCase();
    if (match.includes("%")) {
      return parseInt(match) / 100;
    }

    const confidence_map: Record<string, number> = {
      high: 0.8,
      medium: 0.6,
      low: 0.4,
    };

    return confidence_map[match] || 0.5;
  }

  private extract_claim_type(text: string): string {
    const type_indicators: Record<string, string[]> = {
      fact: ["is", "are", "was", "were", "has", "have", "shows", "indicates"],
      trend: [
        "increasing",
        "decreasing",
        "growing",
        "declining",
        "trend",
        "pattern",
      ],
      analysis: ["analysis", "suggests", "implies", "demonstrates", "reveals"],
      opinion: ["believes", "thinks", "argues", "claims", "opinion", "view"],
      prediction: [
        "will",
        "expected",
        "forecast",
        "predict",
        "future",
        "likely",
      ],
      definition: ["defined as", "refers to", "means", "definition", "concept"],
      comparison: ["compared to", "versus", "than", "different", "similar"],
    };

    const lower_text = text.toLowerCase();

    for (const [type, indicators] of Object.entries(type_indicators)) {
      if (indicators.some((indicator) => lower_text.includes(indicator))) {
        return type;
      }
    }

    return "analysis"; // Default type
  }

  private async cross_validate_information(
    claims: any[],
    sources: RealSourceInfo[],
    query: string
  ): Promise<RealSynthesizedInsight[]> {
    this.synthesis_iterations++;

    log.info("Starting cross-validation of extracted claims");

    this.memory.clear();
    this.memory.add_message(
      Message.system_message(this.get_validation_prompt())
    );

    // Group claims by topic/theme
    const claim_groups = this.group_claims_by_topic(claims);
    const validated_insights: RealSynthesizedInsight[] = [];

    for (const [topic, topic_claims] of Object.entries(claim_groups)) {
      const validation_context = this.create_validation_context(
        topic_claims,
        sources,
        query
      );

      this.memory.add_message(
        Message.user_message(
          `Cross-validate these claims about "${topic}" for the query "${query}":\n\n${validation_context}`
        )
      );

      try {
        const messages = this.memory.to_dict_list();
        log.debug(
          "🔍 DEBUG: messages type:",
          typeof messages,
          "isArray:",
          Array.isArray(messages),
          "length:",
          messages?.length
        );
        const response = await this.llm.ask(messages, undefined, true, 0.2);

        if (response) {
          const insight = await this.parse_validation_response(
            response,
            topic_claims,
            sources
          );
          if (insight) {
            validated_insights.push(insight);
          }
        }
      } catch (error) {
        log.warn(`Validation failed for topic: ${topic}`, error);
      }
    }

    log.info(
      `Cross-validation completed: ${validated_insights.length} insights validated`
    );
    return validated_insights;
  }

  private get_validation_prompt(): string {
    return `You are an expert fact-checker and research validator. Your task is to cross-validate information from multiple sources and assess reliability.

For each claim or group of related claims, you must:
1. Check for consistency across sources
2. Assess the quality and authority of supporting evidence
3. Identify any contradictions or conflicts
4. Determine confidence levels based on evidence strength
5. Note limitations, biases, or gaps in the evidence
6. Distinguish between well-supported facts and opinions

Validation criteria:
- Multiple independent sources increase confidence
- Primary sources are preferred over secondary
- Recent data is generally more reliable for current topics
- Academic and government sources typically have higher authority
- Look for methodological rigor in studies and analyses
- Consider potential conflicts of interest or bias

Output requirements:
- Provide a confidence score (0.0-1.0) for each validated insight
- List supporting and contradicting evidence
- Identify any limitations or caveats
- Classify the type of insight (fact, trend, analysis, etc.)
- Note the certainty level and any bias indicators`;
  }

  private group_claims_by_topic(claims: any[]): Record<string, any[]> {
    // Simple topic grouping based on keywords and similarity
    const groups: Record<string, any[]> = {};

    claims.forEach((claim) => {
      const topic = this.extract_topic_from_claim(claim.text);
      if (!groups[topic]) {
        groups[topic] = [];
      }
      groups[topic].push(claim);
    });

    return groups;
  }

  private extract_topic_from_claim(claim_text: string): string {
    // Extract the main topic/subject from a claim
    const words = claim_text.toLowerCase().split(/\s+/);
    const stop_words = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ]);

    const meaningful_words = words.filter(
      (word) => word.length > 2 && !stop_words.has(word)
    );

    // Return first few meaningful words as topic
    return meaningful_words.slice(0, 3).join(" ");
  }

  private create_validation_context(
    claims: any[],
    sources: RealSourceInfo[],
    query: string
  ): string {
    let context = `Topic Claims to Validate:\n`;

    claims.forEach((claim, index) => {
      context += `${index + 1}. ${claim.text}\n`;
      context += `   Type: ${claim.type}\n`;
      context += `   Initial Confidence: ${(claim.confidence * 100).toFixed(
        0
      )}%\n\n`;
    });

    context += `\nRelevant Sources:\n`;
    sources.forEach((source) => {
      context += `[${source.id}] ${source.title} (${source.domain})\n`;
      context += `  Authority: ${source.authority_score}/10, Type: ${source.content_type}\n`;
      if (source.published_date) {
        context += `  Published: ${source.published_date}\n`;
      }
      context += `\n`;
    });

    return context;
  }

  private async parse_validation_response(
    response: string,
    claims: any[],
    sources: RealSourceInfo[]
  ): Promise<RealSynthesizedInsight | null> {
    try {
      // Extract the main validated insight
      const insight_match = response.match(
        /(?:insight|conclusion|finding):\s*(.+?)(?:\n|$)/i
      );
      if (!insight_match) return null;

      const main_insight = insight_match[1].trim();

      // Extract confidence score
      const confidence_match = response.match(/confidence:\s*(\d+(?:\.\d+)?)/i);
      const confidence = confidence_match
        ? parseFloat(confidence_match[1])
        : 0.5;

      // Extract supporting sources
      const source_matches = response.match(/\[([^\]]+)\]/g) || [];
      const supporting_sources = source_matches
        .map((match) => match.replace(/[\[\]]/g, ""))
        .filter((id) => sources.some((s) => s.id === id));

      // Generate insight
      const insight: RealSynthesizedInsight = {
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: main_insight,
        evidence_summary: this.summarize_evidence(claims, sources),
        confidence_score: Math.min(1, Math.max(0, confidence)),
        supporting_sources,
        insight_type: this.determine_insight_type(main_insight),
        key_evidence: this.extract_key_evidence(response),
        limitations: this.extract_limitations(response),
        related_topics: this.extract_related_topics(main_insight),
        certainty_level: this.determine_certainty_level(confidence),
        bias_indicators: this.identify_bias_indicators(
          response,
          sources,
          supporting_sources
        ),
      };

      return insight;
    } catch (error) {
      log.error("Failed to parse validation response:", error);
      return null;
    }
  }

  private summarize_evidence(claims: any[], sources: RealSourceInfo[]): string {
    const evidence_types = claims.map((c) => c.evidence_type);
    const unique_types = [...new Set(evidence_types)];

    return `Evidence from ${claims.length} claims across ${
      unique_types.length
    } evidence types: ${unique_types.join(", ")}`;
  }

  private determine_insight_type(
    content: string
  ): RealSynthesizedInsight["insight_type"] {
    const lower_content = content.toLowerCase();

    if (
      lower_content.includes("definition") ||
      lower_content.includes("refers to")
    ) {
      return "definition";
    }
    if (
      lower_content.includes("trend") ||
      lower_content.includes("increasing") ||
      lower_content.includes("decreasing")
    ) {
      return "trend";
    }
    if (
      lower_content.includes("predict") ||
      lower_content.includes("future") ||
      lower_content.includes("will")
    ) {
      return "prediction";
    }
    if (
      lower_content.includes("compared to") ||
      lower_content.includes("versus")
    ) {
      return "comparison";
    }
    if (
      lower_content.includes("because") ||
      lower_content.includes("due to") ||
      lower_content.includes("causes")
    ) {
      return "causal_relationship";
    }
    if (
      lower_content.includes("opinion") ||
      lower_content.includes("believes") ||
      lower_content.includes("argues")
    ) {
      return "opinion";
    }

    // Check for factual indicators
    const fact_indicators = [
      "is",
      "are",
      "shows",
      "demonstrates",
      "indicates",
      "reports",
    ];
    if (
      fact_indicators.some((indicator) => lower_content.includes(indicator))
    ) {
      return "fact";
    }

    return "analysis"; // Default
  }

  private extract_key_evidence(response: string): string[] {
    const evidence: string[] = [];

    // Look for evidence markers
    const evidence_patterns = [
      /evidence:\s*(.+?)(?:\n|$)/gi,
      /supports?(?:ed|ing)?\s+by:\s*(.+?)(?:\n|$)/gi,
      /according to:\s*(.+?)(?:\n|$)/gi,
      /data shows?:\s*(.+?)(?:\n|$)/gi,
    ];

    evidence_patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        evidence.push(match[1].trim());
      }
    });

    return evidence.slice(0, 5);
  }

  private extract_limitations(response: string): string[] {
    const limitations: string[] = [];

    const limitation_patterns = [
      /limitation(?:s)?:\s*(.+?)(?:\n|$)/gi,
      /caveat(?:s)?:\s*(.+?)(?:\n|$)/gi,
      /however[,:]?\s*(.+?)(?:\n|$)/gi,
      /but\s+(.+?)(?:\n|$)/gi,
    ];

    limitation_patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        limitations.push(match[1].trim());
      }
    });

    return limitations.slice(0, 3);
  }

  private extract_related_topics(content: string): string[] {
    // Extract related topics/concepts from the content
    const words = content.toLowerCase().split(/\s+/);
    const topics: string[] = [];

    // Look for capitalized terms (potential proper nouns/concepts)
    const original_words = content.split(/\s+/);
    original_words.forEach((word) => {
      if (/^[A-Z][a-z]+/.test(word) && word.length > 3) {
        topics.push(word);
      }
    });

    return [...new Set(topics)].slice(0, 5);
  }

  private determine_certainty_level(
    confidence: number
  ): RealSynthesizedInsight["certainty_level"] {
    if (confidence >= 0.9) return "very_high";
    if (confidence >= 0.7) return "high";
    if (confidence >= 0.5) return "medium";
    if (confidence >= 0.3) return "low";
    return "very_low";
  }

  private identify_bias_indicators(
    response: string,
    sources: RealSourceInfo[],
    supporting_source_ids: string[]
  ): string[] {
    const bias_indicators: string[] = [];

    // Check source diversity
    const supporting_sources = sources.filter((s) =>
      supporting_source_ids.includes(s.id)
    );
    const unique_domains = new Set(supporting_sources.map((s) => s.domain));

    if (unique_domains.size === 1 && supporting_sources.length > 1) {
      bias_indicators.push("SINGLE_DOMAIN_SOURCES");
    }

    // Check for temporal bias
    const dated_sources = supporting_sources.filter((s) => s.published_date);
    if (dated_sources.length > 0) {
      const dates = dated_sources.map((s) =>
        new Date(s.published_date!).getTime()
      );
      const date_range = Math.max(...dates) - Math.min(...dates);
      const one_year_ms = 365 * 24 * 60 * 60 * 1000;

      if (date_range < one_year_ms / 4) {
        // All sources within 3 months
        bias_indicators.push("TEMPORAL_CLUSTERING");
      }
    }

    // Check for authority bias
    const low_authority_sources = supporting_sources.filter(
      (s) => s.authority_score < 6
    );
    if (low_authority_sources.length > supporting_sources.length * 0.7) {
      bias_indicators.push("LOW_AUTHORITY_SOURCES");
    }

    return bias_indicators;
  }

  private async detect_contradictions(
    insights: RealSynthesizedInsight[],
    sources: RealSourceInfo[]
  ): Promise<any[]> {
    log.info("Detecting contradictions between insights");

    const contradictions: any[] = [];

    // Compare insights pairwise for contradictions
    for (let i = 0; i < insights.length; i++) {
      for (let j = i + 1; j < insights.length; j++) {
        const insight_a = insights[i];
        const insight_b = insights[j];

        // Check if insights cover related topics
        const topic_overlap = insight_a.related_topics.some((topic) =>
          insight_b.related_topics.includes(topic)
        );

        if (topic_overlap) {
          const contradiction = await this.check_for_contradiction(
            insight_a,
            insight_b,
            sources
          );
          if (contradiction) {
            contradictions.push(contradiction);
          }
        }
      }
    }

    return contradictions;
  }

  private async check_for_contradiction(
    insight_a: RealSynthesizedInsight,
    insight_b: RealSynthesizedInsight,
    sources: RealSourceInfo[]
  ): Promise<any | null> {
    this.synthesis_iterations++;

    // Use LLM to determine if insights contradict each other
    this.memory.clear();
    this.memory.add_message(
      Message.system_message(
        `Determine if these two research insights contradict each other. Consider:
      1. Do they make opposing claims about the same topic?
      2. Are there factual disagreements?
      3. Could both be true in different contexts?
      4. What is the nature of any contradiction?`
      )
    );

    this.memory.add_message(
      Message.user_message(
        `Insight A: ${insight_a.content}\nInsight B: ${insight_b.content}\n\nDo these insights contradict each other? If so, explain the nature of the contradiction.`
      )
    );

    try {
      const response = await this.llm.ask(
        this.memory.to_dict_list(),
        undefined,
        true,
        0.1
      );

      if (response && response.toLowerCase().includes("contradict")) {
        return {
          topic: insight_a.related_topics[0] || "general",
          claim_a: insight_a.content,
          claim_b: insight_b.content,
          sources_a: insight_a.supporting_sources,
          sources_b: insight_b.supporting_sources,
          resolution_attempt: response.trim(),
        };
      }

      return null;
    } catch (error) {
      log.warn("Contradiction detection failed:", error);
      return null;
    }
  }

  private async generate_executive_summary(
    query: string,
    insights: RealSynthesizedInsight[],
    sources: RealSourceInfo[]
  ): Promise<{ executive_summary: string; key_findings: any[] }> {
    this.synthesis_iterations++;

    this.memory.clear();
    this.memory.add_message(
      Message.system_message(
        `Generate a comprehensive executive summary and key findings based on validated research insights.
      
      The summary should:
      1. Directly address the research query
      2. Highlight the most important findings
      3. Note the overall confidence level
      4. Mention the scope and limitations of the research
      5. Be concise but comprehensive (200-400 words)
      
      Key findings should:
      1. Be specific and actionable
      2. Include confidence levels
      3. Reference supporting evidence
      4. Be ranked by importance`
      )
    );

    const insights_summary = insights
      .map(
        (insight, index) =>
          `${index + 1}. [${insight.certainty_level}] ${
            insight.content
          } (Confidence: ${(insight.confidence_score * 100).toFixed(0)}%)`
      )
      .join("\n");

    this.memory.add_message(
      Message.user_message(
        `Research Query: "${query}"\n\nValidated Insights:\n${insights_summary}\n\nTotal Sources: ${
          sources.length
        }\nAverage Source Authority: ${(
          sources.reduce((sum, s) => sum + s.authority_score, 0) /
          sources.length
        ).toFixed(1)}/10\n\nGenerate executive summary and key findings.`
      )
    );

    try {
      const response = await this.llm.ask(
        this.memory.to_dict_list(),
        undefined,
        true,
        0.3
      );

      if (!response) {
        throw new Error("No response for executive summary generation");
      }

      // Parse the response to extract summary and findings
      const { summary, findings } = this.parse_executive_response(
        response,
        insights,
        sources
      );

      return {
        executive_summary: summary,
        key_findings: findings,
      };
    } catch (error) {
      log.error("Executive summary generation failed:", error);

      // Fallback generation
      const fallback = this.generate_fallback_summary(query, insights, sources);
      return {
        executive_summary: fallback.summary,
        key_findings: fallback.findings,
      };
    }
  }

  private parse_executive_response(
    response: string,
    insights: RealSynthesizedInsight[],
    sources: RealSourceInfo[]
  ): { summary: string; findings: any[] } {
    const lines = response.split("\n");
    let summary = "";
    const findings: any[] = [];
    let current_section = "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (
        trimmed.toLowerCase().includes("executive summary") ||
        trimmed.toLowerCase().includes("summary:")
      ) {
        current_section = "summary";
        continue;
      }

      if (
        trimmed.toLowerCase().includes("key findings") ||
        trimmed.toLowerCase().includes("findings:")
      ) {
        current_section = "findings";
        continue;
      }

      if (current_section === "summary" && trimmed) {
        summary += trimmed + " ";
      }

      if (
        current_section === "findings" &&
        trimmed &&
        (trimmed.match(/^\d+\./) || trimmed.startsWith("-"))
      ) {
        const finding_text = trimmed.replace(/^\d+\.\s*|-\s*/, "");
        if (finding_text.length > 10) {
          findings.push({
            finding: finding_text,
            confidence: this.extract_confidence_from_finding(finding_text),
            supporting_evidence: [],
            source_count: sources.length,
          });
        }
      }
    }

    return {
      summary:
        summary.trim() || this.generate_default_summary(insights, sources),
      findings:
        findings.length > 0
          ? findings
          : this.generate_default_findings(insights),
    };
  }

  private extract_confidence_from_finding(finding: string): number {
    const confidence_indicators: Record<string, number> = {
      conclusively: 0.9,
      clearly: 0.8,
      strongly: 0.8,
      indicates: 0.7,
      suggests: 0.6,
      appears: 0.5,
      might: 0.4,
      possibly: 0.3,
    };

    const lower_finding = finding.toLowerCase();

    for (const [indicator, confidence] of Object.entries(
      confidence_indicators
    )) {
      if (lower_finding.includes(indicator)) {
        return confidence;
      }
    }

    return 0.6; // Default medium confidence
  }

  private generate_fallback_summary(
    query: string,
    insights: RealSynthesizedInsight[],
    sources: RealSourceInfo[]
  ): { summary: string; findings: any[] } {
    const avg_confidence =
      insights.reduce((sum, i) => sum + i.confidence_score, 0) /
      insights.length;
    const avg_authority =
      sources.reduce((sum, s) => sum + s.authority_score, 0) / sources.length;

    const summary = `Research analysis of "${query}" based on ${
      sources.length
    } sources reveals ${
      insights.length
    } key insights with an average confidence level of ${(
      avg_confidence * 100
    ).toFixed(
      0
    )}%. The analysis draws from sources with an average authority score of ${avg_authority.toFixed(
      1
    )}/10, providing a comprehensive overview of the topic.`;

    const findings = insights.slice(0, 5).map((insight) => ({
      finding: insight.content,
      confidence: insight.confidence_score,
      supporting_evidence: insight.key_evidence,
      source_count: insight.supporting_sources.length,
    }));

    return { summary, findings };
  }

  private generate_default_findings(insights: RealSynthesizedInsight[]): any[] {
    return insights.slice(0, 5).map((insight) => ({
      finding: insight.content,
      confidence: insight.confidence_score,
      supporting_evidence: insight.key_evidence,
      source_count: insight.supporting_sources.length,
    }));
  }

  private generate_default_summary(
    insights: RealSynthesizedInsight[],
    sources: RealSourceInfo[]
  ): string {
    const avg_confidence =
      insights.reduce((sum, i) => sum + i.confidence_score, 0) /
      insights.length;

    return `Research synthesis generated ${insights.length} insights from ${
      sources.length
    } sources with an average confidence of ${(avg_confidence * 100).toFixed(
      0
    )}%.`;
  }

  // Helper methods
  private classify_source_type(
    domain: string,
    title: string
  ): RealSourceInfo["content_type"] {
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
      return "government";
    }
    if (domain.includes(".edu") || title.toLowerCase().includes("university")) {
      return "academic";
    }
    if (domain.includes("blog") || title.toLowerCase().includes("blog")) {
      return "blog";
    }
    return "article";
  }

  private analyze_credibility_indicators(
    domain: string,
    title: string
  ): string[] {
    const indicators: string[] = [];

    if (domain.includes(".edu") || domain.includes(".gov")) {
      indicators.push("INSTITUTIONAL_DOMAIN");
    }

    if (
      title.toLowerCase().includes("study") ||
      title.toLowerCase().includes("research")
    ) {
      indicators.push("RESEARCH_CONTENT");
    }

    return indicators;
  }

  private calculate_authority_from_content(
    content: RealScrapedContent
  ): number {
    let authority = 5; // Base score

    // Domain-based authority
    authority += this.get_domain_authority_boost(content.metadata.domain);

    // Content quality indicators
    if (content.quality_metrics.authority_indicators.includes("DOI_REFERENCE"))
      authority += 2;
    if (
      content.quality_metrics.authority_indicators.includes(
        "ACADEMIC_CREDENTIALS"
      )
    )
      authority += 1;
    if (content.quality_metrics.authority_indicators.includes("PEER_REVIEWED"))
      authority += 1.5;
    if (
      content.quality_metrics.authority_indicators.includes(
        "METHODOLOGY_DISCLOSED"
      )
    )
      authority += 1;

    // Content depth and quality
    if (content.metadata.word_count > 2000) authority += 0.5;
    if (content.extracted_data.headings.length > 5) authority += 0.5;

    return Math.min(10, Math.max(1, authority));
  }

  private get_domain_authority_boost(domain: string): number {
    if (domain.includes(".edu")) return 2;
    if (domain.includes(".gov")) return 2;
    if (domain.includes("wikipedia.org")) return 1.5;
    if (domain.includes("nature.com") || domain.includes("science.org"))
      return 3;
    return 0;
  }

  private calculate_confidence_assessment(
    sources: RealSourceInfo[],
    insights: RealSynthesizedInsight[]
  ): RealResearchSynthesis["confidence_assessment"] {
    const total_sources = sources.length;
    const total_insights = insights.length;

    // Overall confidence: weighted average of insight confidences
    const overall_confidence =
      insights.length > 0
        ? insights.reduce((sum, i) => sum + i.confidence_score, 0) /
          insights.length
        : 0;

    // Data quality: based on source authority and extraction quality
    const avg_authority =
      sources.reduce((sum, s) => sum + s.authority_score, 0) /
      Math.max(1, total_sources);
    const avg_extraction_quality =
      sources.reduce((sum, s) => sum + s.extraction_quality, 0) /
      Math.max(1, total_sources);
    const data_quality =
      (avg_authority / 10) * 0.6 + avg_extraction_quality * 0.4;

    // Source diversity: unique domains and content types
    const unique_domains = new Set(sources.map((s) => s.domain)).size;
    const unique_types = new Set(sources.map((s) => s.content_type)).size;
    const source_diversity =
      (unique_domains / Math.max(1, total_sources)) * 0.6 +
      (unique_types / 8) * 0.4; // 8 possible content types

    // Information completeness: based on insights per source and evidence coverage
    const insight_density = insights.length / Math.max(1, total_sources);
    const evidence_coverage =
      insights.filter((i) => i.supporting_sources.length > 1).length /
      Math.max(1, total_insights);
    const information_completeness = Math.min(
      1,
      insight_density * 0.3 + evidence_coverage * 0.7
    );

    // Bias risk assessment
    const bias_indicators = insights.flatMap((i) => i.bias_indicators || []);
    const unique_bias_indicators = new Set(bias_indicators).size;
    const bias_risk = Math.min(1, unique_bias_indicators / 10); // More bias indicators = higher risk

    // Temporal relevance: based on source recency
    const recent_sources = sources.filter((s) => {
      if (!s.published_date) return false;
      const source_date = new Date(s.published_date);
      const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      return source_date > cutoff;
    });
    const temporal_relevance =
      recent_sources.length / Math.max(1, total_sources);

    return {
      overall_confidence,
      data_quality,
      source_diversity: Math.min(1, source_diversity),
      information_completeness,
      bias_risk,
      temporal_relevance,
    };
  }

  private async identify_research_gaps(
    query: string,
    sources: RealSourceInfo[],
    insights: RealSynthesizedInsight[]
  ): Promise<any[]> {
    this.synthesis_iterations++;

    this.memory.clear();
    this.memory.add_message(
      Message.system_message(
        `Identify gaps in the research coverage for the given query. Consider:
      1. What aspects of the query are not well covered?
      2. What types of sources are missing?
      3. What temporal gaps exist in the data?
      4. What perspectives or viewpoints are underrepresented?
      5. What would strengthen the research?`
      )
    );

    const gap_context = this.create_gap_analysis_context(
      query,
      sources,
      insights
    );
    this.memory.add_message(Message.user_message(gap_context));

    try {
      const response = await this.llm.ask(
        this.memory.to_dict_list(),
        undefined,
        true,
        0.4
      );

      if (!response) {
        return this.generate_default_gaps(sources, insights);
      }

      return this.parse_research_gaps(response);
    } catch (error) {
      log.error("Research gap identification failed:", error);
      return this.generate_default_gaps(sources, insights);
    }
  }

  private create_gap_analysis_context(
    query: string,
    sources: RealSourceInfo[],
    insights: RealSynthesizedInsight[]
  ): string {
    let context = `Research Query: "${query}"\n\n`;

    context += `Source Analysis:\n`;
    context += `- Total Sources: ${sources.length}\n`;
    context += `- Content Types: ${[
      ...new Set(sources.map((s) => s.content_type)),
    ].join(", ")}\n`;
    context += `- Domains: ${[...new Set(sources.map((s) => s.domain))].join(
      ", "
    )}\n`;
    context += `- Average Authority: ${(
      sources.reduce((sum, s) => sum + s.authority_score, 0) / sources.length
    ).toFixed(1)}/10\n\n`;

    context += `Insight Analysis:\n`;
    context += `- Total Insights: ${insights.length}\n`;
    context += `- Insight Types: ${[
      ...new Set(insights.map((i) => i.insight_type)),
    ].join(", ")}\n`;
    context += `- Average Confidence: ${(
      (insights.reduce((sum, i) => sum + i.confidence_score, 0) /
        insights.length) *
      100
    ).toFixed(0)}%\n\n`;

    context += `Please identify what research gaps exist and what additional sources or perspectives would strengthen this analysis.`;

    return context;
  }

  private parse_research_gaps(response: string): any[] {
    const gaps: any[] = [];

    const gap_patterns = [
      /gap:\s*(.+?)(?:\n|$)/gi,
      /missing:\s*(.+?)(?:\n|$)/gi,
      /lacks?:\s*(.+?)(?:\n|$)/gi,
      /needs?:\s*(.+?)(?:\n|$)/gi,
    ];

    gap_patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        gaps.push({
          gap: match[1].trim(),
          priority: this.determine_gap_priority(match[1]),
          suggested_sources: this.suggest_gap_sources(match[1]),
        });
      }
    });

    return gaps.slice(0, 5);
  }

  private determine_gap_priority(gap_text: string): string {
    const high_priority_terms = [
      "critical",
      "essential",
      "important",
      "key",
      "major",
    ];
    const medium_priority_terms = [
      "useful",
      "helpful",
      "relevant",
      "additional",
    ];

    const lower_gap = gap_text.toLowerCase();

    if (high_priority_terms.some((term) => lower_gap.includes(term))) {
      return "high";
    }
    if (medium_priority_terms.some((term) => lower_gap.includes(term))) {
      return "medium";
    }

    return "low";
  }

  private suggest_gap_sources(gap_text: string): string[] {
    const suggestions: string[] = [];
    const lower_gap = gap_text.toLowerCase();

    if (lower_gap.includes("academic") || lower_gap.includes("research")) {
      suggestions.push("academic databases", "peer-reviewed journals");
    }
    if (lower_gap.includes("recent") || lower_gap.includes("current")) {
      suggestions.push("recent news sources", "industry reports");
    }
    if (lower_gap.includes("government") || lower_gap.includes("policy")) {
      suggestions.push("government websites", "policy documents");
    }
    if (lower_gap.includes("data") || lower_gap.includes("statistics")) {
      suggestions.push("statistical databases", "survey data");
    }

    return suggestions.length > 0
      ? suggestions
      : ["additional authoritative sources"];
  }

  private generate_default_gaps(
    sources: RealSourceInfo[],
    insights: RealSynthesizedInsight[]
  ): any[] {
    const gaps: any[] = [];

    // Check for missing source types
    const content_types = new Set(sources.map((s) => s.content_type));
    const missing_types = ["research_paper", "government", "academic"].filter(
      (type) => !content_types.has(type as any)
    );

    missing_types.forEach((type) => {
      gaps.push({
        gap: `Limited ${type.replace("_", " ")} sources`,
        priority: "medium",
        suggested_sources: [type.replace("_", " ")],
      });
    });

    // Check temporal gaps
    const recent_sources = sources.filter((s) => {
      if (!s.published_date) return false;
      const source_date = new Date(s.published_date);
      const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      return source_date > cutoff;
    });

    if (recent_sources.length < sources.length * 0.3) {
      gaps.push({
        gap: "Limited recent sources",
        priority: "high",
        suggested_sources: ["recent publications", "current news"],
      });
    }

    return gaps;
  }

  private async generate_recommendations(
    query: string,
    insights: RealSynthesizedInsight[],
    gaps: any[]
  ): Promise<any[]> {
    this.synthesis_iterations++;

    this.memory.clear();
    this.memory.add_message(
      Message.system_message(
        `Generate actionable recommendations based on research findings and identified gaps.
      
      Recommendations should be:
      1. Specific and actionable
      2. Prioritized by importance and feasibility
      3. Based on the research evidence
      4. Address identified research gaps
      5. Consider practical implications`
      )
    );

    const rec_context = `Query: "${query}"\n\nKey Insights:\n${insights
      .map((i) => `- ${i.content} (${i.certainty_level} certainty)`)
      .join("\n")}\n\nResearch Gaps:\n${gaps
      .map((g) => `- ${g.gap}`)
      .join("\n")}\n\nGenerate specific, actionable recommendations.`;

    this.memory.add_message(Message.user_message(rec_context));

    try {
      const response = await this.llm.ask(
        this.memory.to_dict_list(),
        undefined,
        true,
        0.4
      );

      if (!response) {
        return this.generate_default_recommendations(insights, gaps);
      }

      return this.parse_recommendations(response);
    } catch (error) {
      log.error("Recommendation generation failed:", error);
      return this.generate_default_recommendations(insights, gaps);
    }
  }

  private parse_recommendations(response: string): any[] {
    const recommendations: any[] = [];

    const lines = response.split("\n");

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && (trimmed.match(/^\d+\./) || trimmed.startsWith("-"))) {
        const rec_text = trimmed.replace(/^\d+\.\s*|-\s*/, "");
        if (rec_text.length > 15) {
          recommendations.push({
            recommendation: rec_text,
            rationale: "Based on research analysis",
            priority: this.determine_recommendation_priority(rec_text),
            actionable: this.is_actionable(rec_text),
          });
        }
      }
    });

    return recommendations;
  }

  private determine_recommendation_priority(rec_text: string): string {
    const immediate_terms = ["urgent", "critical", "immediate", "now"];
    const high_terms = ["important", "significant", "major", "key"];

    const lower_rec = rec_text.toLowerCase();

    if (immediate_terms.some((term) => lower_rec.includes(term))) {
      return "immediate";
    }
    if (high_terms.some((term) => lower_rec.includes(term))) {
      return "high";
    }

    return "medium";
  }

  private is_actionable(rec_text: string): boolean {
    const actionable_verbs = [
      "implement",
      "develop",
      "create",
      "establish",
      "conduct",
      "perform",
      "execute",
      "apply",
    ];
    const lower_rec = rec_text.toLowerCase();

    return actionable_verbs.some((verb) => lower_rec.includes(verb));
  }

  private generate_default_recommendations(
    insights: RealSynthesizedInsight[],
    gaps: any[]
  ): any[] {
    const recommendations: any[] = [];

    // Generate recommendations based on gaps
    gaps.forEach((gap) => {
      recommendations.push({
        recommendation: `Address research gap: ${gap.gap}`,
        rationale: "Identified during research gap analysis",
        priority: gap.priority === "high" ? "high" : "medium",
        actionable: true,
      });
    });

    // Add general recommendations based on insights
    const low_confidence_insights = insights.filter(
      (i) => i.confidence_score < 0.6
    );
    if (low_confidence_insights.length > 0) {
      recommendations.push({
        recommendation:
          "Strengthen evidence for low-confidence findings with additional authoritative sources",
        rationale: `${low_confidence_insights.length} insights have confidence below 60%`,
        priority: "high",
        actionable: true,
      });
    }

    return recommendations;
  }

  private create_evidence_map(
    insights: RealSynthesizedInsight[]
  ): Record<string, string[]> {
    const evidence_map: Record<string, string[]> = {};

    insights.forEach((insight) => {
      evidence_map[insight.content] = insight.supporting_sources;
    });

    return evidence_map;
  }
}
