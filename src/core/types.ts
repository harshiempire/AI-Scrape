import { ZodTypeAny } from "zod";

export interface Tool<Input = any, Output = any> {
  name: string;
  description: string;
  schema?: ZodTypeAny;
  run(input: Input): Promise<Output>;
}

export interface ToolMeta<Input = any> {
  name: string;
  description: string;
  schema?: ZodTypeAny;
  methodName: string;
  originalMethod: (...args: any[]) => any;
}

type Role = "system" | "user" | "assistant";
export interface ChatMessage {
  role: Role;
  content: string;
}

export interface Memory {
  load(): Promise<ChatMessage[]>;
  store(message: ChatMessage): Promise<void>;
  clear?(): Promise<void>;
}

export interface LLM {
  generate(params: GenerateParams): Promise<LLMOutput>;
}

export interface GenerateParams {
  prompt: string;
  stop?: string[];
  [key: string]: any;
}

export interface LLMOutput {
  text: string;
  toolCalls?: any;
  raw?: any;
  stopReason?: string;
}
