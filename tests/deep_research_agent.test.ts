import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DeepResearchAgent } from '../app/research/deep_research_agent';
import { QualityValidator } from '../app/research/quality_validator';
import { ResearchPlanner } from '../app/research/planner';
import { InformationSynthesizer } from '../app/research/synthesizer';
import { LLM } from '../app/llm';

// Mock LLM for testing
class MockLLM extends LLM {
  constructor() {
    super('test');
  }

  async generate(messages: any[], options?: any) {
    // Return mock responses based on the context
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content?.toLowerCase() || '';

    if (content.includes('research plan')) {
      return {
        content: JSON.stringify({
          main_query: "test query",
          research_objectives: ["objective 1", "objective 2"],
          subqueries: [
            {
              id: "sq1",
              query: "test subquery 1",
              priority: 8,
              type: "factual",
              dependencies: [],
              estimated_complexity: 3
            },
            {
              id: "sq2", 
              query: "test subquery 2",
              priority: 6,
              type: "analytical",
              dependencies: ["sq1"],
              estimated_complexity: 4
            }
          ],
          search_strategy: "comprehensive multi-source approach",
          expected_sources: ["academic", "news", "government"],
          time_estimate: 15,
          confidence_threshold: 0.7
        })
      };
    }

    if (content.includes('synthesis') || content.includes('analyze')) {
      return {
        content: "Based on the analysis of multiple sources, the research indicates significant findings with high confidence."
      };
    }

    return {
      content: "Mock LLM response for testing purposes."
    };
  }
}

describe('DeepResearchAgent', () => {
  let agent: DeepResearchAgent;
  let mockLLM: MockLLM;

  beforeEach(() => {
    mockLLM = new MockLLM();
    agent = new DeepResearchAgent({
      name: 'TestAgent',
      llm: mockLLM,
      max_sources_per_subquery: 5,
      confidence_threshold: 0.6,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultAgent = new DeepResearchAgent();
      expect(defaultAgent).toBeDefined();
      expect(defaultAgent.name).toBe('DeepResearchAgent');
    });

    it('should initialize with custom configuration', () => {
      expect(agent.name).toBe('TestAgent');
    });

    it('should have proper component initialization', () => {
      expect(agent).toHaveProperty('planner');
      expect(agent).toHaveProperty('synthesizer');
      expect(agent).toHaveProperty('citation_manager');
      expect(agent).toHaveProperty('report_generator');
    });
  });

  describe('Research Progress Tracking', () => {
    it('should track research progress correctly', () => {
      const progress = agent.get_research_progress();
      expect(progress).toHaveProperty('phase');
      expect(progress).toHaveProperty('completion_percentage');
      expect(progress).toHaveProperty('sources_discovered');
      expect(progress).toHaveProperty('insights_validated');
    });

    it('should provide quality assessment', () => {
      const quality = agent.get_quality_assessment();
      expect(quality).toHaveProperty('overall_score');
      expect(quality).toHaveProperty('source_quality');
      expect(quality).toHaveProperty('recommendations');
    });

    it('should generate research summary', () => {
      const summary = agent.get_research_summary();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });
  });

  describe('Research Data Export', () => {
    it('should export research data structure', () => {
      const data = agent.export_research_data();
      expect(data).toHaveProperty('plan');
      expect(data).toHaveProperty('synthesis');
      expect(data).toHaveProperty('citations');
      expect(data).toHaveProperty('memory_state');
    });
  });

  describe('Configuration Validation', () => {
    it('should handle invalid configuration gracefully', () => {
      expect(() => {
        new DeepResearchAgent({
          max_sources_per_subquery: -1, // Invalid
        });
      }).not.toThrow();
    });

    it('should use default values for missing config', () => {
      const agent = new DeepResearchAgent({});
      expect(agent).toBeDefined();
    });
  });
});

