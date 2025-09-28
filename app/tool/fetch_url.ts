import { z } from "zod";
import { BaseTool, ToolResultType } from "./base";
import { log } from "../logger";

const FetchSchema = z.object({
  url: z.string().url(),
  max_chars: z.number().int().min(200).max(100000).default(15000).optional(),
});

function extractReadableText(html: string): { title?: string; text: string } {
  // Minimal readable text extraction without external dependencies
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : undefined;
  // Remove scripts and styles
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  // Remove tags
  cleaned = cleaned.replace(/<[^>]+>/g, " ");
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return { title, text: cleaned };
}

export class FetchUrl extends BaseTool {
  name: string = "fetch_url";
  description: string =
    "Fetch a web page and extract a readable text summary with title.";

  constructor() {
    super({ name: "fetch_url", description: this.description, schema: FetchSchema });
  }

  async execute(kwargs: Record<string, any>): Promise<ToolResultType> {
    const parsed = FetchSchema.safeParse(kwargs);
    if (!parsed.success) {
      return this.fail_response(`Invalid arguments: ${parsed.error.message}`);
    }
    const { url, max_chars } = parsed.data as { url: string; max_chars?: number };

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 DeepResearchAgent/1.0" },
        redirect: "follow",
      } as any);
      if (!res.ok) {
        return this.fail_response(`HTTP ${res.status} ${res.statusText}`);
      }
      const finalUrl = (res.url || url) as string;
      const html = await res.text();
      const { title, text } = extractReadableText(html);
      const truncated = text.slice(0, max_chars || 15000);
      return this.success_response({ url: finalUrl, title, text: truncated });
    } catch (error) {
      log.exception("fetch_url failed", error as Error);
      return this.fail_response(`Fetch error: ${String(error)}`);
    }
  }
}

