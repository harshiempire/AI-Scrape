import { z } from "zod";
import { log } from "../logger";
import { SourceInfo, SynthesizedInsight } from "./synthesizer";

// Citation schemas
export const CitationSchema = z.object({
  id: z.string(),
  source_id: z.string(),
  citation_text: z.string(),
  page_number: z.number().optional(),
  section: z.string().optional(),
  quote: z.string().optional(),
  context: z.string(),
  confidence: z.number().min(0).max(1),
  citation_type: z.enum(["direct_quote", "paraphrase", "reference", "data_point", "opinion"]),
});

export const BibliographyEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()).optional(),
  publication_date: z.string().optional(),
  url: z.string(),
  domain: z.string(),
  access_date: z.string(),
  publication_type: z.string(),
  doi: z.string().optional(),
  isbn: z.string().optional(),
});

export const CitationReportSchema = z.object({
  total_sources: z.number(),
  total_citations: z.number(),
  citation_density: z.number(), // citations per insight
  source_coverage: z.number(), // percentage of sources cited
  citation_quality_score: z.number().min(0).max(1),
  citations: z.array(CitationSchema),
  bibliography: z.array(BibliographyEntrySchema),
  citation_styles: z.object({
    apa: z.array(z.string()),
    mla: z.array(z.string()),
    chicago: z.array(z.string()),
    ieee: z.array(z.string()),
  }),
});

export type Citation = z.infer<typeof CitationSchema>;
export type BibliographyEntry = z.infer<typeof BibliographyEntrySchema>;
export type CitationReport = z.infer<typeof CitationReportSchema>;

export class CitationManager {
  private citations: Citation[] = [];
  private bibliography: BibliographyEntry[] = [];
  private source_map: Map<string, SourceInfo> = new Map();

  constructor() {
    log.info("Citation manager initialized");
  }

  add_sources(sources: SourceInfo[]): void {
    sources.forEach(source => {
      this.source_map.set(source.id, source);
      this.add_to_bibliography(source);
    });
    log.info(`Added ${sources.length} sources to citation manager`);
  }

  private add_to_bibliography(source: SourceInfo): void {
    const existing = this.bibliography.find(entry => entry.id === source.id);
    if (existing) return;

    const bibliography_entry: BibliographyEntry = {
      id: source.id,
      title: source.title,
      authors: source.author ? [source.author] : undefined,
      publication_date: source.published_date,
      url: source.url,
      domain: source.domain,
      access_date: new Date().toISOString().split("T")[0],
      publication_type: this.get_publication_type(source),
      doi: this.extract_doi(source.url),
    };

    this.bibliography.push(bibliography_entry);
  }

  private get_publication_type(source: SourceInfo): string {
    switch (source.content_type) {
      case "research_paper":
        return "Journal Article";
      case "news":
        return "News Article";
      case "blog":
        return "Blog Post";
      case "documentation":
        return "Technical Documentation";
      default:
        return "Web Article";
    }
  }

  private extract_doi(url: string): string | undefined {
    const doi_match = url.match(/doi\.org\/(.+)/) || url.match(/doi:(.+)/);
    return doi_match ? doi_match[1] : undefined;
  }

  create_citations_for_insights(insights: SynthesizedInsight[]): Citation[] {
    const new_citations: Citation[] = [];

    insights.forEach(insight => {
      // Create citations for supporting sources
      insight.supporting_sources.forEach((source_id, index) => {
        const source = this.source_map.get(source_id);
        if (!source) return;

        const citation: Citation = {
          id: `citation_${insight.id}_${index}`,
          source_id,
          citation_text: this.generate_citation_text(source, insight),
          context: insight.content,
          confidence: insight.confidence_score,
          citation_type: this.determine_citation_type(insight, source),
        };

        new_citations.push(citation);
      });

      // Create citations for contradicting sources if any
      insight.contradicting_sources?.forEach((source_id, index) => {
        const source = this.source_map.get(source_id);
        if (!source) return;

        const citation: Citation = {
          id: `citation_${insight.id}_contra_${index}`,
          source_id,
          citation_text: this.generate_citation_text(source, insight),
          context: `Contradictory view: ${insight.content}`,
          confidence: insight.confidence_score,
          citation_type: "reference",
        };

        new_citations.push(citation);
      });
    });

    this.citations.push(...new_citations);
    log.info(`Created ${new_citations.length} citations for insights`);
    
    return new_citations;
  }

  private generate_citation_text(source: SourceInfo, insight: SynthesizedInsight): string {
    const author = source.author || source.domain;
    const year = source.published_date ? new Date(source.published_date).getFullYear() : "n.d.";
    
    return `${author} (${year})`;
  }

  private determine_citation_type(insight: SynthesizedInsight, source: SourceInfo): Citation["citation_type"] {
    if (insight.insight_type === "fact") {
      return "data_point";
    }
    if (insight.insight_type === "opinion") {
      return "opinion";
    }
    if (source.content_type === "research_paper") {
      return "reference";
    }
    return "paraphrase";
  }

  generate_citation_report(): CitationReport {
    const total_sources = this.bibliography.length;
    const total_citations = this.citations.length;
    const cited_sources = new Set(this.citations.map(c => c.source_id)).size;
    
    const citation_report: CitationReport = {
      total_sources,
      total_citations,
      citation_density: total_citations / Math.max(1, total_sources),
      source_coverage: cited_sources / Math.max(1, total_sources),
      citation_quality_score: this.calculate_citation_quality(),
      citations: this.citations,
      bibliography: this.bibliography,
      citation_styles: {
        apa: this.format_citations_apa(),
        mla: this.format_citations_mla(),
        chicago: this.format_citations_chicago(),
        ieee: this.format_citations_ieee(),
      },
    };

    return citation_report;
  }

