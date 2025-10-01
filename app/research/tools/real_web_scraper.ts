import { z } from "zod";
import { BaseTool } from "../../tool/base";
import { log } from "../../logger";
import puppeteer, { Browser, Page } from "puppeteer";
import { load } from "cheerio";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import axios from "axios";

// Real scraped content schemas
export const RealScrapedContentSchema = z.object({
  url: z.string(),
  title: z.string(),
  content: z.string(),
  clean_text: z.string(),
  markdown: z.string(),
  metadata: z.object({
    author: z.string().optional(),
    published_date: z.string().optional(),
    modified_date: z.string().optional(),
    word_count: z.number(),
    language: z.string().optional(),
    domain: z.string(),
    content_type: z.string(),
    canonical_url: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }),
  extracted_data: z.object({
    headings: z.array(
      z.object({
        level: z.number(),
        text: z.string(),
      })
    ),
    paragraphs: z.array(z.string()),
    key_points: z.array(z.string()),
    quotes: z.array(z.string()),
    links: z.array(
      z.object({
        text: z.string(),
        url: z.string(),
        external: z.boolean(),
      })
    ),
    images: z.array(
      z.object({
        alt: z.string().optional(),
        src: z.string(),
        caption: z.string().optional(),
      })
    ),
    tables: z.array(
      z.object({
        headers: z.array(z.string()),
        rows: z.array(z.array(z.string())),
      })
    ),
  }),
  quality_metrics: z.object({
    readability_score: z.number().min(0).max(1),
    content_density: z.number().min(0).max(1),
    authority_indicators: z.array(z.string()),
    credibility_score: z.number().min(0).max(1),
  }),
  scrape_timestamp: z.string(),
  scrape_duration: z.number(),
});

export type RealScrapedContent = z.infer<typeof RealScrapedContentSchema>;

const RealWebScraperInputSchema = z.object({
  url: z.string().url().describe("The URL to scrape"),
  extract_type: z
    .enum(["full", "readable", "metadata", "structured"])
    .default("readable")
    .describe("Type of content extraction"),
  max_content_length: z
    .number()
    .min(100)
    .max(100000)
    .default(50000)
    .describe("Maximum content length to extract"),
  include_images: z
    .boolean()
    .default(false)
    .describe("Whether to extract image information"),
  include_tables: z
    .boolean()
    .default(true)
    .describe("Whether to extract table data"),
  timeout: z
    .number()
    .min(5)
    .max(120)
    .default(60)
    .describe("Request timeout in seconds"),
  use_browser: z
    .boolean()
    .default(false)
    .describe("Use headless browser for JavaScript-heavy sites"),
  wait_for_content: z
    .number()
    .min(0)
    .max(10000)
    .default(2000)
    .describe("Time to wait for dynamic content (ms)"),
});

export class RealWebScraperTool extends BaseTool {
  private browser: Browser | null = null;
  private turndown: TurndownService;
  private user_agent: string;

