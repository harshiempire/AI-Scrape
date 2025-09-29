import { z } from "zod";
import { Memory, Message, Role } from "../../schema";
import { log } from "../logger";
import { ResearchPlan, ResearchSubquery } from "./planner";
import { SourceInfo, SynthesizedInsight } from "./synthesizer";

// Research-specific memory schemas
export const ResearchContextSchema = z.object({
  query: z.string(),
  research_phase: z.enum(["planning", "searching", "scraping", "synthesis", "reporting", "completed"]),
  current_subquery: z.string().optional(),
  completed_subqueries: z.array(z.string()),
  discovered_sources: z.array(z.string()), // URLs
  validated_insights: z.array(z.string()), // insight IDs
  research_threads: z.array(z.object({
    thread_id: z.string(),
    topic: z.string(),
    status: z.enum(["active", "completed", "paused"]),
    sources: z.array(z.string()),
    insights: z.array(z.string()),
  })),
});

export const ResearchStateSchema = z.object({
  session_id: z.string(),
  start_time: z.string(),
  last_update: z.string(),
  research_plan: z.any().optional(), // ResearchPlan
  context: ResearchContextSchema,
  accumulated_knowledge: z.object({
    key_concepts: z.array(z.string()),
    important_facts: z.array(z.string()),
    contradictions: z.array(z.object({
      topic: z.string(),
      source1: z.string(),
      source2: z.string(),
      description: z.string(),
    })),
    knowledge_gaps: z.array(z.string()),
  }),
  quality_metrics: z.object({
    source_quality_avg: z.number(),
    information_density: z.number(),
    cross_validation_score: z.number(),
    temporal_coverage: z.number(),
  }),
});

export type ResearchContext = z.infer<typeof ResearchContextSchema>;
export type ResearchState = z.infer<typeof ResearchStateSchema>;

export class ResearchMemory extends Memory {
  private research_state: ResearchState;
  private working_memory: Map<string, any> = new Map();
  private source_cache: Map<string, SourceInfo> = new Map();
  private insight_cache: Map<string, SynthesizedInsight> = new Map();

  constructor(session_id?: string) {
    super();
    
    this.research_state = {
      session_id: session_id || this.generate_session_id(),
      start_time: new Date().toISOString(),
      last_update: new Date().toISOString(),
      context: {
        query: "",
        research_phase: "planning",
        completed_subqueries: [],
        discovered_sources: [],
        validated_insights: [],
        research_threads: [],
      },
      accumulated_knowledge: {
        key_concepts: [],
        important_facts: [],
        contradictions: [],
        knowledge_gaps: [],
      },
      quality_metrics: {
        source_quality_avg: 0,
        information_density: 0,
        cross_validation_score: 0,
        temporal_coverage: 0,
      },
    };

    log.info(`Research memory initialized with session ID: ${this.research_state.session_id}`);
  }

