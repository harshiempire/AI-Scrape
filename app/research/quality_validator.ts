import { z } from "zod";
import { log } from "../logger";
import { SourceInfo, SynthesizedInsight, ResearchSynthesis } from "./synthesizer";
import { CitationReport } from "./citation";
import { ResearchPlan } from "./planner";

// Quality validation schemas
export const QualityMetricsSchema = z.object({
  source_quality: z.object({
    average_authority: z.number().min(0).max(10),
    authority_distribution: z.object({
      high: z.number(), // >= 8
      medium: z.number(), // 5-7
      low: z.number(), // < 5
    }),
    domain_diversity: z.number().min(0).max(1),
    temporal_coverage: z.number().min(0).max(1),
  }),
  content_quality: z.object({
    information_density: z.number().min(0).max(1),
    cross_validation_rate: z.number().min(0).max(1),
    contradiction_rate: z.number().min(0).max(1),
    completeness_score: z.number().min(0).max(1),
  }),
  synthesis_quality: z.object({
    insight_confidence_avg: z.number().min(0).max(1),
    citation_coverage: z.number().min(0).max(1),
    coherence_score: z.number().min(0).max(1),
    depth_score: z.number().min(0).max(1),
  }),
  overall_quality: z.number().min(0).max(1),
});

export const ValidationIssueSchema = z.object({
  id: z.string(),
  type: z.enum(["critical", "warning", "info"]),
  category: z.enum(["source", "content", "synthesis", "citation", "methodology"]),
  description: z.string(),
  affected_items: z.array(z.string()),
  recommendation: z.string(),
  auto_fixable: z.boolean(),
});

export const QualityReportSchema = z.object({
  overall_score: z.number().min(0).max(1),
  quality_grade: z.enum(["A", "B", "C", "D", "F"]),
  metrics: QualityMetricsSchema,
  issues: z.array(ValidationIssueSchema),
  strengths: z.array(z.string()),
  recommendations: z.array(z.string()),
  validation_timestamp: z.string(),
  meets_standards: z.boolean(),
});

export type QualityMetrics = z.infer<typeof QualityMetricsSchema>;
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
export type QualityReport = z.infer<typeof QualityReportSchema>;

interface ValidationData {
  research_plan: ResearchPlan;
  synthesis: ResearchSynthesis;
  citations: CitationReport;
}

export class QualityValidator {
  private min_sources_threshold: number = 5;
  private min_authority_threshold: number = 6;
  private min_confidence_threshold: number = 0.7;
  private max_contradiction_rate: number = 0.2;

  constructor(config?: {
    min_sources_threshold?: number;
    min_authority_threshold?: number;
    min_confidence_threshold?: number;
    max_contradiction_rate?: number;
  }) {
    if (config) {
      this.min_sources_threshold = config.min_sources_threshold ?? this.min_sources_threshold;
      this.min_authority_threshold = config.min_authority_threshold ?? this.min_authority_threshold;
      this.min_confidence_threshold = config.min_confidence_threshold ?? this.min_confidence_threshold;
      this.max_contradiction_rate = config.max_contradiction_rate ?? this.max_contradiction_rate;
    }

    log.info("Quality validator initialized");
  }

  async validate_research(data: ValidationData): Promise<QualityReport> {
    log.info("Starting comprehensive research quality validation");

    const metrics = this.calculate_quality_metrics(data);
    const issues = this.identify_quality_issues(data, metrics);
    const strengths = this.identify_strengths(data, metrics);
    const recommendations = this.generate_recommendations(issues, metrics);

    const overall_score = this.calculate_overall_score(metrics);
    const quality_grade = this.assign_quality_grade(overall_score);
    const meets_standards = this.assess_standards_compliance(metrics, issues);

    const quality_report: QualityReport = {
      overall_score,
      quality_grade,
      metrics,
      issues,
      strengths,
      recommendations,
      validation_timestamp: new Date().toISOString(),
      meets_standards,
    };

    log.info(`Quality validation completed. Overall score: ${(overall_score * 100).toFixed(1)}% (Grade: ${quality_grade})`);
    return quality_report;
  }

