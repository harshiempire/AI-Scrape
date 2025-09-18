// src/services/promptingService.ts
import { LLM } from '../core/types.js';
import { DeepResearchQuery, ResearchContext } from '../agents/researchCoordinatorAgent.js';

export interface PromptTemplate {
  template: string;
  variables: string[];
  description: string;
  category: 'system' | 'task' | 'analysis' | 'synthesis' | 'quality';
  version: string;
}

export interface PromptValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  score: number;
}

export interface PromptOptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  improvements: string[];
  confidence: number;
}

export class PromptingService {
  private promptTemplates = new Map<string, PromptTemplate>();
  private llm: LLM;

  constructor(llm: LLM) {
    this.llm = llm;
    this.initializePromptTemplates();
  }

  private initializePromptTemplates(): void {
    console.log(`🧠 Initializing prompt templates`);
    
    // Research Coordinator Prompts
    this.promptTemplates.set('coordinator_system', {
      template: `You are a research coordinator managing a team of specialized research agents.

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

Always provide clear, actionable instructions to agents and maintain context across the research process.

Current Query: {{query}}
Research Context: {{context}}
Strategy: {{strategy}}`,
      variables: ['query', 'context', 'strategy'],
      description: 'System prompt for research coordinator agent',
      category: 'system',
      version: '1.0'
    });

    // Data Collection Agent Prompts
    this.promptTemplates.set('data_collection_system', {
      template: `You are a data collection specialist focused on gathering comprehensive information.

Your expertise:
1. Web search optimization and source identification
2. Academic database queries (PubMed, arXiv, Google Scholar)
3. Social media monitoring and sentiment analysis
4. News aggregation and real-time information
5. Document processing (PDFs, research papers)

For each research query, you should:
- Identify the most relevant sources
- Gather data from multiple perspectives
- Ensure source diversity and credibility
- Provide raw data with metadata
- Maintain ethical data collection practices

Always prioritize quality over quantity and provide detailed source attribution.

Current Task: {{task}}
Query: {{query}}
Sources: {{sources}}
Depth: {{depth}}`,
      variables: ['task', 'query', 'sources', 'depth'],
      description: 'System prompt for data collection agent',
      category: 'system',
      version: '1.0'
    });

    // Analysis Agent Prompts
    this.promptTemplates.set('analysis_system', {
      template: `You are a content analysis specialist focused on extracting insights from raw data.

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

Maintain analytical rigor while being open to unexpected insights.

Current Task: {{task}}
Data: {{data}}
Query: {{query}}
Context: {{context}}`,
      variables: ['task', 'data', 'query', 'context'],
      description: 'System prompt for analysis agent',
      category: 'system',
      version: '1.0'
    });

    // Synthesis Agent Prompts
    this.promptTemplates.set('synthesis_system', {
      template: `You are a synthesis specialist focused on combining findings into coherent insights.

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

Focus on creating value through synthesis rather than just summarizing.

Current Task: {{task}}
Analysis: {{analysis}}
Query: {{query}}
Context: {{context}}`,
      variables: ['task', 'analysis', 'query', 'context'],
      description: 'System prompt for synthesis agent',
      category: 'system',
      version: '1.0'
    });

    // Quality Agent Prompts
    this.promptTemplates.set('quality_system', {
      template: `You are a quality assurance specialist focused on validating research findings.

Your capabilities:
1. Source credibility assessment
2. Fact-checking and verification
3. Bias detection and mitigation
4. Cross-reference validation
5. Quality scoring and metrics

Quality approach:
- Verify claims against multiple sources
- Assess source reputation and authority
- Identify potential biases or conflicts of interest
- Provide confidence scores for findings
- Flag unreliable or suspicious content

Maintain high standards for accuracy and reliability.

Current Task: {{task}}
Findings: {{findings}}
Sources: {{sources}}
Context: {{context}}`,
      variables: ['task', 'findings', 'sources', 'context'],
      description: 'System prompt for quality agent',
      category: 'system',
      version: '1.0'
    });

    // Task-specific prompts
    this.promptTemplates.set('strategy_determination', {
      template: `Analyze this research query and determine the optimal research strategy:

Query: "{{query}}"
Depth: {{depth}}
Focus Areas: {{focusAreas}}
Context: {{context}}

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

Respond with just the strategy name (e.g., "exploratory").`,
      variables: ['query', 'depth', 'focusAreas', 'context'],
      description: 'Prompt for determining research strategy',
      category: 'task',
      version: '1.0'
    });

    this.promptTemplates.set('insight_generation', {
      template: `Generate comprehensive insights from the following research data:

Query: "{{query}}"
Data: {{data}}
Analysis Results: {{analysis}}

Focus on:
1. Key findings and patterns
2. Trends and developments
3. Contradictions or conflicts
4. Recommendations
5. Areas for further research

Provide insights with:
- Clear, actionable content
- Confidence scores (0-1)
- Supporting evidence
- Relevant tags

Format as JSON with the following structure:
{
  "insights": [
    {
      "type": "trend|pattern|contradiction|summary|recommendation",
      "content": "detailed insight description",
      "confidence": 0.8,
      "sources": ["source1", "source2"],
      "tags": ["tag1", "tag2"],
      "evidence": [
        {
          "source": "source_url",
          "content": "supporting content",
          "relevance": 0.9,
          "type": "quote|statistic|example|reference"
        }
      ]
    }
  ]
}`,
      variables: ['query', 'data', 'analysis'],
      description: 'Prompt for generating research insights',
      category: 'analysis',
      version: '1.0'
    });

    this.promptTemplates.set('quality_assessment', {
      template: `Assess the quality and reliability of the following research findings:

Findings: {{findings}}
Sources: {{sources}}
Context: {{context}}

Evaluate:
1. Source credibility and authority
2. Content accuracy and completeness
3. Potential biases or conflicts
4. Cross-reference consistency
5. Overall reliability

Provide assessment with:
- Quality scores (0-1)
- Specific issues or concerns
- Recommendations for improvement
- Confidence in assessment

Format as JSON:
{
  "qualityScore": 0.8,
  "issues": ["issue1", "issue2"],
  "recommendations": ["rec1", "rec2"],
  "confidence": 0.9,
  "sourceAssessment": {
    "source1": {
      "credibility": 0.9,
      "bias": "low",
      "issues": []
    }
  }
}`,
      variables: ['findings', 'sources', 'context'],
      description: 'Prompt for quality assessment',
      category: 'quality',
      version: '1.0'
    });

    console.log(`✅ Initialized ${this.promptTemplates.size} prompt templates`);
  }

