// src/agents/researchCoordinatorAgent.ts
import { Agent } from '../core/agent.js';
import { ToolRegistry } from '../core/toolRegistry.js';
import { ResearchQuery, ResearchSession, ResearchInsight } from '../workflows/researchWorkflow.js';

export interface DeepResearchQuery extends ResearchQuery {
  strategy?: 'exploratory' | 'systematic' | 'comparative' | 'trend_analysis';
  context?: ResearchContext;
  qualityThreshold?: number;
  maxDepth?: number;
}

export interface ResearchContext {
  domain?: string;
  timeConstraints?: boolean;
  requiresFactChecking?: boolean;
  isAcademicResearch?: boolean;
  targetAudience?: string;
  interAgentContext?: Record<string, any>;
}

export interface AgentTask {
  agentType: 'data_collection' | 'analysis' | 'synthesis' | 'quality';
  task: string;
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[];
  context: ResearchContext;
}

export interface ResearchProgress {
  sessionId: string;
  step: 'starting' | 'analyzing' | 'collecting' | 'processing' | 'synthesizing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentTask: string;
  urlsProcessed: string[];
  urlsTotal: number;
  insightsFound: number;
  estimatedTimeRemaining?: number;
  details?: any;
}

export class ResearchCoordinatorAgent extends Agent {
  private progressCallbacks: ((progress: ResearchProgress) => void)[] = [];
  private activeSessions = new Map<string, ResearchSession>();
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
      system: options.system || `You are a research coordinator managing a team of specialized research agents.

Your responsibilities:
1. Analyze research queries and determine optimal strategy
2. Delegate tasks to appropriate specialized agents
3. Coordinate between agents to ensure comprehensive coverage
4. Synthesize findings from multiple agents
5. Ensure research quality and completeness

Available agents:
- DataCollectionAgent: Gathers data from multiple sources
- AnalysisAgent: Analyzes content and identifies patterns
- SynthesisAgent: Combines findings into coherent insights
- QualityAgent: Validates sources and checks facts

Always provide clear, actionable instructions to agents and maintain context across the research process.`
    });
    
    this._llm = options.llm;
    this._memory = options.memory;
    this._tools = options.tools;
  }

  private async generateLLMResponse(prompt: string): Promise<string> {
    // Use the chat method to generate a response
    const response = await this.chat(prompt);
    return response.text;
  }

  async conductDeepResearch(query: DeepResearchQuery): Promise<ResearchSession> {
    const sessionId = this.generateSessionId();
    const startTime = Date.now();
    
    console.log(`🧠 Starting Deep Research Session ${sessionId} for query: ${query.query}`);
    
    try {
      // Update progress: Starting
      await this.updateProgress(sessionId, {
        sessionId,
        step: 'starting',
        progress: 5,
        currentTask: 'Initializing research strategy',
        urlsProcessed: [],
        urlsTotal: 0,
        insightsFound: 0
      });

      // 1. Analyze query and determine strategy
      const strategy = await this.determineResearchStrategy(query);
      console.log(`📋 Research Strategy: ${strategy}`);

      // Update progress: Analyzing
      await this.updateProgress(sessionId, {
        sessionId,
        step: 'analyzing',
        progress: 15,
        currentTask: 'Analyzing query and planning research approach',
        urlsProcessed: [],
        urlsTotal: 0,
        insightsFound: 0
      });

      // 2. Create agent tasks
      const tasks = await this.createAgentTasks(query, strategy);
      console.log(`📝 Created ${tasks.length} agent tasks`);

      // 3. Execute data collection phase
      const rawData = await this.executeDataCollection(query, tasks, sessionId);

      // Update progress: Processing
      await this.updateProgress(sessionId, {
        sessionId,
        step: 'processing',
        progress: 60,
        currentTask: 'Processing and analyzing collected data',
        urlsProcessed: rawData.urlsProcessed,
        urlsTotal: rawData.urlsTotal,
        insightsFound: 0
      });

      // 4. Execute analysis phase
      const analysis = await this.executeAnalysis(rawData, query, sessionId);

      // Update progress: Synthesizing
      await this.updateProgress(sessionId, {
        sessionId,
        step: 'synthesizing',
        progress: 85,
        currentTask: 'Synthesizing insights and generating final report',
        urlsProcessed: rawData.urlsProcessed,
        urlsTotal: rawData.urlsTotal,
        insightsFound: analysis.insights.length
      });

      // 5. Execute synthesis phase
      const insights = await this.executeSynthesis(analysis, query, sessionId);

      // 6. Create final research session
      const session: ResearchSession = {
        id: sessionId,
        queries: [query],
        results: rawData.searchResults,
        insights,
        metadata: {
          createdAt: new Date(),
          totalSearchTime: Date.now() - startTime,
          totalResults: rawData.searchResults.reduce((sum, r) => sum + r.fusedResults.length, 0),
          vectorDBCount: rawData.vectorDBCount || 0
        }
      };

      // Store session in memory
      this.activeSessions.set(sessionId, session);
      await this.storeSessionInMemory(session);

      // Update progress: Completed
      await this.updateProgress(sessionId, {
        sessionId,
        step: 'completed',
        progress: 100,
        currentTask: 'Research completed successfully',
        urlsProcessed: rawData.urlsProcessed,
        urlsTotal: rawData.urlsTotal,
        insightsFound: insights.length
      });

      console.log(`✅ Deep Research Session ${sessionId} completed in ${session.metadata.totalSearchTime}ms`);
      return session;

    } catch (error) {
      console.error(`❌ Deep Research Session ${sessionId} failed:`, error);
      
      // Update progress: Failed
      await this.updateProgress(sessionId, {
        sessionId,
        step: 'failed',
        progress: 0,
        currentTask: `Research failed: ${(error as Error).message}`,
        urlsProcessed: [],
        urlsTotal: 0,
        insightsFound: 0
      });
      
      throw error;
    }
  }

  private async determineResearchStrategy(query: DeepResearchQuery): Promise<string> {
    const strategyPrompt = `
Analyze this research query and determine the optimal research strategy:

Query: "${query.query}"
Depth: ${query.depth}
Focus Areas: ${query.focusAreas?.join(', ') || 'None specified'}
Context: ${JSON.stringify(query.context || {})}

Available strategies:
1. exploratory - For broad, open-ended research
2. systematic - For comprehensive, methodical research
3. comparative - For comparing multiple options/approaches
4. trend_analysis - For identifying patterns and trends over time

Consider:
- Query complexity and specificity
- Depth requirements
- Focus areas
- Context constraints

Respond with just the strategy name (e.g., "exploratory").
`;

    const response = await this.generateLLMResponse(strategyPrompt);
    return response.trim().toLowerCase();
  }

  private async createAgentTasks(query: DeepResearchQuery, strategy: string): Promise<AgentTask[]> {
    const tasks: AgentTask[] = [];

    // Data Collection Tasks
    tasks.push({
      agentType: 'data_collection',
      task: `Gather comprehensive data for "${query.query}" using ${strategy} approach`,
      priority: 'high',
      context: query.context || {}
    });

    // Analysis Tasks
    tasks.push({
      agentType: 'analysis',
      task: `Analyze collected data for patterns, trends, and key insights related to "${query.query}"`,
      priority: 'high',
      dependencies: ['data_collection'],
      context: query.context || {}
    });

    // Synthesis Tasks
    tasks.push({
      agentType: 'synthesis',
      task: `Synthesize analysis results into coherent insights and recommendations for "${query.query}"`,
      priority: 'medium',
      dependencies: ['analysis'],
      context: query.context || {}
    });

    // Quality Tasks
    tasks.push({
      agentType: 'quality',
      task: `Validate sources and fact-check findings for "${query.query}"`,
      priority: 'medium',
      dependencies: ['data_collection'],
      context: query.context || {}
    });

    return tasks;
  }

  private async executeDataCollection(
    query: DeepResearchQuery, 
    tasks: AgentTask[], 
    sessionId: string
  ): Promise<{
    searchResults: any[];
    urlsProcessed: string[];
    urlsTotal: number;
    vectorDBCount: number;
  }> {
    console.log(`🔍 Executing data collection for session ${sessionId}`);
    
    // Create and use DataCollectionAgent
    const { DataCollectionAgent } = await import('./dataCollectionAgent.js');
    const dataAgent = new DataCollectionAgent({
      llm: this._llm,
      memory: this._memory,
      tools: this._tools
    });
    
    const rawData = await dataAgent.collectData(query);
    
    return {
      searchResults: rawData.searchResults,
      urlsProcessed: rawData.urlsProcessed,
      urlsTotal: rawData.urlsTotal,
      vectorDBCount: rawData.metadata.qualityMetrics.overallScore * 1000 // Convert to count-like number
    };
  }

  private async executeAnalysis(
    rawData: any, 
    query: DeepResearchQuery, 
    sessionId: string
  ): Promise<{
    insights: ResearchInsight[];
    patterns: any[];
    trends: any[];
  }> {
    console.log(`🔬 Executing analysis for session ${sessionId}`);
    
    // Create and use AnalysisAgent
    const { AnalysisAgent } = await import('./analysisAgent.js');
    const analysisAgent = new AnalysisAgent({
      llm: this._llm,
      memory: this._memory,
      tools: this._tools
    });
    
    const analysisResult = await analysisAgent.analyzeData(rawData, query);
    
    return {
      insights: analysisResult.insights,
      patterns: analysisResult.patterns,
      trends: analysisResult.trends
    };
  }

  private async executeSynthesis(
    analysis: any, 
    query: DeepResearchQuery, 
    sessionId: string
  ): Promise<ResearchInsight[]> {
    console.log(`🧩 Executing synthesis for session ${sessionId}`);
    
    // Create and use SynthesisAgent
    const { SynthesisAgent } = await import('./synthesisAgent.js');
    const synthesisAgent = new SynthesisAgent({
      llm: this._llm,
      memory: this._memory,
      tools: this._tools
    });
    
    const synthesisResult = await synthesisAgent.synthesizeInsights(analysis, query);
    
    return synthesisResult.insights;
  }

  private generateSessionId(): string {
    return `deep_research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMaxResultsForDepth(depth: DeepResearchQuery['depth']): number {
    switch (depth) {
      case 'shallow': return 5;
      case 'medium': return 15;
      case 'deep': return 30;
      default: return 10;
    }
  }

  private generateFollowUpQueries(originalQuery: DeepResearchQuery, initialResults: any): DeepResearchQuery[] {
    const followUps: DeepResearchQuery[] = [];
    
    if (originalQuery.depth === 'shallow') {
      return followUps;
    }

    // Extract key topics from initial results
    const topics = this.extractTopics(initialResults.fusedResults);
    
    // Generate follow-up queries based on topics
    for (const topic of topics.slice(0, 3)) {
      followUps.push({
        query: `${originalQuery.query} ${topic}`,
        depth: 'shallow',
        maxResults: 5,
        strategy: originalQuery.strategy,
        context: originalQuery.context
      });
    }

    return followUps;
  }

  private extractTopics(results: any[]): string[] {
    const topics = new Set<string>();
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must']);
    
    for (const result of results) {
      const words = result.title.toLowerCase().split(/\s+/)
        .concat(result.content.toLowerCase().split(/\s+/))
        .filter((word: string) => word.length > 3 && !commonWords.has(word));
      
      const wordCount = new Map<string, number>();
      words.forEach((word: string) => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      });
      
      Array.from(wordCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([word]) => topics.add(word));
    }
    
    return Array.from(topics).slice(0, 10);
  }

  private generateSummary(results: any[], query: string): string {
    const domains = Array.from(new Set(results.map(r => r.metadata.domain)));
    const contentTypes = Array.from(new Set(results.map(r => r.metadata.contentType)));
    
    return `Deep research on "${query}" found ${results.length} relevant sources across ${domains.length} domains. Content types include: ${contentTypes.join(', ')}. The comprehensive analysis provides multi-perspective insights with quality validation.`;
  }

  private identifyTrends(results: any[]): ResearchInsight[] {
    const insights: ResearchInsight[] = [];
    
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
        content: `Primary information sources: ${topDomains.map(([domain, count]) => `${domain} (${count} results)`).join(', ')}`,
        confidence: 0.7,
        sources: results.map(r => r.url),
        tags: ['trend', 'sources', 'popularity']
      });
    }
    
    return insights;
  }

  private identifyPatterns(results: any[]): ResearchInsight[] {
    const insights: ResearchInsight[] = [];
    
    const contentTypeCount = new Map<string, number>();
    results.forEach(r => {
      contentTypeCount.set(r.metadata.contentType, (contentTypeCount.get(r.metadata.contentType) || 0) + 1);
    });
    
    const dominantType = Array.from(contentTypeCount.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    if (dominantType && dominantType[1] > results.length * 0.4) {
      insights.push({
        type: 'pattern',
        content: `Content distribution shows ${Math.round(dominantType[1] / results.length * 100)}% ${dominantType[0]} format, indicating this topic is primarily discussed in ${dominantType[0]} context.`,
        confidence: 0.6,
        sources: results.map(r => r.url),
        tags: ['pattern', 'content-type', 'distribution']
      });
    }
    
    return insights;
  }

  // Progress tracking methods
  onProgress(callback: (progress: ResearchProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  private async updateProgress(sessionId: string, progress: ResearchProgress): Promise<void> {
    console.log(`📊 Progress Update [${sessionId}]: ${progress.step} - ${progress.progress}% - ${progress.currentTask}`);
    
    // Notify all progress callbacks
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }

  private async storeSessionInMemory(session: ResearchSession): Promise<void> {
    // Store session in persistent memory for future reference
    await this._memory.store({
      role: 'system',
      content: `Research session ${session.id} completed: ${JSON.stringify(session.metadata)}`
    });
  }

  async resumeResearch(sessionId: string): Promise<ResearchSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    console.log(`🔄 Resuming research session ${sessionId}`);
    return session;
  }

  async getActiveSessions(): Promise<ResearchSession[]> {
    return Array.from(this.activeSessions.values());
  }
}

export default ResearchCoordinatorAgent;
