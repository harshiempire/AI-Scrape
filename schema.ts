import { MessageDict, ToolCallDict } from "./types";

export enum Role {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
  TOOL = "tool",
}

// Get all role values as a tuple-like array
export const ROLE_VALUES = [
  Role.SYSTEM,
  Role.USER,
  Role.ASSISTANT,
  Role.TOOL,
] as const;

// Type that represents any of the role values
export type ROLE_TYPE = (typeof ROLE_VALUES)[number];

export class FunctionCall {
  name: string;
  arguments: string;

  constructor(name: string, args: string) {
    this.name = name;
    this.arguments = args;
  }

  to_dict() {
    return {
      name: this.name,
      arguments: this.arguments,
    };
  }
}

export class ToolCall {
  /** Represents a tool/function call in a message */
  id: string;
  type: string = "function";
  function: FunctionCall;

  constructor(id: string, func: FunctionCall) {
    this.id = id;
    this.function = func;
  }

  to_dict() {
    return {
      id: this.id,
      type: this.type,
      function: this.function.to_dict(),
    };
  }
}

export class Message {
  role: ROLE_TYPE;
  content?: string;
  tool_calls?: ToolCall[];
  name?: string;
  tool_call_id?: string;
  base64_image?: string;

  constructor(
    role: ROLE_TYPE,
    content?: string,
    tool_calls?: ToolCall[],
    name?: string,
    tool_call_id?: string,
    base64_image?: string
  ) {
    this.role = role;
    this.content = content;
    this.tool_calls = tool_calls;
    this.name = name;
    this.tool_call_id = tool_call_id;
    this.base64_image = base64_image;
  }

  add(other: Message | Message[]): Message[] {
    if (Array.isArray(other)) {
      return [this, ...other];
    } else if (other instanceof Message) {
      return [this, other];
    }
    throw new TypeError(
      `Unsupported operand type(s) for add: '${
        this.constructor.name
      }' and '${typeof other}'`
    );
  }

  to_dict(): MessageDict {
    const message: MessageDict = { role: this.role };
    if (this.content) {
      message.content = this.content;
    }
    if (this.tool_calls) {
      message.tool_calls = this.tool_calls.map((tool_call) =>
        tool_call.to_dict()
      );
    }
    if (this.name) {
      message.name = this.name;
    }
    if (this.tool_call_id) {
      message.tool_call_id = this.tool_call_id;
    }
    if (this.base64_image) {
      message.base64_image = this.base64_image;
    }
    return message;
  }

  static user_message(content: string, base64_image?: string) {
    return new Message(
      Role.USER,
      content,
      undefined,
      undefined,
      undefined,
      base64_image
    );
  }

  static system_message(content: string) {
    return new Message(Role.SYSTEM, content);
  }

  static assistant_message(content: string, base64_image?: string) {
    return new Message(
      Role.ASSISTANT,
      content,
      undefined,
      undefined,
      undefined,
      base64_image
    );
  }

  static tool_message(
    content: string,
    name?: string,
    tool_call_id?: string,
    base64_image?: string
  ) {
    return new Message(
      Role.TOOL,
      content,
      undefined,
      name,
      tool_call_id,
      base64_image
    );
  }

  static from_tool_call(
    tool_calls: ToolCall[],
    content?: string,
    base64_image?: string
  ) {
    return new Message(
      Role.ASSISTANT,
      content,
      tool_calls,
      undefined,
      undefined,
      base64_image
    );
  }

  static from_tool_calls(
    tool_calls: ToolCallDict[],
    content: string | string[] = "",
    base64_image?: string
  ): Message {
    // Convert ToolCall objects to the format expected by the constructor
    const formatted_calls: ToolCall[] = tool_calls.map(
      (call) =>
        new ToolCall(
          call.id,
          new FunctionCall(call.function.name, call.function.arguments)
        )
    );

    return new Message(
      Role.ASSISTANT,
      Array.isArray(content) ? content.join("") : content,
      formatted_calls,
      undefined,
      undefined,
      base64_image
    );
  }
}

export class Memory {
  messages: Message[] = [];
  max_messages: number = 100;

  add_message(message: Message) {
    this.messages.push(message);
    if (this.messages.length > this.max_messages) {
      this.messages.shift();
    }
  }

  add_messages(messages: Message[]) {
    this.messages.push(...messages);
    if (this.messages.length > this.max_messages) {
      this.messages.shift();
    }
  }

  clear() {
    this.messages = [];
  }

  to_dict_list() {
    return this.messages.map((message) => message.to_dict());
  }
}

export enum ToolChoice {
  AUTO = "auto",
  NONE = "none",
  REQUIRED = "required",
}

export const TOOL_CHOICE_VALUES = Object.values(ToolChoice);
export type TOOL_CHOICE_TYPE = (typeof TOOL_CHOICE_VALUES)[number];

export interface LLMSettings {
  model: string; // Model name
  base_url: string; // API base URL
  api_key: string; // API key
  max_tokens: number; // Maximum number of tokens per request (default 4096)
  max_input_tokens?: number | null; // Maximum input tokens to use across all requests (None for unlimited)
  temperature: number; // Sampling temperature (default 1.0)
  api_type: string; // Azure, Openai, or Ollama
  api_version: string; // Azure Openai version if AzureOpenai
}
