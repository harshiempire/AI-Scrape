// src/agents/synthesisAgent.ts
import { Agent } from '../core/agent.js';
import { ToolRegistry } from '../core/toolRegistry.js';
import { DeepResearchQuery, ResearchContext } from './researchCoordinatorAgent.js';
import { AnalysisResult, ResearchInsight, Pattern, Trend, Contradiction } from './analysisAgent.js';
import { LLMResponseParser } from '../utils/llmResponseParser.js';
import { z } from 'zod';

export interface SynthesisResult {
  executiveSummary: string;
  keyFindings: KeyFinding[];
  recommendations: Recommendation[];
  conclusions: Conclusion[];
  insights: ResearchInsight[];
  metadata: {
    synthesisTime: number;
    confidence: number;
    completeness: number;
  };
}

export interface KeyFinding {
  title: string;
  description: string;
  confidence: number;
  evidence: Evidence[];
  implications: string[];
  sources: string[];
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  implementation: string[];
  expectedOutcome: string;
  confidence: number;
}

export interface Conclusion {
  statement: string;
  confidence: number;
  supportingEvidence: Evidence[];
  limitations: string[];
  futureResearch: string[];
}

export interface Evidence {
  source: string;
  content: string;
  relevance: number;
  type: 'quote' | 'statistic' | 'example' | 'reference';
  credibility: number;
}

export class SynthesisAgent extends Agent {
  private _llm: any;
  private _memory: any;
  private _tools: ToolRegistry;

  constructor(options: {
    llm: any;
    memory: any;
    tools: ToolRegistry;
    system?: string;
  }) {
    super({
      ...options,
      system: options.system || `You are a synthesis specialist focused on combining findings into coherent insights.

Your capabilities:
1. Cross-reference findings from multiple sources
2. Generate insights and conclusions
3. Identify contradictions and resolve conflicts
4. Create comprehensive research summaries
5. Generate actionable recommendations

Synthesis approach:
- Integrate findings from multiple perspectives
- Identify patterns and relationships
- Resolve contradictions through evidence evaluation
- Generate actionable insights
- Provide clear, structured conclusions

Focus on creating value through synthesis rather than just summarizing.`
    });
    
    this._llm = options.llm;
    this._memory = options.memory;
    this._tools = options.tools;
  }

  private async generateLLMResponse(prompt: string): Promise<string> {
    const response = await this.chat(prompt);
    return response.text;
  }

  async synthesizeInsights(analysis: AnalysisResult, query: DeepResearchQuery): Promise<SynthesisResult> {
    const startTime = Date.now();
    console.log(`🧩 Synthesis Agent starting synthesis for: ${query.query}`);

    try {
      // 1. Generate executive summary
      const executiveSummary = await this.generateExecutiveSummary(analysis, query);
      
      // 2. Extract key findings
      const keyFindings = await this.extractKeyFindings(analysis, query);
      
      // 3. Generate recommendations
      const recommendations = await this.generateRecommendations(analysis, query);
      
      // 4. Draw conclusions
      const conclusions = await this.drawConclusions(analysis, query);
      
      // 5. Synthesize insights
      const insights = await this.synthesizeInsightsFromAnalysis(analysis, query);

      // 6. Calculate metadata
      const confidence = this.calculateSynthesisConfidence(keyFindings, recommendations, conclusions);
      const completeness = this.calculateCompleteness(analysis);

      const synthesisResult: SynthesisResult = {
        executiveSummary,
        keyFindings,
        recommendations,
        conclusions,
        insights,
        metadata: {
          synthesisTime: Date.now() - startTime,
          confidence,
          completeness
        }
      };

      console.log(`✅ Synthesis completed in ${synthesisResult.metadata.synthesisTime}ms`);
      console.log(`📊 Generated: ${keyFindings.length} key findings, ${recommendations.length} recommendations, ${conclusions.length} conclusions`);

      return synthesisResult;

    } catch (error) {
      console.error('❌ Synthesis failed:', error);
      throw error;
    }
  }

