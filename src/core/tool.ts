import { ZodTypeAny } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

export type ToolInput = Record<string, any>;
export type ToolOutput = any;

export interface ToolOptions {
  name: string;
  description: string;
  schema?: ZodTypeAny; // optional validation
  func: (input: ToolInput) => Promise<ToolOutput> | ToolOutput;
}

export class Tool {
  name: string;
  description: string;
  schema?: ZodTypeAny;
  private func: (input: ToolInput) => Promise<ToolOutput>;

  constructor({ name, description, schema, func }: ToolOptions) {
    this.name = name;
    this.description = description;
    this.schema = schema;
    this.func = async (input: ToolInput) => {
      // validate if schema provided
      if (schema) {
        const parsed = schema.parse(input);
        return await func(parsed);
      }
      return await func(input);
    };
  }

  async run(input: ToolInput): Promise<ToolOutput> {
    return this.func(input);
  }

  getMetadata() {
    return {
      name: this.name,
      description: this.description,
      schema: this.schema ? zodToJsonSchema(this.schema, this.name) : undefined,
    };
  }
}
