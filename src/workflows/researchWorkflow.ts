// src/workflows/researchWorkflow.ts
import { EnhancedSearchTool, SearchResult, FusedResult } from '../tools/enhancedSearchTool.js';
import { VectorDatabaseService } from '../services/vectorDB.js';
import { ContentChunker } from '../services/contentChunker.js';
import { Tool } from '../core/tool.js';

export interface ResearchQuery {
  query: string;
  depth: 'shallow' | 'medium' | 'deep';
  focusAreas?: string[];
  excludeDomains?: string[];
  maxResults?: number;
  context?: any;
}

export interface ResearchSession {
  id: string;
  queries: ResearchQuery[];
  results: SearchResult[];
  insights: ResearchInsight[];
  metadata: {
    createdAt: Date;
    totalSearchTime: number;
    totalResults: number;
    vectorDBCount: number;
  };
}

export interface ResearchInsight {
  id?: string;
  type: 'trend' | 'pattern' | 'contradiction' | 'summary' | 'recommendation';
  content: string;
  confidence: number;
  sources: string[];
  tags: string[];
  evidence?: any[];
  usageCount?: number;
}

export class ResearchWorkflow {
  private searchTool: EnhancedSearchTool;
  private vectorDB: VectorDatabaseService;
  private chunker: ContentChunker;

  constructor() {
    this.searchTool = new EnhancedSearchTool();
    this.vectorDB = new VectorDatabaseService();
    this.chunker = new ContentChunker();
  }

  async conductResearch(query: ResearchQuery): Promise<ResearchSession> {
    const sessionId = this.generateSessionId();
    const startTime = Date.now();
    
    console.log(`Starting research session ${sessionId} for query: ${query.query}`);

    try {
      // 1. Initial search
      const initialResults = await this.searchTool.search(query.query, {
        maxResults: query.maxResults || this.getMaxResultsForDepth(query.depth),
        useVectorDB: true,
        storeResults: true
      });

      // 2. Follow-up searches based on depth
      const followUpQueries = this.generateFollowUpQueries(query, initialResults);
      const followUpResults: SearchResult[] = [];

      for (const followUpQuery of followUpQueries) {
        const result = await this.searchTool.search(followUpQuery.query, {
          maxResults: Math.ceil((query.maxResults || 10) * 0.5),
          useVectorDB: true,
          storeResults: true
        });
        followUpResults.push(result);
      }

      // 3. Generate insights
      const allResults = [initialResults, ...followUpResults];
      const insights = await this.generateInsights(allResults, query);

      // 4. Create research session
      const session: ResearchSession = {
        id: sessionId,
        queries: [query, ...followUpQueries.map(q => ({ ...q, depth: 'shallow' as const }))],
        results: allResults,
        insights,
        metadata: {
          createdAt: new Date(),
          totalSearchTime: Date.now() - startTime,
          totalResults: allResults.reduce((sum, r) => sum + r.fusedResults.length, 0),
          vectorDBCount: await this.vectorDB.getCollectionStats().then(s => s.count).catch(() => 0)
        }
      };

      console.log(`Research session ${sessionId} completed in ${session.metadata.totalSearchTime}ms`);
      return session;

    } catch (error) {
      console.error(`Research session ${sessionId} failed:`, error);
      throw error;
    }
  }

