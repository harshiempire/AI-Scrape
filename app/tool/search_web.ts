import { z } from "zod";
import { BaseTool } from "./base";

const SearchSchema = z.object({
  query: z.string().min(3).describe("The web search query"),
  max_results: z.number().int().min(1).max(10).optional().default(5),
});

export class SearchWeb extends BaseTool {
  name: string = "search_web";
  description: string =
    "Search the web for relevant results. Returns a list of {title, url, snippet}. Prefers API keys (Tavily/Serper) if configured.";

  constructor() {
    super({
      name: "search_web",
      description:
        "Search the web for relevant results. Returns a list of {title, url, snippet}. Prefers API keys (Tavily/Serper) if configured.",
      schema: SearchSchema,
    });
  }

  async execute(kwargs: Record<string, any>): Promise<any> {
    const { query, max_results } = SearchSchema.parse(kwargs);

    const tavilyKey = process.env.TAVILY_API_KEY;
    const serperKey = process.env.SERPER_API_KEY;

    if (tavilyKey) {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tavilyKey}`,
        },
        body: JSON.stringify({
          query,
          max_results,
          search_depth: "advanced",
          include_answer: false,
        }),
      });
      const data: any = await res.json();
      const results = (data.results || []).slice(0, max_results).map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.content || r.snippet || "",
      }));
      return this.success_response({ results });
    }

    if (serperKey) {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": serperKey,
        },
        body: JSON.stringify({ q: query, num: max_results }),
      });
      const data: any = await res.json();
      const results = (data.organic || []).slice(0, max_results).map((r: any) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet || "",
      }));
      return this.success_response({ results });
    }

    return this.fail_response(
      "No search API configured. Set TAVILY_API_KEY or SERPER_API_KEY."
    );
  }
}

