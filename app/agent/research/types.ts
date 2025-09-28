import { z } from "zod";

// Research stages enum
export enum ResearchStage {
  QUERY_PLANNING = "query_planning",
  INFORMATION_GATHERING = "information_gathering",
  FACT_VERIFICATION = "fact_verification",
  SYNTHESIS = "synthesis",
  REPORT_GENERATION = "report_generation"
}

// Search result schema
export const SearchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  timestamp: z.string().optional(),
  relevance_score: z.number().optional()
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

// Research query schema
export const ResearchQuerySchema = z.object({
  main_query: z.string(),
  sub_queries: z.array(z.string()),
  context: z.string().optional(),
  max_results: z.number().default(10),
  depth: z.enum(["shallow", "medium", "deep"]).default("medium")
});

export type ResearchQuery = z.infer<typeof ResearchQuerySchema>;

// Source credibility schema
export const SourceCredibilitySchema = z.object({
  url: z.string(),
  credibility_score: z.number().min(0).max(1),
  factors: z.object({
    domain_authority: z.number().optional(),
    content_quality: z.number().optional(),
    recency: z.number().optional(),
    citations: z.number().optional()
  })
});

export type SourceCredibility = z.infer<typeof SourceCredibilitySchema>;

// Fact schema
export const FactSchema = z.object({
  statement: z.string(),
  sources: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  verification_status: z.enum(["verified", "unverified", "disputed"]),
  supporting_evidence: z.array(z.string())
});

export type Fact = z.infer<typeof FactSchema>;

// Research finding schema
export const ResearchFindingSchema = z.object({
  topic: z.string(),
  summary: z.string(),
  facts: z.array(FactSchema),
  sources: z.array(SearchResultSchema),
  credibility_scores: z.array(SourceCredibilitySchema),
  timestamp: z.string()
});

export type ResearchFinding = z.infer<typeof ResearchFindingSchema>;

// Research report schema
export const ResearchReportSchema = z.object({
  title: z.string(),
  executive_summary: z.string(),
  query: ResearchQuerySchema,
  findings: z.array(ResearchFindingSchema),
  methodology: z.string(),
  limitations: z.array(z.string()),
  recommendations: z.array(z.string()).optional(),
  citations: z.array(z.object({
    id: z.string(),
    text: z.string(),
    url: z.string(),
    access_date: z.string()
  })),
  generated_at: z.string()
});

export type ResearchReport = z.infer<typeof ResearchReportSchema>;

// Research agent state
export interface ResearchAgentState {
  current_stage: ResearchStage;
  query: ResearchQuery | null;
  search_results: SearchResult[];
  verified_facts: Fact[];
  findings: ResearchFinding[];
  report: ResearchReport | null;
}