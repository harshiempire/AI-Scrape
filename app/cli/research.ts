import { DeepResearchAgent } from "../agent/deep_research";

async function main() {
  const query = process.argv.slice(2).join(" ").trim();
  if (!query) {
    console.error("Usage: tsx app/cli/research.ts <your research question>");
    process.exit(1);
  }

  const agent = new DeepResearchAgent();
  const result = await agent.run(query);
  console.log("\n=== Result ===\n" + result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