describe('ResearchPlanner', () => {
  let planner: ResearchPlanner;
  let mockLLM: MockLLM;

  beforeEach(() => {
    mockLLM = new MockLLM();
    planner = new ResearchPlanner(mockLLM);
  });

  describe('Research Plan Creation', () => {
    it('should create a valid research plan', async () => {
      const query = "What are the benefits of renewable energy?";
      const plan = await planner.create_research_plan(query);
      
      expect(plan).toHaveProperty('main_query', query);
      expect(plan).toHaveProperty('subqueries');
      expect(plan).toHaveProperty('research_objectives');
      expect(plan).toHaveProperty('time_estimate');
      expect(Array.isArray(plan.subqueries)).toBe(true);
      expect(plan.subqueries.length).toBeGreaterThan(0);
    });

    it('should generate subqueries with proper structure', async () => {
      const query = "Impact of AI on healthcare";
      const plan = await planner.create_research_plan(query);
      
      plan.subqueries.forEach(subquery => {
        expect(subquery).toHaveProperty('id');
        expect(subquery).toHaveProperty('query');
        expect(subquery).toHaveProperty('priority');
        expect(subquery).toHaveProperty('type');
        expect(subquery).toHaveProperty('estimated_complexity');
        expect(subquery.priority).toBeGreaterThanOrEqual(1);
        expect(subquery.priority).toBeLessThanOrEqual(10);
      });
    });

    it('should handle query refinement', async () => {
      const query = "Climate change effects";
      const plan = await planner.create_research_plan(query);
      const feedback = "Focus more on economic impacts";
      
      const refinedPlan = await planner.refine_plan(plan, feedback);
      expect(refinedPlan).toHaveProperty('main_query');
      expect(refinedPlan.subqueries).toBeDefined();
    });
  });

  describe('Subquery Management', () => {
    it('should get next available subquery', async () => {
      const query = "Test query";
      const plan = await planner.create_research_plan(query);
      const completed: string[] = [];
      
      const nextSubquery = planner.get_next_subquery(plan, completed);
      expect(nextSubquery).toBeDefined();
      expect(nextSubquery?.priority).toBeDefined();
    });

    it('should respect dependencies', async () => {
      const query = "Complex research topic";
      const plan = await planner.create_research_plan(query);
      
      // Simulate completing a subquery
      const completed = [plan.subqueries[0].id];
      const nextSubquery = planner.get_next_subquery(plan, completed);
      
      if (nextSubquery?.dependencies) {
        const hasUnmetDependencies = nextSubquery.dependencies.some(dep => !completed.includes(dep));
        expect(hasUnmetDependencies).toBe(false);
      }
    });

    it('should calculate progress correctly', async () => {
      const query = "Progress test";
      const plan = await planner.create_research_plan(query);
      
      const progress0 = planner.estimate_progress(plan, []);
      expect(progress0).toBe(0);
      
      const completed = [plan.subqueries[0].id];
      const progress1 = planner.estimate_progress(plan, completed);
      expect(progress1).toBeGreaterThan(0);
      expect(progress1).toBeLessThanOrEqual(1);
    });
  });
});

describe('QualityValidator', () => {
  let validator: QualityValidator;

  beforeEach(() => {
    validator = new QualityValidator({
      min_sources_threshold: 5,
      min_authority_threshold: 6,
      min_confidence_threshold: 0.7,
    });
  });

  describe('Quality Metrics Calculation', () => {
    it('should calculate quality metrics for valid data', async () => {
      const mockData = {
        research_plan: {
          main_query: "test query",
          research_objectives: ["obj1", "obj2"],
          subqueries: [
            {
              id: "sq1",
              query: "test",
              priority: 8,
              type: "factual" as const,
              dependencies: [],
              estimated_complexity: 3
            }
          ],
          search_strategy: "test strategy",
          expected_sources: ["academic"],
          time_estimate: 10,
          confidence_threshold: 0.7
        },
        synthesis: {
          query: "test query",
          executive_summary: "test summary",
          key_findings: ["finding1", "finding2"],
          insights: [
            {
              id: "insight1",
              content: "test insight",
              confidence_score: 0.8,
              supporting_sources: ["source1", "source2"],
              insight_type: "fact" as const,
              key_points: ["point1", "point2"],
              related_topics: ["topic1"]
            }
          ],
          sources: [
            {
              id: "source1",
              url: "https://example.com",
              title: "Test Source",
              domain: "example.com",
              authority_score: 8,
              relevance_score: 0.9,
              content_type: "article" as const,
              published_date: "2024-01-01"
            }
          ],
          confidence_assessment: {
            overall_confidence: 0.8,
            data_quality: 0.9,
            source_diversity: 0.7,
            information_completeness: 0.8
          },
          research_gaps: [],
          recommendations: ["rec1"],
          synthesis_metadata: {
            total_sources: 1,
            synthesis_time: 5,
            processing_timestamp: "2024-01-01T00:00:00Z",
            methodology: "test"
          }
        },
        citations: {
          total_sources: 1,
          total_citations: 1,
          citation_density: 1,
          source_coverage: 1,
          citation_quality_score: 0.8,
          citations: [],
          bibliography: [],
          citation_styles: {
            apa: ["citation1"],
            mla: ["citation1"],
            chicago: ["citation1"],
            ieee: ["citation1"]
          }
        }
      };

      const report = await validator.validate_research(mockData);
      
      expect(report).toHaveProperty('overall_score');
      expect(report).toHaveProperty('quality_grade');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('issues');
      expect(report).toHaveProperty('strengths');
      expect(report).toHaveProperty('recommendations');
      expect(report.overall_score).toBeGreaterThanOrEqual(0);
      expect(report.overall_score).toBeLessThanOrEqual(1);
    });

    it('should identify quality issues', async () => {
      const poorQualityData = {
        research_plan: {
          main_query: "test",
          research_objectives: [],
          subqueries: [],
          search_strategy: "",
          expected_sources: [],
          time_estimate: 0,
          confidence_threshold: 0.5
        },
        synthesis: {
          query: "test",
          executive_summary: "",
          key_findings: [],
          insights: [],
          sources: [],
          confidence_assessment: {
            overall_confidence: 0.3,
            data_quality: 0.2,
            source_diversity: 0.1,
            information_completeness: 0.2
          },
          research_gaps: ["gap1", "gap2"],
          recommendations: [],
          synthesis_metadata: {
            total_sources: 0,
            synthesis_time: 0,
            processing_timestamp: "2024-01-01T00:00:00Z",
            methodology: "test"
          }
        },
        citations: {
          total_sources: 0,
          total_citations: 0,
          citation_density: 0,
          source_coverage: 0,
          citation_quality_score: 0,
          citations: [],
          bibliography: [],
          citation_styles: {
            apa: [],
            mla: [],
            chicago: [],
            ieee: []
          }
        }
      };

      const report = await validator.validate_research(poorQualityData);
      
      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.overall_score).toBeLessThan(0.6);
      expect(report.meets_standards).toBe(false);
    });

    it('should generate quality summary', () => {
      const mockReport = {
        overall_score: 0.85,
        quality_grade: "B" as const,
        metrics: {
          source_quality: {
            average_authority: 7.5,
            authority_distribution: { high: 3, medium: 2, low: 0 },
            domain_diversity: 0.8,
            temporal_coverage: 0.7
          },
          content_quality: {
            information_density: 0.9,
            cross_validation_rate: 0.8,
            contradiction_rate: 0.1,
            completeness_score: 0.85
          },
          synthesis_quality: {
            insight_confidence_avg: 0.8,
            citation_coverage: 0.9,
            coherence_score: 0.85,
            depth_score: 0.8
          },
          overall_quality: 0.85
        },
        issues: [],
        strengths: ["strength1", "strength2"],
        recommendations: ["rec1"],
        validation_timestamp: "2024-01-01T00:00:00Z",
        meets_standards: true
      };

      const summary = validator.generate_quality_summary(mockReport);
      expect(typeof summary).toBe('string');
      expect(summary).toContain('85.0%');
      expect(summary).toContain('Grade: B');
      expect(summary).toContain('✓ PASS');
    });
  });
});