  private async generateExecutiveSummary(analysis: AnalysisResult, query: DeepResearchQuery): Promise<string> {
    console.log(`📝 Generating executive summary for: ${query.query}`);
    
    const summaryPrompt = `
Generate a comprehensive executive summary for research on "${query.query}".

Analysis Results:
- Insights: ${analysis.insights?.length || 0}
- Patterns: ${analysis.patterns?.length || 0}
- Trends: ${analysis.trends?.length || 0}
- Contradictions: ${analysis.contradictions?.length || 0}
- Topics: ${analysis.topics?.length || 0}
- Entities: ${analysis.entities?.length || 0}

Key Insights:
${analysis.insights?.map(insight => `- ${insight.content}`).join('\n') || 'No insights available'}

Key Patterns:
${analysis.patterns?.map(pattern => `- ${pattern.description}`).join('\n') || 'No patterns identified'}

Provide a clear, concise executive summary that captures the essence of the research findings.
Return ONLY the summary text, no additional formatting or explanations.
`;

    const response = await this.generateLLMResponse(summaryPrompt);
    return LLMResponseParser.validateAndSanitize(response.trim(), z.string());
  }

  private async extractKeyFindings(analysis: AnalysisResult, query: DeepResearchQuery): Promise<KeyFinding[]> {
    console.log(`🔍 Extracting key findings for: ${query.query}`);
    
    const keyFindings: KeyFinding[] = [];

    // Convert insights to key findings
    analysis.insights?.forEach(insight => {
      if (insight.type === 'pattern' || insight.type === 'trend') {
        keyFindings.push({
          title: `${insight.type.charAt(0).toUpperCase() + insight.type.slice(1)} Analysis`,
          description: insight.content,
          confidence: insight.confidence,
          evidence: insight.evidence || [],
          implications: this.generateImplications(insight),
          sources: insight.sources || []
        });
      }
    });

    // Convert patterns to key findings
    analysis.patterns?.forEach(pattern => {
      keyFindings.push({
        title: `${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} Pattern`,
        description: pattern.description,
        confidence: pattern.confidence,
        evidence: this.convertPatternToEvidence(pattern),
        implications: this.generatePatternImplications(pattern),
        sources: pattern.examples || []
      });
    });

    // Convert trends to key findings
    analysis.trends?.forEach(trend => {
      keyFindings.push({
        title: `${trend.direction.charAt(0).toUpperCase() + trend.direction.slice(1)} Trend`,
        description: trend.description,
        confidence: trend.confidence,
        evidence: trend.evidence || [],
        implications: this.generateTrendImplications(trend),
        sources: trend.evidence?.map(e => e.source) || []
      });
    });

    return keyFindings;
  }

  private async generateRecommendations(analysis: AnalysisResult, query: DeepResearchQuery): Promise<Recommendation[]> {
    console.log(`💡 Generating recommendations for: ${query.query}`);
    
    const recommendations: Recommendation[] = [];

    // Generate recommendations based on insights
    analysis.insights?.forEach(insight => {
      if (insight.type === 'recommendation') {
        recommendations.push({
          title: 'Research Recommendation',
          description: insight.content,
          priority: this.determinePriority(insight.confidence),
          rationale: `Based on analysis confidence of ${insight.confidence}`,
          implementation: this.generateImplementationSteps(insight),
          expectedOutcome: 'Improved research quality and reliability',
          confidence: insight.confidence
        });
      }
    });

    // Generate recommendations based on contradictions
    analysis.contradictions?.forEach(contradiction => {
      recommendations.push({
        title: 'Contradiction Resolution',
        description: `Address contradiction: ${contradiction.description}`,
        priority: this.mapSeverityToPriority(contradiction.severity),
        rationale: `Contradiction severity: ${contradiction.severity}`,
        implementation: contradiction.resolution ? [contradiction.resolution] : ['Further investigation required'],
        expectedOutcome: 'Resolved contradiction and improved data reliability',
        confidence: contradiction.confidence
      });
    });

    // Generate recommendations based on patterns
    analysis.patterns?.forEach(pattern => {
      if (pattern.significance === 'high') {
        recommendations.push({
          title: 'Pattern-Based Recommendation',
          description: `Leverage identified pattern: ${pattern.description}`,
          priority: 'medium',
          rationale: `High significance pattern with ${pattern.confidence} confidence`,
          implementation: this.generatePatternBasedImplementation(pattern),
          expectedOutcome: 'Enhanced understanding and application of identified patterns',
          confidence: pattern.confidence
        });
      }
    });

    return recommendations;
  }

