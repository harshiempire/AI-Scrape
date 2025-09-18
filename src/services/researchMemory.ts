// src/services/researchMemory.ts
import { Memory } from '../core/types.js';
import { ResearchSession, ResearchQuery } from '../workflows/researchWorkflow.js';
import { ResearchInsight as WorkflowResearchInsight } from '../workflows/researchWorkflow.js';
import { DeepResearchQuery } from '../agents/researchCoordinatorAgent.js';

export interface ResearchMemoryEntry {
  id: string;
  session: ResearchSession;
  query: DeepResearchQuery;
  timestamp: Date;
  tags: string[];
  summary: string;
  qualityScore: number;
  relatedSessions: string[];
}

export interface ResearchPattern {
  id: string;
  pattern: string;
  frequency: number;
  confidence: number;
  examples: string[];
  lastSeen: Date;
}

export interface ResearchInsight extends WorkflowResearchInsight {
  id: string;
  usageCount: number;
  createdAt: Date;
}

export interface ResearchMetrics {
  totalSessions: number;
  averageQuality: number;
  mostCommonTopics: string[];
  researchPatterns: ResearchPattern[];
  topInsights: ResearchInsight[];
  timeDistribution: {
    hourly: number[];
    daily: number[];
    weekly: number[];
  };
}

export class ResearchMemoryService {
  private memory: Memory;
  private sessions: Map<string, ResearchMemoryEntry> = new Map();
  private patterns: Map<string, ResearchPattern> = new Map();
  private insights: Map<string, ResearchInsight> = new Map();
  private topicIndex: Map<string, Set<string>> = new Map();
  private qualityIndex: Map<number, Set<string>> = new Map();

  constructor(memory: Memory) {
    this.memory = memory;
  }

  async storeResearchSession(session: ResearchSession, query: DeepResearchQuery): Promise<void> {
    console.log(`💾 Storing research session ${session.id} in memory`);
    
    try {
      // Generate summary
      const summary = await this.generateSessionSummary(session);
      
      // Calculate quality score
      const qualityScore = this.calculateSessionQuality(session);
      
      // Extract tags
      const tags = this.extractTags(session, query);
      
      // Create memory entry
      const entry: ResearchMemoryEntry = {
        id: session.id,
        session,
        query,
        timestamp: session.metadata.createdAt,
        tags,
        summary,
        qualityScore,
        relatedSessions: []
      };

      // Store in memory
      this.sessions.set(session.id, entry);
      
      // Update indexes
      await this.updateIndexes(entry);
      
      // Store in persistent memory
      await this.memory.store({
        role: 'system',
        content: `Research session ${session.id} stored: ${summary}`
      });

      // Learn from session
      await this.learnFromSession(entry);

      console.log(`✅ Session ${session.id} stored successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to store session ${session.id}:`, error);
      throw error;
    }
  }