  private calculate_citation_quality(): number {
    if (this.citations.length === 0) return 0;

    const avg_confidence = this.citations.reduce((sum, c) => sum + c.confidence, 0) / this.citations.length;
    const source_diversity = new Set(this.citations.map(c => c.source_id)).size / this.bibliography.length;
    const authority_factor = this.calculate_average_authority();

    return (avg_confidence * 0.4 + source_diversity * 0.3 + authority_factor * 0.3);
  }

  private calculate_average_authority(): number {
    const authorities = Array.from(this.source_map.values()).map(s => s.authority_score);
    if (authorities.length === 0) return 0;
    return authorities.reduce((sum, a) => sum + a, 0) / authorities.length / 10; // Normalize to 0-1
  }

  private format_citations_apa(): string[] {
    return this.bibliography.map(entry => {
      const authors = entry.authors?.join(", ") || entry.domain;
      const year = entry.publication_date ? `(${new Date(entry.publication_date).getFullYear()})` : "(n.d.)";
      const title = entry.title;
      const url = entry.url;
      const access_date = `Retrieved ${entry.access_date}`;

      return `${authors} ${year}. ${title}. ${url}. ${access_date}.`;
    });
  }

  private format_citations_mla(): string[] {
    return this.bibliography.map(entry => {
      const authors = entry.authors?.join(", ") || entry.domain;
      const title = `"${entry.title}"`;
      const website = entry.domain;
      const date = entry.publication_date || "n.d.";
      const url = entry.url;
      const access_date = entry.access_date;

      return `${authors}. ${title} ${website}, ${date}, ${url}. Accessed ${access_date}.`;
    });
  }

  private format_citations_chicago(): string[] {
    return this.bibliography.map(entry => {
      const authors = entry.authors?.join(", ") || entry.domain;
      const title = `"${entry.title}"`;
      const website = entry.domain;
      const date = entry.publication_date ? `Last modified ${entry.publication_date}` : "";
      const url = entry.url;
      const access_date = `Accessed ${entry.access_date}`;

      return `${authors}. ${title} ${website}. ${date}. ${url}. ${access_date}.`;
    });
  }

  private format_citations_ieee(): string[] {
    return this.bibliography.map((entry, index) => {
      const authors = entry.authors?.join(", ") || entry.domain;
      const title = `"${entry.title}"`;
      const website = entry.domain;
      const url = entry.url;
      const access_date = `(accessed ${entry.access_date})`;

      return `[${index + 1}] ${authors}, ${title}, ${website}. [Online]. Available: ${url} ${access_date}`;
    });
  }

  get_citation_by_source(source_id: string): Citation[] {
    return this.citations.filter(c => c.source_id === source_id);
  }

  get_sources_by_authority(min_authority: number = 7): SourceInfo[] {
    return Array.from(this.source_map.values())
      .filter(source => source.authority_score >= min_authority)
      .sort((a, b) => b.authority_score - a.authority_score);
  }

  validate_citations(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for orphaned citations
    const orphaned = this.citations.filter(c => !this.source_map.has(c.source_id));
    if (orphaned.length > 0) {
      issues.push(`${orphaned.length} citations reference non-existent sources`);
    }

    // Check citation coverage
    const uncited_sources = Array.from(this.source_map.keys())
      .filter(id => !this.citations.some(c => c.source_id === id));
    if (uncited_sources.length > 0) {
      issues.push(`${uncited_sources.length} sources are not cited`);
    }

    // Check citation quality
    const low_confidence = this.citations.filter(c => c.confidence < 0.5);
    if (low_confidence.length > this.citations.length * 0.3) {
      issues.push("More than 30% of citations have low confidence scores");
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  export_citations(format: "json" | "bibtex" | "ris" = "json"): string {
    switch (format) {
      case "bibtex":
        return this.export_bibtex();
      case "ris":
        return this.export_ris();
      default:
        return JSON.stringify(this.generate_citation_report(), null, 2);
    }
  }

  private export_bibtex(): string {
    return this.bibliography.map(entry => {
      const type = entry.publication_type.includes("Journal") ? "article" : "misc";
      const key = entry.id.replace(/[^a-zA-Z0-9]/g, "");
      
      let bibtex = `@${type}{${key},\n`;
      bibtex += `  title={${entry.title}},\n`;
      if (entry.authors) {
        bibtex += `  author={${entry.authors.join(" and ")}},\n`;
      }
      if (entry.publication_date) {
        bibtex += `  year={${new Date(entry.publication_date).getFullYear()}},\n`;
      }
      bibtex += `  url={${entry.url}},\n`;
      bibtex += `  note={Accessed: ${entry.access_date}}\n`;
      bibtex += "}\n";
      
      return bibtex;
    }).join("\n");
  }

  private export_ris(): string {
    return this.bibliography.map(entry => {
      let ris = "TY  - ELEC\n"; // Electronic source
      ris += `TI  - ${entry.title}\n`;
      if (entry.authors) {
        entry.authors.forEach(author => {
          ris += `AU  - ${author}\n`;
        });
      }
      if (entry.publication_date) {
        ris += `PY  - ${entry.publication_date}\n`;
      }
      ris += `UR  - ${entry.url}\n`;
      ris += `N1  - Accessed: ${entry.access_date}\n`;
      ris += "ER  - \n";
      
      return ris;
    }).join("\n");
  }
}