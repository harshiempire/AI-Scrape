// src/agents/analysisAgent.ts
import { Agent } from '../core/agent.js';
import { ToolRegistry } from '../core/toolRegistry.js';
import { DeepResearchQuery, ResearchContext } from './researchCoordinatorAgent.js';
import { RawResearchData, AcademicPaper, NewsArticle, SocialPost, Document } from './dataCollectionAgent.js';
import { LLMResponseParser } from '../utils/llmResponseParser.js';
import { z } from 'zod';  

export interface AnalysisResult {
  insights: ResearchInsight[];
  patterns: Pattern[];
  trends: Trend[];
  contradictions: Contradiction[];
  sentiment: SentimentAnalysis;
  topics: Topic[];
  entities: Entity[];
  metadata: {
    analysisTime: number;
    confidence: number;
    coverage: number;
  };
}

export interface ResearchInsight {
  type: 'trend' | 'pattern' | 'contradiction' | 'summary' | 'recommendation';
  content: string;
  confidence: number;
  sources: string[];
  tags: string[];
  evidence: Evidence[];
}

export interface Pattern {
  type: 'content_type' | 'temporal' | 'geographical' | 'demographic' | 'behavioral';
  description: string;
  confidence: number;
  frequency: number;
  examples: string[];
  significance: 'high' | 'medium' | 'low';
}

export interface Trend {
  direction: 'increasing' | 'decreasing' | 'stable' | 'cyclical';
  description: string;
  confidence: number;
  timeframe: string;
  magnitude: number;
  evidence: Evidence[];
}

export interface Contradiction {
  description: string;
  sources: string[];
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  resolution?: string;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral';
  distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  trends: SentimentTrend[];
  sources: SentimentBySource[];
}

export interface SentimentTrend {
  timeframe: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface SentimentBySource {
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  sampleSize: number;
}

export interface Topic {
  name: string;
  relevance: number;
  frequency: number;
  subtopics: string[];
  relatedTopics: string[];
}

export interface Entity {
  name: string;
  type: 'person' | 'organization' | 'location' | 'concept' | 'product' | 'event';
  relevance: number;
  mentions: number;
  context: string[];
}

export interface Evidence {
  source: string;
  content: string;
  relevance: number;
  type: 'quote' | 'statistic' | 'example' | 'reference';
  credibility: number;
}

// Zod schemas for structured LLM output
const PatternSchema = z.object({
  type: z.enum(['content_type', 'temporal', 'geographical', 'demographic', 'behavioral']),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  significance: z.enum(['low', 'medium', 'high']),
  examples: z.array(z.string()),
  frequency: z.number()
});

const TrendSchema = z.object({
  direction: z.enum(['increasing', 'decreasing', 'stable', 'cyclical']),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  timeframe: z.string(),
  magnitude: z.number(),
  evidence: z.array(z.object({
    source: z.string(),
    content: z.string(),
    relevance: z.number().min(0).max(1),
    type: z.enum(['quote', 'statistic', 'example', 'reference']),
    credibility: z.number().min(0).max(1)
  }))
});

const ContradictionSchema = z.object({
  description: z.string(),
  sources: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  severity: z.enum(['low', 'medium', 'high']),
  resolution: z.string().optional()
});

const TopicSchema = z.object({
  name: z.string(),
  frequency: z.number(),
  relevance: z.number().min(0).max(1),
  relatedTerms: z.array(z.string()),
  subtopics: z.array(z.string()),
  relatedTopics: z.array(z.string())
});

const EntitySchema = z.object({
  name: z.string(),
  type: z.enum(['person', 'organization', 'location', 'concept', 'product']),
  relevance: z.number().min(0).max(1),
  mentions: z.number(),
  context: z.array(z.string())
});

export class AnalysisAgent extends Agent {
  constructor(options: {
    llm: any;
    memory: any;
    tools: ToolRegistry;
    system?: string;
  }) {
    super({
      ...options,
      system: options.system || `You are a content analysis specialist focused on extracting insights from raw data.

Your capabilities:
1. Content categorization and topic modeling
2. Sentiment analysis and emotional tone detection
3. Trend identification and pattern recognition
4. Bias detection and source credibility assessment
5. Cross-reference validation and contradiction detection

Analysis approach:
- Process data systematically and objectively
- Identify key themes and patterns
- Detect potential biases or inconsistencies
- Provide confidence scores for findings
- Highlight areas requiring further investigation

Maintain analytical rigor while being open to unexpected insights.`
    });
  }

