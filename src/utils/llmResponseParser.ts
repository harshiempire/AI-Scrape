// src/utils/llmResponseParser.ts
import { z } from 'zod';

// Define strict schemas for LLM responses
export const AnalysisResultSchema = z.object({
  insights: z.array(z.object({
    content: z.string(),
    type: z.enum(['finding', 'pattern', 'trend', 'contradiction', 'recommendation']),
    confidence: z.number().min(0).max(1),
    tags: z.array(z.string()),
    sources: z.array(z.string()),
    evidence: z.array(z.object({
      source: z.string(),
      content: z.string(),
      relevance: z.number().min(0).max(1),
      credibility: z.number().min(0).max(1)
    })).optional()
  })).default([]),
  patterns: z.array(z.object({
    description: z.string(),
    significance: z.enum(['low', 'medium', 'high']),
    confidence: z.number().min(0).max(1),
    frequency: z.number().min(0)
  })).default([]),
  trends: z.array(z.object({
    description: z.string(),
    direction: z.enum(['increasing', 'decreasing', 'stable', 'fluctuating']),
    confidence: z.number().min(0).max(1),
    timeframe: z.string()
  })).default([]),
  contradictions: z.array(z.object({
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    confidence: z.number().min(0).max(1),
    resolution: z.string().optional()
  })).default([]),
  topics: z.array(z.object({
    name: z.string(),
    frequency: z.number().min(0),
    relevance: z.number().min(0).max(1)
  })).default([]),
  entities: z.array(z.object({
    name: z.string(),
    type: z.string(),
    mentions: z.number().min(0),
    relevance: z.number().min(0).max(1)
  })).default([]),
  metadata: z.object({
    confidence: z.number().min(0).max(1).default(0.5),
    processingTime: z.number().min(0).default(0),
    sourcesAnalyzed: z.number().min(0).default(0)
  }).default({
    confidence: 0.5,
    processingTime: 0,
    sourcesAnalyzed: 0
  })
});

export const SynthesisResultSchema = z.object({
  executiveSummary: z.string(),
  keyFindings: z.array(z.object({
    title: z.string(),
    description: z.string(),
    confidence: z.number().min(0).max(1),
    evidence: z.array(z.object({
      source: z.string(),
      content: z.string(),
      relevance: z.number().min(0).max(1),
      credibility: z.number().min(0).max(1)
    }))
  })).default([]),
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    rationale: z.string(),
    implementation: z.array(z.string()),
    expectedOutcome: z.string(),
    confidence: z.number().min(0).max(1)
  })).default([]),
  conclusions: z.array(z.object({
    statement: z.string(),
    confidence: z.number().min(0).max(1),
    supportingEvidence: z.array(z.object({
      source: z.string(),
      content: z.string(),
      relevance: z.number().min(0).max(1),
      credibility: z.number().min(0).max(1)
    })),
    limitations: z.array(z.string()),
    futureResearch: z.array(z.string())
  })).default([])
});

export class LLMResponseParser {
  /**
   * Parse and validate LLM response for analysis results
   */
  static parseAnalysisResult(rawResponse: string, fallbackData: any = {}): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return AnalysisResultSchema.parse(parsed);
      }
    } catch (error) {
      console.warn('Failed to parse LLM response as JSON:', error);
    }

    // Fallback: create structured response from text
    return this.createFallbackAnalysisResult(rawResponse, fallbackData);
  }

  /**
   * Parse and validate LLM response for synthesis results
   */
  static parseSynthesisResult(rawResponse: string, fallbackData: any = {}): any {
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return SynthesisResultSchema.parse(parsed);
      }
    } catch (error) {
      console.warn('Failed to parse LLM response as JSON:', error);
    }

    // Fallback: create structured response from text
    return this.createFallbackSynthesisResult(rawResponse, fallbackData);
  }

  /**
   * Create fallback analysis result from text response
   */
  private static createFallbackAnalysisResult(text: string, fallbackData: any): any {
    return AnalysisResultSchema.parse({
      insights: fallbackData.insights || [{
        content: text.substring(0, 200) + '...',
        type: 'finding',
        confidence: 0.7,
        tags: ['analysis'],
        sources: ['llm_response'],
        evidence: []
      }],
      patterns: fallbackData.patterns || [],
      trends: fallbackData.trends || [],
      contradictions: fallbackData.contradictions || [],
      topics: fallbackData.topics || [],
      entities: fallbackData.entities || [],
      metadata: {
        confidence: 0.7,
        processingTime: 0,
        sourcesAnalyzed: 1,
        ...fallbackData.metadata
      }
    });
  }

  /**
   * Create fallback synthesis result from text response
   */
  private static createFallbackSynthesisResult(text: string, fallbackData: any): any {
    return SynthesisResultSchema.parse({
      executiveSummary: text.substring(0, 500) + '...',
      keyFindings: fallbackData.keyFindings || [{
        title: 'Key Finding',
        description: text.substring(0, 200) + '...',
        confidence: 0.7,
        evidence: []
      }],
      recommendations: fallbackData.recommendations || [],
      conclusions: fallbackData.conclusions || [{
        statement: text.substring(0, 300) + '...',
        confidence: 0.7,
        supportingEvidence: [],
        limitations: ['Analysis based on limited data'],
        futureResearch: ['Conduct additional research']
      }]
    });
  }

  /**
   * Validate and sanitize any object against a schema
   */
  static validateAndSanitize<T>(data: any, schema: z.ZodSchema<T>): T {
    try {
      // If data is a string, try to parse it as JSON first
      let parsedData = data;
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch (jsonError) {
          console.warn('Failed to parse JSON string:', jsonError);
          // If JSON parsing fails, return appropriate default
          if (schema instanceof z.ZodArray) {
            return [] as T;
          }
          return undefined as T;
        }
      }
      
      return schema.parse(parsedData);
    } catch (error) {
      console.warn('Data validation failed, using defaults:', error);
      // Return appropriate default based on schema type
      if (schema instanceof z.ZodArray) {
        return [] as T;
      }
      // For other schemas, try to parse an empty object or return undefined
      try {
        return schema.parse({});
      } catch {
        return undefined as T;
      }
    }
  }
}

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type SynthesisResult = z.infer<typeof SynthesisResultSchema>;
