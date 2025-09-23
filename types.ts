import { z } from "zod";
import { Memory } from "./schema";
export enum AgentState {
  IDLE = "idle",
  RUNNING = "running",
  COMPLETED = "completed",
  ERROR = "error",
}

// Message-related types
export interface FunctionCallDict {
  name: string;
  arguments: string;
}

export interface ToolCallDict {
  id: string;
  type: string;
  function: FunctionCallDict;
}

export interface MessageDict {
  role: string;
  content?: string;
  tool_calls?: ToolCallDict[];
  name?: string;
  tool_call_id?: string;
  base64_image?: string;
}

// Define LLM and Memory classes/interfaces first
export class LLM {
  constructor(public config_name: string) {}
}

// Original interface (keep for backward compatibility)
export interface BaseAgentProps {
  name: string;
  description?: string;
  system_prompt?: string;
  next_step_prompt?: string;
  llm: LLM;
  memory: Memory;
  state?: AgentState;
  max_steps?: number;
  duplicate_threshold?: number;
}

// Zod schemas for validation
export const LLMSchema = z.object({
  config_name: z.string(),
});

export const MemorySchema = z
  .object({
    messages: z.array(z.any()).optional(),
    max_messages: z.number().optional(),
  })
  .transform(() => new Memory()); // Transform to Memory instance

// Input schema (what users provide)
export const BaseAgentInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  system_prompt: z.string().optional(),
  next_step_prompt: z.string().optional(),
  llm: LLMSchema.optional(),
  memory: MemorySchema.optional(),
  state: z.nativeEnum(AgentState).optional(),
  max_steps: z.number().optional(),
  duplicate_threshold: z.number().optional(),
});

// Output schema with validation (like @model_validator(mode="after"))
export const BaseAgentPropsSchema = BaseAgentInputSchema.transform((data) => {
  return {
    name: data.name,
    description: data.description,
    system_prompt: data.system_prompt,
    next_step_prompt: data.next_step_prompt,
    llm: data.llm || new LLM(data.name.toLowerCase()),
    memory: data.memory || new Memory(), // Fix: Create Memory instance
    state: data.state || AgentState.IDLE,
    max_steps: data.max_steps || 10,
    duplicate_threshold: data.duplicate_threshold || 0.5,
  };
});

// Type inference from schema
export type BaseAgentInput = z.infer<typeof BaseAgentInputSchema>;
export type BaseAgentValidatedProps = z.infer<typeof BaseAgentPropsSchema>;

// Define the schema
export const ToolResultSchema = z.object({
  output: z.any().optional(),
  error: z.string().optional(),
  base64_image: z.string().optional(),
  system: z.string().optional(),
});

export type ToolResultType = z.infer<typeof ToolResultSchema>;
