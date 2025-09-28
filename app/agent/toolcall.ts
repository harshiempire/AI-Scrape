import { ToolChoice, TOOL_CHOICE_TYPE, ToolCall, Message } from "../../schema";
import { NEXT_STEP_PROMPT, SYSTEM_PROMPT } from "../prompt/toolcall";
import { ReActAgent } from "./react";
import { ToolCollection } from "../tool/tool_collection";
import { Terminate } from "../tool/terminate";
import { log } from "../logger";

export class ToolCallAgent extends ReActAgent {
  name: string = "toolcall";
  description: string = "an agent that can execute tool calls";
  system_prompt: string = SYSTEM_PROMPT;
  next_step_prompt: string = NEXT_STEP_PROMPT;

  available_tools: ToolCollection = new ToolCollection([
    // new CreateChatCompletion(),
    new Terminate(),
  ]);
  tool_choices: TOOL_CHOICE_TYPE = ToolChoice.AUTO;
  special_tool_name: string[] = [new Terminate().name];

  tool_calls: ToolCall[] = [];
  private _current_base64_image?: string;

  max_steps: number = 30;
  max_observe?: number | boolean;

  async think(): Promise<boolean> {
    if (this.next_step_prompt) {
      const user_msg = Message.user_message(this.next_step_prompt);
      this.messages = [...this.messages, user_msg];
    }
    let response;

    try {
      response = await this.llm.ask_tool({
        messages: this.messages,
        system_msgs: [
          this.system_prompt
            ? Message.system_message(this.system_prompt)
            : undefined,
        ],
        tools: this.available_tools.to_params(),
        tool_choices: this.tool_choices,
      });
    } catch (error) {
      //TODO: should handle the error handling properly where we should also account for cases where the error is related TokenLimitExceededError
      log.exception("Error in think method", error as Error);
      return false;
    }

    this.tool_calls =
      response && response.tool_calls ? response.tool_calls : [];

    const content = response && response.content ? response.content : "";

    // Log the response from the ask_tool function
    log.info(`✨ ${this.name}'s thoughts: ${content}`);
    log.info(`🛠️ ${this.name} selected ${this.tool_calls.length} tools to use`);
    if (this.tool_calls) {
      log.info(
        `🧰 Tools being prepared: ${this.tool_calls.map(
          (call) => call.function.name
        )}`
      );
    }
    log.info(`🔧 Tool arguments: ${this.tool_calls[0].function.arguments}`);

    try {
      if (!response) {
        throw new Error("No response received from the LLM");
      }
    } catch (error) {
      log.exception("Error in think method validation", error as Error);
      return false;
    }

    return true;
  }

  act(): Promise<string> {
    return Promise.resolve("Acting complete - no action needed");
  }
}
