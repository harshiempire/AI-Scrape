// src/templates/researchTemplates.ts
import { DeepResearchQuery } from '../agents/researchCoordinatorAgent.js';
import { ResearchSession } from '../workflows/researchWorkflow.js';

export interface ResearchTemplate {
  id: string;
  name: string;
  description: string;
  category: 'academic' | 'business' | 'market' | 'technical' | 'general';
  defaultQuery: Partial<DeepResearchQuery>;
  customFields: Record<string, any>;
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'optional' | 'conditional';
  condition?: string;
  message: string;
}

export interface TemplateResult {
  template: ResearchTemplate;
  query: DeepResearchQuery;
  session: ResearchSession;
  metrics: TemplateMetrics;
}

export interface TemplateMetrics {
  executionTime: number;
  sourcesFound: number;
  insightsGenerated: number;
  qualityScore: number;
  completenessScore: number;
}

export class ResearchTemplateManager {
  private templates = new Map<string, ResearchTemplate>();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    console.log(`📋 Initializing research templates`);

    // Academic Literature Review Template
    this.templates.set('academic_literature_review', {
      id: 'academic_literature_review',
      name: 'Academic Literature Review',
      description: 'Comprehensive review of academic literature on a specific topic',
      category: 'academic',
      defaultQuery: {
        depth: 'deep',
        strategy: 'systematic',
        context: {
          isAcademicResearch: true,
          requiresFactChecking: true,
          domain: 'academic'
        }
      },
      customFields: {
        researchQuestion: '',
        methodology: '',
        timeRange: '',
        databases: ['pubmed', 'arxiv', 'scholar'],
        inclusionCriteria: '',
        exclusionCriteria: ''
      },
      validationRules: [
        { field: 'researchQuestion', type: 'required', message: 'Research question is required' },
        { field: 'methodology', type: 'required', message: 'Research methodology is required' },
        { field: 'timeRange', type: 'optional', message: 'Time range helps focus the search' }
      ]
    });

    // Market Research Template
    this.templates.set('market_research', {
      id: 'market_research',
      name: 'Market Research Analysis',
      description: 'Comprehensive market analysis including competitors, trends, and opportunities',
      category: 'business',
      defaultQuery: {
        depth: 'deep',
        strategy: 'comparative',
        context: {
          domain: 'business',
          targetAudience: 'business_analysts'
        }
      },
      customFields: {
        industry: '',
        targetMarket: '',
        competitors: [],
        timeFrame: '12_months',
        focusAreas: ['competition', 'trends', 'opportunities', 'threats'],
        dataSources: ['news', 'reports', 'social_media']
      },
      validationRules: [
        { field: 'industry', type: 'required', message: 'Industry specification is required' },
        { field: 'targetMarket', type: 'required', message: 'Target market definition is required' }
      ]
    });

    // Competitive Analysis Template
    this.templates.set('competitive_analysis', {
      id: 'competitive_analysis',
      name: 'Competitive Analysis',
      description: 'Detailed analysis of competitors, their strategies, and market positioning',
      category: 'business',
      defaultQuery: {
        depth: 'deep',
        strategy: 'comparative',
        context: {
          domain: 'business',
          targetAudience: 'strategists'
        }
      },
      customFields: {
        company: '',
        competitors: [],
        analysisDimensions: ['products', 'pricing', 'marketing', 'strategy'],
        timeFrame: '6_months',
        geographicScope: 'global',
        dataSources: ['websites', 'news', 'reports', 'social_media']
      },
      validationRules: [
        { field: 'company', type: 'required', message: 'Company name is required' },
        { field: 'competitors', type: 'required', message: 'At least one competitor must be specified' }
      ]
    });

