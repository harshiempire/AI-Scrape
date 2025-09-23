import { BaseTool } from "./base";

const _TERMINATE_DESCRIPTION =
  "Terminate the interaction when the request is met OR if the assistant cannot proceed further with the task.  When you have finished all the tasks, call this tool to end the work.";

export class Terminate extends BaseTool {
  name: string = "terminate";
  description: string = _TERMINATE_DESCRIPTION;
  parameters: Record<string, any> = {
    type: "object",
    properties: {
      status: {
        type: "string",
        description: "The finish status of the interaction.",
        enum: ["success", "failure"],
      },
    },
    required: ["status"],
  };

  async execute(status: string): string {
    return `The interaction has been completed with status: ${status}`;
  }
}
