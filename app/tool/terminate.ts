import { z } from "zod";
import { BaseTool } from "./base";

const _TERMINATE_DESCRIPTION =
  "Terminate the interaction when the request is met OR if the assistant cannot proceed further with the task.  When you have finished all the tasks, call this tool to end the work.";

// Define Zod schema for validation
const TerminateSchema = z.object({
  status: z
    .enum(["success", "failure"])
    .describe("The finish status of the interaction."),
});

export class Terminate extends BaseTool {
  name: string = "terminate";
  description: string = _TERMINATE_DESCRIPTION;
  constructor() {
    super({
      name: "terminate",
      description: _TERMINATE_DESCRIPTION,
      schema: TerminateSchema, // Pass Zod schema
    });
  }
  execute(kwargs: Record<string, any>): any {
    const status = kwargs.status;
    return `The interaction has been completed with status: ${status}`;
  }
}
