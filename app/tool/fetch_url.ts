import { z } from "zod";
import { BaseTool } from "./base";
import * as cheerio from "cheerio";

const FetchSchema = z.object({
  url: z.string().url().describe("The URL to fetch"),
});

export class FetchUrl extends BaseTool {
  name: string = "fetch_url";
  description: string =
    "Fetch a web page and extract readable text content, title, and metadata for citation.";

  constructor() {
    super({
      name: "fetch_url",
      description:
        "Fetch a web page and extract readable text content, title, and metadata for citation.",
      schema: FetchSchema,
    });
  }

  async execute(kwargs: Record<string, any>): Promise<any> {
    const { url } = FetchSchema.parse(kwargs);
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (ResearchAgent)" } });
    if (!res.ok) {
      return this.fail_response(`Failed to fetch URL (${res.status}): ${url}`);
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $("title").first().text().trim();

    // Extract main textual content: headings, paragraphs, list items
    const textParts: string[] = [];
    $("h1, h2, h3, h4, h5, h6, p, li").each((_idx: number, el: any) => {
      const t = $(el).text().trim();
      if (t) textParts.push(t);
    });
    const content = textParts.join("\n");

    return this.success_response({
      title,
      url,
      content,
    });
  }
}

