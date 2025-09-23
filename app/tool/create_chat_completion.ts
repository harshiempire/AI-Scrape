import { BaseTool } from "./base";

export class CreateChatCompletion extends BaseTool {
  name: string = "create_chat_completion";
  description: string =
    "Creates a structured completion with specified output formatting.";

  response_type: string = "string";
  required: string[] = ["response"];

  execute(kwargs: Record<string, any>): any {
    const required = kwargs.required || this.required;
    const result = {
      field: this.response_type,
      required: required,
    };
    return result;
  }
}

// import zodToJsonSchema from "zod-to-json-schema";
// import { BaseTool } from "./base";

// // Type mapping for JSON schema
// const TYPE_MAPPING: Record<string, string> = {
//   string: "string",
//   number: "number",
//   boolean: "boolean",
//   object: "object",
//   array: "array",
// };

// export class CreateChatCompletion extends BaseTool {
//   name: string = "create_chat_completion";
//   description: string =
//     "Creates a structured completion with specified output formatting.";
//   response_type?: new (...args: any[]) => any;
//   required: string[] = ["response"];

//   constructor(props?: {
//     response_type?: new (...args: any[]) => any;
//     required?: string[];
//   }) {
//     super({
//       name: "create_chat_completion",
//       description: "Create a chat completion",
//     });
//     this.response_type = props?.response_type;
//     this.parameters = this._build_parameters();
//   }

//   private _build_parameters(): Record<string, any> {
//     if (typeof this.response_type === "string") {
//       return {
//         type: "object",
//         properties: {
//           response: {
//             type: "string",
//             description:
//               "The response text that should be delivered to the user.",
//           },
//         },
//         required: this.required,
//       };
//     }

//     // Handle class constructors (similar to Pydantic models)
//     // Handle Zod schemas (equivalent to Pydantic BaseModel)
//     if (this.response_type && typeof this.response_type === "function") {
//       // Check if it's a Zod schema by looking for _def property
//       if ((this.response_type as any)._def) {
//         const zodSchema = this.response_type as any;
//         const schema = zodToJsonSchema(zodSchema);
//         console.log("schema", schema);

//         return {
//           type: "object",
//           properties: (schema as any).properties || {},
//           required: (schema as any).required || this.required,
//         };
//       }

//       // Handle class constructors (similar to Pydantic models)
//       if (this.response_type.prototype) {
//         // For now, treat all class constructors as objects
//         return {
//           type: "object",
//           properties: {
//             response: {
//               type: "object",
//               description: `Response of type ${this.response_type.name}`,
//             },
//           },
//           required: this.required,
//         };
//       }
//     }

//     return this._create_type_schema(this.response_type);
//   }

//   // TypeScript equivalent of Python's get_origin
//   private _get_type_origin(type: any): any {
//     if (typeof type === "function" && type.prototype) {
//       return type;
//     }

//     // Handle Zod types
//     if (type && typeof type === "function" && (type as any)._def) {
//       const zodType = type as any;
//       return zodType._def.typeName;
//     }

//     return null;
//   }

//   // TypeScript equivalent of Python's get_args
//   private _get_type_args(type: any): any[] {
//     // Handle Zod types
//     if (type && typeof type === "function" && (type as any)._def) {
//       const zodType = type as any;
//       const def = zodType._def;

//       // Handle different Zod types
//       switch (def.typeName) {
//         case "ZodArray":
//           return [def.type]; // Return the element type
//         case "ZodObject":
//           return [def.shape()]; // Return the shape
//         case "ZodUnion":
//           return def.options; // Return union options
//         case "ZodOptional":
//           return [def.innerType]; // Return the inner type
//         case "ZodNullable":
//           return [def.innerType]; // Return the inner type
//         default:
//           return [];
//       }
//     }

//     // Handle native types
//     if (type === Array) {
//       return [Object]; // Default array element type
//     }

//     return [];
//   }

//   private _get_type_info(type_hint: any): Record<string, any> {
//     // Handle Zod types
//     if (
//       type_hint &&
//       typeof type_hint === "function" &&
//       (type_hint as any)._def
//     ) {
//       const schema = zodToJsonSchema(type_hint);
//       return schema as Record<string, any>;
//     }

//     // Handle class constructors
//     if (typeof type_hint === "function" && type_hint.prototype) {
//       return {
//         type: "object",
//         description: `Value of type ${type_hint.name}`,
//       };
//     }

//     return {
//       type: TYPE_MAPPING[type_hint?.name?.toLowerCase()] || "string",
//       description: `Value of type ${type_hint?.name || "any"}`,
//     };
//   }

//   private _create_type_schema(type_hint: any): Record<string, any> {
//     const type_origin = this._get_type_origin(type_hint);
//     const args = this._get_type_args(type_hint);

//     // Handle primitive types
//     if (type_origin === null) {
//       return {
//         type: "object",
//         properties: {
//           response: {
//             type: TYPE_MAPPING[type_hint?.name?.toLowerCase()] || "string",
//             description: `Response of type ${type_hint?.name || "any"}`,
//           },
//         },
//         required: this.required,
//       };
//     }
//     // Handle Zod Array type
//     if (type_origin === "ZodArray") {
//       const elementType = args[0];
//       return {
//         type: "object",
//         properties: {
//           response: {
//             type: "array",
//             items: this._get_type_info(elementType),
//           },
//         },
//         required: this.required,
//       };
//     }

//     // Handle Zod Object type
//     if (type_origin === "ZodObject") {
//       const shape = args[0];
//       const schema = zodToJsonSchema(type_hint);
//       return {
//         type: "object",
//         properties: (schema as any).properties || {},
//         required: (schema as any).required || this.required,
//       };
//     }

//     // Handle Zod Union type
//     if (type_origin === "ZodUnion") {
//       return {
//         type: "object",
//         properties: {
//           response: {
//             anyOf: args.map((arg) => this._get_type_info(arg)),
//           },
//         },
//         required: this.required,
//       };
//     }

//     // Handle Array type
//     if (type_hint === Array) {
//       return {
//         type: "object",
//         properties: {
//           response: {
//             type: "array",
//             items: this._get_type_info(args[0] || Object),
//           },
//         },
//         required: this.required,
//       };
//     }

//     return this._build_parameters();
//   }
// }