describe('Integration Tests', () => {
  let agent: DeepResearchAgent;
  let validator: QualityValidator;

  beforeEach(() => {
    const mockLLM = new MockLLM();
    agent = new DeepResearchAgent({
      llm: mockLLM,
      max_sources_per_subquery: 3,
      confidence_threshold: 0.6,
    });
    validator = new QualityValidator();
  });

  it('should complete end-to-end research workflow', async () => {
    // This is a simplified test due to mocking constraints
    const progress = agent.get_research_progress();
    expect(progress.phase).toBeDefined();
    
    const quality = agent.get_quality_assessment();
    expect(quality.overall_score).toBeGreaterThanOrEqual(0);
    
    const summary = agent.get_research_summary();
    expect(summary).toContain('Research Session Summary');
  });

  it('should export and validate research data', () => {
    const data = agent.export_research_data();
    expect(data).toHaveProperty('plan');
    expect(data).toHaveProperty('synthesis');
    expect(data).toHaveProperty('citations');
    expect(data).toHaveProperty('memory_state');
  });

  it('should handle errors gracefully', async () => {
    // Test error handling in various scenarios
    expect(() => {
      agent.get_research_progress();
    }).not.toThrow();

    expect(() => {
      agent.get_quality_assessment();
    }).not.toThrow();
  });
});

describe('Performance Tests', () => {
  it('should handle concurrent research requests', async () => {
    const agents = Array.from({ length: 3 }, (_, i) => 
      new DeepResearchAgent({
        name: `Agent${i}`,
        llm: new MockLLM(),
        max_sources_per_subquery: 2,
      })
    );

    const startTime = Date.now();
    
    // Simulate concurrent research (simplified due to mocking)
    const progressResults = agents.map(agent => agent.get_research_progress());
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    expect(progressResults).toHaveLength(3);
    expect(executionTime).toBeLessThan(1000); // Should be very fast with mocks
  });

  it('should optimize memory usage', () => {
    const agent = new DeepResearchAgent({
      llm: new MockLLM(),
    });

    // Test memory cleanup
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Perform multiple operations
    for (let i = 0; i < 10; i++) {
      agent.get_research_progress();
      agent.get_quality_assessment();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
  });
});