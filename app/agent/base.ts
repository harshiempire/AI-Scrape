import { Memory, Role, Message } from "../../schema";
import {
  LLM,
  AgentState,
  BaseAgentProps,
  BaseAgentInput,
  BaseAgentPropsSchema,
} from "../../types";

export abstract class BaseAgent {
  name: string;
  description?: string;
  system_prompt?: string;
  next_step_prompt?: string;
  llm: LLM;
  memory: Memory;
  state: AgentState;
  max_steps: number;
  current_step: number;
  duplicate_threshold: number;
  constructor({
    name,
    description,
    system_prompt,
    next_step_prompt,
    llm,
    memory,
    state = AgentState.IDLE,
    max_steps = 10,
    duplicate_threshold = 0.5,
  }: BaseAgentProps) {
    this.name = name;
    this.description = description;
    this.system_prompt = system_prompt;
    this.next_step_prompt = next_step_prompt;
    this.llm = llm;
    this.memory = memory;
    this.state = state;
    this.max_steps = max_steps;
    this.current_step = 0;
    this.duplicate_threshold = duplicate_threshold;
  }

  static initialize_agent<T extends BaseAgent>(
    this: new (props: BaseAgentProps) => T,
    input: BaseAgentInput
  ): T {
    const props = BaseAgentPropsSchema.parse(input);
    return new this(props);
  }

  private async withStateContext<T>(
    newState: AgentState,
    fn: () => Promise<T>
  ): Promise<T> {
    const previousState = this.state;
    this.state = newState;

    try {
      return await fn();
    } catch (error) {
      this.state = AgentState.ERROR;
      throw error;
    } finally {
      this.state = previousState;
    }
  }

  update_memory(
    role: Role,
    content: string,
    base64_image?: string,
    ...kwargs: unknown[]
  ) {
    const messageMap = {
      user: Message.user_message,
      system: Message.system_message,
      assistant: Message.assistant_message,
    } as const;

    if (!(role in messageMap)) {
      throw new Error(`Unsupported message role: ${role}`);
    }

    let message: Message;

    if (role === Role.TOOL) {
      const toolKwargs =
        (kwargs[0] as { name?: string; tool_call_id?: string }) || {};
      message = Message.tool_message(
        content,
        toolKwargs.name,
        toolKwargs.tool_call_id,
        base64_image
      );
    } else {
      message = messageMap[role](content, base64_image);
    }

    this.memory.add_message(message);
  }

  async run(request?: string): Promise<string> {
    if (this.state !== AgentState.IDLE) {
      throw new Error("Cannot run agent from state: " + this.state);
    }

    if (request) {
      this.update_memory(Role.USER, request);

      return await this.withStateContext(AgentState.RUNNING, async () => {
        const results: string[] = [];

        while (
          this.current_step < this.max_steps &&
          this.state !== AgentState.COMPLETED
        ) {
          this.current_step += 1;
          console.log(`Executing step ${this.current_step}/${this.max_steps}`);

          const step_result = await this.step();

          if (this.is_stuck()) {
            this.handle_stuck_state();
          }

          results.push(`Step ${this.current_step}: ${step_result}`);
        }

        if (this.current_step >= this.max_steps) {
          this.current_step = 0;
          this.state = AgentState.IDLE;
          results.push(`Terminated: Reached max steps (${this.max_steps})`);
        }

        // await this.cleanup();
        return results.length > 0 ? results.join("\n") : "No steps executed";
      });
    }

    return "No request provided";
  }

  /**
   * Execute a single step in the agent's workflow.
   * Must be implemented by subclasses to define specific behavior.
   */
  abstract step(): Promise<string>;

  handle_stuck_state(): void {
    const stuck_message =
      "Observed duplicate responses. Consider new strategies and avoid repeating ineffective paths already attempted";

    this.next_step_prompt = `${stuck_message}\n${this.next_step_prompt}`;
    console.warn(
      `Agent detected stuck state. Added prompt: ${this.next_step_prompt}`
    );
  }

  is_stuck(): boolean {
    if (this.memory.messages.length < 2) {
      return false;
    }
    const last_message = this.memory.messages[this.memory.messages.length - 1];
    if (!last_message.content) {
      return false;
    }

    let duplicate_count = 0;
    for (const msg of this.memory.messages.reverse()) {
      if (msg.role === Role.ASSISTANT && msg.content === last_message.content) {
        duplicate_count++;
      }
    }
    return duplicate_count >= this.duplicate_threshold;
  }

  get messages(): Message[] {
    return this.memory.messages;
  }
  set messages(messages: Message[]) {
    this.memory.messages = messages;
  }
}