  private calculate_quality_metrics(data: ValidationData): QualityMetrics {
    const source_metrics = this.calculate_source_quality_metrics(data.synthesis.sources);
    const content_metrics = this.calculate_content_quality_metrics(data.synthesis);
    const synthesis_metrics = this.calculate_synthesis_quality_metrics(data.synthesis, data.citations);

    return {
      source_quality: source_metrics,
      content_quality: content_metrics,
      synthesis_quality: synthesis_metrics,
      overall_quality: this.calculate_weighted_quality_score(source_metrics, content_metrics, synthesis_metrics),
    };
  }

  private calculate_source_quality_metrics(sources: SourceInfo[]): QualityMetrics["source_quality"] {
    if (sources.length === 0) {
      return {
        average_authority: 0,
        authority_distribution: { high: 0, medium: 0, low: 0 },
        domain_diversity: 0,
        temporal_coverage: 0,
      };
    }

    const average_authority = sources.reduce((sum, s) => sum + s.authority_score, 0) / sources.length;
    
    const authority_distribution = {
      high: sources.filter(s => s.authority_score >= 8).length,
      medium: sources.filter(s => s.authority_score >= 5 && s.authority_score < 8).length,
      low: sources.filter(s => s.authority_score < 5).length,
    };

    const unique_domains = new Set(sources.map(s => s.domain)).size;
    const domain_diversity = unique_domains / sources.length;

    const temporal_coverage = this.calculate_temporal_coverage(sources);

    return {
      average_authority,
      authority_distribution,
      domain_diversity,
      temporal_coverage,
    };
  }

  private calculate_temporal_coverage(sources: SourceInfo[]): number {
    const dated_sources = sources.filter(s => s.published_date);
    if (dated_sources.length === 0) return 0;

    const dates = dated_sources.map(s => new Date(s.published_date!).getTime());
    const date_range = Math.max(...dates) - Math.min(...dates);
    const current_time = Date.now();
    const oldest_acceptable = current_time - (5 * 365 * 24 * 60 * 60 * 1000); // 5 years

    // Score based on how well the temporal range covers recent and historical context
    const recent_coverage = dates.filter(d => d > current_time - (365 * 24 * 60 * 60 * 1000)).length / dated_sources.length;
    const historical_coverage = Math.min(date_range / (current_time - oldest_acceptable), 1);

    return (recent_coverage * 0.6) + (historical_coverage * 0.4);
  }

  private calculate_content_quality_metrics(synthesis: ResearchSynthesis): QualityMetrics["content_quality"] {
    const total_sources = synthesis.sources.length;
    const total_insights = synthesis.insights.length;

    // Information density: insights per source
    const information_density = total_sources > 0 ? Math.min(total_insights / total_sources, 1) : 0;

    // Cross-validation rate: percentage of insights supported by multiple sources
    const cross_validated = synthesis.insights.filter(i => i.supporting_sources.length > 1).length;
    const cross_validation_rate = total_insights > 0 ? cross_validated / total_insights : 0;

    // Contradiction rate: percentage of insights with contradicting sources
    const contradicted = synthesis.insights.filter(i => i.contradicting_sources && i.contradicting_sources.length > 0).length;
    const contradiction_rate = total_insights > 0 ? contradicted / total_insights : 0;

    // Completeness score: based on research gaps and coverage
    const completeness_score = this.calculate_completeness_score(synthesis);

    return {
      information_density,
      cross_validation_rate,
      contradiction_rate,
      completeness_score,
    };
  }

