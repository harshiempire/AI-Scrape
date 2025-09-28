import {
  LLMSettings,
  Message,
  ROLE_VALUES,
  ToolChoice,
  TOOL_CHOICE_VALUES,
} from "../schema";
import { getEncoding, Tiktoken } from "js-tiktoken";
import config from "./config";
import { MessageDict } from "../types";
import { log } from "./logger";
import OpenAI from "openai";
import {
  GoogleGenerativeAI,
  GenerativeModel,
  Content,
  Part,
  Tool,
  FunctionDeclaration,
  FunctionCall,
} from "@google/generative-ai";

// Supported model encodings
type SupportedEncoding = "gpt2" | "cl100k_base" | "o200k_base";

// Model constants
const REASONING_MODELS = ["o1", "o3-mini"];
const MULTIMODAL_MODELS = [
  "gpt-4-vision-preview",
  "gpt-4o",
  "gpt-4o-mini",
  "claude-3-opus-20240229",
  "claude-3-sonnet-20240229",
  "claude-3-haiku-20240307",
  "gemini-pro",
  "gemini-pro-vision",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
];

// Custom exceptions
export class TokenLimitExceeded extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenLimitExceeded";
  }
}

export class LLMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMError";
  }
}

export class ValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValueError";
  }
}

export class TokenCounter {
  BASE_MESSAGE_TOKENS = 4;
  FORMAT_TOKENS = 2;
  LOW_DETAIL_IMAGE_TOKENS = 85;
  HIGH_DETAIL_TILE_TOKENS = 170;
  tokenizer: Tiktoken;
  MAX_SIZE = 2048;
  HIGH_DETAIL_TARGET_SHORT_SIDE = 768;
  TILE_SIZE = 512;

  constructor(modelName?: string, tokenizer?: Tiktoken) {
    // Default to cl100k_base (GPT-4) if no model specified
    const encoding = this.getEncodingForModel(modelName || "gpt-4");
    this.tokenizer = tokenizer || getEncoding(encoding);
  }

  /**
   * Maps model names to their corresponding tiktoken encodings
   */
  private getEncodingForModel(modelName: string): SupportedEncoding {
    const model = modelName.toLowerCase();

    if (model.includes("gpt-4") || model.includes("gpt4")) {
      return "cl100k_base";
    }
    if (model.includes("gpt-3.5") || model.includes("gpt-3")) {
      return "cl100k_base";
    }
    if (model.includes("gpt-2")) {
      return "gpt2";
    }
    if (model.includes("o1")) {
      return "o200k_base";
    }

    // Default to cl100k_base for unknown models
    return "cl100k_base";
  }

  /**
   * Count tokens in text
   */
  count_text(text: string): number {
    if (!text) return 0;
    return this.tokenizer.encode(text).length;
  }

  /**
   * Count tokens in a message (includes base message overhead)
   */
  count_message(text: string): number {
    return this.count_text(text) + this.BASE_MESSAGE_TOKENS;
  }

  /**
   * Calculate tokens for an image based on detail level and dimensions
   *
   * For "low" detail: fixed 85 tokens
   * For "high" detail:
   * 1. Scale to fit in 2048x2048 square
   * 2. Scale shortest side to 768px
   * 3. Count 512px tiles (170 tokens each)
   * 4. Add 85 tokens
   */
  count_image(imageItem: {
    detail?: string;
    dimensions?: [number, number];
  }): number {
    const detail = imageItem.detail || "medium";

    // For low detail, always return fixed token count
    if (detail === "low") {
      return this.LOW_DETAIL_IMAGE_TOKENS;
    }

    // For medium detail (default in OpenAI), use high detail calculation
    // OpenAI doesn't specify a separate calculation for medium

    // For high detail, calculate based on dimensions if available
    if (detail === "high" || detail === "medium") {
      // If dimensions are provided in the image_item
      if (imageItem.dimensions) {
        const [width, height] = imageItem.dimensions;
        return this._calculate_high_detail_tokens(width, height);
      }
    }

    return detail === "high"
      ? this._calculate_high_detail_tokens(1024, 1024)
      : 1024;
  }

