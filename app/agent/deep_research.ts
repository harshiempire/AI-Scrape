import { ToolCallAgent } from "./toolcall";
import { ToolCollection } from "../tool/tool_collection";
import { Terminate } from "../tool/terminate";
import { SearchWeb } from "../tool/search_web";
import { FetchUrl } from "../tool/fetch_url";
import { SYSTEM_PROMPT, NEXT_STEP_PROMPT } from "../prompt/deep_research";

export class DeepResearchAgent extends ToolCallAgent {
  name: string = "deep_research";
  description: string = "An industry-standard deep research agent with planning, browsing, evidence tracking, and citations.";
  system_prompt: string = SYSTEM_PROMPT;
  next_step_prompt: string = NEXT_STEP_PROMPT;

  constructor() {
    super({ name: "deep_research" });
    this.available_tools = new ToolCollection([
      new SearchWeb(),
      new FetchUrl(),
      new Terminate(),
    ]);
    this.special_tool_name = [new Terminate().name];
    this.max_steps = 40;
    this.max_observe = 4000; // avoid flooding memory
  }
}