  private generate_session_id(): string {
    return `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  initialize_research(query: string, plan: ResearchPlan): void {
    this.research_state.context.query = query;
    this.research_state.research_plan = plan;
    this.research_state.context.research_phase = "searching";
    this.research_state.last_update = new Date().toISOString();

    // Initialize research threads based on subqueries
    plan.subqueries.forEach(subquery => {
      this.research_state.context.research_threads.push({
        thread_id: subquery.id,
        topic: subquery.query,
        status: "active",
        sources: [],
        insights: [],
      });
    });

    // Add system message for research context
    this.add_message(Message.system_message(
      `Research session initialized for query: "${query}". Research plan includes ${plan.subqueries.length} subqueries with estimated completion time of ${plan.time_estimate} minutes.`
    ));

    log.info(`Research initialized: ${query}`);
  }

  update_research_phase(phase: ResearchContext["research_phase"]): void {
    const old_phase = this.research_state.context.research_phase;
    this.research_state.context.research_phase = phase;
    this.research_state.last_update = new Date().toISOString();

    this.add_message(Message.system_message(
      `Research phase transition: ${old_phase} → ${phase}`
    ));

    log.info(`Research phase updated: ${old_phase} → ${phase}`);
  }

  set_current_subquery(subquery: ResearchSubquery): void {
    this.research_state.context.current_subquery = subquery.id;
    this.research_state.last_update = new Date().toISOString();

    this.add_message(Message.system_message(
      `Now researching subquery: "${subquery.query}" (Priority: ${subquery.priority}/10, Complexity: ${subquery.estimated_complexity}/5)`
    ));

    log.info(`Current subquery set: ${subquery.query}`);
  }

  complete_subquery(subquery_id: string, insights: string[] = []): void {
    if (!this.research_state.context.completed_subqueries.includes(subquery_id)) {
      this.research_state.context.completed_subqueries.push(subquery_id);
    }

    // Update research thread
    const thread = this.research_state.context.research_threads.find(t => t.thread_id === subquery_id);
    if (thread) {
      thread.status = "completed";
      thread.insights.push(...insights);
    }

    this.research_state.last_update = new Date().toISOString();

    this.add_message(Message.system_message(
      `Subquery completed: ${subquery_id}. Generated ${insights.length} insights.`
    ));

    log.info(`Subquery completed: ${subquery_id}`);
  }

  add_discovered_source(url: string, source_info: SourceInfo): void {
    if (!this.research_state.context.discovered_sources.includes(url)) {
      this.research_state.context.discovered_sources.push(url);
    }

    this.source_cache.set(url, source_info);
    this.research_state.last_update = new Date().toISOString();

    // Update quality metrics
    this.update_source_quality_metrics();

    log.debug(`Source discovered: ${url} (Authority: ${source_info.authority_score}/10)`);
  }

  add_validated_insight(insight: SynthesizedInsight): void {
    if (!this.research_state.context.validated_insights.includes(insight.id)) {
      this.research_state.context.validated_insights.push(insight.id);
    }

    this.insight_cache.set(insight.id, insight);
    this.research_state.last_update = new Date().toISOString();

    // Update accumulated knowledge
    this.update_accumulated_knowledge(insight);

    this.add_message(Message.system_message(
      `Insight validated: ${insight.insight_type} with confidence ${(insight.confidence_score * 100).toFixed(1)}%`
    ));

    log.info(`Insight validated: ${insight.id}`);
  }

  private update_source_quality_metrics(): void {
    const sources = Array.from(this.source_cache.values());
    if (sources.length === 0) return;

    const avg_quality = sources.reduce((sum, s) => sum + s.authority_score, 0) / sources.length;
    this.research_state.quality_metrics.source_quality_avg = avg_quality / 10; // Normalize to 0-1

    // Calculate temporal coverage
    const dated_sources = sources.filter(s => s.published_date);
    if (dated_sources.length > 0) {
      const dates = dated_sources.map(s => new Date(s.published_date!).getTime());
      const date_range = Math.max(...dates) - Math.min(...dates);
      const year_ms = 365 * 24 * 60 * 60 * 1000;
      this.research_state.quality_metrics.temporal_coverage = Math.min(date_range / year_ms, 1);
    }

    // Calculate information density (sources per unique domain)
    const unique_domains = new Set(sources.map(s => s.domain)).size;
    this.research_state.quality_metrics.information_density = unique_domains / sources.length;
  }

  private update_accumulated_knowledge(insight: SynthesizedInsight): void {
    // Extract key concepts
    const concepts = insight.related_topics.filter(topic => 
      !this.research_state.accumulated_knowledge.key_concepts.includes(topic)
    );
    this.research_state.accumulated_knowledge.key_concepts.push(...concepts);

    // Add important facts
    if (insight.insight_type === "fact" && insight.confidence_score > 0.8) {
      this.research_state.accumulated_knowledge.important_facts.push(insight.content);
    }

    // Detect potential contradictions
    this.detect_contradictions(insight);
  }

  private detect_contradictions(new_insight: SynthesizedInsight): void {
    const existing_insights = Array.from(this.insight_cache.values());
    
    for (const existing of existing_insights) {
      if (existing.id === new_insight.id) continue;
      
      // Simple contradiction detection based on overlapping topics and opposing sentiment
      const overlap = new_insight.related_topics.some(topic => 
        existing.related_topics.includes(topic)
      );
      
      if (overlap && this.are_potentially_contradictory(existing.content, new_insight.content)) {
        const contradiction = {
          topic: new_insight.related_topics[0] || "general",
          source1: existing.supporting_sources[0] || "unknown",
          source2: new_insight.supporting_sources[0] || "unknown",
          description: `Potential contradiction between insights: "${existing.content.substring(0, 100)}..." vs "${new_insight.content.substring(0, 100)}..."`,
        };

        this.research_state.accumulated_knowledge.contradictions.push(contradiction);
        
        this.add_message(Message.system_message(
          `Potential contradiction detected: ${contradiction.description}`
        ));
      }
    }
  }

  private are_potentially_contradictory(content1: string, content2: string): boolean {
    // Simple heuristic for detecting contradictions
    const negative_indicators1 = ["not", "no", "never", "cannot", "impossible", "false"].some(word => 
      content1.toLowerCase().includes(word)
    );
    const negative_indicators2 = ["not", "no", "never", "cannot", "impossible", "false"].some(word => 
      content2.toLowerCase().includes(word)
    );

    // If one is negative and other is positive, might be contradictory
    return negative_indicators1 !== negative_indicators2;
  }

  store_working_data(key: string, data: any): void {
    this.working_memory.set(key, data);
    this.research_state.last_update = new Date().toISOString();
  }

  retrieve_working_data(key: string): any {
    return this.working_memory.get(key);
  }

  get_research_progress(): {
    phase: string;
    completion_percentage: number;
    completed_subqueries: number;
    total_subqueries: number;
    sources_discovered: number;
    insights_validated: number;
  } {
    const plan = this.research_state.research_plan as ResearchPlan;
    const total_subqueries = plan?.subqueries.length || 0;
    const completed = this.research_state.context.completed_subqueries.length;

    return {
      phase: this.research_state.context.research_phase,
      completion_percentage: total_subqueries > 0 ? (completed / total_subqueries) * 100 : 0,
      completed_subqueries: completed,
      total_subqueries,
      sources_discovered: this.research_state.context.discovered_sources.length,
      insights_validated: this.research_state.context.validated_insights.length,
    };
  }

  get_quality_assessment(): {
    overall_score: number;
    source_quality: number;
    information_density: number;
    temporal_coverage: number;
    knowledge_gaps: string[];
    recommendations: string[];
  } {
    const metrics = this.research_state.quality_metrics;
    const overall = (metrics.source_quality_avg + metrics.information_density + metrics.temporal_coverage) / 3;

    const recommendations: string[] = [];
    if (metrics.source_quality_avg < 0.6) {
      recommendations.push("Seek higher authority sources");
    }
    if (metrics.information_density < 0.5) {
      recommendations.push("Diversify source domains");
    }
    if (metrics.temporal_coverage < 0.3) {
      recommendations.push("Include more recent sources");
    }

    return {
      overall_score: overall,
      source_quality: metrics.source_quality_avg,
      information_density: metrics.information_density,
      temporal_coverage: metrics.temporal_coverage,
      knowledge_gaps: this.research_state.accumulated_knowledge.knowledge_gaps,
      recommendations,
    };
  }

  get_research_summary(): string {
    const progress = this.get_research_progress();
    const quality = this.get_quality_assessment();

    return `Research Session Summary:
- Query: ${this.research_state.context.query}
- Phase: ${progress.phase}
- Progress: ${progress.completion_percentage.toFixed(1)}% (${progress.completed_subqueries}/${progress.total_subqueries} subqueries)
- Sources: ${progress.sources_discovered} discovered
- Insights: ${progress.insights_validated} validated
- Quality Score: ${(quality.overall_score * 100).toFixed(1)}%
- Key Concepts: ${this.research_state.accumulated_knowledge.key_concepts.length}
- Contradictions: ${this.research_state.accumulated_knowledge.contradictions.length}`;
  }

  export_research_state(): ResearchState {
    return { ...this.research_state };
  }

  import_research_state(state: ResearchState): void {
    this.research_state = state;
    this.research_state.last_update = new Date().toISOString();
    
    log.info(`Research state imported for session: ${state.session_id}`);
  }

  get_context_for_llm(): string {
    const progress = this.get_research_progress();
    const key_concepts = this.research_state.accumulated_knowledge.key_concepts.slice(0, 10);
    const recent_insights = Array.from(this.insight_cache.values())
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 5);

    return `Research Context:
Current Phase: ${progress.phase}
Progress: ${progress.completion_percentage.toFixed(1)}% complete
Sources Discovered: ${progress.sources_discovered}
Key Concepts: ${key_concepts.join(", ")}
Recent High-Confidence Insights: ${recent_insights.map(i => i.content.substring(0, 100)).join("; ")}

Current Research Focus: ${this.research_state.context.current_subquery || "General research"}`;
  }

  // Override add_message to include research context
  override add_message(message: Message): void {
    super.add_message(message);
    
    // Add research context to system messages
    if (message.role === Role.SYSTEM) {
      this.research_state.last_update = new Date().toISOString();
    }
  }

  // Clean up old data to prevent memory bloat
  cleanup_old_data(days: number = 7): void {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const session_start = new Date(this.research_state.start_time);

    if (session_start < cutoff) {
      // Archive old research state
      log.info(`Archiving old research session: ${this.research_state.session_id}`);
      // In a real implementation, this would save to persistent storage
    }

    // Clear working memory of old temporary data
    this.working_memory.clear();
  }
}