  private async generateLLMResponse(prompt: string): Promise<string> {
    const response = await this.chat(prompt);
    return response.text;
  }

  async analyzeData(data: RawResearchData, query: DeepResearchQuery): Promise<AnalysisResult> {
    const startTime = Date.now();
    console.log(`🔬 Analysis Agent starting analysis for: ${query.query}`);

    try {
      // 1. Content analysis
      const insights = await this.generateInsights(data, query);
      
      // 2. Pattern recognition
      const patterns = await this.identifyPatterns(data, query);
      
      // 3. Trend analysis
      const trends = await this.identifyTrends(data, query);
      
      // 4. Contradiction detection
      const contradictions = await this.detectContradictions(data, query);
      
      // 5. Sentiment analysis
      const sentiment = await this.analyzeSentiment(data, query);
      
      // 6. Topic modeling
      const topics = await this.extractTopics(data, query);
      
      // 7. Entity extraction
      const entities = await this.extractEntities(data, query);

      // 8. Calculate overall confidence and coverage
      const confidence = this.calculateConfidence(insights, patterns, trends, contradictions);
      const coverage = this.calculateCoverage(data);

      const analysisResult: AnalysisResult = {
        insights,
        patterns,
        trends,
        contradictions,
        sentiment,
        topics,
        entities,
        metadata: {
          analysisTime: Date.now() - startTime,
          confidence,
          coverage
        }
      };

      console.log(`✅ Analysis completed in ${analysisResult.metadata.analysisTime}ms`);
      console.log(`📊 Generated: ${insights.length} insights, ${patterns.length} patterns, ${trends.length} trends, ${contradictions.length} contradictions`);

      return analysisResult;

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  private async generateInsights(data: RawResearchData, query: DeepResearchQuery): Promise<ResearchInsight[]> {
    console.log(`💡 Generating insights for: ${query.query}`);
    
    const insights: ResearchInsight[] = [];
    const allResults = data.searchResults;

    // 1. Summary insight
    const summary = await this.generateSummary(allResults, query);
    insights.push({
      type: 'summary',
      content: summary,
      confidence: 0.8,
      sources: allResults.map(r => r.url),
      tags: ['summary', 'overview'],
      evidence: this.extractEvidence(allResults, 'summary')
    });

    // 2. Key findings insights
    const keyFindings = await this.identifyKeyFindings(allResults, query);
    insights.push(...keyFindings);

    // 3. Recommendation insights
    const recommendations = await this.generateRecommendations(allResults, query);
    insights.push(...recommendations);

    return insights;
  }

  private async generateSummary(results: any[], query: DeepResearchQuery): Promise<string> {
    const domains = Array.from(new Set(results.map(r => r.metadata?.domain || 'unknown')));
    const contentTypes = Array.from(new Set(results.map(r => r.metadata?.contentType || 'unknown')));
    
    return `Comprehensive analysis of "${query.query}" reveals ${results.length} relevant sources across ${domains.length} domains. Content distribution includes: ${contentTypes.join(', ')}. The multi-source approach provides diverse perspectives with quality validation.`;
  }

  private async identifyKeyFindings(results: any[], query: DeepResearchQuery): Promise<ResearchInsight[]> {
    const insights: ResearchInsight[] = [];
    
    // Analyze quality distribution
    const qualityScores = results.map(r => r.qualityScore || 0);
    const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    
    if (avgQuality > 0.7) {
      insights.push({
        type: 'pattern',
        content: `High-quality sources dominate the research results (average quality: ${avgQuality.toFixed(2)}), indicating reliable information availability.`,
        confidence: 0.8,
        sources: results.map(r => r.url),
        tags: ['quality', 'reliability'],
        evidence: this.extractEvidence(results, 'quality')
      });
    }

    // Analyze source diversity
    const domains = Array.from(new Set(results.map(r => r.metadata?.domain || 'unknown')));
    if (domains.length > 3) {
      insights.push({
        type: 'pattern',
        content: `Research spans ${domains.length} diverse domains, ensuring comprehensive coverage and reducing bias.`,
        confidence: 0.7,
        sources: results.map(r => r.url),
        tags: ['diversity', 'coverage'],
        evidence: this.extractEvidence(results, 'diversity')
      });
    }

    return insights;
  }

  private async generateRecommendations(results: any[], query: DeepResearchQuery): Promise<ResearchInsight[]> {
    const insights: ResearchInsight[] = [];
    
    // Generate recommendations based on findings
    const highQualityResults = results.filter(r => (r.qualityScore || 0) > 0.8);
    
    if (highQualityResults.length > 0) {
      insights.push({
        type: 'recommendation',
        content: `Focus on the ${highQualityResults.length} highest-quality sources for authoritative information on "${query.query}".`,
        confidence: 0.8,
        sources: highQualityResults.map(r => r.url),
        tags: ['recommendation', 'quality'],
        evidence: this.extractEvidence(highQualityResults, 'recommendation')
      });
    }

    return insights;
  }

  private async identifyPatterns(data: RawResearchData, query: DeepResearchQuery): Promise<Pattern[]> {
    console.log(`🔍 Identifying patterns for: ${query.query}`);
    
    const allResults = data.searchResults;
    if (allResults.length === 0) {
      return [];
    }

    const patternPrompt = `
Analyze the following research data to identify meaningful patterns for the query: "${query.query}"

Research Data:
${allResults.map((result, index) => `
${index + 1}. Title: ${result.title}
   URL: ${result.url}
   Content: ${result.content.substring(0, 200)}...
   Quality Score: ${result.qualityScore || 0}
   Domain: ${result.metadata?.domain || 'unknown'}
   Content Type: ${result.metadata?.contentType || 'unknown'}
`).join('\n')}

Identify 2-4 meaningful patterns in this data. Consider:
- Content type distribution patterns
- Quality score patterns
- Domain/source patterns
- Temporal patterns (if publish dates available)
- Geographic patterns (if location data available)

Return your analysis as a JSON array of pattern objects with this exact structure:
[
  {
    "type": "content_type|temporal|geographical|demographic|behavioral",
    "description": "Clear description of the pattern",
    "confidence": 0.0-1.0,
    "significance": "low|medium|high",
    "examples": ["example1", "example2", "example3"],
    "frequency": number_of_occurrences
  }
]

Return ONLY the JSON array, no additional text or formatting.
`;

    try {
      const response = await this.generateLLMResponse(patternPrompt);
      const patterns = LLMResponseParser.validateAndSanitize(response.trim(), z.array(PatternSchema)) || [];
      
      console.log(`✅ Identified ${patterns.length} patterns`);
      return patterns;
    } catch (error) {
      console.error('❌ Pattern identification failed:', error);
      return [];
    }
  }

  private async identifyTrends(data: RawResearchData, query: DeepResearchQuery): Promise<Trend[]> {
    console.log(`📈 Identifying trends for: ${query.query}`);
    
    const allResults = data.searchResults;
    if (allResults.length === 0) {
      return [];
    }

    const trendPrompt = `
Analyze the following research data to identify trends for the query: "${query.query}"

Research Data:
${allResults.map((result, index) => `
${index + 1}. Title: ${result.title}
   URL: ${result.url}
   Content: ${result.content.substring(0, 200)}...
   Quality Score: ${result.qualityScore || 0}
   Domain: ${result.metadata?.domain || 'unknown'}
   Content Type: ${result.metadata?.contentType || 'unknown'}
`).join('\n')}

Identify 1-3 meaningful trends in this data. Consider:
- Quality score trends across sources
- Content type distribution trends
- Domain/source concentration trends
- Information availability trends

Return your analysis as a JSON array of trend objects with this exact structure:
[
  {
    "direction": "increasing|decreasing|stable|cyclical",
    "description": "Clear description of the trend",
    "confidence": 0.0-1.0,
    "timeframe": "current|recent|long-term",
    "magnitude": strength_of_trend,
    "evidence": [
      {
        "source": "source_url",
        "content": "supporting evidence",
        "relevance": 0.0-1.0,
        "type": "quote|statistic|example|reference",
        "credibility": 0.0-1.0
      }
    ]
  }
]

Return ONLY the JSON array, no additional text or formatting.
`;

    try {
      const response = await this.generateLLMResponse(trendPrompt);
      const trends = LLMResponseParser.validateAndSanitize(response.trim(), z.array(TrendSchema)) || [];
      
      console.log(`✅ Identified ${trends.length} trends`);
      return trends;
    } catch (error) {
      console.error('❌ Trend identification failed:', error);
      return [];
    }
  }

  private async detectContradictions(data: RawResearchData, query: DeepResearchQuery): Promise<Contradiction[]> {
    console.log(`⚠️ Detecting contradictions for: ${query.query}`);
    
    const allResults = data.searchResults;
    if (allResults.length === 0) {
      return [];
    }

    const contradictionPrompt = `
Analyze the following research data to identify contradictions for the query: "${query.query}"

Research Data:
${allResults.map((result, index) => `
${index + 1}. Title: ${result.title}
   URL: ${result.url}
   Content: ${result.content.substring(0, 200)}...
   Quality Score: ${result.qualityScore || 0}
   Domain: ${result.metadata?.domain || 'unknown'}
   Content Type: ${result.metadata?.contentType || 'unknown'}
`).join('\n')}

Identify contradictions, inconsistencies, or conflicting information in this data. Consider:
- Conflicting facts or claims between sources
- Quality score inconsistencies
- Domain reliability conflicts
- Content type discrepancies

Return your analysis as a JSON array of contradiction objects with this exact structure:
[
  {
    "description": "Clear description of the contradiction",
    "sources": ["url1", "url2"],
    "confidence": 0.0-1.0,
    "severity": "low|medium|high",
    "resolution": "Suggested resolution or further investigation needed"
  }
]

Return ONLY the JSON array, no additional text or formatting.
`;

    try {
      const response = await this.generateLLMResponse(contradictionPrompt);
      const contradictions = LLMResponseParser.validateAndSanitize(response.trim(), z.array(ContradictionSchema)) || [];
      
      console.log(`✅ Identified ${contradictions.length} contradictions`);
      return contradictions;
    } catch (error) {
      console.error('❌ Contradiction detection failed:', error);
      return [];
    }
  }

  private async analyzeSentiment(data: RawResearchData, query: DeepResearchQuery): Promise<SentimentAnalysis> {
    console.log(`😊 Analyzing sentiment for: ${query.query}`);
    
    // For now, return neutral sentiment
    // In full implementation, this would use NLP libraries for sentiment analysis
    return {
      overall: 'neutral',
      distribution: {
        positive: 0.4,
        negative: 0.2,
        neutral: 0.4
      },
      trends: [],
      sources: []
    };
  }

  private async extractTopics(data: RawResearchData, query: DeepResearchQuery): Promise<Topic[]> {
    console.log(`🏷️ Extracting topics for: ${query.query}`);
    
    const allResults = data.searchResults;
    if (allResults.length === 0) {
      return [];
    }

    const topicPrompt = `
Analyze the following research data to extract key topics for the query: "${query.query}"

Research Data:
${allResults.map((result, index) => `
${index + 1}. Title: ${result.title}
   URL: ${result.url}
   Content: ${result.content.substring(0, 200)}...
   Quality Score: ${result.qualityScore || 0}
   Domain: ${result.metadata?.domain || 'unknown'}
   Content Type: ${result.metadata?.contentType || 'unknown'}
`).join('\n')}

Extract 3-6 key topics from this data. Consider:
- Main themes and concepts
- Important keywords and terms
- Related subjects and domains
- Technical or specialized terminology

Return your analysis as a JSON array of topic objects with this exact structure:
[
  {
    "name": "topic_name",
    "frequency": number_of_mentions,
    "relevance": 0.0-1.0,
    "relatedTerms": ["term1", "term2", "term3"],
    "subtopics": ["subtopic1", "subtopic2"],
    "relatedTopics": ["related1", "related2"]
  }
]

Return ONLY the JSON array, no additional text or formatting.
`;

    try {
      const response = await this.generateLLMResponse(topicPrompt);
      const topics = LLMResponseParser.validateAndSanitize(response.trim(), z.array(TopicSchema)) || [];
      
      console.log(`✅ Extracted ${topics.length} topics`);
      return topics;
    } catch (error) {
      console.error('❌ Topic extraction failed:', error);
      return [];
    }
  }

  private async extractEntities(data: RawResearchData, query: DeepResearchQuery): Promise<Entity[]> {
    console.log(`🏢 Extracting entities for: ${query.query}`);
    
    const allResults = data.searchResults;
    if (allResults.length === 0) {
      return [];
    }

    const entityPrompt = `
Analyze the following research data to extract key entities for the query: "${query.query}"

Research Data:
${allResults.map((result, index) => `
${index + 1}. Title: ${result.title}
   URL: ${result.url}
   Content: ${result.content.substring(0, 200)}...
   Quality Score: ${result.qualityScore || 0}
   Domain: ${result.metadata?.domain || 'unknown'}
   Content Type: ${result.metadata?.contentType || 'unknown'}
`).join('\n')}

Extract 3-8 key entities from this data. Consider:
- People mentioned (names, titles, roles)
- Organizations (companies, institutions, agencies)
- Locations (cities, countries, regions)
- Concepts (technologies, methodologies, theories)
- Products (tools, services, platforms)

Return your analysis as a JSON array of entity objects with this exact structure:
[
  {
    "name": "entity_name",
    "type": "person|organization|location|concept|product",
    "relevance": 0.0-1.0,
    "mentions": number_of_mentions,
    "context": ["context1", "context2", "context3"]
  }
]

Return ONLY the JSON array, no additional text or formatting.
`;

    try {
      const response = await this.generateLLMResponse(entityPrompt);
      const entities = LLMResponseParser.validateAndSanitize(response.trim(), z.array(EntitySchema)) || [];
      
      console.log(`✅ Extracted ${entities.length} entities`);
      return entities;
    } catch (error) {
      console.error('❌ Entity extraction failed:', error);
      return [];
    }
  }

  private extractEvidence(results: any[], type: string): Evidence[] {
    return results.slice(0, 3).map(result => ({
      source: result.url,
      content: result.content.substring(0, 200) + '...',
      relevance: result.relevanceScore || 0.5,
      type: 'quote' as const,
      credibility: result.qualityScore || 0.7
    }));
  }

  private calculateConfidence(insights: ResearchInsight[], patterns: Pattern[], trends: Trend[], contradictions: Contradiction[]): number {
    const allItems = [...insights, ...patterns, ...trends, ...contradictions];
    if (allItems.length === 0) return 0;
    
    const avgConfidence = allItems.reduce((sum, item) => sum + item.confidence, 0) / allItems.length;
    return avgConfidence;
  }

  private calculateCoverage(data: RawResearchData): number {
    const totalSources = data.urlsTotal;
    const uniqueSources = data.urlsProcessed.length;
    
    return totalSources > 0 ? uniqueSources / totalSources : 0;
  }
}

export default AnalysisAgent;
