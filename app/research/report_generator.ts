import { z } from "zod";
import { log } from "../logger";
import { ResearchSynthesis } from "./synthesizer";
import { CitationReport } from "./citation";
import { ResearchPlan } from "./planner";

// Report generation schemas
export const ReportConfigSchema = z.object({
  format: z.enum(["json", "markdown", "html", "csv", "pdf"]),
  include_citations: z.boolean().default(true),
  include_methodology: z.boolean().default(true),
  include_confidence_scores: z.boolean().default(true),
  include_source_analysis: z.boolean().default(true),
  citation_style: z.enum(["apa", "mla", "chicago", "ieee"]).default("apa"),
  executive_summary_length: z.enum(["short", "medium", "long"]).default("medium"),
  detail_level: z.enum(["summary", "detailed", "comprehensive"]).default("detailed"),
});

export const GeneratedReportSchema = z.object({
  title: z.string(),
  query: z.string(),
  format: z.string(),
  content: z.string(),
  metadata: z.object({
    generation_timestamp: z.string(),
    word_count: z.number(),
    page_count: z.number().optional(),
    total_sources: z.number(),
    confidence_score: z.number(),
    processing_time: z.number(),
  }),
  sections: z.array(z.object({
    title: z.string(),
    content: z.string(),
    word_count: z.number(),
  })),
});

export type ReportConfig = z.infer<typeof ReportConfigSchema>;
export type GeneratedReport = z.infer<typeof GeneratedReportSchema>;

interface ReportData {
  research_plan: ResearchPlan;
  synthesis: ResearchSynthesis;
  citations: CitationReport;
}

export class ReportGenerator {
  constructor() {
    log.info("Report generator initialized");
  }

