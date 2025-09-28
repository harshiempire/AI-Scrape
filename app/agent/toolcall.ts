import { ToolChoice, TOOL_CHOICE_TYPE, ToolCall, Message } from "../../schema";
import { NEXT_STEP_PROMPT, SYSTEM_PROMPT } from "../prompt/toolcall";
import { ReActAgent } from "./react";
import { ToolCollection } from "../tool/tool_collection";
import { Terminate } from "../tool/terminate";
import { log } from "../logger";
import { TokenLimitExceeded, ValueError } from "../llm";
import { AgentState, ToolResultType } from "../../types";

const TOOL_CALL_REQUIRED = "Tool call is required but none were provided";

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
      // Get response with tool options
      response = await this.llm.ask_tool(
        this.messages,
        this.system_prompt
          ? [Message.system_message(this.system_prompt)]
          : undefined,
        300, // timeout
        this.available_tools.to_params(),
        this.tool_choices
      );
    } catch (error) {
      if (error instanceof ValueError) {
        throw error;
      }

      // Check if this is a RetryError containing TokenLimitExceeded
      if (
        error &&
        typeof error === "object" &&
        "cause" in error &&
        error.cause instanceof TokenLimitExceeded
      ) {
        const token_limit_error = error.cause;
        log.error(
          `🚨 Token limit error (from RetryError): ${token_limit_error}`
        );
        this.memory.add_message(
          Message.assistant_message(
            `Maximum token limit reached, cannot continue execution: ${String(
              token_limit_error
            )}`
          )
        );
        this.state = AgentState.COMPLETED;
        return false;
      }
      throw error;
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
      if (response === null) {
        throw new Error("No response received from the LLM");
      }

      // Handle different tool_choices modes
      if (this.tool_choices === ToolChoice.NONE) {
        if (this.tool_calls.length > 0) {
          log.warn(
            `🤔 Hmm, ${this.name} tried to use tools when they weren't available!`
          );
        }
        if (content) {
          this.memory.add_message(Message.assistant_message(content));
          return true;
        }
        return false;
      }

      // Create and add assistant message
      const assistant_msg =
        this.tool_calls.length > 0
          ? Message.from_tool_calls(this.tool_calls, content)
          : Message.assistant_message(content);
      this.memory.add_message(assistant_msg);

      if (
        this.tool_choices === ToolChoice.REQUIRED &&
        this.tool_calls.length === 0
      ) {
        return true; // Will be handled in act()
      }

      // For 'auto' mode, continue with content if no commands but content exists
      if (
        this.tool_choices === ToolChoice.AUTO &&
        this.tool_calls.length === 0
      ) {
        return Boolean(content);
      }

      return this.tool_calls.length > 0;
    } catch (error) {
      log.error(
        `🚨 Oops! The ${this.name}'s thinking process hit a snag: ${error}`
      );
      this.memory.add_message(
        Message.assistant_message(
          `Error encountered while processing: ${String(error)}`
        )
      );
      return false;
    }
  }

  async act(): Promise<string> {
    if (this.tool_calls.length === 0) {
      if (this.tool_choices === ToolChoice.REQUIRED) {
        throw new ValueError(TOOL_CALL_REQUIRED);
      }

      // Return last message content if no tool calls
      const lastMessage = this.messages[this.messages.length - 1];
      return lastMessage?.content || "No content or commands to execute";
    }

    const results: string[] = [];
    for (const command of this.tool_calls) {
      // Reset base64_image for each tool call
      this._current_base64_image = undefined;

      const result = await this.execute_tool(command);

      const finalResult = this.max_observe
        ? result.substring(0, this.max_observe as number)
        : result;

      log.info(
        `🎯 Tool '${command.function.name}' completed its mission! Result: ${finalResult}`
      );

      // Add tool response to memory
      const tool_msg = Message.tool_message(
        finalResult,
        command.function.name,
        command.id,
        this._current_base64_image
      );
      this.memory.add_message(tool_msg);
      results.push(finalResult);
    }

    return results.join("\n\n");
  }

  async execute_tool(command: ToolCall): Promise<string> {
    if (!command || !command.function || !command.function.name) {
      return "Error: Invalid command format";
    }

    const name = command.function.name;
    if (!(name in this.available_tools.tool_map)) {
      return `Error: Unknown tool '${name}'`;
    }

    try {
      // Parse arguments
      const args = JSON.parse(command.function.arguments || "{}");

      // Execute the tool
      log.info(`🔧 Activating tool: '${name}'...`);
      const result: ToolResultType = await this.available_tools.execute(
        name,
        args
      );

      // Handle special tools
      await this._handle_special_tool(name, result);

      // Check if result has base64_image
      if (
        result &&
        typeof result === "object" &&
        "base64_image" in result &&
        result.base64_image
      ) {
        this._current_base64_image = result.base64_image;
      }

      // Format result for display
      const observation = result
        ? `Observed output of cmd \`${name}\` executed:\n${String(result)}`
        : `Cmd \`${name}\` completed with no output`;

      return observation;
    } catch (error) {
      if (error instanceof SyntaxError) {
        const error_msg = `Error parsing arguments for ${name}: Invalid JSON format`;
        log.error(
          `📝 Oops! The arguments for '${name}' don't make sense - invalid JSON, arguments:${command.function.arguments}`
        );
        return `Error: ${error_msg}`;
      }

      const error_msg = `⚠️ Tool '${name}' encountered a problem: ${String(
        error
      )}`;
      log.exception(error_msg, error as Error);
      return `Error: ${error_msg}`;
    }
  }
  private static _should_finish_execution(
    _name?: string,
    _result?: ToolResultType
  ): boolean {
    return true;
  }

  async _handle_special_tool(
    name: string,
    result: ToolResultType
  ): Promise<void> {
    if (!this._is_special_tool(name)) {
      return;
    }

    if (ToolCallAgent._should_finish_execution(name, result)) {
      log.info(`🏁 Special tool '${name}' has completed the task!`);
      this.state = AgentState.COMPLETED;
    }
  }

  private _is_special_tool(name: string): boolean {
    return this.special_tool_name.some(
      (n) => n.toLowerCase() === name.toLowerCase()
    );
  }

  async cleanup(): Promise<void> {
    log.info(`🧹 Cleaning up resources for agent '${this.name}'...`);

    for (const [tool_name, tool_instance] of Object.entries(
      this.available_tools.tool_map
    )) {
      if (tool_instance && typeof tool_instance.cleanup === "function") {
        try {
          log.debug(`🧼 Cleaning up tool: ${tool_name}`);
          await tool_instance.cleanup();
        } catch (error) {
          log.error(`🚨 Error cleaning up tool '${tool_name}': ${error}`);
        }
      }
    }

    log.info(`✨ Cleanup complete for agent '${this.name}'.`);
  }

  async run(request?: string): Promise<string> {
    try {
      return await super.run(request);
    } finally {
      await this.cleanup();
    }
  }
}
