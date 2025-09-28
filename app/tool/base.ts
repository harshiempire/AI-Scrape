import { ZodSchema, ZodTypeAny } from "zod";
import { ToolResultSchema, ToolResultType } from "../../types";
import zodToJsonSchema from "zod-to-json-schema";
import { log } from "../logger";

export class ToolResult implements ToolResultType {
  output?: any;
  error?: string;
  base64_image?: string;
  system?: string;

  constructor(props: ToolResultType) {
    const validated = ToolResultSchema.parse(props);
    Object.assign(this, validated);
    log.debug("ToolResult created", { result: this });
  }

  to_bool() {
    for (const key in this) {
      if (this[key] !== undefined && this[key] !== null) {
        return true;
      }
    }
    return false;
  }

  add(other: ToolResult) {
    function combine_fields(
      field?: string,
      other_field?: string,
      concatenate: boolean = true
    ) {
      if (field && other_field) {
        if (concatenate) {
          return field + other_field;
        }
        throw new Error("Cannot combine tool results");
      }
      return field || other_field;
    }
    return new ToolResult({
      output: combine_fields(this.output, other.output),
      error: combine_fields(this.error, other.error),
      base64_image: combine_fields(
        this.base64_image,
        other.base64_image,
        false
      ),
      system: combine_fields(this.system, other.system),
    });
  }

  toString() {
    return `${this.error ? "Error:" + this.error : this.output}`;
  }

  replace(kwargs: Partial<ToolResultType>): ToolResult {
    return new ToolResult({
      ...this,
      ...kwargs,
    });
  }

  to_dict(): ToolResultType {
    return {
      output: this.output,
      error: this.error,
      base64_image: this.base64_image,
      system: this.system,
    };
  }
}

export abstract class BaseTool {
  name: string;
  description: string;
  schema?: ZodTypeAny;
  parameters?: Record<string, any>; // JSON schema

  constructor(props: {
    name: string;
    description: string;
    schema?: ZodTypeAny;
  }) {
    this.name = props.name;
    this.description = props.description;
    this.schema = props.schema;

    this.parameters = this.schema
      ? zodToJsonSchema(this.schema, this.name)
      : undefined;
  }

  abstract execute(kwargs: Record<string, any>): any;

  to_param() {
    return {
      type: "function",
      function: {
        name: this.name,
        description: this.description,
        parameters: this.parameters,
      },
    };
  }

  success_response(data: Record<string, any> | string): ToolResultType {
    if (typeof data === "string") {
      return new ToolResult({
        output: data,
      });
    }
    log.debug(`Created success response for ${this.constructor.name}`);
    return new ToolResult({
      output: JSON.stringify(data, null, 2),
    });
  }

  fail_response(msg: string): ToolResultType {
    log.warn(`Tool ${this.constructor.name} returned failed result: ${msg}`);
    return new ToolResult({
      error: msg,
    });
  }
}

/** A ToolResult that can be rendered as a CLI output. */
export class CLIResult extends ToolResult {}

/** A ToolResult that indicates a tool failure. */
export class ToolFailure extends ToolResult {}