  private async drawConclusions(analysis: AnalysisResult, query: DeepResearchQuery): Promise<Conclusion[]> {
    console.log(`🎯 Drawing conclusions for: ${query.query}`);
    
    const conclusions: Conclusion[] = [];

    // Main conclusion based on overall analysis
    const mainConclusion = await this.generateMainConclusion(analysis, query);
    conclusions.push(mainConclusion);

    // Topic-specific conclusions
    analysis.topics?.forEach(topic => {
      if (topic.relevance > 0.7) {
        conclusions.push({
          statement: `"${topic.name}" is a highly relevant topic with ${topic.frequency} mentions and ${topic.relevance} relevance score`,
          confidence: topic.relevance,
          supportingEvidence: this.convertTopicToEvidence(topic),
          limitations: ['Limited to available sources', 'May not capture all perspectives'],
          futureResearch: [`Deeper analysis of ${topic.name}`, 'Cross-topic correlation analysis']
        });
      }
    });

    return conclusions;
  }

  private async synthesizeInsightsFromAnalysis(analysis: AnalysisResult, query: DeepResearchQuery): Promise<ResearchInsight[]> {
    console.log(`🔬 Synthesizing insights from analysis for: ${query.query}`);
    
    const synthesizedInsights: ResearchInsight[] = [];

    // Add original insights
    synthesizedInsights.push(...(analysis.insights || []));

    // Generate cross-pattern insights
    if ((analysis.patterns?.length || 0) > 1) {
      synthesizedInsights.push({
        type: 'pattern',
        content: `Multiple patterns identified (${analysis.patterns?.length || 0}), indicating complex relationships in the data`,
        confidence: 0.7,
        sources: analysis.patterns?.flatMap(p => p.examples || []) || [],
        tags: ['synthesis', 'patterns', 'complexity'],
        evidence: analysis.patterns?.map(p => ({
          source: 'pattern_analysis',
          content: p.description,
          relevance: p.confidence,
          type: 'reference' as const,
          credibility: p.confidence
        })) || []
      });
    }

    // Generate trend-pattern correlation insights
    if ((analysis.trends?.length || 0) > 0 && (analysis.patterns?.length || 0) > 0) {
      synthesizedInsights.push({
        type: 'trend',
        content: `Trend analysis reveals ${analysis.trends?.length || 0} directional patterns, supported by ${analysis.patterns?.length || 0} structural patterns`,
        confidence: 0.6,
        sources: [...(analysis.trends?.flatMap(t => t.evidence?.map(e => e.source) || []) || []), ...(analysis.patterns?.flatMap(p => p.examples || []) || [])],
        tags: ['synthesis', 'trends', 'patterns'],
        evidence: [...(analysis.trends?.flatMap(t => t.evidence || []) || []), ...(analysis.patterns?.map(p => ({
          source: 'pattern_analysis',
          content: p.description,
          relevance: p.confidence,
          type: 'reference' as const,
          credibility: p.confidence
        })) || [])]
      });
    }

    return synthesizedInsights;
  }

  private generateImplications(insight: ResearchInsight): string[] {
    const implications: string[] = [];
    
    if (insight.type === 'pattern') {
      implications.push('Pattern suggests systematic behavior or structure');
      implications.push('May indicate underlying causes or mechanisms');
    } else if (insight.type === 'trend') {
      implications.push('Trend suggests directional change over time');
      implications.push('May predict future developments');
    }
    
    return implications;
  }

  private convertPatternToEvidence(pattern: Pattern): Evidence[] {
    return pattern.examples.map(example => ({
      source: 'pattern_analysis',
      content: example,
      relevance: pattern.confidence,
      type: 'example' as const,
      credibility: pattern.confidence
    }));
  }

  private generatePatternImplications(pattern: Pattern): string[] {
    const implications: string[] = [];
    
    switch (pattern.type) {
      case 'content_type':
        implications.push('Content type distribution affects information accessibility');
        implications.push('May indicate preferred communication channels');
        break;
      case 'temporal':
        implications.push('Temporal patterns suggest time-dependent factors');
        implications.push('May indicate cyclical or seasonal influences');
        break;
      case 'geographical':
        implications.push('Geographical patterns suggest location-dependent factors');
        implications.push('May indicate regional variations or influences');
        break;
      default:
        implications.push('Pattern suggests systematic behavior');
        implications.push('May indicate underlying structural factors');
    }
    
    return implications;
  }

