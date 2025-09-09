import { 
  Agent, 
  ToolRegistry, 
  InMemoryMemory, 
  OpenAILLM 
} from "./core/index.js";
import { MathTools } from "./tools/mathTools.js";

async function main() {
  console.log('🤖 AI Agents Framework Demo\n');
  
  const registry = new ToolRegistry();
  
  // Register all math tools
  const mathTools = MathTools.createTools();
  for (const tool of mathTools) {
    registry.register(tool);
  }

  const agent = new Agent({
    llm: new OpenAILLM({ model: 'gpt-4o-mini' }),
    memory: new InMemoryMemory(),
    tools: registry,
    system: 'You are a helpful math assistant with access to mathematical tools.',
    debug: true
  });

  console.log('Available tools:', registry.list().map(t => t.name));
  console.log();

  const response1 = await agent.chat("Hi! Can you add 4, 5, 6 for me?");
  console.log('Response 1:', response1.text);
  console.log();

  const response2 = await agent.chat("Thanks! Can you also calculate the product of 10 and 15?");
  console.log('Response 2:', response2.text);
}

main().catch(console.error);
