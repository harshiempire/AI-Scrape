import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LLM, GenerateParams, LLMOutput } from "./types";

function safeJsonParse<T>(input: string): T | null {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

export class OpenAILLM implements LLM {
  private openai: OpenAI;
  private model: string;

  constructor(params: { model: string; apiKey?: string }) {
    const { model, apiKey } = params;
    this.model = model;
    this.openai = new OpenAI({
      apiKey: apiKey ?? process.env.OPENAI_API_KEY,
    });
  }

  async generate(params: GenerateParams): Promise<LLMOutput> {
    const { prompt, stop, ...otherParams } = params;
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      stop: stop,
      ...otherParams,
    });
    const message = response.choices[0].message;
    return {
      text: message.content ?? "",
      raw: response,
      stopReason: response.choices[0].finish_reason,
    };
  }
}

export class GeminiLLM implements LLM {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(params: { model: string; apiKey?: string }) {
    const { model, apiKey } = params;
    this.model = model;
    this.client = new GoogleGenerativeAI(apiKey ?? process.env.GOOGLE_API_KEY ?? "");
  }

  async generate(params: GenerateParams): Promise<LLMOutput> {
    const { prompt, stop, ...otherParams } = params;
    const model = this.client.getGenerativeModel({ model: this.model });
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        stopSequences: stop,
        ...otherParams,
      },
    });
    
    const text = result.response.text() ?? "";
    return {
      text,
      raw: result,
    };
  }
}
