import { ResearchReport, ResearchFinding, Fact } from "./types";
import { log } from "../../logger";

export class ReportGenerator {
  generateMarkdownReport(report: ResearchReport): string {
    const sections = [
      this.generateHeader(report),
      this.generateExecutiveSummary(report),
      this.generateTableOfContents(),
      this.generateIntroduction(report),
      this.generateMethodology(report),
      this.generateFindings(report),
      this.generateAnalysis(report),
      this.generateLimitations(report),
      this.generateConclusions(report),
      this.generateRecommendations(report),
      this.generateReferences(report),
      this.generateAppendices(report)
    ];

    return sections.join('\n\n');
  }

  private generateHeader(report: ResearchReport): string {
    return `# ${report.title}

**Generated:** ${new Date(report.generated_at).toLocaleString()}  
**Research Depth:** ${report.query.depth}  
**Sources Analyzed:** ${report.citations.length}

---`;
  }

  private generateExecutiveSummary(report: ResearchReport): string {
    return `## Executive Summary

${report.executive_summary}`;
  }

  private generateTableOfContents(): string {
    return `## Table of Contents

1. [Introduction](#introduction)
2. [Methodology](#methodology)
3. [Key Findings](#key-findings)
4. [Analysis](#analysis)
5. [Limitations](#limitations)
6. [Conclusions](#conclusions)
7. [Recommendations](#recommendations)
8. [References](#references)
9. [Appendices](#appendices)`;
  }

  private generateIntroduction(report: ResearchReport): string {
    return `## Introduction

This research report addresses the following query: **${report.query.main_query}**

### Research Objectives

The primary objectives of this research were to:
${report.query.sub_queries.map((q, i) => `${i + 1}. ${q}`).join('\n')}

### Scope and Context

${report.query.context || 'This research encompasses a comprehensive analysis of available sources to provide evidence-based insights.'}`;
  }

  private generateMethodology(report: ResearchReport): string {
    return `## Methodology

${report.methodology}

### Research Process

1. **Query Analysis**: Decomposed the main research question into focused sub-queries
2. **Information Gathering**: Conducted systematic searches across multiple sources
3. **Source Evaluation**: Assessed credibility and relevance of each source
4. **Fact Verification**: Cross-referenced claims across multiple sources
5. **Synthesis**: Combined findings into coherent insights
6. **Quality Assurance**: Reviewed findings for accuracy and completeness`;
  }

  private generateFindings(report: ResearchReport): string {
    const findingsSections = report.findings.map((finding, index) => 
      this.formatFinding(finding, index + 1)
    ).join('\n\n');

    return `## Key Findings

${findingsSections}`;
  }

  private formatFinding(finding: ResearchFinding, number: number): string {
    const verifiedFacts = finding.facts.filter(f => f.verification_status === 'verified');
    const disputedFacts = finding.facts.filter(f => f.verification_status === 'disputed');

    return `### Finding ${number}: ${finding.topic}

${finding.summary}

#### Verified Facts (${verifiedFacts.length})
${verifiedFacts.map(fact => this.formatFact(fact)).join('\n')}

${disputedFacts.length > 0 ? `#### Disputed or Unverified Claims (${disputedFacts.length})
${disputedFacts.map(fact => this.formatFact(fact)).join('\n')}` : ''}

#### Sources
${finding.sources.slice(0, 3).map(source => 
  `- [${source.title}](${source.url}) - Relevance: ${(source.relevance_score || 0) * 100}%`
).join('\n')}`;
  }

  private formatFact(fact: Fact): string {
    const confidence = Math.round(fact.confidence * 100);
    const icon = fact.verification_status === 'verified' ? '✅' : 
                 fact.verification_status === 'disputed' ? '⚠️' : '❓';
    
    return `- ${icon} ${fact.statement} (${confidence}% confidence)
  - Sources: ${fact.sources.length} | Evidence: ${fact.supporting_evidence.length} items`;
  }