  async findRelatedResearch(query: string, limit: number = 5): Promise<ResearchMemoryEntry[]> {
    console.log(`🔍 Finding related research for: ${query}`);
    
    try {
      const queryTags = this.extractTagsFromQuery(query);
      const relatedSessions: ResearchMemoryEntry[] = [];
      
      // Find sessions with similar tags
      for (const [sessionId, entry] of this.sessions) {
        const similarity = this.calculateTagSimilarity(queryTags, entry.tags);
        if (similarity > 0.3) {
          relatedSessions.push({
            ...entry,
            relatedSessions: [] // Reset to avoid circular references
          });
        }
      }
      
      // Sort by similarity and quality
      relatedSessions.sort((a, b) => {
        const aSimilarity = this.calculateTagSimilarity(queryTags, a.tags);
        const bSimilarity = this.calculateTagSimilarity(queryTags, b.tags);
        const aScore = aSimilarity * a.qualityScore;
        const bScore = bSimilarity * b.qualityScore;
        return bScore - aScore;
      });
      
      const results = relatedSessions.slice(0, limit);
      console.log(`✅ Found ${results.length} related research sessions`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Failed to find related research:', error);
      return [];
    }
  }

  async getResearchHistory(limit: number = 10): Promise<ResearchMemoryEntry[]> {
    console.log(`📚 Getting research history (limit: ${limit})`);
    
    const entries = Array.from(this.sessions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
    
    console.log(`✅ Retrieved ${entries.length} research sessions`);
    return entries;
  }

  async getResearchMetrics(): Promise<ResearchMetrics> {
    console.log(`📊 Calculating research metrics`);
    
    const sessions = Array.from(this.sessions.values());
    const totalSessions = sessions.length;
    
    if (totalSessions === 0) {
      return {
        totalSessions: 0,
        averageQuality: 0,
        mostCommonTopics: [],
        researchPatterns: [],
        topInsights: [],
        timeDistribution: {
          hourly: new Array(24).fill(0),
          daily: new Array(7).fill(0),
          weekly: new Array(52).fill(0)
        }
      };
    }
    
    // Calculate average quality
    const averageQuality = sessions.reduce((sum, session) => sum + session.qualityScore, 0) / totalSessions;
    
    // Find most common topics
    const topicCount = new Map<string, number>();
    sessions.forEach(session => {
      session.tags.forEach(tag => {
        topicCount.set(tag, (topicCount.get(tag) || 0) + 1);
      });
    });
    
    const mostCommonTopics = Array.from(topicCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic);
    
    // Get research patterns
    const researchPatterns = Array.from(this.patterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
    
    // Get top insights
    const topInsights = Array.from(this.insights.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);
    
    // Calculate time distribution
    const timeDistribution = this.calculateTimeDistribution(sessions);
    
    const metrics: ResearchMetrics = {
      totalSessions,
      averageQuality,
      mostCommonTopics,
      researchPatterns,
      topInsights,
      timeDistribution
    };
    
    console.log(`✅ Calculated metrics for ${totalSessions} sessions`);
    return metrics;
  }

  async searchResearchHistory(searchTerm: string, limit: number = 10): Promise<ResearchMemoryEntry[]> {
    console.log(`🔍 Searching research history for: ${searchTerm}`);
    
    const searchTermLower = searchTerm.toLowerCase();
    const results: ResearchMemoryEntry[] = [];
    
    for (const [sessionId, entry] of this.sessions) {
      // Search in summary, tags, and query
      const searchableText = [
        entry.summary,
        entry.tags.join(' '),
        entry.query.query,
        ...entry.session.insights.map(i => i.content)
      ].join(' ').toLowerCase();
      
      if (searchableText.includes(searchTermLower)) {
        results.push(entry);
      }
    }
    
    // Sort by relevance and quality
    results.sort((a, b) => {
      const aRelevance = this.calculateTextRelevance(searchTermLower, a);
      const bRelevance = this.calculateTextRelevance(searchTermLower, b);
      const aScore = aRelevance * a.qualityScore;
      const bScore = bRelevance * b.qualityScore;
      return bScore - aScore;
    });
    
    const limitedResults = results.slice(0, limit);
    console.log(`✅ Found ${limitedResults.length} matching sessions`);
    
    return limitedResults;
  }

  async clearResearchData(): Promise<void> {
    console.log(`🗑️ Clearing all research data`);
    
    this.sessions.clear();
    this.patterns.clear();
    this.insights.clear();
    this.topicIndex.clear();
    this.qualityIndex.clear();
    
    // Clear persistent memory
    await this.memory.clear?.();
    
    console.log(`✅ All research data cleared`);
  }

  private async generateSessionSummary(session: ResearchSession): Promise<string> {
    const totalResults = session.metadata.totalResults;
    const searchTime = session.metadata.totalSearchTime;
    const insightsCount = session.insights.length;
    
    return `Research on "${session.queries[0].query}" completed in ${searchTime}ms with ${totalResults} results and ${insightsCount} insights generated.`;
  }

  private calculateSessionQuality(session: ResearchSession): number {
    // Calculate quality based on multiple factors
    const insightsQuality = session.insights.reduce((sum, insight) => sum + insight.confidence, 0) / session.insights.length;
    const resultsCount = session.metadata.totalResults;
    const searchTime = session.metadata.totalSearchTime;
    
    // Quality factors
    const insightsScore = insightsQuality || 0;
    const resultsScore = Math.min(resultsCount / 20, 1); // Normalize to 0-1
    const efficiencyScore = Math.min(30000 / searchTime, 1); // Prefer faster searches
    
    // Weighted average
    const qualityScore = (insightsScore * 0.5) + (resultsScore * 0.3) + (efficiencyScore * 0.2);
    
    return Math.min(Math.max(qualityScore, 0), 1);
  }

  private extractTagsFromQuery(query: string): string[] {
    const tags = new Set<string>();
    
    // Simple tag extraction from query string
    const words = query.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) {
        tags.add(word);
      }
    });
    
    return Array.from(tags);
  }

  private extractTags(session: ResearchSession, query: DeepResearchQuery): string[] {
    const tags = new Set<string>();
    
    // Add query-based tags
    tags.add(query.depth);
    if (query.strategy) tags.add(query.strategy);
    if (query.focusAreas) query.focusAreas.forEach(area => tags.add(area));
    if (query.context?.domain) tags.add(query.context.domain);
    
    // Add insight-based tags
    session.insights.forEach(insight => {
      insight.tags.forEach(tag => tags.add(tag));
    });
    
    // Add content-based tags
    const allResults = session.results.flatMap(r => r.fusedResults);
    const domains = [...new Set(allResults.map(r => r.metadata?.domain))];
    domains.forEach(domain => tags.add(domain));
    
    return Array.from(tags);
  }

