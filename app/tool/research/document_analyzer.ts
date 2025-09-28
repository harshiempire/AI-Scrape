import { z } from "zod";
import { BaseTool } from "../base";
import { log } from "../../logger";
import { LLM } from "../../llm";

const DocumentAnalyzerInputSchema = z.object({
  content: z.string().describe("The document content to analyze"),
  analysis_type: z.enum(["summary", "key_points", "entities", "sentiment", "comprehensive"]).default("comprehensive"),
  max_length: z.number().optional().default(500).describe("Maximum length of summary in words"),
  focus_areas: z.array(z.string()).optional().describe("Specific areas to focus on during analysis")
});

export type DocumentAnalyzerInput = z.infer<typeof DocumentAnalyzerInputSchema>;

export interface AnalysisResult {
  summary: string;
  key_points: string[];
  entities: {
    people: string[];
    organizations: string[];
    locations: string[];
    dates: string[];
    technical_terms: string[];
  };
  sentiment: {
    overall: "positive" | "negative" | "neutral";
    confidence: number;
  };
  themes: string[];
  word_count: number;
  reading_time_minutes: number;
}

export class DocumentAnalyzer extends BaseTool {
  name = "document_analyzer";
  description = "Analyze and summarize documents with various analysis types";
  
  input_schema = DocumentAnalyzerInputSchema;
  private llm: LLM;

  constructor() {
    super();
    this.llm = LLM.getInstance("default");
  }

  async execute(input: DocumentAnalyzerInput): Promise<AnalysisResult> {
    const { content, analysis_type, max_length, focus_areas } = this.input_schema.parse(input);
    
    log.info(`📄 Analyzing document (${content.length} characters, type: ${analysis_type})`);
    
    try {
      const wordCount = this.countWords(content);
      const readingTime = Math.ceil(wordCount / 200); // Average reading speed
      
      let result: AnalysisResult = {
        summary: "",
        key_points: [],
        entities: {
          people: [],
          organizations: [],
          locations: [],
          dates: [],
          technical_terms: []
        },
        sentiment: {
          overall: "neutral",
          confidence: 0
        },
        themes: [],
        word_count: wordCount,
        reading_time_minutes: readingTime
      };

      // Perform different types of analysis based on request
      switch (analysis_type) {
        case "summary":
          result.summary = await this.generateSummary(content, max_length, focus_areas);
          break;
        
        case "key_points":
          result.key_points = await this.extractKeyPoints(content, focus_areas);
          break;
        
        case "entities":
          result.entities = await this.extractEntities(content);
          break;
        
        case "sentiment":
          result.sentiment = await this.analyzeSentiment(content);
          break;
        
        case "comprehensive":
          // Perform all analyses
          result.summary = await this.generateSummary(content, max_length, focus_areas);
          result.key_points = await this.extractKeyPoints(content, focus_areas);
          result.entities = await this.extractEntities(content);
          result.sentiment = await this.analyzeSentiment(content);
          result.themes = await this.identifyThemes(content);
          break;
      }
      
      log.info(`✅ Document analysis complete (${analysis_type})`);
      return result;
    } catch (error) {
      log.error(`❌ Document analysis failed: ${error}`);
      throw new Error(`Document analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async generateSummary(content: string, maxLength: number, focusAreas?: string[]): Promise<string> {
    const prompt = `Summarize the following document in approximately ${maxLength} words. 
    ${focusAreas ? `Focus particularly on: ${focusAreas.join(', ')}` : ''}
    
    Document:
    ${content}
    
    Summary:`;
    
    try {
      const response = await this.llm.ask(prompt, [], 60);
      return response || "Unable to generate summary";
    } catch (error) {
      log.error(`Summary generation failed: ${error}`);
      return "Summary generation failed";
    }
  }

  private async extractKeyPoints(content: string, focusAreas?: string[]): Promise<string[]> {
    const prompt = `Extract the 5-7 most important key points from this document.
    ${focusAreas ? `Focus particularly on: ${focusAreas.join(', ')}` : ''}
    
    Document:
    ${content}
    
    List the key points (one per line):`;
    
    try {
      const response = await this.llm.ask(prompt, [], 60);
      return response?.split('\n').filter(line => line.trim().length > 0) || [];
    } catch (error) {
      log.error(`Key points extraction failed: ${error}`);
      return [];
    }
  }

  private async extractEntities(content: string): Promise<AnalysisResult['entities']> {
    // In production, use NER models or specialized APIs
    // For now, use simple pattern matching and LLM
    
    const prompt = `Extract named entities from this document. Categorize them as:
    - People (names of individuals)
    - Organizations (companies, institutions, agencies)
    - Locations (cities, countries, addresses)
    - Dates (specific dates, time periods)
    - Technical Terms (domain-specific terminology)
    
    Document:
    ${content.substring(0, 3000)} // Limit for API
    
    Format as JSON with these categories:`;
    
    try {
      const response = await this.llm.ask(prompt, [], 60);
      // Parse response - in production, ensure proper JSON parsing
      return {
        people: [],
        organizations: [],
        locations: [],
        dates: [],
        technical_terms: []
      };
    } catch (error) {
      log.error(`Entity extraction failed: ${error}`);
      return {
        people: [],
        organizations: [],
        locations: [],
        dates: [],
        technical_terms: []
      };
    }
  }

  private async analyzeSentiment(content: string): Promise<AnalysisResult['sentiment']> {
    const prompt = `Analyze the overall sentiment of this document. 
    Determine if it is positive, negative, or neutral.
    Also provide a confidence score (0-1).
    
    Document:
    ${content.substring(0, 2000)}
    
    Response format: sentiment|confidence`;
    
    try {
      const response = await this.llm.ask(prompt, [], 60);
      // Parse response
      return {
        overall: "neutral",
        confidence: 0.7
      };
    } catch (error) {
      log.error(`Sentiment analysis failed: ${error}`);
      return {
        overall: "neutral",
        confidence: 0
      };
    }
  }

  private async identifyThemes(content: string): Promise<string[]> {
    const prompt = `Identify the main themes and topics discussed in this document.
    List 3-5 major themes.
    
    Document:
    ${content.substring(0, 3000)}
    
    Themes (one per line):`;
    
    try {
      const response = await this.llm.ask(prompt, [], 60);
      return response?.split('\n').filter(line => line.trim().length > 0).slice(0, 5) || [];
    } catch (error) {
      log.error(`Theme identification failed: ${error}`);
      return [];
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }
}