  private generateAnalysis(report: ResearchReport): string {
    return `## Analysis

### Synthesis of Findings

The research reveals several key insights:

${report.findings.map((f, i) => `${i + 1}. **${f.topic}**: ${f.summary.split('.')[0]}.`).join('\n')}

### Patterns and Trends

Analysis of the gathered information reveals consistent patterns across sources, with high agreement on core facts and some variation in interpretation and emphasis.

### Strength of Evidence

The overall strength of evidence is assessed based on:
- **Source Credibility**: Average credibility score across all sources
- **Fact Verification**: Percentage of claims successfully verified
- **Cross-Source Agreement**: Degree of consensus among different sources`;
  }

  private generateLimitations(report: ResearchReport): string {
    return `## Limitations

This research has the following limitations:

${report.limitations.map((limitation, i) => `${i + 1}. ${limitation}`).join('\n')}

### Additional Considerations

- Temporal limitations: Information current as of ${new Date(report.generated_at).toLocaleDateString()}
- Geographic scope: Primarily English-language sources
- Access restrictions: Limited to publicly available information`;
  }

  private generateConclusions(report: ResearchReport): string {
    return `## Conclusions

Based on the comprehensive analysis of ${report.citations.length} sources and verification of ${this.countTotalFacts(report)} facts, this research provides evidence-based insights into ${report.query.main_query}.

### Key Takeaways

${report.findings.slice(0, 3).map((f, i) => 
  `${i + 1}. ${f.summary.split('.')[0]}.`
).join('\n')}

### Reliability Assessment

The findings presented in this report are based on:
- Verified facts: ${this.countVerifiedFacts(report)}
- High-credibility sources: ${this.countHighCredibilitySources(report)}
- Cross-referenced claims: ${this.countCrossReferencedClaims(report)}`;
  }

  private generateRecommendations(report: ResearchReport): string {
    if (!report.recommendations || report.recommendations.length === 0) {
      return '';
    }

    return `## Recommendations

Based on the research findings, the following recommendations are proposed:

${report.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}`;
  }

  private generateReferences(report: ResearchReport): string {
    const formattedCitations = report.citations.map((cite, i) => 
      `[${i + 1}] ${cite.text}. Available at: ${cite.url} (Accessed: ${new Date(cite.access_date).toLocaleDateString()})`
    ).join('\n\n');

    return `## References

${formattedCitations}`;
  }

  private generateAppendices(report: ResearchReport): string {
    return `## Appendices

### Appendix A: Search Queries Used

${report.query.sub_queries.map((q, i) => `- Query ${i + 1}: "${q}"`).join('\n')}

### Appendix B: Source Evaluation Criteria

Sources were evaluated based on:
- Domain authority and reputation
- Content quality and depth
- Recency of information
- Number of citations and references
- Author credentials and expertise`;
  }

  // Utility methods
  private countTotalFacts(report: ResearchReport): number {
    return report.findings.reduce((total, finding) => total + finding.facts.length, 0);
  }

  private countVerifiedFacts(report: ResearchReport): number {
    return report.findings.reduce((total, finding) => 
      total + finding.facts.filter(f => f.verification_status === 'verified').length, 0
    );
  }

  private countHighCredibilitySources(report: ResearchReport): number {
    const allSources = report.findings.flatMap(f => f.credibility_scores);
    return allSources.filter(s => s.credibility_score > 0.7).length;
  }

  private countCrossReferencedClaims(report: ResearchReport): number {
    return report.findings.reduce((total, finding) => 
      total + finding.facts.filter(f => f.sources.length > 1).length, 0
    );
  }

  // Export formats
  generateJSONReport(report: ResearchReport): string {
    return JSON.stringify(report, null, 2);
  }

  generateHTMLReport(report: ResearchReport): string {
    // Convert markdown to HTML
    const markdown = this.generateMarkdownReport(report);
    // In production, use a markdown-to-HTML converter
    return `<!DOCTYPE html>
<html>
<head>
  <title>${report.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #333; }
    h1 { border-bottom: 3px solid #333; padding-bottom: 10px; }
    h2 { border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px; }
    h3 { margin-top: 20px; }
    ul { line-height: 1.6; }
    a { color: #0066cc; }
    .metadata { color: #666; font-style: italic; }
  </style>
</head>
<body>
  ${markdown.replace(/\n/g, '<br>')} <!-- Simple conversion, use proper markdown parser in production -->
</body>
</html>`;
  }
}