  private async updateIndexes(entry: ResearchMemoryEntry): Promise<void> {
    // Update topic index
    entry.tags.forEach(tag => {
      if (!this.topicIndex.has(tag)) {
        this.topicIndex.set(tag, new Set());
      }
      this.topicIndex.get(tag)!.add(entry.id);
    });
    
    // Update quality index
    const qualityBucket = Math.floor(entry.qualityScore * 10);
    if (!this.qualityIndex.has(qualityBucket)) {
      this.qualityIndex.set(qualityBucket, new Set());
    }
    this.qualityIndex.get(qualityBucket)!.add(entry.id);
  }

  private async learnFromSession(entry: ResearchMemoryEntry): Promise<void> {
    console.log(`🧠 Learning from session ${entry.id}`);
    
    // Learn patterns from insights
    entry.session.insights.forEach(insight => {
      const patternKey = `${insight.type}_${insight.tags.join('_')}`;
      
      if (this.patterns.has(patternKey)) {
        const pattern = this.patterns.get(patternKey)!;
        pattern.frequency++;
        pattern.lastSeen = new Date();
        pattern.examples.push(insight.content);
      } else {
        this.patterns.set(patternKey, {
          id: patternKey,
          pattern: insight.type,
          frequency: 1,
          confidence: insight.confidence,
          examples: [insight.content],
          lastSeen: new Date()
        });
      }
    });
    
    // Learn insights
    entry.session.insights.forEach(insight => {
      const insightKey = insight.content.substring(0, 100); // Use first 100 chars as key
      
      if (this.insights.has(insightKey)) {
        const existingInsight = this.insights.get(insightKey)!;
        existingInsight.usageCount++;
        existingInsight.confidence = (existingInsight.confidence + insight.confidence) / 2;
      } else {
        this.insights.set(insightKey, {
          id: insightKey,
          type: insight.type,
          content: insight.content,
          confidence: insight.confidence,
          sources: insight.sources,
          tags: insight.tags,
          createdAt: new Date(),
          usageCount: 1
        });
      }
    });
    
    console.log(`✅ Learned ${entry.session.insights.length} insights from session ${entry.id}`);
  }

  private calculateTagSimilarity(tags1: string[], tags2: string[]): number {
    if (tags1.length === 0 || tags2.length === 0) return 0;
    
    const set1 = new Set(tags1);
    const set2 = new Set(tags2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  private calculateTimeDistribution(sessions: ResearchMemoryEntry[]): {
    hourly: number[];
    daily: number[];
    weekly: number[];
  } {
    const hourly = new Array(24).fill(0);
    const daily = new Array(7).fill(0);
    const weekly = new Array(52).fill(0);
    
    sessions.forEach(session => {
      const date = session.timestamp;
      hourly[date.getHours()]++;
      daily[date.getDay()]++;
      weekly[Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000)) % 52]++;
    });
    
    return { hourly, daily, weekly };
  }

  private calculateTextRelevance(searchTerm: string, entry: ResearchMemoryEntry): number {
    const searchableText = [
      entry.summary,
      entry.tags.join(' '),
      entry.query.query,
      ...entry.session.insights.map(i => i.content)
    ].join(' ').toLowerCase();
    
    const termCount = (searchableText.match(new RegExp(searchTerm, 'g')) || []).length;
    const totalWords = searchableText.split(/\s+/).length;
    
    return termCount / totalWords;
  }

  async exportResearchData(): Promise<string> {
    console.log(`📤 Exporting research data`);
    
    const exportData = {
      sessions: Array.from(this.sessions.values()),
      patterns: Array.from(this.patterns.values()),
      insights: Array.from(this.insights.values()),
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  async importResearchData(data: string): Promise<void> {
    console.log(`📥 Importing research data`);
    
    try {
      const importData = JSON.parse(data);
      
      // Import sessions
      if (importData.sessions) {
        importData.sessions.forEach((entry: ResearchMemoryEntry) => {
          this.sessions.set(entry.id, entry);
        });
      }
      
      // Import patterns
      if (importData.patterns) {
        importData.patterns.forEach((pattern: ResearchPattern) => {
          this.patterns.set(pattern.id, pattern);
        });
      }
      
      // Import insights
      if (importData.insights) {
        importData.insights.forEach((insight: ResearchInsight) => {
          this.insights.set(insight.id, insight);
        });
      }
      
      // Rebuild indexes
      for (const [sessionId, entry] of this.sessions) {
        await this.updateIndexes(entry);
      }
      
      console.log(`✅ Imported ${this.sessions.size} sessions, ${this.patterns.size} patterns, ${this.insights.size} insights`);
      
    } catch (error) {
      console.error('❌ Failed to import research data:', error);
      throw error;
    }
  }
}

export default ResearchMemoryService;