  /**
   * Calculate tokens for high detail images based on dimensions
   */
  private _calculate_high_detail_tokens(width: number, height: number): number {
    // Step 1: Scale to fit in MAX_SIZE x MAX_SIZE square
    if (width > this.MAX_SIZE || height > this.MAX_SIZE) {
      const scale = this.MAX_SIZE / Math.max(width, height);
      width = Math.floor(width * scale);
      height = Math.floor(height * scale);
    }

    // Step 2: Scale so shortest side is HIGH_DETAIL_TARGET_SHORT_SIDE
    const scale = this.HIGH_DETAIL_TARGET_SHORT_SIDE / Math.min(width, height);
    const scaledWidth = Math.floor(width * scale);
    const scaledHeight = Math.floor(height * scale);

    // Step 3: Count number of 512px tiles
    const tilesX = Math.ceil(scaledWidth / this.TILE_SIZE);
    const tilesY = Math.ceil(scaledHeight / this.TILE_SIZE);
    const totalTiles = tilesX * tilesY;

    // Step 4: Calculate final token count
    return (
      totalTiles * this.HIGH_DETAIL_TILE_TOKENS + this.LOW_DETAIL_IMAGE_TOKENS
    );
  }

  /**
   * Calculate tokens for message content
   */
  count_content(
    content:
      | string
      | Array<
          | string
          | {
              text?: string;
              image_url?: { detail?: string; dimensions?: [number, number] };
            }
        >
  ): number {
    if (!content) {
      return 0;
    }

    if (typeof content === "string") {
      return this.count_text(content);
    }

    let tokenCount = 0;
    for (const item of content) {
      if (typeof item === "string") {
        tokenCount += this.count_text(item);
      } else if (typeof item === "object" && item !== null) {
        if ("text" in item) {
          tokenCount += this.count_text(item.text || "");
        } else if ("image_url" in item) {
          tokenCount += this.count_image(item.image_url || {});
        }
      }
    }
    return tokenCount;
  }

  /**
   * Calculate tokens for tool calls
   */
  count_tool_calls(
    toolCalls: Array<{ function?: { name?: string; arguments?: string } }>
  ): number {
    let tokenCount = 0;
    for (const toolCall of toolCalls) {
      if (toolCall.function) {
        const func = toolCall.function;
        tokenCount += this.count_text(func.name || "");
        tokenCount += this.count_text(func.arguments || "");
      }
    }
    return tokenCount;
  }

  /**
   * Decode tokens back to text (useful for debugging)
   */
  decode(tokens: number[]): string {
    return this.tokenizer.decode(tokens);
  }

  /**
   * Calculate the total number of tokens in a message list
   */
  count_message_tokens(
    messages: Array<{
      role?: string;
      content?:
        | string
        | Array<
            | string
            | {
                text?: string;
                image_url?: { detail?: string; dimensions?: [number, number] };
              }
          >;
      tool_calls?: Array<{ function?: { name?: string; arguments?: string } }>;
      name?: string;
      tool_call_id?: string;
    }>
  ): number {
    let totalTokens = this.FORMAT_TOKENS; // Base format tokens

    for (const message of messages) {
      let tokens = this.BASE_MESSAGE_TOKENS; // Base tokens per message

      // Add role tokens
      tokens += this.count_text(message.role || "");

      // Add content tokens
      if (message.content) {
        tokens += this.count_content(message.content);
      }

      // Add tool calls tokens
      if (message.tool_calls) {
        tokens += this.count_tool_calls(message.tool_calls);
      }

      // Add name and tool_call_id tokens
      tokens += this.count_text(message.name || "");
      tokens += this.count_text(message.tool_call_id || "");

      totalTokens += tokens;
    }

    return totalTokens;
  }

  /**
   * Encode text to tokens
   */
  encode(text: string): number[] {
    return this.tokenizer.encode(text);
  }

  /**
   * Get the maximum context length for the current model
   */
  getMaxContextLength(): number {
    return this.MAX_SIZE;
  }

  /**
   * Check if text exceeds token limit
   */
  exceedsLimit(text: string, limit?: number): boolean {
    const maxTokens = limit || this.MAX_SIZE;
    return this.count_text(text) > maxTokens;
  }
}