  private generateTrendImplications(trend: Trend): string[] {
    const implications: string[] = [];
    
    switch (trend.direction) {
      case 'increasing':
        implications.push('Trend suggests growing importance or prevalence');
        implications.push('May indicate accelerating change');
        break;
      case 'decreasing':
        implications.push('Trend suggests declining importance or prevalence');
        implications.push('May indicate diminishing influence');
        break;
      case 'stable':
        implications.push('Trend suggests consistent behavior over time');
        implications.push('May indicate established patterns');
        break;
      case 'cyclical':
        implications.push('Trend suggests recurring patterns');
        implications.push('May indicate predictable variations');
        break;
    }
    
    return implications;
  }

  private determinePriority(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence > 0.8) return 'high';
    if (confidence > 0.6) return 'medium';
    return 'low';
  }

  private generateImplementationSteps(insight: ResearchInsight): string[] {
    return [
      'Review and validate findings',
      'Identify specific actions based on insights',
      'Implement changes systematically',
      'Monitor results and adjust as needed'
    ];
  }

  private mapSeverityToPriority(severity: 'low' | 'medium' | 'high'): 'high' | 'medium' | 'low' {
    switch (severity) {
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
    }
  }

  private generatePatternBasedImplementation(pattern: Pattern): string[] {
    return [
      `Analyze ${pattern.type} pattern in detail`,
      'Identify underlying causes or mechanisms',
      'Develop strategies to leverage or address pattern',
      'Implement pattern-based solutions'
    ];
  }

  private async generateMainConclusion(analysis: AnalysisResult, query: DeepResearchQuery): Promise<Conclusion> {
    console.log(`🎯 Drawing conclusions for: ${query.query}`);
    
    const conclusionPrompt = `
Based on comprehensive analysis of "${query.query}", generate a main conclusion.

Analysis Summary:
- ${analysis.insights?.length || 0} insights generated
- ${analysis.patterns?.length || 0} patterns identified
- ${analysis.trends?.length || 0} trends detected
- ${analysis.contradictions?.length || 0} contradictions found
- Overall confidence: ${analysis.metadata?.confidence || 0.5}

Provide a clear, evidence-based conclusion that synthesizes the key findings.
Return ONLY the conclusion statement, no additional formatting.
`;

    const response = await this.generateLLMResponse(conclusionPrompt);
    const validatedStatement = LLMResponseParser.validateAndSanitize(response.trim(), z.string());
    
    return {
      statement: validatedStatement,
      confidence: analysis.metadata?.confidence || 0.5,
      supportingEvidence: analysis.insights?.flatMap(i => i.evidence || []) || [],
      limitations: [
        'Analysis limited to available sources',
        'May not capture all perspectives',
        'Confidence based on source quality'
      ],
      futureResearch: [
        'Expand source diversity',
        'Conduct longitudinal analysis',
        'Validate findings with additional sources'
      ]
    };
  }

  private convertTopicToEvidence(topic: any): Evidence[] {
    return [{
      source: 'topic_analysis',
      content: `Topic "${topic.name}" with ${topic.frequency} mentions`,
      relevance: topic.relevance,
      type: 'statistic' as const,
      credibility: topic.relevance
    }];
  }

  private calculateSynthesisConfidence(keyFindings: KeyFinding[], recommendations: Recommendation[], conclusions: Conclusion[]): number {
    const allItems = [...keyFindings, ...recommendations, ...conclusions];
    if (allItems.length === 0) return 0;
    
    const avgConfidence = allItems.reduce((sum, item) => sum + item.confidence, 0) / allItems.length;
    return avgConfidence;
  }

  private calculateCompleteness(analysis: AnalysisResult): number {
    const totalComponents = 6; // insights, patterns, trends, contradictions, topics, entities
    const presentComponents = [
      analysis.insights.length > 0,
      analysis.patterns.length > 0,
      analysis.trends.length > 0,
      analysis.contradictions.length > 0,
      analysis.topics.length > 0,
      analysis.entities.length > 0
    ].filter(Boolean).length;
    
    return presentComponents / totalComponents;
  }
}

export default SynthesisAgent;
