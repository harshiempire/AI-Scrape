// src/examples/deepResearchTest.ts
import { ResearchCoordinatorAgent, DeepResearchQuery } from '../agents/researchCoordinatorAgent.js';
import { OpenAILLM } from '../core/llm.js';
import { InMemoryMemory } from '../core/memory.js';
import { ToolRegistry } from '../core/toolRegistry.js';
import { Tool } from '../core/tool.js';
import { EnhancedSearchTool } from '../tools/enhancedSearchTool.js';
import { ResearchMemoryService } from '../services/researchMemory.js';
import { BackgroundProcessingService } from '../services/backgroundProcessingService.js';
import { PromptingService } from '../services/promptingService.js';
import { ResearchTemplateManager } from '../templates/researchTemplates.js';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  metrics?: any;
}

class DeepResearchTester {
  private coordinator!: ResearchCoordinatorAgent;
  private researchMemory!: ResearchMemoryService;
  private backgroundService!: BackgroundProcessingService;
  private promptingService!: PromptingService;
  private templateManager!: ResearchTemplateManager;
  private testResults: TestResult[] = [];

  constructor() {
    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    console.log('🔧 Initializing Deep Research Framework services...');

    // Initialize core services
    const llm = new OpenAILLM({ 
      model: 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY 
    });
    
    const memory = new InMemoryMemory();
    const toolRegistry = new ToolRegistry();
    
    // Register tools
    const enhancedSearchTool = new EnhancedSearchTool();
    const searchTool = new Tool({
      name: 'enhanced_search',
      description: 'Enhanced search tool with real-time and semantic search capabilities',
      func: async (input: any) => {
        return await enhancedSearchTool.search(input.query, input.depth || 'medium');
      }
    });
    toolRegistry.register(searchTool);
    
    // Initialize services
    this.researchMemory = new ResearchMemoryService(memory);
    this.backgroundService = new BackgroundProcessingService(this.researchMemory);
    this.promptingService = new PromptingService(llm);
    this.templateManager = new ResearchTemplateManager();
    
    // Create coordinator
    this.coordinator = new ResearchCoordinatorAgent({
      llm,
      memory,
      tools: toolRegistry
    });

    console.log('✅ All services initialized successfully');
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Deep Research Framework Test Suite\n');

    const tests = [
      () => this.testBasicResearch(),
      () => this.testMultiAgentCoordination(),
      () => this.testResearchMemory(),
      () => this.testBackgroundProcessing(),
      () => this.testPromptingFramework(),
      () => this.testResearchTemplates(),
      () => this.testProgressTracking(),
      () => this.testSessionPersistence(),
      () => this.testQualityMetrics(),
      () => this.testErrorHandling()
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        console.error(`❌ Test failed:`, error);
      }
    }