// Gemini Adapter to translate OpenAI interface to Gemini API
class GeminiAdapter {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(apiKey: string, modelName: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  // Convert OpenAI messages to Gemini format
  private convertMessages(messages: MessageDict[]): Content[] {
    return messages.map((msg) => {
      const parts: Part[] = [];

      if (typeof msg.content === "string") {
        parts.push({ text: msg.content });
      } else if (Array.isArray(msg.content)) {
        for (const item of msg.content as any[]) {
          if (typeof item === "string") {
            parts.push({ text: item });
          } else if (typeof item === "object" && item !== null) {
            if ("text" in item) {
              parts.push({ text: item.text || "" });
            } else if ("image_url" in item && item.image_url) {
              // Handle base64 images
              const url = item.image_url.url;
              if (url.startsWith("data:image/")) {
                const base64Data = url.split(",")[1];
                parts.push({
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Data,
                  },
                });
              }
            }
          }
        }
      }

      return {
        parts,
        role: msg.role === "assistant" ? "model" : msg.role,
      };
    });
  }

  // Convert OpenAI tools to Gemini format
  private convertTools(tools: any[]): Tool[] {
    const functionDeclarations: FunctionDeclaration[] = tools
      .filter((tool) => tool.type === "function")
      .map((tool) => ({
        name: tool.function.name,
        description: tool.function.description || "",
        parameters: tool.function.parameters || {},
      }));

    return functionDeclarations.length > 0 ? [{ functionDeclarations }] : [];
  }