  async generate_report(data: ReportData, config: ReportConfig): Promise<GeneratedReport> {
    log.info(`Generating ${config.format} report for query: "${data.synthesis.query}"`);
    const start_time = Date.now();

    try {
      let content: string;
      let sections: GeneratedReport["sections"];

      switch (config.format) {
        case "json":
          content = this.generate_json_report(data, config);
          sections = this.extract_json_sections(data);
          break;
        case "markdown":
          content = this.generate_markdown_report(data, config);
          sections = this.extract_markdown_sections(data, config);
          break;
        case "html":
          content = this.generate_html_report(data, config);
          sections = this.extract_html_sections(data, config);
          break;
        case "csv":
          content = this.generate_csv_report(data, config);
          sections = this.extract_csv_sections(data);
          break;
        default:
          throw new Error(`Unsupported format: ${config.format}`);
      }

      const processing_time = (Date.now() - start_time) / 1000;
      const word_count = this.count_words(content);

      const report: GeneratedReport = {
        title: `Deep Research Report: ${data.synthesis.query}`,
        query: data.synthesis.query,
        format: config.format,
        content,
        metadata: {
          generation_timestamp: new Date().toISOString(),
          word_count,
          total_sources: data.citations.total_sources,
          confidence_score: data.synthesis.confidence_assessment.overall_confidence,
          processing_time,
        },
        sections,
      };

      log.info(`Report generated successfully in ${processing_time.toFixed(2)}s`);
      return report;

    } catch (error) {
      log.error("Report generation failed:", error);
      throw new Error(`Report generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private generate_json_report(data: ReportData, config: ReportConfig): string {
    const report_data = {
      research_query: data.synthesis.query,
      generation_info: {
        timestamp: new Date().toISOString(),
        configuration: config,
      },
      research_plan: config.include_methodology ? data.research_plan : undefined,
      executive_summary: data.synthesis.executive_summary,
      key_findings: data.synthesis.key_findings,
      detailed_insights: data.synthesis.insights,
      confidence_assessment: config.include_confidence_scores ? data.synthesis.confidence_assessment : undefined,
      sources: data.synthesis.sources,
      citations: config.include_citations ? data.citations : undefined,
      research_gaps: data.synthesis.research_gaps,
      recommendations: data.synthesis.recommendations,
      source_analysis: config.include_source_analysis ? this.generate_source_analysis(data) : undefined,
    };

    return JSON.stringify(report_data, null, 2);
  }

  private generate_markdown_report(data: ReportData, config: ReportConfig): string {
    let markdown = `# Deep Research Report: ${data.synthesis.query}\n\n`;
    
    // Metadata
    markdown += `**Generated:** ${new Date().toISOString()}\n`;
    markdown += `**Total Sources:** ${data.citations.total_sources}\n`;
    markdown += `**Overall Confidence:** ${(data.synthesis.confidence_assessment.overall_confidence * 100).toFixed(1)}%\n\n`;

    // Executive Summary
    markdown += `## Executive Summary\n\n`;
    markdown += `${data.synthesis.executive_summary}\n\n`;

    // Key Findings
    markdown += `## Key Findings\n\n`;
    data.synthesis.key_findings.forEach((finding, index) => {
      markdown += `${index + 1}. ${finding}\n`;
    });
    markdown += `\n`;

    // Detailed Analysis
    markdown += `## Detailed Analysis\n\n`;
    data.synthesis.insights.forEach((insight, index) => {
      markdown += `### ${insight.insight_type.charAt(0).toUpperCase() + insight.insight_type.slice(1)} ${index + 1}\n\n`;
      markdown += `${insight.content}\n\n`;
      
      if (config.include_confidence_scores) {
        markdown += `**Confidence Score:** ${(insight.confidence_score * 100).toFixed(1)}%\n\n`;
      }

      markdown += `**Key Points:**\n`;
      insight.key_points.forEach(point => {
        markdown += `- ${point}\n`;
      });
      markdown += `\n`;

      if (config.include_citations && insight.supporting_sources.length > 0) {
        markdown += `**Sources:** `;
        const source_citations = insight.supporting_sources.map(id => {
          const source = data.synthesis.sources.find(s => s.id === id);
          return source ? `[${source.title}](${source.url})` : id;
        });
        markdown += source_citations.join(", ") + `\n\n`;
      }
    });

    // Methodology
    if (config.include_methodology) {
      markdown += `## Research Methodology\n\n`;
      markdown += `**Research Strategy:** ${data.research_plan.search_strategy}\n\n`;
      markdown += `**Subqueries Analyzed:**\n`;
      data.research_plan.subqueries.forEach((sq, index) => {
        markdown += `${index + 1}. ${sq.query} (Priority: ${sq.priority}/10, Complexity: ${sq.estimated_complexity}/5)\n`;
      });
      markdown += `\n`;
    }

    // Confidence Assessment
    if (config.include_confidence_scores) {
      markdown += `## Confidence Assessment\n\n`;
      const ca = data.synthesis.confidence_assessment;
      markdown += `- **Overall Confidence:** ${(ca.overall_confidence * 100).toFixed(1)}%\n`;
      markdown += `- **Data Quality:** ${(ca.data_quality * 100).toFixed(1)}%\n`;
      markdown += `- **Source Diversity:** ${(ca.source_diversity * 100).toFixed(1)}%\n`;
      markdown += `- **Information Completeness:** ${(ca.information_completeness * 100).toFixed(1)}%\n\n`;
    }

    // Research Gaps
    if (data.synthesis.research_gaps.length > 0) {
      markdown += `## Research Gaps\n\n`;
      data.synthesis.research_gaps.forEach(gap => {
        markdown += `- ${gap}\n`;
      });
      markdown += `\n`;
    }

    // Recommendations
    markdown += `## Recommendations\n\n`;
    data.synthesis.recommendations.forEach((rec, index) => {
      markdown += `${index + 1}. ${rec}\n`;
    });
    markdown += `\n`;

    // Sources and Citations
    if (config.include_citations) {
      markdown += `## Sources\n\n`;
      const citation_style = config.citation_style;
      const formatted_citations = data.citations.citation_styles[citation_style];
      
      formatted_citations.forEach((citation, index) => {
        markdown += `${index + 1}. ${citation}\n`;
      });
    }

    return markdown;
  }

  private generate_html_report(data: ReportData, config: ReportConfig): string {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deep Research Report: ${data.synthesis.query}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #007acc; padding-bottom: 20px; margin-bottom: 30px; }
        .metadata { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
        .confidence-score { display: inline-block; background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.9em; }
        .insight { background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .insight-header { color: #007acc; font-size: 1.2em; font-weight: bold; margin-bottom: 10px; }
        .key-points { background: #f8f9fa; padding: 10px; border-left: 4px solid #007acc; margin: 10px 0; }
        .sources { font-size: 0.9em; color: #666; margin-top: 10px; }
        .citation { margin-bottom: 8px; padding-left: 20px; text-indent: -20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
    </style>
</head>
<body>`;

    html += `<div class="header">
        <h1>Deep Research Report: ${data.synthesis.query}</h1>
        <div class="metadata">
            <strong>Generated:</strong> ${new Date().toISOString()}<br>
            <strong>Total Sources:</strong> ${data.citations.total_sources}<br>
            <strong>Overall Confidence:</strong> <span class="confidence-score">${(data.synthesis.confidence_assessment.overall_confidence * 100).toFixed(1)}%</span>
        </div>
    </div>`;

    html += `<section>
        <h2>Executive Summary</h2>
        <p>${data.synthesis.executive_summary}</p>
    </section>`;

    html += `<section>
        <h2>Key Findings</h2>
        <ol>`;
    data.synthesis.key_findings.forEach(finding => {
      html += `<li>${finding}</li>`;
    });
    html += `</ol></section>`;

    html += `<section>
        <h2>Detailed Analysis</h2>`;
    data.synthesis.insights.forEach((insight, index) => {
      html += `<div class="insight">
            <div class="insight-header">${insight.insight_type.charAt(0).toUpperCase() + insight.insight_type.slice(1)} ${index + 1}</div>
            <p>${insight.content}</p>`;
      
      if (config.include_confidence_scores) {
        html += `<p><strong>Confidence Score:</strong> <span class="confidence-score">${(insight.confidence_score * 100).toFixed(1)}%</span></p>`;
      }

      html += `<div class="key-points">
            <strong>Key Points:</strong>
            <ul>`;
      insight.key_points.forEach(point => {
        html += `<li>${point}</li>`;
      });
      html += `</ul></div>`;

      if (config.include_citations && insight.supporting_sources.length > 0) {
        html += `<div class="sources"><strong>Sources:</strong> `;
        const source_links = insight.supporting_sources.map(id => {
          const source = data.synthesis.sources.find(s => s.id === id);
          return source ? `<a href="${source.url}" target="_blank">${source.title}</a>` : id;
        });
        html += source_links.join(", ") + `</div>`;
      }

      html += `</div>`;
    });
    html += `</section>`;

    if (config.include_citations) {
      html += `<section>
        <h2>Sources</h2>`;
      const formatted_citations = data.citations.citation_styles[config.citation_style];
      formatted_citations.forEach((citation, index) => {
        html += `<div class="citation">${index + 1}. ${citation}</div>`;
      });
      html += `</section>`;
    }

    html += `</body></html>`;
    return html;
  }

  private generate_csv_report(data: ReportData, config: ReportConfig): string {
    const headers = [
      "Insight_ID",
      "Insight_Type",
      "Content",
      "Confidence_Score",
      "Supporting_Sources",
      "Key_Points",
      "Related_Topics"
    ];

    let csv = headers.join(",") + "\n";

    data.synthesis.insights.forEach(insight => {
      const row = [
        `"${insight.id}"`,
        `"${insight.insight_type}"`,
        `"${insight.content.replace(/"/g, '""')}"`,
        insight.confidence_score.toString(),
        `"${insight.supporting_sources.join("; ")}"`,
        `"${insight.key_points.join("; ")}"`,
        `"${insight.related_topics.join("; ")}"`,
      ];
      csv += row.join(",") + "\n";
    });

    return csv;
  }

  private generate_source_analysis(data: ReportData): any {
    const sources = data.synthesis.sources;
    
    return {
      total_sources: sources.length,
      authority_distribution: {
        high_authority: sources.filter(s => s.authority_score >= 8).length,
        medium_authority: sources.filter(s => s.authority_score >= 5 && s.authority_score < 8).length,
        low_authority: sources.filter(s => s.authority_score < 5).length,
      },
      content_type_distribution: sources.reduce((acc, source) => {
        acc[source.content_type] = (acc[source.content_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      domain_diversity: [...new Set(sources.map(s => s.domain))].length,
      temporal_coverage: {
        recent: sources.filter(s => s.published_date && new Date(s.published_date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)).length,
        older: sources.filter(s => s.published_date && new Date(s.published_date) <= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)).length,
        undated: sources.filter(s => !s.published_date).length,
      },
    };
  }

  private extract_json_sections(data: ReportData): GeneratedReport["sections"] {
    return [
      {
        title: "Executive Summary",
        content: data.synthesis.executive_summary,
        word_count: this.count_words(data.synthesis.executive_summary),
      },
      {
        title: "Key Findings",
        content: data.synthesis.key_findings.join("\n"),
        word_count: this.count_words(data.synthesis.key_findings.join(" ")),
      },
      {
        title: "Detailed Insights",
        content: JSON.stringify(data.synthesis.insights, null, 2),
        word_count: data.synthesis.insights.reduce((sum, insight) => sum + this.count_words(insight.content), 0),
      },
    ];
  }

  private extract_markdown_sections(data: ReportData, config: ReportConfig): GeneratedReport["sections"] {
    const sections: GeneratedReport["sections"] = [
      {
        title: "Executive Summary",
        content: data.synthesis.executive_summary,
        word_count: this.count_words(data.synthesis.executive_summary),
      },
      {
        title: "Key Findings",
        content: data.synthesis.key_findings.map((f, i) => `${i + 1}. ${f}`).join("\n"),
        word_count: this.count_words(data.synthesis.key_findings.join(" ")),
      },
    ];

    data.synthesis.insights.forEach((insight, index) => {
      sections.push({
        title: `${insight.insight_type.charAt(0).toUpperCase() + insight.insight_type.slice(1)} ${index + 1}`,
        content: insight.content,
        word_count: this.count_words(insight.content),
      });
    });

    return sections;
  }

  private extract_html_sections(data: ReportData, config: ReportConfig): GeneratedReport["sections"] {
    // Similar to markdown but with HTML formatting
    return this.extract_markdown_sections(data, config);
  }

  private extract_csv_sections(data: ReportData): GeneratedReport["sections"] {
    return [
      {
        title: "Insights Data",
        content: `${data.synthesis.insights.length} insights exported`,
        word_count: 0,
      },
    ];
  }

  private count_words(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  async generate_multiple_formats(data: ReportData, formats: ReportConfig["format"][]): Promise<GeneratedReport[]> {
    const reports: GeneratedReport[] = [];

    for (const format of formats) {
      try {
        const config: ReportConfig = {
          format,
          include_citations: true,
          include_methodology: true,
          include_confidence_scores: true,
          include_source_analysis: true,
          citation_style: "apa",
          executive_summary_length: "medium",
          detail_level: "detailed",
        };

        const report = await this.generate_report(data, config);
        reports.push(report);
      } catch (error) {
        log.warn(`Failed to generate ${format} report:`, error);
      }
    }

    return reports;
  }

  validate_report_data(data: ReportData): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!data.synthesis.query.trim()) {
      issues.push("Missing research query");
    }

    if (data.synthesis.insights.length === 0) {
      issues.push("No insights generated");
    }

    if (data.synthesis.sources.length === 0) {
      issues.push("No sources available");
    }

    if (data.citations.total_citations === 0) {
      issues.push("No citations generated");
    }

    if (data.synthesis.confidence_assessment.overall_confidence < 0.3) {
      issues.push("Overall confidence is very low");
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}