    // Technical Documentation Research Template
    this.templates.set('technical_documentation', {
      id: 'technical_documentation',
      name: 'Technical Documentation Research',
      description: 'Research for technical documentation, API references, and implementation guides',
      category: 'technical',
      defaultQuery: {
        depth: 'deep',
        strategy: 'systematic',
        context: {
          domain: 'technology',
          targetAudience: 'developers'
        }
      },
      customFields: {
        technology: '',
        version: '',
        documentationType: 'api_reference',
        targetAudience: 'developers',
        complexity: 'intermediate',
        examples: true,
        codeSamples: true
      },
      validationRules: [
        { field: 'technology', type: 'required', message: 'Technology name is required' },
        { field: 'version', type: 'optional', message: 'Version helps target specific documentation' }
      ]
    });

    // Trend Analysis Template
    this.templates.set('trend_analysis', {
      id: 'trend_analysis',
      name: 'Trend Analysis',
      description: 'Analysis of emerging trends, patterns, and future developments',
      category: 'general',
      defaultQuery: {
        depth: 'deep',
        strategy: 'trend_analysis',
        context: {
          domain: 'general',
          targetAudience: 'analysts'
        }
      },
      customFields: {
        topic: '',
        timeFrame: '24_months',
        trendTypes: ['emerging', 'growing', 'declining', 'stable'],
        dataSources: ['news', 'social_media', 'reports', 'academic'],
        geographicScope: 'global',
        industryScope: 'all'
      },
      validationRules: [
        { field: 'topic', type: 'required', message: 'Topic specification is required' },
        { field: 'timeFrame', type: 'required', message: 'Time frame is required for trend analysis' }
      ]
    });

    // Product Research Template
    this.templates.set('product_research', {
      id: 'product_research',
      name: 'Product Research',
      description: 'Research for product development, feature analysis, and user needs',
      category: 'business',
      defaultQuery: {
        depth: 'medium',
        strategy: 'exploratory',
        context: {
          domain: 'product_development',
          targetAudience: 'product_managers'
        }
      },
      customFields: {
        productCategory: '',
        targetUsers: '',
        features: [],
        competitors: [],
        userNeeds: [],
        marketSize: '',
        dataSources: ['reviews', 'social_media', 'surveys', 'analytics']
      },
      validationRules: [
        { field: 'productCategory', type: 'required', message: 'Product category is required' },
        { field: 'targetUsers', type: 'required', message: 'Target user definition is required' }
      ]
    });

