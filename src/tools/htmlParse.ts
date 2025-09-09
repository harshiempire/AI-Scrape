import * as cheerio from "cheerio";
import TurndownService from "turndown";

// --- Turndown Configuration ---
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

//💡 IMPROVEMENT #1: Keep link text instead of deleting it.
turndownService.addRule("stricterLink", {
  filter: (node, options) => {
    if (node.nodeName === "A" && node.getAttribute("href")) {
      const parent = node.parentNode;
      if (node.childNodes.length === 1 && node.firstChild?.nodeName === "IMG") {
        return true;
      }
      if (
        parent?.nodeName === "LI" &&
        ["NAV", "ASIDE"].includes(parent.parentNode?.parentNode?.nodeName ?? "")
      ) {
        return true;
      }
    }
    return false;
  },
  // The fix: return the content, not an empty string.
  replacement: (content) => content,
});

export interface ParsedPage {
  title?: string;
  canonical?: string;
  description?: string;
  publishDate?: string;
  author?: string;
  featuredImage?: string;
  markdownContent: string;
}

export function parseHtmlToMarkdown(html: string): ParsedPage {
  const $ = cheerio.load(html);

  const title = $("head > title").text().trim() || undefined;
  const description =
    $('meta[name="description"]').attr("content")?.trim() ?? undefined;
  const canonical =
    $('link[rel="canonical"]').attr("href")?.trim() ?? undefined;
  let author = $('meta[name="author"]').attr("content")?.trim() ?? undefined;
  const featuredImage =
    $('meta[property="og:image"]').attr("content")?.trim() ?? undefined;
  let publishDate =
    $('meta[property="article:published_time"]').attr("content")?.trim() ||
    $("time").attr("datetime")?.trim() ||
    undefined;

  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const jsonData = JSON.parse($(el).html() || "{}");
      // Prioritize existing data but fill in if missing
      publishDate = publishDate || jsonData.datePublished;
      author = author || jsonData.author?.name;
    } catch (e) {
      // 💡 IMPROVEMENT #3: Log errors instead of silently ignoring them.
      if (e instanceof Error) {
        console.warn(`Skipping malformed JSON-LD: ${e.message}`);
      }
    }
  });

  const contentSelectors = [
    "article",
    "main",
    ".post-content",
    ".entry-content",
    '[role="main"]',
    "#content",
  ];
  let $content = $(contentSelectors.join(", ")).first();

  if (!$content.length || $content.text().length < 200) {
    $content = $("body");
  }

  // 💡 IMPROVEMENT #2: Use a more robust list of selectors to remove.
  const selectorsToRemove = [
    "nav",
    "header",
    "footer",
    "aside",
    "form",
    "script",
    "style",
    '[aria-hidden="true"]',
    // Common IDs
    "#nav",
    "#navigation",
    "#header",
    "#footer",
    "#sidebar",
    "#comments",
    // Common class names
    ".nav",
    ".navbar",
    ".header",
    ".footer",
    ".sidebar",
    ".comments",
    ".related-posts",
    ".advertisement",
    ".cookie-banner",
    ".popup",
  ];
  $content.find(selectorsToRemove.join(", ")).remove();

  const htmlContent = $content.html();
  let markdownContent = "";

  if (htmlContent) {
    markdownContent = turndownService.turndown(htmlContent);
    // Clean up excessive newlines
    markdownContent = markdownContent.replace(/(\n\s*){3,}/g, "\n\n").trim();
  }

  return {
    title,
    canonical,
    description,
    publishDate,
    author,
    featuredImage,
    markdownContent,
  };
}