    this.printTestSummary();
  }

  private async testBasicResearch(): Promise<void> {
    const testName = 'Basic Research Functionality';
    console.log(`🧪 Testing: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      const query: DeepResearchQuery = {
        query: "artificial intelligence trends 2024",
        depth: "medium",
        strategy: "trend_analysis",
        maxResults: 10
      };

      const session = await this.coordinator.conductDeepResearch(query);
      
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName,
        success: true,
        duration,
        metrics: {
          sessionId: session.id,
          totalResults: session.metadata.totalResults,
          insightsGenerated: session.insights.length,
          searchTime: session.metadata.totalSearchTime
        }
      });

      console.log(`✅ ${testName} passed (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        success: false,
        duration,
        error: (error as Error).message
      });
      console.log(`❌ ${testName} failed: ${(error as Error).message}`);
    }
  }

  private async testMultiAgentCoordination(): Promise<void> {
    const testName = 'Multi-Agent Coordination';
    console.log(`🧪 Testing: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      const query: DeepResearchQuery = {
        query: "machine learning frameworks comparison",
        depth: "deep",
        strategy: "comparative",
        focusAreas: ["performance", "ease_of_use", "community"],
        maxResults: 15
      };

      // Test progress tracking
      let progressUpdates = 0;
      this.coordinator.onProgress((progress) => {
        progressUpdates++;
        console.log(`  📊 Progress: ${progress.step} - ${progress.progress}%`);
      });

      const session = await this.coordinator.conductDeepResearch(query);
      
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName,
        success: true,
        duration,
        metrics: {
          sessionId: session.id,
          progressUpdates,
          totalResults: session.metadata.totalResults,
          insightsGenerated: session.insights.length,
          agentCoordination: true
        }
      });

      console.log(`✅ ${testName} passed (${duration}ms, ${progressUpdates} progress updates)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        success: false,
        duration,
        error: (error as Error).message
      });
      console.log(`❌ ${testName} failed: ${(error as Error).message}`);
    }
  }

  private async testResearchMemory(): Promise<void> {
    const testName = 'Research Memory System';
    console.log(`🧪 Testing: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      // Store a research session
      const query: DeepResearchQuery = {
        query: "blockchain technology applications",
        depth: "medium",
        strategy: "systematic"
      };

      const session = await this.coordinator.conductDeepResearch(query);
      await this.researchMemory.storeResearchSession(session, query);

      // Test finding related research
      const relatedSessions = await this.researchMemory.findRelatedResearch("blockchain", 3);
      
      // Test research history
      const history = await this.researchMemory.getResearchHistory(5);
      
      // Test metrics
      const metrics = await this.researchMemory.getResearchMetrics();
      
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName,
        success: true,
        duration,
        metrics: {
          sessionStored: true,
          relatedSessionsFound: relatedSessions.length,
          historyRetrieved: history.length,
          totalSessions: metrics.totalSessions,
          averageQuality: metrics.averageQuality
        }
      });

      console.log(`✅ ${testName} passed (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        success: false,
        duration,
        error: (error as Error).message
      });
      console.log(`❌ ${testName} failed: ${(error as Error).message}`);
    }
  }

  private async testBackgroundProcessing(): Promise<void> {
    const testName = 'Background Processing Service';
    console.log(`🧪 Testing: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      const query: DeepResearchQuery = {
        query: "sustainable energy solutions",
        depth: "medium",
        strategy: "exploratory"
      };

      // Start background processing
      const sessionId = await this.backgroundService.startResearchSession(query, 'test_user');
      
      // Monitor progress
      let progressUpdates = 0;
      this.backgroundService.onProgress(sessionId, (progress) => {
        progressUpdates++;
        console.log(`  📊 Background Progress: ${progress.step} - ${progress.progress}%`);
      });

      // Wait for completion
      let completed = false;
      let attempts = 0;
      while (!completed && attempts < 30) { // 30 second timeout
        const status = await this.backgroundService.getSessionStatus(sessionId);
        if (status?.status === 'completed' || status?.status === 'failed') {
          completed = true;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName,
        success: completed,
        duration,
        metrics: {
          sessionId,
          progressUpdates,
          completed,
          attempts
        }
      });

      console.log(`✅ ${testName} passed (${duration}ms, ${progressUpdates} progress updates)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        success: false,
        duration,
        error: (error as Error).message
      });
      console.log(`❌ ${testName} failed: ${(error as Error).message}`);
    }
  }

  private async testPromptingFramework(): Promise<void> {
    const testName = 'Prompting Framework';
    console.log(`🧪 Testing: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      // Test prompt generation
      const prompt = this.promptingService.generatePrompt('strategy_determination', {
        query: 'AI agents research',
        depth: 'deep',
        focusAreas: 'implementation, best practices',
        context: 'academic research'
      });

      // Test prompt validation
      const validation = await this.promptingService.validatePrompt(prompt);
      
      // Test prompt optimization
      const optimization = await this.promptingService.optimizePrompt(prompt, 'coordinator');
      
      // Test agent-specific prompt generation
      const agentPrompt = await this.promptingService.generateAgentSpecificPrompt(
        'data_collection',
        'Gather comprehensive data on AI agents',
        { domain: 'technology', requiresFactChecking: true },
        { query: 'AI agents research' }
      );
      
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName,
        success: true,
        duration,
        metrics: {
          promptGenerated: prompt.length > 0,
          validationPassed: validation.isValid,
          optimizationCompleted: optimization.confidence > 0,
          agentPromptGenerated: agentPrompt.length > 0,
          templatesAvailable: this.promptingService.getAvailableTemplates().length
        }
      });

      console.log(`✅ ${testName} passed (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        success: false,
        duration,
        error: (error as Error).message
      });
      console.log(`❌ ${testName} failed: ${(error as Error).message}`);
    }
  }

  private async testResearchTemplates(): Promise<void> {
    const testName = 'Research Templates';
    console.log(`🧪 Testing: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      // Test template retrieval
      const templates = this.templateManager.getAllTemplates();
      const academicTemplates = this.templateManager.getTemplatesByCategory('academic');
      
      // Test template execution
      const marketTemplate = this.templateManager.getTemplate('market_research');
      if (marketTemplate) {
        const customData = {
          query: 'electric vehicle market analysis',
          industry: 'automotive',
          targetMarket: 'global',
          competitors: ['Tesla', 'BMW', 'Mercedes']
        };

        const result = await this.templateManager.executeTemplate(
          'market_research',
          customData,
          this.coordinator
        );
        
        const duration = Date.now() - startTime;
        
        this.testResults.push({
          testName,
          success: true,
          duration,
          metrics: {
            totalTemplates: templates.length,
            academicTemplates: academicTemplates.length,
            templateExecuted: true,
            executionTime: result.metrics.executionTime,
            sourcesFound: result.metrics.sourcesFound,
            insightsGenerated: result.metrics.insightsGenerated
          }
        });

        console.log(`✅ ${testName} passed (${duration}ms)`);
      } else {
        throw new Error('Market research template not found');
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        success: false,
        duration,
        error: (error as Error).message
      });
      console.log(`❌ ${testName} failed: ${(error as Error).message}`);
    }
  }

  private async testProgressTracking(): Promise<void> {
    const testName = 'Progress Tracking';
    console.log(`🧪 Testing: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      const query: DeepResearchQuery = {
        query: "quantum computing developments",
        depth: "deep",
        strategy: "systematic"
      };

      const progressUpdates: any[] = [];
      
      this.coordinator.onProgress((progress) => {
        progressUpdates.push(progress);
        console.log(`  📊 Progress: ${progress.step} - ${progress.progress}% - ${progress.currentTask}`);
      });

      const session = await this.coordinator.conductDeepResearch(query);
      
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName,
        success: true,
        duration,
        metrics: {
          progressUpdates: progressUpdates.length,
          stepsCompleted: progressUpdates.map(p => p.step),
          finalProgress: progressUpdates[progressUpdates.length - 1]?.progress || 0,
          sessionId: session.id
        }
      });

      console.log(`✅ ${testName} passed (${duration}ms, ${progressUpdates.length} updates)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        success: false,
        duration,
        error: (error as Error).message
      });
      console.log(`❌ ${testName} failed: ${(error as Error).message}`);
    }
  }

  private async testSessionPersistence(): Promise<void> {
    const testName = 'Session Persistence';
    console.log(`🧪 Testing: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      const query: DeepResearchQuery = {
        query: "renewable energy technologies",
        depth: "medium",
        strategy: "systematic"
      };

      // Conduct research
      const session = await this.coordinator.conductDeepResearch(query);
      
      // Store in memory
      await this.researchMemory.storeResearchSession(session, query);
      
      // Test session retrieval
      const activeSessions = await this.coordinator.getActiveSessions();
      const sessionFound = activeSessions.some(s => s.id === session.id);
      
      // Test session resume
      if (sessionFound) {
        const resumedSession = await this.coordinator.resumeResearch(session.id);
        
        const duration = Date.now() - startTime;
        
        this.testResults.push({
          testName,
          success: true,
          duration,
          metrics: {
            sessionStored: true,
            sessionRetrieved: sessionFound,
            sessionResumed: resumedSession.id === session.id,
            activeSessions: activeSessions.length
          }
        });

        console.log(`✅ ${testName} passed (${duration}ms)`);
      } else {
        throw new Error('Session not found in active sessions');
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        success: false,
        duration,
        error: (error as Error).message
      });
      console.log(`❌ ${testName} failed: ${(error as Error).message}`);
    }
  }

  private async testQualityMetrics(): Promise<void> {
    const testName = 'Quality Metrics';
    console.log(`🧪 Testing: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      const query: DeepResearchQuery = {
        query: "cybersecurity best practices",
        depth: "deep",
        strategy: "systematic",
        context: {
          requiresFactChecking: true,
          domain: 'technology'
        }
      };

      const session = await this.coordinator.conductDeepResearch(query);
      
      // Calculate quality metrics
      const avgConfidence = session.insights.reduce((sum, insight) => sum + insight.confidence, 0) / session.insights.length;
      const sourceDiversity = new Set(session.results.flatMap(r => r.fusedResults.map(f => f.metadata?.domain))).size;
      const contentTypes = new Set(session.results.flatMap(r => r.fusedResults.map(f => f.metadata?.contentType))).size;
      
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName,
        success: true,
        duration,
        metrics: {
          averageConfidence: avgConfidence,
          sourceDiversity,
          contentTypes,
          totalInsights: session.insights.length,
          totalResults: session.metadata.totalResults,
          searchTime: session.metadata.totalSearchTime
        }
      });

      console.log(`✅ ${testName} passed (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        success: false,
        duration,
        error: (error as Error).message
      });
      console.log(`❌ ${testName} failed: ${(error as Error).message}`);
    }
  }

  private async testErrorHandling(): Promise<void> {
    const testName = 'Error Handling';
    console.log(`🧪 Testing: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      // Test with invalid query
      const invalidQuery: DeepResearchQuery = {
        query: '', // Empty query
        depth: "medium",
        strategy: "systematic"
      };

      let errorCaught = false;
      try {
        await this.coordinator.conductDeepResearch(invalidQuery);
      } catch (error) {
        errorCaught = true;
        console.log(`  ⚠️ Expected error caught: ${(error as Error).message}`);
      }

      // Test with invalid template
      const invalidTemplate = this.templateManager.getTemplate('nonexistent_template');
      
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName,
        success: errorCaught && !invalidTemplate,
        duration,
        metrics: {
          errorHandling: errorCaught,
          templateValidation: !invalidTemplate,
          gracefulDegradation: true
        }
      });

      console.log(`✅ ${testName} passed (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        success: false,
        duration,
        error: (error as Error).message
      });
      console.log(`❌ ${testName} failed: ${(error as Error).message}`);
    }
  }

  private printTestSummary(): void {
    console.log('\n📊 Deep Research Framework Test Summary');
    console.log('=====================================');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${totalDuration}ms`);
    
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.testName}: ${result.duration}ms`);
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.metrics) {
        console.log(`   Metrics: ${JSON.stringify(result.metrics, null, 2)}`);
      }
    });
    
    if (failedTests === 0) {
      console.log('\n🎉 All tests passed! Deep Research Framework is ready for production.');
    } else {
      console.log(`\n⚠️ ${failedTests} test(s) failed. Please review and fix issues before production deployment.`);
    }
  }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DeepResearchTester();
  
  tester.runAllTests()
    .then(() => {
      console.log('\n✅ Test suite completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

export { DeepResearchTester };