  // Convert Gemini response to OpenAI format
  private convertResponse(geminiResponse: any): any {
    const response = geminiResponse.response;

    // Handle function calls
    if (response.functionCalls && response.functionCalls.length > 0) {
      const toolCalls = response.functionCalls.map((fc: FunctionCall) => ({
        id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: "function",
        function: {
          name: fc.name,
          arguments: JSON.stringify(fc.args || {}),
        },
      }));

      return {
        choices: [
          {
            message: {
              role: "assistant",
              content: response.text() || null,
              tool_calls: toolCalls,
            },
          },
        ],
        usage: {
          prompt_tokens: 0, // Gemini doesn't provide exact token counts
          completion_tokens: 0,
          total_tokens: 0,
        },
      };
    }

    // Regular text response
    return {
      choices: [
        {
          message: {
            role: "assistant",
            content: response.text(),
          },
        },
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  }

  // Main interface that mimics OpenAI's chat.completions.create
  chat = {
    completions: {
      create: async (params: any) => {
        const {
          model,
          messages,
          tools,
          tool_choice,
          temperature,
          stream,
          ...otherParams
        } = params;

        const geminiMessages = this.convertMessages(messages);
        const geminiTools = tools ? this.convertTools(tools) : undefined;

        const generationConfig: any = {
          temperature: temperature || 0.7,
          ...otherParams,
        };

        if (stream) {
          // Handle streaming
          const result = await this.model.generateContentStream({
            contents: geminiMessages,
            tools: geminiTools,
            generationConfig,
          });

          return {
            [Symbol.asyncIterator]: async function* () {
              for await (const chunk of result.stream) {
                yield {
                  choices: [
                    {
                      delta: {
                        content: chunk.text(),
                      },
                    },
                  ],
                };
              }
            },
          };
        } else {
          // Non-streaming
          const result = await this.model.generateContent({
            contents: geminiMessages,
            tools: geminiTools,
            generationConfig,
          });

          return this.convertResponse(result);
        }
      },
    },
  };
}

export class LLM {
  private static instances: Map<string, LLM> = new Map();

  private client: any;
  private tokenizer!: Tiktoken;

  // Attributes
  private model!: string;
  private max_tokens!: number;
  private temperature!: number;
  private api_type!: string;
  private api_key!: string;
  private api_version?: string;
  private base_url?: string;
  private max_input_tokens?: number;

  public total_input_tokens: number = 0;
  public total_completion_tokens: number = 0;
  private token_counter!: TokenCounter;
  /**
   * Singleton pattern equivalent to Python's __new__
   */
  static getInstance(
    config_name: string = "default",
    llm_config?: LLMSettings
  ): LLM {
    if (!this.instances.has(config_name)) {
      const instance = new LLM(config_name, llm_config);
      this.instances.set(config_name, instance);
    }
    return this.instances.get(config_name)!;
  }

  private constructor(config_name: string, llm_config_var?: LLMSettings) {
    // Only initialize if not already initialized (equivalent to Python's hasattr check)
    if (!this.client) {
      // Use provided config or default config
      const config_llm = config.llm();
      let llm_config = llm_config_var || config_llm;
      llm_config =
        config_llm[config_name] || config_llm["default"] || llm_config;

      this.model = llm_config.model;
      this.max_tokens = llm_config.max_tokens;
      this.temperature = llm_config.temperature;
      this.api_type = llm_config.api_type;
      this.api_key = llm_config.api_key;
      this.api_version = llm_config.api_version;
      this.base_url = llm_config.base_url;

      // Add token counting related attributes
      this.total_input_tokens = 0;
      this.total_completion_tokens = 0;
      this.max_input_tokens = llm_config.max_input_tokens || undefined;

      // Initialize tokenizer
      try {
        this.tokenizer = getEncoding("cl100k_base");
      } catch (error) {
        // If the model is not in tiktoken's presets, use cl100k_base as default
        this.tokenizer = getEncoding("cl100k_base");
      }

      // Initialize client based on API type
      if (this.api_type === "azure") {
        this.client = new OpenAI({
          baseURL: this.base_url,
          apiKey: this.api_key,
          defaultQuery: { "api-version": this.api_version },
        });
      } else if (this.api_type === "aws") {
        // TODO: Implement AWS Bedrock client
        // this.client = new BedrockClient();
        this.client = null; // Placeholder for AWS client
      } else if (this.api_type === "gemini") {
        this.client = new GeminiAdapter(this.api_key, this.model);
      } else {
        this.client = new OpenAI({
          apiKey: this.api_key,
          baseURL: this.base_url,
        });
      }
      this.token_counter = new TokenCounter(this.model, this.tokenizer);
    }
  }

  /**
   * Format messages for LLM by converting them to OpenAI message format.
   */
  static format_messages(
    messages: (Message | MessageDict)[],
    supports_images: boolean = false
  ): MessageDict[] {
    const formatted_messages: MessageDict[] = [];

    for (const message of messages) {
      // Convert Message objects to dictionaries
      let message_dict: MessageDict;
      if (message instanceof Message) {
        message_dict = message.to_dict();
      } else if (typeof message === "object" && message !== null) {
        message_dict = message as MessageDict;
      } else {
        throw new TypeError(`Unsupported message type: ${typeof message}`);
      }

      // Validate required fields
      if (!message_dict.role) {
        throw new ValueError("Message dict must contain 'role' field");
      }

      // Process base64 images if present and model supports images
      if (supports_images && message_dict.base64_image) {
        // Initialize or convert content to appropriate format
        if (!message_dict.content) {
          (message_dict as any).content = [];
        } else if (typeof message_dict.content === "string") {
          (message_dict as any).content = [
            { type: "text", text: message_dict.content },
          ];
        } else if (Array.isArray(message_dict.content)) {
          // Convert string items to proper text objects
          (message_dict as any).content = (message_dict.content as any[]).map(
            (item: any) =>
              typeof item === "string" ? { type: "text", text: item } : item
          );
        }

        // Add the image to content
        (message_dict as any).content.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${message_dict.base64_image}`,
          },
        });

        // Remove the base64_image field
        delete message_dict.base64_image;
      }
      // If model doesn't support images but message has base64_image, handle gracefully
      else if (!supports_images && message_dict.base64_image) {
        // Just remove the base64_image field and keep the text content
        delete message_dict.base64_image;
      }

      if (message_dict.content || message_dict.tool_calls) {
        formatted_messages.push(message_dict);
      }
    }

    // Validate all messages have required fields
    for (const msg of formatted_messages) {
      if (!ROLE_VALUES.includes(msg.role as any)) {
        throw new ValueError(`Invalid role: ${msg.role}`);
      }
    }

    return formatted_messages;
  }

  /**
   * Retry logic with exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 6
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry token limit errors
        if (error instanceof TokenLimitExceeded) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === maxAttempts) {
          break;
        }

        // Calculate wait time with exponential backoff and jitter
        const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 60000);
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;

        log.warn(
          `Attempt ${attempt} failed, retrying in ${Math.round(delay)}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Send a prompt to the LLM and get the response.
   */
  async ask(
    messages: (Message | MessageDict)[],
    system_msgs?: (Message | MessageDict)[],
    stream: boolean = true,
    temperature?: number
  ): Promise<string> {
    return this.withRetry(async () => {
      try {
        // Check if the model supports images
        const supports_images = MULTIMODAL_MODELS.includes(this.model);

        // Format system and user messages with image support check
        let all_messages: MessageDict[];
        if (system_msgs) {
          const formatted_system_msgs = LLM.format_messages(
            system_msgs,
            supports_images
          );
          const formatted_messages = LLM.format_messages(
            messages,
            supports_images
          );
          all_messages = [...formatted_system_msgs, ...formatted_messages];
        } else {
          all_messages = LLM.format_messages(messages, supports_images);
        }

        // Calculate input token count
        const input_tokens = this.count_message_tokens(all_messages);

        // Check if token limits are exceeded
        if (!this.check_token_limit(input_tokens)) {
          const error_message = this.get_limit_error_message(input_tokens);
          throw new TokenLimitExceeded(error_message);
        }

        const params: any = {
          model: this.model,
          messages: all_messages,
        };

        if (REASONING_MODELS.includes(this.model)) {
          params.max_completion_tokens = this.max_tokens;
        } else {
          params.max_tokens = this.max_tokens;
          params.temperature =
            temperature !== undefined ? temperature : this.temperature;
        }

        if (!stream) {
          // Non-streaming request
          const response = await this.client.chat.completions.create({
            ...params,
            stream: false,
          });

          if (!response.choices || !response.choices[0].message.content) {
            throw new ValueError("Empty or invalid response from LLM");
          }

          // Update token counts
          this.update_token_count(
            response.usage.prompt_tokens,
            response.usage.completion_tokens
          );

          return response.choices[0].message.content;
        }

        // Streaming request
        this.update_token_count(input_tokens);

        const response = await this.client.chat.completions.create({
          ...params,
          stream: true,
        });

        const collected_messages: string[] = [];
        let completion_text = "";

        for await (const chunk of response) {
          const chunk_message = chunk.choices[0].delta.content || "";
          collected_messages.push(chunk_message);
          completion_text += chunk_message;
          process.stdout.write(chunk_message);
        }

        log.info(""); // Newline after streaming
        const full_response = collected_messages.join("").trim();

        if (!full_response) {
          throw new ValueError("Empty response from streaming LLM");
        }

        // Estimate completion tokens for streaming response
        const completion_tokens = this.count_tokens(completion_text);
        log.info(
          `Estimated completion tokens for streaming response: ${completion_tokens}`
        );
        this.total_completion_tokens += completion_tokens;

        return full_response;
      } catch (error) {
        if (error instanceof TokenLimitExceeded) {
          throw error;
        }

        log.exception("Error in ask method", error as Error);
        throw new LLMError(`Failed to get response from LLM: ${error}`);
      }
    });
  }

  /**
   * Check if token limits are exceeded
   */
  private check_token_limit(input_tokens: number): boolean {
    if (this.max_input_tokens !== undefined) {
      return this.total_input_tokens + input_tokens <= this.max_input_tokens;
    }
    return true;
  }

  /**
   * Generate error message for token limit exceeded
   */
  private get_limit_error_message(input_tokens: number): string {
    if (
      this.max_input_tokens !== undefined &&
      this.total_input_tokens + input_tokens > this.max_input_tokens
    ) {
      return `Request may exceed input token limit (Current: ${this.total_input_tokens}, Needed: ${input_tokens}, Max: ${this.max_input_tokens})`;
    }
    return "Token limit exceeded";
  }

  count_tokens(text: string): number {
    if (!text) return 0;
    return this.tokenizer.encode(text).length;
  }

  count_message_tokens(messages: any[]): number {
    return this.token_counter.count_message_tokens(messages);
  }

  private update_token_count(
    input_tokens: number,
    completion_tokens: number = 0
  ): void {
    this.total_input_tokens += input_tokens;
    this.total_completion_tokens += completion_tokens;
    log.info(
      `Token usage: Input=${input_tokens}, Completion=${completion_tokens}, ` +
        `Cumulative Input=${this.total_input_tokens}, Cumulative Completion=${this.total_completion_tokens}, ` +
        `Total=${input_tokens + completion_tokens}, Cumulative Total=${
          this.total_input_tokens + this.total_completion_tokens
        }`
    );
  }

  // /**
  //  * Update token counts
  //  */
  // private update_token_count(
  //   input_tokens: number,
  //   completion_tokens: number = 0
  // ): void {
  //   this.total_input_tokens += input_tokens;
  //   this.total_completion_tokens += completion_tokens;
  //   log.info(
  //     `Token usage: Input=${input_tokens}, Completion=${completion_tokens}, ` +
  //       `Cumulative Input=${this.total_input_tokens}, Cumulative Completion=${this.total_completion_tokens}, ` +
  //       `Total=${input_tokens + completion_tokens}, Cumulative Total=${
  //         this.total_input_tokens + this.total_completion_tokens
  //       }`
  //   );
  // }

  /**
   * Ask LLM using functions/tools and return the response.
   */
  async ask_tool(
    messages: (Message | MessageDict)[],
    system_msgs?: (Message | MessageDict)[],
    timeout: number = 300,
    tools?: object[],
    tool_choice: ToolChoice = ToolChoice.AUTO,
    temperature?: number,
    ...kwargs: any[]
  ): Promise<any | null> {
    return this.withRetry(async () => {
      try {
        // Validate tool_choice
        if (!TOOL_CHOICE_VALUES.includes(tool_choice)) {
          throw new ValueError(`Invalid tool_choice: ${tool_choice}`);
        }

        // Check if the model supports images
        const supports_images = MULTIMODAL_MODELS.includes(this.model);

        // Format messages
        let all_messages: MessageDict[];
        if (system_msgs) {
          const formatted_system_msgs = LLM.format_messages(
            system_msgs,
            supports_images
          );
          const formatted_messages = LLM.format_messages(
            messages,
            supports_images
          );
          all_messages = [...formatted_system_msgs, ...formatted_messages];
        } else {
          all_messages = LLM.format_messages(messages, supports_images);
        }

        // Calculate input token count
        let input_tokens = this.count_message_tokens(all_messages);

        // If there are tools, calculate token count for tool descriptions
        let tools_tokens = 0;
        if (tools) {
          for (const tool of tools) {
            tools_tokens += this.count_tokens(JSON.stringify(tool));
          }
        }

        input_tokens += tools_tokens;

        // Check if token limits are exceeded
        if (!this.check_token_limit(input_tokens)) {
          const error_message = this.get_limit_error_message(input_tokens);
          throw new TokenLimitExceeded(error_message);
        }

        // Validate tools if provided
        if (tools) {
          for (const tool of tools) {
            if (
              typeof tool !== "object" ||
              tool === null ||
              !("type" in tool)
            ) {
              throw new ValueError(
                "Each tool must be an object with 'type' field"
              );
            }
          }
        }

        // Set up the completion request
        const params: any = {
          model: this.model,
          messages: all_messages,
          tools: tools,
          tool_choice: tool_choice,
          timeout: timeout,
          ...kwargs,
        };

        if (REASONING_MODELS.includes(this.model)) {
          params.max_completion_tokens = this.max_tokens;
        } else {
          params.max_tokens = this.max_tokens;
          params.temperature =
            temperature !== undefined ? temperature : this.temperature;
        }

        params.stream = false; // Always use non-streaming for tool requests

        const response = await this.client.chat.completions.create(params);

        // Check if response is valid
        if (!response.choices || !response.choices[0].message) {
          log.info("Response:", response);
          return null;
        }

        // Update token counts
        this.update_token_count(
          response.usage.prompt_tokens,
          response.usage.completion_tokens
        );

        return response.choices[0].message;
      } catch (error) {
        if (error instanceof TokenLimitExceeded) {
          throw error;
        }

        if (error instanceof ValueError) {
          log.error(`Validation error in ask_tool: ${error.message}`);
          throw error;
        }

        log.error(`Error in ask_tool: ${error}`);
        throw new LLMError(`Failed to get tool response from LLM: ${error}`);
      }
    });
  }

  /**
   * Send a prompt with images to the LLM and get the response.
   */
  async ask_with_images(
    messages: (Message | MessageDict)[],
    images: (string | object)[],
    system_msgs?: (Message | MessageDict)[],
    stream: boolean = false,
    temperature?: number
  ): Promise<string> {
    return this.withRetry(async () => {
      try {
        // For ask_with_images, we always set supports_images to True because
        // this method should only be called with models that support images
        if (!MULTIMODAL_MODELS.includes(this.model)) {
          throw new ValueError(
            `Model ${this.model} does not support images. Use a model from ${MULTIMODAL_MODELS}`
          );
        }

        // Format messages with image support
        const formatted_messages = LLM.format_messages(messages, true);

        // Ensure the last message is from the user to attach images
        if (
          !formatted_messages ||
          formatted_messages[formatted_messages.length - 1].role !== "user"
        ) {
          throw new ValueError(
            "The last message must be from the user to attach images"
          );
        }

        // Process the last user message to include images
        const last_message = formatted_messages[formatted_messages.length - 1];

        // Convert content to multimodal format if needed
        let content = last_message.content;
        let multimodal_content: any[] = [];

        if (typeof content === "string") {
          multimodal_content = [{ type: "text", text: content }];
        } else if (Array.isArray(content)) {
          multimodal_content = content;
        } else {
          multimodal_content = [];
        }

        // Add images to content
        for (const image of images) {
          if (typeof image === "string") {
            multimodal_content.push({
              type: "image_url",
              image_url: { url: image },
            });
          } else if (typeof image === "object" && image !== null) {
            const imageObj = image as any;
            if ("url" in imageObj) {
              multimodal_content.push({
                type: "image_url",
                image_url: imageObj,
              });
            } else if ("image_url" in imageObj) {
              multimodal_content.push(imageObj);
            } else {
              throw new ValueError(`Unsupported image format: ${image}`);
            }
          } else {
            throw new ValueError(`Unsupported image format: ${image}`);
          }
        }

        // Update the message with multimodal content
        (last_message as any).content = multimodal_content;

        // Add system messages if provided
        let all_messages: MessageDict[];
        if (system_msgs) {
          const formatted_system_msgs = LLM.format_messages(system_msgs, true);
          all_messages = [...formatted_system_msgs, ...formatted_messages];
        } else {
          all_messages = formatted_messages;
        }

        // Calculate tokens and check limits
        const input_tokens = this.count_message_tokens(all_messages);
        if (!this.check_token_limit(input_tokens)) {
          throw new TokenLimitExceeded(
            this.get_limit_error_message(input_tokens)
          );
        }

        // Set up API parameters
        const params: any = {
          model: this.model,
          messages: all_messages,
          stream: stream,
        };

        // Add model-specific parameters
        if (REASONING_MODELS.includes(this.model)) {
          params.max_completion_tokens = this.max_tokens;
        } else {
          params.max_tokens = this.max_tokens;
          params.temperature =
            temperature !== undefined ? temperature : this.temperature;
        }

        // Handle non-streaming request
        if (!stream) {
          const response = await this.client.chat.completions.create(params);

          if (!response.choices || !response.choices[0].message.content) {
            throw new ValueError("Empty or invalid response from LLM");
          }

          this.update_token_count(response.usage.prompt_tokens);
          return response.choices[0].message.content;
        }

        // Handle streaming request
        this.update_token_count(input_tokens);
        const response = await this.client.chat.completions.create(params);

        const collected_messages: string[] = [];
        for await (const chunk of response) {
          const chunk_message = chunk.choices[0].delta.content || "";
          collected_messages.push(chunk_message);
          process.stdout.write(chunk_message);
        }

        process.stdout.write("\n"); // Newline after streaming
        const full_response = collected_messages.join("").trim();

        if (!full_response) {
          throw new ValueError("Empty response from streaming LLM");
        }

        return full_response;
      } catch (error) {
        if (error instanceof TokenLimitExceeded) {
          throw error;
        }
        if (error instanceof ValueError) {
          log.error(`Validation error in ask_with_images: ${error.message}`);
          throw error;
        }
        if (error && typeof error === "object" && "name" in error) {
          const errorName = (error as any).name;
          if (
            errorName === "OpenAIError" ||
            errorName === "AuthenticationError" ||
            errorName === "RateLimitError" ||
            errorName === "APIError"
          ) {
            log.error(`OpenAI API error: ${(error as any).message}`);
            if (errorName === "AuthenticationError") {
              log.error("Authentication failed. Check API key.");
            } else if (errorName === "RateLimitError") {
              log.error(
                "Rate limit exceeded. Consider increasing retry attempts."
              );
            } else if (errorName === "APIError") {
              log.error(`API error: ${(error as any).message}`);
            }
            throw error;
          }
        }
        log.error(`Unexpected error in ask_with_images: ${error}`);
        throw new LLMError(`Failed to get response from LLM: ${error}`);
      }
    });
  }
}
