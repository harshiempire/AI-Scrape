// src/tools/mathTools.ts
import { z } from "zod";
import { Tool } from "../core/tool.js";
export class MathTools {
    // Create individual tools instead of using decorators
    static createTools() {
        return [
            new Tool({
                name: "calculateSum",
                description: "Adds up numbers",
                schema: z.object({ numbers: z.array(z.number()) }),
                func: async (input) => {
                    const { numbers } = input;
                    return { sum: numbers.reduce((a, b) => a + b, 0) };
                }
            }),
            new Tool({
                name: "calculateProduct",
                description: "Multiplies numbers",
                schema: z.object({ numbers: z.array(z.number()) }),
                func: async (input) => {
                    const { numbers } = input;
                    return { product: numbers.reduce((a, b) => a * b, 1) };
                }
            }),
            new Tool({
                name: "calculateAverage",
                description: "Calculates the average of numbers",
                schema: z.object({ numbers: z.array(z.number()) }),
                func: async (input) => {
                    const { numbers } = input;
                    const sum = numbers.reduce((a, b) => a + b, 0);
                    return { average: sum / numbers.length };
                }
            })
        ];
    }
}
