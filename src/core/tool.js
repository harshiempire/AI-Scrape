import zodToJsonSchema from "zod-to-json-schema";
export class Tool {
    name;
    description;
    schema;
    func;
    constructor({ name, description, schema, func }) {
        this.name = name;
        this.description = description;
        this.schema = schema;
        this.func = async (input) => {
            // validate if schema provided
            if (schema) {
                const parsed = schema.parse(input);
                return await func(parsed);
            }
            return await func(input);
        };
    }
    async run(input) {
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
