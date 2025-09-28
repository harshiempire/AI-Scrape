import { ToolCallAgent } from "./toolcall";
import { SYSTEM_PROMPT, NEXT_STEP_PROMPT } from "../prompt/deep_research";
import { ToolCollection } from "../tool/tool_collection";
import { Terminate } from "../tool/terminate";
import { WebSearch } from "../tool/search";
import { FetchUrl } from "../tool/fetch_url";

export class DeepResearchAgent extends ToolCallAgent {
  name: string = "deep_research";
  description: string = "An industry-standard deep research agent";
  system_prompt: string = SYSTEM_PROMPT;
  next_step_prompt: string = NEXT_STEP_PROMPT;

  available_tools: ToolCollection = new ToolCollection([
    new WebSearch(),
    new FetchUrl(),
    new Terminate(),
  ]);

  // Encourage more iterative steps for deeper research
  max_steps: number = 40;
}