  private generateSessionId(): string {
    return `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMaxResultsForDepth(depth: ResearchQuery['depth']): number {
    switch (depth) {
      case 'shallow': return 5;
      case 'medium': return 15;
      case 'deep': return 30;
      default: return 10;
    }
  }

  private generateFollowUpQueries(originalQuery: ResearchQuery, initialResults: SearchResult): ResearchQuery[] {
    const followUps: ResearchQuery[] = [];
    
    if (originalQuery.depth === 'shallow') {
      return followUps; // No follow-ups for shallow research
    }

    // Extract key topics from initial results
    const topics = this.extractTopics(initialResults.fusedResults);
    
    // Generate follow-up queries based on topics
    for (const topic of topics.slice(0, 3)) { // Limit to 3 follow-ups
      followUps.push({
        query: `${originalQuery.query} ${topic}`,
        depth: 'shallow',
        maxResults: 5
      });
    }

    // Add specific focus area queries if provided
    if (originalQuery.focusAreas) {
      for (const area of originalQuery.focusAreas.slice(0, 2)) {
        followUps.push({
          query: `${originalQuery.query} ${area}`,
          depth: 'shallow',
          maxResults: 5
        });
      }
    }

    return followUps;
  }

  private extractTopics(results: FusedResult[]): string[] {
    const topics = new Set<string>();
    
    // Simple topic extraction based on common words and phrases
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must']);
    
    for (const result of results) {
      const words = result.title.toLowerCase().split(/\s+/)
        .concat(result.content.toLowerCase().split(/\s+/))
        .filter(word => word.length > 3 && !commonWords.has(word));
      
      // Count word frequency
      const wordCount = new Map<string, number>();
      words.forEach(word => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      });
      
      // Add top words as topics
      Array.from(wordCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([word]) => topics.add(word));
    }
    
    return Array.from(topics).slice(0, 10);
  }

  private async generateInsights(results: SearchResult[], query: ResearchQuery): Promise<ResearchInsight[]> {
    const insights: ResearchInsight[] = [];
    const allResults = results.flatMap(r => r.fusedResults);

    // 1. Summary insight
    const summary = this.generateSummary(allResults, query.query);
    insights.push({
      type: 'summary',
      content: summary,
      confidence: 0.8,
      sources: allResults.map(r => r.url),
      tags: ['summary', 'overview']
    });

    // 2. Trend insights
    const trends = this.identifyTrends(allResults);
    insights.push(...trends);

    // 3. Pattern insights
    const patterns = this.identifyPatterns(allResults);
    insights.push(...patterns);

    // 4. Contradiction insights
    const contradictions = this.identifyContradictions(allResults);
    insights.push(...contradictions);

    return insights;
  }

  private generateSummary(results: FusedResult[], query: string): string {
    const domains = Array.from(new Set(results.map(r => r.metadata.domain)));
    const contentTypes = Array.from(new Set(results.map(r => r.metadata.contentType)));
    
    return `Research on "${query}" found ${results.length} relevant sources across ${domains.length} domains. Content types include: ${contentTypes.join(', ')}. The search covered both real-time and historical content, providing comprehensive coverage of the topic.`;
  }

  private identifyTrends(results: FusedResult[]): ResearchInsight[] {
    const insights: ResearchInsight[] = [];
    
    // Group by domain to identify popular sources
    const domainCount = new Map<string, number>();
    results.forEach(r => {
      domainCount.set(r.metadata.domain, (domainCount.get(r.metadata.domain) || 0) + 1);
    });
    
    const topDomains = Array.from(domainCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    if (topDomains.length > 0) {
      insights.push({
        type: 'trend',
        content: `Most information comes from: ${topDomains.map(([domain, count]) => `${domain} (${count} results)`).join(', ')}`,
        confidence: 0.7,
        sources: results.map(r => r.url),
        tags: ['trend', 'sources', 'popularity']
      });
    }
    
    return insights;
  }

  private identifyPatterns(results: FusedResult[]): ResearchInsight[] {
    const insights: ResearchInsight[] = [];
    
    // Identify content type patterns
    const contentTypeCount = new Map<string, number>();
    results.forEach(r => {
      contentTypeCount.set(r.metadata.contentType, (contentTypeCount.get(r.metadata.contentType) || 0) + 1);
    });
    
    const dominantType = Array.from(contentTypeCount.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    if (dominantType && dominantType[1] > results.length * 0.4) {
      insights.push({
        type: 'pattern',
        content: `The majority of content (${Math.round(dominantType[1] / results.length * 100)}%) is ${dominantType[0]} type, suggesting this topic is primarily discussed in ${dominantType[0]} format.`,
        confidence: 0.6,
        sources: results.map(r => r.url),
        tags: ['pattern', 'content-type', 'distribution']
      });
    }
    
    return insights;
  }

  private identifyContradictions(results: FusedResult[]): ResearchInsight[] {
    const insights: ResearchInsight[] = [];
    
    // This is a simplified contradiction detection
    // In a real implementation, you'd use more sophisticated NLP
    const qualityScores = results.map(r => r.qualityScore);
    const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    
    const lowQualityResults = results.filter(r => r.qualityScore < avgQuality * 0.7);
    
    if (lowQualityResults.length > 0) {
      insights.push({
        type: 'contradiction',
        content: `Found ${lowQualityResults.length} results with significantly lower quality scores, which may indicate unreliable or incomplete information.`,
        confidence: 0.5,
        sources: lowQualityResults.map(r => r.url),
        tags: ['contradiction', 'quality', 'reliability']
      });
    }
    
    return insights;
  }

  async getResearchHistory(): Promise<ResearchSession[]> {
    // This would typically be stored in a database
    // For now, return empty array
    return [];
  }

  async clearResearchData(): Promise<void> {
    await this.vectorDB.clearCollection();
    console.log('Research data cleared');
  }
}

export default ResearchWorkflow;