  constructor(config?: { user_agent?: string; browser_options?: any }) {
    super({
      name: "real_web_scraper",
      description:
        "Extract and analyze content from web pages using advanced scraping techniques with readability analysis",
      schema: RealWebScraperInputSchema,
    });

    this.user_agent =
      config?.user_agent ||
      "Mozilla/5.0 (compatible; DeepResearchAgent/1.0; +https://example.com/bot)";
    this.turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });

    log.info("Real web scraper tool initialized");
  }

  async execute(kwargs: Record<string, any>): Promise<any> {
    try {
      const input = RealWebScraperInputSchema.parse(kwargs);
      log.info(`Scraping content from: ${input.url}`);

      const start_time = Date.now();
      const scraped_content = await this.scrape_url_real(input);
      const duration = Date.now() - start_time;

      scraped_content.scrape_duration = duration;
      scraped_content.scrape_timestamp = new Date().toISOString();

      return this.success_response(scraped_content);
    } catch (error) {
      log.error("Real web scraping failed:", error);
      return this.fail_response(
        `Web scraping failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async scrape_url_real(
    input: z.infer<typeof RealWebScraperInputSchema>
  ): Promise<RealScrapedContent> {
    if (input.use_browser) {
      return await this.scrape_with_browser(input);
    } else {
      return await this.scrape_with_http(input);
    }
  }

  private async scrape_with_http(
    input: z.infer<typeof RealWebScraperInputSchema>
  ): Promise<RealScrapedContent> {
    try {
      log.debug(`HTTP scraping: ${input.url}`);

      const response = await axios.get(input.url, {
        headers: {
          "User-Agent": this.user_agent,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          Connection: "keep-alive",
        },
        timeout: input.timeout * 1000,
        maxRedirects: 5,
      });

      const html = response.data;
      return await this.extract_content_from_html(html, input);
    } catch (error) {
      log.error(`HTTP scraping failed for ${input.url}:`, error);
      throw error;
    }
  }

  private async scrape_with_browser(
    input: z.infer<typeof RealWebScraperInputSchema>
  ): Promise<RealScrapedContent> {
    let page: Page | null = null;

    try {
      log.debug(`Browser scraping: ${input.url}`);

      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
          ],
        });
      }

      page = await this.browser.newPage();

      await page.setUserAgent(this.user_agent);
      await page.setViewport({ width: 1920, height: 1080 });

      // Set timeout and navigate
      await page.goto(input.url, {
        waitUntil: "networkidle2",
        timeout: input.timeout * 1000,
      });

      // Wait for dynamic content
      if (input.wait_for_content > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, input.wait_for_content)
        );
      }

      // Get the full HTML content
      const html = await page.content();

      return await this.extract_content_from_html(html, input);
    } catch (error) {
      log.error(`Browser scraping failed for ${input.url}:`, error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private async extract_content_from_html(
    html: string,
    input: z.infer<typeof RealWebScraperInputSchema>
  ): Promise<RealScrapedContent> {
    const $ = load(html);
    const domain = new URL(input.url).hostname;

    // Extract basic metadata
    const title =
      $("title").text().trim() ||
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      "No title found";

    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    const author =
      $('meta[name="author"]').attr("content") ||
      $('meta[property="article:author"]').attr("content") ||
      $(".author").first().text().trim() ||
      $('[rel="author"]').first().text().trim();

    const published_date =
      $('meta[property="article:published_time"]').attr("content") ||
      $('meta[name="date"]').attr("content") ||
      $("time[datetime]").attr("datetime") ||
      $(".date").first().text().trim();

    const modified_date =
      $('meta[property="article:modified_time"]').attr("content") ||
      $('meta[name="last-modified"]').attr("content");

    const canonical_url = $('link[rel="canonical"]').attr("href") || input.url;

    const keywords =
      $('meta[name="keywords"]')
        .attr("content")
        ?.split(",")
        .map((k) => k.trim()) || [];

    // Extract clean content using intelligent content detection
    let clean_content = "";
    let readability_score = 0;

    try {
      // Try to use readability-like extraction
      clean_content = this.extract_readable_content($);
      readability_score = this.calculate_readability_score(clean_content);
    } catch (error) {
      log.warn("Content extraction failed, using fallback method");
    }

    // Fallback content extraction if Readability fails
    if (!clean_content) {
      // Remove unwanted elements
      $(
        "script, style, nav, header, footer, aside, .ad, .advertisement, .popup"
      ).remove();

      // Extract main content areas
      const main_content =
        $("main").html() ||
        $("article").html() ||
        $(".content").html() ||
        $("#content").html() ||
        $("body").html() ||
        "";

      clean_content = $("<div>").html(main_content).text().trim();
    }

    // Limit content length
    if (clean_content.length > input.max_content_length) {
      clean_content =
        clean_content.substring(0, input.max_content_length) + "...";
    }

    // Convert to markdown
    const markdown = this.turndown.turndown(clean_content);

    // Extract structured data
    const headings = this.extract_headings($);
    const paragraphs = this.extract_paragraphs($);
    const key_points = this.extract_key_points($);
    const quotes = this.extract_quotes($);
    const links = this.extract_links($, input.url);
    const images = input.include_images
      ? this.extract_images($, input.url)
      : [];
    const tables = input.include_tables ? this.extract_tables($) : [];

    // Calculate quality metrics
    const quality_metrics = this.calculate_content_quality(
      clean_content,
      $,
      domain
    );

    const scraped_content: RealScrapedContent = {
      url: input.url,
      title,
      content: clean_content,
      clean_text: clean_content.replace(/\s+/g, " ").trim(),
      markdown,
      metadata: {
        author,
        published_date,
        modified_date,
        word_count: clean_content.split(/\s+/).length,
        language: this.detect_language(clean_content),
        domain,
        content_type: this.classify_content_type($, title, domain),
        canonical_url,
        description,
        keywords,
      },
      extracted_data: {
        headings,
        paragraphs,
        key_points,
        quotes,
        links,
        images,
        tables,
      },
      quality_metrics,
      scrape_timestamp: new Date().toISOString(),
      scrape_duration: 0, // Will be set by caller
    };

    return scraped_content;
  }

  private extract_headings($: any): Array<{ level: number; text: string }> {
    const headings: Array<{ level: number; text: string }> = [];

    for (let i = 1; i <= 6; i++) {
      $(`h${i}`).each((_: any, element: any) => {
        const text = $(element).text().trim();
        if (text && text.length > 0 && text.length < 200) {
          headings.push({ level: i, text });
        }
      });
    }

    return headings.slice(0, 20); // Limit to prevent bloat
  }

  private extract_paragraphs($: any): string[] {
    const paragraphs: string[] = [];

    $("p").each((_: any, element: any) => {
      const text = $(element).text().trim();
      if (text && text.length > 50 && text.length < 2000) {
        paragraphs.push(text);
      }
    });

    return paragraphs.slice(0, 50);
  }

  private extract_key_points($: any): string[] {
    const key_points: string[] = [];

    // Extract from lists
    $("ul li, ol li").each((_: any, element: any) => {
      const text = $(element).text().trim();
      if (text && text.length > 20 && text.length < 500) {
        key_points.push(text);
      }
    });

    // Extract from emphasized text
    $("strong, b, em, i").each((_: any, element: any) => {
      const text = $(element).text().trim();
      if (text && text.length > 10 && text.length < 300) {
        key_points.push(text);
      }
    });

    return [...new Set(key_points)].slice(0, 20);
  }

  private extract_quotes($: any): string[] {
    const quotes: string[] = [];

    $("blockquote, q, .quote").each((_: any, element: any) => {
      const text = $(element).text().trim();
      if (text && text.length > 20 && text.length < 1000) {
        quotes.push(text);
      }
    });

    return quotes.slice(0, 10);
  }

  private extract_links(
    $: any,
    base_url: string
  ): Array<{ text: string; url: string; external: boolean }> {
    const links: Array<{ text: string; url: string; external: boolean }> = [];
    const base_domain = new URL(base_url).hostname;

    $("a[href]").each((_: any, element: any) => {
      const href = $(element).attr("href");
      const text = $(element).text().trim();

      if (href && text && text.length > 0 && text.length < 200) {
        try {
          const absolute_url = new URL(href, base_url).toString();
          const is_external = !new URL(absolute_url).hostname.includes(
            base_domain
          );

          links.push({
            text,
            url: absolute_url,
            external: is_external,
          });
        } catch {
          // Skip invalid URLs
        }
      }
    });

    return links.slice(0, 50);
  }

  private extract_images(
    $: any,
    base_url: string
  ): Array<{ alt?: string; src: string; caption?: string }> {
    const images: Array<{ alt?: string; src: string; caption?: string }> = [];

    $("img[src]").each((_: any, element: any) => {
      const src = $(element).attr("src");
      const alt = $(element).attr("alt");

      if (src) {
        try {
          const absolute_src = new URL(src, base_url).toString();
          const caption =
            $(element).parent().find("figcaption").text().trim() ||
            $(element).siblings(".caption").text().trim();

          images.push({
            alt,
            src: absolute_src,
            caption: caption || undefined,
          });
        } catch {
          // Skip invalid image URLs
        }
      }
    });

    return images.slice(0, 20);
  }

  private extract_tables(
    $: any
  ): Array<{ headers: string[]; rows: string[][] }> {
    const tables: Array<{ headers: string[]; rows: string[][] }> = [];

    $("table").each((_: any, table) => {
      const headers: string[] = [];
      const rows: string[][] = [];

      // Extract headers
      $(table)
        .find("thead tr th, tr:first-child th, tr:first-child td")
        .each((_: any, header) => {
          headers.push($(header).text().trim());
        });

      // Extract rows
      $(table)
        .find("tbody tr, tr")
        .not(":first-child")
        .each((_: any, row) => {
          const row_data: string[] = [];
          $(row)
            .find("td, th")
            .each((_: any, cell) => {
              row_data.push($(cell).text().trim());
            });
          if (row_data.length > 0) {
            rows.push(row_data);
          }
        });

      if (headers.length > 0 || rows.length > 0) {
        tables.push({ headers, rows: rows.slice(0, 20) }); // Limit rows
      }
    });

    return tables.slice(0, 5); // Limit number of tables
  }

  private calculate_content_quality(
    content: string,
    $: any,
    domain: string
  ): RealScrapedContent["quality_metrics"] {
    const word_count = content.split(/\s+/).length;

    // Readability score based on content characteristics
    const readability_score = this.calculate_readability_score(content);

    // Content density (actual content vs markup)
    const text_length = content.length;
    const html_length = $.html().length;
    const content_density = text_length / Math.max(html_length, 1);

    // Authority indicators
    const authority_indicators = this.find_authority_indicators(
      $,
      content,
      domain
    );

    // Credibility score
    const credibility_score = this.calculate_credibility_score(
      content,
      $,
      domain,
      authority_indicators
    );

    return {
      readability_score: Math.min(1, Math.max(0, readability_score)),
      content_density: Math.min(1, Math.max(0, content_density)),
      authority_indicators,
      credibility_score: Math.min(1, Math.max(0, credibility_score)),
    };
  }

  private calculate_readability_score(content: string): number {
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const words = content.split(/\s+/);
    const syllables = this.count_syllables(content);

    if (sentences.length === 0 || words.length === 0) return 0;

    // Flesch Reading Ease Score (normalized to 0-1)
    const avg_sentence_length = words.length / sentences.length;
    const avg_syllables_per_word = syllables / words.length;

    const flesch_score =
      206.835 - 1.015 * avg_sentence_length - 84.6 * avg_syllables_per_word;

    // Normalize to 0-1 range (0 = very difficult, 1 = very easy)
    return Math.max(0, Math.min(1, flesch_score / 100));
  }

  private count_syllables(text: string): number {
    // Simple syllable counting algorithm
    const words = text.toLowerCase().match(/[a-z]+/g) || [];

    return words.reduce((total, word) => {
      // Basic syllable counting rules
      let syllables = word.match(/[aeiouy]+/g)?.length || 0;
      if (word.endsWith("e")) syllables--;
      if (syllables === 0) syllables = 1;
      return total + syllables;
    }, 0);
  }

  private find_authority_indicators(
    $: any,
    content: string,
    domain: string
  ): string[] {
    const indicators: string[] = [];

    // Check for academic indicators
    if (content.includes("doi:") || content.includes("DOI:")) {
      indicators.push("DOI_REFERENCE");
    }

    if ($("cite, .citation").length > 0) {
      indicators.push("CITATIONS_PRESENT");
    }

    if (content.match(/\b(ph\.?d|professor|dr\.)\b/i)) {
      indicators.push("ACADEMIC_CREDENTIALS");
    }

    // Check for publication indicators
    if ($("time[datetime], .published, .date").length > 0) {
      indicators.push("PUBLICATION_DATE");
    }

    if ($('.author, [rel="author"]').length > 0) {
      indicators.push("AUTHOR_ATTRIBUTION");
    }

    // Check for institutional affiliation
    if (
      domain.includes(".edu") ||
      domain.includes(".gov") ||
      domain.includes(".org")
    ) {
      indicators.push("INSTITUTIONAL_DOMAIN");
    }

    // Check for peer review indicators
    if (content.match(/peer.reviewed|reviewed.by|editorial.board/i)) {
      indicators.push("PEER_REVIEWED");
    }

    // Check for methodology disclosure
    if (content.match(/methodology|methods|study.design|data.collection/i)) {
      indicators.push("METHODOLOGY_DISCLOSED");
    }

    return indicators;
  }

  private calculate_credibility_score(
    content: string,
    $: any,
    domain: string,
    authority_indicators: string[]
  ): number {
    let score = 0.5; // Base score

    // Domain authority boost
    const domain_authority = this.get_domain_authority(domain);
    score += (domain_authority / 10) * 0.3;

    // Authority indicators boost
    score += authority_indicators.length * 0.05;

    // Content quality factors
    const word_count = content.split(/\s+/).length;
    if (word_count > 500) score += 0.1;
    if (word_count > 1500) score += 0.1;

    // Structure quality
    const heading_count = $("h1, h2, h3, h4, h5, h6").length;
    if (heading_count > 2) score += 0.05;

    const link_count = $("a[href]").length;
    if (link_count > 5) score += 0.05;

    // Reduce score for low-quality indicators
    if (content.includes("click here") || content.includes("subscribe now")) {
      score -= 0.1;
    }

    if ($(".ad, .advertisement, .sponsored").length > 0) {
      score -= 0.05;
    }

    return Math.max(0.1, Math.min(1.0, score));
  }

  private get_domain_authority(domain: string): number {
    // Use the same authority scoring as the search tool
    const authority_map: Record<string, number> = {
      "wikipedia.org": 9,
      "arxiv.org": 10,
      "nature.com": 10,
      "science.org": 10,
      "pubmed.ncbi.nlm.nih.gov": 10,
      "reuters.com": 8,
      "bbc.com": 8,
      "economist.com": 9,
      // Add more as needed
    };

    for (const [auth_domain, score] of Object.entries(authority_map)) {
      if (domain.includes(auth_domain)) {
        return score;
      }
    }

    if (domain.endsWith(".edu")) return 8;
    if (domain.endsWith(".gov")) return 8;
    if (domain.endsWith(".org")) return 6;

    return 5; // Default score
  }

  private classify_content_type($: any, title: string, domain: string): string {
    // More sophisticated content type classification
    if (
      domain.includes("arxiv.org") ||
      title.match(/\b(paper|study|research|journal)\b/i)
    ) {
      return "research_paper";
    }

    if (
      domain.includes("news") ||
      domain.includes("reuters") ||
      domain.includes("bbc")
    ) {
      return "news_article";
    }

    if ($("article").length > 0 || $("main").length > 0) {
      return "article";
    }

    if (title.match(/\b(blog|post)\b/i) || domain.includes("blog")) {
      return "blog_post";
    }

    if ($("nav, .navigation").length > 3 || $("a").length > 50) {
      return "portal_page";
    }

    return "web_page";
  }

  private detect_language(content: string): string {
    // Simple language detection based on common words
    const english_indicators = [
      "the",
      "and",
      "is",
      "in",
      "to",
      "of",
      "a",
      "that",
      "it",
      "with",
    ];
    const words = content.toLowerCase().split(/\s+/).slice(0, 100);

    const english_count = words.filter((word) =>
      english_indicators.includes(word)
    ).length;
    const english_ratio = english_count / Math.min(words.length, 100);

    return english_ratio > 0.1 ? "en" : "unknown";
  }

  // Batch scraping with concurrency control
  async scrape_multiple_urls(
    urls: string[],
    options: Partial<z.infer<typeof RealWebScraperInputSchema>> = {}
  ): Promise<RealScrapedContent[]> {
    const results: RealScrapedContent[] = [];
    const batch_size = 3; // Scrape 3 URLs concurrently

    log.info(`Starting batch scraping of ${urls.length} URLs`);

    for (let i = 0; i < urls.length; i += batch_size) {
      const batch = urls.slice(i, i + batch_size);

      const batch_promises = batch.map(async (url) => {
        try {
          const result = await this.scrape_url_real({
            url,
            extract_type: "readable",
            max_content_length: 20000,
            include_images: false,
            include_tables: true,
            timeout: 30,
            use_browser: false,
            wait_for_content: 1000,
            ...options,
          });
          return result;
        } catch (error) {
          log.warn(`Failed to scrape ${url}:`, error);
          return null;
        }
      });

      const batch_results = await Promise.all(batch_promises);
      results.push(
        ...(batch_results.filter((r) => r !== null) as RealScrapedContent[])
      );

      // Rate limiting: wait between batches
      if (i + batch_size < urls.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    log.info(
      `Batch scraping completed: ${results.length}/${urls.length} successful`
    );
    return results;
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      log.info("Browser instance closed");
    }
  }

  // Get robots.txt compliance
  private async check_robots_txt(url: string): Promise<boolean> {
    try {
      const base_url = new URL(url).origin;
      const robots_response = await axios.get(`${base_url}/robots.txt`, {
        timeout: 5000,
        headers: { "User-Agent": this.user_agent },
      });

      const robots_content = robots_response.data;

      // Simple robots.txt parsing (check for Disallow rules)
      const lines = robots_content.split("\n");
      let applies_to_us = false;
      let disallowed = false;

      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();

        if (trimmed.startsWith("user-agent:")) {
          const user_agent = trimmed.split(":")[1].trim();
          applies_to_us =
            user_agent === "*" ||
            this.user_agent.toLowerCase().includes(user_agent);
        }

        if (applies_to_us && trimmed.startsWith("disallow:")) {
          const path = trimmed.split(":")[1].trim();
          if (path === "/" || new URL(url).pathname.startsWith(path)) {
            disallowed = true;
            break;
          }
        }
      }

      return !disallowed;
    } catch {
      // If robots.txt is not accessible, assume scraping is allowed
      return true;
    }
  }

  // Smart content extraction for specific site types
  private async extract_structured_content($: any, url: string): Promise<any> {
    const domain = new URL(url).hostname;

    // Wikipedia-specific extraction
    if (domain.includes("wikipedia.org")) {
      return this.extract_wikipedia_content($);
    }

    // News site extraction
    if (domain.includes("reuters.com") || domain.includes("bbc.com")) {
      return this.extract_news_content($);
    }

    // Academic paper extraction
    if (domain.includes("arxiv.org") || domain.includes("nature.com")) {
      return this.extract_academic_content($);
    }

    return null;
  }

  private extract_wikipedia_content($: any): any {
    return {
      infobox: this.extract_wikipedia_infobox($),
      sections: this.extract_wikipedia_sections($),
      references: this.extract_wikipedia_references($),
    };
  }

  private extract_wikipedia_infobox($: any): Record<string, string> {
    const infobox: Record<string, string> = {};

    $(".infobox tr").each((_: any, row) => {
      const key = $(row).find("th").text().trim();
      const value = $(row).find("td").text().trim();
      if (key && value) {
        infobox[key] = value;
      }
    });

    return infobox;
  }

  private extract_wikipedia_sections(
    $: any
  ): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = [];

    $("h2, h3").each((_: any, heading) => {
      const title =
        $(heading).find(".mw-headline").text().trim() ||
        $(heading).text().trim();
      let content = "";

      // Get content until next heading
      $(heading)
        .nextUntil("h2, h3")
        .each((_: any, element: any) => {
          if ($(element).is("p")) {
            content += $(element).text().trim() + "\n\n";
          }
        });

      if (title && content.trim()) {
        sections.push({ title, content: content.trim() });
      }
    });

    return sections;
  }

  private extract_wikipedia_references($: any): string[] {
    const references: string[] = [];

    $('.reflist a[href^="http"], .references a[href^="http"]').each(
      (_: any, link) => {
        const href = $(link).attr("href");
        if (href) {
          references.push(href);
        }
      }
    );

    return [...new Set(references)];
  }

  private extract_news_content($: any): any {
    return {
      byline: $(".byline, .author").first().text().trim(),
      dateline: $(".dateline, .date, time").first().text().trim(),
      lead_paragraph: $("p").first().text().trim(),
      body_paragraphs: this.extract_paragraphs($),
    };
  }

  private extract_academic_content($: any): any {
    return {
      abstract: $(".abstract, #abstract").text().trim(),
      authors: $(".author, .authors")
        .map((_, el) => $(el).text().trim())
        .get(),
      doi: $('[href*="doi.org"]').attr("href") || "",
      publication_date:
        $('meta[name="citation_publication_date"]').attr("content") || "",
      journal: $('meta[name="citation_journal_title"]').attr("content") || "",
    };
  }

  private extract_readable_content($: any): string {
    // Remove unwanted elements
    $(
      "script, style, nav, header, footer, aside, .sidebar, .menu, .navigation, .ad, .advertisement, .popup, .social, .share, .comment"
    ).remove();

    // Try to find main content areas
    const content_selectors = [
      "main",
      "article",
      ".content",
      "#content",
      ".post-content",
      ".entry-content",
      ".article-content",
      ".main-content",
      ".page-content",
      ".text-content",
      '[role="main"]',
    ];

    let main_content = "";

    for (const selector of content_selectors) {
      const element = $(selector);
      if (element.length > 0) {
        main_content = element.text().trim();
        if (main_content.length > 500) {
          // Found substantial content
          break;
        }
      }
    }

    // Fallback to body content if no main content found
    if (!main_content || main_content.length < 200) {
      main_content = $("body").text().trim();
    }

    // Clean up the text
    return main_content
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/\n\s*\n/g, "\n\n") // Normalize line breaks
      .trim();
  }
}