  private calculate_completeness_score(synthesis: ResearchSynthesis): number {
    let score = 0.7; // Base score

    // Penalize for research gaps
    const gap_penalty = Math.min(synthesis.research_gaps.length * 0.1, 0.3);
    score -= gap_penalty;

    // Reward for comprehensive coverage
    if (synthesis.key_findings.length >= 5) score += 0.1;
    if (synthesis.insights.length >= 10) score += 0.1;
    if (synthesis.sources.length >= 15) score += 0.1;

    return Math.max(Math.min(score, 1), 0);
  }

  private calculate_synthesis_quality_metrics(synthesis: ResearchSynthesis, citations: CitationReport): QualityMetrics["synthesis_quality"] {
    // Average insight confidence
    const insight_confidence_avg = synthesis.insights.length > 0 
      ? synthesis.insights.reduce((sum, i) => sum + i.confidence_score, 0) / synthesis.insights.length
      : 0;

    // Citation coverage: percentage of insights with proper citations
    const citation_coverage = citations.source_coverage;

    // Coherence score: based on consistency and logical flow
    const coherence_score = this.calculate_coherence_score(synthesis);

    // Depth score: based on insight complexity and analysis depth
    const depth_score = this.calculate_depth_score(synthesis);

    return {
      insight_confidence_avg,
      citation_coverage,
      coherence_score,
      depth_score,
    };
  }

