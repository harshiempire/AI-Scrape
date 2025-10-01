import { z } from "zod";
import { BaseTool } from "../../tool/base";
import { log } from "../../logger";
import axios from "axios";

// Real web search result schemas
export const RealSearchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  domain: z.string(),
  published_date: z.string().optional(),
  relevance_score: z.number().optional(),
  source_authority: z.number().min(0).max(10).optional(),
  search_engine: z.string(),
});

export const RealWebSearchResultSchema = z.object({
  query: z.string(),
  total_results: z.number(),
  search_time: z.number(),
  results: z.array(RealSearchResultSchema),
  suggestions: z.array(z.string()).optional(),
  search_engines_used: z.array(z.string()),
});

export type RealSearchResult = z.infer<typeof RealSearchResultSchema>;
export type RealWebSearchResult = z.infer<typeof RealWebSearchResultSchema>;

const RealWebSearchInputSchema = z.object({
  query: z.string().describe("The search query to execute"),
  max_results: z
    .number()
    .min(1)
    .max(100)
    .default(10)
    .describe("Maximum number of results to return"),
  engines: z
    .array(z.string())
    .default(["serpapi"])
    .describe("Search engines to use"),
  country: z
    .string()
    .default("us")
    .describe("Country code for localized results"),
  language: z.string().default("en").describe("Language for results"),
  safe_search: z
    .boolean()
    .default(true)
    .describe("Enable safe search filtering"),
  time_range: z
    .enum(["day", "week", "month", "year", "all"])
    .default("all")
    .describe("Time range for results"),
});

interface SearchEngineConfig {
  // duckduckgo?: boolean; // REMOVED - unreliable
  serpapi?: {
    api_key: string;
  };
  bing?: {
    api_key: string;
  };
  google?: {
    api_key: string;
    search_engine_id: string;
  };
}

export class RealWebSearchTool extends BaseTool {
  private config: SearchEngineConfig;
  private timeout: number = 30000;

  constructor(config: SearchEngineConfig = {}) {
    super({
      name: "real_web_search",
      description:
        "Search the web using real search engines (DuckDuckGo, SerpAPI, Bing, Google) with authority scoring",
      schema: RealWebSearchInputSchema,
    });

    this.config = {
      // No DuckDuckGo - premium APIs only
      ...config,
    };

    log.info(
      "Real web search tool initialized with engines:",
      Object.keys(this.config)
    );
  }