    console.log(`✅ Initialized ${this.templates.size} research templates`);
  }

  getTemplate(templateId: string): ResearchTemplate | null {
    return this.templates.get(templateId) || null;
  }

  getAllTemplates(): ResearchTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: ResearchTemplate['category']): ResearchTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.category === category);
  }

  createCustomTemplate(template: ResearchTemplate): void {
    this.templates.set(template.id, template);
    console.log(`✅ Created custom template: ${template.name}`);
  }

  updateTemplate(templateId: string, updates: Partial<ResearchTemplate>): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    const updatedTemplate = { ...template, ...updates };
    this.templates.set(templateId, updatedTemplate);
    console.log(`✅ Updated template: ${template.name}`);
    return true;
  }

  deleteTemplate(templateId: string): boolean {
    const deleted = this.templates.delete(templateId);
    if (deleted) {
      console.log(`🗑️ Deleted template: ${templateId}`);
    }
    return deleted;
  }

  validateTemplateQuery(templateId: string, query: DeepResearchQuery): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const template = this.templates.get(templateId);
    if (!template) {
      return {
        isValid: false,
        errors: ['Template not found'],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    template.validationRules.forEach(rule => {
      if (rule.type === 'required') {
        const value = query.context?.[rule.field as keyof typeof query.context];
        if (!value) {
          errors.push(rule.message);
        }
      }
    });

    // Validate custom fields
    Object.entries(template.customFields).forEach(([field, defaultValue]) => {
      const value = query.context?.[field as keyof typeof query.context];
      if (!value && defaultValue !== '') {
        warnings.push(`${field} is recommended but not provided`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  generateQueryFromTemplate(templateId: string, customData: Record<string, any>): DeepResearchQuery {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Start with default query
    const query: DeepResearchQuery = {
      query: customData.query || '',
      depth: template.defaultQuery.depth || 'medium',
      strategy: template.defaultQuery.strategy || 'systematic',
      context: {
        ...template.defaultQuery.context,
        ...customData
      }
    };

    // Add focus areas based on template
    if (template.customFields.focusAreas) {
      query.focusAreas = template.customFields.focusAreas;
    }

    // Add max results based on depth
    switch (query.depth) {
      case 'shallow':
        query.maxResults = 10;
        break;
      case 'medium':
        query.maxResults = 20;
        break;
      case 'deep':
        query.maxResults = 30;
        break;
    }

    return query;
  }

  async executeTemplate(
    templateId: string,
    customData: Record<string, any>,
    coordinator: any
  ): Promise<TemplateResult> {
    console.log(`🚀 Executing template: ${templateId}`);

    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const startTime = Date.now();

    try {
      // Generate query from template
      const query = this.generateQueryFromTemplate(templateId, customData);

      // Validate query
      const validation = this.validateTemplateQuery(templateId, query);
      if (!validation.isValid) {
        throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
      }

      // Execute research
      const session = await coordinator.conductDeepResearch(query);

      // Calculate metrics
      const metrics: TemplateMetrics = {
        executionTime: Date.now() - startTime,
        sourcesFound: session.metadata.totalResults,
        insightsGenerated: session.insights.length,
        qualityScore: this.calculateQualityScore(session),
        completenessScore: this.calculateCompletenessScore(session, template)
      };

      const result: TemplateResult = {
        template,
        query,
        session,
        metrics
      };

      console.log(`✅ Template ${templateId} executed successfully`);
      console.log(`📊 Metrics: ${metrics.executionTime}ms, ${metrics.sourcesFound} sources, ${metrics.insightsGenerated} insights`);

      return result;

    } catch (error) {
      console.error(`❌ Template ${templateId} execution failed:`, error);
      throw error;
    }
  }

  private calculateQualityScore(session: ResearchSession): number {
    const insightsQuality = session.insights.reduce((sum, insight) => sum + insight.confidence, 0) / session.insights.length;
    const resultsCount = session.metadata.totalResults;
    const searchTime = session.metadata.totalSearchTime;

    // Quality factors
    const insightsScore = insightsQuality || 0;
    const resultsScore = Math.min(resultsCount / 20, 1);
    const efficiencyScore = Math.min(30000 / searchTime, 1);

    return (insightsScore * 0.5) + (resultsScore * 0.3) + (efficiencyScore * 0.2);
  }

  private calculateCompletenessScore(session: ResearchSession, template: ResearchTemplate): number {
    const requiredFields = template.validationRules.filter(rule => rule.type === 'required');
    const providedFields = requiredFields.filter(rule => {
      const context = session.queries[0]?.context;
      const value = context ? (context as any)[rule.field] : undefined;
      return value !== undefined && value !== null && value !== '';
    });

    return providedFields.length / requiredFields.length;
  }

  getTemplateSuggestions(query: string): ResearchTemplate[] {
    const suggestions: ResearchTemplate[] = [];
    const queryLower = query.toLowerCase();

    // Simple keyword matching
    this.templates.forEach(template => {
      const templateText = `${template.name} ${template.description} ${template.category}`.toLowerCase();
      
      if (templateText.includes(queryLower) || 
          template.customFields.focusAreas?.some((area: string) => area.toLowerCase().includes(queryLower))) {
        suggestions.push(template);
      }
    });

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  exportTemplates(): string {
    const templates = Array.from(this.templates.values());
    return JSON.stringify(templates, null, 2);
  }

  importTemplates(templatesJson: string): void {
    try {
      const templates = JSON.parse(templatesJson);
      templates.forEach((template: ResearchTemplate) => {
        this.templates.set(template.id, template);
      });
      console.log(`✅ Imported ${templates.length} templates`);
    } catch (error) {
      console.error('❌ Failed to import templates:', error);
      throw error;
    }
  }
}

export default ResearchTemplateManager;