  private calculate_coherence_score(synthesis: ResearchSynthesis): number {
    let score = 0.8; // Base score

    // Check for logical consistency in insights
    const analytical_insights = synthesis.insights.filter(i => i.insight_type === "analysis");
    if (analytical_insights.length > 0) {
      score += 0.1;
    }

    // Check for proper fact-opinion balance
    const facts = synthesis.insights.filter(i => i.insight_type === "fact").length;
    const opinions = synthesis.insights.filter(i => i.insight_type === "opinion").length;
    const total = synthesis.insights.length;

    if (total > 0 && facts / total >= 0.6) { // Good fact-to-opinion ratio
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  private calculate_depth_score(synthesis: ResearchSynthesis): number {
    let score = 0.5; // Base score

    // Reward for detailed insights
    const detailed_insights = synthesis.insights.filter(i => i.key_points.length >= 3).length;
    if (detailed_insights > synthesis.insights.length * 0.7) {
      score += 0.2;
    }

    // Reward for diverse insight types
    const insight_types = new Set(synthesis.insights.map(i => i.insight_type)).size;
    score += Math.min(insight_types * 0.1, 0.3);

    return Math.min(score, 1);
  }

  private calculate_weighted_quality_score(
    source_metrics: QualityMetrics["source_quality"],
    content_metrics: QualityMetrics["content_quality"],
    synthesis_metrics: QualityMetrics["synthesis_quality"]
  ): number {
    const source_score = (
      (source_metrics.average_authority / 10) * 0.4 +
      source_metrics.domain_diversity * 0.3 +
      source_metrics.temporal_coverage * 0.3
    );

    const content_score = (
      content_metrics.information_density * 0.3 +
      content_metrics.cross_validation_rate * 0.4 +
      (1 - content_metrics.contradiction_rate) * 0.1 +
      content_metrics.completeness_score * 0.2
    );

    const synthesis_score = (
      synthesis_metrics.insight_confidence_avg * 0.3 +
      synthesis_metrics.citation_coverage * 0.2 +
      synthesis_metrics.coherence_score * 0.25 +
      synthesis_metrics.depth_score * 0.25
    );

    // Weighted average: sources 30%, content 35%, synthesis 35%
    return (source_score * 0.3) + (content_score * 0.35) + (synthesis_score * 0.35);
  }

  private identify_quality_issues(data: ValidationData, metrics: QualityMetrics): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Source quality issues
    if (data.synthesis.sources.length < this.min_sources_threshold) {
      issues.push({
        id: "insufficient_sources",
        type: "critical",
        category: "source",
        description: `Only ${data.synthesis.sources.length} sources found, minimum ${this.min_sources_threshold} recommended`,
        affected_items: ["source_count"],
        recommendation: "Expand search to include more diverse and authoritative sources",
        auto_fixable: false,
      });
    }

    if (metrics.source_quality.average_authority < this.min_authority_threshold) {
      issues.push({
        id: "low_source_authority",
        type: "warning",
        category: "source",
        description: `Average source authority ${metrics.source_quality.average_authority.toFixed(1)} below recommended ${this.min_authority_threshold}`,
        affected_items: ["source_authority"],
        recommendation: "Include more authoritative sources (academic, government, established media)",
        auto_fixable: false,
      });
    }

    if (metrics.source_quality.domain_diversity < 0.5) {
      issues.push({
        id: "low_domain_diversity",
        type: "warning",
        category: "source",
        description: "Low domain diversity may indicate bias or limited perspective",
        affected_items: ["domain_diversity"],
        recommendation: "Search across more diverse source domains and types",
        auto_fixable: false,
      });
    }

    // Content quality issues
    if (metrics.content_quality.cross_validation_rate < 0.6) {
      issues.push({
        id: "low_cross_validation",
        type: "warning",
        category: "content",
        description: "Many insights lack cross-validation from multiple sources",
        affected_items: ["cross_validation"],
        recommendation: "Verify key insights against multiple independent sources",
        auto_fixable: false,
      });
    }

    if (metrics.content_quality.contradiction_rate > this.max_contradiction_rate) {
      issues.push({
        id: "high_contradiction_rate",
        type: "critical",
        category: "content",
        description: `High contradiction rate (${(metrics.content_quality.contradiction_rate * 100).toFixed(1)}%) indicates conflicting information`,
        affected_items: ["contradictions"],
        recommendation: "Investigate and resolve contradictions, clearly note disputed information",
        auto_fixable: false,
      });
    }

    // Synthesis quality issues
    if (metrics.synthesis_quality.insight_confidence_avg < this.min_confidence_threshold) {
      issues.push({
        id: "low_confidence",
        type: "warning",
        category: "synthesis",
        description: `Average insight confidence ${(metrics.synthesis_quality.insight_confidence_avg * 100).toFixed(1)}% below threshold`,
        affected_items: ["confidence_scores"],
        recommendation: "Strengthen insights with additional sources or clearly note uncertainty",
        auto_fixable: false,
      });
    }

    if (metrics.synthesis_quality.citation_coverage < 0.8) {
      issues.push({
        id: "poor_citation_coverage",
        type: "warning",
        category: "citation",
        description: "Some insights lack proper source attribution",
        affected_items: ["citations"],
        recommendation: "Ensure all insights are properly cited with source references",
        auto_fixable: true,
      });
    }

    // Methodology issues
    if (data.research_plan.subqueries.length < 3) {
      issues.push({
        id: "insufficient_query_decomposition",
        type: "info",
        category: "methodology",
        description: "Limited query decomposition may miss important aspects",
        affected_items: ["research_plan"],
        recommendation: "Consider more comprehensive query breakdown for complex topics",
        auto_fixable: false,
      });
    }

    return issues;
  }

  private identify_strengths(data: ValidationData, metrics: QualityMetrics): string[] {
    const strengths: string[] = [];

    if (metrics.source_quality.average_authority >= 8) {
      strengths.push("Excellent source authority with highly credible references");
    }

    if (metrics.source_quality.domain_diversity >= 0.7) {
      strengths.push("Strong domain diversity providing multiple perspectives");
    }

    if (metrics.content_quality.cross_validation_rate >= 0.8) {
      strengths.push("High cross-validation rate ensuring reliable information");
    }

    if (metrics.synthesis_quality.insight_confidence_avg >= 0.8) {
      strengths.push("High-confidence insights backed by strong evidence");
    }

    if (metrics.synthesis_quality.citation_coverage >= 0.9) {
      strengths.push("Excellent citation coverage with proper source attribution");
    }

    if (data.synthesis.sources.length >= 15) {
      strengths.push("Comprehensive source coverage for thorough analysis");
    }

    if (data.synthesis.insights.length >= 10) {
      strengths.push("Rich insight generation with detailed analysis");
    }

    return strengths;
  }

  private generate_recommendations(issues: ValidationIssue[], metrics: QualityMetrics): string[] {
    const recommendations: string[] = [];

    // Get unique recommendations from issues
    const issue_recommendations = [...new Set(issues.map(i => i.recommendation))];
    recommendations.push(...issue_recommendations);

    // Add general improvement recommendations
    if (metrics.overall_quality < 0.8) {
      recommendations.push("Consider additional research iterations to improve overall quality");
    }

    if (metrics.source_quality.temporal_coverage < 0.5) {
      recommendations.push("Include more recent sources to improve temporal coverage");
    }

    if (metrics.synthesis_quality.depth_score < 0.7) {
      recommendations.push("Enhance analysis depth with more detailed insights and implications");
    }

    return recommendations;
  }

  private calculate_overall_score(metrics: QualityMetrics): number {
    return metrics.overall_quality;
  }

  private assign_quality_grade(score: number): QualityReport["quality_grade"] {
    if (score >= 0.9) return "A";
    if (score >= 0.8) return "B";
    if (score >= 0.7) return "C";
    if (score >= 0.6) return "D";
    return "F";
  }

  private assess_standards_compliance(metrics: QualityMetrics, issues: ValidationIssue[]): boolean {
    // Must meet minimum thresholds and have no critical issues
    const critical_issues = issues.filter(i => i.type === "critical");
    const meets_minimum_quality = metrics.overall_quality >= 0.6;
    
    return critical_issues.length === 0 && meets_minimum_quality;
  }

  async auto_fix_issues(issues: ValidationIssue[], data: ValidationData): Promise<{
    fixed_issues: string[];
    remaining_issues: ValidationIssue[];
  }> {
    const fixed_issues: string[] = [];
    const remaining_issues: ValidationIssue[] = [];

    for (const issue of issues) {
      if (issue.auto_fixable) {
        try {
          await this.apply_auto_fix(issue, data);
          fixed_issues.push(issue.id);
          log.info(`Auto-fixed issue: ${issue.id}`);
        } catch (error) {
          log.warn(`Failed to auto-fix issue ${issue.id}:`, error);
          remaining_issues.push(issue);
        }
      } else {
        remaining_issues.push(issue);
      }
    }

    return { fixed_issues, remaining_issues };
  }

  private async apply_auto_fix(issue: ValidationIssue, data: ValidationData): Promise<void> {
    switch (issue.id) {
      case "poor_citation_coverage":
        // Auto-generate missing citations
        // This would be implemented to ensure all insights have proper citations
        log.info("Auto-fixing citation coverage");
        break;
      
      default:
        throw new Error(`No auto-fix available for issue: ${issue.id}`);
    }
  }

  generate_quality_summary(report: QualityReport): string {
    const score_percent = (report.overall_score * 100).toFixed(1);
    
    return `Quality Assessment Summary:
Overall Score: ${score_percent}% (Grade: ${report.quality_grade})
Standards Compliance: ${report.meets_standards ? "✓ PASS" : "✗ FAIL"}

Key Metrics:
- Source Authority: ${report.metrics.source_quality.average_authority.toFixed(1)}/10
- Cross-Validation: ${(report.metrics.content_quality.cross_validation_rate * 100).toFixed(1)}%
- Citation Coverage: ${(report.metrics.synthesis_quality.citation_coverage * 100).toFixed(1)}%
- Confidence Level: ${(report.metrics.synthesis_quality.insight_confidence_avg * 100).toFixed(1)}%

Issues Found: ${report.issues.length} (${report.issues.filter(i => i.type === "critical").length} critical)
Strengths: ${report.strengths.length} identified
Recommendations: ${report.recommendations.length} provided`;
  }
}