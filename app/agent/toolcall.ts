import { Memory } from "../../schema";
import { AgentState, LLM } from "../../types";
import { NEXT_STEP_PROMPT, SYSTEM_PROMPT } from "../prompt/toolcall";
import { ReActAgent } from "./react";
import { ToolCollection } from "../tool/tool_collection";
import { CreateChatCompletion } from "../tool/create_chat_completion";
import { Terminate } from "../tool/terminate";

export class ToolCallAgent extends ReActAgent {
  name: string = "toolcall";
  description: string = "an agent that can execute tool calls";
  system_prompt: string = SYSTEM_PROMPT;
  next_step_prompt: string = NEXT_STEP_PROMPT;

  available_tools: ToolCollection = new ToolCollection([
    new CreateChatCompletion(),
    new Terminate(),
  ]);
  tool_choices: TOOL_CHOICE_TYPE = ToolChoices.AUTO;
  special_tool_name: string[] = [Terminate().name];
}
