import { z } from "zod";
import { BaseTool, ToolResultType } from "./base";
import { log } from "../logger";

type SearchResult = {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
};

const SearchSchema = z.object({
  query: z.string().min(2),
  num_results: z.number().int().min(1).max(10).default(5).optional(),
});

async function braveSearch(q: string, limit: number): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    return [];
  }
  const endpoint = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
    q
  )}&count=${limit}`;
  const res = await fetch(endpoint, {
    headers: { "X-Subscription-Token": apiKey },
  });
  if (!res.ok) {
    log.warn(`Brave search failed: ${res.status} ${res.statusText}`);
    return [];
  }
  const data: any = await res.json();
  const web = (data && data.web && data.web.results) || [];
  return web.slice(0, limit).map((r: any) => ({
    title: r.title,
    url: r.url,
    snippet: r.description,
    source: "brave",
  }));
}

async function duckduckgoHtml(q: string, limit: number): Promise<SearchResult[]> {
  // Simple fallback using HTML results; not guaranteed stable
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) {
    log.warn(`DuckDuckGo HTML fetch failed: ${res.status} ${res.statusText}`);
    return [];
  }
  const html = await res.text();
  // Very lightweight parsing without external deps
  const results: SearchResult[] = [];
  const regex = /<a rel="nofollow" class="result__a" href="(.*?)"[^>]*>(.*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let match;
  while ((match = regex.exec(html)) && results.length < limit) {
    const link = match[1];
    const title = match[2].replace(/<[^>]+>/g, "");
    const snippet = match[3].replace(/<[^>]+>/g, "").trim();
    results.push({ title, url: link, snippet, source: "duckduckgo" });
  }
  return results;
}

export class WebSearch extends BaseTool {
  name: string = "web_search";
  description: string =
    "Search the web for relevant links and brief snippets. Returns JSON list of results.";

  constructor() {
    super({ name: "web_search", description: this.description, schema: SearchSchema });
  }

  async execute(kwargs: Record<string, any>): Promise<ToolResultType> {
    const parsed = SearchSchema.safeParse(kwargs);
    if (!parsed.success) {
      return this.fail_response(`Invalid arguments: ${parsed.error.message}`);
    }
    const { query, num_results } = parsed.data as { query: string; num_results?: number };
    const limit = num_results || 5;

    try {
      let results = await braveSearch(query, limit);
      if (results.length === 0) {
        results = await duckduckgoHtml(query, limit);
      }
      return this.success_response({
        query,
        results,
      });
    } catch (error) {
      log.exception("web_search failed", error as Error);
      return this.fail_response(`Search error: ${String(error)}`);
    }
  }
}

