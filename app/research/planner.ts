import { z } from "zod";
import { LLM } from "../llm";
import { Memory, Message } from "../../schema";
import { log } from "../logger";

// Research query decomposition schemas
export const ResearchSubquerySchema = z.object({
  id: z.string(),
  query: z.string(),
  priority: z.number().min(1).max(10),
  type: z.enum(["factual", "analytical", "comparative", "trend", "definition"]),
  dependencies: z.array(z.string()).optional(),
  estimated_complexity: z.number().min(1).max(5),
});

export const ResearchPlanSchema = z.object({
  main_query: z.string(),
  research_objectives: z.array(z.string()),
  subqueries: z.array(ResearchSubquerySchema),
  search_strategy: z.string(),
  expected_sources: z.array(z.string()),
  time_estimate: z.number(), // in minutes
  confidence_threshold: z.number().min(0.1).max(1.0),
});

export type ResearchSubquery = z.infer<typeof ResearchSubquerySchema>;
export type ResearchPlan = z.infer<typeof ResearchPlanSchema>;

export class ResearchPlanner {
  private llm: LLM;
  private memory: Memory;

  constructor(llm: LLM) {
    this.llm = llm;
    this.memory = new Memory();
  }

  private get_planning_prompt(): string {
    return `You are an expert research planner. Your task is to decompose complex research queries into structured, actionable research plans.

For each research query, you must:
1. Identify the main research objectives
2. Break down the query into specific, focused subqueries
3. Determine the priority and complexity of each subquery
4. Identify dependencies between subqueries
5. Suggest search strategies and potential sources
6. Estimate time requirements and confidence thresholds

Guidelines:
- Create 3-8 subqueries that cover all aspects of the main query
- Prioritize subqueries (1-10, where 10 is highest priority)
- Classify each subquery by type: factual, analytical, comparative, trend, or definition
- Consider dependencies (some subqueries may need others completed first)
- Estimate complexity (1-5, where 5 is most complex)
- Suggest relevant source types (academic, news, corporate, government, etc.)

Return your response as a JSON object matching this exact structure:
{
  "main_query": "string",
  "research_objectives": ["objective1", "objective2", ...],
  "subqueries": [
    {
      "id": "unique_id",
      "query": "specific question",
      "priority": 1-10,
      "type": "factual|analytical|comparative|trend|definition",
      "dependencies": ["id1", "id2"] or [],
      "estimated_complexity": 1-5
    }
  ],
  "search_strategy": "description of overall approach",
  "expected_sources": ["source_type1", "source_type2", ...],
  "time_estimate": minutes_as_number,
  "confidence_threshold": 0.1-1.0
}`;
  }

  async create_research_plan(query: string): Promise<ResearchPlan> {
    log.info(`Creating research plan for query: ${query}`);

    this.memory.clear();
    this.memory.add_message(Message.system_message(this.get_planning_prompt()));
    this.memory.add_message(
      Message.user_message(
        `Please create a comprehensive research plan for this query: "${query}"`
      )
    );

    try {
      const response = await this.llm.ask(
        this.memory.to_dict_list(),
        undefined,
        false,
        0.3
      );

      if (!response) {
        throw new Error("No response content from LLM");
      }

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }

      const planData = JSON.parse(jsonMatch[0]);
      const validatedPlan = ResearchPlanSchema.parse(planData);

      log.info(
        `Research plan created with ${validatedPlan.subqueries.length} subqueries`
      );
      return validatedPlan;
    } catch (error) {
      log.error("Failed to create research plan:", error);
      throw new Error(
        `Research planning failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async refine_plan(
    plan: ResearchPlan,
    feedback: string
  ): Promise<ResearchPlan> {
    log.info("Refining research plan based on feedback");

    this.memory.add_message(
      Message.user_message(
        `Based on this feedback: "${feedback}", please refine the research plan. Current plan: ${JSON.stringify(
          plan,
          null,
          2
        )}`
      )
    );

    try {
      const response = await this.llm.ask(
        this.memory.to_dict_list(),
        undefined,
        false,
        0.3
      );

      if (!response) {
        throw new Error("No response content from LLM");
      }

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }

      const refinedData = JSON.parse(jsonMatch[0]);
      const refinedPlan = ResearchPlanSchema.parse(refinedData);

      log.info("Research plan refined successfully");
      return refinedPlan;
    } catch (error) {
      log.error("Failed to refine research plan:", error);
      return plan; // Return original plan if refinement fails
    }
  }

  get_next_subquery(
    plan: ResearchPlan,
    completed_ids: string[]
  ): ResearchSubquery | null {
    // Filter out completed subqueries
    const remaining = plan.subqueries.filter(
      (sq) => !completed_ids.includes(sq.id)
    );

    if (remaining.length === 0) {
      return null;
    }

    // Find subqueries with no unmet dependencies
    const available = remaining.filter((sq) => {
      if (!sq.dependencies || sq.dependencies.length === 0) {
        return true;
      }
      return sq.dependencies.every((dep) => completed_ids.includes(dep));
    });

    if (available.length === 0) {
      // If no available subqueries due to dependencies, return highest priority remaining
      return remaining.reduce((highest, current) =>
        current.priority > highest.priority ? current : highest
      );
    }

    // Return highest priority available subquery
    return available.reduce((highest, current) =>
      current.priority > highest.priority ? current : highest
    );
  }

  estimate_progress(plan: ResearchPlan, completed_ids: string[]): number {
    if (plan.subqueries.length === 0) return 1.0;
    return completed_ids.length / plan.subqueries.length;
  }

  get_plan_summary(plan: ResearchPlan): string {
    return `Research Plan Summary:
- Main Query: ${plan.main_query}
- Objectives: ${plan.research_objectives.length}
- Subqueries: ${plan.subqueries.length}
- Estimated Time: ${plan.time_estimate} minutes
- Strategy: ${plan.search_strategy}
- Expected Sources: ${plan.expected_sources.join(", ")}`;
  }
}