  async execute(kwargs: Record<string, any>): Promise<any> {
    try {
      const input = RealWebSearchInputSchema.parse(kwargs);
      log.info(`Executing real web search for: "${input.query}"`);

      const start_time = Date.now();
      const results = await this.perform_multi_engine_search(input);
      const search_time = (Date.now() - start_time) / 1000;

      // Deduplicate and rank results
      const unique_results = this.deduplicate_results(results);
      const ranked_results = this.rank_results(unique_results);

      const search_result: RealWebSearchResult = {
        query: input.query,
        total_results: ranked_results.length,
        search_time,
        results: ranked_results.slice(0, input.max_results),
        suggestions: this.generate_query_suggestions(input.query),
        search_engines_used: input.engines,
      };

      return this.success_response(search_result);
    } catch (error) {
      log.error("Real web search failed:", error);
      return this.fail_response(
        `Web search failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async perform_multi_engine_search(
    input: z.infer<typeof RealWebSearchInputSchema>
  ): Promise<RealSearchResult[]> {
    const all_results: RealSearchResult[] = [];
    const search_promises: Promise<RealSearchResult[]>[] = [];

    // Execute searches in parallel across multiple engines
    log.info(
      `🔍 MULTI-ENGINE SEARCH: Attempting engines [${input.engines.join(", ")}]`
    );

    for (const engine of input.engines) {
      switch (engine.toLowerCase()) {
        case "duckduckgo":
          log.warn(`❌ DuckDuckGo disabled - use premium APIs only`);
          break;
        case "serpapi":
          if (this.config.serpapi?.api_key) {
            log.info(
              `✅ Using SerpAPI with key: ${this.config.serpapi.api_key.substring(
                0,
                10
              )}...`
            );
            search_promises.push(this.search_serpapi(input));
          } else {
            log.warn(`❌ SerpAPI requested but no API key configured`);
          }
          break;
        case "bing":
          if (this.config.bing?.api_key) {
            search_promises.push(this.search_bing(input));
          }
          break;
        case "google":
          if (this.config.google?.api_key) {
            search_promises.push(this.search_google(input));
          }
          break;
        default:
          log.warn(`Unknown search engine: ${engine}`);
      }
    }

    // Wait for all searches to complete with timeout protection
    const results_arrays = await Promise.allSettled(
      search_promises.map((promise) =>
        Promise.race([
          promise,
          new Promise<RealSearchResult[]>((_, reject) =>
            setTimeout(() => reject(new Error("Search timeout")), this.timeout)
          ),
        ])
      )
    );

    results_arrays.forEach((result, index) => {
      if (result.status === "fulfilled") {
        all_results.push(...result.value);
        log.info(
          `${input.engines[index]} search completed: ${result.value.length} results`
        );
      } else {
        log.warn(
          `Search engine ${input.engines[index]} failed:`,
          result.reason
        );
      }
    });

    return all_results;
  }

  // DISABLED - DuckDuckGo search method removed due to unreliability
  private async search_duckduckgo_DISABLED(
    input: z.infer<typeof RealWebSearchInputSchema>
  ): Promise<RealSearchResult[]> {
    log.warn("DuckDuckGo search disabled - use premium APIs only");
    return [];
    /*
    try {
      log.info("Searching with DuckDuckGo");

      // DuckDuckGo Instant Answer API
      const response = await axios.get("https://api.duckduckgo.com/", {
        params: {
          q: input.query,
          format: "json",
          no_html: "1",
          skip_disambig: "1",
        },
        timeout: this.timeout,
      });

      const results: RealSearchResult[] = [];

      // Process abstract if available
      if (response.data.Abstract) {
        results.push({
          title: response.data.AbstractText || input.query,
          url: response.data.AbstractURL || "https://duckduckgo.com",
          snippet: response.data.Abstract,
          domain: this.extract_domain(
            response.data.AbstractURL || "duckduckgo.com"
          ),
          relevance_score: 0.9,
          source_authority: this.calculate_authority_score("duckduckgo.com"),
          search_engine: "duckduckgo",
        });
      }

      // Process related topics
      if (response.data.RelatedTopics) {
        response.data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(" - ")[0] || topic.Text,
              url: topic.FirstURL,
              snippet: topic.Text,
              domain: this.extract_domain(topic.FirstURL),
              relevance_score: 0.7,
              source_authority: this.calculate_authority_score(
                this.extract_domain(topic.FirstURL)
              ),
              search_engine: "duckduckgo",
            });
          }
        });
      }

      return results;
    } catch (error) {
      log.error("DuckDuckGo search failed:", error);
      return [];
    }
    */
  }

  private async search_serpapi(
    input: z.infer<typeof RealWebSearchInputSchema>
  ): Promise<RealSearchResult[]> {
    if (!this.config.serpapi?.api_key) {
      log.warn("SerpAPI key not configured");
      return [];
    }

    try {
      log.info("Searching with SerpAPI");

      const response = await axios.get("https://serpapi.com/search", {
        params: {
          engine: "google",
          q: input.query,
          api_key: this.config.serpapi.api_key,
          num: Math.min(input.max_results, 20),
          gl: input.country,
          hl: input.language,
          safe: input.safe_search ? "active" : "off",
          tbs: this.get_time_filter(input.time_range),
        },
        timeout: this.timeout,
      });

      const results: RealSearchResult[] = [];

      if (response.data.organic_results) {
        response.data.organic_results.forEach((result: any, index: number) => {
          results.push({
            title: result.title || "No title",
            url: result.link,
            snippet:
              result.snippet ||
              result.rich_snippet?.top?.detected_extensions?.description ||
              "No description",
            domain: this.extract_domain(result.link),
            published_date: result.date,
            relevance_score: Math.max(0.1, 1 - index * 0.05), // Decreasing relevance by position
            source_authority: this.calculate_authority_score(
              this.extract_domain(result.link)
            ),
            search_engine: "serpapi",
          });
        });
      }

      return results;
    } catch (error) {
      log.error("SerpAPI search failed:", error);
      return [];
    }
  }

  private async search_bing(
    input: z.infer<typeof RealWebSearchInputSchema>
  ): Promise<RealSearchResult[]> {
    if (!this.config.bing?.api_key) {
      log.warn("Bing API key not configured");
      return [];
    }

    try {
      log.info("Searching with Bing");

      const response = await axios.get(
        "https://api.bing.microsoft.com/v7.0/search",
        {
          params: {
            q: input.query,
            count: Math.min(input.max_results, 50),
            mkt: `${input.language}-${input.country}`,
            safeSearch: input.safe_search ? "Strict" : "Off",
            freshness: this.get_bing_freshness(input.time_range),
          },
          headers: {
            "Ocp-Apim-Subscription-Key": this.config.bing.api_key,
          },
          timeout: this.timeout,
        }
      );

      const results: RealSearchResult[] = [];

      if (response.data.webPages?.value) {
        response.data.webPages.value.forEach((result: any, index: number) => {
          results.push({
            title: result.name,
            url: result.url,
            snippet: result.snippet || "No description available",
            domain: this.extract_domain(result.url),
            published_date: result.dateLastCrawled,
            relevance_score: Math.max(0.1, 1 - index * 0.03),
            source_authority: this.calculate_authority_score(
              this.extract_domain(result.url)
            ),
            search_engine: "bing",
          });
        });
      }

      return results;
    } catch (error) {
      log.error("Bing search failed:", error);
      return [];
    }
  }

  private async search_google(
    input: z.infer<typeof RealWebSearchInputSchema>
  ): Promise<RealSearchResult[]> {
    if (!this.config.google?.api_key || !this.config.google?.search_engine_id) {
      log.warn("Google Custom Search API not configured");
      return [];
    }

    try {
      log.info("Searching with Google Custom Search");

      const response = await axios.get(
        "https://www.googleapis.com/customsearch/v1",
        {
          params: {
            key: this.config.google.api_key,
            cx: this.config.google.search_engine_id,
            q: input.query,
            num: Math.min(input.max_results, 10),
            gl: input.country,
            hl: input.language,
            safe: input.safe_search ? "active" : "off",
            dateRestrict: this.get_google_date_restrict(input.time_range),
          },
          timeout: this.timeout,
        }
      );

      const results: RealSearchResult[] = [];

      if (response.data.items) {
        response.data.items.forEach((result: any, index: number) => {
          results.push({
            title: result.title,
            url: result.link,
            snippet: result.snippet || "No description available",
            domain: this.extract_domain(result.link),
            published_date:
              result.pagemap?.metatags?.[0]?.["article:published_time"],
            relevance_score: Math.max(0.1, 1 - index * 0.04),
            source_authority: this.calculate_authority_score(
              this.extract_domain(result.link)
            ),
            search_engine: "google",
          });
        });
      }

      return results;
    } catch (error) {
      log.error("Google Custom Search failed:", error);
      return [];
    }
  }

  private extract_domain(url: string): string {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  }

  private calculate_authority_score(domain: string): number {
    // Real authority scoring based on domain reputation
    const authority_map: Record<string, number> = {
      // Academic and educational
      "wikipedia.org": 9,
      "arxiv.org": 10,
      "nature.com": 10,
      "science.org": 10,
      "ieee.org": 9,
      "acm.org": 9,
      "springer.com": 8,
      "wiley.com": 8,
      "elsevier.com": 8,
      "mit.edu": 10,
      "stanford.edu": 10,
      "harvard.edu": 10,
      "oxford.ac.uk": 10,
      "cambridge.org": 9,

      // Government and official
      gov: 9,
      "nih.gov": 10,
      "who.int": 9,
      "un.org": 9,
      "europa.eu": 8,

      // Major news and media
      "reuters.com": 8,
      "bbc.com": 8,
      "cnn.com": 7,
      "nytimes.com": 8,
      "washingtonpost.com": 8,
      "economist.com": 9,
      "ft.com": 8,
      "wsj.com": 8,
      "theguardian.com": 7,
      "apnews.com": 8,

      // Technology and industry
      "techcrunch.com": 6,
      "arstechnica.com": 7,
      "wired.com": 7,
      "spectrum.ieee.org": 8,
      "sciencedaily.com": 7,

      // Medical and health
      "webmd.com": 6,
      "mayoclinic.org": 8,
      "pubmed.ncbi.nlm.nih.gov": 10,

      // Finance and business
      "bloomberg.com": 8,
      "forbes.com": 7,
      "marketwatch.com": 6,
      "investopedia.com": 7,
    };

    // Check for exact domain matches
    for (const [authoritative_domain, score] of Object.entries(authority_map)) {
      if (domain.includes(authoritative_domain)) {
        return score;
      }
    }

    // Domain type scoring
    if (domain.endsWith(".edu")) return 8;
    if (domain.endsWith(".gov")) return 8;
    if (domain.endsWith(".org")) return 6;
    if (domain.endsWith(".ac.uk") || domain.endsWith(".edu.au")) return 7;

    // Default scoring based on domain characteristics
    let base_score = 5;

    // Bonus for HTTPS (assume most modern sites have it)
    base_score += 0.5;

    // Penalty for suspicious patterns
    if (domain.includes("blog") && !domain.includes("official"))
      base_score -= 1;
    if (
      domain.includes("forum") ||
      domain.includes("reddit") ||
      domain.includes("quora")
    )
      base_score -= 0.5;
    if (domain.includes("wiki") && !domain.includes("wikipedia"))
      base_score += 1;

    return Math.max(1, Math.min(10, base_score));
  }

  private deduplicate_results(results: RealSearchResult[]): RealSearchResult[] {
    const seen_urls = new Set<string>();
    const seen_titles = new Set<string>();
    const unique_results: RealSearchResult[] = [];

    for (const result of results) {
      const normalized_url = result.url.toLowerCase().replace(/\/$/, "");
      const normalized_title = result.title.toLowerCase().trim();

      if (
        !seen_urls.has(normalized_url) &&
        !seen_titles.has(normalized_title)
      ) {
        seen_urls.add(normalized_url);
        seen_titles.add(normalized_title);
        unique_results.push(result);
      }
    }

    return unique_results;
  }

  private rank_results(results: RealSearchResult[]): RealSearchResult[] {
    return results.sort((a, b) => {
      // Combined ranking: authority (40%) + relevance (40%) + recency (20%)
      const score_a =
        (a.source_authority || 5) * 0.4 +
        (a.relevance_score || 0.5) * 0.4 +
        this.get_recency_score(a.published_date) * 0.2;
      const score_b =
        (b.source_authority || 5) * 0.4 +
        (b.relevance_score || 0.5) * 0.4 +
        this.get_recency_score(b.published_date) * 0.2;

      return score_b - score_a;
    });
  }

  private get_recency_score(published_date?: string): number {
    if (!published_date) return 0.5; // Neutral score for undated content

    try {
      const pub_date = new Date(published_date);
      const now = new Date();
      const days_old =
        (now.getTime() - pub_date.getTime()) / (1000 * 60 * 60 * 24);

      // Recency scoring: newer is better, but not the only factor
      if (days_old <= 7) return 1.0;
      if (days_old <= 30) return 0.9;
      if (days_old <= 90) return 0.8;
      if (days_old <= 365) return 0.6;
      if (days_old <= 730) return 0.4;
      return 0.2;
    } catch {
      return 0.5;
    }
  }

  private generate_query_suggestions(query: string): string[] {
    const words = query.toLowerCase().split(/\s+/);
    const base_suggestions = [
      `${query} definition`,
      `${query} examples`,
      `${query} 2024`,
      `${query} research`,
      `${query} analysis`,
    ];

    // Add domain-specific suggestions
    if (
      words.some((w) =>
        ["technology", "ai", "artificial", "machine"].includes(w)
      )
    ) {
      base_suggestions.push(`${query} trends`, `${query} applications`);
    }

    if (
      words.some((w) =>
        ["health", "medical", "disease", "treatment"].includes(w)
      )
    ) {
      base_suggestions.push(`${query} studies`, `${query} clinical trials`);
    }

    if (
      words.some((w) =>
        ["economic", "finance", "market", "business"].includes(w)
      )
    ) {
      base_suggestions.push(`${query} impact`, `${query} forecast`);
    }

    return base_suggestions.slice(0, 5);
  }

  private get_time_filter(time_range: string): string {
    const filters: Record<string, string> = {
      day: "d1",
      week: "w1",
      month: "m1",
      year: "y1",
      all: "",
    };
    return filters[time_range] || "";
  }

  private get_bing_freshness(time_range: string): string {
    const freshness: Record<string, string> = {
      day: "Day",
      week: "Week",
      month: "Month",
      year: "Year",
      all: "",
    };
    return freshness[time_range] || "";
  }

  private get_google_date_restrict(time_range: string): string {
    const restrictions: Record<string, string> = {
      day: "d1",
      week: "w1",
      month: "m1",
      year: "y1",
      all: "",
    };
    return restrictions[time_range] || "";
  }

  // Advanced search methods
  async search_academic_sources(
    query: string,
    max_results: number = 10
  ): Promise<RealSearchResult[]> {
    const academic_queries = [
      `site:arxiv.org ${query}`,
      `site:pubmed.ncbi.nlm.nih.gov ${query}`,
      `site:scholar.google.com ${query}`,
      `site:researchgate.net ${query}`,
      `${query} filetype:pdf`,
    ];

    const all_results: RealSearchResult[] = [];

    for (const academic_query of academic_queries) {
      try {
        const results = await this.perform_multi_engine_search({
          query: academic_query,
          max_results: Math.ceil(max_results / academic_queries.length),
          engines: ["serpapi"],
          country: "us",
          language: "en",
          safe_search: true,
          time_range: "all",
        });
        all_results.push(...results);
      } catch (error) {
        log.warn(`Academic search failed for: ${academic_query}`, error);
      }
    }

    return this.deduplicate_results(all_results).slice(0, max_results);
  }

  async search_news_sources(
    query: string,
    max_results: number = 10
  ): Promise<RealSearchResult[]> {
    const news_queries = [
      `${query} site:reuters.com`,
      `${query} site:bbc.com`,
      `${query} site:apnews.com`,
      `${query} site:economist.com`,
      `${query} news`,
    ];

    const all_results: RealSearchResult[] = [];

    for (const news_query of news_queries) {
      try {
        const results = await this.perform_multi_engine_search({
          query: news_query,
          max_results: Math.ceil(max_results / news_queries.length),
          engines: ["serpapi"],
          country: "us",
          language: "en",
          safe_search: true,
          time_range: "month", // Focus on recent news
        });
        all_results.push(...results);
      } catch (error) {
        log.warn(`News search failed for: ${news_query}`, error);
      }
    }

    return this.deduplicate_results(all_results).slice(0, max_results);
  }

  async search_government_sources(
    query: string,
    max_results: number = 10
  ): Promise<RealSearchResult[]> {
    const gov_queries = [
      `${query} site:gov`,
      `${query} site:nih.gov`,
      `${query} site:cdc.gov`,
      `${query} site:epa.gov`,
      `${query} site:who.int`,
    ];

    const all_results: RealSearchResult[] = [];

    for (const gov_query of gov_queries) {
      try {
        const results = await this.perform_multi_engine_search({
          query: gov_query,
          max_results: Math.ceil(max_results / gov_queries.length),
          engines: ["serpapi"],
          country: "us",
          language: "en",
          safe_search: true,
          time_range: "all",
        });
        all_results.push(...results);
      } catch (error) {
        log.warn(`Government search failed for: ${gov_query}`, error);
      }
    }

    return this.deduplicate_results(all_results).slice(0, max_results);
  }
}