  generatePrompt(templateName: string, variables: Record<string, any>): string {
    const template = this.promptTemplates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    let prompt = template.template;

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value));
    }

    // Check for unreplaced variables
    const unreplacedVars = prompt.match(/\{\{(\w+)\}\}/g);
    if (unreplacedVars) {
      console.warn(`⚠️ Unreplaced variables in prompt ${templateName}:`, unreplacedVars);
    }

    return prompt;
  }

  async adaptPromptForContext(
    basePrompt: string,
    context: ResearchContext,
    agentType: string
  ): Promise<string> {
    console.log(`🔄 Adapting prompt for context and agent type: ${agentType}`);

    let adaptedPrompt = basePrompt;

    // Add context-specific instructions
    if (context.timeConstraints) {
      adaptedPrompt += `\n\nIMPORTANT: This research has time constraints. Prioritize efficiency while maintaining quality.`;
    }

    if (context.requiresFactChecking) {
      adaptedPrompt += `\n\nCRITICAL: All findings must be fact-checked and cross-referenced. Flag any unverified claims.`;
    }

    if (context.isAcademicResearch) {
      adaptedPrompt += `\n\nACADEMIC FOCUS: Prioritize peer-reviewed sources and academic databases. Include methodology analysis.`;
    }

    if (context.domain) {
      adaptedPrompt += `\n\nDOMAIN FOCUS: This research is in the ${context.domain} domain. Tailor your approach accordingly.`;
    }

    if (context.targetAudience) {
      adaptedPrompt += `\n\nAUDIENCE: Target your findings for ${context.targetAudience} audience.`;
    }

    // Add agent-specific instructions
    switch (agentType) {
      case 'data_collection':
        adaptedPrompt += `\n\nDATA COLLECTION: Focus on comprehensive source identification and data gathering.`;
        break;
      case 'analysis':
        adaptedPrompt += `\n\nANALYSIS: Focus on pattern recognition and insight extraction.`;
        break;
      case 'synthesis':
        adaptedPrompt += `\n\nSYNTHESIS: Focus on combining findings and generating actionable insights.`;
        break;
      case 'quality':
        adaptedPrompt += `\n\nQUALITY: Focus on validation, fact-checking, and reliability assessment.`;
        break;
    }

    return adaptedPrompt;
  }

  async generateAgentSpecificPrompt(
    agentType: string,
    task: string,
    context: ResearchContext,
    additionalData?: any
  ): Promise<string> {
    console.log(`🎯 Generating agent-specific prompt for ${agentType}`);

    const baseTemplate = this.promptTemplates.get(`${agentType}_system`);
    if (!baseTemplate) {
      throw new Error(`No template found for agent type: ${agentType}`);
    }

    const basePrompt = this.generatePrompt(`${agentType}_system`, {
      task,
      query: additionalData?.query || 'N/A',
      context: JSON.stringify(context),
      ...additionalData
    });

    const adaptedPrompt = await this.adaptPromptForContext(basePrompt, context, agentType);

    // Add task-specific instructions
    const taskPrompt = `

CURRENT TASK: ${task}

Instructions:
1. Focus specifically on the assigned task
2. Provide detailed progress updates
3. Flag any issues or blockers immediately
4. Maintain context with other agents' work
5. Ensure output quality meets standards

Context from other agents: ${JSON.stringify(context.interAgentContext || {})}
`;

    return adaptedPrompt + taskPrompt;
  }

  async validatePrompt(prompt: string): Promise<PromptValidationResult> {
    console.log(`🔍 Validating prompt quality`);

    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for clarity
    if (prompt.length > 2000) {
      issues.push('Prompt is too long, may cause confusion');
      suggestions.push('Consider breaking into smaller, focused prompts');
    }

    if (prompt.length < 100) {
      issues.push('Prompt is too short, may lack specificity');
      suggestions.push('Add more detailed instructions and context');
    }

    // Check for specificity
    if (!prompt.includes('specific') && !prompt.includes('detailed')) {
      issues.push('Prompt lacks specificity instructions');
      suggestions.push('Add instructions for specific, detailed responses');
    }

    // Check for context
    if (!prompt.includes('context') && !prompt.includes('background')) {
      issues.push('Prompt lacks context awareness');
      suggestions.push('Include context and background information');
    }

    // Check for quality standards
    if (!prompt.includes('quality') && !prompt.includes('accuracy')) {
      issues.push('Prompt lacks quality standards');
      suggestions.push('Add quality and accuracy requirements');
    }

    // Check for error handling
    if (!prompt.includes('error') && !prompt.includes('issue') && !prompt.includes('problem')) {
      issues.push('Prompt lacks error handling instructions');
      suggestions.push('Add instructions for handling errors and issues');
    }

    // Calculate score
    const score = Math.max(0, 1 - (issues.length * 0.2));

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
      score
    };
  }

  async optimizePrompt(prompt: string, agentType: string): Promise<PromptOptimizationResult> {
    console.log(`⚡ Optimizing prompt for ${agentType}`);

    const optimizationPrompt = `
Optimize this prompt for a ${agentType} agent:

Original prompt:
${prompt}

Requirements:
1. Make it more specific and actionable
2. Add context awareness
3. Include quality standards
4. Ensure clarity and conciseness
5. Add error handling instructions
6. Include examples if helpful
7. Maintain the original intent

Provide the optimized prompt:
`;

    try {
      const response = await this.llm.generate({ prompt: optimizationPrompt });
      
      const improvements = [
        'Enhanced specificity and actionability',
        'Improved context awareness',
        'Added quality standards',
        'Better clarity and conciseness',
        'Enhanced error handling'
      ];

      return {
        originalPrompt: prompt,
        optimizedPrompt: response.text,
        improvements,
        confidence: 0.8
      };

    } catch (error) {
      console.error('❌ Failed to optimize prompt:', error);
      throw error;
    }
  }

  async generateDynamicPrompt(
    baseTemplate: string,
    context: ResearchContext,
    agentType: string,
    taskData: any
  ): Promise<string> {
    console.log(`🔄 Generating dynamic prompt for ${agentType}`);

    // Start with base template
    let prompt = baseTemplate;

    // Add context-specific modifications
    if (context.timeConstraints) {
      prompt += `\n\n⏰ TIME CONSTRAINT: Complete this task efficiently while maintaining quality.`;
    }

    if (context.requiresFactChecking) {
      prompt += `\n\n✅ FACT-CHECKING REQUIRED: Verify all claims and cross-reference sources.`;
    }

    if (context.isAcademicResearch) {
      prompt += `\n\n🎓 ACADEMIC STANDARDS: Use peer-reviewed sources and academic methodology.`;
    }

    // Add task-specific instructions
    if (taskData.priority === 'high') {
      prompt += `\n\n🔥 HIGH PRIORITY: This task requires immediate attention and thorough execution.`;
    }

    if (taskData.dependencies && taskData.dependencies.length > 0) {
      prompt += `\n\n🔗 DEPENDENCIES: This task depends on: ${taskData.dependencies.join(', ')}`;
    }

    // Add agent-specific enhancements
    switch (agentType) {
      case 'data_collection':
        prompt += `\n\n📊 DATA COLLECTION: Gather comprehensive data from diverse, credible sources.`;
        break;
      case 'analysis':
        prompt += `\n\n🔍 ANALYSIS: Extract meaningful patterns and insights from the data.`;
        break;
      case 'synthesis':
        prompt += `\n\n🧩 SYNTHESIS: Combine findings into coherent, actionable insights.`;
        break;
      case 'quality':
        prompt += `\n\n🛡️ QUALITY: Validate sources and ensure accuracy and reliability.`;
        break;
    }

    return prompt;
  }

  getAvailableTemplates(): PromptTemplate[] {
    return Array.from(this.promptTemplates.values());
  }

  getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return Array.from(this.promptTemplates.values())
      .filter(template => template.category === category);
  }

  addTemplate(name: string, template: PromptTemplate): void {
    this.promptTemplates.set(name, template);
    console.log(`✅ Added prompt template: ${name}`);
  }

  removeTemplate(name: string): boolean {
    const removed = this.promptTemplates.delete(name);
    if (removed) {
      console.log(`🗑️ Removed prompt template: ${name}`);
    }
    return removed;
  }

  async testPrompt(templateName: string, variables: Record<string, any>): Promise<{
    prompt: string;
    validation: PromptValidationResult;
    optimization?: PromptOptimizationResult;
  }> {
    console.log(`🧪 Testing prompt template: ${templateName}`);

    const prompt = this.generatePrompt(templateName, variables);
    const validation = await this.validatePrompt(prompt);
    
    let optimization: PromptOptimizationResult | undefined;
    if (!validation.isValid) {
      optimization = await this.optimizePrompt(prompt, 'general');
    }

    return {
      prompt,
      validation,
      optimization
    };
  }
}

export default PromptingService;
