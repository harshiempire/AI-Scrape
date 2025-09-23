import { BaseAgent } from "./base";
import { LLM, AgentState } from "../../types";
import { Memory } from "../../schema";

export abstract class ReActAgent extends BaseAgent {
  name: string;
  description?: string;
  system_prompt?: string;
  next_step_prompt?: string;
  llm: LLM;
  memory: Memory;
  state: AgentState = AgentState.IDLE;
  max_steps: number = 10;
  current_step: number = 0;

  constructor(props: {
    name: string;
    description?: string;
    system_prompt?: string;
    next_step_prompt?: string;
    llm?: LLM;
    memory?: Memory;
    state?: AgentState;
    max_steps?: number;
  }) {
    super({
      name: props.name,
      description: props.description,
      system_prompt: props.system_prompt,
      next_step_prompt: props.next_step_prompt,
      llm: props.llm || new LLM(props.name.toLowerCase()),
      memory: props.memory || new Memory(),
      state: props.state || AgentState.IDLE,
      max_steps: props.max_steps || 10,
      duplicate_threshold: 0.5,
    });

    this.name = props.name;
    this.description = props.description;
    this.system_prompt = props.system_prompt;
    this.next_step_prompt = props.next_step_prompt;
    this.llm = props.llm || new LLM(props.name.toLowerCase());
    this.memory = props.memory || new Memory();
    this.state = props.state || AgentState.IDLE;
    this.max_steps = props.max_steps || 10;
    this.current_step = 0;
  }

  /**
   * Process current state and decide next action
   */
  abstract think(): Promise<boolean>;

  /**
   * Execute decided actions
   */
  abstract act(): Promise<string>;

  async step(): Promise<string> {
    const should_act = await this.think();
    if (!should_act) {
      return "Thinking complete - no action needed";
    }
    return await this.act();
  }
}
